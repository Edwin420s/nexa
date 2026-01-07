import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../server';
import { User } from '../../models/User';
import { Project } from '../../models/Project';
import { getCache } from '../../services/cache';
import { getJobQueue } from '../../services/queue';

// Mock external services
jest.mock('../../services/gemini');
jest.mock('../../services/cache');
jest.mock('../../services/queue');
jest.mock('../../services/file-storage');

describe('API End-to-End Tests', () => {
  let authToken: string;
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/nexa-test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
    await Project.deleteMany({});

    // Clear mocks
    jest.clearAllMocks();

    // Setup cache mock
    const mockCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined)
    };
    (getCache as jest.Mock).mockReturnValue(mockCache);

    // Setup queue mock
    const mockQueue = {
      addProjectExecution: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
      getQueueStats: jest.fn().mockResolvedValue({})
    };
    (getJobQueue as jest.Mock).mockReturnValue(mockQueue);
  });

  describe('Authentication API', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPass123!',
          name: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should login existing user', async () => {
      // First register
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'TestPass123!',
          name: 'Login User'
        });

      // Then login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'TestPass123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      authToken = response.body.data.token;
      userId = response.body.data.user.id;
    });

    it('should get current user profile', async () => {
      // First login to get token
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'profile@example.com',
          password: 'TestPass123!',
          name: 'Profile User'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'profile@example.com',
          password: 'TestPass123!'
        });

      const token = loginResponse.body.data.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('profile@example.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Projects API', () => {
    beforeEach(async () => {
      // Create a test user and get auth token
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'projects@example.com',
          password: 'TestPass123!',
          name: 'Projects User'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'projects@example.com',
          password: 'TestPass123!'
        });

      authToken = loginResponse.body.data.token;
      userId = loginResponse.body.data.user.id;
    });

    it('should create a new project', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Project',
          goal: 'Build a test application using AI agents',
          description: 'This is a test project'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Project');
      expect(response.body.data.user).toBe(userId);
      expect(response.body.data.status).toBe('draft');

      projectId = response.body.data._id;
    });

    it('should list user projects', async () => {
      // Create a project first
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Project 1',
          goal: 'Test goal 1'
        });

      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Project 2',
          goal: 'Test goal 2'
        });

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });

    it('should get a specific project', async () => {
      // Create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Specific Project',
          goal: 'Test specific project'
        });

      const projectId = createResponse.body.data._id;

      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Specific Project');
      expect(response.body.data._id).toBe(projectId);
    });

    it('should update a project', async () => {
      // Create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Update Project',
          goal: 'Test update'
        });

      const projectId = createResponse.body.data._id;

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Project Title',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Project Title');
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should delete a project', async () => {
      // Create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Delete Project',
          goal: 'Test delete'
        });

      const projectId = createResponse.body.data._id;

      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project deleted successfully');

      // Verify project is deleted
      const getResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should start project execution', async () => {
      // Create a project
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Execute Project',
          goal: 'Test execution'
        });

      const projectId = createResponse.body.data._id;

      const response = await request(app)
        .post(`/api/projects/${projectId}/run`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project execution started');
    });
  });

  describe('Agents API', () => {
    beforeEach(async () => {
      // Create a test user and get auth token
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'agents@example.com',
          password: 'TestPass123!',
          name: 'Agents User'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'agents@example.com',
          password: 'TestPass123!'
        });

      authToken = loginResponse.body.data.token;
    });

    it('should execute research agent', async () => {
      // Mock Gemini response
      const mockGemini = require('../../services/gemini');
      mockGemini.getGeminiService.mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          content: 'Research results...',
          confidence: 0.85,
          tokensUsed: 100,
          metadata: {}
        })
      });

      const response = await request(app)
        .post('/api/agents/research')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          topic: 'Artificial Intelligence Trends 2024',
          depth: 'medium'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analysis');
      expect(response.body.data.confidence).toBe(0.85);
    });

    it('should execute code builder agent', async () => {
      // Mock Gemini response
      const mockGemini = require('../../services/gemini');
      mockGemini.getGeminiService.mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          content: 'Code generation results...',
          confidence: 0.9,
          tokensUsed: 200,
          metadata: {}
        })
      });

      const response = await request(app)
        .post('/api/agents/code')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          requirements: 'Create a simple REST API endpoint'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('files');
    });

    it('should list available agents', async () => {
      const response = await request(app)
        .get('/api/agents')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Analytics API', () => {
    beforeEach(async () => {
      // Create a test user and get auth token
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'analytics@example.com',
          password: 'TestPass123!',
          name: 'Analytics User'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'analytics@example.com',
          password: 'TestPass123!'
        });

      authToken = loginResponse.body.data.token;
      userId = loginResponse.body.data.user.id;
    });

    it('should get analytics summary', async () => {
      const response = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('agentStats');
      expect(response.body.data).toHaveProperty('projectStats');
    });

    it('should get analytics timeline', async () => {
      const response = await request(app)
        .get('/api/analytics/timeline?interval=day&limit=7')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          description: 'Missing title and goal'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make multiple rapid requests
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/projects')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429)
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
      
      if (rateLimited.length > 0) {
        expect(rateLimited[0].body.message).toContain('Too many requests');
      }
    });
  });
});