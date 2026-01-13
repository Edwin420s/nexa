#!/bin/bash

# Nexa Stack - Complete Verification Script
# This script verifies all components are built, connected, and ready to run

set -e

echo "🚀 Nexa Stack - Complete Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="/home/skywalker/Projects/prj/nexa"

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        return 1
    fi
}

echo "📦 1. Checking Project Structure..."
echo "-----------------------------------"

# Backend structure
[ -d "$PROJECT_ROOT/backend/src" ] && print_status 0 "Backend source directory exists" || print_status 1 "Backend source missing"
[ -f "$PROJECT_ROOT/backend/package.json" ] && print_status 0 "Backend package.json exists" || print_status 1 "Backend package.json missing"
[ -f "$PROJECT_ROOT/backend/tsconfig.json" ] && print_status 0 "Backend TypeScript config exists" || print_status 1 "Backend TypeScript config missing"

# Frontend structure
[ -d "$PROJECT_ROOT/frontend/app" ] && print_status 0 "Frontend app directory exists" || print_status 1 "Frontend app missing"
[ -f "$PROJECT_ROOT/frontend/package.json" ] && print_status 0 "Frontend package.json exists" || print_status 1 "Frontend package.json missing"
[ -f "$PROJECT_ROOT/frontend/next.config.js" ] && print_status 0 "Frontend Next.js config exists" || print_status 1 "Frontend Next.js config missing"

echo ""
echo "🔧 2. Checking Backend Services..."
echo "-----------------------------------"

# Critical backend files
[ -f "$PROJECT_ROOT/backend/src/server.ts" ] && print_status 0 "Main server file exists" || print_status 1 "Main server missing"
[ -f "$PROJECT_ROOT/backend/src/services/gemini.ts" ] && print_status 0 "Gemini service exists" || print_status 1 "Gemini service missing"
[ -f "$PROJECT_ROOT/backend/src/services/streaming.ts" ] && print_status 0 "Streaming service exists" || print_status 1 "Streaming service missing"
[ -f "$PROJECT_ROOT/backend/src/services/mongodb.ts" ] && print_status 0 "MongoDB service exists" || print_status 1 "MongoDB service missing"
[ -f "$PROJECT_ROOT/backend/src/services/redis.ts" ] && print_status 0 "Redis service exists" || print_status 1 "Redis service missing"
[ -f "$PROJECT_ROOT/backend/src/services/queue.ts" ] && print_status 0 "Queue service exists" || print_status 1 "Queue service missing"

# Agent orchestrator
[ -f "$PROJECT_ROOT/backend/src/agent-orchestrator/orchestrator.ts" ] && print_status 0 "Agent orchestrator exists" || print_status 1 "Agent orchestrator missing"
[ -d "$PROJECT_ROOT/backend/src/agent-orchestrator/agents" ] && print_status 0 "Agent implementations directory exists" || print_status 1 "Agent implementations missing"

# Models
[ -f "$PROJECT_ROOT/backend/src/models/User.ts" ] && print_status 0 "User model exists" || print_status 1 "User model missing"
[ -f "$PROJECT_ROOT/backend/src/models/Project.ts" ] && print_status 0 "Project model exists" || print_status 1 "Project model missing"

# Routes
[ -f "$PROJECT_ROOT/backend/src/routes/auth.ts" ] && print_status 0 "Auth routes exist" || print_status 1 "Auth routes missing"
[ -f "$PROJECT_ROOT/backend/src/routes/projects.ts" ] && print_status 0 "Project routes exist" || print_status 1 "Project routes missing"
[ -f "$PROJECT_ROOT/backend/src/routes/sse.ts" ] && print_status 0 "SSE routes exist" || print_status 1 "SSE routes missing"

echo ""
echo "🎨 3. Checking Frontend Components..."
echo "--------------------------------------"

# Critical frontend pages
[ -f "$PROJECT_ROOT/frontend/app/page.tsx" ] && print_status 0 "Landing page exists" || print_status 1 "Landing page missing"
[ -f "$PROJECT_ROOT/frontend/app/dashboard/page.tsx" ] && print_status 0 "Dashboard page exists" || print_status 1 "Dashboard page missing"
[ -f "$PROJECT_ROOT/frontend/app/projects/[id]/page.tsx" ] && print_status 0 "Project detail page exists" || print_status 1 "Project detail page missing"
[ -f "$PROJECT_ROOT/frontend/app/login/page.tsx" ] && print_status 0 "Login page exists" || print_status 1 "Login page missing"

