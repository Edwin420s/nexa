import Redis from 'ioredis';
import logger from '../utils/logger';

let redisClient: Redis;

export const initRedis = (url = process.env.REDIS_URL) => {
  if (!url) {
    throw new Error('REDIS_URL is not defined');
  }
  
  redisClient = new Redis(url, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redisClient.on('connect', () => {
    logger.info('Connected to Redis');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis error:', err);
  });

  return redisClient;
};

export const getRedisClient = () => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

export const cache = {
  get: async (key: string) => {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  },
  set: async (key: string, value: any, ttl?: number) => {
    const client = getRedisClient();
    const stringValue = JSON.stringify(value);
    if (ttl) {
      return client.setex(key, ttl, stringValue);
    }
    return client.set(key, stringValue);
  },
  delete: async (key: string) => {
    const client = getRedisClient();
    return client.del(key);
  },
  clear: async (pattern: string) => {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      return client.del(...keys);
    }
    return 0;
  },
};