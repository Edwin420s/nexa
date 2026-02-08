import * as Joi from 'joi';

export const tryPlatformSchema = Joi.object({
  prompt: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Prompt cannot be empty',
      'string.min': 'Prompt must be at least 1 character long',
      'string.max': 'Prompt must be less than 1000 characters for free tier',
      'any.required': 'Prompt is required'
    }),
  model: Joi.string()
    .optional()
    .valid('gemini-2.5-flash', 'gemini-2.5-pro')
    .default('gemini-2.5-flash')
    .messages({
      'any.only': 'Model must be one of: gemini-2.5-flash, gemini-2.5-pro'
    })
});
