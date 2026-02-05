# Nexa - Autonomous Research & Build Platform

<div align="center">

![Nexa Logo](https://img.shields.io/badge/Nexa-Autonomous%20AI%20Platform-blue?style=for-the-badge&logo=react)
![Gemini](https://img.shields.io/badge/Powered%20by-Gemini%203-blue?style=for-the-badge&logo=google)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Create projects. Run smart agents. Stream results. Score confidence. Track insights.**

[Live Demo](https://nexa.vercel.app) • [Documentation](#documentation) • [Report Bug](#issues) • [Request Feature](#features)

</div>

## 🌟 Overview

Nexa is an autonomous AI-powered research and build platform that leverages Google's Gemini 3 family of models to create intelligent agents that can research, code, summarize, and generate visual content. Built for the Gemini 3 Hackathon, Nexa demonstrates the future of autonomous AI systems that go beyond simple chat interfaces.

### 🚀 Key Features

- **🤖 Multi-Agent System**: Autonomous agents for research, code generation, summarization, and visual content creation
- **⚡ Real-Time Streaming**: Watch your projects evolve with Server-Sent Events (SSE) powered live updates
- **📊 Confidence Scoring**: AI-powered confidence metrics and self-reflection for all agent outputs
- **📈 Analytics Dashboard**: Track project performance, usage metrics, and agent effectiveness
- **🔧 Gemini 3 Integration**: Full utilization of Gemini 3 Pro, Gemini 2.5 Flash, and specialized models
- **💾 Project Management**: Save, pause, resume, and track multiple projects with full history
- **🎯 Task Orchestration**: Intelligent task queue management with priority-based execution

## 🏗️ Architecture

Nexa is built with a modern, scalable architecture that separates concerns and ensures high performance:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend     │    │    Backend      │    │   AI Services  │
│   (Next.js)    │◄──►│   (Node.js)    │◄──►│  (Gemini API)  │
│                 │    │                 │    │                 │
│ - React UI     │    │ - Express API   │    │ - Gemini 3 Pro │
│ - Tailwind CSS │    │ - Socket.io     │    │ - Gemini 2.5   │
│ - SSE Client   │    │ - MongoDB       │    │ - Nano Banana  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database     │
                    │  (MongoDB)     │
                    │                 │
                    │ - Users        │
                    │ - Projects     │
                    │ - Agents       │
                    │ - Analytics    │
                    └─────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Modern icon library
- **Recharts** - Data visualization
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type-safe development
- **Socket.io** - WebSocket server
- **MongoDB with Mongoose** - NoSQL database
- **Redis** - Caching and session management
- **Bull Queue** - Job queue management

### AI & APIs
- **Google Gemini API** - Core AI models
  - Gemini 3 Pro - Complex reasoning
  - Gemini 2.5 Flash - Fast generation
  - Gemini 2.5 Pro - Balanced performance
  - Nano Banana - Image generation
  - Veo 3.1 - Video generation

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Vercel** - Frontend deployment
- **MongoDB Atlas** - Cloud database
- **Winston** - Logging
- **Jest** - Testing framework

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB 6.0+
- Redis 7.0+
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Edwin420s/nexa.git
   cd nexa
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   
   # Frontend environment
   cd ../frontend
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start Services**
   ```bash
   # Using Docker Compose (Recommended)
   docker-compose up -d
   
   # Or manually start services
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/health

### Environment Variables

#### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/nexa
REDIS_URL=redis://localhost:6379

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Authentication
JWT_SECRET=your_jwt_secret_here

# CORS
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 📖 Usage Guide

### 1. Creating a Project

1. Sign up or log in to your Nexa account
2. Click "Create New Project"
3. Fill in project details:
   - **Title**: Project name
   - **Description**: Brief overview
   - **Goal**: Detailed objective for agents
4. Configure agents:
   - **Researcher**: Gathers information and insights
   - **Code Builder**: Generates implementation code
   - **Summarizer**: Creates executive summaries
   - **Visual Generator**: Produces diagrams and mockups

### 2. Running Agents

Once your project is created:

1. Click "Start Project" to begin agent execution
2. Watch real-time progress in the streaming interface
3. Monitor confidence scores and self-reflection notes
4. View generated files and outputs

### 3. Analytics & Insights

Access the analytics dashboard to track:
- Project completion rates
- Average confidence scores
- Agent performance metrics
- Token usage statistics
- Execution time analytics

## 🤖 Agent System

Nexa's autonomous agents are specialized AI workers that collaborate to achieve project goals:

### Research Agent
- **Model**: Gemini 3 Pro
- **Purpose**: Comprehensive research and analysis
- **Capabilities**: Web search, document analysis, source verification
- **Output**: Structured research reports with confidence scores

### Code Builder Agent
- **Model**: Gemini 2.5 Flash
- **Purpose**: Generate production-ready code
- **Capabilities**: Architecture design, implementation, testing
- **Output**: Complete codebases with documentation

### Summarizer Agent
- **Model**: Gemini 2.5 Pro
- **Purpose**: Synthesize and summarize findings
- **Capabilities**: Executive summaries, key insights, recommendations
- **Output**: Concise, actionable summaries

### Visual Generator Agent
- **Model**: Nano Banana
- **Purpose**: Create visual assets and diagrams
- **Capabilities**: Architecture diagrams, UI mockups, flowcharts
- **Output**: Visual representations in text format

## 🔧 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
DELETE /api/auth/logout
```

### Project Endpoints

```http
GET    /api/projects              # Get user projects
POST   /api/projects              # Create new project
GET    /api/projects/:id          # Get project details
PUT    /api/projects/:id          # Update project
DELETE /api/projects/:id          # Delete project
POST   /api/projects/:id/run      # Start project execution
POST   /api/projects/:id/pause    # Pause execution
POST   /api/projects/:id/resume   # Resume execution
```

### Agent Endpoints

```http
POST   /api/agents/execute        # Execute single agent
GET    /api/agents/status/:id     # Get agent status
GET    /api/agents/outputs/:id    # Get agent outputs
```

### Streaming Endpoints

```http
GET    /api/stream/projects/:id    # SSE project updates
GET    /api/stream/agents/:id      # SSE agent updates
```

### Analytics Endpoints

```http
GET    /api/analytics/overview     # User analytics
GET    /api/analytics/projects/:id # Project analytics
GET    /api/analytics/agents       # Agent performance
```

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Frontend tests (when implemented)
cd frontend
npm test               # Run tests
npm run test:coverage  # Coverage report
```

### Test Coverage

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user workflow testing (planned)

## 📦 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   # Set production environment variables
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   GEMINI_API_KEY=production_key
   ```

2. **Build Applications**
   ```bash
   # Build backend
   cd backend
   npm run build
   
   # Build frontend
   cd ../frontend
   npm run build
   ```

3. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Vercel Deployment (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

## 🔒 Security

Nexa implements multiple security measures:

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input sanitization
- **CORS Protection**: Cross-origin resource sharing controls
- **Helmet.js**: Security headers and protections
- **Environment Variables**: Sensitive data protection

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google DeepMind** - For the amazing Gemini 3 API
- **Vercel** - For hosting and deployment platform
- **MongoDB** - For the powerful database solution
- **Open Source Community** - For the incredible tools and libraries

## 📞 Support

- **Documentation**: [Wiki](https://github.com/Edwin420s/nexa/wiki)
- **Issues**: [GitHub Issues](https://github.com/Edwin420s/nexa/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Edwin420s/nexa/discussions)
- **Email**: support@nexa.ai

## 🗺️ Roadmap

### Version 1.1 (Q2 2026)
- [ ] Team collaboration features
- [ ] Advanced analytics dashboard
- [ ] Custom agent creation
- [ ] Plugin system

### Version 1.2 (Q3 2026)
- [ ] Voice interaction support
- [ ] Mobile applications
- [ ] Enterprise features
- [ ] Advanced security features

### Version 2.0 (Q4 2026)
- [ ] Multi-cloud support
- [ ] Advanced AI orchestration
- [ ] Real-time collaboration
- [ ] Marketplace for agents

---

<div align="center">

**Built with ❤️ for the Gemini 3 Hackathon**

[⭐ Star this repo](https://github.com/Edwin420s/nexa) • [🐛 Report Issues](https://github.com/Edwin420s/nexa/issues) • [📖 Documentation](https://github.com/Edwin420s/nexa/wiki)

</div>
