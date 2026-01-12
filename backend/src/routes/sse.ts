import { Router, Response, NextFunction } from 'express';
import { initSSE, closeSSE } from '../services/streaming';
import { Project } from '../models/Project';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotFoundError, AuthorizationError } from '../utils/errors';

const router = Router();

router.use(authenticate);

// SSE stream for project updates
router.get('/projects/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.user.toString() !== req.userId) {
      throw new AuthorizationError();
    }

    const send = initSSE(res);

    // Send initial status
    send({
      type: 'status',
      status: project.status,
      phase: project.state.currentPhase
    });

    // Monitor project for updates
    const checkInterval = setInterval(async () => {
      try {
        const updatedProject = await Project.findById(req.params.id);

        if (!updatedProject) {
          clearInterval(checkInterval);
          closeSSE(res);
          return;
        }

        // Send latest agent output if any
        const latestOutput = updatedProject.agents
          .flatMap(a => a.outputs)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

        if (latestOutput) {
          send({
            type: 'output',
            agent: latestOutput.agent,
            content: latestOutput.content,
            confidence: latestOutput.confidence,
            timestamp: latestOutput.timestamp
          });
        }

        // Check if completed
        if (updatedProject.status === 'completed' || updatedProject.status === 'failed') {
          send({ type: 'complete', status: updatedProject.status });
          clearInterval(checkInterval);
          closeSSE(res);
        }
      } catch (error) {
        clearInterval(checkInterval);
        closeSSE(res);
      }
    }, 1000);

    // Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(checkInterval);
      closeSSE(res);
    });

  } catch (error) {
    next(error);
  }
});

export default router;