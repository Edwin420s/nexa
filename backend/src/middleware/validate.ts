import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';
import { validate } from '../utils/validation';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.body = validate(schema, req.body);
            next();
        } catch (error: any) {
            next(new ValidationError(error.message));
        }
    };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.params = validate(schema, req.params);
            next();
        } catch (error: any) {
            next(new ValidationError(error.message));
        }
    };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.query = validate(schema, req.query) as any;
            next();
        } catch (error: any) {
            next(new ValidationError(error.message));
        }
    };
};
