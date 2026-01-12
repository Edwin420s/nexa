# Nexa Backend Testing Guide

Complete guide for testing the Nexa backend API.

## Quick Start

### 1. Start the server
```bash
# Simple dev mode (no database)
npm run dev:simple

# Full production mode (requires MongoDB + Redis)
npm run dev
```

### 2. Run tests

**Quick Check (fastest):**
```bash
chmod +x quick-test.sh
./quick-test.sh
```

**Full Test Suite:**
```bash
chmod +x test.sh
./test.sh
```

**TypeScript Tests:**
```bash
npm install axios  # First time only
npx ts-node src/tests/backend.test.ts
```

**Load Testing:**
```bash
node load-test.js
```

## Available Test Scripts

### 1. `quick-test.sh` - Fast Health Check
- ✓ Server running status
- ✓ Health endpoint
- ✓ Basic endpoint availability
- **Time**: ~2 seconds

```bash
./quick-test.sh
```

### 2. `test.sh` - Comprehensive Suite
- ✓ All API endpoints
- ✓ Authentication flow
- ✓ Project operations
- ✓ Error handling
- ✓ CORS headers
- ✓ Performance benchmarks
- ✓ JSON validation
- **Time**: ~30 seconds

```bash
./test.sh
```

### 3. `backend.test.ts` - Automated Testing
- ✓ Programmatic endpoint testing
- ✓ Response validation
- ✓ Concurrent request handling
- ✓ Detailed error reporting
- **Time**: ~10 seconds

```bash
npx ts-node src/tests/backend.test.ts
```

### 4. `load-test.js` - Performance Testing
- ✓ 100 requests (configurable)
- ✓ 10 concurrent users
- ✓ Response time statistics
- ✓ Success rate tracking
- ✓ Requests per second
- **Time**: ~10-30 seconds

```bash
# Default test
node load-test.js

# Custom configuration
BASE_URL=http://localhost:5000 node load-test.js
```

## Manual Testing with cURL

### Health Check
```bash
curl http://localhost:5000/health
```

### Register User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@nexa.ai",
    "password": "secure123",
    "name": "Developer"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@nexa.ai",
    "password": "secure123"
  }'
```

### Create Project
```bash
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Research Agent",
    "description": "Autonomous research assistant",
    "goal": "Research and summarize AI developments",
    "agents": [
      {"name": "researcher", "model": "gemini-2.5-flash"},
      {"name": "summarizer", "model": "gemini-2.5-flash"}
    ]
  }'
```

### List Projects
```bash
curl http://localhost:5000/api/v1/projects
```

## Testing Checklist

### Development Mode (No Database)
- [ ] Server starts successfully
- [ ] Health endpoint returns 200
- [ ] Mock authentication works
- [ ] Mock project creation works
- [ ] CORS headers present
- [ ] Response times < 100ms

### Production Mode (With Database)
- [ ] MongoDB connection successful
- [ ] Redis connection successful
- [ ] Real user registration
- [ ] JWT token generation
- [ ] Project persistence
- [ ] Agent orchestration
- [ ] SSE streaming
- [ ] Analytics tracking

## Performance Benchmarks

### Expected Response Times

| Endpoint              | Target   | Good     | Acceptable |
|-----------------------|----------|----------|------------|
| /health               | < 10ms   | < 50ms   | < 100ms    |
| /api/v1/auth/login    | < 50ms   | < 100ms  | < 200ms    |
| /api/v1/projects      | < 100ms  | < 200ms  | < 500ms    |
| Agent Execution       | < 5s     | < 10s    | < 30s      |

### Load Test Targets
- **Concurrent Users**: 10-50
- **Requests/Second**: > 100
- **Success Rate**: > 99%
- **P95 Response Time**: < 200ms

## Troubleshooting Tests

### Tests fail with "Connection refused"
```bash
# Check if server is running
curl http://localhost:5000/health

# If not, start it
npm run dev:simple
```

### Tests fail with JSON parse errors
```bash
# Server might not be fully started, wait 5 seconds and retry
sleep 5 && ./test.sh
```

### Permission denied when running .sh files
```bash
chmod +x test.sh quick-test.sh
```

### Missing dependencies
```bash
# Install jq for better JSON handling
sudo apt-get install jq

# Install curl if not present
sudo apt-get install curl

# Install Node.js dependencies
npm install
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Backend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Start server
        run: npm run dev:simple &
      - name: Wait for server
        run: sleep 5
      - name: Run tests
        run: ./test.sh
```

## Test Coverage

Current test coverage:
- ✅ Health endpoints
- ✅ Authentication (register, login)
- ✅ Project CRUD operations
- ✅ Error handling (404, validation)
- ✅ CORS configuration
- ✅ JSON response format
- ✅ Performance benchmarks
- ✅ Concurrent request handling
- ⏳ Agent orchestration (requires full setup)
- ⏳ SSE streaming (requires full setup)
- ⏳ Analytics (requires full setup)

## Next Steps

1. **Add Integration Tests**: Test with real MongoDB/Redis
2. **Add Unit Tests**: Jest for individual components
3. **Add E2E Tests**: Full workflow testing
4. **Add Security Tests**: Authentication, authorization, input validation
5. **Add Database Tests**: Data persistence, migrations

## Support

For issues with tests:
1. Check server logs
2. Verify all dependencies installed
3. Ensure correct environment variables
4. Review `RUNNING.md` for setup instructions

---

**Test Suite Version**: 1.0.0  
**Last Updated**: 2026-01-12
