const express = require('express');
const router = express.Router();
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');
const { getInstance: getSwarm } = require('../services/data-aggregation-swarm');
const { getInstance: getSiteMethodsManager } = require('../services/site-methods-manager');
const { getInstance: getIntelligentCache } = require('../services/intelligent-cache');

// Initialize services
const swarm = getSwarm();
const siteMethodsManager = getSiteMethodsManager();
const cache = getIntelligentCache();

/**
 * @api {get} /api/v2/games Get aggregated games
 * @apiDescription Get games from 100+ sources with intelligent caching
 * @apiQuery {String} sport Filter by sport (basketball, soccer, etc.)
 * @apiQuery {Number} lat Latitude for location-based search
 * @apiQuery {Number} lng Longitude for location-based search
 * @apiQuery {Number} radius Search radius in km (default: 10)
 * @apiQuery {String} date Filter by date (YYYY-MM-DD)
 * @apiQuery {String} type Game type (drop-in, league, tournament)
 * @apiQuery {Boolean} fresh Force fresh data (bypass cache)
 */
router.get('/games', async (req, res) => {
  try {
    const {
      sport,
      lat,
      lng,
      radius = 10,
      date,
      type,
      fresh = false
    } = req.query;

    // Build cache key
    const cacheKey = `games:${sport || 'all'}:${lat || 'any'}:${lng || 'any'}:${radius}:${date || 'today'}:${type || 'all'}`;

    // Check cache first
    if (!fresh) {
      const cached = await cache.get(cacheKey, {
        includeMeta: true,
        trackAccess: true
      });

      if (cached) {
        return res.json({
          games: cached.value.games,
          meta: {
            ...cached.value.meta,
            cached: true,
            cacheAge: Date.now() - cached.timestamp,
            ttl: cached.ttl
          }
        });
      }
    }

    // Collect from swarm
    const startTime = Date.now();
    const result = await swarm.collectFromAllSources({
      sports: sport ? [sport] : [],
      location: { lat, lng, radius },
      forceRefresh: fresh
    });

    // Filter results based on query parameters
    let games = result.games;

    // Filter by date
    if (date) {
      const targetDate = new Date(date);
      games = games.filter(game => {
        const gameDate = new Date(game.startTime);
        return gameDate.toDateString() === targetDate.toDateString();
      });
    }

    // Filter by type
    if (type) {
      games = games.filter(game => game.type === type || game.gameType === type);
    }

    // Filter by location
    if (lat && lng) {
      const radiusMeters = radius * 1000;
      games = games.filter(game => {
        if (!game.venue?.coordinates) return false;
        const distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          game.venue.coordinates.lat,
          game.venue.coordinates.lng
        );
        return distance <= radiusMeters;
      });
    }

    // Sort by start time
    games.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Prepare response
    const response = {
      games,
      meta: {
        ...result.meta,
        filtered: {
          total: games.length,
          sport,
          date,
          type,
          location: lat && lng ? { lat, lng, radius } : null
        },
        responseTime: Date.now() - startTime,
        cached: false
      }
    };

    // Cache the result
    await cache.set(cacheKey, response, {
      ttl: 1800, // 30 minutes
      dataType: type || 'mixed',
      reliability: 0.9,
      tags: ['games', sport, type].filter(Boolean)
    });

    res.json(response);

  } catch (error) {
    console.error('Games API error:', error);
    res.status(500).json({
      error: 'Failed to fetch games',
      message: error.message
    });
  }
});

/**
 * @api {get} /api/v2/sources Get data sources
 * @apiDescription Get list of available data sources
 * @apiQuery {String} status Filter by status (active, verified, pending, failed)
 * @apiQuery {String} sport Filter by sport
 * @apiQuery {String} type Filter by type (api, scraper, hybrid)
 */
