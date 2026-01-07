import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import { AgentOrchestrator, getAgentOrchestrator } from '../../agent-orchestrator/orchestrator';
import { researchAgent } from '../../agent-orchestrator/agents/researcher';
import { codeBuilderAgent } from '../../agent-orchestrator/agents/code-builder';
import { summarizerAgent } from '../../agent-orchestrator/agents/summarizer';
import { getGeminiService } from '../../services/gemini';
import { getCache } from '../../services/cache';
import { Project } from '../../models/Project';
import { User } from '../../models/User';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../../services/gemini');
jest.mock('../../services/cache');
jest.mock('../../models/Project');
jest.mock('../../models/User');

describe('Agent Orchestrator', () => {
  let orchestrator: AgentOrchestrator;
  let mockProject: any;
  let mockUser: any;
  let mockGeminiService: any;
  let mockCache: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock instances
    orchestrator = getAgentOrchestrator();
    
    mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'test@example.com',
      name: 'Test User'
    };

    mockProject = {
      _id: new mongoose.Types.ObjectId(),
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
      save: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue({})
    };

    mockGeminiService = {
      generateContent: jest.fn(),
      generateWithTools: jest.fn(),
      analyzeImage: jest.fn()
    };

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn()
    };

    // Setup mocks
    (getGeminiService as jest.Mock).mockReturnValue(mockGeminiService);
    (getCache as jest.Mock).mockReturnValue(mockCache);
    (Project.findById as jest.Mock).mockResolvedValue(mockProject);
    (Project.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockProject);
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('executeProject', () => {
    it('should execute a project with multiple agents', async () => {
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
      expect(Project.findById).toHaveBeenCalledWith(projectId);

      // Verify agents were executed
      expect(mockGeminiService.generateContent).toHaveBeenCalledTimes(2);

      // Verify project was updated
      expect(Project.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should handle project not found', async () => {
      (Project.findById as jest.Mock).mockResolvedValue(null);

      const projectId = new mongoose.Types.ObjectId().toString();
      
      await expect(orchestrator.executeProject(projectId)).rejects.toThrow(
        `Project ${projectId} not found`
      );
    });

    it('should handle agent execution failure', async () => {
      mockGeminiService.generateContent.mockRejectedValue(
        new Error('API error')
      );

      const projectId = mockProject._id.toString();
      
      await expect(orchestrator.executeProject(projectId)).rejects.toThrow(
        'API error'
      );
    });
  });

  describe('pause and resume project', () => {
    it('should pause a running project', async () => {
      const projectId = 'test-project-id';
      
      // First mark project as active
      (orchestrator as any).activeProjects.set(projectId, true);
      
      await orchestrator.pauseProject(projectId);
      
      expect((orchestrator as any).activeProjects.get(projectId)).toBe(true);
    });

    it('should resume a paused project', async () => {
      const projectId = 'test-project-id';
      
      await orchestrator.resumeProject(projectId);
      
      // Verify project can be executed again
      expect(() => orchestrator.executeProject(projectId)).not.toThrow();
    });
  });

  describe('generateTasksFromProject', () => {
    it('should generate tasks from project configuration', () => {
      const tasks = (orchestrator as any).generateTasksFromProject(mockProject);
      
      expect(tasks).toHaveLength(2);
      expect(tasks[0].agentName).toBe('researcher');
      expect(tasks[1].agentName).toBe('code-builder');
      expect(tasks[0].model).toBe('gemini-3-pro');
      expect(tasks[1].model).toBe('gemini-2.5-pro');
    });

    it('should generate appropriate prompts for each agent', () => {
      const tasks = (orchestrator as any).generateTasksFromProject(mockProject);
      
      expect(tasks[0].prompt).toContain('Build a test application');
      expect(tasks[1].prompt).toContain('Build a test application');
    });
  });

  describe('executeAgentTasks', () => {
    it('should execute multiple agent tasks concurrently', async () => {
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

      const results = await (orchestrator as any).executeAgentTasks(
        mockProject._id.toString(),
        tasks
      );

      expect(results).toHaveProperty('researcher');
      expect(results).toHaveProperty('code-builder');
      expect(results.researcher.confidence).toBe(0.9);
      expect(results['code-builder'].confidence).toBe(0.8);
      expect(mockGeminiService.generateContent).toHaveBeenCalledTimes(2);
    });

    it('should handle task execution with tools', async () => {
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

      const results = await (orchestrator as any).executeAgentTasks(
        mockProject._id.toString(),
        tasks
      );

      expect(results.researcher.confidence).toBe(0.95);
      expect(mockGeminiService.generateWithTools).toHaveBeenCalled();
    });
  });

  describe('processResults', () => {
    it('should process agent results and update project', async () => {
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

      await (orchestrator as any).processResults(projectId, results);

      // Verify project was updated
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({
          $set: expect.objectContaining({
            'analytics.confidenceScore': expect.any(Number),
            'analytics.executionTime': expect.any(Number),
            'analytics.tokensUsed': expect.any(Number)
          })
        })
      );
    });

    it('should calculate average confidence correctly', async () => {
      const projectId = mockProject._id.toString();
      const results = {
        agent1: { confidence: 0.9 },
        agent2: { confidence: 0.8 },
        agent3: { confidence: 0.7 }
      };

      await (orchestrator as any).processResults(projectId, results);

      // Average should be (0.9 + 0.8 + 0.7) / 3 = 0.8
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({
          $set: expect.objectContaining({
            'analytics.confidenceScore': 0.8
          })
        })
      );
    });
  });

  describe('generateFilesFromResults', () => {
    it('should generate files from agent results', () => {
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

      const files = (orchestrator as any).generateFilesFromResults(results);

      expect(files).toHaveLength(2);
      expect(files[0].name).toMatch(/research-report-.*\.md/);
      expect(files[1].name).toMatch(/code-implementation-.*\.js/);
      expect(files[0].type).toBe('text/markdown');
      expect(files[1].type).toBe('application/javascript');
    });

    it('should handle different agent types', () => {
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

      const files = (orchestrator as any).generateFilesFromResults(results);

      expect(files).toHaveLength(2);
      expect(files[0].name).toMatch(/executive-summary-.*\.md/);
      expect(files[1].name).toMatch(/architecture-diagram-.*\.txt/);
    });
  });

  describe('isProjectActive', () => {
    it('should return true for active projects', () => {
      const projectId = 'test-project-id';
      (orchestrator as any).activeProjects.set(projectId, true);
      
      expect(orchestrator.isProjectActive(projectId)).toBe(true);
    });

    it('should return false for inactive projects', () => {
      const projectId = 'test-project-id';
      
      expect(orchestrator.isProjectActive(projectId)).toBe(false);
    });
  });

  describe('cancelProject', () => {
    it('should cancel an active project', async () => {
      const projectId = 'test-project-id';
      (orchestrator as any).activeProjects.set(projectId, true);
      
      await orchestrator.cancelProject(projectId);
      
      expect((orchestrator as any).activeProjects.has(projectId)).toBe(false);
    });
  });
});

