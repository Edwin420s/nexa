"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearchAgent = void 0;
// @ts-ignore - Temporary until we install the package
const generative_ai_1 = require("@google/generative-ai");
class ResearchAgent {
    constructor(apiKey) {
        this.modelName = 'gemini-pro';
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    async execute(task, context = {}) {
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
        }
        catch (error) {
            console.error('Research agent error:', error);
            return {
                success: false,
                error: 'Failed to complete research',
                details: error?.message || 'Unknown error occurred'
            };
        }
    }
    calculateConfidence(content) {
        const minLength = 100;
        const hasSources = content.includes('http') || content.includes('source:');
        const hasReferences = content.includes('reference') || content.includes('according to');
        let confidence = 0.5; // Base confidence
        if (content.length > minLength)
            confidence += 0.2;
        if (hasSources)
            confidence += 0.2;
        if (hasReferences)
            confidence += 0.1;
        return Math.min(confidence, 0.95);
    }
}
exports.ResearchAgent = ResearchAgent;
