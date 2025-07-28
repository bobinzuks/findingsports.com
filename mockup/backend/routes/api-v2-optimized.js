const express = require('express');
const router = express.Router();
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');
const { getInstance: getOptimizedAggregator } = require('../services/optimized-data-aggregator');
const { getInstance: getSiteMethodsManager } = require('../services/site-methods-manager');
const { getInstance: getIntelligentCache } = require('../services/intelligent-cache');

// Initialize services
const aggregator = getOptimizedAggregator({
  maxWorkers: 4,
  maxConcurrentRequests: 50,
  circuitBreakerThreshold: 5,
  bloomFilterSize: 100000
});

const siteMethodsManager = getSiteMethodsManager();
const cache = getIntelligentCache();

// Response compression middleware
const compression = require('compression');
router.use(compression({ level: 6 }));

// ETaG support for client-side caching
const etag = require('etag');

/**
 * @api {get} /api/v2/games Get aggregated games (Optimized)
 * @apiDescription Get games from 100+ sources with advanced optimization
 * 
 * Performance Features:
 * - Multi-tier caching (Memory + Redis + CDN)
 * - Parallel processing with worker threads
 * - Circuit breakers for failing sources
 * - Bloom filter deduplication
 * - Predictive prefetching
 * - Response compression
 * - ETaG support
 */
router.get('/games', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const {
      sport,
      lat,
      lng,
      radius = 10,
      date,
      type,
      fresh = false,
      limit = 100,
      offset = 0
    } = req.query;

    // Build normalized options
    const options = {
      sports: sport ? sport.split(',').map(s => s.trim().toLowerCase()) : [],
      location: lat && lng ? {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius: parseInt(radius)
      } : null,
      date: date || 'today',
      type: type?.toLowerCase(),
      forceRefresh: fresh === 'true' || fresh === true
    };

    // Check request cache headers
    const ifNoneMatch = req.headers['if-none-match'];
    const cacheKey = generateCacheKey(options);

    // Try CDN cache headers first
    if (ifNoneMatch && !options.forceRefresh) {
      const currentETag = etag(cacheKey);
      if (ifNoneMatch === currentETag) {
        return res.status(304).end(); // Not Modified
      }
    }

    // Get aggregated data with all optimizations
    const result = await aggregator.collectFromAllSources(options);

    // Apply pagination
    const paginatedGames = result.games.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    // Build response
    const response = {
      games: paginatedGames,
      pagination: {
        total: result.games.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.games.length > parseInt(offset) + parseInt(limit)
      },
      meta: {
        ...result.meta,
        responseTime: Date.now() - startTime,
        performance: aggregator.getMetrics()
      }
    };

    // Set cache headers for CDN
    const maxAge = options.forceRefresh ? 0 : 300; // 5 minutes
    res.set({
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge * 2}`,
      'ETag': etag(JSON.stringify(response)),
      'X-Response-Time': `${Date.now() - startTime}ms`,
      'X-Cache-Status': result.meta.cached ? 'HIT' : 'MISS'
    });

    res.json(response);

  } catch (error) {
    console.error('Optimized Games API error:', error);
    
    // Send cached stale data if available during errors
    try {
      const staleData = await cache.get(generateCacheKey(options), {
        includeStale: true
      });
      
      if (staleData) {
        res.set('X-Cache-Status', 'STALE');
        return res.json(staleData);
      }
    } catch (cacheError) {
      // Ignore cache errors
    }

    res.status(500).json({
      error: 'Failed to fetch games',
      message: error.message,
      fallback: '/api/v2/games/cached'
    });
  }
});

/**
 * @api {get} /api/v2/games/stream Stream games data
 * @apiDescription Stream games data for real-time updates
 */
router.get('/games/stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Disable Nginx buffering
  });

  // Send initial data
  const options = {
    sports: req.query.sport ? req.query.sport.split(',') : [],
    location: req.query.lat && req.query.lng ? {
      lat: parseFloat(req.query.lat),
      lng: parseFloat(req.query.lng),
      radius: parseInt(req.query.radius) || 10
    } : null
  };

  // Set up SSE heartbeat
  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 30000);

  // Send updates when data changes
  const sendUpdate = async () => {
    try {
      const result = await aggregator.collectFromAllSources(options);
      res.write(`data: ${JSON.stringify({
        type: 'update',
        games: result.games.slice(0, 50), // Send first 50 games
        meta: result.meta
      })}\n\n`);
    } catch (error) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: error.message
      })}\n\n`);
    }
  };

  // Send initial update
  await sendUpdate();

  // Schedule periodic updates
  const updateInterval = setInterval(sendUpdate, 60000); // Every minute

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    clearInterval(updateInterval);
  });
});

