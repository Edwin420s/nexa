import { getGeminiService } from '../../services/gemini';
import { ConfidenceService } from '../../services/confidence';
import logger from '../../utils/logger';

export interface VisualAsset {
  type: 'diagram' | 'chart' | 'ui' | 'logo' | 'icon';
  description: string;
  specifications: {
    style: string;
    colors: string[];
    dimensions?: { width: number; height: number };
    elements: string[];
  };
  implementation: {
    tools: string[];
    format: string;
    code?: string;
  };
}

export interface VisualGenerationResult {
  assets: VisualAsset[];
  overallDescription: string;
  confidence: number;
  metadata: Record<string, any>;
}

export class VisualGeneratorAgent {
  private gemini = getGeminiService();

  async generateVisuals(
    requirements: string,
    assetTypes: string[] = ['diagram', 'ui']
  ): Promise<VisualGenerationResult> {
    const prompt = this.generateVisualPrompt(requirements, assetTypes);
    
    try {
      const response = await this.gemini.generateContent(prompt, {
        model: 'gemini-3-pro', // Using Pro for better understanding of visual concepts
        temperature: 0.8,
        maxTokens: 4096
      });

      const structuredResult = this.parseVisualResponse(response.content, assetTypes);
      const confidence = ConfidenceService.calculateConfidence(response.content, requirements);
      
      return {
        ...structuredResult,
        confidence,
        metadata: {
          ...response.metadata,
          assetTypes,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Visual generator agent error:', error);
      throw new Error(`Visual generation failed: ${(error as Error).message}`);
    }
  }

  private generateVisualPrompt(requirements: string, assetTypes: string[]): string {
    const typeDescriptions: Record<string, string> = {
      diagram: 'system architecture diagrams, flow charts, entity relationship diagrams',
      chart: 'data visualization charts, graphs, infographics',
      ui: 'user interface mockups, wireframes, screen designs',
      logo: 'brand logos, icons, visual identity elements',
      icon: 'interface icons, glyphs, pictograms'
    };

    const requestedTypes = assetTypes.map(type => typeDescriptions[type] || type).join(', ');

    return `Generate visual assets based on these requirements:

${requirements}

Requested asset types: ${requestedTypes}

For each visual asset, provide:
1. Type and purpose
2. Detailed description
3. Design specifications (style, colors, dimensions)
4. Key visual elements
5. Recommended implementation tools and format
6. If applicable, provide code (SVG, HTML/CSS, Mermaid.js, etc.)

Format the response as follows:

## Overall Visual Concept
[Brief overview of the visual approach]

## Asset 1: [Asset Name]
**Type:** [diagram/chart/ui/logo/icon]
**Purpose:** [What this visual asset achieves]
**Description:** [Detailed description]
**Specifications:**
- Style: [minimalist/modern/classic/etc.]
- Colors: [primary color, secondary colors]
- Dimensions: [width x height if applicable]
- Elements: [list of key visual elements]
**Implementation:**
- Tools: [recommended tools like Figma, draw.io, etc.]
- Format: [SVG, PNG, PDF, etc.]
- Code: [if applicable, provide implementation code]

## Asset 2: [Asset Name]
...

Make the designs professional, clear, and aligned with modern design principles.`;
  }

  private parseVisualResponse(response: string, assetTypes: string[]): Omit<VisualGenerationResult, 'confidence' | 'metadata'> {
    const lines = response.split('\n');
    const assets: VisualAsset[] = [];
    let overallDescription = '';
    let currentAsset: Partial<VisualAsset> | null = null;
    let currentSection = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Extract overall concept
      if (line.startsWith('## Overall Visual Concept')) {
        i++;
        const conceptLines: string[] = [];
        while (i < lines.length && !lines[i].startsWith('##')) {
          conceptLines.push(lines[i]);
          i++;
        }
        overallDescription = conceptLines.join('\n').trim();
        i--; // Adjust for loop increment
        continue;
      }

      // Start new asset
      const assetMatch = line.match(/^## Asset \d+: (.+)$/);
      if (assetMatch) {
        if (currentAsset && this.isValidAsset(currentAsset)) {
          assets.push(currentAsset as VisualAsset);
        }
        currentAsset = {
          description: '',
          specifications: {
            style: '',
            colors: [],
            elements: []
          },
          implementation: {
            tools: [],
            format: ''
          }
        };
        currentSection = '';
        continue;
      }

      // Parse asset type
      if (line.startsWith('**Type:**')) {
        const typeMatch = line.match(/\*\*Type:\*\*\s*(.+)/);
        if (typeMatch && currentAsset) {
          const type = typeMatch[1].toLowerCase().trim();
          currentAsset.type = this.normalizeAssetType(type);
        }
        continue;
      }

      // Parse purpose
      if (line.startsWith('**Purpose:**') && currentAsset) {
        const purpose = line.replace('**Purpose:**', '').trim();
        // Could store this if needed
        continue;
      }

      // Parse description
      if (line.startsWith('**Description:**') && currentAsset) {
        i++;
        const descLines: string[] = [];
        while (i < lines.length && !lines[i].startsWith('**') && !lines[i].startsWith('##') && !lines[i].startsWith('-')) {
          descLines.push(lines[i]);
          i++;
        }
        currentAsset.description = descLines.join('\n').trim();
        i--; // Adjust
        continue;
      }

      // Parse specifications
      if (line.toLowerCase().includes('specifications') && currentAsset) {
        currentSection = 'specifications';
        continue;
      }

      // Parse implementation
      if (line.toLowerCase().includes('implementation') && currentAsset) {
        currentSection = 'implementation';
        continue;
      }

      // Parse list items based on current section
      if (line.startsWith('- ') && currentAsset) {
        const item = line.substring(2).trim();
        
        if (currentSection === 'specifications') {
          if (item.toLowerCase().startsWith('style:')) {
            currentAsset.specifications!.style = item.substring(6).trim();
          } else if (item.toLowerCase().startsWith('colors:')) {
            const colors = item.substring(7).split(',').map(c => c.trim());
            currentAsset.specifications!.colors = colors;
          } else if (item.toLowerCase().startsWith('dimensions:')) {
            const dimMatch = item.match(/dimensions:\s*(\d+)\s*x\s*(\d+)/i);
            if (dimMatch) {
              currentAsset.specifications!.dimensions = {
                width: parseInt(dimMatch[1]),
                height: parseInt(dimMatch[2])
              };
            }
          } else if (item.toLowerCase().startsWith('elements:')) {
            // Elements might continue on next lines
            const elements: string[] = [];