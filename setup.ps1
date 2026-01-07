# Install backend dependencies
Write-Host "Installing backend dependencies..."
cd backend
npm install @google/generative-ai express mongoose cors helmet compression express-rate-limit dotenv bcryptjs jsonwebtoken winston socket.io bull redis joi uuid ts-node-dev typescript @types/express @types/cors @types/helmet @types/compression @types/bcryptjs @types/jsonwebtoken @types/uuid @types/node ts-node nodemon --save

# Install frontend dependencies
Write-Host "Installing frontend dependencies..."
cd ..
cd frontend
npm install next react react-dom @heroicons/react @tailwindcss/forms @tailwindcss/typography @headlessui/react recharts socket.io-client axios formik yup jwt-decode

# Create environment files
Write-Host "Creating environment files..."
cd ..

# Backend .env
$backendEnv = @"
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nexa
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=30d
GEMINI_API_KEY=your_gemini_api_key_here
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
"@

# Frontend .env.local
$frontendEnv = @"
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
"@

# Write environment files
Set-Content -Path "backend\.env" -Value $backendEnv
Set-Content -Path "frontend\.env.local" -Value $frontendEnv

Write-Host "Setup complete!"
Write-Host "1. Update the .env files with your actual configuration"
Write-Host "2. Start the development environment with: docker-compose up -d"
Write-Host "3. Run the backend: cd backend && npm run dev"
Write-Host "4. Run the frontend: cd frontend && npm run dev"
