import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const getModel = (modelName: string = 'gemini-2.5-flash') => {
  return genAI.getGenerativeModel({ model: modelName });
};

export const generateContent = async (prompt: string, config?: any) => {
  try {
    const model = getModel(config?.model || 'gemini-2.5-flash');
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return {
      text,
      tokensUsed: result.response.usageMetadata?.totalTokenCount || 0
    };
  } catch (error: any) {
    logger.error('Gemini API error:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
};

export const generateContentStream = async function* (prompt: string, config?: any) {
  try {
    const model = getModel(config?.model || 'gemini-2.5-flash');
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  } catch (error: any) {
    logger.error('Gemini streaming error:', error);
    throw new Error(`Gemini streaming error: ${error.message}`);
  }
};

export const researchAgentPrompt = (goal: string) => `Research this goal: ${goal}

Provide structured findings with confidence scores (0-1).`;

export const codeBuilderAgentPrompt = (goal: string) => `Generate code for: ${goal}

Include file structure and implementation.`;

export default { generateContent, generateContentStream, getModel };