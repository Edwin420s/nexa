import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { getGeminiService } from '../services/gemini';
import { AgentOrchestrator } from '../agent-orchestrator/orchestrator';
import logger from '../utils/logger';
import { NotFoundError } from '../utils/errors';

// Initialize agent orchestrator
const agentOrchestrator = new AgentOrchestrator();

export const executeAgent = async (req: Request, res: Response) => {
  try {
    const { projectId, agentName, prompt } = req.body;
    const userId = (req as any).user.id;

    // Find the project
    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { createdBy: userId },
        { team: userId },
      ],
    });

    if (!project) {
      throw new NotFoundError('Project not found or access denied');
    }

    // Check if the agent exists in the project
    const agent = project.agents.find(a => a.name === agentName);
    if (!agent) {
      throw new NotFoundError(`Agent '${agentName}' not found in project`);
    }

    // Execute the agent
    const result = await agentOrchestrator.executeAgent(projectId, agentName, prompt);

    // Update project with the result
    project.updatedAt = new Date();
    await (project as any).save();

    // Emit agent execution result
    if ((req as any).io) {
      (req as any).io.to(`project:${projectId}`).emit('agent:executed', {
        projectId,
        agentName,
        result,
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    logger.error('Error executing agent:', error);
    res.status(500).json({ success: false, message: 'Failed to execute agent' });
  }
};

export const getAgentStatus = async (req: Request, res: Response) => {
  try {
    const { projectId, agentName } = req.params;
    const userId = (req as any).user.id;

    // Find the project
    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { createdBy: userId },
        { team: userId },
      ],
    });

    if (!project) {
      throw new NotFoundError('Project not found or access denied');
    }

    // Find the agent
    const agent = project.agents.find(a => a.name === agentName);
    if (!agent) {
      throw new NotFoundError(`Agent '${agentName}' not found in project`);
    }

    res.json({
      success: true,
      data: {
        name: agent.name,
        status: agent.status,
        lastRun: agent.outputs.length > 0 ? agent.outputs[agent.outputs.length - 1].timestamp : null,
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    logger.error('Error getting agent status:', error);
    res.status(500).json({ success: false, message: 'Failed to get agent status' });
  }
};