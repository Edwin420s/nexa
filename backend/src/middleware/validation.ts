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

    // Check for XSS in string fields
    if (req.body) {
      const hasXss = this.checkObjectForXss(req.body);
      if (hasXss) {
        errors.push('Potential XSS detected in request body');
      }
    }

    return errors;
  }

  private static checkObjectForSqlInjection(obj: any): boolean {
    if (typeof obj === 'string') {
      return getSecurityService().detectSqlInjection(obj);
    }

    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => 
        this.checkObjectForSqlInjection(value)
      );
    }

    return false;
  }

  private static checkObjectForXss(obj: any): boolean {
    if (typeof obj === 'string') {
      return getSecurityService().detectXss(obj);
    }

    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => 
        this.checkObjectForXss(value)
      );
    }

    return false;
  }

  // Common validation schemas
  static readonly schemas = {
    // User schemas
    userRegister: Joi.object({
      email: Joi.string()
        .email()
        .required()
        .max(100)
        .messages({
          'string.email': 'Please provide a valid email address',
          'string.empty': 'Email is required',
          'string.max': 'Email cannot exceed 100 characters'
        }),
      password: Joi.string()
        .min(8)
        .required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .messages({
          'string.min': 'Password must be at least 8 characters long',
          'string.empty': 'Password is required',
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }),
      name: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
          'string.min': 'Name must be at least 2 characters long',
          'string.max': 'Name cannot exceed 50 characters',
          'string.empty': 'Name is required'
        })
    }),

    userLogin: Joi.object({
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'string.empty': 'Email is required'
        }),
      password: Joi.string()
        .required()
        .messages({
          'string.empty': 'Password is required'
        })
    }),

    userUpdate: Joi.object({
      name: Joi.string()
        .min(2)
        .max(50)
        .optional(),
      settings: Joi.object({
        emailNotifications: Joi.boolean().optional(),
        defaultModel: Joi.string()
          .valid('gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro')
          .optional()
      }).optional()
    }),

    // Project schemas
    projectCreate: Joi.object({
      title: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
          'string.min': 'Title must be at least 3 characters long',
          'string.max': 'Title cannot exceed 100 characters',
          'string.empty': 'Title is required'
        }),
      description: Joi.string()
        .max(500)
        .optional()
        .allow(''),
      goal: Joi.string()
        .min(10)
        .max(5000)
        .required()
        .messages({
          'string.min': 'Goal must be at least 10 characters long',
          'string.max': 'Goal cannot exceed 5000 characters',
          'string.empty': 'Goal is required'
        }),
      agents: Joi.array()
        .items(
          Joi.object({
            name: Joi.string()
              .valid('researcher', 'code-builder', 'summarizer', 'visual-generator')
              .required(),
            model: Joi.string()
              .valid('gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro', 'nano-banana', 'veo-3.1')
              .default('gemini-2.5-flash')
          })
        )
        .min(1)
        .max(10)
        .optional(),
      settings: Joi.object({
        streaming: Joi.boolean().default(true),
        autoSave: Joi.boolean().default(true),
        confidenceThreshold: Joi.number().min(0).max(1).default(0.7),
        maxIterations: Joi.number().min(1).max(100).default(10)
      }).optional()
    }),

    projectUpdate: Joi.object({
      title: Joi.string()
        .min(3)
        .max(100)
        .optional(),
      description: Joi.string()
        .max(500)
        .optional()
        .allow(''),
      status: Joi.string()
        .valid('draft', 'running', 'paused', 'completed', 'failed')
        .optional(),
      settings: Joi.object({
        streaming: Joi.boolean().optional(),
        autoSave: Joi.boolean().optional(),
        confidenceThreshold: Joi.number().min(0).max(1).optional(),
        maxIterations: Joi.number().min(1).max(100).optional()
      }).optional()
    }),

    // Agent schemas
    agentResearch: Joi.object({
      topic: Joi.string()
        .min(5)
        .max(1000)
        .required()
        .messages({
          'string.min': 'Topic must be at least 5 characters long',
          'string.max': 'Topic cannot exceed 1000 characters',
          'string.empty': 'Topic is required'
        }),
      depth: Joi.string()
        .valid('shallow', 'medium', 'deep')
        .default('medium'),
      focusAreas: Joi.array()
        .items(Joi.string().min(2).max(100))
        .max(10)
        .optional()
    }),

    agentCode: Joi.object({
      requirements: Joi.string()
        .min(10)
        .max(5000)
        .required()
        .messages({
          'string.min': 'Requirements must be at least 10 characters long',
          'string.max': 'Requirements cannot exceed 5000 characters',
          'string.empty': 'Requirements are required'
        }),
      stack: Joi.string()
        .valid('nodejs', 'python', 'react', 'vue', 'angular', 'java', 'go')
        .default('nodejs'),
      language: Joi.string()
        .valid('javascript', 'typescript', 'python', 'java', 'go', 'rust')
        .optional(),
      fileName: Joi.string()
        .pattern(/^[a-zA-Z0-9_\-\.]+$/)
        .max(255)
        .optional()
    }),

    agentDirect: Joi.object({
      prompt: Joi.string()
        .min(1)
        .max(10000)
        .required()
        .messages({
          'string.min': 'Prompt is required',
          'string.max': 'Prompt cannot exceed 10000 characters'
        }),
      model: Joi.string()
        .valid('gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro', 'nano-banana', 'veo-3.1')
        .default('gemini-2.5-flash'),
      temperature: Joi.number()
        .min(0)
        .max(2)
        .default(0.7),
      maxTokens: Joi.number()
        .min(1)
        .max(8192)
        .default(2048),
      tools: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required(),
            description: Joi.string().required(),
            parameters: Joi.object().required()
          })
        )
        .max(10)
        .optional()
    }),

    // File schemas
    fileUpload: Joi.object({
      projectId: Joi.string()
        .pattern(/^[a-f\d]{24}$/i)
        .optional(),
      agent: Joi.string()
        .valid('researcher', 'code-builder', 'summarizer', 'visual-generator')
        .optional()
    }),

    fileArchive: Joi.object({
      fileIds: Joi.array()
        .items(Joi.string().pattern(/^[a-f\d]{24}$/i))
        .min(1)
        .max(50)
        .required(),
      zipName: Joi.string()
        .pattern(/^[a-zA-Z0-9_\-]+$/)
        .max(100)
        .default(`archive-${Date.now()}`)
    }),

    // Pagination schemas
    pagination: Joi.object({
      page: Joi.number()
        .min(1)
        .default(1),
      limit: Joi.number()
        .min(1)
        .max(100)
        .default(20),
      sortBy: Joi.string()
        .optional(),
      sortOrder: Joi.string()
        .valid('asc', 'desc')
        .default('desc'),
      search: Joi.string()
        .max(100)
        .optional()
    }),

    // Analytics schemas
    analyticsQuery: Joi.object({
      startDate: Joi.date()
        .iso()
        .optional(),
      endDate: Joi.date()
        .iso()
        .optional(),
      interval: Joi.string()
        .valid('hour', 'day', 'week', 'month')
        .default('day'),
      limit: Joi.number()
        .min(1)
        .max(1000)
        .default(100)
    }),

    // Admin schemas
    adminUserUpdate: Joi.object({
      role: Joi.string()
        .valid('user', 'admin', 'moderator')
        .optional(),
      isActive: Joi.boolean()
        .optional(),
      settings: Joi.object()
        .optional()
    }),

    adminSystemConfig: Joi.object({
      email: Joi.object({
        enabled: Joi.boolean().optional(),
        from: Joi.string().email().optional(),
        transport: Joi.object().optional()
      }).optional(),
      rateLimiting: Joi.object({
        enabled: Joi.boolean().optional(),
        rules: Joi.array().optional()
      }).optional(),
      cache: Joi.object({
        defaultTTL: Joi.number().min(60).optional()
      }).optional()
    })
  };

  // Convenience methods for common validations
  static validateRegister = this.validate({
    body: this.schemas.userRegister,
    sanitize: true
  });

  static validateLogin = this.validate({
    body: this.schemas.userLogin,
    sanitize: true
  });

  static validateProjectCreate = this.validate({
    body: this.schemas.projectCreate,
    sanitize: true
  });

  static validateProjectUpdate = this.validate({
    body: this.schemas.projectUpdate,
    sanitize: true
  });

  static validateAgentResearch = this.validate({
    body: this.schemas.agentResearch,
    sanitize: true
  });

  static validateAgentCode = this.validate({
    body: this.schemas.agentCode,
    sanitize: true
  });

  static validateFileUpload = this.validate({
    body: this.schemas.fileUpload,
    files: Joi.array().min(1).max(10).optional(),
    validateFiles: true,
    sanitize: true
  });

  static validatePagination = this.validate({
    query: this.schemas.pagination
  });

  static validateAdminUserUpdate = this.validate({
    body: this.schemas.adminUserUpdate,
    sanitize: true
  });
}

// Export for convenience
export const validate = ValidationMiddleware.validate;
export const schemas = ValidationMiddleware.schemas;

// Common validation middleware exports
export const validateRegister = ValidationMiddleware.validateRegister;
export const validateLogin = ValidationMiddleware.validateLogin;
export const validateProjectCreate = ValidationMiddleware.validateProjectCreate;
export const validateProjectUpdate = ValidationMiddleware.validateProjectUpdate;
export const validateAgentResearch = ValidationMiddleware.validateAgentResearch;
export const validateAgentCode = ValidationMiddleware.validateAgentCode;
export const validateFileUpload = ValidationMiddleware.validateFileUpload;
export const validatePagination = ValidationMiddleware.validatePagination;
export const validateAdminUserUpdate = ValidationMiddleware.validateAdminUserUpdate;