"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Simple health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'Nexa Backend (Development Mode - No DB)',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Nexa API - Autonomous Research & Build Agent Platform',
        version: '1.0.0',
        status: 'Running in development mode',
        docs: '/api/v1',
        note: 'MongoDB and Redis not connected - using mock data'
    });
});
// Mock auth endpoint
app.post('/api/v1/auth/register', (req, res) => {
    res.json({
        success: true,
        message: 'Development mode - registration simulated',
        data: {
            user: {
                id: 'mock-user-id',
                email: req.body.email,
                name: req.body.name
            },
            token: 'mock-jwt-token-dev-mode'
        }
    });
});
app.post('/api/v1/auth/login', (req, res) => {
    res.json({
        success: true,
        message: 'Development mode - login simulated',
        data: {
            user: {
                id: 'mock-user-id',
                email: req.body.email
            },
            token: 'mock-jwt-token-dev-mode'
        }
    });
});
// Mock projects endpoint
app.get('/api/v1/projects', (req, res) => {
    res.json({
        success: true,
        data: {
            projects: [
                {
                    id: 'mock-project-1',
                    title: 'Sample Project',
                    status: 'completed',
                    createdAt: new Date()
                }
            ],
            pagination: { total: 1, limit: 20, skip: 0 }
        }
    });
});
// Mock agents try endpoint - for free tier
app.post('/api/v1/agents/try', (req, res) => {
    const { prompt, model = 'gemini-2.5-flash' } = req.body;
    if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Prompt is required'
        });
    }
    if (prompt.length > 1000) {
        return res.status(400).json({
            success: false,
            message: 'Prompt must be less than 1000 characters for free tier'
        });
    }
    // Mock AI response
    const mockResponse = `This is a mock AI response to: "${prompt}". In a real implementation, this would connect to Google's Gemini AI service. The response would be generated using the ${model} model.`;
    res.json({
        status: 'success',
        data: {
            response: mockResponse,
            model,
            tokensUsed: Math.floor(Math.random() * 100) + 50,
            tier: 'free'
        }
    });
});
app.post('/api/v1/projects', (req, res) => {
    res.json({
        success: true,
        message: 'Development mode - project created (simulated)',
        data: {
            project: {
                id: 'mock-project-id',
                title: req.body.title,
                goal: req.body.goal,
                status: 'draft',
                createdAt: new Date()
            }
        }
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        note: 'Running in development mode without database'
    });
});
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 Nexa Backend Server');
    console.log('='.repeat(60));
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`⚠️  Mode: DEVELOPMENT (No Database)`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log('='.repeat(60));
});
exports.default = app;
