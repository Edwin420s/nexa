# Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. Port Already in Use (EADDRINUSE)

**Error**: `Error: listen EADDRINUSE: address already in use :::5000`

**Causes**:
- Another process is using port 5000
- Previous backend instance didn't shut down properly

**Solutions**:

#### Option A: Kill Process on Port 5000
```bash
# Find process using port 5000
lsof -ti:5000

# Kill the process
kill -9 <PID>

# Or using fuser
fuser -k 5000/tcp
```

#### Option B: Use Different Port
The project is now configured to use port 5001 by default:

```bash
# Backend will use port 5001
cd backend && npm run dev

# Frontend is configured to connect to port 5001
cd frontend && npm run dev
```

#### Option C: Using Docker Compose
```bash
# Stop all services
docker-compose down

# Start services (will use port 5001)
docker-compose up -d
```

### 2. MongoDB Connection Issues

**Error**: `MongoNetworkError: connect ECONNREFUSED`

**Solutions**:

#### Check MongoDB Status
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:6.0

# Check if running
docker ps | grep mongo
```

#### Verify Connection String
Ensure your `.env` has correct MongoDB URI:
```env
MONGODB_URI=mongodb://localhost:27017/nexa
```

### 3. Redis Connection Issues

**Error**: `Redis connection failed`

**Solutions**:

#### Start Redis Service
```bash
# Start Redis
sudo systemctl start redis

# Or using Docker
docker run -d -p 6379:6379 --name redis redis:7.0-alpine

# Check connection
redis-cli ping
```

### 4. Frontend-Backend Connection Issues

**Error**: `POST http://localhost:5000/api/v1/auth/register 422 (Unprocessable Entity)`

**Causes**:
- Port mismatch between frontend and backend
- API version mismatch
- Backend not running

**Solutions**:

#### Check Environment Variables
Frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:5001
```

#### Verify Backend is Running
```bash
# Check if backend is accessible
curl http://localhost:5001/health

# Should return:
# {"status":"healthy","timestamp":"...","uptime":...}
```

### 5. Validation Errors

**Error**: `Password must contain at least one uppercase letter...`

**Causes**: Password requirements not met

**Password Requirements**:
- At least 8 characters
- One uppercase letter (A-Z)
- One lowercase letter (a-z)
- One number (0-9)
- One special character: `!@#$%^&*`

**Example Valid Password**: `Nexa123!`

### 6. Environment Variable Issues

**Error**: `Missing required environment variables`

**Solutions**:

#### Create .env File
```bash
# Copy example file
cp backend/.env.example backend/.env

# Copy frontend example
cp frontend/.env.example frontend/.env.local
```

#### Required Environment Variables
Backend `.env`:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/nexa
JWT_SECRET=your_jwt_secret_key_here_change_in_production
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:3000
```

Frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:5001
```

### 7. Docker Issues

**Error**: `docker-compose up fails`

**Solutions**:

#### Clean Docker Environment
```bash
# Remove all containers and networks
docker-compose down -v --remove-orphans

# Remove all images (optional)
docker system prune -a

# Rebuild and start
docker-compose up -d --build
```

#### Check Docker Logs
```bash
# View logs for all services
docker-compose logs

# View logs for specific service
docker-compose logs app
docker-compose logs mongodb
docker-compose logs redis
```

### 8. Node.js Version Issues

**Error**: Module compatibility issues

**Solutions**:

#### Check Node Version
```bash
# Required: Node.js 18+
node --version

# Recommended: Use nvm for version management
nvm use 18
```

#### Clean Install Dependencies
```bash
# Remove node_modules and package-lock
rm -rf node_modules package-lock.json

# Clean install
npm install
```

### 9. Database Index Warnings

**Warning**: `Duplicate schema index found`

**Status**: ✅ **FIXED** - Removed duplicate index definitions from schema files

### 10. Frontend Build Issues

**Error**: Next.js build failures

**Solutions**:

#### Clean Next.js Build
```bash
# Remove .next directory
rm -rf .next

# Rebuild
npm run build
```

#### Check TypeScript Errors
```bash
# Type check
npx tsc --noEmit

# Fix any TypeScript errors before building
```

## 🔧 Development Setup Checklist

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] MongoDB 6.0+ running
- [ ] Redis 7.0+ running
- [ ] Git installed
- [ ] Docker (optional but recommended)

### Environment Setup
- [ ] Backend `.env` configured
- [ ] Frontend `.env.local` configured
- [ ] Gemini API key obtained
- [ ] Ports 5001 and 3000 available

### Running the Application
- [ ] Start MongoDB service
- [ ] Start Redis service
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Verify both services are accessible

## 📞 Getting Help

If you're still having issues:

1. **Check the logs**: Look at console output for detailed error messages
2. **Verify environment**: Ensure all required variables are set
3. **Check dependencies**: Make sure all services are running
4. **Clean restart**: Sometimes a clean slate helps:
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```

### Community Support
- **GitHub Issues**: [Create an issue](https://github.com/Edwin420s/nexa/issues)
- **Discussions**: [Ask a question](https://github.com/Edwin420s/nexa/discussions)
- **Documentation**: [Read the docs](https://github.com/Edwin420s/nexa/wiki)

---

**Last Updated**: February 2026  
**Version**: 1.0.0