/**
 * @api {get} /api/v2/games/cached Get cached games only
 * @apiDescription Fast endpoint that only returns cached data
 */
router.get('/games/cached', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const options = {
      sports: req.query.sport ? req.query.sport.split(',') : [],
      location: req.query.lat && req.query.lng ? {
        lat: parseFloat(req.query.lat),
        lng: parseFloat(req.query.lng),
        radius: parseInt(req.query.radius) || 10
      } : null,
      date: req.query.date || 'today',
      type: req.query.type
    };

    const cacheKey = generateCacheKey(options);
    const cached = await cache.get(cacheKey, {
      includeStale: true,
      includeMeta: true
    });

    if (!cached) {
      return res.status(404).json({
        error: 'No cached data available',
        suggestion: 'Use /api/v2/games for fresh data'
      });
    }

    res.set({
      'Cache-Control': 'public, max-age=60',
      'X-Cache-Status': 'HIT',
      'X-Cache-Age': `${Date.now() - cached.timestamp}ms`,
      'X-Response-Time': `${Date.now() - startTime}ms`
    });

    res.json(cached.value || cached);

  } catch (error) {
    console.error('Cached endpoint error:', error);
    res.status(500).json({
      error: 'Failed to retrieve cached data',
      message: error.message
    });
  }
});

