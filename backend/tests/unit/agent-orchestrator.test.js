"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const orchestrator_1 = require("../../src/agent-orchestrator/orchestrator");
describe('AgentOrchestrator', () => {
    let orchestrator;
    beforeEach(() => {
        orchestrator = new orchestrator_1.AgentOrchestrator();
    });
    describe('generateTasksFromProject', () => {
        it('should generate tasks based on project configuration', () => {
            const mockProject = {
                goal: 'Test Project',
                agents: [
                    { name: 'researcher', model: 'gemini-pro' },
                    { name: 'summarizer', model: 'gemini-pro' }
                ]
            };
            const tasks = orchestrator['generateTasksFromProject'](mockProject);
            expect(tasks).toHaveLength(2);
            expect(tasks[0].agentName).toBe('researcher');
            expect(tasks[1].agentName).toBe('summarizer');
        });
    });
    // Add more test cases as needed
});
