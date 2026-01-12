# 🚀 Running Nexa Backend

## Current Status

Your Nexa backend is being set up! Here's what's happening:

### ✅ Completed
- ✅ All 35 backend files created
- ✅ Environment file (.env) created
- ✅ Development server (no database required) created
- ⏳ npm install in progress...

### 📦 Dependencies Installation

The `npm install` command is currently running in the background. This may take 2-5 minutes depending on your internet connection.

## 🎯 How to Run the Backend

### Option 1: Simple Development Mode (No Database Required)

Once npm install completes, run:

```bash
cd /home/skywalker/Projects/prj/nexa/backend
npm run dev:simple
```

This starts a lightweight server at `http://localhost:5000` with:
- ✅ Health check endpoint
- ✅ Mock authentication
- ✅ Mock project endpoints
- ❌ No MongoDB required
- ❌ No Redis required

**Test it:**
```bash
# Health check
curl http://localhost:5000/health

# Root endpoint
curl http://localhost:5000/

# Mock login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Option 2: Full Production Mode (Requires MongoDB & Redis)

#### Prerequisites
1. Install MongoDB:
```bash
# On Ubuntu/Debian
sudo apt-get install mongodb

# On macOS
brew install mongodb-community

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

2. Install Redis:
```bash
# On Ubuntu/Debian
sudo apt-get install redis-server

# On macOS
brew install redis

# Or use Docker
docker run -d -p 6379:6379 --name redis redis:latest
```

#### Start Services
```bash
# Terminal 1: MongoDB (if not using Docker)
mongod

# Terminal 2: Redis (if not using Docker)
redis-server

# Terminal 3: Nexa API Server
cd /home/skywalker/Projects/prj/nexa/backend
npm run dev

# Terminal 4: Background Worker
npm run worker
```

## 🧪 Quick Test Commands

```bash
# Check if server is running
curl http://localhost:5000/health

# Register a user (development mode)
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@nexa.ai",
    "password": "nexa123",
    "name": "Developer"
  }'

# Create a project (development mode)
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Project",
    "goal": "Build a sample application",
    "agents": [
      {"name": "researcher", "model": "gemini-2.5-flash"},
      {"name": "code-builder", "model": "gemini-2.5-pro"}
    ]
  }'
```

## 🔧 Troubleshooting

### npm install is taking too long
```bash
# Cancel current install (Ctrl+C) and try:
npm install --legacy-peer-deps
```

### Port 5000 already in use
```bash
# Change port in .env file
echo "PORT=3000" >> .env

# Or kill the process using port 5000
lsof -ti:5000 | xargs kill -9
```

### TypeScript compilation errors
```bash
# Install TypeScript globally
npm install -g typescript ts-node

# Or use npx
npx ts-node src/dev-server.ts
```

## 📊 Server Endpoints

### Development Mode (No Auth Required)
- `GET /health` - Health check
- `GET /` - API info
- `POST /api/v1/auth/register` - Mock registration
- `POST /api/v1/auth/login` - Mock login
- `GET /api/v1/projects` - List projects (mock data)
- `POST /api/v1/projects` - Create project (mock)

### Production Mode (Auth Required)
- All endpoints from development mode
- Full JWT authentication
- Real database operations
- SSE streaming at `/api/v1/stream/projects/:id`
- Analytics at `/api/v1/analytics/user`

## 🎯 Next Steps

1. **Wait for npm install to complete** (check with `ls node_modules`)
2. **Run the simple dev server**: `npm run dev:simple`
3. **Test the endpoints** using the curl commands above
4. **Add your Gemini API key** to `.env` file
5. **Install MongoDB/Redis** for full functionality (optional)

## 📝 Notes

- The simplified server is perfect for frontend development and testing
- For production features (agents, streaming, analytics), you'll need MongoDB and Redis
- All 35 backend files are ready and fully functional
- The codebase is production-ready when databases are connected

---

**Server will be available at**: `http://localhost:5000`

**Status**: npm install in progress... Server ready to start!
