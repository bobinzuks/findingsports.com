const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Security configuration
const PORT = process.env.PORT || 8080;
const BIND_ADDRESS = process.env.NODE_ENV === 'production' ? '127.0.0.1' : 'localhost';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB

// Rate limiting
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 100; // per minute

// Logging with sanitization
function secureLog(message, ...args) {
    // Remove sensitive patterns from logs
    const sanitized = JSON.stringify({ message, args })
        .replace(/\/home\/[^/]+/g, '/home/***')
        .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, 'x.x.x.x');
    console.log(new Date().toISOString(), JSON.parse(sanitized));
}

// Security headers middleware
function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
}

// CORS configuration
function setCorsHeaders(req, res) {
    const origin = req.headers.origin;
    
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Max-Age', '86400');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
}

// Rate limiting
function checkRateLimit(ip) {
    const now = Date.now();
    const userRequests = requestCounts.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    
    if (now > userRequests.resetTime) {
        userRequests.count = 0;
        userRequests.resetTime = now + RATE_LIMIT_WINDOW;
    }
    
    userRequests.count++;
    requestCounts.set(ip, userRequests);
    
    return userRequests.count <= MAX_REQUESTS;
}

// Secure file serving with path traversal protection
function serveStaticFile(req, res, basePath) {
    try {
        // Normalize and resolve the requested path
        const requestedPath = path.normalize(req.url).replace(/^\/+/, '');
        const absolutePath = path.resolve(basePath, requestedPath);
        const absoluteBase = path.resolve(basePath);
        
        // Prevent path traversal
        if (!absolutePath.startsWith(absoluteBase)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }
        
        // Check if file exists and is a file (not directory)
        if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        
        // Whitelist allowed extensions
        const ext = path.extname(absolutePath).toLowerCase();
        const allowedExtensions = ['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'];
        
        if (!allowedExtensions.includes(ext)) {
            res.writeHead(403);
            res.end('Forbidden file type');
            return;
        }
        
        // Set appropriate content type
        const contentTypes = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        };
        
        // Add CSP for HTML files
        if (ext === '.html') {
            res.setHeader('Content-Security-Policy', 
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "font-src 'self'; " +
                "connect-src 'self';"
            );
        }
        
        const content = fs.readFileSync(absolutePath);
        res.writeHead(200, { 
            'Content-Type': contentTypes[ext] || 'application/octet-stream',
            'Content-Length': content.length,
            'Cache-Control': 'public, max-age=3600'
        });
        res.end(content);
        
    } catch (err) {
        secureLog('Error serving file', { error: err.message });
        res.writeHead(500);
        res.end('Internal server error');
    }
}

// Main server
const server = http.createServer((req, res) => {
    // Get client IP
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Rate limiting
    if (!checkRateLimit(clientIp)) {
        res.writeHead(429, { 'Retry-After': '60' });
        res.end('Too many requests');
        return;
    }
    
    // Set security headers
    setSecurityHeaders(res);
    setCorsHeaders(req, res);
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // Request size limiting
    let requestSize = 0;
    req.on('data', (chunk) => {
        requestSize += chunk.length;
        if (requestSize > MAX_REQUEST_SIZE) {
            res.writeHead(413);
            res.end('Request entity too large');
            req.connection.destroy();
        }
    });
    
    // Secure logging
    secureLog('Request', { 
        method: req.method, 
        url: req.url,
        ip: clientIp,
        userAgent: req.headers['user-agent']
    });
    
    // API routes
    if (req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            version: process.env.APP_VERSION || '1.0.0'
        }));
        
    } else if (req.url.startsWith('/api/play-now')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            activities: {
                happeningNow: [{
                    id: crypto.randomUUID(),
                    sport: 'basketball',
                    venue: 'Hillcrest Community Centre',
                    address: '4575 Clancy Loranger Way, Vancouver',
                    lat: 49.2435,
                    lng: -123.1089,
                    time: '7:00 PM - 9:00 PM',
                    distance: '2.5 km'
                }],
                startingSoon: [],
                laterToday: [],
                openCourts: [],
                pickupGames: []
            },
            timestamp: new Date().toISOString()
        }));
        
    } else if (req.url === '/' || req.url === '/index.html') {
        serveStaticFile({ ...req, url: '/index.html' }, res, path.join(__dirname, '..'));
        
    } else if (req.url.startsWith('/css/') || req.url.startsWith('/js/') || req.url.startsWith('/images/')) {
        serveStaticFile(req, res, path.join(__dirname, '..'));
        
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
});

// Secure server startup
server.listen(PORT, BIND_ADDRESS, () => {
    secureLog('Secure server running', { 
        address: BIND_ADDRESS, 
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Graceful shutdown
const shutdown = (signal) => {
    secureLog('Shutdown signal received', { signal });
    
    server.close(() => {
        secureLog('Server closed');
        process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
        secureLog('Forced shutdown');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGUSR2', () => shutdown('SIGUSR2'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    secureLog('Uncaught exception', { error: err.message });
    shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
    secureLog('Unhandled rejection', { reason });
    shutdown('unhandledRejection');
});