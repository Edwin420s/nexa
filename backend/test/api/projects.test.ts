import request from 'supertest';
import { setupTestServer } from '../test-utils/test-server';
import { testUtils } from '../test-utils/setup';

describe('Projects API', () => {
  let server: Awaited<ReturnType<typeof setupTestServer>>;
  let authToken: string;

  beforeAll(async () => {
    server = await setupTestServer();
    
    // Create a test user and get auth token
    const res = await request(server.baseUrl)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    
    authToken = res.body.token;
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const projectData = {
        title: 'Test Project',
        description: 'Test Description',
        goal: 'Test Goal'
      };

      const res = await request(server.baseUrl)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.title).toBe(projectData.title);
      expect(res.body.status).toBe('draft');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(server.baseUrl)
        .post('/api/projects')
        .send({ title: 'Test' });
      
      expect(res.status).toBe(401);
    });
  });

  // Add more test cases for other endpoints...
});