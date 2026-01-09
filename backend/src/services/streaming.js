"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingService = void 0;
exports.setupStreaming = setupStreaming;
exports.getStreamingService = getStreamingService;
const Project_1 = require("../models/Project");
const Analytics_1 = require("../models/Analytics");
const logger_1 = __importDefault(require("../utils/logger"));
class StreamingService {
    constructor(io) {
        this.connections = new Map(); // projectId -> socketIds
        this.io = io;
        this.setupSocketHandlers();
    }
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            logger_1.default.info(`Socket connected: ${socket.id}`);
            socket.on('subscribe', (projectId) => {
                this.subscribeToProject(socket.id, projectId);
                socket.join(`project:${projectId}`);
                logger_1.default.info(`Socket ${socket.id} subscribed to project ${projectId}`);
            });
            socket.on('unsubscribe', (projectId) => {
                this.unsubscribeFromProject(socket.id, projectId);
                socket.leave(`project:${projectId}`);
                logger_1.default.info(`Socket ${socket.id} unsubscribed from project ${projectId}`);
            });
            socket.on('disconnect', () => {
                this.removeSocket(socket.id);
                logger_1.default.info(`Socket disconnected: ${socket.id}`);
            });
        });
    }
    subscribeToProject(socketId, projectId) {
        if (!this.connections.has(projectId)) {
            this.connections.set(projectId, new Set());
        }
        this.connections.get(projectId).add(socketId);
    }
    unsubscribeFromProject(socketId, projectId) {
        if (this.connections.has(projectId)) {
            this.connections.get(projectId).delete(socketId);
            if (this.connections.get(projectId).size === 0) {
                this.connections.delete(projectId);
            }
        }
    }
    removeSocket(socketId) {
        for (const [projectId, socketIds] of this.connections.entries()) {
            if (socketIds.has(socketId)) {
                socketIds.delete(socketId);
                if (socketIds.size === 0) {
                    this.connections.delete(projectId);
                }
            }
        }
    }
    async streamAgentUpdate(projectId, agentName, output) {
        const event = {
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
        await Analytics_1.Analytics.create({
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
        logger_1.default.info(`Streamed agent update for project ${projectId}, agent ${agentName}`);
    }
    async streamConfidenceUpdate(projectId, confidence) {
        const event = {
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
        await Project_1.Project.findByIdAndUpdate(projectId, {
            $set: { 'analytics.confidenceScore': confidence }
        });
        logger_1.default.info(`Streamed confidence update for project ${projectId}: ${confidence}`);
    }
    async streamFileGenerated(projectId, file) {
        const event = {
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
        await Project_1.Project.findByIdAndUpdate(projectId, {
            $push: { files: file }
        });
        logger_1.default.info(`Streamed file generated for project ${projectId}: ${file.name}`);
    }
    async streamProjectStatus(projectId, status, message) {
        const event = {
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
        const updateData = { status };
        if (status === 'running') {
            updateData.startedAt = new Date();
        }
        else if (status === 'completed' || status === 'failed') {
            updateData.completedAt = new Date();
        }
        await Project_1.Project.findByIdAndUpdate(projectId, { $set: updateData });
        logger_1.default.info(`Streamed project status for ${projectId}: ${status}`);
    }
    getConnectedClients(projectId) {
        return this.connections.get(projectId)?.size || 0;
    }
}
exports.StreamingService = StreamingService;
let streamingService;
function setupStreaming(io) {
    if (!streamingService) {
        streamingService = new StreamingService(io);
    }
    return streamingService;
}
function getStreamingService() {
    if (!streamingService) {
        throw new Error('Streaming service not initialized');
    }
    return streamingService;
}
