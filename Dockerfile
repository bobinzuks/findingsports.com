# Production Dockerfile for Finding Sports
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY mockup/backend/package*.json ./mockup/backend/

# Install dependencies
WORKDIR /app/mockup/backend
RUN npm ci --only=production

# Copy all application files
WORKDIR /app
COPY mockup/ ./mockup/

# Set production environment
ENV NODE_ENV=production

# Expose port (Railway will override with PORT env var)
EXPOSE 8080

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start command - use the main server
WORKDIR /app/mockup/backend
CMD ["node", "server.js"]