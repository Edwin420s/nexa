"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfidenceService = void 0;
class ConfidenceService {
    static calculateConfidence(content, context) {
        const metrics = this.analyzeContent(content, context);
        // Weighted average of all metrics
        const weights = {
            contentLength: 0.15,
            coherenceScore: 0.25,
            specificityScore: 0.20,
            structureScore: 0.15,
            relevanceScore: 0.25
        };
        const confidence = (metrics.contentLength * weights.contentLength +
            metrics.coherenceScore * weights.coherenceScore +
            metrics.specificityScore * weights.specificityScore +
            metrics.structureScore * weights.structureScore +
            metrics.relevanceScore * weights.relevanceScore);
        // Normalize to 0-1 range
        return Math.min(Math.max(confidence, 0), 0.99);
    }
    static analyzeContent(content, context) {
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = content.split(/\s+/).filter(w => w.length > 0);
        return {
            contentLength: this.calculateLengthScore(words.length),
            coherenceScore: this.calculateCoherenceScore(sentences),
            specificityScore: this.calculateSpecificityScore(words),
            structureScore: this.calculateStructureScore(content),
            relevanceScore: context ? this.calculateRelevanceScore(content, context) : 0.7
        };
    }
    static calculateLengthScore(wordCount) {
        if (wordCount < 10)
            return 0.2;
        if (wordCount < 50)
            return 0.5;
        if (wordCount < 200)
            return 0.8;
        if (wordCount < 500)
            return 0.9;
        return 1.0;
    }
    static calculateCoherenceScore(sentences) {
        if (sentences.length < 2)
            return 0.3;
        // Check for transitional words
        const transitionWords = [
            'however', 'therefore', 'moreover', 'consequently',
            'furthermore', 'nevertheless', 'additionally'
        ];
        const hasTransitions = sentences.some(sentence => transitionWords.some(word => sentence.toLowerCase().includes(word)));
        // Check for logical flow
        const hasLogicalFlow = sentences.length > 1;
        return hasTransitions && hasLogicalFlow ? 0.9 : 0.6;
    }
    static calculateSpecificityScore(words) {
        // Count specific vs generic words
        const specificIndicators = [
            'specifically', 'exactly', 'precisely', 'specification',
            'parameter', 'configuration', 'implementation'
        ];
        const specificCount = words.filter(word => specificIndicators.some(indicator => word.toLowerCase().includes(indicator))).length;
        const score = Math.min(specificCount / 5, 1);
        return score > 0 ? score : 0.3;
    }
    static calculateStructureScore(content) {
        const hasParagraphs = content.includes('\n\n');
        const hasBulletPoints = content.includes('•') || content.includes('- ') || content.includes('* ');
        const hasHeadings = content.includes('# ') || /^[A-Z][^.!?]*:/.test(content);
        let score = 0.5;
        if (hasParagraphs)
            score += 0.2;
        if (hasBulletPoints)
            score += 0.15;
        if (hasHeadings)
            score += 0.15;
        return Math.min(score, 1);
    }
    static calculateRelevanceScore(content, context) {
        const contentWords = new Set(content.toLowerCase().split(/\W+/));
        const contextWords = new Set(context.toLowerCase().split(/\W+/));
        const intersection = new Set([...contentWords].filter(word => contextWords.has(word)));
        const relevance = intersection.size / Math.max(contentWords.size, 1);
        return Math.min(relevance * 1.5, 1); // Boost score slightly
    }
    static generateSelfReflection(content, confidence) {
        const metrics = this.analyzeContent(content);
        const reflections = [];
        if (confidence > 0.8) {
            reflections.push('High confidence due to comprehensive analysis');
        }
        else if (confidence > 0.6) {
            reflections.push('Moderate confidence with room for improvement');
        }
        else {
            reflections.push('Low confidence - consider additional research');
        }
        if (metrics.contentLength < 0.3) {
            reflections.push('Content is quite brief');
        }
        else if (metrics.contentLength > 0.8) {
            reflections.push('Content is detailed and thorough');
        }
        if (metrics.coherenceScore > 0.8) {
            reflections.push('Excellent logical flow between ideas');
        }
        if (metrics.specificityScore > 0.7) {
            reflections.push('Specific details enhance credibility');
        }
        return reflections.join('. ');
    }
}
exports.ConfidenceService = ConfidenceService;
