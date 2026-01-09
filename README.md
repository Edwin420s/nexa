<div align="center">
  <h1>Nexa</h1>
  <h3>Autonomous Research & Development Platform</h3>
  <p>Build intelligent agents that research, code, and create with confidence</p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Next.js](https://img.shields.io/badge/Next.js-13.4+-black?logo=next.js)](https://nextjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
</div>

## 🚀 Overview

Nexa is an advanced autonomous research and development platform that leverages Google's Gemini AI models to create intelligent agents capable of performing complex tasks, generating code, and providing data-driven insights with confidence scoring.

## ✨ Key Features

### 🤖 Multi-Agent System
- **Research Agent**: Conducts in-depth analysis using Gemini 3 Pro
- **Code Generator**: Builds and refines applications with Gemini 2.5 Flash
- **Visual Creator**: Generates images and media using Nano Banana
- **Confidence Engine**: Continuously evaluates output reliability

### 🎯 Core Capabilities
- Real-time project evolution with live streaming
- Multi-modal AI processing (text, code, images)
- Automated testing and validation
- Comprehensive analytics dashboard
- Project versioning and history
- Team collaboration tools

### 🛠️ Technical Highlights
- Server-Sent Events (SSE) for real-time updates
- JWT-based authentication with role-based access
- MongoDB for flexible data storage
- Containerized deployment with Docker
- CI/CD ready with GitHub Actions

## 🏗️ Project Structure

```
nexa/
├── frontend/                 # Next.js 14 application
│   ├── app/                  # App router pages
│   │   ├── (auth)/           # Authentication pages
│   │   ├── dashboard/        # User dashboard
│   │   └── projects/         # Project management
│   ├── components/           # Reusable UI components
│   ├── lib/                  # Utility functions
│   └── styles/               # Global styles & themes
│
├── backend/                  # Node.js API server
│   ├── agent-orchestrator/   # AI agent management
│   │   ├── agents/           # Agent implementations
│   │   └── workflows/        # Multi-agent workflows
│   ├── config/               # Configuration files
│   ├── controllers/          # Request handlers
│   ├── models/               # Database models
│   ├── routes/               # API endpoints
│   └── services/             # Business logic
│
├── docker/                   # Docker configuration
│   ├── nginx/                # Web server config
│   └── mongodb/              # Database configuration
│
└── docs/                     # Documentation
    ├── api/                  # API references
    └── guides/               # User guides
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Docker & Docker Compose
- Google Cloud Account with Gemini API access
- MongoDB (local or Atlas)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Edwin420s/nexa.git
   cd nexa
   ```

2. **Set up environment variables**
   ```bash
   # Copy example environment files
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env
   
   # Update with your configuration
   nano frontend/.env.local
   nano backend/.env
   ```

3. **Start the development environment**
   ```bash
   # Start all services
   docker-compose up -d
   
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Start development server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - API Server: http://localhost:5000
   - MongoDB: mongodb://localhost:27017/nexadev

## 🤖 Agent Architecture

Nexa's agent system is built on a modular architecture:

1. **Agent Manager**
   - Handles agent lifecycle
   - Manages inter-agent communication
   - Tracks performance metrics

2. **Core Agents**
   - **Researcher**: Uses Gemini 3 Pro for deep analysis
   - **Coder**: Implements features with Gemini 2.5 Flash
   - **Designer**: Creates UI/UX with Nano Banana
   - **QA**: Validates outputs and provides feedback

3. **Confidence System**
   - Real-time confidence scoring
   - Self-reflection and improvement
   - Fallback mechanisms for low-confidence outputs

## 🔧 Configuration

### Environment Variables

#### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### Backend (`.env`)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nexadev
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

## 📊 Analytics & Monitoring

Nexa includes built-in analytics for:
- Agent performance metrics
- Resource utilization
- Confidence score trends
- User engagement
- Error tracking

## 🚀 Deployment

### Production Setup

1. **Build the application**
   ```bash
   # Build frontend
   cd frontend
   npm run build
   
   # Build backend
   cd ../backend
   npm run build
   ```

2. **Docker Compose (Production)**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

3. **Kubernetes (Optional)**
   ```bash
   kubectl apply -f k8s/
   ```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini API](https://ai.google.dev/) for powerful AI capabilities
- [Next.js](https://nextjs.org/) and [Vercel](https://vercel.com/) for the amazing framework and hosting
- [MongoDB](https://www.mongodb.com/) for flexible data storage
- The open-source community for their invaluable contributions
