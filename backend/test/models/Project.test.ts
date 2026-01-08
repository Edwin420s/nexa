import { testUtils } from '../test-utils/setup';
import { Types } from 'mongoose';

describe('Project Model', () => {
  describe('createProject', () => {
    it('should create a new project with default values', async () => {
      const project = await testUtils.createTestProject();
      
      expect(project).toHaveProperty('_id');
      expect(project.status).toBe('draft');
      expect(project.settings.streaming).toBe(true);
      expect(project.analytics.confidenceScore).toBe(0);
    });

    it('should create a project with custom values', async () => {
      const userId = new Types.ObjectId();
      const project = await testUtils.createTestProject({
        user: userId,
        title: 'Custom Project',
        description: 'Custom Description',
        goal: 'Custom Goal'
      });

      expect(project.user.toString()).toBe(userId.toString());
      expect(project.title).toBe('Custom Project');
      expect(project.description).toBe('Custom Description');
      expect(project.goal).toBe('Custom Goal');
    });
  });

  describe('addAgent', () => {
    it('should add an agent to the project', async () => {
      const project = await testUtils.createTestProject();
      await project.addAgent({
        name: 'researcher',
        model: 'gemini-2.5-flash'
      });

      expect(project.agents).toHaveLength(1);
      expect(project.agents[0].name).toBe('researcher');
      expect(project.agents[0].status).toBe('idle');
    });
  });

  // Add more test cases for other methods...
});