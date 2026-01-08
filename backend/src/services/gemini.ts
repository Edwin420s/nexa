import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';

let geminiInstance: GoogleGenerativeAI | null = null;

export const initGemini = (apiKey: string) => {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined');
  }
  geminiInstance = new GoogleGenerativeAI(apiKey);
  return geminiInstance;
};

export const getGeminiService = () => {
  if (!geminiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    geminiInstance = new GoogleGenerativeAI(apiKey);
  }
  return geminiInstance;
};

export const generateText = async (prompt: string, modelName = 'gemini-pro') => {
  try {
    const genAI = getGeminiService();
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    logger.error('Error generating text with Gemini:', error);
    throw error;
  }
};

export const generateChatResponse = async (messages: Array<{role: string, parts: string}>, modelName = 'gemini-pro') => {
  try {
    const genAI = getGeminiService();
    const model = genAI.getGenerativeModel({ model: modelName });
    const chat = model.startChat({
      history: messages.slice(0, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts }],
      })),
    });
    const result = await chat.sendMessage(messages[messages.length - 1].parts);
    const response = await result.response;
    return response.text();
  } catch (error) {
    logger.error('Error generating chat response with Gemini:', error);
    throw error;
  }
};