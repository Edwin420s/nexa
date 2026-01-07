import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

let mongod: MongoMemoryServer;

// Global setup
beforeAll(async () => {
  // Start MongoDB memory server
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  // Override MongoDB URI for tests
  process.env.MONGODB_URI = uri;
  
  // Connect to MongoDB
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.GEMINI_API_KEY = 'test-gemini-key';
});

// Global teardown
afterAll(async () => {
  // Disconnect from MongoDB
  await mongoose.disconnect();
  
  // Stop MongoDB memory server
  if (mongod) {
    await mongod.stop();
  }
  
  // Clear environment variables
  delete process.env.MONGODB_URI;
  delete process.env.NODE_ENV;
});

// Clear database between tests
beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

// Mock console methods in tests
global.console = {
  ...console,
  // Keep log for debugging tests
  // error: jest.fn(),
  // warn: jest.fn(),
  // info: jest.fn(),
  // debug: jest.fn(),
};

// Mock timers
jest.useFakeTimers();

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    incrby: jest.fn().mockResolvedValue(1),
    hset: jest.fn().mockResolvedValue(1),
    hget: jest.fn().mockResolvedValue(null),
    hgetall: jest.fn().mockResolvedValue({}),
    sadd: jest.fn().mockResolvedValue(1),
    smembers: jest.fn().mockResolvedValue([]),
    sismember: jest.fn().mockResolvedValue(0),
    keys: jest.fn().mockResolvedValue([])
  }))
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    verify: jest.fn().mockImplementation((callback) => callback(null, true))
  }))
}));

// Mock Google Gemini API
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn().mockResolvedValue({
        text: 'Mocked Gemini response',
        candidates: [{
          content: {
            parts: [{ text: 'Mocked Gemini response' }]
          }
        }]
      })
    }
  }))
}));

// Mock file system operations
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue('file content'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
  access: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({ size: 1024, mtime: new Date() }),
  readdir: jest.fn().mockResolvedValue([]),
  rmdir: jest.fn().mockResolvedValue(undefined)
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock JSON Web Token
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ id: 'mock-user-id', email: 'test@example.com' }),
  decode: jest.fn().mockReturnValue({ id: 'mock-user-id' })
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid')
}));

// Mock socket.io
jest.mock('socket.io', () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      close: jest.fn()
    }))
  };
});

// Mock Bull queue
jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    getJob: jest.fn().mockResolvedValue(null),
    getJobCounts: jest.fn().mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0
    }),
    clean: jest.fn().mockResolvedValue(undefined)
  }));
});

// Set global test timeout
jest.setTimeout(30000);

// Export test utilities
export const testUtils = {
  createTestUser: async (userData = {}) => {
    const User = require('../models/User').User;
    return await User.create({
      email: 'test@example.com',
      password: 'TestPass123!',
      name: 'Test User',
      ...userData
    });
  },
  
  createTestProject: async (userId, projectData = {}) => {
    const Project = require('../models/Project').Project;
    return await Project.create({
      user: userId,
      title: 'Test Project',
      goal: 'Test project goal',
      ...projectData
    });
  },
  
  getAuthToken: (userId = 'test-user-id') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { id: userId, email: 'test@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  }
};