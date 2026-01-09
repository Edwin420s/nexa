"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const gemini_1 = require("../../../services/gemini");
// Mock the GoogleGenAI class
globals_1.jest.mock('@google/genai', () => {
    return {
        GoogleGenAI: globals_1.jest.fn().mockImplementation(() => ({
            models: {
                generateContent: globals_1.jest.fn()
            }
        }))
    };
});
(0, globals_1.describe)('GeminiService', () => {
    let geminiService;
    let mockGoogleAI;
    (0, globals_1.beforeEach)(() => {
        // Clear all mocks
        globals_1.jest.clearAllMocks();
        // Create fresh instance
        geminiService = new gemini_1.GeminiService({
            apiKey: 'test-api-key'
        });
        // Get the mock instance
        const { GoogleGenAI } = require('@google/genai');
        mockGoogleAI = new GoogleGenAI();
    });
    (0, globals_1.describe)('constructor', () => {
        (0, globals_1.it)('should initialize with default config', () => {
            (0, globals_1.expect)(geminiService).toBeInstanceOf(gemini_1.GeminiService);
        });
        (0, globals_1.it)('should override default config with provided values', () => {
            const customService = new gemini_1.GeminiService({
                apiKey: 'custom-key',
                model: 'custom-model',
                temperature: 0.5,
                maxTokens: 1000
            });
            // Can't directly check private properties, but we can test through behavior
            (0, globals_1.expect)(customService).toBeInstanceOf(gemini_1.GeminiService);
        });
    });
    (0, globals_1.describe)('generateContent', () => {
        (0, globals_1.it)('should generate content successfully', async () => {
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
            (0, globals_1.expect)(result).toEqual({
                content: 'Generated content from Gemini',
                confidence: globals_1.expect.any(Number),
                tokensUsed: globals_1.expect.any(Number),
                metadata: globals_1.expect.objectContaining({
                    model: 'gemini-2.5-flash',
                    temperature: 0.7,
                    timestamp: globals_1.expect.any(String)
                })
            });
            (0, globals_1.expect)(mockGoogleAI.models.generateContent).toHaveBeenCalledWith({
                model: 'gemini-2.5-flash',
                contents: 'Test prompt',
                generationConfig: globals_1.expect.objectContaining({
                    temperature: 0.7,
                    maxOutputTokens: 2048
                })
            });
        });
        (0, globals_1.it)('should handle API errors', async () => {
            const error = new Error('API Error');
            mockGoogleAI.models.generateContent.mockRejectedValue(error);
            await (0, globals_1.expect)(geminiService.generateContent('Test prompt')).rejects.toThrow('Gemini API error: API Error');
        });
        (0, globals_1.it)('should use custom options when provided', async () => {
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
            (0, globals_1.expect)(mockGoogleAI.models.generateContent).toHaveBeenCalledWith({
                model: 'gemini-3-pro',
                contents: 'Test prompt',
                generationConfig: globals_1.expect.objectContaining({
                    temperature: 0.3,
                    maxOutputTokens: 4096
                })
            });
        });
    });
    (0, globals_1.describe)('generateStructuredOutput', () => {
        (0, globals_1.it)('should generate structured JSON output', async () => {
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
            const result = await geminiService.generateStructuredOutput('Create a person object', schema);
            (0, globals_1.expect)(result).toEqual({ name: 'John', age: 30 });
            (0, globals_1.expect)(mockGoogleAI.models.generateContent).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                contents: globals_1.expect.stringContaining(JSON.stringify(schema))
            }));
        });
        (0, globals_1.it)('should throw error for invalid JSON response', async () => {
            const mockResponse = {
                text: 'Invalid JSON',
                candidates: [{
                        content: {
                            parts: [{ text: 'Invalid JSON' }]
                        }
                    }]
            };
            mockGoogleAI.models.generateContent.mockResolvedValue(mockResponse);
            await (0, globals_1.expect)(geminiService.generateStructuredOutput('Test', { type: 'object' })).rejects.toThrow('Failed to parse structured output');
        });
    });
    (0, globals_1.describe)('generateWithTools', () => {
        (0, globals_1.it)('should generate content with tools', async () => {
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
            (0, globals_1.expect)(result.content).toBe('Tool-based response');
            (0, globals_1.expect)(result.metadata.toolsUsed).toEqual(['search']);
            (0, globals_1.expect)(mockGoogleAI.models.generateContent).toHaveBeenCalledWith({
                model: 'gemini-2.5-flash',
                contents: 'Test with tools',
                tools: globals_1.expect.any(Array)
            });
        });
    });
    (0, globals_1.describe)('analyzeImage', () => {
        (0, globals_1.it)('should analyze image successfully', async () => {
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
            (0, globals_1.expect)(result.content).toBe('Image description');
            (0, globals_1.expect)(result.metadata.hasImage).toBe(true);
            (0, globals_1.expect)(mockGoogleAI.models.generateContent).toHaveBeenCalledWith({
                model: 'gemini-2.5-flash',
                contents: globals_1.expect.arrayContaining([
                    globals_1.expect.objectContaining({
                        role: 'user',
                        parts: globals_1.expect.any(Array)
                    })
                ])
            });
        });
    });
    (0, globals_1.describe)('calculateConfidence', () => {
        (0, globals_1.it)('should calculate confidence based on content quality', () => {
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
                (0, globals_1.expect)(result2.confidence).toBeGreaterThan(result1.confidence);
                (0, globals_1.expect)(result1.confidence).toBeGreaterThanOrEqual(0.1);
                (0, globals_1.expect)(result1.confidence).toBeLessThanOrEqual(0.99);
                (0, globals_1.expect)(result2.confidence).toBeGreaterThanOrEqual(0.1);
                (0, globals_1.expect)(result2.confidence).toBeLessThanOrEqual(0.99);
            });
        });
    });
    (0, globals_1.describe)('estimateTokens', () => {
        (0, globals_1.it)('should estimate tokens based on content length', () => {
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
                (0, globals_1.expect)(result.tokensUsed).toBe(expectedTokens);
            });
        });
    });
    (0, globals_1.describe)('singleton pattern', () => {
        (0, globals_1.it)('should return the same instance', () => {
            const { getGeminiService } = require('../../../services/gemini');
            const instance1 = getGeminiService();
            const instance2 = getGeminiService();
            (0, globals_1.expect)(instance1).toBe(instance2);
        });
    });
});
