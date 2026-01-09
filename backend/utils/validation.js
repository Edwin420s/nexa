"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAgentExecution = exports.validateProject = exports.validateLogin = exports.validateRegister = void 0;
const joi_1 = __importDefault(require("joi"));
const validateRegister = (data) => {
    const schema = joi_1.default.object({
        email: joi_1.default.string()
            .email()
            .required()
            .messages({
            'string.email': 'Please provide a valid email address',
            'string.empty': 'Email is required',
            'any.required': 'Email is required'
        }),
        password: joi_1.default.string()
            .min(6)
            .required()
            .messages({
            'string.min': 'Password must be at least 6 characters long',
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        }),
        name: joi_1.default.string()
            .min(2)
            .max(50)
            .required()
            .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 50 characters',
            'string.empty': 'Name is required',
            'any.required': 'Name is required'
        })
    });
    return schema.validate(data, { abortEarly: false });
};
exports.validateRegister = validateRegister;
const validateLogin = (data) => {
    const schema = joi_1.default.object({
        email: joi_1.default.string()
            .email()
            .required()
            .messages({
            'string.email': 'Please provide a valid email address',
            'string.empty': 'Email is required',
            'any.required': 'Email is required'
        }),
        password: joi_1.default.string()
            .required()
            .messages({
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        })
    });
    return schema.validate(data, { abortEarly: false });
};
exports.validateLogin = validateLogin;
const validateProject = (data) => {
    const schema = joi_1.default.object({
        title: joi_1.default.string()
            .min(3)
            .max(100)
            .required()
            .messages({
            'string.min': 'Title must be at least 3 characters long',
            'string.max': 'Title cannot exceed 100 characters',
            'string.empty': 'Title is required',
            'any.required': 'Title is required'
        }),
        description: joi_1.default.string()
            .max(500)
            .allow('')
            .optional(),
        goal: joi_1.default.string()
            .min(10)
            .max(5000)
            .required()
            .messages({
            'string.min': 'Goal must be at least 10 characters long',
            'string.max': 'Goal cannot exceed 5000 characters',
            'string.empty': 'Goal is required',
            'any.required': 'Goal is required'
        }),
        agents: joi_1.default.array()
            .items(joi_1.default.object({
            name: joi_1.default.string()
                .valid('researcher', 'code-builder', 'summarizer', 'visual-generator')
                .required(),
            model: joi_1.default.string()
                .valid('gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro', 'nano-banana', 'veo-3.1')
                .default('gemini-2.5-flash'),
            status: joi_1.default.string()
                .valid('idle', 'running', 'completed', 'failed')
                .default('idle')
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
    });
    return schema.validate(data, { abortEarly: false });
};
exports.validateProject = validateProject;
const validateAgentExecution = (data) => {
    const schema = joi_1.default.object({
        prompt: joi_1.default.string()
            .min(10)
            .max(5000)
            .required(),
        model: joi_1.default.string()
            .valid('gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro', 'nano-banana', 'veo-3.1')
            .optional(),
        temperature: joi_1.default.number().min(0).max(2).optional(),
        maxTokens: joi_1.default.number().min(1).max(8192).optional()
    });
    return schema.validate(data, { abortEarly: false });
};
exports.validateAgentExecution = validateAgentExecution;
