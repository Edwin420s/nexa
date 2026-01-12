# Nexa Backend

Autonomous Research & Build Agent Platform - Backend Server

## Overview

Nexa is a production-ready backend for an AI-powered autonomous agent platform that uses Google Gemini models to research, analyze, and generate code based on user-defined goals.

## Features

- 🤖 **Multi-Agent Orchestration** - Coordinates researcher, code builder, and summarizer agents
- 🔐 **JWT Authentication** - Secure user authentication and authorization
- 📊 **Real-Time Streaming** - SSE and WebSocket support for live updates
- 💾 **MongoDB Integration** - Scalable NoSQL database for projects and analytics
- ⚡ **Redis Caching** - Fast caching and session management
- 📈 **Analytics Dashboard** - Track project performance and agent metrics
- 🎯 **Confidence Scoring** - AI self-reflection and confidence tracking
- 🔄 **Background Jobs** - Bull queue for async agent execution

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB
- **Cache**: Redis
- **Queue**: Bull
- **AI**: Google Gemini API
- **Auth**: JWT

## Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- Redis >= 6.0
- Gemini API Key

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

## Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/nexa

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
```

## Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run queue worker (separate process)
npm run worker
```

## API Documentation

### Authentication

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### Projects

#### Create Project
```http
POST /api/v1/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Build a REST API",
  "description": "Create a scalable backend",
  "goal": "Build a Node.js REST API with authentication",
  "agents": [
    { "name": "researcher", "model": "gemini-2.5-flash" },
    { "name": "code-builder", "model": "gemini-2.5-pro" }
  ]
}
```

#### Get All Projects
```http
GET /api/v1/projects?status=completed&limit=20&skip=0
Authorization: Bearer <token>
```

#### Get Project By ID
```http
GET /api/v1/projects/:id
Authorization: Bearer <token>
```

#### Run Project
```http
POST /api/v1/projects/:id/run
Authorization: Bearer <token>
```

#### Stream Project Updates (SSE)
```http
GET /api/v1/stream/projects/:id
Authorization: Bearer <token>
Accept: text/event-stream
```

### Analytics

#### User Analytics
```http
GET /api/v1/analytics/user
Authorization: Bearer <token>
```

#### Project Analytics
```http
GET /api/v1/analytics/project/:id
Authorization: Bearer <token>
```

## Project Structure

```
backend/
├── src/
│   ├── agent-orchestrator/     # Agent coordination logic
│   │   ├── index.ts            # Main orchestrator
│   │   └── agents/             # Individual agents
│   │       ├── researcher.ts
│   │       ├── codeBuilder.ts
│   │       └── summarizer.ts
│   ├── models/                 # MongoDB models
│   │   ├── User.ts
│   │   ├── Project.ts
│   │   └── Analytics.ts
│   ├── routes/                 # API routes
│   │   ├── auth.ts
│   │   ├── projects.ts
│   │   ├── analytics.ts
│   │   ├── sse.ts
│   │   └── health.ts
│   ├── services/               # Business logic
│   │   ├── mongodb.ts
│   │   ├── redis.ts
│   │   ├── gemini.ts
│   │   ├── streaming.ts
│   │   ├── confidence.ts
│   │   └── queue.ts
│   ├── middleware/             # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validate.ts
│   ├── utils/                  # Utilities
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   ├── helpers.ts
│   │   └── validation.ts
│   ├── workers/                # Background workers
│   │   └── agentWorker.ts
│   └── server.ts               # Main server file
├── package.json
├── tsconfig.json
└── .env.example
```

## Agent Flow

1. **Planning Phase** - Decompose goal into tasks
2. **Research Phase** - Gather information using Gemini
3. **Synthesis Phase** - Summarize research findings
4. **Build Phase** - Generate code and architecture
5. **Evaluation Phase** - Calculate confidence and metrics

## Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start npm --name "nexa-api" -- start

# Start worker
pm2 start npm --name "nexa-worker" -- run worker

# View logs
pm2 logs nexa-api
```

### Using Docker

```bash
# Build image
docker build -t nexa-backend .

# Run container
docker run -d -p 5000:5000 --env-file .env nexa-backend
```

## Monitoring

Health check endpoint:
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-12T14:00:00.000Z",
  "uptime": 3600,
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open a GitHub issue.

---

Built with ❤️ for the Gemini 3 Hackathon