describe('Research Agent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('research', () => {
    it('should perform research with default depth', async () => {
      const topic = 'Artificial Intelligence in Healthcare';
      const mockResponse = {
        content: '# Analysis\n\nAI is transforming healthcare...',
        confidence: 0.85,
        tokensUsed: 500,
        metadata: {}
      };

      mockGeminiService.generateContent.mockResolvedValue(mockResponse);

      const result = await researchAgent.research(topic);

      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('keyFindings');
      expect(result).toHaveProperty('sources');
      expect(result).toHaveProperty('recommendations');
      expect(result.confidence).toBe(0.85);
      expect(mockGeminiService.generateContent).toHaveBeenCalledWith(
        expect.stringContaining(topic),
        expect.objectContaining({
          model: 'gemini-3-pro',
          temperature: 0.7
        })
      );
    });

    it('should perform research with specified depth', async () => {
      const topic = 'Climate Change';
      const depth = 'deep';

      mockGeminiService.generateContent.mockResolvedValue({
        content: 'Deep analysis...',
        confidence: 0.9,
        tokensUsed: 1000,
        metadata: {}
      });

      const result = await researchAgent.research(topic, depth);

      expect(result.metadata?.depth).toBe('deep');
      expect(mockGeminiService.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Research Depth: deep'),
        expect.any(Object)
      );
    });
  });

  describe('researchWithFocus', () => {
    it('should perform research with focus areas', async () => {
      const topic = 'Renewable Energy';
      const focusAreas = ['Solar Power', 'Wind Energy', 'Energy Storage'];

      mockGeminiService.generateContent.mockResolvedValue({
        content: 'Focused analysis...',
        confidence: 0.88,
        tokensUsed: 800,
        metadata: {}
      });

      const result = await researchAgent.researchWithFocus(topic, focusAreas);

      expect(result.metadata?.focusAreas).toEqual(focusAreas);
      expect(mockGeminiService.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Solar Power'),
        expect.any(Object)
      );
    });
  });
});

