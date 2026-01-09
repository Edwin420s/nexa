import { Request, Response } from 'express';
import { Project, IProject } from '../models/Project';
import logger from '../utils/logger';
import { NotFoundError } from '../utils/errors';
import { emitToProject } from '../services/socket';

export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, goal } = req.body;
    const userId = (req as any).user.id;

    const project = new Project({
      title: name, // Map name to title as per schema
      description,
      goal,
      user: userId, // Map createdBy to user as per schema
      agents: [],
      files: [],
      settings: {
        streaming: true,
        autoSave: true,
        confidenceThreshold: 0.7,
        maxIterations: 10
      },
      analytics: {
        confidenceScore: 0,
        executionTime: 0,
        tokensUsed: 0,
        iterations: 0
      }
    });

    await (project as any).save();

    // Emit project created event
    if ((req as any).io) {
      emitToProject((req as any).io, project.id, 'project:created', project);
    }

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Failed to create project' });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const { status, search, sort = '-createdAt' } = req.query;
    const userId = (req as any).user.id;

    const query: any = {
      user: userId // Filter by user
    };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    const projects = await Project.find(query)
      .sort(sort as string)
      .populate('user', 'name email');

    res.json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    logger.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('user', 'name email');

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check if user has access to the project
    // Assuming simple ownership for now
    if (project.user.toString() !== (req as any).user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this project',
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    logger.error('Error fetching project:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const project = await Project.findById(id);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check if user has permission to update the project
    if (project.user.toString() !== (req as any).user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this project',
      });
    }

    // Update project fields
    Object.keys(updates).forEach((key) => {
      if (key in project) {
        (project as any)[key] = updates[key];
      }
    });

    project.updatedAt = new Date();
    await (project as any).save();

    // Emit project updated event
    if ((req as any).io) {
      emitToProject((req as any).io, project.id, 'project:updated', project);
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    logger.error('Error updating project:', error);
    res.status(500).json({ success: false, message: 'Failed to update project' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check if user is the creator of the project
    if (project.user.toString() !== (req as any).user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the project creator can delete this project',
      });
    }

    await Project.deleteOne({ _id: project._id });

    // Emit project deleted event
    if ((req as any).io) {
      emitToProject((req as any).io, project.id, 'project:deleted', { id: project.id });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    logger.error('Error deleting project:', error);
    res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
};