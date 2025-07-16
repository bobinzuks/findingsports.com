const express = require('express');
const Joi = require('joi');
const geohash = require('geohash');

function createGamesRouter(gameModel, cacheManager, userGameService, aggregator) {
  const router = express.Router();

  // Validation schemas
  const searchSchema = Joi.object({
    lat: Joi.number().required().min(-90).max(90),
    lng: Joi.number().required().min(-180).max(180),
    radius: Joi.number().optional().min(1).max(50).default(10),
    sport: Joi.string().optional().valid(
      'basketball', 'soccer', 'hockey', 'volleyball', 'tennis',
      'pickleball', 'badminton', 'baseball', 'football', 'other'
    ),
    gameType: Joi.string().optional().valid('drop-in', 'organized', 'pickup'),
    startDate: Joi.date().optional().min('now'),
    endDate: Joi.date().optional().greater(Joi.ref('startDate')),
    limit: Joi.number().optional().min(1).max(100).default(50),
    offset: Joi.number().optional().min(0).default(0),
  });

  // Find games near location
  router.get('/nearby', async (req, res, next) => {
    try {
      const { error, value } = searchSchema.validate(req.query);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const startTime = Date.now();
      const { lat, lng, radius, sport, gameType, limit, offset } = value;

      // Generate cache key
      const cacheKey = cacheManager.generateCacheKey('location_search', {
        lat, lng, radius, sport, gameType
      });

      // Try cache first
      let results = await cacheManager.get(cacheKey);
      
      if (!results) {
        // Cache miss - query database
        results = await gameModel.findGamesNearLocation(lat, lng, radius, {
          sport,
          gameType,
          startDate: value.startDate,
          endDate: value.endDate,
        });

        // Cache results
        await cacheManager.set(cacheKey, results, 600); // 10 minutes
        
        // Track cache miss
        cacheManager.stats.dbHits++;
      }

      // Apply pagination
      const paginatedResults = results.slice(offset, offset + limit);

      // Format response
      const response = {
        success: true,
        data: {
          games: paginatedResults.map(game => ({
            id: game.id,
            venue: {
              id: game.venue_id,
              name: game.venue_name,
              address: game.venue_address,
              distance: Math.round(game.distance_meters),
              location: {
                lat: game.location.coordinates[1],
                lng: game.location.coordinates[0],
              },
            },
            sport: game.sport,
            gameType: game.game_type,
            startTime: game.start_time,
            endTime: game.end_time,
            capacity: game.capacity,
            currentPlayers: game.current_players,
            skillLevel: game.skill_level,
            price: parseFloat(game.price || 0),
            isVerified: game.verification_status === 'verified',
          })),
          pagination: {
            total: results.length,
            limit,
            offset,
            hasMore: offset + limit < results.length,
          },
        },
        meta: {
          responseTime: Date.now() - startTime,
          cacheHit: !!results,
          searchArea: {
            center: { lat, lng },
            radiusKm: radius,
            geohash: geohash.encode(lat, lng, 6),
          },
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  // Get game details
  router.get('/:gameId', async (req, res, next) => {
    try {
      const { gameId } = req.params;
      
      // Try cache first
      const cacheKey = cacheManager.generateCacheKey('game', { id: gameId });
      let game = await cacheManager.get(cacheKey);
      
      if (!game) {
        game = await gameModel.getGameDetails(gameId);
        if (!game) {
          return res.status(404).json({ error: 'Game not found' });
        }
        
        // Cache game details
        await cacheManager.set(cacheKey, game, cacheManager.getTTL('game', game));
      }

      res.json({
        success: true,
        data: game,
      });
    } catch (error) {
      next(error);
    }
  });

  // Submit a new game (user-generated)
  router.post('/submit', async (req, res, next) => {
    try {
      // Extract user info from auth middleware (if implemented)
      const userId = req.user?.id || req.headers['x-user-id'] || 'anonymous';
      
      const gameData = {
        ...req.body,
        user: {
          id: userId,
          email: req.user?.email || req.body.user?.email,
          name: req.user?.name || req.body.user?.name,
        },
      };

      const result = await userGameService.submitGame(gameData);
      
      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      if (error.message.includes('Validation error')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  // Verify or report a game
  router.post('/:gameId/verify', async (req, res, next) => {
    try {
      const { gameId } = req.params;
      const { action } = req.body;
      const userId = req.user?.id || req.headers['x-user-id'] || req.ip;

      if (!['confirm', 'report'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action. Use "confirm" or "report"' });
      }

      const result = await userGameService.verifyGame(gameId, userId, action);
      
      res.json(result);
    } catch (error) {
      if (error.message === 'Game not found') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  });

  // Get user's submitted games
  router.get('/user/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, status = 'all' } = req.query;

      const result = await userGameService.getUserSubmittedGames(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  // Trigger data aggregation for a location (admin endpoint)
  router.post('/aggregate', async (req, res, next) => {
    try {
      // This should be protected by admin authentication
      const { lat, lng, radius = 10 } = req.body;

      if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      const location = {
        lat,
        lng,
        geohash: geohash.encode(lat, lng, 6),
      };

      const result = await aggregator.aggregateData(location, radius);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get cache statistics
  router.get('/stats/cache', async (req, res) => {
    const stats = cacheManager.getStats();
    res.json({
      success: true,
      data: stats,
    });
  });

  // Get sync status
  router.get('/stats/sync', async (req, res) => {
    const status = aggregator.getSyncStatus();
    res.json({
      success: true,
      data: status,
    });
  });

  return router;
}

module.exports = createGamesRouter;