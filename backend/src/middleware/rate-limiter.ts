import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { getRedisClient } from '../services/redis';
import logger from '../utils/logger';

const rateLimiter = new RateLimiterRedis({
  storeClient: getRedisClient(),
  keyPrefix: 'rate_limit',
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
  blockDuration: 60 * 15, // block for 15 minutes if exceeded
});

export const rateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use IP address as the identifier
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    await rateLimiter.consume(clientIp);
    next();
  } catch (error) {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
    });
  }
};

// More specific rate limiter for authentication routes
export const authRateLimiter = new RateLimiterRedis({
  storeClient: getRedisClient(),
  keyPrefix: 'auth_rate_limit',
  points: 5, // 5 login attempts
  duration: 60 * 60, // per 1 hour
  blockDuration: 60 * 60, // block for 1 hour if exceeded
});

export const authRateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    await authRateLimiter.consume(clientIp);
    next();
  } catch (error) {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later',
    });
  }
};