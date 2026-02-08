const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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
    const mockResponse = `This is a mock AI response to: "${prompt}". In a real implementation, this would connect to Google's Gemini AI service. The response would be generated using the ${model} model.

Here's what the AI would typically do:
1. Analyze your request or question
2. Generate a thoughtful response based on the context
3. Provide helpful information or complete the task
4. Format the response in a clear and readable way

This mock response demonstrates that the frontend-backend connection is working properly. The real AI integration would use Google's Gemini API to generate actual intelligent responses.`;

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
    console.log(`🤖 Try endpoint: http://localhost:${PORT}/api/v1/agents/try`);
    console.log('='.repeat(60));
});
