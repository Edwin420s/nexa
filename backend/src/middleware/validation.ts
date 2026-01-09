import { Request, Response, NextFunction } from 'express';
import { AnySchema } from 'joi';
import { BadRequestError } from '../utils/errors';
import { APIError } from './error';

export const validate = (schema: AnySchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
       throw new APIError('Validation Error', 400); 
      const errors: Record<string, string> = {};
      error.details.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path[0]] = err.message;
        }
      });
      throw new BadRequestError('Validation Error', errors);
       req.body = value;
    }

    next();
  };
};