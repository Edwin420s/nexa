import express from 'express';
import { Project } from '../models/Project';
import { getAgentOrchestrator } from '../agent-orchestrator/orchestrator';
import { authenticate } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

// Get all projects for user
router.get('/', authenticate, async (req: any, res, next) => {
  try {
    const projects = await Project.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-agents.outputs');
    
    res.json({
      success: true,
      data: projects,
      count: projects.length
    });
  } catch (error) {
    next(error);
  }
});

// Get single project
router.get('/:id', authenticate, async (req: any, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// Create new project
router.post('/', authenticate, async (req: any, res, next) => {
  try {
    const { title, description, goal, agents, settings } = req.body;

    if (!title || !goal) {
      return res.status(400).json({
        success: false,
        message: 'Title and goal are required'
      });
    }

    const project = await Project.create({
      user: req.user.id,
      title,
      description: description || '',
      goal,
      agents: agents || [
        { name: 'researcher', model: 'gemini-3-pro' },
        { name: 'code-builder', model: 'gemini-2.5-pro' },
        { name: 'summarizer', model: 'gemini-2.5-flash' }
      ],
      settings: {
        streaming: true,
        autoSave: true,
        confidenceThreshold: 0.7,
        maxIterations: 10,
        ...settings
      }
    });

    logger.info(`Project created: ${project._id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// Update project
router.put('/:id', authenticate, async (req: any, res, next) => {
  try {
    const updates = req.body;
    delete updates._id;
    delete updates.user;
    delete updates.createdAt;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:id', authenticate, async (req: any, res, next) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    logger.info(`Project deleted: ${req.params.id} by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Execute project
router.post('/:id/run', authenticate, async (req: any, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if project is already running
    const orchestrator = getAgentOrchestrator();
    if (orchestrator.isProjectActive(project._id.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Project is already running'
      });
    }

    // Start execution in background
    orchestrator.executeProject(project._id.toString()).catch(error => {
      logger.error(`Background execution error for project ${project._id}:`, error);
    });

    res.json({
      success: true,
      message: 'Project execution started',
      projectId: project._id
    });
  } catch (error) {
    next(error);
  }
});

// Pause project
router.post('/:id/pause', authenticate, async (req: any, res, next) => {
  try {
    const orchestrator = getAgentOrchestrator();
    
    if (!orchestrator.isProjectActive(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Project is not running'
      });
    }

    await orchestrator.pauseProject(req.params.id);

    res.json({
      success: true,
      message: 'Project paused'
    });
  } catch (error) {
    next(error);
  }
});

// Resume project
router.post('/:id/resume', authenticate, async (req: any, res, next) => {
  try {
    const orchestrator = getAgentOrchestrator();
    
    if (orchestrator.isProjectActive(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Project is already running'
      });
    }

    await orchestrator.resumeProject(req.params.id);

    res.json({
      success: true,
      message: 'Project resumed'
    });
  } catch (error) {
    next(error);
  }
});

// Cancel project execution
router.post('/:id/cancel', authenticate, async (req: any, res, next) => {
  try {
    const orchestrator = getAgentOrchestrator();
    await orchestrator.cancelProject(req.params.id);

    res.json({
      success: true,
      message: 'Project execution cancelled'
    });
  } catch (error) {
    next(error);
  }
});

// Get project files
router.get('/:id/files', authenticate, async (req: any, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.id
    }).select('files');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project.files
    });
  } catch (error) {
    next(error);
  }
});

// Get project status
router.get('/:id/status', authenticate, async (req: any, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.id
    }).select('status agents.status analytics');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const orchestrator = getAgentOrchestrator();
    const isActive = orchestrator.isProjectActive(req.params.id);

    res.json({
      success: true,
      data: {
        ...project.toObject(),
        isActive
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;