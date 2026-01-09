"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
exports.getCache = getCache;
exports.Cache = Cache;
exports.CacheInvalidate = CacheInvalidate;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("../utils/logger"));
class CacheService {
    constructor() {
        this.defaultTTL = 3600; // 1 hour
        this.prefix = 'nexa:';
        this.client = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: 3,
            enableReadyCheck: false,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.on('connect', () => {
            logger_1.default.info('Redis cache connected');
        });
        this.client.on('error', (error) => {
            logger_1.default.error('Redis cache error:', error);
        });
        this.client.on('reconnecting', () => {
            logger_1.default.info('Redis cache reconnecting...');
        });
        this.client.on('end', () => {
            logger_1.default.warn('Redis cache connection ended');
        });
    }
    getKey(key, prefix) {
        return `${prefix || this.prefix}${key}`;
    }
    async set(key, value, options = {}) {
        try {
            const cacheKey = this.getKey(key, options.prefix);
            const ttl = options.ttl || this.defaultTTL;
            let valueToStore;
            if (options.serialize === false && typeof value === 'string') {
                valueToStore = value;
            }
            else {
                valueToStore = JSON.stringify(value);
            }
            if (ttl > 0) {
                await this.client.setex(cacheKey, ttl, valueToStore);
            }
            else {
                await this.client.set(cacheKey, valueToStore);
            }
            logger_1.default.debug(`Cache set: ${cacheKey}, ttl: ${ttl}s`);
        }
        catch (error) {
            logger_1.default.error(`Cache set error for key ${key}:`, error);
            // Don't throw - caching should be fail-safe
        }
    }
    async get(key, options = {}) {
        try {
            const cacheKey = this.getKey(key, options.prefix);
            const value = await this.client.get(cacheKey);
            if (!value) {
                return null;
            }
            let parsedValue = value;
            if (options.serialize !== false) {
                try {
                    parsedValue = JSON.parse(value);
                }
                catch {
                    // If parsing fails, return as string
                    parsedValue = value;
                }
            }
            logger_1.default.debug(`Cache hit: ${cacheKey}`);
            return parsedValue;
        }
        catch (error) {
            logger_1.default.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }
    async getOrSet(key, fetchFn, options = {}) {
        const cached = await this.get(key, options);
        if (cached !== null) {
            return cached;
        }
        const value = await fetchFn();
        await this.set(key, value, options);
        return value;
    }
    async del(key, prefix) {
        try {
            const cacheKey = this.getKey(key, prefix);
            await this.client.del(cacheKey);
            logger_1.default.debug(`Cache deleted: ${cacheKey}`);
        }
        catch (error) {
            logger_1.default.error(`Cache delete error for key ${key}:`, error);
        }
    }
    async delPattern(pattern) {
        try {
            const keys = await this.client.keys(this.getKey(pattern));
            if (keys.length > 0) {
                await this.client.del(...keys);
                logger_1.default.debug(`Cache deleted pattern: ${pattern}, keys: ${keys.length}`);
            }
        }
        catch (error) {
            logger_1.default.error(`Cache delete pattern error for ${pattern}:`, error);
        }
    }
    async exists(key, prefix) {
        try {
            const cacheKey = this.getKey(key, prefix);
            const result = await this.client.exists(cacheKey);
            return result === 1;
        }
        catch (error) {
            logger_1.default.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    }
    async ttl(key, prefix) {
        try {
            const cacheKey = this.getKey(key, prefix);
            const result = await this.client.ttl(cacheKey);
            return result;
        }
        catch (error) {
            logger_1.default.error(`Cache TTL error for key ${key}:`, error);
            return -2; // Key doesn't exist
        }
    }
    async expire(key, ttl, prefix) {
        try {
            const cacheKey = this.getKey(key, prefix);
            await this.client.expire(cacheKey, ttl);
            logger_1.default.debug(`Cache expire set: ${cacheKey}, ttl: ${ttl}s`);
        }
        catch (error) {
            logger_1.default.error(`Cache expire error for key ${key}:`, error);
        }
    }
    async incr(key, amount = 1, options = {}) {
        try {
            const cacheKey = this.getKey(key, options.prefix);
            const result = await this.client.incrby(cacheKey, amount);
            // Set TTL if this is a new key
            const ttl = await this.client.ttl(cacheKey);
            if (ttl === -1 && options.ttl) {
                await this.client.expire(cacheKey, options.ttl);
            }
            return result;
        }
        catch (error) {
            logger_1.default.error(`Cache increment error for key ${key}:`, error);
            throw error;
        }
    }
    async hset(key, field, value, options = {}) {
        try {
            const cacheKey = this.getKey(key, options.prefix);
            const valueToStore = options.serialize === false && typeof value === 'string'
                ? value
                : JSON.stringify(value);
            await this.client.hset(cacheKey, field, valueToStore);
            if (options.ttl) {
                await this.client.expire(cacheKey, options.ttl);
            }
            logger_1.default.debug(`Cache hset: ${cacheKey}.${field}`);
        }
        catch (error) {
            logger_1.default.error(`Cache hset error for key ${key}.${field}:`, error);
        }
    }
    async hget(key, field, options = {}) {
        try {
            const cacheKey = this.getKey(key, options.prefix);
            const value = await this.client.hget(cacheKey, field);
            if (!value) {
                return null;
            }
            let parsedValue = value;
            if (options.serialize !== false) {
                try {
                    parsedValue = JSON.parse(value);
                }
                catch {
                    parsedValue = value;
                }
            }
            return parsedValue;
        }
        catch (error) {
            logger_1.default.error(`Cache hget error for key ${key}.${field}:`, error);
            return null;
        }
    }
    async hgetall(key, prefix) {
        try {
            const cacheKey = this.getKey(key, prefix);
            const result = await this.client.hgetall(cacheKey);
            const parsed = {};
            for (const [field, value] of Object.entries(result)) {
                try {
                    parsed[field] = JSON.parse(value);
                }
                catch {
                    parsed[field] = value;
                }
            }
            return parsed;
        }
        catch (error) {
            logger_1.default.error(`Cache hgetall error for key ${key}:`, error);
            return {};
        }
    }
    async sadd(key, members, options = {}) {
        try {
            const cacheKey = this.getKey(key, options.prefix);
            await this.client.sadd(cacheKey, ...members);
            if (options.ttl) {
                await this.client.expire(cacheKey, options.ttl);
            }
        }
        catch (error) {
            logger_1.default.error(`Cache sadd error for key ${key}:`, error);
        }
    }
    async smembers(key, prefix) {
        try {
            const cacheKey = this.getKey(key, prefix);
            return await this.client.smembers(cacheKey);
        }
        catch (error) {
            logger_1.default.error(`Cache smembers error for key ${key}:`, error);
            return [];
        }
    }
    async sismember(key, member, prefix) {
        try {
            const cacheKey = this.getKey(key, prefix);
            const result = await this.client.sismember(cacheKey, member);
            return result === 1;
        }
        catch (error) {
            logger_1.default.error(`Cache sismember error for key ${key}:`, error);
            return false;
        }
    }
    async flush(prefix) {
        try {
            const pattern = prefix ? this.getKey('*', prefix) : this.getKey('*');
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
                logger_1.default.info(`Cache flushed: ${keys.length} keys removed`);
            }
        }
        catch (error) {
            logger_1.default.error('Cache flush error:', error);
        }
    }
    async healthCheck() {
        try {
            await this.client.ping();
            return true;
        }
        catch (error) {
            logger_1.default.error('Cache health check failed:', error);
            return false;
        }
    }
    async getStats() {
        try {
            const info = await this.client.info();
            const lines = info.split('\r\n');
            const stats = {};
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
        }
        catch (error) {
            return {
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    disconnect() {
        this.client.disconnect();
        logger_1.default.info('Redis cache disconnected');
    }
}
exports.CacheService = CacheService;
// Singleton instance
let cacheInstance;
function getCache() {
    if (!cacheInstance) {
        cacheInstance = new CacheService();
    }
    return cacheInstance;
}
// Cache decorator for methods
function Cache(options = {}) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const cacheService = getCache();
        descriptor.value = async function (...args) {
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
function CacheInvalidate(pattern) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const cacheService = getCache();
        descriptor.value = async function (...args) {
            // Execute original method
            const result = await originalMethod.apply(this, args);
            // Invalidate cache
            await cacheService.delPattern(pattern);
            return result;
        };
        return descriptor;
    };
}