/**
 * @api {get} /api/v2/performance Get performance metrics
 * @apiDescription Get detailed performance metrics
 */
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const aggregatorMetrics = aggregator.getMetrics();
    const cacheStats = cache.getStats();
    const sourcesStats = siteMethodsManager.getStats();

    res.json({
      aggregator: {
        ...aggregatorMetrics,
        cacheHitRate: `${(aggregatorMetrics.cacheHitRate * 100).toFixed(2)}%`,
        avgAggregationTime: `${aggregatorMetrics.avgAggregationTime.toFixed(2)}ms`,
        avgWorkerUtilization: `${aggregatorMetrics.avgWorkerUtilization.toFixed(2)}%`
      },
      cache: {
        hitRate: `${(cacheStats.hitRate * 100).toFixed(2)}%`,
        size: cacheStats.currentSize,
        memoryUsage: `${(cacheStats.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        avgTTL: `${cacheStats.avgTTL}s`,
        popularItems: cacheStats.popularItems.slice(0, 5)
      },
      sources: {
        total: sourcesStats.totalMethods,
        active: sourcesStats.verifiedMethods,
        failing: sourcesStats.failedMethods,
        avgResponseTime: `${sourcesStats.avgResponseTime?.toFixed(2) || 0}ms`
      },
      recommendations: generatePerformanceRecommendations(aggregatorMetrics, cacheStats)
    });

  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({
      error: 'Failed to get performance metrics',
      message: error.message
    });
  }
});

/**
 * @api {post} /api/v2/optimize Run optimization
 * @apiDescription Trigger performance optimization routines
 */
router.post('/optimize', authenticateAdmin, async (req, res) => {
  try {
    const { target = 'all' } = req.body;
    const results = {};

    // Optimize cache
    if (target === 'all' || target === 'cache') {
      const invalidated = await cache.invalidate({
        olderThan: 3600000 // 1 hour
      });
      results.cache = {
        invalidated,
        message: 'Cleared old cache entries'
      };
    }

    // Optimize circuit breakers
    if (target === 'all' || target === 'circuits') {
      const circuits = aggregator.circuitBreakers;
      let reset = 0;
      
      for (const [sourceId, breaker] of circuits) {
        if (breaker.getState() === 'OPEN') {
          // Reset if it's been open for more than 10 minutes
          if (Date.now() - breaker.lastFailureTime > 600000) {
            breaker.state = 'HALF_OPEN';
            breaker.failures = 0;
            reset++;
          }
        }
      }
      
      results.circuits = {
        reset,
        message: `Reset ${reset} circuit breakers`
      };
    }

    // Warm cache with popular queries
    if (target === 'all' || target === 'warmup') {
      const popularQueries = [
        { sports: ['basketball'], type: 'drop-in' },
        { sports: ['soccer'], type: 'drop-in' },
        { sports: ['volleyball'], type: 'drop-in' },
        { sports: [], type: 'drop-in' }, // All sports drop-in
      ];

      const warmed = [];
      for (const query of popularQueries) {
        try {
          await aggregator.collectFromAllSources(query);
          warmed.push(query);
        } catch (error) {
          console.error('Warmup error:', error);
        }
      }

      results.warmup = {
        warmed: warmed.length,
        message: `Warmed ${warmed.length} popular queries`
      };
    }

    res.json({
      success: true,
      optimizations: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({
      error: 'Optimization failed',
      message: error.message
    });
  }
});

/**
 * @api {get} /api/v2/health Health check with performance data
 */
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const metrics = aggregator.getMetrics();
    const cacheStats = cache.getStats();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      services: {
        aggregator: {
          status: metrics.avgWorkerUtilization < 90 ? 'healthy' : 'degraded',
          workerUtilization: metrics.avgWorkerUtilization,
          cacheHitRate: metrics.cacheHitRate
        },
        cache: {
          status: cacheStats.hitRate > 0.5 ? 'healthy' : 'degraded',
          hitRate: cacheStats.hitRate,
          size: cacheStats.currentSize
        },
        circuitBreakers: {
          status: 'healthy',
          open: metrics.circuitBreakerStatus.filter(cb => cb.state === 'OPEN').length,
          total: metrics.circuitBreakerStatus.length
        }
      }
    };

    // Determine overall health
    const isHealthy = Object.values(health.services)
      .every(service => service.status !== 'unhealthy');
    
    const isDegraded = Object.values(health.services)
      .some(service => service.status === 'degraded');

    if (!isHealthy) {
      health.status = 'unhealthy';
    } else if (isDegraded) {
      health.status = 'degraded';
    }

    res.status(health.status === 'unhealthy' ? 503 : 200).json(health);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper functions

function generateCacheKey(options) {
  const parts = [
    'games',
    options.sports?.join('-') || 'all',
    options.location?.lat || 'any',
    options.location?.lng || 'any',
    options.location?.radius || '10',
    options.date || 'today',
    options.type || 'all'
  ];
  return parts.join(':');
}

function generatePerformanceRecommendations(aggregatorMetrics, cacheStats) {
  const recommendations = [];

  // Cache hit rate recommendation
  if (cacheStats.hitRate < 0.7) {
    recommendations.push({
      priority: 'HIGH',
      area: 'Cache',
      issue: `Low cache hit rate: ${(cacheStats.hitRate * 100).toFixed(2)}%`,
      action: 'Increase cache TTL or implement predictive prefetching'
    });
  }

  // Worker utilization recommendation
  if (aggregatorMetrics.avgWorkerUtilization > 80) {
    recommendations.push({
      priority: 'HIGH',
      area: 'Workers',
      issue: `High worker utilization: ${aggregatorMetrics.avgWorkerUtilization.toFixed(2)}%`,
      action: 'Increase worker pool size or optimize source processing'
    });
  }

  // Circuit breaker recommendation
  const openCircuits = aggregatorMetrics.circuitBreakerStatus
    .filter(cb => cb.state === 'OPEN').length;
  
  if (openCircuits > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      area: 'Sources',
      issue: `${openCircuits} sources have open circuit breakers`,
      action: 'Investigate failing sources and consider alternatives'
    });
  }

  // Aggregation time recommendation
  if (aggregatorMetrics.avgAggregationTime > 2000) {
    recommendations.push({
      priority: 'MEDIUM',
      area: 'Performance',
      issue: `Slow aggregation time: ${aggregatorMetrics.avgAggregationTime.toFixed(2)}ms`,
      action: 'Reduce batch sizes or implement request prioritization'
    });
  }

  // Deduplication recommendation
  if (aggregatorMetrics.deduplicationSaved > 100) {
    recommendations.push({
      priority: 'LOW',
      area: 'Data Quality',
      issue: `High duplication: ${aggregatorMetrics.deduplicationSaved} duplicates removed`,
      action: 'Review source data quality and consider source filtering'
    });
  }

  return recommendations.sort((a, b) => {
    const priority = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return priority[a.priority] - priority[b.priority];
  });
}

module.exports = router;