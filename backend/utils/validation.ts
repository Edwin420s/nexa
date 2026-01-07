import Joi from 'joi';

export const validateRegister = (data: any) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.empty': 'Password is required',
        'any.required': 'Password is required'
      }),
    name: Joi.string()
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

export const validateLogin = (data: any) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required',
        'any.required': 'Password is required'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateProject = (data: any) => {
  const schema = Joi.object({
    title: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.min': 'Title must be at least 3 characters long',
        'string.max': 'Title cannot exceed 100 characters',
        'string.empty': 'Title is required',
        'any.required': 'Title is required'
      }),
    description: Joi.string()
      .max(500)
      .allow('')
      .optional(),
    goal: Joi.string()
      .min(10)
      .max(5000)
      .required()
      .messages({
        'string.min': 'Goal must be at least 10 characters long',
        'string.max': 'Goal cannot exceed 5000 characters',
        'string.empty': 'Goal is required',
        'any.required': 'Goal is required'
      }),
    agents: Joi.array()
      .items(
        Joi.object({
          name: Joi.string()
            .valid('researcher', 'code-builder', 'summarizer', 'visual-generator')
            .required(),
          model: Joi.string()
            .valid('gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro', 'nano-banana', 'veo-3.1')
            .default('gemini-2.5-flash'),
          status: Joi.string()
            .valid('idle', 'running', 'completed', 'failed')
            .default('idle')
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
  });

  return schema.validate(data, { abortEarly: false });
};

export const validateAgentExecution = (data: any) => {
  const schema = Joi.object({
    prompt: Joi.string()
      .min(10)
      .max(5000)
      .required(),
    model: Joi.string()
      .valid('gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro', 'nano-banana', 'veo-3.1')
      .optional(),
    temperature: Joi.number().min(0).max(2).optional(),
    maxTokens: Joi.number().min(1).max(8192).optional()
  });

  return schema.validate(data, { abortEarly: false });
};