// @ts-ignore - Temporary until we install the package
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Agent, AgentResponse } from '../types/agent';

export class ResearchAgent implements Agent {
  private genAI: GoogleGenerativeAI;
  private modelName: string = 'gemini-pro';

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async execute(task: string, context: any = {}): Promise<any> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const prompt = `As a research assistant, please provide detailed information about: ${task}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        data: {
          content: text,
          sources: [],
          confidence: this.calculateConfidence(text)
        }
      };
    } catch (error: any) {
      console.error('Research agent error:', error);
      return {
        success: false,
        error: 'Failed to complete research',
        details: error?.message || 'Unknown error occurred'
      };
    }
  }

  private calculateConfidence(content: string): number {
    const minLength = 100;
    const hasSources = content.includes('http') || content.includes('source:');
    const hasReferences = content.includes('reference') || content.includes('according to');
    
    let confidence = 0.5; // Base confidence
    
    if (content.length > minLength) confidence += 0.2;
    if (hasSources) confidence += 0.2;
    if (hasReferences) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }
}
