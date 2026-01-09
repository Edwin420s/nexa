"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentOrchestrator = exports.agentManager = exports.AgentManager = void 0;
__exportStar(require("./orchestrator"), exports);
__exportStar(require("./agents/researcher"), exports);
__exportStar(require("./agents/code-builder"), exports);
__exportStar(require("./agents/summarizer"), exports);
__exportStar(require("./agents/visual-generator"), exports);
const orchestrator_1 = require("./orchestrator");
const researcher_1 = require("./agents/researcher");
const code_builder_1 = require("./agents/code-builder");
const summarizer_1 = require("./agents/summarizer");
const visual_generator_1 = require("./agents/visual-generator");
class AgentManager {
    constructor() {
        this.orchestrator = (0, orchestrator_1.getAgentOrchestrator)();
    }
    async executeAgent(agentName, input) {
        switch (agentName.toLowerCase()) {
            case 'research':
            case 'researcher':
                return await researcher_1.researchAgent.research(input.topic || input.requirements, input.depth);
            case 'code':
            case 'code-builder':
            case 'coder':
                if (input.fileName && input.language) {
                    return await code_builder_1.codeBuilderAgent.generateSingleFile(input.requirements, input.language, input.fileName);
                }
                return await code_builder_1.codeBuilderAgent.generateProject(input.requirements, input.stack || 'nodejs');
            case 'summarize':
            case 'summarizer':
                return await summarizer_1.summarizerAgent.summarize(input.content, input.options);
            case 'visual':
            case 'visual-generator':
            case 'designer':
                return await visual_generator_1.visualGeneratorAgent.generateVisuals(input.requirements, input.assetTypes);
            default:
                throw new Error(`Unknown agent: ${agentName}`);
        }
    }
    async executeOrchestratedProject(projectId) {
        return await this.orchestrator.executeProject(projectId);
    }
    async batchExecuteAgents(tasks) {
        const results = await Promise.all(tasks.map(task => this.executeAgent(task.agent, task.input)));
        return results;
    }
    getAgentCapabilities(agentName) {
        const allCapabilities = {
            research: {
                description: 'Research and analyze topics',
                inputs: ['topic', 'depth', 'focusAreas'],
                outputs: ['analysis', 'keyFindings', 'sources', 'recommendations'],
                models: ['gemini-3-pro', 'gemini-2.5-pro']
            },
            'code-builder': {
                description: 'Generate code and projects',
                inputs: ['requirements', 'stack', 'language', 'fileName'],
                outputs: ['files', 'dependencies', 'setupInstructions'],
                models: ['gemini-2.5-pro', 'gemini-2.5-flash']
            },
            summarizer: {
                description: 'Create summaries and reports',
                inputs: ['content', 'options'],
                outputs: ['summary', 'keyPoints', 'takeaways', 'recommendations'],
                models: ['gemini-2.5-flash', 'gemini-2.5-pro']
            },
            'visual-generator': {
                description: 'Generate visual assets',
                inputs: ['requirements', 'assetTypes'],
                outputs: ['assets', 'overallDescription'],
                models: ['gemini-3-pro', 'nano-banana']
            }
        };
        if (agentName) {
            return allCapabilities[agentName] || null;
        }
        return allCapabilities;
    }
    async validateAgentInput(agentName, input) {
        const errors = [];
        switch (agentName.toLowerCase()) {
            case 'research':
            case 'researcher':
                if (!input.topic && !input.requirements) {
                    errors.push('Topic or requirements are required');
                }
                break;
            case 'code':
            case 'code-builder':
                if (!input.requirements) {
                    errors.push('Requirements are required');
                }
                break;
            case 'summarize':
            case 'summarizer':
                if (!input.content) {
                    errors.push('Content to summarize is required');
                }
                break;
            case 'visual':
            case 'visual-generator':
                if (!input.requirements) {
                    errors.push('Requirements are required');
                }
                break;
            default:
                errors.push(`Unknown agent: ${agentName}`);
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    async estimateExecution(agentName, input) {
        const baseEstimates = {
            research: {
                baseTime: 5000,
                baseTokens: 1000,
                perCharMultiplier: 0.01
            },
            'code-builder': {
                baseTime: 3000,
                baseTokens: 500,
                perCharMultiplier: 0.02
            },
            summarizer: {
                baseTime: 2000,
                baseTokens: 300,
                perCharMultiplier: 0.005
            },
            'visual-generator': {
                baseTime: 4000,
                baseTokens: 800,
                perCharMultiplier: 0.015
            }
        };
        const estimate = baseEstimates[agentName] || baseEstimates.research;
        const inputLength = JSON.stringify(input).length;
        const estimatedTime = estimate.baseTime + (inputLength * estimate.perCharMultiplier);
        const estimatedTokens = estimate.baseTokens + Math.floor(inputLength / 4);
        let complexity = 'medium';
        if (estimatedTime < 3000)
            complexity = 'low';
        if (estimatedTime > 10000)
            complexity = 'high';
        return {
            estimatedTime,
            estimatedTokens,
            complexity
        };
    }
}
exports.AgentManager = AgentManager;
exports.agentManager = new AgentManager();
var orchestrator_2 = require("./orchestrator");
Object.defineProperty(exports, "getAgentOrchestrator", { enumerable: true, get: function () { return orchestrator_2.getAgentOrchestrator; } });
