"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentOrchestrator = exports.AgentError = exports.ValidationError = exports.OrchestratorError = exports.OrchestratorEvents = void 0;
const Project_1 = require("../models/Project");
const gemini_1 = require("../services/gemini");
const confidence_1 = require("../services/confidence");
const streaming_1 = require("../services/streaming");
const logger_1 = __importDefault(require("../utils/logger"));
const uuid_1 = require("uuid");
const events_1 = require("events");
// Define custom events
exports.OrchestratorEvents = {
    TASK_STARTED: 'task_started',
    TASK_COMPLETED: 'task_completed',
    TASK_FAILED: 'task_failed',
    AGENT_STARTED: 'agent_started',
    AGENT_COMPLETED: 'agent_completed',
    AGENT_OUTPUT: 'agent_output',
    PROJECT_UPDATED: 'project_updated'
};
// Custom error classes
class OrchestratorError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'OrchestratorError';
    }
}
exports.OrchestratorError = OrchestratorError;
class ValidationError extends OrchestratorError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class AgentError extends OrchestratorError {
    constructor(message, details) {
        super(message, 'AGENT_ERROR', details);
        this.name = 'AgentError';
    }
}
exports.AgentError = AgentError;
class AgentOrchestrator {
    constructor() {
        this.config = {
            maxConcurrentAgents: 3,
            confidenceThreshold: 0.7,
            maxIterations: 10,
            timeoutMs: 300000 // 5 minutes
        };
        this.activeProjects = new Map();
    }
    async executeProject(projectId) {
        if (this.activeProjects.has(projectId)) {
            throw new Error(`Project ${projectId} is already being executed`);
        }
        this.activeProjects.set(projectId, true);
        const streamingService = (0, streaming_1.getStreamingService)();
        try {
            // Get project
            const project = await Project_1.Project.findById(projectId);
            if (!project) {
                throw new Error(`Project ${projectId} not found`);
            }
            // Update project status
            await streamingService.streamProjectStatus(projectId, 'running', 'Starting agent execution');
            // Execute agents based on project configuration
            const tasks = this.generateTasksFromProject(project);
            const results = await this.executeAgentTasks(projectId, tasks);
            export class AgentOrchestrator extends events_1.EventEmitter {
                constructor(config = {}) {
                    super();
                    this.activeTasks = new Map();
                    this.activeProjects = new Map();
                    this.taskQueue = [];
                    this.isProcessingQueue = false;
                    this.config = {
                        maxConcurrentAgents: config.maxConcurrentAgents || 3,
                        confidenceThreshold: Math.min(Math.max(config.confidenceThreshold || 0.7, 0.1), 1.0),
                        maxIterations: Math.min(Math.max(config.maxIterations || 10, 1), 100),
                        timeoutMs: Math.min(Math.max(config.timeoutMs || 300000, 60000), 1800000) // 1-30 minutes
                    };
                    // Set up event listeners
                    this.setupEventListeners();
                }
                setupEventListeners() {
                    // Handle uncaught errors in event emitters
                    this.on('error', (error) => {
                        logger_1.default.error('Orchestrator error:', error);
                    });
                }
                validateTask(task) {
                    if (!task.agentName || typeof task.agentName !== 'string') {
                        throw new ValidationError('Agent name is required and must be a string');
                    }
                    if (!task.prompt || typeof task.prompt !== 'string') {
                        throw new ValidationError('Prompt is required and must be a string');
                    }
                    if (task.model && typeof task.model !== 'string') {
                        throw new ValidationError('Model must be a string if provided');
                    }
                    if (task.tools && !Array.isArray(task.tools)) {
                        throw new ValidationError('Tools must be an array if provided');
                    }
                }
                async executeProject(projectId, tasks = []) {
                    const taskId = (0, uuid_1.v4)();
                    const startTime = new Date();
                    try {
                        // Validate project ID
                        if (!projectId || typeof projectId !== 'string') {
                            throw new ValidationError('Valid project ID is required');
                        }
                        // Check if project is already being executed
                        if (this.activeProjects.has(projectId)) {
                            throw new OrchestratorError(`Project ${projectId} is already being executed`, 'PROJECT_ALREADY_RUNNING');
                        }
                        // Mark project as active
                        this.activeProjects.set(projectId, true);
                        this.activeTasks.set(taskId, { projectId, taskId, startTime });
                        // Get project from database
                        const project = await Project_1.Project.findById(projectId);
                        if (!project) {
                            throw new OrchestratorError(`Project ${projectId} not found`, 'PROJECT_NOT_FOUND');
                        }
                        // Update project status and emit event
                        project.status = 'running';
                        project.startedAt = new Date();
                        await project.save();
                        this.emit(exports.OrchestratorEvents.PROJECT_UPDATED, {
                            projectId,
                            status: 'running',
                            startedAt: project.startedAt
                        });
                        await this.processResults(projectId, results);
                        // Update project status
                        await streamingService.streamProjectStatus(projectId, 'completed', 'Project execution completed');
                        logger_1.default.info(`Project ${projectId} executed successfully`);
                    }
                    catch (error) {
                        logger_1.default.error(`Error executing project ${projectId}:`, error);
                        await streamingService.streamProjectStatus(projectId, 'failed', error.message);
                        throw error;
                    }
                    finally {
                        this.activeProjects.delete(projectId);
                    }
                }
                generateTasksFromProject(project) {
                    const tasks = [];
                    // Generate tasks for each agent in the project
                    for (const agentConfig of project.agents) {
                        const task = {
                            agentName: agentConfig.name,
                            prompt: this.generateAgentPrompt(agentConfig.name, project.goal),
                            model: agentConfig.model,
                            tools: this.getAgentTools(agentConfig.name)
                        };
                        tasks.push(task);
                    }
                    return tasks;
                }
                generateAgentPrompt(agentName, projectGoal) {
                    const prompts = {
                        researcher: `Research the following topic: "${projectGoal}"
      
      Please provide:
      1. Comprehensive analysis
      2. Key findings
      3. Relevant sources and references
      4. Potential applications
      
      Format your response in a structured manner.`,
                        'code-builder': `Based on the project goal: "${projectGoal}"
      
      Generate:
      1. Architecture diagram description
      2. Core implementation code
      3. Configuration files
      4. Dependencies and setup instructions
      
      Provide production-ready code with proper error handling.`,
                        summarizer: `Summarize the following project: "${projectGoal}"
      
      Create:
      1. Executive summary
      2. Technical overview
      3. Key components
      4. Implementation roadmap
      
      Keep the summary concise but comprehensive.`,
                        'visual-generator': `Create visual assets for: "${projectGoal}"
      
      Generate:
      1. System architecture diagram
      2. Data flow diagrams
      3. User interface mockups if applicable
      4. Branding elements
      
      Describe visual elements in detail.`
                    };
                    return prompts[agentName] || `Execute task for: ${projectGoal}`;
                }
                getAgentTools(agentName) {
                    const tools = {
                        researcher: [
                            {
                                name: 'search_web',
                                description: 'Search the web for information',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        query: { type: 'string' },
                                        maxResults: { type: 'number', default: 5 }
                                    },
                                    required: ['query']
                                }
                            },
                            {
                                name: 'analyze_documents',
                                description: 'Analyze uploaded documents',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        documentIds: { type: 'array', items: { type: 'string' } }
                                    },
                                    required: ['documentIds']
                                }
                            }
                        ],
                        'code-builder': [
                            {
                                name: 'generate_code',
                                description: 'Generate code in specified language',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        language: { type: 'string' },
                                        functionality: { type: 'string' },
                                        framework: { type: 'string', optional: true }
                                    },
                                    required: ['language', 'functionality']
                                }
                            },
                            {
                                name: 'create_test',
                                description: 'Create tests for generated code',
                                parameters: {
                                    type: 'object',
                                    properties: {
                                        code: { type: 'string' },
                                        testFramework: { type: 'string', default: 'jest' }
                                    },
                                    required: ['code']
                                }
                            }
                        ]
                    };
                    return tools[agentName] || [];
                }
                async executeAgentTasks(projectId, tasks) {
                    const results = {};
                    const geminiService = (0, gemini_1.getGeminiService)();
                    const streamingService = (0, streaming_1.getStreamingService)();
                    // Execute tasks concurrently with limits
                    const executingTasks = [];
                    for (let i = 0; i < tasks.length; i += this.config.maxConcurrentAgents) {
                        const batch = tasks.slice(i, i + this.config.maxConcurrentAgents);
                        const batchPromises = batch.map(async (task) => {
                            try {
                                // Update agent status
                                await streamingService.streamAgentUpdate(projectId, task.agentName, {
                                    status: 'running',
                                    message: 'Starting execution...'
                                });
                                // Execute agent
                                const startTime = Date.now();
                                let output;
                                if (task.tools && task.tools.length > 0) {
                                    output = await geminiService.generateWithTools(task.prompt, task.tools, { model: task.model });
                                }
                                else {
                                    output = await geminiService.generateContent(task.prompt, {
                                        model: task.model
                                    });
                                }
                                const executionTime = Date.now() - startTime;
                                // Add self-reflection
                                const selfReflection = confidence_1.ConfidenceService.generateSelfReflection(output.content, output.confidence);
                                const result = {
                                    ...output,
                                    executionTime,
                                    selfReflection,
                                    agentName: task.agentName,
                                    timestamp: new Date().toISOString()
                                };
                                // Stream update
                                await streamingService.streamAgentUpdate(projectId, task.agentName, result);
                                // Update confidence
                                await streamingService.streamConfidenceUpdate(projectId, output.confidence);
                                results[task.agentName] = result;
                                return result;
                            }
                            catch (error) {
                                logger_1.default.error(`Error executing agent ${task.agentName}:`, error);
                                await streamingService.streamAgentUpdate(projectId, task.agentName, {
                                    status: 'failed',
                                    error: error.message
                                });
                                throw error;
                            }
                        });
                        executingTasks.push(...batchPromises);
                    }
                    await Promise.all(executingTasks);
                    return results;
                }
                async processResults(projectId, results) {
                    const project = await Project_1.Project.findById(projectId);
                    if (!project)
                        return;
                    // Calculate overall confidence
                    const confidences = Object.values(results)
                        .map((r) => r.confidence)
                        .filter((c) => typeof c === 'number');
                    const averageConfidence = confidences.length > 0
                        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
                        : 0.5;
                    // Generate files from results
                    const files = this.generateFilesFromResults(results);
                    // Update project
                    await Project_1.Project.findByIdAndUpdate(projectId, {
                        $set: {
                            'analytics.confidenceScore': averageConfidence,
                            'analytics.executionTime': Object.values(results)
                                .reduce((total, r) => total + (r.executionTime || 0), 0),
                            'analytics.tokensUsed': Object.values(results)
                                .reduce((total, r) => total + (r.tokensUsed || 0), 0),
                            files
                        }
                    });
                    // Stream file updates
                    const streamingService = (0, streaming_1.getStreamingService)();
                    for (const file of files) {
                        await streamingService.streamFileGenerated(projectId, file);
                    }
                }
                generateFilesFromResults(results) {
                    const files = [];
                    for (const [agentName, result] of Object.entries(results)) {
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        switch (agentName) {
                            case 'researcher':
                                files.push({
                                    name: `research-report-${timestamp}.md`,
                                    path: `/reports/research-${timestamp}.md`,
                                    type: 'text/markdown',
                                    size: Buffer.byteLength(result.content, 'utf8'),
                                    content: result.content
                                });
                                break;
                            case 'code-builder':
                                files.push({
                                    name: `code-implementation-${timestamp}.js`,
                                    path: `/code/implementation-${timestamp}.js`,
                                    type: 'application/javascript',
                                    size: Buffer.byteLength(result.content, 'utf8'),
                                    content: result.content
                                });
                                break;
                            case 'summarizer':
                                files.push({
                                    name: `executive-summary-${timestamp}.md`,
                                    path: `/summaries/summary-${timestamp}.md`,
                                    type: 'text/markdown',
                                    size: Buffer.byteLength(result.content, 'utf8'),
                                    content: result.content
                                });
                                break;
                            case 'visual-generator':
                                files.push({
                                    name: `architecture-diagram-${timestamp}.txt`,
                                    path: `/diagrams/architecture-${timestamp}.txt`,
                                    type: 'text/plain',
                                    size: Buffer.byteLength(result.content, 'utf8'),
                                    content: result.content
                                });
                                break;
                        }
                    }
                    return files;
                }
                async pauseProject(projectId) {
                    // Implementation for pausing project execution
                    logger_1.default.info(`Project ${projectId} paused`);
                }
                async resumeProject(projectId) {
                    // Implementation for resuming project execution
                    logger_1.default.info(`Project ${projectId} resumed`);
                }
                async cancelProject(projectId) {
                    this.activeProjects.delete(projectId);
                    logger_1.default.info(`Project ${projectId} cancelled`);
                }
                isProjectActive(projectId) {
                    return this.activeProjects.has(projectId);
                }
            }
            // Singleton instance
            let orchestratorInstance;
            export function getAgentOrchestrator() {
                if (!orchestratorInstance) {
                    orchestratorInstance = new AgentOrchestrator();
                }
                return orchestratorInstance;
            }
        }
        finally { }
    }
}
exports.AgentOrchestrator = AgentOrchestrator;
