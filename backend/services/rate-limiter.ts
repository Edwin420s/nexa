import IORedis from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface RateLimitRule {
  key: string;
  limit: number;
  window: number; // in seconds
  message?: string;
}

export interface RateLimitConfig {
  defaultRules: RateLimitRule[];
  redisUrl?: string;
  enabled: boolean;
  skipSuccessfulRequests?: boolean;
  trustProxy?: boolean;
}

export class RateLimiter {
  private redis: IORedis;
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      defaultRules: [
        { key: 'global', limit: 1000, window: 3600, message: 'Too many requests' },
        { key: 'ip', limit: 100, window: 900, message: 'Too many requests from this IP' },
        { key: 'auth', limit: 10, window: 60, message: 'Too many authentication attempts' },
        { key: 'agent', limit: 50, window: 300, message: 'Too many agent requests' }
      ],
      enabled: true,
      skipSuccessfulRequests: false,
      trustProxy: false,
      ...config
    };

    this.redis = new IORedis(this.config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 2,
      enableReadyCheck: false
    });

    this.setupRedisEvents();
  }

  private setupRedisEvents(): void {
    this.redis.on('connect', () => {
      logger.info('Rate limiter Redis connected');
    });

    this.redis.on('error', (error) => {
      logger.error('Rate limiter Redis error:', error);
    });
  }

  private getClientIdentifier(req: Request): string {
    let identifier = 'anonymous';
    
    if (req.user?.id) {
      identifier = `user:${req.user.id}`;
    } else if (req.ip) {
      identifier = `ip:${req.ip}`;
    }
    
    return identifier;
  }

  private getKey(ruleKey: string, identifier: string, req: Request): string {
    const now = Math.floor(Date.now() / 1000);
    const window = Math.floor(now / 60); // Minute-based window for granularity
    
    switch (ruleKey) {
      case 'global':
        return `rate-limit:global:${window}`;
      case 'ip':
        return `rate-limit:ip:${identifier}:${window}`;
      case 'auth':
        return `rate-limit:auth:${identifier}:${window}`;
      case 'agent':
        const agentName = req.path.includes('/agents/') ? req.path.split('/').pop() : 'default';
        return `rate-limit:agent:${agentName}:${identifier}:${window}`;
      case 'endpoint':
        return `rate-limit:endpoint:${req.method}:${req.path}:${identifier}:${window}`;
      default:
        return `rate-limit:${ruleKey}:${identifier}:${window}`;
    }
  }

  async checkLimit(
    req: Request,
    rules?: RateLimitRule[]
  ): Promise<{ allowed: boolean; remaining: number; reset: number; limit: number; ruleKey: string }> {
    if (!this.config.enabled) {
      return {
        allowed: true,
        remaining: Number.MAX_SAFE_INTEGER,
        reset: 0,
        limit: Number.MAX_SAFE_INTEGER,
        ruleKey: 'disabled'
      };
    }

    const identifier = this.getClientIdentifier(req);
    const effectiveRules = rules || this.config.defaultRules;
    
    for (const rule of effectiveRules) {
      const key = this.getKey(rule.key, identifier, req);
      const now = Math.floor(Date.now() / 1000);
      
      try {
        // Use Redis pipeline for efficiency
        const pipeline = this.redis.pipeline();
        pipeline.incr(key);
        pipeline.expire(key, rule.window);
        
        const results = await pipeline.exec();
        if (!results) continue;
        
        const count = results[0][1] as number;
        
        if (count > rule.limit) {
          // Get TTL for reset time
          const ttl = await this.redis.ttl(key);
          const reset = now + (ttl > 0 ? ttl : rule.window);
          
          return {
            allowed: false,
            remaining: Math.max(0, rule.limit - count),
            reset,
            limit: rule.limit,
            ruleKey: rule.key
          };
        }
        
        // Check if this is the first request in the window
        if (count === 1) {
          return {
            allowed: true,
            remaining: rule.limit - 1,
            reset: now + rule.window,
            limit: rule.limit,
            ruleKey: rule.key
          };
        }
      } catch (error) {
        logger.error(`Rate limit check error for rule ${rule.key}:`, error);
        // On Redis error, allow the request
        return {
          allowed: true,
          remaining: Number.MAX_SAFE_INTEGER,
          reset: 0,
          limit: Number.MAX_SAFE_INTEGER,
          ruleKey: 'error'
        };
      }
    }
    
    // All rules passed
    return {
      allowed: true,
      remaining: Number.MAX_SAFE_INTEGER,
      reset: 0,
      limit: Number.MAX_SAFE_INTEGER,
      ruleKey: 'passed'
    };
  }

  middleware(rules?: RateLimitRule[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const result = await this.checkLimit(req, rules);
      
      if (!result.allowed) {
        const rule = (rules || this.config.defaultRules).find(r => r.key === result.ruleKey);
        const message = rule?.message || 'Too many requests';
        
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', result.limit);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', result.reset);
        res.setHeader('Retry-After', result.reset);
        
        return res.status(429).json({
          success: false,
          message,
          retryAfter: result.reset,
          limit: result.limit,
          remaining: result.remaining
        });
      }
      
      // Set rate limit headers for successful requests
      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.reset);
      
      // Skip incrementing for successful requests if configured
      if (this.config.skipSuccessfulRequests && res.statusCode >= 200 && res.statusCode < 300) {
        return next();
      }
      
      next();
    };
  }

  async getStats(identifier?: string): Promise<any> {
    const now = Math.floor(Date.now() / 1000);
    const window = Math.floor(now / 60);
    
    const keys = await this.redis.keys(`rate-limit:*:${window}`);
    const stats: Record<string, any> = {};
    
    for (const key of keys) {
      const count = await this.redis.get(key);
      const ttl = await this.redis.ttl(key);
      
      // Parse key to get details
      const parts = key.split(':');
      if (parts.length >= 3) {
        const ruleKey = parts[1];
        const id = parts[2] || 'global';
        
        if (!stats[ruleKey]) {
          stats[ruleKey] = {};
        }
        
        if (!stats[ruleKey][id]) {
          stats[ruleKey][id] = [];
        }
        
        stats[ruleKey][id].push({
          count: parseInt(count || '0'),
          ttl,
          key
        });
      }
    }
    
    return {
      timestamp: new Date().toISOString(),
      totalKeys: keys.length,
      stats
    };
  }

  async resetLimit(key: string): Promise<void> {
    const pattern = `rate-limit:${key}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
      logger.info(`Reset rate limit for pattern: ${pattern}, keys: ${keys.length}`);
    }
  }

  async resetAll(): Promise<void> {
    const keys = await this.redis.keys('rate-limit:*');
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
      logger.info(`Reset all rate limits, keys: ${keys.length}`);
    }
  }

  async updateRule(ruleKey: string, updates: Partial<RateLimitRule>): Promise<void> {
    const index = this.config.defaultRules.findIndex(r => r.key === ruleKey);
    if (index !== -1) {
      this.config.defaultRules[index] = {
        ...this.config.defaultRules[index],
        ...updates
      };
    }
  }

  addRule(rule: RateLimitRule): void {
    this.config.defaultRules.push(rule);
  }

  removeRule(ruleKey: string): void {
    this.config.defaultRules = this.config.defaultRules.filter(r => r.key !== ruleKey);
  }

  getRules(): RateLimitRule[] {
    return [...this.config.defaultRules];
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Rate limiter health check failed:', error);
      return false;
    }
  }

  disconnect(): void {
    this.redis.disconnect();
    logger.info('Rate limiter Redis disconnected');
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

// Express middleware factory
export function rateLimitMiddleware(rules?: RateLimitRule[]) {
  const limiter = getRateLimiter();
  return limiter.middleware(rules);
}