router.get('/sources', async (req, res) => {
  try {
    const { status, sport, type } = req.query;

    let methods = Array.from(siteMethodsManager.methods.values());

    // Apply filters
    if (status) {
      methods = methods.filter(m => m.validationStatus === status);
    }

    if (sport) {
      methods = methods.filter(m => m.sport === sport || m.sport === 'multiple');
    }

    if (type) {
      methods = methods.filter(m => m.method.type === type);
    }

    // Sort by reliability
    methods.sort((a, b) => b.reliability - a.reliability);

    // Prepare response
    const sources = methods.map(m => ({
      siteId: m.siteId,
      domain: m.domain,
      sport: m.sport,
      type: m.method.type,
      reliability: m.reliability,
      status: m.validationStatus,
      lastSuccess: m.lastSuccessfulCollection,
      successRate: m.successRate,
      avgResponseTime: m.avgResponseTime
    }));

    res.json({
      sources,
      meta: {
        total: sources.length,
        stats: siteMethodsManager.getStats()
      }
    });

  } catch (error) {
    console.error('Sources API error:', error);
    res.status(500).json({
      error: 'Failed to fetch sources',
      message: error.message
    });
  }
});

/**
 * @api {post} /api/v2/sources/discover Discover new source
 * @apiDescription Discover collection method for a new site
 * @apiBody {String} url The URL to analyze
 * @apiBody {String} sport The sport type
 * @apiBody {String} gameType The game type (drop-in, league, etc.)
 * @apiBody {String} hint Any hint about the site structure
 */
router.post('/sources/discover', authenticateToken, async (req, res) => {
  try {
    const { url, sport, gameType, hint } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Start discovery
    const discoveryResult = await siteMethodsManager.discoverMethod(url, {
      sport,
      gameType,
      hint
    });

    if (!discoveryResult) {
      return res.status(404).json({
        error: 'Could not discover collection method',
        message: 'Unable to find sports data on this site'
      });
    }

    res.json({
      success: true,
      method: discoveryResult,
      message: 'Collection method discovered and registered'
    });

  } catch (error) {
    console.error('Discovery API error:', error);
    res.status(500).json({
      error: 'Discovery failed',
      message: error.message
    });
  }
});

/**
 * @api {get} /api/v2/sources/:siteId Get specific source details
 */
router.get('/sources/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const method = siteMethodsManager.getMethod(siteId);

    if (!method) {
      return res.status(404).json({ error: 'Source not found' });
    }

    res.json({
      source: method,
      performance: {
        successRate: method.successRate,
        avgResponseTime: method.avgResponseTime,
        reliability: method.reliability,
        lastError: method.lastError
      }
    });

  } catch (error) {
    console.error('Source detail API error:', error);
    res.status(500).json({
      error: 'Failed to fetch source details',
      message: error.message
    });
  }
});

/**
 * @api {post} /api/v2/sources/:siteId/validate Validate a source
 * @apiDescription Validate that a source is working correctly
 */
router.post('/sources/:siteId/validate', authenticateToken, async (req, res) => {
  try {
    const { siteId } = req.params;

    const isValid = await siteMethodsManager.validateMethod(siteId);

    res.json({
      siteId,
      valid: isValid,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Validation API error:', error);
    res.status(500).json({
      error: 'Validation failed',
      message: error.message
    });
  }
});

/**
 * @api {get} /api/v2/cache/stats Get cache statistics
 */
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = cache.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Cache stats API error:', error);
    res.status(500).json({
      error: 'Failed to fetch cache stats',
      message: error.message
    });
  }
});

/**
 * @api {post} /api/v2/cache/invalidate Invalidate cache entries
 * @apiDescription Invalidate cache entries by pattern or tags
 * @apiBody {String} pattern Key pattern to match
 * @apiBody {Array} tags Tags to match
 * @apiBody {Number} olderThan Invalidate entries older than (ms)
 */