# Critical components
[ -f "$PROJECT_ROOT/frontend/components/SSEStream.tsx" ] && print_status 0 "SSE Stream component exists" || print_status 1 "SSE Stream component missing"
[ -f "$PROJECT_ROOT/frontend/components/AgentOutput.tsx" ] && print_status 0 "Agent Output component exists" || print_status 1 "Agent Output component missing"
[ -f "$PROJECT_ROOT/frontend/components/ConfidenceBar.tsx" ] && print_status 0 "Confidence Bar component exists" || print_status 1 "Confidence Bar component missing"
[ -f "$PROJECT_ROOT/frontend/lib/api.ts" ] && print_status 0 "API client library exists" || print_status 1 "API client library missing"

echo ""
echo "🔗 4. Checking Configuration Files..."
echo "--------------------------------------"

# Backend config
[ -f "$PROJECT_ROOT/backend/.env.example" ] && print_status 0 "Backend .env.example exists" || print_status 1 "Backend .env.example missing"
[ -f "$PROJECT_ROOT/backend/.env" ] && print_status 0 "Backend .env exists" || print_status 1 "Backend .env missing"

# Frontend config
[ -f "$PROJECT_ROOT/frontend/.env.example" ] && print_status 0 "Frontend .env.example exists" || print_status 1 "Frontend .env.example missing"
[ -f "$PROJECT_ROOT/frontend/.env.local" ] && print_status 0 "Frontend .env.local exists" || print_status 1 "Frontend .env.local missing"

# Docker
[ -f "$PROJECT_ROOT/docker-compose.yml" ] && print_status 0 "docker-compose.yml exists" || print_status 1 "docker-compose.yml missing"

echo ""
echo "🔍 5. Checking Service Wrappers..."
echo "-----------------------------------"

# Check for critical wrapper functions
if grep -q "getGeminiService" "$PROJECT_ROOT/backend/src/services/gemini.ts"; then
    print_status 0 "getGeminiService wrapper exists"
else
    print_status 1 "getGeminiService wrapper missing"
fi

if grep -q "getStreamingService" "$PROJECT_ROOT/backend/src/services/streaming.ts"; then
    print_status 0 "getStreamingService wrapper exists"
else
    print_status 1 "getStreamingService wrapper missing"
fi

echo ""
echo "📊 6. Environment Configuration Check..."
echo "-----------------------------------------"

# Check frontend API URL configuration
if grep -q "NEXT_PUBLIC_API_URL" "$PROJECT_ROOT/frontend/.env.local"; then
    FRONTEND_API_URL=$(grep "NEXT_PUBLIC_API_URL" "$PROJECT_ROOT/frontend/.env.local" | cut -d '=' -f 2)
    print_status 0 "Frontend API URL configured: $FRONTEND_API_URL"
else
    print_status 1 "Frontend API URL not configured"
fi

# Check backend port
if grep -q "PORT" "$PROJECT_ROOT/backend/.env.example"; then
    BACKEND_PORT=$(grep "^PORT=" "$PROJECT_ROOT/backend/.env.example" | cut -d '=' -f 2)
    print_status 0 "Backend port configured: $BACKEND_PORT"
else
    print_status 1 "Backend port not configured"
fi

echo ""
echo "📝 7. Checking Dependencies..."
echo "-------------------------------"

# Backend dependencies
if [ -f "$PROJECT_ROOT/backend/node_modules/.package-lock.json" ]; then
    print_status 0 "Backend dependencies installed"
else
    print_status 1 "Backend dependencies NOT installed - run: cd backend && npm install"
fi

# Frontend dependencies
if [ -f "$PROJECT_ROOT/frontend/node_modules/.package-lock.json" ]; then
    print_status 0 "Frontend dependencies installed"
else
    print_status 1 "Frontend dependencies NOT installed - run: cd frontend && npm install"
fi

echo ""
echo "📚 8. Checking Documentation..."
echo "--------------------------------"

[ -f "$PROJECT_ROOT/README.md" ] && print_status 0 "Main README exists" || print_status 1 "Main README missing"
[ -f "$PROJECT_ROOT/backend/README.md" ] && print_status 0 "Backend README exists" || print_status 1 "Backend README missing"
[ -f "$PROJECT_ROOT/backend/HACKATHON_SUBMISSION.md" ] && print_status 0 "Hackathon submission doc exists" || print_status 1 "Hackathon submission doc missing"

echo ""
echo "======================================"
echo "✨ Verification Complete!"
echo "======================================"
echo ""
echo "Next Steps:"
echo "1. Ensure MongoDB is running: docker-compose up -d mongodb"
echo "2. Ensure Redis is running: docker-compose up -d redis"
echo "3. Add your GEMINI_API_KEY to backend/.env"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm run dev"
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:5000"
echo ""
