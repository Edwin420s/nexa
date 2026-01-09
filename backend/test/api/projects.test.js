"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const test_server_1 = require("../test-utils/test-server");
describe('Projects API', () => {
    let server;
    let authToken;
    beforeAll(async () => {
        server = await (0, test_server_1.setupTestServer)();
        // Create a test user and get auth token
        const res = await (0, supertest_1.default)(server.baseUrl)
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
            const res = await (0, supertest_1.default)(server.baseUrl)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send(projectData);
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body.title).toBe(projectData.title);
            expect(res.body.status).toBe('draft');
        });
        it('should return 401 without authentication', async () => {
            const res = await (0, supertest_1.default)(server.baseUrl)
                .post('/api/projects')
                .send({ title: 'Test' });
            expect(res.status).toBe(401);
        });
    });
    // Add more test cases for other endpoints...
});
