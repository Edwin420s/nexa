import { Request, Response } from 'express';
import { Project, IProject } from '../models/Project';
import logger from '../utils/logger';
import { NotFoundError } from '../utils/errors';
import { emitToProject } from '../services/socket';

export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, goal } = req.body;
    const userId = req.user.id;

    const project = new Project({
      name,
      description,
      goal,
      createdBy: userId,
      team: [userId],
      progress: {
        currentStep: 0,
        totalSteps: 5, // Example: Define your project steps
        percentage: 0,
      },
    });

    await project.save();

    // Emit project created event
    emitToProject(req.io, project.id, 'project:created', project);

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
    const userId = req.user.id;

    const query: any = {
      $or: [
        { createdBy: userId },
        { team: userId },
        { 'settings.visibility': 'public' },
      ],
    };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    const projects = await Project.find(query)
      .sort(sort as string)
      .populate('createdBy', 'name email')
      .populate('team', 'name email');

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
      .populate('createdBy', 'name email')
      .populate('team', 'name email');

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check if user has access to the project
    if (
      project.settings.visibility !== 'public' &&
      !project.team.includes(req.user.id) &&
      !project.createdBy.equals(req.user.id)
    ) {
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
    if (!project.team.includes(req.user.id) && !project.createdBy.equals(req.user.id)) {
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

    project.metadata.updatedAt = new Date();
    await project.save();

    // Emit project updated event
    emitToProject(req.io, project.id, 'project:updated', project);

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
    if (!project.createdBy.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project creator can delete this project',
      });
    }

    await project.remove();

    // Emit project deleted event
    emitToProject(req.io, project.id, 'project:deleted', { id: project.id });

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