router.post('/cache/invalidate', authenticateAdmin, async (req, res) => {
  try {
    const { pattern, tags, olderThan } = req.body;

    const invalidated = await cache.invalidate({
      pattern,
      tags,
      olderThan
    });

    res.json({
      success: true,
      invalidated,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Cache invalidation API error:', error);
    res.status(500).json({
      error: 'Failed to invalidate cache',
      message: error.message
    });
  }
});

/**
 * @api {post} /api/v2/cache/warm Warm up cache
 * @apiDescription Pre-populate cache with popular searches
 */
router.post('/cache/warm', authenticateAdmin, async (req, res) => {
  try {
    // Popular searches to warm up
    const warmupItems = [
      {
        key: 'games:basketball:any:any:10:today:drop-in',
        fetcher: () => swarm.collectFromAllSources({ sports: ['basketball'], gameType: 'drop-in' }),
        options: { ttl: 3600, priority: 'high' }
      },
      {
        key: 'games:soccer:any:any:10:today:drop-in',
        fetcher: () => swarm.collectFromAllSources({ sports: ['soccer'], gameType: 'drop-in' }),
        options: { ttl: 3600, priority: 'high' }
      },
      {
        key: 'games:all:any:any:10:today:all',
        fetcher: () => swarm.collectFromAllSources({}),
        options: { ttl: 1800, priority: 'normal' }
      }
    ];

    const warmed = await cache.warmUp(warmupItems);

    res.json({
      success: true,
      warmed: warmed.length,
      keys: warmed
    });

  } catch (error) {
    console.error('Cache warmup API error:', error);
    res.status(500).json({
      error: 'Failed to warm cache',
      message: error.message
    });
  }
});

/**
 * @api {get} /api/v2/swarm/status Get swarm status
 */
router.get('/swarm/status', async (req, res) => {
  try {
    const swarmStats = swarm.getStats();
    const cacheStats = cache.getStats();
    const sourcesStats = siteMethodsManager.getStats();

    res.json({
      swarm: swarmStats,
      cache: cacheStats,
      sources: sourcesStats,
      health: {
        swarmActive: swarmStats.totalSources > 0,
        cacheHitRate: cacheStats.hitRate,
        verifiedSources: sourcesStats.verifiedMethods,
        totalSources: sourcesStats.totalMethods
      }
    });

  } catch (error) {
    console.error('Swarm status API error:', error);
    res.status(500).json({
      error: 'Failed to fetch swarm status',
      message: error.message
    });
  }
});

/**
 * @api {post} /api/v2/swarm/collect Trigger manual collection
 * @apiDescription Manually trigger data collection from all sources
 */
router.post('/swarm/collect', authenticateAdmin, async (req, res) => {
  try {
    const { sports, forceRefresh = true } = req.body;

    const startTime = Date.now();
    const result = await swarm.collectFromAllSources({
      sports,
      forceRefresh
    });

    res.json({
      success: true,
      games: result.games.length,
      sources: result.meta.totalSources,
      successful: result.meta.successfulSources,
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error('Manual collection API error:', error);
    res.status(500).json({
      error: 'Collection failed',
      message: error.message
    });
  }
});

/**
 * @api {get} /api/v2/sports Get available sports
 */
router.get('/sports', async (req, res) => {
  try {
    // Get unique sports from all sources
    const sports = new Set();

    for (const source of siteMethodsManager.methods.values()) {
      if (source.sport && source.sport !== 'multiple') {
        sports.add(source.sport);
      }
    }

    // Add common sports
    ['basketball', 'soccer', 'volleyball', 'tennis', 'hockey', 'baseball'].forEach(s => sports.add(s));

    res.json({
      sports: Array.from(sports).sort(),
      meta: {
        total: sports.size
      }
    });

  } catch (error) {
    console.error('Sports API error:', error);
    res.status(500).json({
      error: 'Failed to fetch sports',
      message: error.message
    });
  }
});

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

module.exports = router;
