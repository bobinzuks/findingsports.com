const http = require('http');
const { SecurityMiddleware } = require('../middleware/security');
const { RateLimiter } = require('../middleware/rate-limiter');
const { Router } = require('../utils/router');
const { Logger } = require('../utils/logger');
const { Config } = require('../config/server-config');

// Routes
const healthRoutes = require('../routes/health');
const playNowRoutes = require('../routes/play-now');
const staticRoutes = require('../routes/static');

class SecureServer {
    constructor() {
        this.config = new Config();
        this.logger = new Logger(this.config.logLevel);
        this.security = new SecurityMiddleware();
        this.rateLimiter = new RateLimiter(this.config.rateLimitConfig);
        this.router = new Router();
        
        this.setupRoutes();
        this.createServer();
    }
    
    setupRoutes() {
        // Register routes
        this.router.register('GET', '/api/health', healthRoutes.health);
        this.router.register('GET', '/api/play-now', playNowRoutes.getActivities);
        this.router.register('GET', '/api/play-now/search', playNowRoutes.searchActivities);
        
        // Static file handling with security
        this.router.register('GET', '/', staticRoutes.serveIndex);
        this.router.register('GET', '/index.html', staticRoutes.serveIndex);
        this.router.registerPattern(/^\/(css|js|images)\//, staticRoutes.serveStatic);
    }
    
    createServer() {
        this.server = http.createServer(async (req, res) => {
            const startTime = Date.now();
            const clientIp = this.getClientIp(req);
            
            try {
                // Apply security headers
                this.security.applyHeaders(res);
                
                // Rate limiting
                if (!this.rateLimiter.checkLimit(clientIp)) {
                    this.logger.warn(`Rate limit exceeded for ${clientIp}`);
                    res.writeHead(429, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Too many requests' }));
                    return;
                }
                
                // CORS handling
                if (req.method === 'OPTIONS') {
                    this.handleCors(res);
                    return;
                }
                
                // Input validation
                if (!this.validateRequest(req)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid request' }));
                    return;
                }
                
                // Route request
                const handled = await this.router.handle(req, res);
                
                if (!handled) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Not found' }));
                }
                
            } catch (error) {
                this.logger.error('Server error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
            } finally {
                const duration = Date.now() - startTime;
                this.logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms - ${clientIp}`);
            }
        });
    }
    
    getClientIp(req) {
        return req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               '0.0.0.0';
    }
    
    handleCors(res) {
        res.setHeader('Access-Control-Allow-Origin', this.config.corsOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Max-Age', '86400');
        res.writeHead(204);
        res.end();
    }
    
    validateRequest(req) {
        // Validate HTTP method
        const allowedMethods = ['GET', 'POST', 'OPTIONS'];
        if (!allowedMethods.includes(req.method)) {
            return false;
        }
        
        // Validate URL length
        if (req.url.length > 2048) {
            return false;
        }
        
        // Validate URL characters
        if (!/^[\w\-\.\/\?\&\=\%]+$/.test(req.url)) {
            return false;
        }
        
        return true;
    }
    
    start() {
        const port = this.config.port;
        const host = this.config.host;
        
        this.server.listen(port, host, () => {
            this.logger.info(`Secure server running at http://${host}:${port}/`);
            this.logger.info(`Environment: ${this.config.environment}`);
            this.logger.info(`Rate limiting: ${this.config.rateLimitConfig.maxRequests} requests per ${this.config.rateLimitConfig.windowMs}ms`);
        });
        
        // Graceful shutdown
        process.on('SIGTERM', () => this.shutdown('SIGTERM'));
        process.on('SIGINT', () => this.shutdown('SIGINT'));
    }
    
    shutdown(signal) {
        this.logger.info(`${signal} received, shutting down gracefully...`);
        
        this.server.close(() => {
            this.logger.info('Server closed');
            this.rateLimiter.cleanup();
            process.exit(0);
        });
        
        // Force exit after 30 seconds
        setTimeout(() => {
            this.logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 30000);
    }
}

// Start server if run directly
if (require.main === module) {
    const server = new SecureServer();
    server.start();
}

module.exports = { SecureServer };