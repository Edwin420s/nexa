import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.test' });

let mongoServer: MongoMemoryServer;

// Setup test database
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// Clear all test data after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Disconnect and close the database after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Test utilities
export const testUtils = {
  createTestProject: async (data: any = {}) => {
    const Project = (await import('../../models/Project')).default;
    return Project.createProject({
      user: data.user || new mongoose.Types.ObjectId(),
      title: data.title || 'Test Project',
      description: data.description || 'Test Description',
      goal: data.goal || 'Test Goal'
    });
  }
};