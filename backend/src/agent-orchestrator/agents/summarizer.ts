import { generateContent } from '../../services/gemini';
import logger from '../../utils/logger';

export interface AgentConfig {
  model?: string;
  temperature?: number;
}

export interface AgentResult {
  output: string;
  tokensUsed: number;
}

const summarizerPrompt = (content: string) => `
Summarize the following content concisely while preserving key information:

${content}

Provide:
1. Main points (3-5 bullet points)
2. Key insights
3. Actionable recommendations

Format as structured text.
`;

export const summarizerAgent = {
  async execute(content: string, config?: AgentConfig): Promise<AgentResult> {
    try {
      logger.info('Summarizer agent executing');

      const prompt = summarizerPrompt(content);
      const response = await generateContent(prompt, {
        model: config?.model || 'gemini-2.5-flash',
        temperature: config?.temperature || 0.5
      });

      logger.info('Summarizer agent completed');

      return {
        output: response.text,
        tokensUsed: response.tokensUsed || 0
      };
    } catch (error: any) {
      logger.error('Summarizer agent error:', error);
      throw new Error(`Summarizer agent failed: ${error.message}`);
    }
  }
};