import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, `../../.env.${process.env.NODE_ENV || 'development'}`)
});

export default {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};