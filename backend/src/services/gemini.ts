maxTokens ?: number;
topP ?: number;
topK ?: number;
}

export interface GeminiResponse {
  content: string;
  confidence: number;
  tokensUsed: number;
  metadata: Record<string, any>;
}

export class GeminiService {
  private ai: GoogleGenAI;
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = {
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.95,
      topK: 40,
      ...config
    };

    this.ai = new GoogleGenAI({
      apiKey: this.config.apiKey
    });
  }

  async generateContent(prompt: string, options?: Partial<GeminiConfig>): Promise<GeminiResponse> {
    const config = { ...this.config, ...options };

    try {
      const response = await this.ai.models.generateContent({
        model: config.model!,
        contents: prompt,
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: config.maxTokens,
          topP: config.topP,
          topK: config.topK
        }
      });

      const content = response.text || '';
      const confidence = this.calculateConfidence(content);
      const tokensUsed = this.estimateTokens(content);

      return {
        content,
        confidence,
        tokensUsed,
        metadata: {
          model: config.model,
          temperature: config.temperature,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${(error as Error).message}`);
    }
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: Record<string, any>,
    options?: Partial<GeminiConfig>
  ): Promise<T> {
    const structuredPrompt = `${prompt}\n\nRespond with a valid JSON object matching this schema: ${JSON.stringify(schema)}`;

    const response = await this.generateContent(structuredPrompt, options);

    try {
      return JSON.parse(response.content) as T;
    } catch (error) {
      throw new Error('Failed to parse structured output');
    }
  }

  async generateWithTools(
    prompt: string,
    tools: Array<{
      name: string;
      description: string;
      parameters: Record<string, any>;
    }>,
    options?: Partial<GeminiConfig>
  ): Promise<GeminiResponse> {
    try {
      const response = await this.ai.models.generateContent({
        model: options?.model || this.config.model!,
        contents: prompt,
        tools: tools.map(tool => ({
          functionDeclarations: [{
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }]
        }))
      });

      const content = response.text || '';
      const confidence = this.calculateConfidence(content);
      const tokensUsed = this.estimateTokens(content);

      return {
        content,
        confidence,
        tokensUsed,
        metadata: {
          ...response,
          toolsUsed: tools.map(t => t.name)
        }
      };
    } catch (error) {
      console.error('Gemini tools error:', error);
      throw error;
    }
  }

  private calculateConfidence(content: string): number {
    // Calculate confidence based on content quality
    const factors = {
      length: Math.min(content.length / 1000, 1),
      structure: content.includes('\n') && content.includes('. ') ? 0.8 : 0.3,
      keywords: this.hasKeywords(content) ? 0.9 : 0.5
    };

    const confidence = (
      factors.length * 0.3 +
      factors.structure * 0.4 +
      factors.keywords * 0.3
    );

    return Math.min(Math.max(confidence, 0.1), 0.99);
  }

  private hasKeywords(content: string): boolean {
    const keywords = ['therefore', 'conclusion', 'analysis', 'research', 'data', 'result'];
    return keywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  private estimateTokens(content: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English text
    return Math.ceil(content.length / 4);
  }

  async analyzeImage(imageBase64: string, prompt: string): Promise<GeminiResponse> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }
        ]
      });

      const content = response.text || '';
      const confidence = this.calculateConfidence(content);
      const tokensUsed = this.estimateTokens(content);

      return {
        content,
        confidence,
        tokensUsed,
        metadata: {
          model: 'gemini-2.5-flash-vision',
          hasImage: true
        }
      };
    } catch (error) {
      console.error('Image analysis error:', error);
      throw error;
    }
  }
}

// Singleton instance
let geminiInstance: GeminiService;

export function getGeminiService(): GeminiService {
  if (!geminiInstance) {
    geminiInstance = new GeminiService({
      apiKey: process.env.GEMINI_API_KEY || ''
    });
  }
  return geminiInstance;
}