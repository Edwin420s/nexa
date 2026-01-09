import IORedis from 'ioredis';
import logger from '../utils/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  serialize?: boolean;
}

export class CacheService {
  private client: IORedis;
  private defaultTTL: number = 3600; // 1 hour
  private prefix: string = 'nexa:';

  constructor() {
    this.client = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis cache connected');
    });

    this.client.on('error', (error) => {
      logger.error('Redis cache error:', error);
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis cache reconnecting...');
    });

    this.client.on('end', () => {
      logger.warn('Redis cache connection ended');
    });
  }

  private getKey(key: string, prefix?: string): string {
    return `${prefix || this.prefix}${key}`;
  }

  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const cacheKey = this.getKey(key, options.prefix);
      const ttl = options.ttl || this.defaultTTL;
      
      let valueToStore: string;
      if (options.serialize === false && typeof value === 'string') {
        valueToStore = value;
      } else {
        valueToStore = JSON.stringify(value);
      }

      if (ttl > 0) {
        await this.client.setex(cacheKey, ttl, valueToStore);
      } else {
        await this.client.set(cacheKey, valueToStore);
      }

      logger.debug(`Cache set: ${cacheKey}, ttl: ${ttl}s`);
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      // Don't throw - caching should be fail-safe
    }
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.getKey(key, options.prefix);
      const value = await this.client.get(cacheKey);

      if (!value) {
        return null;
      }

      let parsedValue: any = value;
      if (options.serialize !== false) {
        try {
          parsedValue = JSON.parse(value);
        } catch {
          // If parsing fails, return as string
          parsedValue = value;
        }
      }

      logger.debug(`Cache hit: ${cacheKey}`);
      return parsedValue as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, options);
    
    return value;
  }

  async del(key: string, prefix?: string): Promise<void> {
    try {
      const cacheKey = this.getKey(key, prefix);
      await this.client.del(cacheKey);
      logger.debug(`Cache deleted: ${cacheKey}`);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(this.getKey(pattern));
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.debug(`Cache deleted pattern: ${pattern}, keys: ${keys.length}`);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  async exists(key: string, prefix?: string): Promise<boolean> {
    try {
      const cacheKey = this.getKey(key, prefix);
      const result = await this.client.exists(cacheKey);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string, prefix?: string): Promise<number> {
    try {
      const cacheKey = this.getKey(key, prefix);
      const result = await this.client.ttl(cacheKey);
      return result;
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      return -2; // Key doesn't exist
    }
  }

  async expire(key: string, ttl: number, prefix?: string): Promise<void> {
    try {
      const cacheKey = this.getKey(key, prefix);
      await this.client.expire(cacheKey, ttl);
      logger.debug(`Cache expire set: ${cacheKey}, ttl: ${ttl}s`);
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
    }
  }

  async incr(key: string, amount: number = 1, options: CacheOptions = {}): Promise<number> {
    try {
      const cacheKey = this.getKey(key, options.prefix);
      const result = await this.client.incrby(cacheKey, amount);
      
      // Set TTL if this is a new key
      const ttl = await this.client.ttl(cacheKey);
      if (ttl === -1 && options.ttl) {
        await this.client.expire(cacheKey, options.ttl);
      }
      
      return result;
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      throw error;
    }
  }

  async hset(
    key: string,
    field: string,
    value: any,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const cacheKey = this.getKey(key, options.prefix);
      const valueToStore = options.serialize === false && typeof value === 'string'
        ? value
        : JSON.stringify(value);
      
      await this.client.hset(cacheKey, field, valueToStore);
      
      if (options.ttl) {
        await this.client.expire(cacheKey, options.ttl);
      }
      
      logger.debug(`Cache hset: ${cacheKey}.${field}`);
    } catch (error) {
      logger.error(`Cache hset error for key ${key}.${field}:`, error);
    }
  }

  async hget<T>(key: string, field: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.getKey(key, options.prefix);
      const value = await this.client.hget(cacheKey, field);
      
      if (!value) {
        return null;
      }
      
      let parsedValue: any = value;
      if (options.serialize !== false) {
        try {
          parsedValue = JSON.parse(value);
        } catch {
          parsedValue = value;
        }
      }
      
      return parsedValue as T;
    } catch (error) {
      logger.error(`Cache hget error for key ${key}.${field}:`, error);
      return null;
    }
  }

  async hgetall(key: string, prefix?: string): Promise<Record<string, any>> {
    try {
      const cacheKey = this.getKey(key, prefix);
      const result = await this.client.hgetall(cacheKey);
      
      const parsed: Record<string, any> = {};
      for (const [field, value] of Object.entries(result)) {
        try {
          parsed[field] = JSON.parse(value);
        } catch {
          parsed[field] = value;
        }
      }
      
      return parsed;
    } catch (error) {
      logger.error(`Cache hgetall error for key ${key}:`, error);
      return {};
    }
  }

  async sadd(key: string, members: string[], options: CacheOptions = {}): Promise<void> {
    try {
      const cacheKey = this.getKey(key, options.prefix);
      await this.client.sadd(cacheKey, ...members);
      
      if (options.ttl) {
        await this.client.expire(cacheKey, options.ttl);
      }
    } catch (error) {
      logger.error(`Cache sadd error for key ${key}:`, error);
    }
  }

  async smembers(key: string, prefix?: string): Promise<string[]> {
    try {
      const cacheKey = this.getKey(key, prefix);
      return await this.client.smembers(cacheKey);
    } catch (error) {
      logger.error(`Cache smembers error for key ${key}:`, error);
      return [];
    }
  }

  async sismember(key: string, member: string, prefix?: string): Promise<boolean> {
    try {
      const cacheKey = this.getKey(key, prefix);
      const result = await this.client.sismember(cacheKey, member);
      return result === 1;
    } catch (error) {
      logger.error(`Cache sismember error for key ${key}:`, error);
      return false;
    }
  }

  async flush(prefix?: string): Promise<void> {
    try {
      const pattern = prefix ? this.getKey('*', prefix) : this.getKey('*');
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.info(`Cache flushed: ${keys.length} keys removed`);
      }
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return false;
    }
  }

  async getStats(): Promise<any> {
    try {
      const info = await this.client.info();
      const lines = info.split('\r\n');
      const stats: Record<string, any> = {};
      
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          if (key && value) {
            stats[key.trim()] = value.trim();
          }
        }
      }
      
      return {
        connected: true,
        ...stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        connected: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      };
    }
  }

  disconnect(): void {
    this.client.disconnect();
    logger.info('Redis cache disconnected');
  }
}

// Singleton instance
let cacheInstance: CacheService;

export function getCache(): CacheService {
  if (!cacheInstance) {
    cacheInstance = new CacheService();
  }
  return cacheInstance;
}

// Cache decorator for methods
export function Cache(options: CacheOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cacheService = getCache();
    
    descriptor.value = async function (...args: any[]) {
      // Generate cache key from method name and arguments
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      
      // Try to get from cache
      const cached = await cacheService.get(cacheKey, options);
      if (cached !== null) {
        return cached;
      }
      
      // Execute original method
      const result = await originalMethod.apply(this, args);
      
      // Store in cache
      await cacheService.set(cacheKey, result, options);
      
      return result;
    };
    
    return descriptor;
  };
}

// Cache invalidation decorator
export function CacheInvalidate(pattern: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cacheService = getCache();
    
    descriptor.value = async function (...args: any[]) {
      // Execute original method
      const result = await originalMethod.apply(this, args);
      
      // Invalidate cache
      await cacheService.delPattern(pattern);
      
      return result;
    };
    
    return descriptor;
  };
}