import express from 'express';
import { authenticate } from '../middleware/auth';
import { Project } from '../models/Project';
import { getStreamingService } from '../services/streaming';

const router = express.Router();

// SSE endpoint for project updates
router.get('/projects/:id', authenticate, async (req: any, res, next) => {
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

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Send initial connection message
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      message: 'Connected to project stream',
      projectId: req.params.id,
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Send project status
    res.write(`data: ${JSON.stringify({
      type: 'project_status',
      data: {
        status: project.status,
        agents: project.agents.map(a => ({
          name: a.name,
          status: a.status,
          model: a.model
        })),
        confidence: project.analytics.confidenceScore
      },
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Send recent agent outputs
    for (const agent of project.agents) {
      if (agent.outputs.length > 0) {
        const latestOutput = agent.outputs[agent.outputs.length - 1];
        res.write(`data: ${JSON.stringify({
          type: 'agent_update',
          data: {
            agent: agent.name,
            output: latestOutput,
            isHistorical: true
          },
          timestamp: new Date().toISOString()
        })}\n\n`);
      }
    }

    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write(`data: ${JSON.stringify({
        type: 'keep_alive',
        timestamp: new Date().toISOString()
      })}\n\n`);
    }, 30000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
      res.end();
    });

  } catch (error) {
    next(error);
  }
});

export default router;