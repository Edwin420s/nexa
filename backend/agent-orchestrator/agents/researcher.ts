import { getGeminiService } from '../../services/gemini';
import { ConfidenceService } from '../../services/confidence';
import logger from '../../utils/logger';

export interface ResearchResult {
  analysis: string;
  keyFindings: string[];
  sources: Array<{
    title: string;
    url?: string;
    relevance: number;
  }>;
  recommendations: string[];
  confidence: number;
  metadata: Record<string, any>;
}

export class ResearchAgent {
  private gemini = getGeminiService();

  async research(topic: string, depth: 'shallow' | 'medium' | 'deep' = 'medium'): Promise<ResearchResult> {
    const prompt = this.generateResearchPrompt(topic, depth);
    
    try {
      const response = await this.gemini.generateContent(prompt, {
        model: 'gemini-3-pro',
        temperature: 0.7,
        maxTokens: 4096
      });

      const structuredResult = this.parseResearchResponse(response.content);
      const confidence = ConfidenceService.calculateConfidence(response.content, topic);
      
      return {
        ...structuredResult,
        confidence,
        metadata: {
          ...response.metadata,
          depth,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Research agent error:', error);
      throw new Error(`Research failed: ${(error as Error).message}`);
    }
  }

  private generateResearchPrompt(topic: string, depth: string): string {
    const depthInstructions: Record<string, string> = {
      shallow: 'Provide a brief overview with 2-3 key points',
      medium: 'Provide comprehensive analysis with 5-7 key findings and sources',
      deep: 'Provide in-depth analysis with detailed findings, multiple sources, and strategic recommendations'
    };

    return `Research Topic: ${topic}

    Research Depth: ${depth}
    
    ${depthInstructions[depth]}
    
    Please structure your response as follows:
    
    ## Analysis
    [Your comprehensive analysis here]
    
    ## Key Findings
    1. [Finding 1]
    2. [Finding 2]
    ...
    
    ## Sources
    - [Source 1] (Relevance: High/Medium/Low)
    - [Source 2] (Relevance: High/Medium/Low)
    ...
    
    ## Recommendations
    1. [Recommendation 1]
    2. [Recommendation 2]
    ...
    
    Ensure all information is accurate and well-researched.`;
  }

  private parseResearchResponse(response: string): Omit<ResearchResult, 'confidence' | 'metadata'> {
    const sections = this.extractSections(response);
    
    return {
      analysis: sections.analysis || response,
      keyFindings: this.extractKeyFindings(sections.keyFindings || response),
      sources: this.extractSources(sections.sources || ''),
      recommendations: this.extractRecommendations(sections.recommendations || '')
    };
  }

  private extractSections(response: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = response.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      const sectionMatch = line.match(/^##\s+(.+)$/);
      if (sectionMatch) {
        if (currentSection) {
          sections[currentSection.toLowerCase()] = currentContent.join('\n').trim();
        }
        currentSection = sectionMatch[1].toLowerCase();
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  }

  private extractKeyFindings(content: string): string[] {
    const findings: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^\s*\d+\.\s+(.+)$/);
      if (match) {
        findings.push(match[1].trim());
      } else if (line.trim().startsWith('- ')) {
        findings.push(line.trim().substring(2));
      }
    }
    
    return findings.length > 0 ? findings : [content];
  }

  private extractSources(content: string): Array<{ title: string; url?: string; relevance: number }> {
    const sources: Array<{ title: string; url?: string; relevance: number }> = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const text = trimmed.substring(2);
        const urlMatch = text.match(/\[([^\]]+)\]\(([^)]+)\)/);
        const relevanceMatch = text.match(/relevance:\s*(high|medium|low)/i);
        
        let title = text;
        let url: string | undefined;
        let relevance = 0.5;
        
        if (urlMatch) {
          title = urlMatch[1];
          url = urlMatch[2];
        }
        
        if (relevanceMatch) {
          const rel = relevanceMatch[1].toLowerCase();
          relevance = rel === 'high' ? 0.9 : rel === 'medium' ? 0.7 : 0.3;
        }
        
        sources.push({ title, url, relevance });
      }
    }
    
    return sources;
  }

  private extractRecommendations(content: string): string[] {
    return this.extractKeyFindings(content);
  }

  async researchWithFocus(topic: string, focusAreas: string[]): Promise<ResearchResult> {
    const focusPrompt = `Research: ${topic}
    
    Focus Areas:
    ${focusAreas.map(area => `- ${area}`).join('\n')}
    
    Provide detailed analysis for each focus area.`;
    
    const response = await this.gemini.generateContent(focusPrompt, {
      model: 'gemini-3-pro',
      maxTokens: 8192
    });

    const confidence = ConfidenceService.calculateConfidence(response.content, topic);
    
    return {
      analysis: response.content,
      keyFindings: this.extractKeyFindings(response.content),
      sources: [],
      recommendations: [],
      confidence,
      metadata: {
        focusAreas,
        timestamp: new Date().toISOString()
      }
    };
  }
}

export const researchAgent = new ResearchAgent();