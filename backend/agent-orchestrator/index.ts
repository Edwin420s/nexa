export * from './orchestrator';
export * from './agents/researcher';
export * from './agents/code-builder';
export * from './agents/summarizer';
export * from './agents/visual-generator';

import { AgentOrchestrator, getAgentOrchestrator } from './orchestrator';
import { researchAgent } from './agents/researcher';
import { codeBuilderAgent } from './agents/code-builder';
import { summarizerAgent } from './agents/summarizer';
import { visualGeneratorAgent } from './agents/visual-generator';

export class AgentManager {
  private orchestrator: AgentOrchestrator;
  
  constructor() {
    this.orchestrator = getAgentOrchestrator();
  }

  async executeAgent(agentName: string, input: any): Promise<any> {
    switch (agentName.toLowerCase()) {
      case 'research':
      case 'researcher':
        return await researchAgent.research(
          input.topic || input.requirements,
          input.depth
        );
      
      case 'code':
      case 'code-builder':
      case 'coder':
        if (input.fileName && input.language) {
          return await codeBuilderAgent.generateSingleFile(
            input.requirements,
            input.language,
            input.fileName
          );
        }
        return await codeBuilderAgent.generateProject(
          input.requirements,
          input.stack || 'nodejs'
        );
      
      case 'summarize':
      case 'summarizer':
        return await summarizerAgent.summarize(
          input.content,
          input.options
        );
      
      case 'visual':
      case 'visual-generator':
      case 'designer':
        return await visualGeneratorAgent.generateVisuals(
          input.requirements,
          input.assetTypes
        );
      
      default:
        throw new Error(`Unknown agent: ${agentName}`);
    }
  }

  async executeOrchestratedProject(projectId: string): Promise<void> {
    return await this.orchestrator.executeProject(projectId);
  }

  async batchExecuteAgents(tasks: Array<{ agent: string; input: any }>): Promise<any[]> {
    const results = await Promise.all(
      tasks.map(task => this.executeAgent(task.agent, task.input))
    );
    return results;
  }

  getAgentCapabilities(agentName?: string): any {
    const allCapabilities = {
      research: {
        description: 'Research and analyze topics',
        inputs: ['topic', 'depth', 'focusAreas'],
        outputs: ['analysis', 'keyFindings', 'sources', 'recommendations'],
        models: ['gemini-3-pro', 'gemini-2.5-pro']
      },
      'code-builder': {
        description: 'Generate code and projects',
        inputs: ['requirements', 'stack', 'language', 'fileName'],
        outputs: ['files', 'dependencies', 'setupInstructions'],
        models: ['gemini-2.5-pro', 'gemini-2.5-flash']
      },
      summarizer: {
        description: 'Create summaries and reports',
        inputs: ['content', 'options'],
        outputs: ['summary', 'keyPoints', 'takeaways', 'recommendations'],
        models: ['gemini-2.5-flash', 'gemini-2.5-pro']
      },
      'visual-generator': {
        description: 'Generate visual assets',
        inputs: ['requirements', 'assetTypes'],
        outputs: ['assets', 'overallDescription'],
        models: ['gemini-3-pro', 'nano-banana']
      }
    };

    if (agentName) {
      return allCapabilities[agentName as keyof typeof allCapabilities] || null;
    }

    return allCapabilities;
  }

  async validateAgentInput(agentName: string, input: any): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    switch (agentName.toLowerCase()) {
      case 'research':
      case 'researcher':
        if (!input.topic && !input.requirements) {
          errors.push('Topic or requirements are required');
        }
        break;
      
      case 'code':
      case 'code-builder':
        if (!input.requirements) {
          errors.push('Requirements are required');
        }
        break;
      
      case 'summarize':
      case 'summarizer':
        if (!input.content) {
          errors.push('Content to summarize is required');
        }
        break;
      
      case 'visual':
      case 'visual-generator':
        if (!input.requirements) {
          errors.push('Requirements are required');
        }
        break;
      
      default:
        errors.push(`Unknown agent: ${agentName}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async estimateExecution(agentName: string, input: any): Promise<{
    estimatedTime: number; // in milliseconds
    estimatedTokens: number;
    complexity: 'low' | 'medium' | 'high';
  }> {
    const baseEstimates: Record<string, any> = {
      research: {
        baseTime: 5000,
        baseTokens: 1000,
        perCharMultiplier: 0.01
      },
      'code-builder': {
        baseTime: 3000,
        baseTokens: 500,
        perCharMultiplier: 0.02
      },
      summarizer: {
        baseTime: 2000,
        baseTokens: 300,
        perCharMultiplier: 0.005
      },
      'visual-generator': {
        baseTime: 4000,
        baseTokens: 800,
        perCharMultiplier: 0.015
      }
    };

    const estimate = baseEstimates[agentName] || baseEstimates.research;
    const inputLength = JSON.stringify(input).length;
    
    const estimatedTime = estimate.baseTime + (inputLength * estimate.perCharMultiplier);
    const estimatedTokens = estimate.baseTokens + Math.floor(inputLength / 4);
    
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    if (estimatedTime < 3000) complexity = 'low';
    if (estimatedTime > 10000) complexity = 'high';

    return {
      estimatedTime,
      estimatedTokens,
      complexity
    };
  }
}

export const agentManager = new AgentManager();
export { getAgentOrchestrator } from './orchestrator';