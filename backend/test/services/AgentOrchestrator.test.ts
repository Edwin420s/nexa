import { AgentOrchestrator, OrchestratorEvents } from '../../agent-orchestrator/orchestrator';
import { testUtils } from '../test-utils/setup';

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator({
      maxConcurrentAgents: 2,
      confidenceThreshold: 0.7,
      maxIterations: 3,
      timeoutMs: 30000
    });
  });

  describe('executeProject', () => {
    it('should execute a project with agents', async () => {
      const project = await testUtils.createTestProject();
      await project.addAgent({
        name: 'researcher',
        model: 'gemini-2.5-flash'
      });

      const events: any[] = [];
      orchestrator.on('*', (event, data) => {
        events.push({ event, data });
      });

      await orchestrator.executeProject(project._id.toString());

      const projectAfter = await testUtils.getProject(project._id);
      expect(projectAfter.status).toBe('completed');
      expect(events.some(e => e.event === 'TASK_COMPLETED')).toBe(true);
    });

    it('should handle agent failures', async () => {
      const project = await testUtils.createTestProject();
      await project.addAgent({
        name: 'researcher',
        model: 'invalid-model'
      });

      await expect(
        orchestrator.executeProject(project._id.toString())
      ).rejects.toThrow();
    });
  });
});