import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Simple test endpoint first
router.post('/try', (req: any, res: Response, next: NextFunction) => {
  try {
    const { prompt, model = 'gemini-2.5-flash' } = req.body;
    
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Prompt must be less than 1000 characters for free tier'
      });
    }

    // Simple mock response
    const mockResponse = `🤖 **AI Response**

Your prompt: "${prompt}"

This is a working response from the Nexa platform! The frontend-backend connection is now functional.

Model used: ${model}
Status: Free tier demo

To enable real AI responses, configure your Gemini API key in the .env file.`;

    res.json({
      status: 'success',
      data: {
        response: mockResponse,
        model,
        tokensUsed: 156,
        tier: 'free'
      }
    });
  } catch (error) {
    console.error('Error in /agents/try:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Protected routes below
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