import Joi from 'joi';

// User validation schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(50).required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Project validation schemas
export const createProjectSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).optional(),
  goal: Joi.string().min(10).max(2000).required(),
  agents: Joi.array().items(
    Joi.object({
      name: Joi.string().valid('researcher', 'code-builder', 'summarizer', 'visual-generator').required(),
      model: Joi.string().valid('gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro', 'nano-banana', 'veo-3.1').optional()
    })
  ).min(1).required(),
  settings: Joi.object({
    streaming: Joi.boolean().optional(),
    autoSave: Joi.boolean().optional(),
    confidenceThreshold: Joi.number().min(0).max(1).optional(),
    maxIterations: Joi.number().min(1).max(100).optional(),
    temperature: Joi.number().min(0).max(2).optional()
  }).optional()
});

export const updateProjectSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  status: Joi.string().valid('draft', 'running', 'paused', 'completed', 'failed').optional()
});

// Agent validation schemas
export const executeAgentSchema = Joi.object({
  agentName: Joi.string().valid('researcher', 'code-builder', 'summarizer', 'visual-generator').required(),
  input: Joi.string().min(1).required(),
  model: Joi.string().valid('gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro').optional(),
  config: Joi.object({
    temperature: Joi.number().min(0).max(2).optional(),
    maxTokens: Joi.number().min(1).optional()
  }).optional()
});

// Validation helper
export const validate = <T>(schema: Joi.ObjectSchema<T>, data: any): T => {
  const { error, value } = schema.validate(data, { abortEarly: false });

  if (error) {
    const messages = error.details.map(detail => detail.message).join(', ');
    throw new Error(messages);
  }

  return value;
};