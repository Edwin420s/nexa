import { Project, IProject, IAgentOutput } from '../models/Project';
import { getGeminiService } from '../services/gemini';
import { ConfidenceService } from '../services/confidence';
import { getStreamingService } from '../services/streaming';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

// Define custom events
export const OrchestratorEvents = {
  TASK_STARTED: 'task_started',
  TASK_COMPLETED: 'task_completed',
  TASK_FAILED: 'task_failed',
  AGENT_STARTED: 'agent_started',
  AGENT_COMPLETED: 'agent_completed',
  AGENT_OUTPUT: 'agent_output',
  PROJECT_UPDATED: 'project_updated'
} as const;

// Custom error classes
export class OrchestratorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'OrchestratorError';
  }
}

export class ValidationError extends OrchestratorError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AgentError extends OrchestratorError {
  constructor(message: string, details?: any) {
    super(message, 'AGENT_ERROR', details);
    this.name = 'AgentError';
  }
}

export interface AgentTask {
  agentName: string;
  prompt: string;
  model?: string;
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
}

export interface OrchestratorConfig {
  maxConcurrentAgents: number;
  confidenceThreshold: number;
  maxIterations: number;
  timeoutMs: number;
}

export class AgentOrchestrator extends EventEmitter {
  private config: OrchestratorConfig;
  private activeTasks: Map<string, { projectId: string; taskId: string; startTime: Date }> = new Map();
  private activeProjects: Map<string, boolean> = new Map();
  private taskQueue: Array<{ task: AgentTask; projectId: string; resolve: (value: any) => void; reject: (error: Error) => void }> = [];
  private isProcessingQueue = false;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    super();
    this.config = {
      maxConcurrentAgents: config.maxConcurrentAgents || 3,
      confidenceThreshold: Math.min(Math.max(config.confidenceThreshold || 0.7, 0.1), 1.0),
      maxIterations: Math.min(Math.max(config.maxIterations || 10, 1), 100),
      timeoutMs: Math.min(Math.max(config.timeoutMs || 300000, 60000), 1800000) // 1-30 minutes
    };

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Handle uncaught errors in event emitters
    this.on('error', (error) => {
      logger.error('Orchestrator error:', error);
    });
  }

  private validateTask(task: AgentTask) {
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

  async executeProject(projectId: string, tasks: AgentTask[] = []): Promise<void> {
    const taskId = uuidv4();
    const startTime = new Date();

    try {
      // Validate project ID
      if (!projectId || typeof projectId !== 'string') {
        throw new ValidationError('Valid project ID is required');
      }

      // Check if project is already being executed
      if (this.activeProjects.has(projectId)) {
        throw new OrchestratorError(
          `Project ${projectId} is already being executed`,
          'PROJECT_ALREADY_RUNNING'
        );
      }

      // Mark project as active
      this.activeProjects.set(projectId, true);
      this.activeTasks.set(taskId, { projectId, taskId, startTime });

      // Get project from database
      const project = await Project.findById(projectId);
      if (!project) {
        throw new OrchestratorError(
          `Project ${projectId} not found`,
          'PROJECT_NOT_FOUND'
        );
      }

      // Update project status and emit event
      project.status = 'running';
      project.startedAt = new Date();
      await project.save();

      this.emit(OrchestratorEvents.PROJECT_UPDATED, {
        projectId,
        status: 'running',
        startedAt: project.startedAt
      });

      // Process results
      // Note: In a real implementation, we would execute tasks here.
      // For now, we assume tasks are passed or generated elsewhere, or we use the existing logic if available.
      // The original code had `results` variable which was undefined in this block.
      // I will add the task generation logic back from the conflicted file if it was there.
      // Looking at the conflict, `generateTasksFromProject` was used.

      const generatedTasks = this.generateTasksFromProject(project);
      const results = await this.executeAgentTasks(projectId, generatedTasks);

      await this.processResults(projectId, results);

      // Update project status
      const streamingService = getStreamingService();
      await streamingService.streamProjectStatus(projectId, 'completed', 'Project execution completed');

      logger.info(`Project ${projectId} executed successfully`);

    } catch (error) {
      const streamingService = getStreamingService();
      logger.error(`Error executing project ${projectId}:`, error);
      await streamingService.streamProjectStatus(projectId, 'failed', (error as Error).message);
      throw error;
    } finally {
      this.activeProjects.delete(projectId);
    }
  }

  private generateTasksFromProject(project: IProject): AgentTask[] {
    const tasks: AgentTask[] = [];

    // Generate tasks for each agent in the project
    for (const agentConfig of project.agents) {
      const task: AgentTask = {
        agentName: agentConfig.name,
        prompt: this.generateAgentPrompt(agentConfig.name, project.goal),
        model: agentConfig.model,
        tools: this.getAgentTools(agentConfig.name)
      };
      tasks.push(task);
    }

    return tasks;
  }

  private generateAgentPrompt(agentName: string, projectGoal: string): string {
    const prompts: Record<string, string> = {
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

  private getAgentTools(agentName: string): Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }> {
    const tools: Record<string, Array<any>> = {
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

  private async executeAgentTasks(projectId: string, tasks: AgentTask[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    const geminiService = getGeminiService();
    const streamingService = getStreamingService();

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
            output = await geminiService.generateWithTools(
              task.prompt,
              task.tools,
              { model: task.model }
            );
          } else {
            output = await geminiService.generateContent(task.prompt, {
              model: task.model
            });
          }

          const executionTime = Date.now() - startTime;

          // Add self-reflection
          const selfReflection = ConfidenceService.generateSelfReflection(
            output.content,
            output.confidence
          );

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

        } catch (error) {
          logger.error(`Error executing agent ${task.agentName}:`, error);

          await streamingService.streamAgentUpdate(projectId, task.agentName, {
            status: 'failed',
            error: (error as Error).message
          });

          throw error;
        }
      });

      executingTasks.push(...batchPromises);
    }

    await Promise.all(executingTasks);
    return results;
  }

  private async processResults(projectId: string, results: Record<string, any>): Promise<void> {
    const project = await Project.findById(projectId);
    if (!project) return;

    // Calculate overall confidence
    const confidences = Object.values(results)
      .map((r: any) => r.confidence)
      .filter((c): c is number => typeof c === 'number');

    const averageConfidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0.5;

    // Generate files from results
    const files = this.generateFilesFromResults(results);

    // Update project
    await Project.findByIdAndUpdate(projectId, {
      $set: {
        'analytics.confidenceScore': averageConfidence,
        'analytics.executionTime': Object.values(results)
          .reduce((total: number, r: any) => total + (r.executionTime || 0), 0),
        'analytics.tokensUsed': Object.values(results)
          .reduce((total: number, r: any) => total + (r.tokensUsed || 0), 0),
        files
      }
    });

    // Stream file updates
    const streamingService = getStreamingService();
    for (const file of files) {
      await streamingService.streamFileGenerated(projectId, file);
    }
  }

  private generateFilesFromResults(results: Record<string, any>): any[] {
    const files: any[] = [];

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

  async pauseProject(projectId: string): Promise<void> {
    // Implementation for pausing project execution
    logger.info(`Project ${projectId} paused`);
  }

  async resumeProject(projectId: string): Promise<void> {
    // Implementation for resuming project execution
    logger.info(`Project ${projectId} resumed`);
  }

  async cancelProject(projectId: string): Promise<void> {
    this.activeProjects.delete(projectId);
    logger.info(`Project ${projectId} cancelled`);
  }

  isProjectActive(projectId: string): boolean {
    return this.activeProjects.has(projectId);
  }
}

// Singleton instance
let orchestratorInstance: AgentOrchestrator;

export function getAgentOrchestrator(): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator();
  }
  return orchestratorInstance;
}