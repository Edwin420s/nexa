const http = require('http');

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      message: 'Test server running',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (req.url === '/api/v1/agents/try' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { prompt, model = 'gemini-2.5-flash' } = JSON.parse(body);
        
        if (!prompt || prompt.trim().length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Prompt is required'
          }));
          return;
        }

        const mockResponse = `🤖 **AI Response**

Your prompt: "${prompt}"

This is a working response from the Nexa platform! The frontend-backend connection is now functional.

Model used: ${model}
Status: Free tier demo

The connection is working perfectly!`;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          data: {
            response: mockResponse,
            model,
            tokensUsed: 156,
            tier: 'free'
          }
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Internal server error'
        }));
      }
    });
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    message: 'Route not found'
  }));
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
  console.log(`🤖 Try endpoint: http://localhost:${PORT}/api/v1/agents/try`);
  console.log('✅ Server ready for testing!');
});
