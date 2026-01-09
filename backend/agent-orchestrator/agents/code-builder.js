"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeBuilderAgent = exports.CodeBuilderAgent = void 0;
const gemini_1 = require("../../services/gemini");
const confidence_1 = require("../../services/confidence");
const logger_1 = __importDefault(require("../../utils/logger"));
class CodeBuilderAgent {
    constructor() {
        this.gemini = (0, gemini_1.getGeminiService)();
    }
    async generateProject(requirements, stack = 'nodejs') {
        const prompt = this.generateProjectPrompt(requirements, stack);
        try {
            const response = await this.gemini.generateContent(prompt, {
                model: 'gemini-2.5-pro',
                temperature: 0.3, // Lower temperature for more deterministic code
                maxTokens: 8192
            });
            const structuredResult = this.parseProjectResponse(response.content, stack);
            const confidence = confidence_1.ConfidenceService.calculateConfidence(response.content, requirements);
            return {
                ...structuredResult,
                confidence,
                metadata: {
                    ...response.metadata,
                    stack,
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            logger_1.default.error('Code builder agent error:', error);
            throw new Error(`Code generation failed: ${error.message}`);
        }
    }
    generateProjectPrompt(requirements, stack) {
        return `Create a complete project structure based on these requirements:
    
    Requirements: ${requirements}
    
    Stack: ${stack}
    
    Generate:
    1. Project name and description
    2. Complete file structure with actual code
    3. Package.json or equivalent with dependencies
    4. Setup and running instructions
    5. Architecture explanation
    
    Format the response as follows:
    
    ## Project: [Project Name]
    [Description]
    
    ## Files
    
    ### [filename.extension]
    \`\`\`[language]
    [code content]
    \`\`\`
    
    ### [another-filename.extension]
    \`\`\`[language]
    [code content]
    \`\`\`
    
    ## Dependencies
    - [dependency-name]: [version] ([type])
    
    ## Setup
    [setup instructions]
    
    Ensure the code is production-ready, well-commented, and follows best practices for ${stack}.`;
    }
    parseProjectResponse(response, stack) {
        const lines = response.split('\n');
        let currentFile = null;
        const files = [];
        const dependencies = [];
        let setupInstructions = '';
        let projectName = 'Generated Project';
        let description = '';
        let inSetup = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Extract project name and description
            if (line.startsWith('## Project: ')) {
                projectName = line.substring(12).trim();
            }
            else if (line.startsWith('[Description]') && i + 1 < lines.length) {
                description = lines[i + 1].trim();
            }
            // Extract files
            const fileMatch = line.match(/^###\s+(.+)$/);
            if (fileMatch) {
                if (currentFile && currentFile.name && currentFile.content.length > 0) {
                    files.push({
                        name: currentFile.name,
                        content: currentFile.content.join('\n'),
                        language: currentFile.language || this.detectLanguage(currentFile.name),
                        type: this.detectFileType(currentFile.name)
                    });
                }
                currentFile = { name: fileMatch[1].trim(), content: [] };
            }
            // Extract code block
            const codeBlockMatch = line.match(/^```(\w*)$/);
            if (codeBlockMatch && currentFile) {
                currentFile.language = codeBlockMatch[1] || currentFile.language;
                // Collect code until end of block
                i++;
                while (i < lines.length && !lines[i].startsWith('```')) {
                    currentFile.content.push(lines[i]);
                    i++;
                }
            }
            // Extract dependencies
            if (line.startsWith('## Dependencies')) {
                i++;
                while (i < lines.length && lines[i].trim() && !lines[i].startsWith('##')) {
                    const depMatch = lines[i].match(/-\s+([^:]+):\s*([^\s(]+)\s*\(([^)]+)\)/);
                    if (depMatch) {
                        dependencies.push({
                            name: depMatch[1].trim(),
                            version: depMatch[2].trim(),
                            type: depMatch[3].trim().toLowerCase()
                        });
                    }
                    i++;
                }
                i--; // Adjust for loop increment
            }
            // Extract setup instructions
            if (line.startsWith('## Setup')) {
                inSetup = true;
                i++;
                const setupLines = [];
                while (i < lines.length && lines[i].trim() && !lines[i].startsWith('##')) {
                    setupLines.push(lines[i]);
                    i++;
                }
                setupInstructions = setupLines.join('\n');
                i--;
            }
        }
        // Add last file
        if (currentFile && currentFile.name && currentFile.content.length > 0) {
            files.push({
                name: currentFile.name,
                content: currentFile.content.join('\n'),
                language: currentFile.language || this.detectLanguage(currentFile.name),
                type: this.detectFileType(currentFile.name)
            });
        }
        return {
            name: projectName,
            description,
            files,
            dependencies,
            setupInstructions
        };
    }
    detectLanguage(filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'jsx': 'javascript',
            'tsx': 'typescript',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'go': 'go',
            'rs': 'rust',
            'rb': 'ruby',
            'php': 'php',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'json': 'json',
            'yml': 'yaml',
            'yaml': 'yaml',
            'md': 'markdown',
            'sh': 'bash'
        };
        return languageMap[ext || ''] || 'text';
    }
    detectFileType(filename) {
        if (filename.includes('.test.') || filename.includes('.spec.'))
            return 'test';
        if (filename.includes('config') || filename.includes('.env') || filename.includes('.json'))
            return 'config';
        if (filename.includes('util') || filename.includes('helper') || filename.includes('lib'))
            return 'utility';
        return 'component';
    }
    async generateSingleFile(requirements, language, fileName) {
        const prompt = `Generate ${language} code for: ${requirements}
    
    File name: ${fileName}
    
    Requirements:
    1. Production-ready code
    2. Proper error handling
    3. Code comments where necessary
    4. Follow ${language} best practices
    5. Export/import statements if needed
    
    Return only the code without explanations.`;
        const response = await this.gemini.generateContent(prompt, {
            model: 'gemini-2.5-flash',
            temperature: 0.2,
            maxTokens: 4096
        });
        return {
            name: fileName,
            content: response.content,
            language,
            type: this.detectFileType(fileName),
            metadata: {
                confidence: response.confidence,
                tokensUsed: response.tokensUsed
            }
        };
    }
    async generateTests(code, testFramework = 'jest') {
        const prompt = `Generate ${testFramework} tests for the following code:
    
    ${code}
    
    Requirements:
    1. Comprehensive test coverage
    2. Edge cases considered
    3. Mocking where necessary
    4. Follow ${testFramework} best practices
    
    Return the test code only.`;
        const response = await this.gemini.generateContent(prompt, {
            model: 'gemini-2.5-flash',
            temperature: 0.3,
            maxTokens: 4096
        });
        const testFile = {
            name: `test.${this.getTestExtension(testFramework)}`,
            content: response.content,
            language: this.detectLanguage(`test.${this.getTestExtension(testFramework)}`),
            type: 'test',
            metadata: {
                confidence: response.confidence,
                testFramework
            }
        };
        return [testFile];
    }
    getTestExtension(framework) {
        const extensions = {
            'jest': 'js',
            'mocha': 'js',
            'jasmine': 'js',
            'pytest': 'py',
            'unittest': 'py',
            'junit': 'java'
        };
        return extensions[framework.toLowerCase()] || 'js';
    }
}
exports.CodeBuilderAgent = CodeBuilderAgent;
exports.codeBuilderAgent = new CodeBuilderAgent();
