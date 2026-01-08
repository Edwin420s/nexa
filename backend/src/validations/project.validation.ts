import Joi from 'joi';

export const createProjectSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().required().min(10).max(1000),
  goal: Joi.string().required().min(10).max(1000),
  settings: Joi.object({
    visibility: Joi.string().valid('private', 'team', 'public').default('private'),
    allowFeedback: Joi.boolean().default(true),
    notifications: Joi.object({
      email: Joi.boolean().default(true),
      inApp: Joi.boolean().default(true),
    }).default({}),
  }).default({}),
});

export const updateProjectSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  description: Joi.string().min(10).max(1000),
  goal: Joi.string().min(10).max(1000),
  status: Joi.string().valid('planning', 'in_progress', 'paused', 'completed', 'failed'),
  settings: Joi.object({
    visibility: Joi.string().valid('private', 'team', 'public'),
    allowFeedback: Joi.boolean(),
    notifications: Joi.object({
      email: Joi.boolean(),
      inApp: Joi.boolean(),
    }),
  }),
}).min(1); // At least one field is required for update