"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizerAgent = exports.SummarizerAgent = void 0;
const gemini_1 = require("../../services/gemini");
const confidence_1 = require("../../services/confidence");
const logger_1 = __importDefault(require("../../utils/logger"));
class SummarizerAgent {
    constructor() {
        this.gemini = (0, gemini_1.getGeminiService)();
    }
    async summarize(content, options) {
        const fullOptions = {
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
            const confidence = confidence_1.ConfidenceService.calculateConfidence(response.content, content);
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
        }
        catch (error) {
            logger_1.default.error('Summarizer agent error:', error);
            throw new Error(`Summarization failed: ${error.message}`);
        }
    }
    generateSummaryPrompt(content, options) {
        const lengthInstructions = {
            brief: 'Provide a very brief summary (2-3 sentences)',
            detailed: 'Provide a detailed summary covering all main points',
            comprehensive: 'Provide a comprehensive summary with analysis and context'
        };
        const audienceInstructions = {
            technical: 'Use technical terminology and focus on implementation details',
            executive: 'Focus on business impact, ROI, and strategic implications',
            general: 'Use plain language suitable for a general audience'
        };
        const formatInstructions = {
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
    parseSummaryResponse(response) {
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
    extractSections(response) {
        const sections = {};
        const lines = response.split('\n');
        let currentSection = '';
        let currentContent = [];
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
            }
            else if (currentSection) {
                currentContent.push(line);
            }
            else if (line.trim()) {
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
    extractListItems(content) {
        const items = [];
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            // Match numbered items (1., 2., etc.) or bullet points (-, *, •)
            const match = trimmed.match(/^(?:\d+\.\s*|[-*•]\s*)(.+)$/);
            if (match) {
                items.push(match[1].trim());
            }
            else if (trimmed && !trimmed.startsWith('#')) {
                // Also include non-empty lines that aren't headers
                items.push(trimmed);
            }
        }
        return items.length > 0 ? items : [content];
    }
    extractKeyPoints(content) {
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
        return sentences.slice(0, 5); // Return first 5 meaningful sentences as key points
    }
    extractTakeaways(content) {
        const takeaways = [];
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
    extractRecommendations(content) {
        const recommendations = [];
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
    async summarizeMultiple(documents, options) {
        const combinedContent = documents.join('\n\n---\n\n');
        return this.summarize(combinedContent, options);
    }
    async createExecutiveSummary(content) {
        return this.summarize(content, {
            length: 'brief',
            audience: 'executive',
            format: 'bullet'
        });
    }
    async createTechnicalSummary(content) {
        return this.summarize(content, {
            length: 'detailed',
            audience: 'technical',
            format: 'structured'
        });
    }
}
exports.SummarizerAgent = SummarizerAgent;
exports.summarizerAgent = new SummarizerAgent();
