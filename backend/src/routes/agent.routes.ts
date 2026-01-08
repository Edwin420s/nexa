import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { executeAgent, getAgentStatus } from '../controllers/agent.controller';
import { validate } from '../middleware/validation';
import { executeAgentSchema } from '../validations/agent.validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Agent execution
router.post('/execute', validate(executeAgentSchema), executeAgent);
router.get('/:projectId/status/:agentName', getAgentStatus);

export default router;