import logger from '../utils/logger';

export interface ConfidenceFactors {
  responseLength: number;
  structureScore: number;
  contentQuality: number;
  specificityScore: number;
}

export const calculateConfidence = (
  response: string,
  context?: Record<string, any>
): number => {
  try {
    // Try to extract confidence from JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.confidence && typeof parsed.confidence === 'number') {
        return Math.max(0, Math.min(1, parsed.confidence));
      }
    }

    // Calculate heuristic confidence
    const factors = analyzeResponse(response);
    return computeConfidenceScore(factors);
  } catch (error) {
    logger.warn('Error calculating confidence, using default:', error);
    return 0.7;
  }
};

const analyzeResponse = (response: string): ConfidenceFactors => {
  const length = response.length;
  const hasStructure = /```|#{1,6}|\n-|\n\*|\n\d+\./.test(response);
  const hasSpecifics = /\d+|[A-Z][a-z]+\s+[A-Z][a-z]+|https?:\/\//.test(response);

  return {
    responseLength: Math.min(length / 1000, 1),
    structureScore: hasStructure ? 0.8 : 0.4,
    contentQuality: length > 100 ? 0.8 : 0.5,
    specificityScore: hasSpecifics ? 0.9 : 0.5
  };
};

const computeConfidenceScore = (factors: ConfidenceFactors): number => {
  const weights = {
    responseLength: 0.2,
    structureScore: 0.3,
    contentQuality: 0.3,
    specificityScore: 0.2
  };

  const score =
    factors.responseLength * weights.responseLength +
    factors.structureScore * weights.structureScore +
    factors.contentQuality * weights.contentQuality +
    factors.specificityScore * weights.specificityScore;

  return Math.max(0.3, Math.min(0.95, score));
};

export const aggregateConfidenceScores = (scores: number[]): number => {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

export const generateSelfReflection = (
  confidence: number,
  taskType: string
): string => {
  if (confidence >= 0.8) {
    return `High confidence in ${taskType} results. Response is well-structured and specific.`;
  } else if (confidence >= 0.6) {
    return `Moderate confidence in ${taskType}. Results are reasonable but may need validation.`;
  } else {
    return `Lower confidence in ${taskType}. Recommend additional research or iteration.`;
  }
};