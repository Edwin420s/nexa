import Joi from 'joi';

export const executeAgentSchema = Joi.object({
  projectId: Joi.string().required(),
  agentName: Joi.string().required(),
  prompt: Joi.string().required(),
  config: Joi.object().default({}),
});