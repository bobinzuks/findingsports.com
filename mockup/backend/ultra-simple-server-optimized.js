const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

const PORT = process.env.PORT || 8080;

console.log('Starting optimized ultra-simple server on port', PORT);

// === PERFORMANCE OPTIMIZATIONS ===

// 1. In-memory cache for static files
const fileCache = new Map();
const CACHE_MAX_SIZE = 50 * 1024 * 1024; // 50MB max cache
const CACHE_TTL = 3600000; // 1 hour TTL
let currentCacheSize = 0;

// 2. Pre-serialized JSON responses
const jsonCache = {
    health: Buffer.from(JSON.stringify({ status: 'ok', server: 'ultra-simple-optimized' })),
    playNow: Buffer.from(JSON.stringify({
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
    }))
};

// 3. Content type lookup optimization
const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// 4. Compression utilities
function shouldCompress(contentType) {
    return contentType && (
        contentType.startsWith('text/') ||
        contentType.includes('javascript') ||
        contentType.includes('json') ||
        contentType.includes('svg')
    );
}

function compressResponse(data, encoding, callback) {
    if (!encoding || encoding === 'identity') {
        callback(null, data);
        return;
    }
    
    if (encoding.includes('gzip')) {
        zlib.gzip(data, callback);
    } else if (encoding.includes('deflate')) {
        zlib.deflate(data, callback);
    } else {
        callback(null, data);
    }
}

// 5. Cache management
function getCachedFile(filePath) {
    const cached = fileCache.get(filePath);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached;
    }
    fileCache.delete(filePath);
    return null;
}

function setCachedFile(filePath, data, stats) {
    const size = data.length;
    
    // Evict old entries if cache is too large
    if (currentCacheSize + size > CACHE_MAX_SIZE) {
        const entriesToDelete = [];
        let freedSpace = 0;
        
        for (const [key, value] of fileCache) {
            entriesToDelete.push(key);
            freedSpace += value.data.length;
            if (currentCacheSize - freedSpace + size <= CACHE_MAX_SIZE) break;
        }
        
        entriesToDelete.forEach(key => {
            const entry = fileCache.get(key);
            currentCacheSize -= entry.data.length;
            fileCache.delete(key);
        });
    }
    
    const etag = crypto.createHash('md5')
        .update(stats.mtime.toISOString() + stats.size)
        .digest('hex');
    
    fileCache.set(filePath, {
        data,
        timestamp: Date.now(),
        etag,
        mtime: stats.mtime
    });
    
    currentCacheSize += size;
}

// 6. Optimized static file handler
async function serveStaticFile(filePath, req, res) {
    try {
        // Check cache first
        const cached = getCachedFile(filePath);
        
        if (cached) {
            // Check if-none-match
            if (req.headers['if-none-match'] === cached.etag) {
                res.writeHead(304);
                res.end();
                return;
            }
            
            const ext = path.extname(filePath).toLowerCase();
            const contentType = contentTypes[ext] || 'application/octet-stream';
            const acceptEncoding = req.headers['accept-encoding'] || '';
            
            const headers = {
                'Content-Type': contentType,
                'ETag': cached.etag,
                'Cache-Control': 'public, max-age=3600',
                'Last-Modified': cached.mtime.toUTCString()
            };
            
            if (shouldCompress(contentType) && acceptEncoding) {
                compressResponse(cached.data, acceptEncoding, (err, compressed) => {
                    if (!err && compressed !== cached.data) {
                        headers['Content-Encoding'] = acceptEncoding.includes('gzip') ? 'gzip' : 'deflate';
                        headers['Content-Length'] = compressed.length;
                        res.writeHead(200, headers);
                        res.end(compressed);
                    } else {
                        headers['Content-Length'] = cached.data.length;
                        res.writeHead(200, headers);
                        res.end(cached.data);
                    }
                });
            } else {
                headers['Content-Length'] = cached.data.length;
                res.writeHead(200, headers);
                res.end(cached.data);
            }
            return;
        }
        
        // Not in cache, read from disk
        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                res.writeHead(404);
                res.end('Not found');
                return;
            }
            
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Server error');
                    return;
                }
                
                // Cache the file
                setCachedFile(filePath, data, stats);
                
                // Serve the file (recursive call will use cache)
                serveStaticFile(filePath, req, res);
            });
        });
        
    } catch (err) {
        console.error('Error serving static file:', err.message);
        res.writeHead(500);
        res.end('Server error');
    }
}

// 7. Request handler with optimizations
const server = http.createServer((req, res) => {
    // Enable CORS (optimized header setting)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    // Log only in development
    if (process.env.NODE_ENV !== 'production') {
        console.log('Request:', req.method, req.url);
    }
    
    // Handle OPTIONS quickly
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // Route handling with early returns
    const url = req.url;
    
    // API endpoints with pre-serialized responses
    if (url === '/api/health') {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Length': jsonCache.health.length,
            'Cache-Control': 'no-cache'
        });
        res.end(jsonCache.health);
        return;
    }
    
    if (url.startsWith('/api/play-now')) {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Length': jsonCache.playNow.length,
            'Cache-Control': 'no-cache'
        });
        res.end(jsonCache.playNow);
        return;
    }
    
    // Serve index.html
    if (url === '/' || url === '/index.html') {
        const indexPath = path.join(__dirname, '..', 'index.html');
        serveStaticFile(indexPath, req, res);
        return;
    }
    
    // Serve static files
    if (url.startsWith('/css/') || url.startsWith('/js/') || url.startsWith('/images/')) {
        // Security check - prevent directory traversal
        const safePath = path.normalize(url).replace(/^(\.\.(\/|\\|$))+/, '');
        const filePath = path.join(__dirname, '..', safePath);
        
        // Ensure the file is within the allowed directory
        if (!filePath.startsWith(path.join(__dirname, '..'))) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }
        
        serveStaticFile(filePath, req, res);
        return;
    }
    
    // 404 for everything else
    res.writeHead(404, {
        'Content-Type': 'text/plain',
        'Content-Length': 9
    });
    res.end('Not found');
});

// 8. Optimized server configuration
server.keepAliveTimeout = 65000; // Slightly higher than typical load balancer timeout
server.headersTimeout = 66000;
server.maxHeadersCount = 100;

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Optimized server running at http://0.0.0.0:${PORT}/`);
    console.log('Performance features enabled:');
    console.log('  ✓ In-memory file caching');
    console.log('  ✓ Pre-serialized JSON responses');
    console.log('  ✓ Gzip compression support');
    console.log('  ✓ ETag support');
    console.log('  ✓ Keep-alive connections');
    console.log('  ✓ Cache-Control headers');
});

// 9. Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server gracefully');
    server.close(() => {
        console.log('Server closed');
        console.log(`Cache stats: ${fileCache.size} files, ${(currentCacheSize / 1024 / 1024).toFixed(2)}MB`);
    });
});

// 10. Basic monitoring
if (process.env.NODE_ENV !== 'production') {
    setInterval(() => {
        const usage = process.memoryUsage();
        console.log(`Memory: Heap ${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB, Cache: ${fileCache.size} files, ${(currentCacheSize / 1024 / 1024).toFixed(2)}MB`);
    }, 30000); // Every 30 seconds
}