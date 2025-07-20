const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint - MUST be first
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'running',
      database: 'mock'
    }
  });
});

// Initialize services with error handling
let webSocketService;
try {
  webSocketService = require('./services/websocket');
  webSocketService.initialize(server, process.env.CORS_ORIGIN);
  console.log('WebSocket service initialized');
} catch (error) {
  console.error('WebSocket initialization failed:', error.message);
}

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// API Routes with error handling
const routes = [
  { path: '/api/games', file: './routes/games' },
  { path: '/api/venues', file: './routes/venues' },
  { path: '/api/sports', file: './routes/sports' },
  { path: '/api/play-now', file: './routes/play-now' },
  { path: '/api/auth', file: './routes/auth' },
  { path: '/api/user/games', file: './routes/user-games' }
];

routes.forEach(route => {
  try {
    app.use(route.path, require(route.file));
    console.log(`Route ${route.path} loaded`);
  } catch (error) {
    console.error(`Failed to load route ${route.path}:`, error.message);
    // Create fallback route
    app.use(route.path, (req, res) => {
      res.status(503).json({
        error: 'Service temporarily unavailable',
        route: route.path
      });
    });
  }
});

// Config endpoint
app.get('/api/config', (req, res) => {
  res.json({
    API_BASE_URL: process.env.API_BASE_URL || '',
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Finding Sports API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      apiHealth: '/api/health',
      games: '/api/games',
      venues: '/api/venues',
      playNow: '/api/play-now'
    }
  });
});

// Catch all for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Finding Sports backend running on http://0.0.0.0:${PORT}`);
  console.log(`Health check available at: http://0.0.0.0:${PORT}/health`);
  console.log('Environment:', {
    port: PORT,
    nodeEnv: process.env.NODE_ENV,
    hasJwtSecret: Boolean(process.env.JWT_SECRET)
  });
});