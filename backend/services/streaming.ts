import { Server } from 'socket.io';
import { Project } from '../models/Project';
import { Analytics } from '../models/Analytics';
import logger from '../utils/logger';

export interface StreamEvent {
  type: 'agent_update' | 'confidence_update' | 'file_generated' | 'project_status';
  projectId: string;
  data: any;
  timestamp: string;
}

export class StreamingService {
  private io: Server;
  private connections: Map<string, Set<string>> = new Map(); // projectId -> socketIds

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      socket.on('subscribe', (projectId: string) => {
        this.subscribeToProject(socket.id, projectId);
        socket.join(`project:${projectId}`);
        logger.info(`Socket ${socket.id} subscribed to project ${projectId}`);
      });

      socket.on('unsubscribe', (projectId: string) => {
        this.unsubscribeFromProject(socket.id, projectId);
        socket.leave(`project:${projectId}`);
        logger.info(`Socket ${socket.id} unsubscribed from project ${projectId}`);
      });

      socket.on('disconnect', () => {
        this.removeSocket(socket.id);
        logger.info(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  private subscribeToProject(socketId: string, projectId: string): void {
    if (!this.connections.has(projectId)) {
      this.connections.set(projectId, new Set());
    }
    this.connections.get(projectId)!.add(socketId);
  }

  private unsubscribeFromProject(socketId: string, projectId: string): void {
    if (this.connections.has(projectId)) {
      this.connections.get(projectId)!.delete(socketId);
      if (this.connections.get(projectId)!.size === 0) {
        this.connections.delete(projectId);
      }
    }
  }

  private removeSocket(socketId: string): void {
    for (const [projectId, socketIds] of this.connections.entries()) {
      if (socketIds.has(socketId)) {
        socketIds.delete(socketId);
        if (socketIds.size === 0) {
          this.connections.delete(projectId);
        }
      }
    }
  }

  async streamAgentUpdate(projectId: string, agentName: string, output: any): Promise<void> {
    const event: StreamEvent = {
      type: 'agent_update',
      projectId,
      data: {
        agent: agentName,
        output,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    // Emit to all sockets subscribed to this project
    this.io.to(`project:${projectId}`).emit('agent_update', event);

    // Log analytics
    await Analytics.create({
      project: projectId,
      agent: agentName,
      action: 'agent_execution',
      metrics: {
        confidence: output.confidence || 0.5,
        executionTime: output.executionTime || 0,
        tokensUsed: output.tokensUsed || 0
      },
      metadata: {
        contentLength: output.content?.length || 0,
        agentType: agentName
      }
    });

    logger.info(`Streamed agent update for project ${projectId}, agent ${agentName}`);
  }

  async streamConfidenceUpdate(projectId: string, confidence: number): Promise<void> {
    const event: StreamEvent = {
      type: 'confidence_update',
      projectId,
      data: {
        confidence,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    this.io.to(`project:${projectId}`).emit('confidence_update', event);

    // Update project confidence
    await Project.findByIdAndUpdate(projectId, {
      $set: { 'analytics.confidenceScore': confidence }
    });

    logger.info(`Streamed confidence update for project ${projectId}: ${confidence}`);
  }

  async streamFileGenerated(projectId: string, file: any): Promise<void> {
    const event: StreamEvent = {
      type: 'file_generated',
      projectId,
      data: {
        file,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    this.io.to(`project:${projectId}`).emit('file_generated', event);

    // Add file to project
    await Project.findByIdAndUpdate(projectId, {
      $push: { files: file }
    });

    logger.info(`Streamed file generated for project ${projectId}: ${file.name}`);
  }

  async streamProjectStatus(projectId: string, status: string, message?: string): Promise<void> {
    const event: StreamEvent = {
      type: 'project_status',
      projectId,
      data: {
        status,
        message,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    this.io.to(`project:${projectId}`).emit('project_status', event);

    // Update project status
    const updateData: any = { status };
    if (status === 'running') {
      updateData.startedAt = new Date();
    } else if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
    }

    await Project.findByIdAndUpdate(projectId, { $set: updateData });

    logger.info(`Streamed project status for ${projectId}: ${status}`);
  }

  getConnectedClients(projectId: string): number {
    return this.connections.get(projectId)?.size || 0;
  }
}

let streamingService: StreamingService;

export function setupStreaming(io: Server): StreamingService {
  if (!streamingService) {
    streamingService = new StreamingService(io);
  }
  return streamingService;
}

export function getStreamingService(): StreamingService {
  if (!streamingService) {
    throw new Error('Streaming service not initialized');
  }
  return streamingService;
}