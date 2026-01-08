import { Server } from 'socket.io';
import logger from '../utils/logger';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    logger.info('New client connected:', socket.id);

    // Handle project updates
    socket.on('joinProject', (projectId: string) => {
      socket.join(`project:${projectId}`);
      logger.info(`Client ${socket.id} joined project ${projectId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info('Client disconnected:', socket.id);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  return io;
};

// Helper function to emit events to a specific project room
export const emitToProject = (io: Server, projectId: string, event: string, data: any) => {
  io.to(`project:${projectId}`).emit(event, data);
};