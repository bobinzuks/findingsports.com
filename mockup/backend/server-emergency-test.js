
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Emergency server running',
        timestamp: new Date().toISOString(),
        port: PORT,
        env: process.env.NODE_ENV || 'development'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Finding Sports - Emergency Server</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                .status { padding: 20px; background: #f0f0f0; border-radius: 8px; }
                .ok { color: green; }
                .error { color: red; }
            </style>
        </head>
        <body>
            <h1>Finding Sports - Emergency Server</h1>
            <div class="status">
                <p class="ok">✅ Server is running!</p>
                <p>This is a minimal emergency server to verify Railway deployment.</p>
                <p>Time: ${new Date().toISOString()}</p>
                <p>Port: ${PORT}</p>
                <h3>Test Endpoints:</h3>
                <ul>
                    <li><a href="/health">/health</a> - Health check</li>
                    <li><a href="/api/test">/api/test</a> - API test</li>
                </ul>
                <h3>Next Steps:</h3>
                <ol>
                    <li>✅ Railway deployment is working</li>
                    <li>Set JWT_SECRET in Railway environment variables</li>
                    <li>Deploy the full server.js</li>
                </ol>
            </div>
        </body>
        </html>
    `);
});

// Test API endpoint
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API is working',
        timestamp: new Date().toISOString(),
        headers: req.headers
    });
});

// Catch all for debugging
app.use('*', (req, res) => {
    console.log(`404: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: 'Not found',
        path: req.originalUrl,
        method: req.method,
        message: 'Emergency server - endpoint not implemented'
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚨 Emergency server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Railway deployment: ${process.env.RAILWAY_ENVIRONMENT || 'unknown'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
