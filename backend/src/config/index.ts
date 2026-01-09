import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';

// Load environment variables
dotenv.config({ 
  path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`)
});

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  MONGODB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  GEMINI_API_KEY: Joi.string().required(),
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
}).unknown();

const { value: envVars, error } = envVarsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: '30d',
  },
  gemini: {
    apiKey: envVars.GEMINI_API_KEY,
  },
  redis: {
    url: envVars.REDIS_URL,
  },
  frontendUrl: envVars.FRONTEND_URL,
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
};
