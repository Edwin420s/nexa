# Build stage
FROM node:18-alpine AS builder

# Install dependencies
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache tzdata

# Create app directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nexa -u 1001

# Change ownership
RUN chown -R nexa:nodejs /app

# Switch to non-root user
USER nexa

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-5000}/health', (r) => {if (r.statusCode !== 200) throw new Error()})"

# Expose port
EXPOSE ${PORT:-5000}

# Start application
CMD ["node", "dist/server.js"]