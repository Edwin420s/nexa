"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobQueue = void 0;
exports.getJobQueue = getJobQueue;
const bull_1 = __importDefault(require("bull"));
const ioredis_1 = __importDefault(require("ioredis"));
const orchestrator_1 = require("../agent-orchestrator/orchestrator");
const Project_1 = require("../models/Project");
const Analytics_1 = require("../models/Analytics");
const logger_1 = __importDefault(require("../utils/logger"));
class JobQueue {
    constructor() {
        // Create Redis connection
        this.redisClient = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: null,
            enableReadyCheck: false
        });
        // Initialize queues
        this.projectQueue = new bull_1.default('project-execution', {
            redis: this.redisClient,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000
                },
                removeOnComplete: 100, // Keep last 100 completed jobs
                removeOnFail: 50 // Keep last 50 failed jobs
            }
        });
        this.agentQueue = new bull_1.default('agent-tasks', {
            redis: this.redisClient,
            defaultJobOptions: {
                attempts: 2,
                timeout: 300000, // 5 minutes
                removeOnComplete: true
            }
        });
        this.setupQueueProcessors();
        this.setupQueueEvents();
    }
    setupQueueProcessors() {
        // Process project execution jobs
        this.projectQueue.process('project-execution', async (job) => {
            const startTime = Date.now();
            const { projectId, userId } = job.data;
            try {
                logger_1.default.info(`Processing project execution job: ${job.id}, project: ${projectId}`);
                // Update project status
                await Project_1.Project.findByIdAndUpdate(projectId, {
                    status: 'running',
                    startedAt: new Date()
                });
                // Execute project
                const orchestrator = (0, orchestrator_1.getAgentOrchestrator)();
                await orchestrator.executeProject(projectId);
                const executionTime = Date.now() - startTime;
                // Log analytics
                await Analytics_1.Analytics.create({
                    user: userId,
                    project: projectId,
                    agent: 'orchestrator',
                    action: 'project_complete',
                    metrics: {
                        executionTime,
                        confidence: 1
                    },
                    metadata: {
                        jobId: job.id,
                        queue: 'project-execution'
                    }
                });
                return {
                    success: true,
                    executionTime,
                    projectId
                };
            }
            catch (error) {
                const executionTime = Date.now() - startTime;
                // Update project status to failed
                await Project_1.Project.findByIdAndUpdate(projectId, {
                    status: 'failed',
                    completedAt: new Date()
                });
                // Log error analytics
                await Analytics_1.Analytics.create({
                    user: userId,
                    project: projectId,
                    agent: 'orchestrator',
                    action: 'project_failed',
                    metrics: {
                        executionTime,
                        confidence: 0
                    },
                    metadata: {
                        jobId: job.id,
                        error: error.message,
                        queue: 'project-execution'
                    }
                });
                throw error;
            }
        });
        // Process agent tasks
        this.agentQueue.process('agent-task', async (job) => {
            const startTime = Date.now();
            const { agentName, input, userId, projectId } = job.data;
            try {
                logger_1.default.info(`Processing agent task job: ${job.id}, agent: ${agentName}`);
                // Import agent manager
                const { agentManager } = await Promise.resolve().then(() => __importStar(require('../agent-orchestrator')));
                // Execute agent
                const result = await agentManager.executeAgent(agentName, input);
                const executionTime = Date.now() - startTime;
                // Log analytics if projectId is provided
                if (projectId) {
                    await Analytics_1.Analytics.create({
                        user: userId,
                        project: projectId,
                        agent: agentName,
                        action: 'agent_execution',
                        metrics: {
                            confidence: result.confidence || 0.5,
                            executionTime,
                            tokensUsed: result.metadata?.tokensUsed || 0
                        },
                        metadata: {
                            jobId: job.id,
                            queue: 'agent-tasks'
                        }
                    });
                }
                return {
                    success: true,
                    data: result,
                    executionTime
                };
            }
            catch (error) {
                const executionTime = Date.now() - startTime;
                // Log error analytics
                if (projectId) {
                    await Analytics_1.Analytics.create({
                        user: userId,
                        project: projectId,
                        agent: agentName,
                        action: 'agent_failed',
                        metrics: {
                            executionTime,
                            confidence: 0
                        },
                        metadata: {
                            jobId: job.id,
                            error: error.message,
                            queue: 'agent-tasks'
                        }
                    });
                }
                throw error;
            }
        });
        // Process file generation
        this.agentQueue.process('file-generation', async (job) => {
            const startTime = Date.now();
            const { content, fileName, type, userId, projectId } = job.data;
            try {
                logger_1.default.info(`Processing file generation job: ${job.id}, file: ${fileName}`);
                // Generate file (this is a simplified example)
                const file = {
                    name: fileName,
                    content: content,
                    type: type || 'text',
                    size: Buffer.byteLength(content, 'utf8'),
                    generatedAt: new Date()
                };
                const executionTime = Date.now() - startTime;
                // Update project with generated file
                if (projectId) {
                    await Project_1.Project.findByIdAndUpdate(projectId, {
                        $push: { files: file }
                    });
                    await Analytics_1.Analytics.create({
                        user: userId,
                        project: projectId,
                        agent: 'file-generator',
                        action: 'file_generated',
                        metrics: {
                            executionTime,
                            confidence: 1
                        },
                        metadata: {
                            jobId: job.id,
                            fileName,
                            fileSize: file.size
                        }
                    });
                }
                return {
                    success: true,
                    data: file,
                    executionTime
                };
            }
            catch (error) {
                const executionTime = Date.now() - startTime;
                if (projectId) {
                    await Analytics_1.Analytics.create({
                        user: userId,
                        project: projectId,
                        agent: 'file-generator',
                        action: 'file_generation_failed',
                        metrics: {
                            executionTime,
                            confidence: 0
                        },
                        metadata: {
                            jobId: job.id,
                            error: error.message,
                            fileName
                        }
                    });
                }
                throw error;
            }
        });
    }
    setupQueueEvents() {
        // Project queue events
        this.projectQueue.on('completed', (job, result) => {
            logger_1.default.info(`Project execution job ${job.id} completed`, {
                jobId: job.id,
                result: result.success,
                executionTime: result.executionTime
            });
        });
        this.projectQueue.on('failed', (job, error) => {
            logger_1.default.error(`Project execution job ${job.id} failed`, {
                jobId: job.id,
                error: error.message,
                attempts: job.attemptsMade
            });
        });
        this.projectQueue.on('stalled', (job) => {
            logger_1.default.warn(`Project execution job ${job.id} stalled`);
        });
        // Agent queue events
        this.agentQueue.on('completed', (job, result) => {
            logger_1.default.info(`Agent task job ${job.id} completed`, {
                jobId: job.id,
                agent: job.data.agentName,
                success: result.success,
                executionTime: result.executionTime
            });
        });
        this.agentQueue.on('failed', (job, error) => {
            logger_1.default.error(`Agent task job ${job.id} failed`, {
                jobId: job.id,
                agent: job.data.agentName,
                error: error.message
            });
        });
        // Global queue events
        this.projectQueue.on('error', (error) => {
            logger_1.default.error('Project queue error:', error);
        });
        this.agentQueue.on('error', (error) => {
            logger_1.default.error('Agent queue error:', error);
        });
    }
    async addProjectExecution(projectId, userId) {
        return this.projectQueue.add('project-execution', {
            projectId,
            userId,
            type: 'project_execution',
            data: { timestamp: new Date().toISOString() }
        }, {
            jobId: `project-${projectId}-${Date.now()}`,
            priority: 1 // Higher priority for project execution
        });
    }
    async addAgentTask(agentName, input, userId, projectId) {
        return this.agentQueue.add('agent-task', {
            agentName,
            input,
            userId,
            projectId,
            type: 'agent_task',
            data: { timestamp: new Date().toISOString() }
        }, {
            jobId: `agent-${agentName}-${Date.now()}`,
            priority: projectId ? 2 : 3 // Lower priority for standalone agent tasks
        });
    }
    async addFileGeneration(content, fileName, userId, projectId, type) {
        return this.agentQueue.add('file-generation', {
            content,
            fileName,
            type,
            userId,
            projectId,
            data: { timestamp: new Date().toISOString() }
        }, {
            jobId: `file-${Date.now()}`,
            priority: 3
        });
    }
    async getJobStatus(jobId) {
        // Check project queue
        let job = await this.projectQueue.getJob(jobId);
        if (job) {
            return {
                queue: 'project-execution',
                id: job.id,
                data: job.data,
                state: await job.getState(),
                progress: job.progress(),
                attempts: job.attemptsMade,
                timestamp: job.timestamp
            };
        }
        // Check agent queue
        job = await this.agentQueue.getJob(jobId);
        if (job) {
            return {
                queue: 'agent-tasks',
                id: job.id,
                data: job.data,
                state: await job.getState(),
                progress: job.progress(),
                attempts: job.attemptsMade,
                timestamp: job.timestamp
            };
        }
        return null;
    }
    async getQueueStats() {
        const [projectStats, agentStats] = await Promise.all([
            this.projectQueue.getJobCounts(),
            this.agentQueue.getJobCounts()
        ]);
        return {
            projectQueue: {
                ...projectStats,
                name: 'project-execution'
            },
            agentQueue: {
                ...agentStats,
                name: 'agent-tasks'
            },
            timestamp: new Date().toISOString()
        };
    }
    async cleanupOldJobs(daysToKeep = 7) {
        const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
        // Clean completed jobs
        await this.projectQueue.clean(cutoffDate, 1000, 'completed');
        await this.agentQueue.clean(cutoffDate, 1000, 'completed');
        // Clean failed jobs (keep fewer)
        await this.projectQueue.clean(cutoffDate, 100, 'failed');
        await this.agentQueue.clean(cutoffDate, 100, 'failed');
        logger_1.default.info(`Cleaned up jobs older than ${daysToKeep} days`);
    }
    async pause() {
        await this.projectQueue.pause();
        await this.agentQueue.pause();
        logger_1.default.info('All queues paused');
    }
    async resume() {
        await this.projectQueue.resume();
        await this.agentQueue.resume();
        logger_1.default.info('All queues resumed');
    }
    async shutdown() {
        // Close queues gracefully
        await this.projectQueue.close();
        await this.agentQueue.close();
        await this.redisClient.quit();
        logger_1.default.info('Queues shutdown completed');
    }
}
exports.JobQueue = JobQueue;
// Singleton instance
let jobQueueInstance;
function getJobQueue() {
    if (!jobQueueInstance) {
        jobQueueInstance = new JobQueue();
    }
    return jobQueueInstance;
}
// Graceful shutdown handler
process.on('SIGTERM', async () => {
    if (jobQueueInstance) {
        await jobQueueInstance.shutdown();
    }
});
