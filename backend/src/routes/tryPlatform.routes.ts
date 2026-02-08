import { Router } from 'express';
import { TryPlatformController } from '../controllers/tryPlatform.controller';
import { validate } from '../middleware/validation';
import { tryPlatformSchema } from '../validations/tryPlatform.validation';

const router = Router();

// Try platform endpoint - no authentication required
router.post('/try', validate({ body: tryPlatformSchema }), TryPlatformController.generateResponse);

export default router;
