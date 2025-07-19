const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const Redis = require('ioredis');
require('dotenv').config();

// Import optimized services
const websocketService = require('./services/websocket-optimized');
const cacheService = require('./services/cache-service');
const performanceMonitor = require('./services/performance-monitor');
const CleanupJobs = require('./services/cleanup-jobs');
const moderationService = require('./services/moderation-service');

// Import routes
const authRoutes = require('./routes/auth');
const sportsRoutes = require('./routes/sports');
const venuesRoutes = require('./routes/venues');
const moderationRoutes = require('./routes/moderation');
const gameChatRoutes = require('./routes/game-chat');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection pool with optimized settings
const dbPool = process.env.DATABASE_URL ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Connection pool optimization
    max: 100,                  // Maximum pool size
    min: 10,                   // Minimum pool size
    idleTimeoutMillis: 600000, // 10 minutes
    connectionTimeoutMillis: 30000, // 30 seconds
    maxUses: 7500,            // Max times a connection can be reused
    // Performance tuning
    statement_timeout: 30000,  // 30 second statement timeout
    query_timeout: 30000,      // 30 second query timeout
}) : null;

// Redis client for caching and pub/sub
const redisClient = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            return true; // Reconnect on READONLY errors
        }
        return false;
    }
}) : null;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
        },
    },
}));

// Compression middleware
app.use(compression({
    level: 6, // Balanced compression level
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Performance monitoring middleware
app.use(performanceMonitor.middleware());

// Rate limiting with Redis store for distributed systems
const createRateLimiter = (windowMs, max, keyPrefix = 'rl') => {
    const limiterOptions = {
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: 'Too many requests',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    };
    
    // Use Redis store if available for distributed rate limiting
    if (redisClient) {
        const RedisStore = require('rate-limit-redis');
        limiterOptions.store = new RedisStore({
            client: redisClient,
            prefix: keyPrefix,
        });
    }
    
    return rateLimit(limiterOptions);
};

// Different rate limits for different endpoints
const generalLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
const authLimiter = createRateLimiter(15 * 60 * 1000, 5, 'rl:auth'); // 5 auth attempts per 15 minutes
const apiLimiter = createRateLimiter(1 * 60 * 1000, 60, 'rl:api'); // 60 API calls per minute
const chatLimiter = createRateLimiter(1 * 60 * 1000, 100, 'rl:chat'); // 100 messages per minute

// Apply general rate limiting
app.use(generalLimiter);

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbPool ? 'connected' : 'not configured',
        redis: redisClient && redisClient.status === 'ready' ? 'connected' : 'not connected',
        websocket: websocketService.getDetailedStats(),
        cache: cacheService.getStats(),
        performance: performanceMonitor.getReport()
    };
    
    res.json(health);
});

// Serve static files with caching headers
app.use(express.static('public', {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Longer cache for immutable assets
        if (path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.png') || path.endsWith('.jpg')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// API routes with specific rate limits
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/sports', apiLimiter, sportsRoutes);
app.use('/api/venues', apiLimiter, venuesRoutes);
app.use('/api/moderation', apiLimiter, moderationRoutes);
app.use('/api/game-chat', chatLimiter, gameChatRoutes);

// Performance monitoring endpoints (admin only)
app.get('/api/performance/report', (req, res) => {
    // In production, add authentication check here
    res.json(performanceMonitor.getReport());
});

app.get('/api/performance/cache-stats', (req, res) => {
    // In production, add authentication check here
    res.json(cacheService.getStats());
});

app.get('/api/performance/cleanup-stats', (req, res) => {
    // In production, add authentication check here
    if (cleanupJobs) {
        res.json(cleanupJobs.getJobStats());
    } else {
        res.json({ error: 'Cleanup jobs not initialized' });
    }
});

// Trigger cleanup job manually (admin only)
app.post('/api/performance/cleanup/:jobName', async (req, res) => {
    // In production, add authentication check here
    try {
        if (!cleanupJobs) {
            return res.status(503).json({ error: 'Cleanup jobs not initialized' });
        }
        
        const result = await cleanupJobs.triggerJob(req.params.jobName);
        res.json({ success: true, result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Track error in performance monitor
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    performanceMonitor.trackRequest(endpoint, 0, err);
    
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// Initialize cleanup jobs
let cleanupJobs;
if (dbPool) {
    cleanupJobs = new CleanupJobs(dbPool, websocketService, cacheService);
    cleanupJobs.initialize();
}

// Start server
const server = app.listen(PORT, async () => {
    console.log(`🚀 Optimized server running on port ${PORT}`);
    console.log(`📊 Performance monitoring enabled`);
    console.log(`💾 Cache service initialized`);
    
    // Initialize WebSocket with Redis adapter
    await websocketService.initialize(server, {
        corsOrigin: process.env.CORS_ORIGIN || '*',
        redisUrl: process.env.REDIS_URL
    });
    console.log(`🔌 WebSocket service initialized with optimization`);
    
    // Warm up caches
    if (dbPool) {
        await cacheService.warmUp({
            bannedWordsFetcher: async () => {
                const result = await dbPool.query('SELECT word, severity FROM banned_words');
                return result.rows;
            },
            moderatorsFetcher: async () => {
                const result = await dbPool.query(`
                    SELECT id, username, email, role 
                    FROM users 
                    WHERE role IN ('moderator', 'admin')
                `);
                return result.rows;
            }
        });
        console.log(`🔥 Cache warmed up`);
    }
    
    // Start performance monitoring
    performanceMonitor.startMonitoring();
    console.log(`📈 Performance monitoring started`);
    
    // Set up performance alerts
    performanceMonitor.onAlert((alert) => {
        console.warn(`⚠️ Performance Alert [${alert.type}]:`, alert.data);
        
        // In production, send alerts to monitoring service
        // Example: send to Slack, PagerDuty, etc.
    });
    
    // Database query wrapper for monitoring
    if (dbPool) {
        const originalQuery = dbPool.query.bind(dbPool);
        dbPool.query = performanceMonitor.wrapQuery(originalQuery);
    }
    
    // Log startup metrics
    console.log('📊 Startup metrics:', {
        nodeVersion: process.version,
        memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        cpus: require('os').cpus().length,
        platform: process.platform
    });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n📛 ${signal} received, starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(async () => {
        console.log('🔒 HTTP server closed');
        
        // Stop cleanup jobs
        if (cleanupJobs) {
            cleanupJobs.stop();
            console.log('🧹 Cleanup jobs stopped');
        }
        
        // Stop performance monitoring
        performanceMonitor.stopMonitoring();
        console.log('📊 Performance monitoring stopped');
        
        // Close WebSocket connections
        await websocketService.shutdown();
        console.log('🔌 WebSocket connections closed');
        
        // Close database pool
        if (dbPool) {
            await dbPool.end();
            console.log('💾 Database pool closed');
        }
        
        // Close Redis connection
        if (redisClient) {
            await redisClient.quit();
            console.log('📦 Redis connection closed');
        }
        
        console.log('✅ Graceful shutdown complete');
        process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
        console.error('⚠️ Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit on unhandled promise rejections in production
    if (process.env.NODE_ENV !== 'production') {
        gracefulShutdown('unhandledRejection');
    }
});

module.exports = { app, server };