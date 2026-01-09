"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const researcher_1 = require("../agent-orchestrator/agents/researcher");
const code_builder_1 = require("../agent-orchestrator/agents/code-builder");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const gemini_1 = require("../services/gemini");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
// Execute research agent
router.post('/research', auth_1.authenticate, async (req, res, next) => {
    try {
        const { error } = (0, validation_1.validateAgentExecution)(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }
        const { topic, depth, focusAreas } = req.body;
        let result;
        if (focusAreas && Array.isArray(focusAreas)) {
            result = await researcher_1.researchAgent.researchWithFocus(topic, focusAreas);
        }
        else {
            result = await researcher_1.researchAgent.research(topic, depth || 'medium');
        }
        logger_1.default.info(`Research agent executed for user ${req.user.id}, topic: ${topic}`);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
// Execute code builder agent
router.post('/code', auth_1.authenticate, async (req, res, next) => {
    try {
        const { requirements, stack, language, fileName } = req.body;
        if (!requirements) {
            return res.status(400).json({
                success: false,
                message: 'Requirements are required'
            });
        }
        let result;
        if (fileName && language) {
            // Generate single file
            const file = await code_builder_1.codeBuilderAgent.generateSingleFile(requirements, language, fileName);
            result = {
                files: [file],
                confidence: file.metadata?.confidence || 0.7
            };
        }
        else {
            // Generate complete project
            const project = await code_builder_1.codeBuilderAgent.generateProject(requirements, stack || 'nodejs');
            result = {
                ...project,
                files: project.files
            };
        }
        logger_1.default.info(`Code builder agent executed for user ${req.user.id}`);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
// Generate tests for code
router.post('/code/tests', auth_1.authenticate, async (req, res, next) => {
    try {
        const { code, testFramework } = req.body;
        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Code is required'
            });
        }
        const testFiles = await code_builder_1.codeBuilderAgent.generateTests(code, testFramework || 'jest');
        res.json({
            success: true,
            data: {
                files: testFiles,
                testFramework: testFramework || 'jest'
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Direct Gemini API call
router.post('/direct', auth_1.authenticate, async (req, res, next) => {
    try {
        const { prompt, model, temperature, maxTokens, tools } = req.body;
        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: 'Prompt is required'
            });
        }
        const geminiService = (0, gemini_1.getGeminiService)();
        let result;
        if (tools && Array.isArray(tools) && tools.length > 0) {
            result = await geminiService.generateWithTools(prompt, tools, {
                model: model || 'gemini-2.5-flash',
                temperature: temperature || 0.7,
                maxTokens: maxTokens || 2048
            });
        }
        else {
            result = await geminiService.generateContent(prompt, {
                model: model || 'gemini-2.5-flash',
                temperature: temperature || 0.7,
                maxTokens: maxTokens || 2048
            });
        }
        logger_1.default.info(`Direct Gemini API call by user ${req.user.id}, model: ${model || 'default'}`);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
// Analyze image with Gemini
router.post('/analyze-image', auth_1.authenticate, async (req, res, next) => {
    try {
        const { imageBase64, prompt } = req.body;
        if (!imageBase64 || !prompt) {
            return res.status(400).json({
                success: false,
                message: 'Image base64 and prompt are required'
            });
        }
        const geminiService = (0, gemini_1.getGeminiService)();
        const result = await geminiService.analyzeImage(imageBase64, prompt);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
// List available agents
router.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const agents = [
            {
                name: 'research',
                description: 'Research and analyze topics with comprehensive reports',
                capabilities: [
                    'Topic analysis',
                    'Key findings extraction',
                    'Source identification',
                    'Recommendations generation'
                ],
                models: ['gemini-3-pro', 'gemini-2.5-pro'],
                config: {
                    temperature: 0.7,
                    maxTokens: 4096
                }
            },
            {
                name: 'code-builder',
                description: 'Generate complete projects or individual code files',
                capabilities: [
                    'Project scaffolding',
                    'Code generation',
                    'Test creation',
                    'Dependency management'
                ],
                models: ['gemini-2.5-pro', 'gemini-2.5-flash'],
                config: {
                    temperature: 0.3,
                    maxTokens: 8192
                }
            },
            {
                name: 'summarizer',
                description: 'Create concise summaries from complex content',
                capabilities: [
                    'Executive summaries',
                    'Technical overviews',
                    'Key points extraction',
                    'Report generation'
                ],
                models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
                config: {
                    temperature: 0.5,
                    maxTokens: 2048
                }
            },
            {
                name: 'visual-generator',
                description: 'Create visual assets and diagrams',
                capabilities: [
                    'Architecture diagrams',
                    'Flow charts',
                    'UI mockups',
                    'Branding elements'
                ],
                models: ['nano-banana', 'gemini-3-pro'],
                config: {
                    temperature: 0.8,
                    maxTokens: 4096
                }
            }
        ];
        res.json({
            success: true,
            data: agents
        });
    }
    catch (error) {
        next(error);
    }
});
// Get agent configuration
router.get('/:agentName', auth_1.authenticate, async (req, res, next) => {
    try {
        const { agentName } = req.params;
        const agents = {
            research: {
                name: 'research',
                description: 'Research and analyze topics',
                systemPrompt: 'You are a research assistant...',
                examplePrompts: [
                    'Research the latest trends in AI',
                    'Analyze the impact of renewable energy',
                    'Investigate market opportunities in e-commerce'
                ]
            },
            'code-builder': {
                name: 'code-builder',
                description: 'Generate code and projects',
                systemPrompt: 'You are a senior software engineer...',
                examplePrompts: [
                    'Create a REST API with Node.js and Express',
                    'Build a React component library',
                    'Generate a machine learning pipeline in Python'
                ]
            },
            summarizer: {
                name: 'summarizer',
                description: 'Create summaries and reports',
                systemPrompt: 'You are a technical writer...',
                examplePrompts: [
                    'Summarize this research paper',
                    'Create an executive summary of the project',
                    'Extract key points from this meeting transcript'
                ]
            },
            'visual-generator': {
                name: 'visual-generator',
                description: 'Generate visual content',
                systemPrompt: 'You are a visual designer...',
                examplePrompts: [
                    'Create an architecture diagram for a microservices system',
                    'Design a logo for a tech startup',
                    'Generate UI mockups for a mobile app'
                ]
            }
        };
        const agent = agents[agentName];
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }
        res.json({
            success: true,
            data: agent
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
