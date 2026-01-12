import { Router, Response, NextFunction } from 'express';
import { Project } from '../models/Project';
import { User } from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createProjectSchema, updateProjectSchema } from '../utils/validation';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { addAgentJob } from '../services/queue';
import logger from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all projects for user
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, limit = 20, skip = 0 } = req.query;

    const query: any = { user: req.userId };
    if (status) {
      query.status = status;
    }

    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .select('-agents.outputs');

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          total,
          limit: Number(limit),
          skip: Number(skip),
          hasMore: total > Number(skip) + Number(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get project by ID
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.user.toString() !== req.userId) {
      throw new AuthorizationError('Not authorized to access this project');
    }

    res.json({
      success: true,
      data: { project }
    });
  } catch (error) {
    next(error);
  }
});

// Create new project
router.post('/', validateRequest(createProjectSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, goal, agents, settings } = req.body;

    const project = await Project.create({
      user: req.userId,
      title,
      description,
      goal,
      agents: agents.map((a: any) => ({
        name: a.name,
        model: a.model || 'gemini-2.5-flash',
        status: 'idle',
        outputs: []
      })),
      settings: settings || {},
      state: {
        currentPhase: 'planning',
        currentIteration: 0,
        decisions: {},
        taskQueue: []
      }
    });

    // Update user's project count
    await User.findByIdAndUpdate(req.userId, {
      $push: { projects: project._id },
      $inc: { 'usage.projectsCreated': 1 }
    });

    logger.info(`Project created: ${project._id} by user ${req.userId}`);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
});

// Update project
router.put('/:id', validateRequest(updateProjectSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.user.toString() !== req.userId) {
      throw new AuthorizationError('Not authorized to update this project');
    }

    Object.assign(project, req.body);
    await project.save();

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
});

// Start project execution
router.post('/:id/run', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.user.toString() !== req.userId) {
      throw new AuthorizationError('Not authorized to run this project');
    }

    if (project.status === 'running') {
      return res.status(400).json({
        success: false,
        message: 'Project is already running'
      });
    }

    // Update status
    project.status = 'running';
    project.startedAt = new Date();
    await project.save();

    // Add to queue
    await addAgentJob({
      projectId: project._id.toString(),
      agentName: 'orchestrator',
      goal: project.goal,
      config: project.settings
    });

    logger.info(`Project execution started: ${project._id}`);

    res.json({
      success: true,
      message: 'Project execution started',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
});

// Pause project
router.post('/:id/pause', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.user.toString() !== req.userId) {
      throw new AuthorizationError();
    }

    project.status = 'paused';
    await project.save();

    res.json({
      success: true,
      message: 'Project paused',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.user.toString() !== req.userId) {
      throw new AuthorizationError();
    }

    await project.deleteOne();

    // Remove from user's projects
    await User.findByIdAndUpdate(req.userId, {
      $pull: { projects: project._id }
    });

    logger.info(`Project deleted: ${project._id}`);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;