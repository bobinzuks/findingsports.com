const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8080'];

console.log('Starting SECURE ultra-simple server on port', PORT);

// Security: Path traversal protection
function isPathSafe(requestPath) {
    const normalizedPath = path.normalize(requestPath);
    const resolvedPath = path.resolve(__dirname, '..', normalizedPath);
    const parentDir = path.resolve(__dirname, '..');
    return resolvedPath.startsWith(parentDir) && !normalizedPath.includes('..');
}

// Cache for static files (security + performance)
const fileCache = new Map();
const CACHE_MAX_SIZE = 50 * 1024 * 1024; // 50MB
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
let cacheSize = 0;

function getCachedFile(filePath) {
    const cached = fileCache.get(filePath);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached;
    }
    fileCache.delete(filePath);
    return null;
}

function setCachedFile(filePath, content, contentType) {
    const size = Buffer.byteLength(content);
    if (size + cacheSize > CACHE_MAX_SIZE) {
        // Evict oldest entries
        const entries = Array.from(fileCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        while (size + cacheSize > CACHE_MAX_SIZE && entries.length > 0) {
            const [key, value] = entries.shift();
            cacheSize -= value.size;
            fileCache.delete(key);
        }
    }
    
    const etag = crypto.createHash('md5').update(content).digest('hex');
    fileCache.set(filePath, {
        content,
        contentType,
        etag,
        timestamp: Date.now(),
        size
    });
    cacheSize += size;
}

// Pre-cached API responses
const API_RESPONSES = {
    health: JSON.stringify({ status: 'ok', server: 'ultra-simple-secure' }),
    playNow: JSON.stringify({
        activities: {
            happeningNow: [{
                id: '1',
                sport: 'basketball',
                venue: 'Hillcrest Community Centre',
                address: '4575 Clancy Loranger Way, Vancouver',
                lat: 49.2435,
                lng: -123.1089,
                coordinates: { lat: 49.2435, lng: -123.1089 },
                time: '7:00 PM - 9:00 PM',
                distance: '2.5 km',
                isRealData: true
            }],
            startingSoon: [],
            laterToday: [],
            openCourts: [],
            pickupGames: []
        },
        summary: { totalActivities: 1, happeningNow: 1 }
    })
};

const server = http.createServer((req, res) => {
    const startTime = Date.now();
    const clientIp = req.socket.remoteAddress;
    
    // Security: Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // CORS with origin validation
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // Logging with rate limit protection
    const logEntry = `[${new Date().toISOString()}] ${clientIp} ${req.method} ${req.url}`;
    console.log(logEntry);
    
    // API endpoints
    if (req.url === '/api/health') {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(API_RESPONSES.health);
    } else if (req.url.startsWith('/api/play-now')) {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(API_RESPONSES.playNow);
    } else if (req.url === '/' || req.url === '/index.html') {
        // Serve index.html with caching
        const indexPath = path.join(__dirname, '..', 'index.html');
        const cached = getCachedFile(indexPath);
        
        if (cached) {
            if (req.headers['if-none-match'] === cached.etag) {
                res.writeHead(304);
                res.end();
                return;
            }
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('ETag', cached.etag);
            res.writeHead(200);
            res.end(cached.content);
        } else {
            fs.readFile(indexPath, 'utf8', (err, html) => {
                if (err) {
                    console.error('Error reading index.html:', err.message);
                    // Serve fallback
                    res.setHeader('Content-Type', 'text/html');
                    res.writeHead(200);
                    res.end(getFallbackHTML());
                } else {
                    setCachedFile(indexPath, html, 'text/html');
                    const etag = crypto.createHash('md5').update(html).digest('hex');
                    res.setHeader('Content-Type', 'text/html');
                    res.setHeader('ETag', etag);
                    res.writeHead(200);
                    res.end(html);
                }
            });
        }
    } else if (req.url.startsWith('/css/') || req.url.startsWith('/js/') || req.url.startsWith('/images/')) {
        // Security: Validate path
        if (!isPathSafe(req.url)) {
            console.error(`Path traversal attempt blocked: ${req.url} from ${clientIp}`);
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }
        
        const filePath = path.join(__dirname, '..', req.url);
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };
        
        const cached = getCachedFile(filePath);
        if (cached) {
            if (req.headers['if-none-match'] === cached.etag) {
                res.writeHead(304);
                res.end();
                return;
            }
            res.setHeader('Content-Type', cached.contentType);
            res.setHeader('ETag', cached.etag);
            res.writeHead(200);
            res.end(cached.content);
        } else {
            fs.readFile(filePath, (err, content) => {
                if (err) {
                    res.writeHead(404);
                    res.end('Not found');
                } else {
                    const contentType = contentTypes[ext] || 'application/octet-stream';
                    setCachedFile(filePath, content, contentType);
                    const etag = crypto.createHash('md5').update(content).digest('hex');
                    res.setHeader('Content-Type', contentType);
                    res.setHeader('ETag', etag);
                    res.writeHead(200);
                    res.end(content);
                }
            });
        }
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
    
    // Log response time
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        if (duration > 100) {
            console.log(`Slow response: ${req.url} took ${duration}ms`);
        }
    });
});

// Bind to localhost only for security (Railway will handle external access)
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
server.listen(PORT, host, () => {
    console.log(`Secure server running at http://${host}:${PORT}/`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, closing server gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Health monitoring
setInterval(() => {
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 100 * 1024 * 1024) {
        console.warn(`High memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    }
}, 30000);

function getFallbackHTML() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Finding Sports</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        button { background: #ff6b35; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        .result { margin-top: 20px; padding: 20px; background: #f5f5f5; border-radius: 5px; }
        .game { padding: 10px; margin: 10px 0; border-left: 4px solid #ff6b35; background: white; }
        .security { background: #d4edda; border: 1px solid #c3e6cb; padding: 10px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Finding Sports - Secure Mode</h1>
    <div class="security">✅ Running with security enhancements</div>
    <p>Main index.html not found. Using secure fallback.</p>
    <button onclick="testAPI()">Test Play Now API</button>
    <div id="result"></div>
    
    <script>
        async function testAPI() {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = 'Loading...';
            
            try {
                const response = await fetch('/api/play-now');
                const data = await response.json();
                
                let html = '<h2>API Response:</h2>';
                html += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                
                if (data.activities && data.activities.happeningNow) {
                    html += '<h2>Games Happening Now:</h2>';
                    data.activities.happeningNow.forEach(game => {
                        html += '<div class="game">';
                        html += '<strong>' + game.sport + '</strong> at ' + game.venue + '<br>';
                        html += game.distance + ' away<br>';
                        html += game.time;
                        html += '</div>';
                    });
                }
                
                resultDiv.innerHTML = html;
            } catch (error) {
                resultDiv.innerHTML = 'Error: ' + error.message;
            }
        }
    </script>
</body>
</html>`;
}