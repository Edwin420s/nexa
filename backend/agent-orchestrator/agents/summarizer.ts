import { getGeminiService } from '../../services/gemini';
import { ConfidenceService } from '../../services/confidence';
import logger from '../../utils/logger';

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  takeaways: string[];
  recommendations: string[];
  confidence: number;
  metadata: Record<string, any>;
}

export interface SummaryOptions {
  length: 'brief' | 'detailed' | 'comprehensive';
  audience: 'technical' | 'executive' | 'general';
  format: 'paragraph' | 'bullet' | 'structured';
}

export class SummarizerAgent {
  private gemini = getGeminiService();

  async summarize(
    content: string,
    options?: Partial<SummaryOptions>
  ): Promise<SummaryResult> {
    const fullOptions: SummaryOptions = {
      length: 'detailed',
      audience: 'technical',
      format: 'structured',
      ...options
    };

    const prompt = this.generateSummaryPrompt(content, fullOptions);
    
    try {
      const response = await this.gemini.generateContent(prompt, {
        model: 'gemini-2.5-flash',
        temperature: 0.5,
        maxTokens: 2048
      });

      const structuredResult = this.parseSummaryResponse(response.content);
      const confidence = ConfidenceService.calculateConfidence(response.content, content);
      
      return {
        ...structuredResult,
        confidence,
        metadata: {
          ...response.metadata,
          options: fullOptions,
          originalLength: content.length,
          summaryLength: response.content.length,
          compressionRatio: content.length > 0 ? (response.content.length / content.length) : 1,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Summarizer agent error:', error);
      throw new Error(`Summarization failed: ${(error as Error).message}`);
    }
  }

  private generateSummaryPrompt(content: string, options: SummaryOptions): string {
    const lengthInstructions: Record<string, string> = {
      brief: 'Provide a very brief summary (2-3 sentences)',
      detailed: 'Provide a detailed summary covering all main points',
      comprehensive: 'Provide a comprehensive summary with analysis and context'
    };

    const audienceInstructions: Record<string, string> = {
      technical: 'Use technical terminology and focus on implementation details',
      executive: 'Focus on business impact, ROI, and strategic implications',
      general: 'Use plain language suitable for a general audience'
    };

    const formatInstructions: Record<string, string> = {
      paragraph: 'Format as cohesive paragraphs',
      bullet: 'Format as bullet points',
      structured: 'Use structured sections with headings'
    };

    return `Summarize the following content:

${content}

Requirements:
- Length: ${lengthInstructions[options.length]}
- Audience: ${audienceInstructions[options.audience]}
- Format: ${formatInstructions[options.format]}

Please include:
1. Main summary
2. Key points
3. Important takeaways
4. Actionable recommendations

Make the summary clear, accurate, and valuable for the specified audience.`;
  }

  private parseSummaryResponse(response: string): Omit<SummaryResult, 'confidence' | 'metadata'> {
    // Try to extract structured sections
    const sections = this.extractSections(response);
    
    if (sections.summary || sections.keyPoints) {
      return {
        summary: sections.summary || '',
        keyPoints: this.extractListItems(sections.keyPoints || ''),
        takeaways: this.extractListItems(sections.takeaways || ''),
        recommendations: this.extractListItems(sections.recommendations || '')
      };
    }

    // Fallback: treat the entire response as summary
    return {
      summary: response,
      keyPoints: this.extractKeyPoints(response),
      takeaways: this.extractTakeaways(response),
      recommendations: this.extractRecommendations(response)
    };
  }

  private extractSections(response: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = response.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    const sectionHeaders = ['summary', 'key points', 'takeaways', 'recommendations', 'key findings'];

    for (const line of lines) {
      const lineLower = line.toLowerCase().trim();
      
      // Check for section headers
      let foundSection = '';
      for (const header of sectionHeaders) {
        if (lineLower.includes(header) && (lineLower.startsWith('#') || lineLower.startsWith(header))) {
          foundSection = header.split(' ')[0]; // Get first word as key
          break;
        }
      }

      if (foundSection) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = foundSection;
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      } else if (line.trim()) {
        // Content before any section header goes to summary
        if (!sections.summary) {
          sections.summary = '';
        }
        sections.summary += line + '\n';
      }
    }

    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  }

  private extractListItems(content: string): string[] {
    const items: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Match numbered items (1., 2., etc.) or bullet points (-, *, •)
      const match = trimmed.match(/^(?:\d+\.\s*|[-*•]\s*)(.+)$/);
      if (match) {
        items.push(match[1].trim());
      } else if (trimmed && !trimmed.startsWith('#')) {
        // Also include non-empty lines that aren't headers
        items.push(trimmed);
      }
    }
    
    return items.length > 0 ? items : [content];
  }

  private extractKeyPoints(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 5); // Return first 5 meaningful sentences as key points
  }

  private extractTakeaways(content: string): string[] {
    const takeaways: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('important') || 
          lowerLine.includes('key takeaway') || 
          lowerLine.includes('significant') ||
          lowerLine.includes('crucial')) {
        takeaways.push(line.trim());
      }
    }
    
    return takeaways.length > 0 ? takeaways.slice(0, 3) : [];
  }

  private extractRecommendations(content: string): string[] {
    const recommendations: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('recommend') || 
          lowerLine.includes('suggest') || 
          lowerLine.includes('should') ||
          lowerLine.includes('advise')) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations.length > 0 ? recommendations.slice(0, 3) : [];
  }

  async summarizeMultiple(documents: string[], options?: Partial<SummaryOptions>): Promise<SummaryResult> {
    const combinedContent = documents.join('\n\n---\n\n');
    return this.summarize(combinedContent, options);
  }

  async createExecutiveSummary(content: string): Promise<SummaryResult> {
    return this.summarize(content, {
      length: 'brief',
      audience: 'executive',
      format: 'bullet'
    });
  }

  async createTechnicalSummary(content: string): Promise<SummaryResult> {
    return this.summarize(content, {
      length: 'detailed',
      audience: 'technical',
      format: 'structured'
    });
  }
}

export const summarizerAgent = new SummarizerAgent();