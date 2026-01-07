import Queue from 'bull';
import IORedis from 'ioredis';
import { getAgentOrchestrator } from '../agent-orchestrator/orchestrator';
import { Project } from '../models/Project';
import { Analytics } from '../models/Analytics';
import logger from '../utils/logger';

export interface JobData {
  projectId: string;
  userId: string;
  type: 'project_execution' | 'agent_task' | 'file_generation';
  data: Record<string, any>;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

export class JobQueue {
  private projectQueue: Queue;
  private agentQueue: Queue;
  private redisClient: IORedis;

  constructor() {
    // Create Redis connection
    this.redisClient = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    });

    // Initialize queues
    this.projectQueue = new Queue('project-execution', {
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

    this.agentQueue = new Queue('agent-tasks', {
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

  private setupQueueProcessors(): void {
    // Process project execution jobs
    this.projectQueue.process('project-execution', async (job) => {
      const startTime = Date.now();
      const { projectId, userId } = job.data;
      
      try {
        logger.info(`Processing project execution job: ${job.id}, project: ${projectId}`);
        
        // Update project status
        await Project.findByIdAndUpdate(projectId, {
          status: 'running',
          startedAt: new Date()
        });

        // Execute project
        const orchestrator = getAgentOrchestrator();
        await orchestrator.executeProject(projectId);

        const executionTime = Date.now() - startTime;
        
        // Log analytics
        await Analytics.create({
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
      } catch (error) {
        const executionTime = Date.now() - startTime;
        
        // Update project status to failed
        await Project.findByIdAndUpdate(projectId, {
          status: 'failed',
          completedAt: new Date()
        });

        // Log error analytics
        await Analytics.create({
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
            error: (error as Error).message,
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
        logger.info(`Processing agent task job: ${job.id}, agent: ${agentName}`);
        
        // Import agent manager
        const { agentManager } = await import('../agent-orchestrator');
        
        // Execute agent
        const result = await agentManager.executeAgent(agentName, input);
        const executionTime = Date.now() - startTime;

        // Log analytics if projectId is provided
        if (projectId) {
          await Analytics.create({
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
      } catch (error) {
        const executionTime = Date.now() - startTime;
        
        // Log error analytics
        if (projectId) {
          await Analytics.create({
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
              error: (error as Error).message,
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
        logger.info(`Processing file generation job: ${job.id}, file: ${fileName}`);
        
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
          await Project.findByIdAndUpdate(projectId, {
            $push: { files: file }
          });

          await Analytics.create({
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
      } catch (error) {
        const executionTime = Date.now() - startTime;
        
        if (projectId) {
          await Analytics.create({
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
              error: (error as Error).message,
              fileName
            }
          });
        }

        throw error;
      }
    });
  }

  private setupQueueEvents(): void {
    // Project queue events
    this.projectQueue.on('completed', (job, result) => {
      logger.info(`Project execution job ${job.id} completed`, {
        jobId: job.id,
        result: result.success,
        executionTime: result.executionTime
      });
    });

    this.projectQueue.on('failed', (job, error) => {
      logger.error(`Project execution job ${job.id} failed`, {
        jobId: job.id,
        error: error.message,
        attempts: job.attemptsMade
      });
    });

    this.projectQueue.on('stalled', (job) => {
      logger.warn(`Project execution job ${job.id} stalled`);
    });

    // Agent queue events
    this.agentQueue.on('completed', (job, result) => {
      logger.info(`Agent task job ${job.id} completed`, {
        jobId: job.id,
        agent: job.data.agentName,
        success: result.success,
        executionTime: result.executionTime
      });
    });

    this.agentQueue.on('failed', (job, error) => {
      logger.error(`Agent task job ${job.id} failed`, {
        jobId: job.id,
        agent: job.data.agentName,
        error: error.message
      });
    });

    // Global queue events
    this.projectQueue.on('error', (error) => {
      logger.error('Project queue error:', error);
    });

    this.agentQueue.on('error', (error) => {
      logger.error('Agent queue error:', error);
    });
  }

  async addProjectExecution(projectId: string, userId: string): Promise<Queue.Job> {
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

  async addAgentTask(
    agentName: string,
    input: any,
    userId: string,
    projectId?: string
  ): Promise<Queue.Job> {
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

  async addFileGeneration(
    content: string,
    fileName: string,
    userId: string,
    projectId?: string,
    type?: string
  ): Promise<Queue.Job> {
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

  async getJobStatus(jobId: string): Promise<any> {
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

  async getQueueStats(): Promise<any> {
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

  async cleanupOldJobs(daysToKeep: number = 7): Promise<void> {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    // Clean completed jobs
    await this.projectQueue.clean(cutoffDate, 1000, 'completed');
    await this.agentQueue.clean(cutoffDate, 1000, 'completed');
    
    // Clean failed jobs (keep fewer)
    await this.projectQueue.clean(cutoffDate, 100, 'failed');
    await this.agentQueue.clean(cutoffDate, 100, 'failed');
    
    logger.info(`Cleaned up jobs older than ${daysToKeep} days`);
  }

  async pause(): Promise<void> {
    await this.projectQueue.pause();
    await this.agentQueue.pause();
    logger.info('All queues paused');
  }

  async resume(): Promise<void> {
    await this.projectQueue.resume();
    await this.agentQueue.resume();
    logger.info('All queues resumed');
  }

  async shutdown(): Promise<void> {
    // Close queues gracefully
    await this.projectQueue.close();
    await this.agentQueue.close();
    await this.redisClient.quit();
    logger.info('Queues shutdown completed');
  }
}

// Singleton instance
let jobQueueInstance: JobQueue;

export function getJobQueue(): JobQueue {
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