const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    mode: 'emergency',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Basic API endpoint
app.get('/api/games', (req, res) => {
  res.json({
    games: [
      {
        id: 1,
        sport: 'Basketball',
        location: 'Community Center',
        time: 'Today at 7:00 PM',
        players: '8/10'
      },
      {
        id: 2,
        sport: 'Soccer',
        location: 'City Park',
        time: 'Tomorrow at 6:00 PM',
        players: '14/22'
      }
    ],
    mode: 'emergency',
    message: 'Running in emergency mode - limited functionality'
  });
});

// Serve static files from mockup directory
app.use(express.static(path.join(__dirname, 'mockup')));

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'mockup', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found', 
    mode: 'emergency',
    path: req.path 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error', 
    mode: 'emergency',
    message: err.message 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚨 Emergency server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🎮 API endpoint: http://localhost:${PORT}/api/games`);
  console.log(`🌐 Static files: http://localhost:${PORT}/`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});