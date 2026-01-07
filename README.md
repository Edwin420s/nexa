# Nexa - Autonomous Research & Build Platform

Nexa is a cutting-edge platform that enables users to create autonomous research projects powered by AI agents. The platform leverages Google's Gemini models to perform complex research, generate code, and provide real-time insights with confidence scoring.

## 🌟 Features

- **Autonomous AI Agents**: Research, summarize, and build code automatically
- **Real-time Streaming**: Watch your projects evolve with live updates
- **Confidence Scoring**: Understand the reliability of AI-generated content
- **Multi-modal AI**: Text, code, and image generation capabilities
- **Project Management**: Save, track, and manage your research projects
- **Analytics Dashboard**: Monitor performance and insights

## 🚀 Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts for data visualization
- Server-Sent Events (SSE) for real-time updates

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- Google Gemini API integration
- JWT Authentication

### Infrastructure
- Docker & Docker Compose
- MongoDB Atlas (for production)
- Vercel (for deployment)

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker & Docker Compose
- Google Cloud Account with Gemini API access

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Edwin420s/nexa.git
   cd nexa
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env` in both `frontend` and `backend` directories
   - Update the values with your configuration

3. **Start the development environment**
   ```bash
   # Start MongoDB and backend services
   docker-compose up -d
   
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Start the development server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: mongodb://localhost:27017/nexa

## 🏗️ Project Structure

```
nexa/
├── frontend/               # Next.js frontend application
│   ├── app/                # App router pages
│   ├── components/         # Reusable React components
│   ├── contexts/           # React contexts
│   ├── lib/                # Utility functions
│   └── styles/             # Global styles
│
├── backend/                # Node.js backend
│   ├── agent-orchestrator/ # AI agent management
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── utils/              # Utility functions
│
├── docker/                 # Docker configuration
└── docs/                   # Documentation
```

## 🤖 Agent Architecture

Nexa uses a multi-agent system where each agent specializes in different tasks:

1. **Researcher Agent**: Performs in-depth research using Gemini 3 Pro
2. **Code Generator**: Creates and refines code using Gemini 2.5 Flash
3. **Summarizer**: Condenses information and generates reports
4. **Confidence Scorer**: Evaluates the reliability of outputs

## 🔒 Authentication

Nexa uses JWT (JSON Web Tokens) for authentication. The authentication flow includes:

- Email/Password registration and login
- JWT token generation and validation
- Protected API routes
- Role-based access control (coming soon)

## 📊 Analytics

The platform collects and visualizes various metrics:

- Project execution times
- Agent performance
- Confidence score trends
- Resource usage

## 🚀 Deployment

### Production Deployment

1. **Set up environment variables** in your production environment
2. **Build the Docker images**:
   ```bash
   docker-compose -f docker-compose.production.yml build
   ```
3. **Start the services**:
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Deploy!

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini API for powerful AI capabilities
- Next.js and Vercel for the amazing frontend framework and hosting
- MongoDB for flexible data storage
- The open-source community for their invaluable contributions
