const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Simple health check
app.get('/health', (req, res) => {
  console.log('Health check called');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Finding Sports API',
    health: '/health'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log(`Health check at: http://0.0.0.0:${PORT}/health`);
});