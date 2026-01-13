import { GoogleGenerativeAI, FunctionDeclarationSchemaType } from '@google/generative-ai';
import logger from '../utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Model configurations optimized for different tasks
export const MODEL_CONFIG = {
  REASONING: 'gemini-3-pro', // Complex reasoning, planning
  FAST: 'gemini-2.5-flash',  // Quick tasks, code generation
  PRO: 'gemini-2.5-pro',     // Balanced performance
};

export const getModel = (modelName: string = MODEL_CONFIG.FAST) => {
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Generate content with optional function calling and structured outputs
 */
export const generateContent = async (prompt: string, config?: {
  model?: string;
  temperature?: number;
  tools?: any[];
  systemInstruction?: string;
}) => {
  try {
    const model = getModel(config?.model || MODEL_CONFIG.FAST);

    const generationConfig = {
      temperature: config?.temperature ?? 0.7,
      maxOutputTokens: 8192,
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
      ...(config?.systemInstruction && {
        systemInstruction: config.systemInstruction
      })
    });

    const response = result.response;
    const text = response.text();

    return {
      text,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      functionCalls: response.functionCalls?.() || []
    };
  } catch (error: any) {
    logger.error('Gemini API error:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
};

/**
 * Stream content generation for real-time updates
 */
export const generateContentStream = async function* (prompt: string, config?: {
  model?: string;
  temperature?: number;
}) {
  try {
    const model = getModel(config?.model || MODEL_CONFIG.FAST);

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config?.temperature ?? 0.7,
      }
    });

    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  } catch (error: any) {
    logger.error('Gemini streaming error:', error);
    throw new Error(`Gemini streaming error: ${error.message}`);
  }
};

/**
 * Function calling schema for structured agent communication
 */
export const AGENT_TOOLS = {
  search: {
    name: 'search_web',
    description: 'Search the web for information',
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        query: { type: FunctionDeclarationSchemaType.STRING, description: 'Search query' }
      },
      required: ['query']
    }
  },
  codeGen: {
    name: 'generate_code',
    description: 'Generate code based on specifications',
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        language: { type: FunctionDeclarationSchemaType.STRING },
        specifications: { type: FunctionDeclarationSchemaType.STRING }
      },
      required: ['language', 'specifications']
    }
  }
};

/**
 * Prompts optimized for different agent types using Gemini 3 capabilities
 */
export const researchAgentPrompt = (goal: string) => `
You are an autonomous research agent powered by Gemini 3.

GOAL: ${goal}

YOUR TASK:
1. Analyze the goal comprehensively
2. Research relevant information using your knowledge
3. Identify key concepts, technologies, and best practices
4. Provide structured findings with confidence scores

OUTPUT FORMAT (JSON):
{
  "findings": [
    {
      "topic": "string",
      "content": "string",
      "confidence": 0.0-1.0,
      "sources": ["string"]
    }
  ],
  "recommendations": ["string"],
  "overallConfidence": 0.0-1.0
}

Use long-context reasoning to maintain coherence.
`;

export const codeBuilderAgentPrompt = (context: {
  goal: string;
  research?: string;
  synthesis?: string;
}) => `
You are an autonomous code generation agent powered by Gemini 3.

PROJECT GOAL: ${context.goal}

${context.research ? `RESEARCH FINDINGS:\n${context.research}\n` : ''}
${context.synthesis ? `SYNTHESIS:\n${context.synthesis}\n` : ''}

YOUR TASK:
1. Design system architecture based on the goal and research
2. Generate production-ready code
3. Include file structure, dependencies, and documentation
4. Provide confidence score for your output

OUTPUT FORMAT (JSON):
{
  "architecture": {
    "overview": "string",
    "components": ["string"]
  },
  "files": [
    {
      "path": "string",
      "content": "string",
      "purpose": "string"
    }
  ],
  "dependencies": ["string"],
  "confidence": 0.0-1.0,
  "nextSteps": ["string"]
}

Generate clean, well-documented, production-quality code.
`;

export const summarizerAgentPrompt = (content: string) => `
You are an autonomous synthesis agent powered by Gemini 3.

CONTENT TO SUMMARIZE:
${content}

YOUR TASK:
1. Extract key insights
2. Identify patterns and themes
3. Provide actionable recommendations
4. Score your confidence in the summary

OUTPUT FORMAT (JSON):
{
  "summary": "string",
  "keyPoints": ["string"],
  "insights": ["string"],
  "recommendations": ["string"],
  "confidence": 0.0-1.0
}

Be concise but comprehensive.
`;

/**
 * Thinking mode for complex reasoning tasks
 */
export const generateWithThinking = async (prompt: string, config?: {
  model?: string;
}) => {
  const systemInstruction = `You are in thinking mode. Use step-by-step reasoning.
Break down complex problems. Show your thought process.`;

  return generateContent(prompt, {
    model: config?.model || MODEL_CONFIG.REASONING,
    systemInstruction,
    temperature: 0.8
  });
};


export default {
  generateContent,
  generateContentStream,
  generateWithThinking,
  getModel,
  MODEL_CONFIG,
  AGENT_TOOLS
};

// GeminiService class for coordinated AI operations
export class GeminiService {
  async generateContent(prompt: string, config?: {
    model?: string;
    temperature?: number;
  }) {
    return generateContent(prompt, config);
  }

  async generateContentStream(prompt: string, config?: {
    model?: string;
    temperature?: number;
  }) {
    return generateContentStream(prompt, config);
  }

  async generateWithThinking(prompt: string, config?: {
    model?: string;
  }) {
    return generateWithThinking(prompt, config);
  }

  async generateWithTools(prompt: string, tools: any[], config?: {
    model?: string;
    temperature?: number;
  }) {
    const model = getModel(config?.model || MODEL_CONFIG.FAST);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools,
      generationConfig: {
        temperature: config?.temperature ?? 0.7,
      }
    });

    const response = result.response;
    return {
      content: response.text(),
      confidence: 0.85, // Default confidence, can be enhanced
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      functionCalls: response.functionCalls?.() || []
    };
  }

  async checkHealth() {
    try {
      const model = getModel(MODEL_CONFIG.FAST);
      await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }]
      });
      return { status: 'healthy', timestamp: new Date() };
    } catch (error) {
      return { status: 'unhealthy', error: (error as Error).message, timestamp: new Date() };
    }
  }
}

// Singleton instance
let geminiServiceInstance: GeminiService;

export function getGeminiService(): GeminiService {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService();
  }
  return geminiServiceInstance;
}