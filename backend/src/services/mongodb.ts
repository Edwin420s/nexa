// services/mongodb.ts
import mongoose, { ConnectOptions } from 'mongoose';
import logger from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
    
    const options: ConnectOptions = {
      autoIndex: process.env.NODE_ENV !== 'production', // Don't build indexes in production
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };

    await mongoose.connect(mongoURI, options);
    
    logger.info('MongoDB connected successfully');
    
    // Connection events
    mongoose.connection.on('error', (err: Error) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('MongoDB connection failed:', errorMessage);
    // Exit process with failure
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting MongoDB:', error);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

export const db = mongoose.connection;