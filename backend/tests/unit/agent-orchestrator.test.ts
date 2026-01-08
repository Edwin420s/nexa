import { AgentOrchestrator } from '../../src/agent-orchestrator/orchestrator';
import { Project } from '../../src/models/Project';

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
  });

  describe('generateTasksFromProject', () => {
    it('should generate tasks based on project configuration', () => {
      const mockProject = {
        goal: 'Test Project',
        agents: [
          { name: 'researcher', model: 'gemini-pro' },
          { name: 'summarizer', model: 'gemini-pro' }
        ]
      } as unknown as Project;

      const tasks = orchestrator['generateTasksFromProject'](mockProject);
      
      expect(tasks).toHaveLength(2);
      expect(tasks[0].agentName).toBe('researcher');
      expect(tasks[1].agentName).toBe('summarizer');
    });
  });

  // Add more test cases as needed
});