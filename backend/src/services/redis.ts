import Redis from 'ioredis';
import logger from '../utils/logger';

let redisClient: Redis | null = null;

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false
};

export const initializeRedis = async (): Promise<Redis> => {
  try {
    redisClient = new Redis(REDIS_CONFIG);

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redisClient.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });

    // Test connection
    await redisClient.ping();
    logger.info('Redis connection test successful');

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    throw error;
  }
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
};

// Cache helper functions
export const cacheGet = async (key: string): Promise<string | null> => {
  try {
    const client = getRedisClient();
    return await client.get(key);
  } catch (error) {
    logger.error(`Error getting cache key ${key}:`, error);
    return null;
  }
};

export const cacheSet = async (
  key: string,
  value: string,
  expirySeconds?: number
): Promise<boolean> => {
  try {
    const client = getRedisClient();
    if (expirySeconds) {
      await client.setex(key, expirySeconds, value);
    } else {
      await client.set(key, value);
    }
    return true;
  } catch (error) {
    logger.error(`Error setting cache key ${key}:`, error);
    return false;
  }
};

export const cacheDelete = async (key: string): Promise<boolean> => {
  try {
    const client = getRedisClient();
    await client.del(key);
    return true;
  } catch (error) {
    logger.error(`Error deleting cache key ${key}:`, error);
    return false;
  }
};

export const cacheExists = async (key: string): Promise<boolean> => {
  try {
    const client = getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error(`Error checking cache key ${key}:`, error);
    return false;
  }
};

export const cacheExpire = async (key: string, seconds: number): Promise<boolean> => {
  try {
    const client = getRedisClient();
    await client.expire(key, seconds);
    return true;
  } catch (error) {
    logger.error(`Error setting expiry for cache key ${key}:`, error);
    return false;
  }
};

// Session management
export const setSession = async (
  sessionId: string,
  data: Record<string, any>,
  expirySeconds: number = 3600
): Promise<boolean> => {
  return cacheSet(`session:${sessionId}`, JSON.stringify(data), expirySeconds);
};

export const getSession = async (sessionId: string): Promise<Record<string, any> | null> => {
  const data = await cacheGet(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
};

export const deleteSession = async (sessionId: string): Promise<boolean> => {
  return cacheDelete(`session:${sessionId}`);
};