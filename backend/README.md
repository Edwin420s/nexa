# Nexa Backend - Technical Documentation

## Overview

The Nexa backend is a production-grade Node.js + Express + TypeScript API server that orchestrates autonomous AI agents powered by Google's Gemini 3 models.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **Cache/Queue**: Redis + Bull
- **AI API**: Google Gemini API (@google/generative-ai)
- **Real-time**: Socket.IO + Server-Sent Events (SSE)
- **Authentication**: JWT + bcrypt
- **Validation**: Joi + express-validator
- **Logging**: Winston
- **Testing**: Jest + ts-jest

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
npm start
```

## Architecture

### Multi-Agent Orchestration

The core of the backend is the **Agent Orchestrator** which coordinates 5 specialized agents:

1. **Planner** (Gemini 3 Pro) - Decomposes goals into tasks
2. **Researcher** (Gemini 3 Pro) - Gathers information and insights
3. **Synthesizer** (Gemini 2.5 Pro) - Makes strategic decisions 
4. **Builder** (Gemini 2.5 Flash) - Generates code and artifacts
5. **Evaluator** (Gemini 3 Pro) - Validates outputs with confidence scoring

### Component Overview

```
src/
├── agent-orchestrator/    # Multi-agent system
│   ├── orchestrator.ts    # Core orchestration engine
│   ├── agents/            # Individual agent implementations
│   └── workflows/         # Multi-agent workflows
├── controllers/           # HTTP request handlers
├── models/                # MongoDB schemas
├── routes/                # Express routes
├── services/              # Business logic
│   ├── gemini.ts          # Gemini API integration
│   ├── mongodb.ts         # Database connection
│   ├── redis.ts           # Redis client
│   ├── streaming.ts       # SSE streaming
│   └── queue.ts           # Bull queue management
├── middleware/            # Express middleware
└── utils/                 # Helper functions
```

## Core Services

### Gemini Service

Handles all interactions with the Gemini API:

```typescript
import { getGeminiService } from './services/gemini';

const gemini = getGeminiService();

// Generate content
const result = await gemini.generateContent(prompt, {
  model: 'gemini-3-pro',
  temperature: 0.7
});

// Generate with tools (function calling)
const toolResult = await gemini.generateWithTools(prompt, tools, {
  model: 'gemini-2.5-flash'
});

// Stream content
for await (const chunk of gemini.generateContentStream(prompt)) {
  console.log(chunk);
}
```

### Database Service

MongoDB connection and management:

```typescript
import { connectDB, disconnectDB } from './services/mongodb';

// Connect
await connectDB();

// Models automatically available
import { Project } from './models/Project';
const project = await Project.findById(id);
```

### Streaming Service

Real-time updates via SSE:

```typescript
import { getStreamingService } from './services/streaming';

const streaming = getStreamingService();

// Stream agent updates
await streaming.streamAgentUpdate(projectId, agentName, data);

// Stream confidence scores
await streaming.streamConfidenceUpdate(projectId, confidence);

// Stream project status
await streaming.streamProjectStatus(projectId, status, message);
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects` - List user projects
- `GET /api/v1/projects/:id` - Get project details
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project
- `POST /api/v1/projects/:id/run` - Execute agents

### Agents
- `POST /api/v1/agents/:projectId/:agentName` - Execute specific agent
- `GET /api/v1/agents/status/:projectId` - Get agent statuses

### Streaming
- `GET /api/v1/stream/projects/:id` - SSE stream for project updates

### Analytics
- `GET /api/v1/analytics/user` - User analytics
- `GET /api/v1/analytics/projects/:id` - Project analytics

### Health
- `GET /health` - Health check endpoint

## Database Schema

### User Model

```typescript
{
  name: string;
  email: string;          // Unique, indexed
  password: string;       // Hashed with bcrypt
  role: string;           // 'user' | 'admin'
  createdAt: Date;
  updatedAt: Date;
}
```

### Project Model

```typescript
{
  title: string;
  description: string;
  goal: string;
  userId: ObjectId;       // Reference to User
  status: string;         // 'pending' | 'running' | 'completed' | 'failed'
  agents: [{
    name: string;
    model: string;
    status: string;
  }];
  outputs: [{
    agentName: string;
    content: string;
    confidence: number;
    timestamp: Date;
  }];
  files: [{
    name: string;
    path: string;
    type: string;
    content: string;
  }];
  analytics: {
    confidenceScore: number;
    executionTime: number;
    tokensUsed: number;
  };
  startedAt: Date;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/nexa

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Quick health check
npm run test:quick

# Load testing
npm run test:load

# Coverage report
npm test -- --coverage
```

## Error Handling

All errors are handled by the centralized error handler middleware:

```typescript
// Custom error
throw new Error('Something went wrong');

// Validation error
throw new ValidationError('Invalid input');

// Agent error
throw new AgentError('Agent execution failed');

// Orchestrator error
throw new OrchestratorError('Project not found', 'PROJECT_NOT_FOUND');
```

## Logging

Winston logger configured with multiple transports:

```typescript
import logger from './utils/logger';

logger.info('Server started');
logger.error('Error occurred', { error });
logger.debug('Debug information');
```

Logs are stored in:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

## Security

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: DDoS protection
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Joi + express-validator
- **Password Hashing**: bcrypt with salt rounds

## Production Deployment

```bash
# Build TypeScript
npm run build

# Start production server
NODE_ENV=production npm start

# Or use PM2
pm2 start dist/server.js --name nexa-backend

# Monitor
pm2 monit
pm2 logs nexa-backend
```

## Docker Deployment

```bash
# Build image
docker build -t nexa-backend .

# Run container
docker run -p 5000:5000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/nexa \
  -e GEMINI_API_KEY=your_key \
  nexa-backend
```

## Performance Optimization

- **Connection Pooling**: MongoDB and Redis connections pooled
- **Caching**: Redis for frequently accessed data
- **Compression**: gzip compression enabled
- **Async Processing**: Bull queues for background jobs
- **Streaming**: SSE for real-time updates instead of polling

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
systemctl status mongod

# Test connection
mongosh mongodb://localhost:27017/nexa
```

### Redis Connection Issues
```bash
# Check if Redis is running
systemctl status redis

# Test connection
redis-cli ping
```

### Gemini API Issues
```bash
# Verify API key
echo $GEMINI_API_KEY

# Test API call
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: $GEMINI_API_KEY"
```

## License

MIT - See main README for details

---

**Built with ❤️ for Gemini 3 Hackathon 2026**
