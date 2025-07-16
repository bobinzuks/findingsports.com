const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { Pool } = require('pg');
const winston = require('winston');
require('dotenv').config();

// Import models and services
const GameModel = require('./models/game.model');
const CacheManager = require('./cache/cache-manager');
const UserGameService = require('./services/user-game-service');
const DataAggregator = require('./services/data-aggregator');

// Import routes
const createGamesRouter = require('./api/routes/games');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize services
const gameModel = new GameModel(pool);
const cacheManager = new CacheManager({
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT,
  memoryCacheSize: 1000,
  memoryTTL: 60 * 1000, // 1 minute
});

const userGameService = new UserGameService(gameModel, cacheManager, null);
const dataAggregator = new DataAggregator(gameModel, cacheManager, {
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY,
  majorCities: [
    { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
    { name: 'Vancouver', lat: 49.2827, lng: -123.1207 },
  ],
});

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  next();
});

// Routes
app.use('/api/games', createGamesRouter(gameModel, cacheManager, userGameService, dataAggregator));

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    // Check Redis connection
    await cacheManager.redis.ping();
    
    const stats = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      cache: 'connected',
      cacheStats: cacheManager.getStats(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Finding Sports API',
    version: '1.0.0',
    endpoints: {
      games: {
        nearby: 'GET /api/games/nearby?lat={lat}&lng={lng}&radius={radius}',
        details: 'GET /api/games/:gameId',
        submit: 'POST /api/games/submit',
        verify: 'POST /api/games/:gameId/verify',
        userGames: 'GET /api/games/user/:userId',
      },
      admin: {
        aggregate: 'POST /api/games/aggregate',
        cacheStats: 'GET /api/games/stats/cache',
        syncStatus: 'GET /api/games/stats/sync',
      },
      health: 'GET /health',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      path: req.path,
    },
  });
});

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    logger.info('Database connected successfully');
    
    // Test Redis connection
    await cacheManager.redis.ping();
    logger.info('Redis connected successfully');
    
    // Start scheduled tasks
    dataAggregator.startScheduledSync();
    logger.info('Data aggregation scheduled');
    
    // Warm cache for major cities
    if (process.env.WARM_CACHE === 'true') {
      const cities = [
        { lat: 43.6532, lng: -79.3832 }, // Toronto
        { lat: 40.7128, lng: -74.0060 }, // New York
      ];
      cacheManager.warmCache(cities, 10);
    }
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  try {
    await pool.end();
    await cacheManager.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();