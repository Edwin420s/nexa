import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl, ip, body } = req;

  // Skip logging for health checks
  if (originalUrl === '/health') {
    return next();
  }

  // Log request
  logger.info('Request', {
    method,
    url: originalUrl,
    ip,
    body: method === 'POST' || method === 'PUT' ? body : undefined,
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const contentLength = res.get('content-length');

    logger.info('Response', {
      method,
      url: originalUrl,
      statusCode,
      contentLength,
      duration: `${duration}ms`,
    });
  });

  next();
};

export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error', {
    error: {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      body: req.body,
    },
  });

  next(err);
};