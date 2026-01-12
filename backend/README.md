# Nexa - Autonomous Research & Build Agent Platform

**Built for Gemini 3 Hackathon**

Nexa is an autonomous multi-agent system that transforms high-level goals into fully researched architectures, working code, and actionable insights using Google's Gemini 3 AI models.

## 🎯 What Nexa Does

Transform vague ideas into production-ready solutions through autonomous AI agents that:
- **Plan** complex projects into executable tasks
- **Research** using Gemini's 1M token context and Google Search
- **Synthesize** findings into coherent strategies
- **Build** working code and architecture
- **Evaluate** outputs with confidence scoring and self-reflection

## 🧠 Gemini 3 Integration

Nexa leverages the full Gemini ecosystem:

- **Gemini 3 Pro**: Core reasoning engine for complex decision-making and multi-step planning
- **Gemini 2.5 Flash**: Fast code generation and research synthesis
- **Thinking Capabilities**: Maintains reasoning continuity across long-running tasks
- **Function Calling**: Structured agent-to-tool communication
- **Structured Outputs**: Deterministic JSON responses for reliable automation
- **Long Context (1M tokens)**: Full project state awareness without memory loss
- **Google Search Integration**: Real-time information gathering

### Agent Architecture

```
User Goal → Orchestrator → [Planner → Researcher → Synthesizer → Builder → Evaluator]
                                ↓
                          Confidence Scoring
                                ↓
                          Self-Reflection
                                ↓
                          Streaming Output
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your GEMINI_API_KEY

# Run development server
npm run dev

# Run tests
npm test
```

## 📡 API Endpoints

### Core Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - Authentication
- `POST /api/v1/projects` - Create autonomous project
- `GET /api/v1/projects/:id` - Get project details
- `POST /api/v1/projects/:id/run` - Execute agents
- `GET /api/v1/stream/projects/:id` - Real-time SSE streaming
- `GET /api/v1/analytics/user` - Usage analytics

## 🏗️ Architecture

### Multi-Phase Execution
1. **Planning** - Goal decomposition with Gemini 3 Pro
2. **Research** - Information gathering via Search + Gemini
3. **Synthesis** - Decision making and architecture design  
4. **Build** - Code generation with verification
5. **Evaluation** - Confidence scoring and validation

### Technology Stack
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB (projects, analytics, users)
- **AI**: Gemini 3 Pro, Gemini 2.5 Flash
- **Real-time**: Server-Sent Events (SSE)
- **Queue**: Bull + Redis for background jobs
- **Auth**: JWT with bcrypt

## 📊 Key Features

✅ **Autonomous Execution** - No human intervention after goal submission  
✅ **Confidence Scoring** - AI self-evaluation on every output  
✅ **Real-Time Streaming** - Live progress updates via SSE  
✅ **Long-Running Tasks** - Handles multi-hour autonomous workflows  
✅ **Self-Correction** - Agents learn from failures and retry  
✅ **Transparent Reasoning** - Full decision chain visibility  

## 🔧 Environment Variables

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/nexa
REDIS_HOST=localhost
REDIS_PORT=6379
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Quick health check
npm run test:quick

# Load testing
npm run test:load
```

## 📦 Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Start background worker
npm run worker
```

## 🎥 Demo

Watch Nexa autonomously:
1. Accept a high-level goal
2. Research best practices via Gemini + Search
3. Generate system architecture
4. Build working code
5. Self-evaluate with confidence scores

All without human intervention.

## 🏆 Hackathon Highlights

This project showcases:
- **Marathon Agent** capabilities with multi-hour autonomous execution
- **Advanced reasoning** using Gemini 3's thinking features
- **Tool orchestration** via function calling
- **Production-grade** architecture (not a demo wrapper)
- **Explainable AI** through confidence scoring and reflection

## 📄 License

MIT

---

**Built with ❤️ for Gemini 3 Hackathon 2026**