describe('Code Builder Agent', () => {
  describe('generateProject', () => {
    it('should generate a complete project structure', async () => {
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

      const result = await codeBuilderAgent.generateProject(requirements, stack);

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('dependencies');
      expect(result).toHaveProperty('setupInstructions');
      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('server.js');
      expect(result.files[0].language).toBe('javascript');
    });
  });

  describe('generateSingleFile', () => {
    it('should generate a single code file', async () => {
      const requirements = 'Create a function that adds two numbers';
      const language = 'javascript';
      const fileName = 'math.js';

      mockGeminiService.generateContent.mockResolvedValue({
        content: 'function add(a, b) {\n  return a + b;\n}',
        confidence: 0.95,
        tokensUsed: 50,
        metadata: {}
      });

      const result = await codeBuilderAgent.generateSingleFile(
        requirements,
        language,
        fileName
      );

      expect(result.name).toBe(fileName);
      expect(result.language).toBe(language);
      expect(result.content).toContain('function add');
    });
  });

  describe('generateTests', () => {
    it('should generate tests for code', async () => {
      const code = 'function add(a, b) { return a + b; }';
      const testFramework = 'jest';

      mockGeminiService.generateContent.mockResolvedValue({
        content: 'test("adds numbers", () => {\n  expect(add(1, 2)).toBe(3);\n});',
        confidence: 0.9,
        tokensUsed: 100,
        metadata: {}
      });

      const result = await codeBuilderAgent.generateTests(code, testFramework);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('test');
      expect(result[0].name).toBe('test.js');
      expect(result[0].content).toContain('test(');
    });
  });
});

describe('Summarizer Agent', () => {
  describe('summarize', () => {
    it('should summarize content with default options', async () => {
      const content = 'Long article about technology...';
      
      mockGeminiService.generateContent.mockResolvedValue({
        content: 'Summary of the article...',
        confidence: 0.85,
        tokensUsed: 200,
        metadata: {}
      });

      const result = await summarizerAgent.summarize(content);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('keyPoints');
      expect(result).toHaveProperty('takeaways');
      expect(result).toHaveProperty('recommendations');
      expect(result.metadata?.options.length).toBe('detailed');
    });

    it('should summarize with executive format', async () => {
      const content = 'Business report...';
      
      mockGeminiService.generateContent.mockResolvedValue({
        content: 'Executive summary...',
        confidence: 0.9,
        tokensUsed: 150,
        metadata: {}
      });

      const result = await summarizerAgent.createExecutiveSummary(content);

      expect(result.metadata?.options.audience).toBe('executive');
      expect(result.metadata?.options.length).toBe('brief');
    });
  });

  describe('summarizeMultiple', () => {
    it('should summarize multiple documents', async () => {
      const documents = ['Document 1 content...', 'Document 2 content...'];
      
      mockGeminiService.generateContent.mockResolvedValue({
        content: 'Combined summary...',
        confidence: 0.88,
        tokensUsed: 300,
        metadata: {}
      });

      const result = await summarizerAgent.summarizeMultiple(documents);

      expect(result.summary).toBe('Combined summary...');
      expect(result.metadata?.originalLength).toBeGreaterThan(0);
    });
  });
});