"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const orchestrator_1 = require("../../agent-orchestrator/orchestrator");
const setup_1 = require("../test-utils/setup");
describe('AgentOrchestrator', () => {
    let orchestrator;
    beforeEach(() => {
        orchestrator = new orchestrator_1.AgentOrchestrator({
            maxConcurrentAgents: 2,
            confidenceThreshold: 0.7,
            maxIterations: 3,
            timeoutMs: 30000
        });
    });
    describe('executeProject', () => {
        it('should execute a project with agents', async () => {
            const project = await setup_1.testUtils.createTestProject();
            await project.addAgent({
                name: 'researcher',
                model: 'gemini-2.5-flash'
            });
            const events = [];
            orchestrator.on('*', (event, data) => {
                events.push({ event, data });
            });
            await orchestrator.executeProject(project._id.toString());
            const projectAfter = await setup_1.testUtils.getProject(project._id);
            expect(projectAfter.status).toBe('completed');
            expect(events.some(e => e.event === 'TASK_COMPLETED')).toBe(true);
        });
        it('should handle agent failures', async () => {
            const project = await setup_1.testUtils.createTestProject();
            await project.addAgent({
                name: 'researcher',
                model: 'invalid-model'
            });
            await expect(orchestrator.executeProject(project._id.toString())).rejects.toThrow();
        });
    });
});
