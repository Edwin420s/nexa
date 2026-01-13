import { Server as SocketIOServer } from 'socket.io';
import { Response } from 'express';
import logger from '../utils/logger';

let io: SocketIOServer;

export const setupStreaming = (socketServer: SocketIOServer) => {
  io = socketServer;

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('join-project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      logger.info(`Client ${socket.id} joined project: ${projectId}`);
    });

    socket.on('leave-project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      logger.info(`Client ${socket.id} left project: ${projectId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });
};

export const emitToProject = (projectId: string, event: string, data: any) => {
  if (io) {
    io.to(`project:${projectId}`).emit(event, data);
    logger.debug(`Emitted ${event} to project ${projectId}`);
  }
};

export const emitAgentUpdate = (
  projectId: string,
  agentName: string,
  content: string,
  confidence: number
) => {
  emitToProject(projectId, 'agent-update', {
    agent: agentName,
    content,
    confidence,
    timestamp: new Date()
  });
};

export const emitProjectStatus = (projectId: string, status: string) => {
  emitToProject(projectId, 'project-status', { status, timestamp: new Date() });
};

// SSE helpers
export const initSSE = (res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  return (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
};

export const closeSSE = (res: Response) => {
  res.end();
};

// StreamingService class for coordinated streaming operations
export class StreamingService {
  async streamProjectStatus(projectId: string, status: string, message?: string) {
    emitToProject(projectId, 'project-status', {
      status,
      message,
      timestamp: new Date()
    });
  }

  async streamAgentUpdate(projectId: string, agentName: string, data: any) {
    emitToProject(projectId, 'agent-update', {
      agent: agentName,
      ...data,
      timestamp: new Date()
    });
  }

  async streamConfidenceUpdate(projectId: string, confidence: number) {
    emitToProject(projectId, 'confidence-update', {
      confidence,
      timestamp: new Date()
    });
  }

  async streamFileGenerated(projectId: string, file: any) {
    emitToProject(projectId, 'file-generated', {
      file,
      timestamp: new Date()
    });
  }
}

// Singleton instance
let streamingServiceInstance: StreamingService;

export function getStreamingService(): StreamingService {
  if (!streamingServiceInstance) {
    streamingServiceInstance = new StreamingService();
  }
  return streamingServiceInstance;
}