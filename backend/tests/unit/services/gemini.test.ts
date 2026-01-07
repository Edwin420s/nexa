import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GeminiService } from '../../../services/gemini';

// Mock the GoogleGenAI class
jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: jest.fn()
      }
    }))
  };
});

describe('GeminiService', () => {
  let geminiService: GeminiService;
  let mockGoogleAI: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create fresh instance
    geminiService = new GeminiService({
      apiKey: 'test-api-key'
    });
    
    // Get the mock instance
    const { GoogleGenAI } = require('@google/genai');
    mockGoogleAI = new GoogleGenAI();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      expect(geminiService).toBeInstanceOf(GeminiService);
    });

    it('should override default config with provided values', () => {
      const customService = new GeminiService({
        apiKey: 'custom-key',
        model: 'custom-model',
        temperature: 0.5,
        maxTokens: 1000
      });

      // Can't directly check private properties, but we can test through behavior
      expect(customService).toBeInstanceOf(GeminiService);
    });
  });

  describe('generateContent', () => {
    it('should generate content successfully', async () => {
      const mockResponse = {
        text: 'Generated content from Gemini',
        candidates: [{
          content: {
            parts: [{ text: 'Generated content from Gemini' }]
          }
        }]
      };

      mockGoogleAI.models.generateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.generateContent('Test prompt');

      expect(result).toEqual({
        content: 'Generated content from Gemini',
        confidence: expect.any(Number),
        tokensUsed: expect.any(Number),
        metadata: expect.objectContaining({
          model: 'gemini-2.5-flash',
          temperature: 0.7,
          timestamp: expect.any(String)
        })
      });

      expect(mockGoogleAI.models.generateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: 'Test prompt',
        generationConfig: expect.objectContaining({
          temperature: 0.7,
          maxOutputTokens: 2048
        })
      });
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockGoogleAI.models.generateContent.mockRejectedValue(error);

      await expect(geminiService.generateContent('Test prompt')).rejects.toThrow(
        'Gemini API error: API Error'
      );
    });

    it('should use custom options when provided', async () => {
      mockGoogleAI.models.generateContent.mockResolvedValue({
        text: 'Content',
        candidates: [{
          content: {
            parts: [{ text: 'Content' }]
          }
        }]
      });

      await geminiService.generateContent('Test prompt', {
        model: 'gemini-3-pro',
        temperature: 0.3,
        maxTokens: 4096
      });

      expect(mockGoogleAI.models.generateContent).toHaveBeenCalledWith({
        model: 'gemini-3-pro',
        contents: 'Test prompt',
        generationConfig: expect.objectContaining({
          temperature: 0.3,
          maxOutputTokens: 4096
        })
      });
    });
  });

  describe('generateStructuredOutput', () => {
    it('should generate structured JSON output', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        }
      };

      const mockResponse = {
        text: '{"name": "John", "age": 30}',
        candidates: [{
          content: {
            parts: [{ text: '{"name": "John", "age": 30}' }]
          }
        }]
      };

      mockGoogleAI.models.generateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.generateStructuredOutput<{ name: string; age: number }>(
        'Create a person object',
        schema
      );

      expect(result).toEqual({ name: 'John', age: 30 });
      expect(mockGoogleAI.models.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining(JSON.stringify(schema))
        })
      );
    });

    it('should throw error for invalid JSON response', async () => {
      const mockResponse = {
        text: 'Invalid JSON',
        candidates: [{
          content: {
            parts: [{ text: 'Invalid JSON' }]
          }
        }]
      };

      mockGoogleAI.models.generateContent.mockResolvedValue(mockResponse);

      await expect(
        geminiService.generateStructuredOutput('Test', { type: 'object' })
      ).rejects.toThrow('Failed to parse structured output');
    });
  });

  describe('generateWithTools', () => {
    it('should generate content with tools', async () => {
      const tools = [
        {
          name: 'search',
          description: 'Search tool',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string' }
            }
          }
        }
      ];

      const mockResponse = {
        text: 'Tool-based response',
        candidates: [{
          content: {
            parts: [{ text: 'Tool-based response' }]
          }
        }]
      };

      mockGoogleAI.models.generateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.generateWithTools('Test with tools', tools);

      expect(result.content).toBe('Tool-based response');
      expect(result.metadata.toolsUsed).toEqual(['search']);
      expect(mockGoogleAI.models.generateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: 'Test with tools',
        tools: expect.any(Array)
      });
    });
  });

  describe('analyzeImage', () => {
    it('should analyze image successfully', async () => {
      const imageBase64 = 'data:image/jpeg;base64,test';
      const prompt = 'Describe this image';

      const mockResponse = {
        text: 'Image description',
        candidates: [{
          content: {
            parts: [{ text: 'Image description' }]
          }
        }]
      };

      mockGoogleAI.models.generateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.analyzeImage(imageBase64, prompt);

      expect(result.content).toBe('Image description');
      expect(result.metadata.hasImage).toBe(true);
      expect(mockGoogleAI.models.generateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            parts: expect.any(Array)
          })
        ])
      });
    });
  });

  describe('calculateConfidence', () => {
    it('should calculate confidence based on content quality', () => {
      // This tests the private method through the public interface
      const shortContent = 'Short';
      const longContent = 'This is a longer piece of content with proper structure. Therefore, we can conclude that it has higher confidence. Analysis shows good results. Data supports the conclusion.';
      
      // Mock the generateContent to return different lengths
      mockGoogleAI.models.generateContent
        .mockResolvedValueOnce({
          text: shortContent,
          candidates: [{
            content: {
              parts: [{ text: shortContent }]
            }
          }]
        })
        .mockResolvedValueOnce({
          text: longContent,
          candidates: [{
            content: {
              parts: [{ text: longContent }]
            }
          }]
        });

      // We'll test by comparing confidences
      // Note: Since calculateConfidence is private, we test through generateContent
      const promise1 = geminiService.generateContent('short');
      const promise2 = geminiService.generateContent('long');
      
      return Promise.all([promise1, promise2]).then(([result1, result2]) => {
        // Longer, structured content should have higher confidence
        expect(result2.confidence).toBeGreaterThan(result1.confidence);
        expect(result1.confidence).toBeGreaterThanOrEqual(0.1);
        expect(result1.confidence).toBeLessThanOrEqual(0.99);
        expect(result2.confidence).toBeGreaterThanOrEqual(0.1);
        expect(result2.confidence).toBeLessThanOrEqual(0.99);
      });
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens based on content length', () => {
      // Test through generateContent
      const content = 'This is a test content with multiple words to estimate tokens.';
      
      mockGoogleAI.models.generateContent.mockResolvedValue({
        text: content,
        candidates: [{
          content: {
            parts: [{ text: content }]
          }
        }]
      });

      return geminiService.generateContent('test').then(result => {
        // Rough estimate: 1 token ≈ 4 characters
        const expectedTokens = Math.ceil(content.length / 4);
        expect(result.tokensUsed).toBe(expectedTokens);
      });
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const { getGeminiService } = require('../../../services/gemini');
      
      const instance1 = getGeminiService();
      const instance2 = getGeminiService();
      
      expect(instance1).toBe(instance2);
    });
  });
});