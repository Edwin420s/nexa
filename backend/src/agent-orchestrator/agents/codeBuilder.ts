import { generateContent, codeBuilderAgentPrompt } from '../../services/gemini';
import logger from '../../utils/logger';

export interface CodeBuilderContext {
    goal: string;
    research?: string;
    synthesis?: string;
}

export interface AgentConfig {
    model?: string;
    temperature?: number;
}

export interface AgentResult {
    output: string;
    tokensUsed: number;
}

export const codeBuilderAgent = {
    async execute(context: CodeBuilderContext, config?: AgentConfig): Promise<AgentResult> {
        try {
            logger.info('Code builder agent executing');

            const prompt = codeBuilderAgentPrompt(context.goal);
            const response = await generateContent(prompt, {
                model: config?.model || 'gemini-2.5-flash',
                temperature: config?.temperature || 0.7
            });

            logger.info('Code builder agent completed');

            return {
                output: response.text,
                tokensUsed: response.tokensUsed || 0
            };
        } catch (error: any) {
            logger.error('Code builder agent error:', error);
            throw new Error(`Code builder agent failed: ${error.message}`);
        }
    }
};
