"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const orchestrator_1 = require("../../agent-orchestrator/orchestrator");
const researcher_1 = require("../../agent-orchestrator/agents/researcher");
const code_builder_1 = require("../../agent-orchestrator/agents/code-builder");
const summarizer_1 = require("../../agent-orchestrator/agents/summarizer");
const gemini_1 = require("../../services/gemini");
const cache_1 = require("../../services/cache");
const Project_1 = require("../../models/Project");
const User_1 = require("../../models/User");
const mongoose_1 = __importDefault(require("mongoose"));
// Mock dependencies
globals_1.jest.mock('../../services/gemini');
globals_1.jest.mock('../../services/cache');
globals_1.jest.mock('../../models/Project');
globals_1.jest.mock('../../models/User');
(0, globals_1.describe)('Agent Orchestrator', () => {
    let orchestrator;
    let mockProject;
    let mockUser;
    let mockGeminiService;
    let mockCache;
    (0, globals_1.beforeEach)(() => {
        // Reset all mocks
        globals_1.jest.clearAllMocks();
        // Create mock instances
        orchestrator = (0, orchestrator_1.getAgentOrchestrator)();
        mockUser = {
            _id: new mongoose_1.default.Types.ObjectId(),
            email: 'test@example.com',
            name: 'Test User'
        };
        mockProject = {
            _id: new mongoose_1.default.Types.ObjectId(),
            user: mockUser._id,
            title: 'Test Project',
            goal: 'Build a test application',
            agents: [
                { name: 'researcher', model: 'gemini-3-pro', status: 'idle' },
                { name: 'code-builder', model: 'gemini-2.5-pro', status: 'idle' }
            ],
            status: 'draft',
            analytics: {
                confidenceScore: 0,
                executionTime: 0,
                tokensUsed: 0
            },
            save: globals_1.jest.fn().mockResolvedValue(true),
            toObject: globals_1.jest.fn().mockReturnValue({})
        };
        mockGeminiService = {
            generateContent: globals_1.jest.fn(),
            generateWithTools: globals_1.jest.fn(),
            analyzeImage: globals_1.jest.fn()
        };
        mockCache = {
            get: globals_1.jest.fn(),
            set: globals_1.jest.fn(),
            del: globals_1.jest.fn()
        };
        // Setup mocks
        gemini_1.getGeminiService.mockReturnValue(mockGeminiService);
        cache_1.getCache.mockReturnValue(mockCache);
        Project_1.Project.findById.mockResolvedValue(mockProject);
        Project_1.Project.findByIdAndUpdate.mockResolvedValue(mockProject);
        User_1.User.findById.mockResolvedValue(mockUser);
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)('executeProject', () => {
        (0, globals_1.it)('should execute a project with multiple agents', async () => {
            // Mock Gemini responses
            mockGeminiService.generateContent.mockResolvedValue({
                content: 'Test research content',
                confidence: 0.85,
                tokensUsed: 100,
                metadata: {}
            });
            // Mock project execution
            const projectId = mockProject._id.toString();
            await orchestrator.executeProject(projectId);
            // Verify project was fetched
            (0, globals_1.expect)(Project_1.Project.findById).toHaveBeenCalledWith(projectId);
            // Verify agents were executed
            (0, globals_1.expect)(mockGeminiService.generateContent).toHaveBeenCalledTimes(2);
            // Verify project was updated
            (0, globals_1.expect)(Project_1.Project.findByIdAndUpdate).toHaveBeenCalled();
        });
        (0, globals_1.it)('should handle project not found', async () => {
            Project_1.Project.findById.mockResolvedValue(null);
            const projectId = new mongoose_1.default.Types.ObjectId().toString();
            await (0, globals_1.expect)(orchestrator.executeProject(projectId)).rejects.toThrow(`Project ${projectId} not found`);
        });
        (0, globals_1.it)('should handle agent execution failure', async () => {
            mockGeminiService.generateContent.mockRejectedValue(new Error('API error'));
            const projectId = mockProject._id.toString();
            await (0, globals_1.expect)(orchestrator.executeProject(projectId)).rejects.toThrow('API error');
        });
    });
    (0, globals_1.describe)('pause and resume project', () => {
        (0, globals_1.it)('should pause a running project', async () => {
            const projectId = 'test-project-id';
            // First mark project as active
            orchestrator.activeProjects.set(projectId, true);
            await orchestrator.pauseProject(projectId);
            (0, globals_1.expect)(orchestrator.activeProjects.get(projectId)).toBe(true);
        });
        (0, globals_1.it)('should resume a paused project', async () => {
            const projectId = 'test-project-id';
            await orchestrator.resumeProject(projectId);
            // Verify project can be executed again
            (0, globals_1.expect)(() => orchestrator.executeProject(projectId)).not.toThrow();
        });
    });
    (0, globals_1.describe)('generateTasksFromProject', () => {
        (0, globals_1.it)('should generate tasks from project configuration', () => {
            const tasks = orchestrator.generateTasksFromProject(mockProject);
            (0, globals_1.expect)(tasks).toHaveLength(2);
            (0, globals_1.expect)(tasks[0].agentName).toBe('researcher');
            (0, globals_1.expect)(tasks[1].agentName).toBe('code-builder');
            (0, globals_1.expect)(tasks[0].model).toBe('gemini-3-pro');
            (0, globals_1.expect)(tasks[1].model).toBe('gemini-2.5-pro');
        });
        (0, globals_1.it)('should generate appropriate prompts for each agent', () => {
            const tasks = orchestrator.generateTasksFromProject(mockProject);
            (0, globals_1.expect)(tasks[0].prompt).toContain('Build a test application');
            (0, globals_1.expect)(tasks[1].prompt).toContain('Build a test application');
        });
    });
    (0, globals_1.describe)('executeAgentTasks', () => {
        (0, globals_1.it)('should execute multiple agent tasks concurrently', async () => {
            const tasks = [
                {
                    agentName: 'researcher',
                    prompt: 'Test prompt 1',
                    model: 'gemini-3-pro'
                },
                {
                    agentName: 'code-builder',
                    prompt: 'Test prompt 2',
                    model: 'gemini-2.5-pro'
                }
            ];
            mockGeminiService.generateContent
                .mockResolvedValueOnce({
                content: 'Research result',
                confidence: 0.9,
                tokensUsed: 150,
                metadata: {}
            })
                .mockResolvedValueOnce({
                content: 'Code result',
                confidence: 0.8,
                tokensUsed: 200,
                metadata: {}
            });
            const results = await orchestrator.executeAgentTasks(mockProject._id.toString(), tasks);
            (0, globals_1.expect)(results).toHaveProperty('researcher');
            (0, globals_1.expect)(results).toHaveProperty('code-builder');
            (0, globals_1.expect)(results.researcher.confidence).toBe(0.9);
            (0, globals_1.expect)(results['code-builder'].confidence).toBe(0.8);
            (0, globals_1.expect)(mockGeminiService.generateContent).toHaveBeenCalledTimes(2);
        });
        (0, globals_1.it)('should handle task execution with tools', async () => {
            const tasks = [
                {
                    agentName: 'researcher',
                    prompt: 'Test prompt with tools',
                    model: 'gemini-3-pro',
                    tools: [
                        {
                            name: 'search_web',
                            description: 'Search the web',
                            parameters: { type: 'object', properties: { query: { type: 'string' } } }
                        }
                    ]
                }
            ];
            mockGeminiService.generateWithTools.mockResolvedValue({
                content: 'Research with tools result',
                confidence: 0.95,
                tokensUsed: 250,
                metadata: { toolsUsed: ['search_web'] }
            });
            const results = await orchestrator.executeAgentTasks(mockProject._id.toString(), tasks);
            (0, globals_1.expect)(results.researcher.confidence).toBe(0.95);
            (0, globals_1.expect)(mockGeminiService.generateWithTools).toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)('processResults', () => {
        (0, globals_1.it)('should process agent results and update project', async () => {
            const projectId = mockProject._id.toString();
            const results = {
                researcher: {
                    content: 'Research content',
                    confidence: 0.9,
                    tokensUsed: 150,
                    executionTime: 1000,
                    selfReflection: 'Good research'
                },
                'code-builder': {
                    content: 'Code content',
                    confidence: 0.8,
                    tokensUsed: 200,
                    executionTime: 2000,
                    selfReflection: 'Good code'
                }
            };
            await orchestrator.processResults(projectId, results);
            // Verify project was updated
            (0, globals_1.expect)(Project_1.Project.findByIdAndUpdate).toHaveBeenCalledWith(projectId, globals_1.expect.objectContaining({
                $set: globals_1.expect.objectContaining({
                    'analytics.confidenceScore': globals_1.expect.any(Number),
                    'analytics.executionTime': globals_1.expect.any(Number),
                    'analytics.tokensUsed': globals_1.expect.any(Number)
                })
            }));
        });
        (0, globals_1.it)('should calculate average confidence correctly', async () => {
            const projectId = mockProject._id.toString();
            const results = {
                agent1: { confidence: 0.9 },
                agent2: { confidence: 0.8 },
                agent3: { confidence: 0.7 }
            };
            await orchestrator.processResults(projectId, results);
            // Average should be (0.9 + 0.8 + 0.7) / 3 = 0.8
            (0, globals_1.expect)(Project_1.Project.findByIdAndUpdate).toHaveBeenCalledWith(projectId, globals_1.expect.objectContaining({
                $set: globals_1.expect.objectContaining({
                    'analytics.confidenceScore': 0.8
                })
            }));
        });
    });
    (0, globals_1.describe)('generateFilesFromResults', () => {
        (0, globals_1.it)('should generate files from agent results', () => {
            const results = {
                researcher: {
                    content: '# Research Report\n\nThis is the research content.',
                    confidence: 0.9
                },
                'code-builder': {
                    content: 'function test() {\n  console.log("test");\n}',
                    confidence: 0.8
                }
            };
            const files = orchestrator.generateFilesFromResults(results);
            (0, globals_1.expect)(files).toHaveLength(2);
            (0, globals_1.expect)(files[0].name).toMatch(/research-report-.*\.md/);
            (0, globals_1.expect)(files[1].name).toMatch(/code-implementation-.*\.js/);
            (0, globals_1.expect)(files[0].type).toBe('text/markdown');
            (0, globals_1.expect)(files[1].type).toBe('application/javascript');
        });
        (0, globals_1.it)('should handle different agent types', () => {
            const results = {
                summarizer: {
                    content: 'Summary content',
                    confidence: 0.85
                },
                'visual-generator': {
                    content: 'Visual description',
                    confidence: 0.75
                }
            };
            const files = orchestrator.generateFilesFromResults(results);
            (0, globals_1.expect)(files).toHaveLength(2);
            (0, globals_1.expect)(files[0].name).toMatch(/executive-summary-.*\.md/);
            (0, globals_1.expect)(files[1].name).toMatch(/architecture-diagram-.*\.txt/);
        });
    });
    (0, globals_1.describe)('isProjectActive', () => {
        (0, globals_1.it)('should return true for active projects', () => {
            const projectId = 'test-project-id';
            orchestrator.activeProjects.set(projectId, true);
            (0, globals_1.expect)(orchestrator.isProjectActive(projectId)).toBe(true);
        });
        (0, globals_1.it)('should return false for inactive projects', () => {
            const projectId = 'test-project-id';
            (0, globals_1.expect)(orchestrator.isProjectActive(projectId)).toBe(false);
        });
    });
    (0, globals_1.describe)('cancelProject', () => {
        (0, globals_1.it)('should cancel an active project', async () => {
            const projectId = 'test-project-id';
            orchestrator.activeProjects.set(projectId, true);
            await orchestrator.cancelProject(projectId);
            (0, globals_1.expect)(orchestrator.activeProjects.has(projectId)).toBe(false);
        });
    });
});
(0, globals_1.describe)('Research Agent', () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('research', () => {
        (0, globals_1.it)('should perform research with default depth', async () => {
            const topic = 'Artificial Intelligence in Healthcare';
            const mockResponse = {
                content: '# Analysis\n\nAI is transforming healthcare...',
                confidence: 0.85,
                tokensUsed: 500,
                metadata: {}
            };
            mockGeminiService.generateContent.mockResolvedValue(mockResponse);
            const result = await researcher_1.researchAgent.research(topic);
            (0, globals_1.expect)(result).toHaveProperty('analysis');
            (0, globals_1.expect)(result).toHaveProperty('keyFindings');
            (0, globals_1.expect)(result).toHaveProperty('sources');
            (0, globals_1.expect)(result).toHaveProperty('recommendations');
            (0, globals_1.expect)(result.confidence).toBe(0.85);
            (0, globals_1.expect)(mockGeminiService.generateContent).toHaveBeenCalledWith(globals_1.expect.stringContaining(topic), globals_1.expect.objectContaining({
                model: 'gemini-3-pro',
                temperature: 0.7
            }));
        });
        (0, globals_1.it)('should perform research with specified depth', async () => {
            const topic = 'Climate Change';
            const depth = 'deep';
            mockGeminiService.generateContent.mockResolvedValue({
                content: 'Deep analysis...',
                confidence: 0.9,
                tokensUsed: 1000,
                metadata: {}
            });
            const result = await researcher_1.researchAgent.research(topic, depth);
            (0, globals_1.expect)(result.metadata?.depth).toBe('deep');
            (0, globals_1.expect)(mockGeminiService.generateContent).toHaveBeenCalledWith(globals_1.expect.stringContaining('Research Depth: deep'), globals_1.expect.any(Object));
        });
    });
    (0, globals_1.describe)('researchWithFocus', () => {
        (0, globals_1.it)('should perform research with focus areas', async () => {
            const topic = 'Renewable Energy';
            const focusAreas = ['Solar Power', 'Wind Energy', 'Energy Storage'];
            mockGeminiService.generateContent.mockResolvedValue({
                content: 'Focused analysis...',
                confidence: 0.88,
                tokensUsed: 800,
                metadata: {}
            });
            const result = await researcher_1.researchAgent.researchWithFocus(topic, focusAreas);
            (0, globals_1.expect)(result.metadata?.focusAreas).toEqual(focusAreas);
            (0, globals_1.expect)(mockGeminiService.generateContent).toHaveBeenCalledWith(globals_1.expect.stringContaining('Solar Power'), globals_1.expect.any(Object));
        });
    });
});
(0, globals_1.describe)('Code Builder Agent', () => {
    (0, globals_1.describe)('generateProject', () => {
        (0, globals_1.it)('should generate a complete project structure', async () => {
            const requirements = 'Create a REST API with Node.js and Express';
            const stack = 'nodejs';
            mockGeminiService.generateContent.mockResolvedValue({
                content: `## Project: Test API
        
## Files
        
### server.js
\`\`\`javascript
const express = require('express');
const app = express();
\`\`\`
        
## Dependencies
- express: 4.18.0 (production)
        
## Setup
npm install`,
                confidence: 0.9,
                tokensUsed: 1000,
                metadata: {}
            });
            const result = await code_builder_1.codeBuilderAgent.generateProject(requirements, stack);
            (0, globals_1.expect)(result).toHaveProperty('name');
            (0, globals_1.expect)(result).toHaveProperty('description');
            (0, globals_1.expect)(result).toHaveProperty('files');
            (0, globals_1.expect)(result).toHaveProperty('dependencies');
            (0, globals_1.expect)(result).toHaveProperty('setupInstructions');
            (0, globals_1.expect)(result.files).toHaveLength(1);
            (0, globals_1.expect)(result.files[0].name).toBe('server.js');
            (0, globals_1.expect)(result.files[0].language).toBe('javascript');
        });
    });
    (0, globals_1.describe)('generateSingleFile', () => {
        (0, globals_1.it)('should generate a single code file', async () => {
            const requirements = 'Create a function that adds two numbers';
            const language = 'javascript';
            const fileName = 'math.js';
            mockGeminiService.generateContent.mockResolvedValue({
                content: 'function add(a, b) {\n  return a + b;\n}',
                confidence: 0.95,
                tokensUsed: 50,
                metadata: {}
            });
            const result = await code_builder_1.codeBuilderAgent.generateSingleFile(requirements, language, fileName);
            (0, globals_1.expect)(result.name).toBe(fileName);
            (0, globals_1.expect)(result.language).toBe(language);
            (0, globals_1.expect)(result.content).toContain('function add');
        });
    });
    (0, globals_1.describe)('generateTests', () => {
        (0, globals_1.it)('should generate tests for code', async () => {
            const code = 'function add(a, b) { return a + b; }';
            const testFramework = 'jest';
            mockGeminiService.generateContent.mockResolvedValue({
                content: 'test("adds numbers", () => {\n  expect(add(1, 2)).toBe(3);\n});',
                confidence: 0.9,
                tokensUsed: 100,
                metadata: {}
            });
            const result = await code_builder_1.codeBuilderAgent.generateTests(code, testFramework);
            (0, globals_1.expect)(result).toHaveLength(1);
            (0, globals_1.expect)(result[0].type).toBe('test');
            (0, globals_1.expect)(result[0].name).toBe('test.js');
            (0, globals_1.expect)(result[0].content).toContain('test(');
        });
    });
});
(0, globals_1.describe)('Summarizer Agent', () => {
    (0, globals_1.describe)('summarize', () => {
        (0, globals_1.it)('should summarize content with default options', async () => {
            const content = 'Long article about technology...';
            mockGeminiService.generateContent.mockResolvedValue({
                content: 'Summary of the article...',
                confidence: 0.85,
                tokensUsed: 200,
                metadata: {}
            });
            const result = await summarizer_1.summarizerAgent.summarize(content);
            (0, globals_1.expect)(result).toHaveProperty('summary');
            (0, globals_1.expect)(result).toHaveProperty('keyPoints');
            (0, globals_1.expect)(result).toHaveProperty('takeaways');
            (0, globals_1.expect)(result).toHaveProperty('recommendations');
            (0, globals_1.expect)(result.metadata?.options.length).toBe('detailed');
        });
        (0, globals_1.it)('should summarize with executive format', async () => {
            const content = 'Business report...';
            mockGeminiService.generateContent.mockResolvedValue({
                content: 'Executive summary...',
                confidence: 0.9,
                tokensUsed: 150,
                metadata: {}
            });
            const result = await summarizer_1.summarizerAgent.createExecutiveSummary(content);
            (0, globals_1.expect)(result.metadata?.options.audience).toBe('executive');
            (0, globals_1.expect)(result.metadata?.options.length).toBe('brief');
        });
    });
    (0, globals_1.describe)('summarizeMultiple', () => {
        (0, globals_1.it)('should summarize multiple documents', async () => {
            const documents = ['Document 1 content...', 'Document 2 content...'];
            mockGeminiService.generateContent.mockResolvedValue({
                content: 'Combined summary...',
                confidence: 0.88,
                tokensUsed: 300,
                metadata: {}
            });
            const result = await summarizer_1.summarizerAgent.summarizeMultiple(documents);
            (0, globals_1.expect)(result.summary).toBe('Combined summary...');
            (0, globals_1.expect)(result.metadata?.originalLength).toBeGreaterThan(0);
        });
    });
});
