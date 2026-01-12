import { Project } from '../models/Project';
import { researcherAgent } from './agents/researcher';
import { codeBuilderAgent } from './agents/codeBuilder';
import { summarizerAgent } from './agents/summarizer';
import { emitAgentUpdate, emitProjectStatus } from '../services/streaming';
import { calculateConfidence, generateSelfReflection } from '../services/confidence';
import logger from '../utils/logger';

export interface OrchestratorConfig {
  maxIterations?: number;
  confidenceThreshold?: number;
  streamingEnabled?: boolean;
}

export class AgentOrchestrator {
  private projectId: string;
  private config: OrchestratorConfig;

  constructor(projectId: string, config?: OrchestratorConfig) {
    this.projectId = projectId;
    this.config = {
      maxIterations: config?.maxIterations || 10,
      confidenceThreshold: config?.confidenceThreshold || 0.7,
      streamingEnabled: config?.streamingEnabled !== false
    };
  }

  async execute(): Promise<void> {
    try {
      const project = await Project.findById(this.projectId);
      if (!project) throw new Error('Project not found');

      logger.info(`Starting orchestration for project: ${this.projectId}`);

      await this.updateProjectStatus('running');

      // Execution phases
      await this.planningPhase(project);
      await this.researchPhase(project);
      await this.synthesisPhase(project);
      await this.buildPhase(project);
      await this.evaluationPhase(project);

      await this.updateProjectStatus('completed');
      logger.info(`Orchestration completed for project: ${this.projectId}`);

    } catch (error: any) {
      logger.error(`Orchestration error for project ${this.projectId}:`, error);
      await this.updateProjectStatus('failed');
      throw error;
    }
  }

  private async planningPhase(project: any): Promise<void> {
    logger.info(`Planning phase for project: ${this.projectId}`);

    project.state.currentPhase = 'planning';
    await project.save();

    this.emit('phase-update', { phase: 'planning', message: 'Breaking down project goal' });

    // Plan is implicit in the project goal and agents
    const tasks = project.agents.map((agent: any) => ({
      taskId: `task-${agent.name}`,
      description: `Execute ${agent.name} agent`,
      agent: agent.name,
      priority: 'high' as const,
      status: 'pending' as const
    }));

    project.state.taskQueue = tasks;
    await project.save();
  }

  private async researchPhase(project: any): Promise<void> {
    logger.info(`Research phase for project: ${this.projectId}`);

    project.state.currentPhase = 'research';
    await project.save();

    const researcherAgentConfig = project.agents.find((a: any) => a.name === 'researcher');
    if (!researcherAgentConfig) return;

    this.emit('phase-update', { phase: 'research', message: 'Researching and gathering information' });

    const result = await researcherAgent.execute(project.goal, {
      model: researcherAgentConfig.model
    });

    const confidence = calculateConfidence(result.output);
    const selfReflection = generateSelfReflection(confidence, 'research');

    await this.saveAgentOutput('researcher', result.output, confidence, selfReflection);

    project.state.decisions.research = result.output;
    await project.save();
  }

  private async synthesisPhase(project: any): Promise<void> {
    logger.info(`Synthesis phase for project: ${this.projectId}`);

    project.state.currentPhase = 'synthesis';
    await project.save();

    this.emit('phase-update', { phase: 'synthesis', message: 'Synthesizing research findings' });

    const researchFindings = project.state.decisions.research || '';

    const summarizerAgentConfig = project.agents.find((a: any) => a.name === 'summarizer');
    if (summarizerAgentConfig && researchFindings) {
      const result = await summarizerAgent.execute(researchFindings, {
        model: summarizerAgentConfig.model
      });

      const confidence = calculateConfidence(result.output);
      await this.saveAgentOutput('summarizer', result.output, confidence);

      project.state.decisions.synthesis = result.output;
      await project.save();
    }
  }

  private async buildPhase(project: any): Promise<void> {
    logger.info(`Build phase for project: ${this.projectId}`);

    project.state.currentPhase = 'build';
    await project.save();

    const codeBuilderAgentConfig = project.agents.find((a: any) => a.name === 'code-builder');
    if (!codeBuilderAgentConfig) return;

    this.emit('phase-update', { phase: 'build', message: 'Generating code and architecture' });

    const context = {
      goal: project.goal,
      research: project.state.decisions.research || '',
      synthesis: project.state.decisions.synthesis || ''
    };

    const result = await codeBuilderAgent.execute(context, {
      model: codeBuilderAgentConfig.model
    });

    const confidence = calculateConfidence(result.output);
    const selfReflection = generateSelfReflection(confidence, 'code generation');

    await this.saveAgentOutput('code-builder', result.output, confidence, selfReflection);

    project.state.decisions.build = result.output;
    project.analytics.successfulTasks += 1;
    await project.save();
  }

  private async evaluationPhase(project: any): Promise<void> {
    logger.info(`Evaluation phase for project: ${this.projectId}`);

    project.state.currentPhase = 'evaluation';
    await project.save();

    this.emit('phase-update', { phase: 'evaluation', message: 'Evaluating results' });

    // Calculate overall confidence
    const allAgents = project.agents;
    let totalConfidence = 0;
    let count = 0;

    allAgents.forEach((agent: any) => {
      agent.outputs.forEach((output: any) => {
        totalConfidence += output.confidence;
        count++;
      });
    });

    if (count > 0) {
      project.analytics.averageConfidence = totalConfidence / count;
    }

    await project.save();
  }

  private async saveAgentOutput(
    agentName: string,
    content: string,
    confidence: number,
    selfReflection?: string
  ): Promise<void> {
    const project = await Project.findById(this.projectId);
    if (!project) return;

    const agent = project.agents.find((a: any) => a.name === agentName);
    if (!agent) return;

    agent.outputs.push({
      timestamp: new Date(),
      agent: agentName,
      content,
      confidence,
      selfReflection,
      metadata: {}
    });

    agent.status = 'running';
    await project.save();

    this.emit('agent-update', {
      agent: agentName,
      content,
      confidence,
      selfReflection
    });
  }

  private async updateProjectStatus(status: string): Promise<void> {
    const project = await Project.findById(this.projectId);
    if (!project) return;

    project.status = status as any;

    if (status === 'running' && !project.startedAt) {
      project.startedAt = new Date();
    }

    if ((status === 'completed' || status === 'failed') && !project.completedAt) {
      project.completedAt = new Date();

      if (project.startedAt) {
        project.analytics.totalExecutionTime =
          project.completedAt.getTime() - project.startedAt.getTime();
      }
    }

    await project.save();

    this.emit('project-status', { status });
  }

  private emit(event: string, data: any): void {
    if (!this.config.streamingEnabled) return;

    emitAgentUpdate(
      this.projectId,
      event,
      JSON.stringify(data),
      0.5
    );
  }
}

export const runOrchestrator = async (projectId: string, config?: OrchestratorConfig): Promise<void> => {
  const orchestrator = new AgentOrchestrator(projectId, config);
  await orchestrator.execute();
};