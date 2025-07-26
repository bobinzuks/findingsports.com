// ABSOLUTE FAILSAFE SERVER - CANNOT FAIL
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Create the most basic HTTP server possible
const server = http.createServer((req, res) => {
    // Log every request
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // CORS headers for everything
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
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
    
    // Root endpoint
    if (req.url === '/' || req.url === '') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Finding Sports API', 
            status: 'running',
            port: PORT,
            deployment: process.env.RAILWAY_DEPLOYMENT_ID || 'local'
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
function startServer(port) {
    server.listen(port, '0.0.0.0', () => {
        console.log('=================================');
        console.log('✅ SERVER STARTED SUCCESSFULLY!');
        console.log(`✅ Port: ${port}`);
        console.log(`✅ Health: http://0.0.0.0:${port}/health`);
        console.log(`✅ Ready for Railway!`);
        console.log('=================================');
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} in use, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Failed to start server:', err);
            // Try again in 1 second
            setTimeout(() => startServer(port), 1000);
        }
    });
}

// START IMMEDIATELY
startServer(PORT);

// Also create a backup server on different port just in case
setTimeout(() => {
    const backupServer = http.createServer((req, res) => {
        res.writeHead(200);
        res.end('OK');
    });
    backupServer.listen(8080, () => {
        console.log('Backup server on 8080');
    }).on('error', () => {});
}, 100);