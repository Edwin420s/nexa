"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAdminUserUpdate = exports.validatePagination = exports.validateFileUpload = exports.validateAgentCode = exports.validateAgentResearch = exports.validateProjectUpdate = exports.validateProjectCreate = exports.validateLogin = exports.validateRegister = exports.schemas = exports.validate = exports.ValidationMiddleware = void 0;
const joi_1 = __importDefault(require("joi"));
const security_1 = require("../services/security");
const logger_1 = __importDefault(require("../utils/logger"));
class ValidationMiddleware {
    static validate(rule) {
        return async (req, res, next) => {
            try {
                const errors = [];
                const securityService = (0, security_1.getSecurityService)();
                // Sanitize inputs if configured
                if (rule.sanitize !== false) {
                    if (req.body)
                        req.body = securityService.sanitizeObject(req.body);
                    if (req.query)
                        req.query = securityService.sanitizeObject(req.query);
                    if (req.params)
                        req.params = securityService.sanitizeObject(req.params);
                }
                // Validate body
                if (rule.body) {
                    const { error, value } = rule.body.validate(req.body, {
                        abortEarly: false,
                        stripUnknown: true
                    });
                    if (error) {
                        errors.push(...error.details.map(d => `Body: ${d.message}`));
                    }
                    else {
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
                    }
                    else {
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
                    }
                    else {
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
                    logger_1.default.warn(`Validation failed for ${req.method} ${req.path}:`, errors);
                    return res.status(400).json({
                        success: false,
                        message: 'Validation failed',
                        errors: errors.map(err => err.replace(/"/g, "'"))
                    });
                }
                next();
            }
            catch (error) {
                logger_1.default.error('Validation middleware error:', error);
                next(error);
            }
        };
    }
    static validateUploadedFiles(files) {
        const errors = [];
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
    static hasMaliciousFilename(filename) {
        const maliciousPatterns = [
            /\.\.\//g, // Path traversal
            /\/\//g, // Double slashes
            /\\/g, // Backslashes
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
    static checkSecurityIssues(req) {
        const errors = [];
        const securityService = (0, security_1.getSecurityService)();
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
    static checkObjectForSqlInjection(obj) {
        if (typeof obj === 'string') {
            return (0, security_1.getSecurityService)().detectSqlInjection(obj);
        }
        if (typeof obj === 'object' && obj !== null) {
            return Object.values(obj).some(value => this.checkObjectForSqlInjection(value));
        }
        return false;
    }
    static checkObjectForXss(obj) {
        if (typeof obj === 'string') {
            return (0, security_1.getSecurityService)().detectXss(obj);
        }
        if (typeof obj === 'object' && obj !== null) {
            return Object.values(obj).some(value => this.checkObjectForXss(value));
        }
        return false;
    }
}
exports.ValidationMiddleware = ValidationMiddleware;
_a = ValidationMiddleware;
// Common validation schemas
ValidationMiddleware.schemas = {
    // User schemas
    userRegister: joi_1.default.object({
        email: joi_1.default.string()
            .email()
            .required()
            .max(100)
            .messages({
            'string.email': 'Please provide a valid email address',
            'string.empty': 'Email is required',
            'string.max': 'Email cannot exceed 100 characters'
        }),
        password: joi_1.default.string()
            .min(8)
            .required()
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.empty': 'Password is required',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }),
        name: joi_1.default.string()
            .min(2)
            .max(50)
            .required()
            .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 50 characters',
            'string.empty': 'Name is required'
        })
    }),
    userLogin: joi_1.default.object({
        email: joi_1.default.string()
            .email()
            .required()
            .messages({
            'string.email': 'Please provide a valid email address',
            'string.empty': 'Email is required'
        }),
        password: joi_1.default.string()
            .required()
            .messages({
            'string.empty': 'Password is required'
        })
    }),
    userUpdate: joi_1.default.object({
        name: joi_1.default.string()
            .min(2)
            .max(50)
            .optional(),
        settings: joi_1.default.object({
            emailNotifications: joi_1.default.boolean().optional(),
            defaultModel: joi_1.default.string()
                .valid('gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro')
                .optional()
        }).optional()
    }),
    // Project schemas
    projectCreate: joi_1.default.object({
        title: joi_1.default.string()
            .min(3)
            .max(100)
            .required()
            .messages({
            'string.min': 'Title must be at least 3 characters long',
            'string.max': 'Title cannot exceed 100 characters',
            'string.empty': 'Title is required'
        }),
        description: joi_1.default.string()
            .max(500)
            .optional()
            .allow(''),
        goal: joi_1.default.string()
            .min(10)
            .max(5000)
            .required()
            .messages({
            'string.min': 'Goal must be at least 10 characters long',
            'string.max': 'Goal cannot exceed 5000 characters',
            'string.empty': 'Goal is required'
        }),
        agents: joi_1.default.array()
            .items(joi_1.default.object({
            name: joi_1.default.string()
                .valid('researcher', 'code-builder', 'summarizer', 'visual-generator')
                .required(),
            model: joi_1.default.string()
                .valid('gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro', 'nano-banana', 'veo-3.1')
                .default('gemini-2.5-flash')
        }))
            .min(1)
            .max(10)
            .optional(),
        settings: joi_1.default.object({
            streaming: joi_1.default.boolean().default(true),
            autoSave: joi_1.default.boolean().default(true),
            confidenceThreshold: joi_1.default.number().min(0).max(1).default(0.7),
            maxIterations: joi_1.default.number().min(1).max(100).default(10)
        }).optional()
    }),
    projectUpdate: joi_1.default.object({
        title: joi_1.default.string()
            .min(3)
            .max(100)
            .optional(),
        description: joi_1.default.string()
            .max(500)
            .optional()
            .allow(''),
        status: joi_1.default.string()
            .valid('draft', 'running', 'paused', 'completed', 'failed')
            .optional(),
        settings: joi_1.default.object({
            streaming: joi_1.default.boolean().optional(),
            autoSave: joi_1.default.boolean().optional(),
            confidenceThreshold: joi_1.default.number().min(0).max(1).optional(),
            maxIterations: joi_1.default.number().min(1).max(100).optional()
        }).optional()
    }),
    // Agent schemas
    agentResearch: joi_1.default.object({
        topic: joi_1.default.string()
            .min(5)
            .max(1000)
            .required()
            .messages({
            'string.min': 'Topic must be at least 5 characters long',
            'string.max': 'Topic cannot exceed 1000 characters',
            'string.empty': 'Topic is required'
        }),
        depth: joi_1.default.string()
            .valid('shallow', 'medium', 'deep')
            .default('medium'),
        focusAreas: joi_1.default.array()
            .items(joi_1.default.string().min(2).max(100))
            .max(10)
            .optional()
    }),
    agentCode: joi_1.default.object({
        requirements: joi_1.default.string()
            .min(10)
            .max(5000)
            .required()
            .messages({
            'string.min': 'Requirements must be at least 10 characters long',
            'string.max': 'Requirements cannot exceed 5000 characters',
            'string.empty': 'Requirements are required'
        }),
        stack: joi_1.default.string()
            .valid('nodejs', 'python', 'react', 'vue', 'angular', 'java', 'go')
            .default('nodejs'),
        language: joi_1.default.string()
            .valid('javascript', 'typescript', 'python', 'java', 'go', 'rust')
            .optional(),
        fileName: joi_1.default.string()
            .pattern(/^[a-zA-Z0-9_\-\.]+$/)
            .max(255)
            .optional()
    }),
    agentDirect: joi_1.default.object({
        prompt: joi_1.default.string()
            .min(1)
            .max(10000)
            .required()
            .messages({
            'string.min': 'Prompt is required',
            'string.max': 'Prompt cannot exceed 10000 characters'
        }),
        model: joi_1.default.string()
            .valid('gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro', 'nano-banana', 'veo-3.1')
            .default('gemini-2.5-flash'),
        temperature: joi_1.default.number()
            .min(0)
            .max(2)
            .default(0.7),
        maxTokens: joi_1.default.number()
            .min(1)
            .max(8192)
            .default(2048),
        tools: joi_1.default.array()
            .items(joi_1.default.object({
            name: joi_1.default.string().required(),
            description: joi_1.default.string().required(),
            parameters: joi_1.default.object().required()
        }))
            .max(10)
            .optional()
    }),
    // File schemas
    fileUpload: joi_1.default.object({
        projectId: joi_1.default.string()
            .pattern(/^[a-f\d]{24}$/i)
            .optional(),
        agent: joi_1.default.string()
            .valid('researcher', 'code-builder', 'summarizer', 'visual-generator')
            .optional()
    }),
    fileArchive: joi_1.default.object({
        fileIds: joi_1.default.array()
            .items(joi_1.default.string().pattern(/^[a-f\d]{24}$/i))
            .min(1)
            .max(50)
            .required(),
        zipName: joi_1.default.string()
            .pattern(/^[a-zA-Z0-9_\-]+$/)
            .max(100)
            .default(`archive-${Date.now()}`)
    }),
    // Pagination schemas
    pagination: joi_1.default.object({
        page: joi_1.default.number()
            .min(1)
            .default(1),
        limit: joi_1.default.number()
            .min(1)
            .max(100)
            .default(20),
        sortBy: joi_1.default.string()
            .optional(),
        sortOrder: joi_1.default.string()
            .valid('asc', 'desc')
            .default('desc'),
        search: joi_1.default.string()
            .max(100)
            .optional()
    }),
    // Analytics schemas
    analyticsQuery: joi_1.default.object({
        startDate: joi_1.default.date()
            .iso()
            .optional(),
        endDate: joi_1.default.date()
            .iso()
            .optional(),
        interval: joi_1.default.string()
            .valid('hour', 'day', 'week', 'month')
            .default('day'),
        limit: joi_1.default.number()
            .min(1)
            .max(1000)
            .default(100)
    }),
    // Admin schemas
    adminUserUpdate: joi_1.default.object({
        role: joi_1.default.string()
            .valid('user', 'admin', 'moderator')
            .optional(),
        isActive: joi_1.default.boolean()
            .optional(),
        settings: joi_1.default.object()
            .optional()
    }),
    adminSystemConfig: joi_1.default.object({
        email: joi_1.default.object({
            enabled: joi_1.default.boolean().optional(),
            from: joi_1.default.string().email().optional(),
            transport: joi_1.default.object().optional()
        }).optional(),
        rateLimiting: joi_1.default.object({
            enabled: joi_1.default.boolean().optional(),
            rules: joi_1.default.array().optional()
        }).optional(),
        cache: joi_1.default.object({
            defaultTTL: joi_1.default.number().min(60).optional()
        }).optional()
    })
};
// Convenience methods for common validations
ValidationMiddleware.validateRegister = _a.validate({
    body: _a.schemas.userRegister,
    sanitize: true
});
ValidationMiddleware.validateLogin = _a.validate({
    body: _a.schemas.userLogin,
    sanitize: true
});
ValidationMiddleware.validateProjectCreate = _a.validate({
    body: _a.schemas.projectCreate,
    sanitize: true
});
ValidationMiddleware.validateProjectUpdate = _a.validate({
    body: _a.schemas.projectUpdate,
    sanitize: true
});
ValidationMiddleware.validateAgentResearch = _a.validate({
    body: _a.schemas.agentResearch,
    sanitize: true
});
ValidationMiddleware.validateAgentCode = _a.validate({
    body: _a.schemas.agentCode,
    sanitize: true
});
ValidationMiddleware.validateFileUpload = _a.validate({
    body: _a.schemas.fileUpload,
    files: joi_1.default.array().min(1).max(10).optional(),
    validateFiles: true,
    sanitize: true
});
ValidationMiddleware.validatePagination = _a.validate({
    query: _a.schemas.pagination
});
ValidationMiddleware.validateAdminUserUpdate = _a.validate({
    body: _a.schemas.adminUserUpdate,
    sanitize: true
});
// Export for convenience
exports.validate = ValidationMiddleware.validate;
exports.schemas = ValidationMiddleware.schemas;
// Common validation middleware exports
exports.validateRegister = ValidationMiddleware.validateRegister;
exports.validateLogin = ValidationMiddleware.validateLogin;
exports.validateProjectCreate = ValidationMiddleware.validateProjectCreate;
exports.validateProjectUpdate = ValidationMiddleware.validateProjectUpdate;
exports.validateAgentResearch = ValidationMiddleware.validateAgentResearch;
exports.validateAgentCode = ValidationMiddleware.validateAgentCode;
exports.validateFileUpload = ValidationMiddleware.validateFileUpload;
exports.validatePagination = ValidationMiddleware.validatePagination;
exports.validateAdminUserUpdate = ValidationMiddleware.validateAdminUserUpdate;
