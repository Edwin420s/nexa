import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Agent execution endpoint (placeholder)
router.post('/execute', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      message: 'Agent execution endpoint - implementation in orchestrator'
    });
  } catch (error) {
    next(error);
  }
});

export default router;