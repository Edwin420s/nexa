import { Router, Response, NextFunction } from 'express';
import { Analytics } from '../models/Analytics';
import { Project } from '../models/Project';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Get user analytics
router.get('/user', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projects = await Project.find({ user: req.userId });

    const analytics = {
      totalProjects: projects.length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      runningProjects: projects.filter(p => p.status === 'running').length,
      failedProjects: projects.filter(p => p.status === 'failed').length,
      averageConfidence: projects.reduce((sum, p) => sum + p.analytics.averageConfidence, 0) / projects.length || 0,
      totalTokensUsed: projects.reduce((sum, p) => sum + p.analytics.tokensUsed, 0),
      totalExecutionTime: projects.reduce((sum, p) => sum + p.analytics.totalExecutionTime, 0),
      recentProjects: projects.slice(0, 5).map(p => ({
        id: p._id,
        title: p.title,
        status: p.status,
        confidence: p.analytics.averageConfidence,
        createdAt: p.createdAt
      }))
    };

    res.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    next(error);
  }
});

// Get project analytics
router.get('/project/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project || project.user.toString() !== req.userId) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const agentMetrics = project.agents.map(agent => ({
      name: agent.name,
      model: agent.model,
      status: agent.status,
      outputCount: agent.outputs.length,
      averageConfidence: agent.outputs.reduce((sum, o) => sum + o.confidence, 0) / agent.outputs.length || 0,
      timeline: agent.outputs.map(o => ({
        timestamp: o.timestamp,
        confidence: o.confidence
      }))
    }));

    res.json({
      success: true,
      data: {
        analytics: project.analytics,
        agentMetrics,
        state: project.state
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;