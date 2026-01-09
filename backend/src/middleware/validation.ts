import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { getSecurityService } from '../services/security';
import logger from '../utils/logger';

export interface ValidationRule {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
  files?: Joi.ObjectSchema;
  sanitize?: boolean;
  validateFiles?: boolean;
}

export class ValidationMiddleware {
  static validate(rule: ValidationRule) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors: string[] = [];
        const securityService = getSecurityService();

        // Sanitize inputs if configured
        if (rule.sanitize !== false) {
          if (req.body) req.body = securityService.sanitizeObject(req.body);
          if (req.query) req.query = securityService.sanitizeObject(req.query as any);
          if (req.params) req.params = securityService.sanitizeObject(req.params);
        }

        // Validate body
        if (rule.body) {
          const { error, value } = rule.body.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
          });

          if (error) {
            errors.push(...error.details.map(d => `Body: ${d.message}`));
          } else {
            req.body = value;
          }
        }

        // Validate query parameters
        if (rule.query) {
          const { error, value } = rule.query.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
          });

          if (error) {
            errors.push(...error.details.map(d => `Query: ${d.message}`));
          } else {
            req.query = value;
          }
        }

        // Validate route parameters
        if (rule.params) {
          const { error, value } = rule.params.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
          });

          if (error) {
            errors.push(...error.details.map(d => `Params: ${d.message}`));
          } else {
            req.params = value;
          }
        }

        // Validate headers
        if (rule.headers) {
          const { error } = rule.headers.validate(req.headers, {
            abortEarly: false,
            stripUnknown: true,
            allowUnknown: true
          });

          if (error) {
            errors.push(...error.details.map(d => `Headers: ${d.message}`));
          }
        }

        // Validate files
        if (rule.files && req.files) {
          const { error } = rule.files.validate(req.files, {
            abortEarly: false
          });

          if (error) {
            errors.push(...error.details.map(d => `Files: ${d.message}`));
          }
        }

        // Additional file validation
        if (rule.validateFiles && req.files) {
          const fileErrors = this.validateUploadedFiles(req.files);
          if (fileErrors.length > 0) {
            errors.push(...fileErrors);
          }
        }

        // Check for security issues
        const securityErrors = this.checkSecurityIssues(req);
        if (securityErrors.length > 0) {
          errors.push(...securityErrors);
        }

        // If there are errors, return them
        if (errors.length > 0) {
          logger.warn(`Validation failed for ${req.method} ${req.path}:`, errors);

          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.map(err => err.replace(/"/g, "'"))
          });
        }

        next();
      } catch (error) {
        logger.error('Validation middleware error:', error);
        next(error);
      }
    };
  }

  private static validateUploadedFiles(files: any): string[] {
    const errors: string[] = [];
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    const allowedMimeTypes = [
      'text/plain',
      'text/markdown',
      'text/html',
      'application/json',
      'application/javascript',
      'application/typescript',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      'application/pdf',
      'application/zip'
    ];

    const fileArray = Array.isArray(files) ? files : [files];

    for (const file of fileArray) {
      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`File ${file.originalname} exceeds maximum size of 50MB`);
      }

      // Check MIME type
      if (!allowedMimeTypes.includes(file.mimetype)) {
        errors.push(`File type ${file.mimetype} not allowed for ${file.originalname}`);
      }

      // Check filename for security issues
      if (this.hasMaliciousFilename(file.originalname)) {
        errors.push(`Filename ${file.originalname} contains potentially malicious characters`);
      }

      // Check for null bytes in filename (path traversal attempts)
      if (file.originalname.includes('\0')) {
        errors.push(`Filename ${file.originalname} contains null bytes`);
      }
    }

    return errors;
  }

  private static hasMaliciousFilename(filename: string): boolean {
    const maliciousPatterns = [
      /\.\.\//g, // Path traversal
      /\/\//g,   // Double slashes
      /\\/g,     // Backslashes
      /\.\.\\/g, // Windows path traversal
      /\.exe$/i, // Executable files
      /\.bat$/i,
      /\.cmd$/i,
      /\.sh$/i,
      /\.php$/i,
      /\.asp$/i,
      /\.aspx$/i,
      /\.jsp$/i
    ];

    return maliciousPatterns.some(pattern => pattern.test(filename));
  }

  private static checkSecurityIssues(req: Request): string[] {
    const errors: string[] = [];
    const securityService = getSecurityService();

    // Check body for SQL injection
    if (req.body) {
      const hasSqlInjection = this.checkObjectForSqlInjection(req.body);
      if (hasSqlInjection) {
        errors.push('Potential SQL injection detected in request body');
      }
    }

    // Check query parameters for SQL injection
    if (req.query) {
      const hasSqlInjection = this.checkObjectForSqlInjection(req.query);
      if (hasSqlInjection) {
        errors.push('Potential SQL injection detected in query parameters');
      }
    }

    return errors;
  }

  private static checkObjectForSqlInjection(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;

    const sqlInjectionPattern = /('|"|;|--|\/\*|\*\/|xp_|sp_|exec|execute|insert|select|delete|update|drop|alter|create|table|from|where|union|having|order by|group by)/i;

    for (const key in obj) {
      const value = obj[key];

      if (typeof value === 'string' && sqlInjectionPattern.test(value)) {
        return true;
      }

      if (typeof value === 'object') {
        if (this.checkObjectForSqlInjection(value)) {
          return true;
        }
      }
    }

    return false;
  }
}