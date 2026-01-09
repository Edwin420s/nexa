import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleValidationError = (err: any, res: Response) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return res.status(400).json({
    status: 'fail',
    message,
  });
};

const handleDuplicateFieldsDB = (err: any, res: Response) => {
  const value = err.errmsg.match(/(["'])(\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return res.status(400).json({
    status: 'fail',
    message,
  });
};

const handleJWTError = (res: Response) =>
  res.status(401).json({
    status: 'fail',
    message: 'Invalid token. Please log in again!',
  });

const handleJWTExpiredError = (res: Response) =>
  res.status(401).json({
    status: 'fail',
    message: 'Your token has expired! Please log in again.',
  });

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    logger.error('Error:', {
      error: err,
      stack: err.stack,
    });
  }

  let error = { ...err, message: err.message };

  if (error.name === 'ValidationError') return handleValidationError(error, res);
  if (error.code === 11000) return handleDuplicateFieldsDB(error, res);
  if (error.name === 'JsonWebTokenError') return handleJWTError(res);
  if (error.name === 'TokenExpiredError') return handleJWTExpiredError(res);

  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  logger.error('ERROR 💥', error);
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
};


export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(error);
};
