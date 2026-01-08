import { createServer } from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { config } from 'dotenv';
import { AddressInfo } from 'net';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Load test environment variables
config({ path: '.env.test' });

let mongoServer: MongoMemoryServer;
let httpServer: ReturnType<typeof createServer>;
let io: Server;

export const setupTestServer = async () => {
  // Set up in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  
  // Import server after setting up environment
  const { default: app } = await import('../../server');
  
  // Set up HTTP server
  httpServer = createServer(app);
  io = new Server(httpServer);
  
  // Start server on random port
  await new Promise<void>((resolve) => {
    httpServer.listen(0, () => resolve());
  });
  
  const address = httpServer.address() as AddressInfo;
  const baseUrl = `http://localhost:${address.port}`;
  
  return {
    baseUrl,
    httpServer,
    io,
    close: async () => {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
      await mongoose.connection.close();
      await mongoServer.stop();
    }
  };
};