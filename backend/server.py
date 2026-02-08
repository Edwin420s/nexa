#!/usr/bin/env python3
import http.server
import socketserver
import json
import urllib.parse
from datetime import datetime

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                'status': 'healthy',
                'message': 'Python test server running',
                'timestamp': datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {'success': False, 'message': 'Route not found'}
            self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        if self.path == '/api/v1/agents/try':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                prompt = data.get('prompt', '')
                model = data.get('model', 'gemini-2.5-flash')
                
                if not prompt or prompt.strip() == '':
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    response = {'success': False, 'message': 'Prompt is required'}
                    self.wfile.write(json.dumps(response).encode())
                    return
                
                if len(prompt) > 1000:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    response = {'success': False, 'message': 'Prompt must be less than 1000 characters for free tier'}
                    self.wfile.write(json.dumps(response).encode())
                    return

                # Mock AI response
                mock_response = f"""🤖 **AI Response**

Your prompt: "{prompt}"

This is a working response from the Nexa platform backend!

Model used: {model}
Status: Free tier demo
Server: Python test server

The backend is now running and responding correctly!"""

                response = {
                    'status': 'success',
                    'data': {
                        'response': mock_response,
                        'model': model,
                        'tokensUsed': 156,
                        'tier': 'free'
                    }
                }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {'success': False, 'message': 'Internal server error'}
                self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {'success': False, 'message': 'Route not found'}
            self.wfile.write(json.dumps(response).encode())

if __name__ == "__main__":
    PORT = 5000
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 Python test server running on port {PORT}")
        print(f"📡 Health: http://localhost:{PORT}/health")
        print(f"🤖 Try endpoint: http://localhost:{PORT}/api/v1/agents/try")
        print("✅ Server ready for testing!")
        httpd.serve_forever()
