import { generateContent, researchAgentPrompt } from '../../services/gemini';
import logger from '../../utils/logger';

export interface AgentConfig {
  model?: string;
  temperature?: number;
}

export interface AgentResult {
  output: string;
  tokensUsed: number;
  confidence?: number;
}

export const researcherAgent = {
  async execute(goal: string, config?: AgentConfig): Promise<AgentResult> {
    try {
      logger.info('Researcher agent executing');

      const prompt = researchAgentPrompt(goal);
      const response = await generateContent(prompt, {
        model: config?.model || 'gemini-2.5-flash',
        temperature: config?.temperature || 0.7
      });

      logger.info('Researcher agent completed');

      return {
        output: response.text,
        tokensUsed: response.tokensUsed || 0
      };
    } catch (error: any) {
      logger.error('Researcher agent error:', error);
      throw new Error(`Researcher agent failed: ${error.message}`);
    }
  }
};