// FAILSAFE Railway Server - Guaranteed to start
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// CRITICAL: Health check endpoint MUST work
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Finding Sports API - Railway Deployment',
        status: 'active',
        version: process.env.RAILWAY_DEPLOYMENT_ID || 'local'
    });
});

// Serve static files from parent mockup directory
app.use(express.static(path.join(__dirname, '..')));

// Catch-all to serve index.html
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '..', 'index.html');
    if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server with explicit success logging
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server started successfully on port ${PORT}`);
    console.log(`✅ Health check available at http://0.0.0.0:${PORT}/health`);
    console.log(`✅ API health check at http://0.0.0.0:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    // Keep server running
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
    // Keep server running
});