# ABSOLUTE FAILSAFE DOCKERFILE - ZERO DEPENDENCIES
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy ONLY the server file - no package.json needed
COPY mockup/backend/absolute-failsafe-server.js ./mockup/backend/
COPY mockup/ ./mockup/

# Set production environment
ENV NODE_ENV=production

# Expose port (Railway will override with PORT env var)
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start command - direct path
CMD ["node", "/app/mockup/backend/absolute-failsafe-server.js"]