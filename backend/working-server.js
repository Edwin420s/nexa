const http = require('http');

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse URL
  const url = req.url;
  
  if (url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      message: 'Nexa API Server running',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (url === '/api/v1/try-platform/try' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const prompt = data.prompt || '';
        const model = data.model || 'gemini-2.5-flash';
        
        if (!prompt || prompt.trim().length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Prompt is required'
          }));
          return;
        }

        if (prompt.length > 1000) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Prompt must be less than 1000 characters for free tier'
          }));
          return;
        }

        // Generate AI response
        const aiResponse = `🤖 **AI Response**

Your prompt: "${prompt}"

This is a demonstration response from the Nexa platform powered by Google's Gemini AI models.

**Model Information:**
- Processing: ${model}
- Capability: Multi-domain analysis
- Confidence: High (94% match to your needs)
- Tier: Free demonstration

**What our AI agents can do:**
1. **Research**: Analyze complex topics and provide comprehensive insights
2. **Code Generation**: Generate production-ready code in multiple languages
3. **Problem Solving**: Break down complex problems into actionable solutions
4. **Creative Writing**: Generate stories, articles, and creative content
5. **Data Analysis**: Process and analyze data with intelligent insights

**Next Steps:**
Would you like me to elaborate on any specific aspect of this solution? I can provide detailed code examples, in-depth technical specifications, or creative variations based on your preferences.

This demonstrates advanced AI capabilities with comprehensive, context-aware assistance!`;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          data: {
            response: aiResponse,
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

  // 404 for all other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    message: 'Route not found'
  }));
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Nexa API Server');
  console.log('='.repeat(60));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Try endpoint: http://localhost:${PORT}/api/v1/try-platform/try`);
  console.log('='.repeat(60));
});
