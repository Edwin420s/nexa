const http = require('http');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your_gemini_api_key_here');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;
  
  if (url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      message: 'Nexa API Server with Gemini AI',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (url === '/api/v1/try-platform/try' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
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

        // Generate response using Gemini AI
        try {
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
            }
          });

          const response = result.response;
          const text = response.text();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'success',
            data: {
              response: text,
              model,
              tokensUsed: response.usageMetadata?.totalTokenCount || 0,
              tier: 'free'
            }
          }));
        } catch (geminiError) {
          console.error('Gemini API Error:', geminiError);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'AI service temporarily unavailable',
            error: geminiError.message
          }));
        }
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
  console.log('🚀 Nexa API Server with Gemini AI');
  console.log('='.repeat(60));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Try endpoint: http://localhost:${PORT}/api/v1/try-platform/try`);
  console.log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured - using mock responses'}`);
  console.log('='.repeat(60));
});
