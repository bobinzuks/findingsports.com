// ABSOLUTE FAILSAFE SERVER - CANNOT FAIL
// ZERO EXTERNAL DEPENDENCIES - ONLY NODE.JS BUILT-IN MODULES
const http = require('http');
const fs = require('fs');
const path = require('path');

// Railway provides PORT environment variable
const PORT = parseInt(process.env.PORT) || 3000;

// Log environment for debugging
console.log('=================================');
console.log('🚀 STARTING ABSOLUTE FAILSAFE SERVER');
console.log(`📍 Environment: ${process.env.RAILWAY_ENVIRONMENT || 'local'}`);
console.log(`📍 Deployment ID: ${process.env.RAILWAY_DEPLOYMENT_ID || 'none'}`);
console.log(`📍 Port Target: ${PORT}`);
console.log('=================================');

// Create the most basic HTTP server possible
const server = http.createServer((req, res) => {
    // Log every request
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // CORS headers for everything
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    // Remove Content Security Policy to avoid blocking issues
    // Since this is a development/demo server, we'll disable CSP
    
    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Health check endpoints - MULTIPLE FOR SAFETY
    if (req.url === '/health' || req.url === '/api/health' || req.url === '/_health' || req.url === '/healthz') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
        return;
    }
    
    // Root endpoint - redirect to index.html
    if (req.url === '/' || req.url === '') {
        res.writeHead(301, { 'Location': '/index.html' });
        res.end();
        return;
    }
    
    // Mock API endpoints
    if (req.url.startsWith('/api/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        
        // Social posts endpoint
        if (req.url === '/api/social/posts') {
            res.end(JSON.stringify({
                success: true,
                posts: [
                    {
                        id: 1,
                        userId: 'user1',
                        userName: 'John Doe',
                        userAvatar: '/images/avatar1.jpg',
                        content: 'Just finished an amazing basketball game at Central Park!',
                        sport: 'basketball',
                        location: 'Central Park',
                        likes: 12,
                        comments: 3,
                        timestamp: new Date(Date.now() - 3600000).toISOString()
                    },
                    {
                        id: 2,
                        userId: 'user2',
                        userName: 'Jane Smith',
                        userAvatar: '/images/avatar2.jpg',
                        content: 'Looking for tennis partners this weekend. Anyone interested?',
                        sport: 'tennis',
                        location: 'West Side Courts',
                        likes: 8,
                        comments: 5,
                        timestamp: new Date(Date.now() - 7200000).toISOString()
                    }
                ]
            }));
            return;
        }
        
        // Venues endpoint
        if (req.url === '/api/venues' || req.url.startsWith('/api/venues?')) {
            res.end(JSON.stringify({
                success: true,
                venues: [
                    {
                        id: 1,
                        name: 'Central Park Basketball Courts',
                        type: 'basketball',
                        latitude: 40.7829,
                        longitude: -73.9654,
                        address: 'Central Park, New York, NY',
                        activeGames: 2
                    },
                    {
                        id: 2,
                        name: 'West Side Tennis Center',
                        type: 'tennis',
                        latitude: 40.7751,
                        longitude: -73.9814,
                        address: '123 West Side Ave, New York, NY',
                        activeGames: 1
                    }
                ]
            }));
            return;
        }
        
        // Games nearby endpoint for MapLibre
        if (req.url.startsWith('/api/games/nearby')) {
            res.end(JSON.stringify({
                success: true,
                games: [
                    {
                        id: '1',
                        sport: 'Basketball',
                        venue: 'Kitsilano Beach Courts',
                        lat: 49.2747,
                        lng: -123.1442,
                        time: '6:00 PM',
                        players: '5/10',
                        skillLevel: 'Intermediate'
                    },
                    {
                        id: '2',
                        sport: 'Soccer',
                        venue: 'UBC Fields',
                        lat: 49.2606,
                        lng: -123.2460,
                        time: '7:00 PM',
                        players: '14/22',
                        skillLevel: 'All Levels'
                    },
                    {
                        id: '3',
                        sport: 'Volleyball',
                        venue: 'English Bay Beach',
                        lat: 49.2863,
                        lng: -123.1436,
                        time: '5:30 PM',
                        players: '4/6',
                        skillLevel: 'Beginner'
                    }
                ],
                total: 3
            }));
            return;
        }
        
        // Default API response
        res.end(JSON.stringify({
            success: true,
            message: 'API endpoint available',
            endpoint: req.url
        }));
        return;
    }
    
    // Try to serve static files
    try {
        let filePath = req.url;
        if (filePath === '/') filePath = '/index.html';
        
        const fullPath = path.join(__dirname, '..', filePath);
        
        // Security check
        if (!fullPath.startsWith(path.join(__dirname, '..'))) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }
        
        // Check if file exists
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            const ext = path.extname(fullPath);
            const contentType = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg'
            }[ext] || 'application/octet-stream';
            
            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(fullPath).pipe(res);
        } else {
            // File not found - return JSON error
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found', path: req.url }));
        }
    } catch (err) {
        // Any error - return 500
        console.error('Error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error' }));
    }
});

// ERROR HANDLING - NEVER CRASH
server.on('error', (err) => {
    console.error('Server error:', err);
    // Try to recover
    if (err.code === 'EADDRINUSE') {
        console.log('Port in use, trying next port...');
        server.listen(PORT + 1);
    }
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    // KEEP RUNNING NO MATTER WHAT
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
    // KEEP RUNNING NO MATTER WHAT
});

// SIGTERM handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        process.exit(0);
    });
});

// START THE SERVER - WITH MULTIPLE FALLBACKS
function startServer(port, retryCount = 0) {
    const startTime = Date.now();
    
    server.listen(port, '0.0.0.0', () => {
        const startupTime = Date.now() - startTime;
        console.log('=================================');
        console.log('✅ SERVER STARTED SUCCESSFULLY!');
        console.log(`✅ Port: ${port}`);
        console.log(`✅ Startup Time: ${startupTime}ms`);
        console.log(`✅ Health: http://0.0.0.0:${port}/health`);
        console.log(`✅ Ready for Railway!`);
        console.log('=================================');
        
        // Send success signal if Railway is listening
        if (process.send) {
            process.send('ready');
        }
    }).on('error', (err) => {
        console.error(`Port ${port} error:`, err.message);
        
        if (err.code === 'EADDRINUSE' && retryCount < 10) {
            const nextPort = port + 1;
            console.log(`Trying port ${nextPort}...`);
            startServer(nextPort, retryCount + 1);
        } else if (err.code === 'EACCES' && retryCount < 10) {
            // Permission denied - try higher port
            const nextPort = 3000 + Math.floor(Math.random() * 1000);
            console.log(`Permission denied, trying port ${nextPort}...`);
            startServer(nextPort, retryCount + 1);
        } else if (retryCount < 10) {
            // Other error - retry same port after delay
            console.log(`Retrying port ${port} in 500ms...`);
            setTimeout(() => startServer(port, retryCount + 1), 500);
        } else {
            console.error('FATAL: Could not start server after 10 attempts');
            // Last resort - try to start on ANY available port
            server.listen(0, '0.0.0.0', () => {
                const addr = server.address();
                console.log(`Emergency server started on port ${addr.port}`);
            });
        }
    });
}

// START IMMEDIATELY - NO DELAYS
startServer(PORT);

// Health check beacon - send periodic health signals
setInterval(() => {
    if (server.listening) {
        console.log(`[${new Date().toISOString()}] Server healthy on port ${server.address().port}`);
    }
}, 30000); // Every 30 seconds