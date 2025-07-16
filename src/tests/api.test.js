const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');
const GameModel = require('../models/game.model');
const CacheManager = require('../cache/cache-manager');
const UserGameService = require('../services/user-game-service');
const DataAggregator = require('../services/data-aggregator');
const createGamesRouter = require('../api/routes/games');

// Mock dependencies
jest.mock('pg');
jest.mock('ioredis');

describe('Games API', () => {
  let app;
  let mockPool;
  let mockCacheManager;
  let mockGameModel;
  let mockUserGameService;
  let mockAggregator;

  beforeEach(() => {
    // Setup mocks
    mockPool = {
      query: jest.fn(),
      end: jest.fn(),
    };

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      generateCacheKey: jest.fn((type, params) => `${type}:${JSON.stringify(params)}`),
      getTTL: jest.fn(() => 600),
      getStats: jest.fn(() => ({ l1Hits: 100, l1Misses: 20 })),
      stats: { dbHits: 0 },
    };

    mockGameModel = {
      findGamesNearLocation: jest.fn(),
      getGameDetails: jest.fn(),
    };

    mockUserGameService = {
      submitGame: jest.fn(),
      verifyGame: jest.fn(),
      getUserSubmittedGames: jest.fn(),
    };

    mockAggregator = {
      aggregateData: jest.fn(),
      getSyncStatus: jest.fn(() => ({})),
    };

    // Create Express app with router
    app = express();
    app.use(express.json());
    app.use('/api/games', createGamesRouter(
      mockGameModel,
      mockCacheManager,
      mockUserGameService,
      mockAggregator
    ));
  });

  describe('GET /api/games/nearby', () => {
    it('should return games near a location', async () => {
      const mockGames = [
        {
          id: '123',
          venue_id: '456',
          venue_name: 'Community Center',
          venue_address: '123 Main St',
          distance_meters: 500,
          location: { type: 'Point', coordinates: [-79.3832, 43.6532] },
          sport: 'basketball',
          game_type: 'drop-in',
          start_time: '2024-01-15T18:00:00Z',
          end_time: '2024-01-15T20:00:00Z',
          capacity: 20,
          current_players: 5,
          skill_level: 'all',
          price: '0',
          verification_status: 'verified',
        },
      ];

      mockCacheManager.get.mockResolvedValue(null);
      mockGameModel.findGamesNearLocation.mockResolvedValue(mockGames);

      const response = await request(app)
        .get('/api/games/nearby')
        .query({ lat: 43.6532, lng: -79.3832, radius: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.games).toHaveLength(1);
      expect(response.body.data.games[0].sport).toBe('basketball');
      expect(response.body.meta.searchArea.radiusKm).toBe(10);
    });

    it('should use cached results when available', async () => {
      const cachedGames = [{ id: 'cached-game' }];
      mockCacheManager.get.mockResolvedValue(cachedGames);

      const response = await request(app)
        .get('/api/games/nearby')
        .query({ lat: 43.6532, lng: -79.3832 });

      expect(response.status).toBe(200);
      expect(mockGameModel.findGamesNearLocation).not.toHaveBeenCalled();
      expect(response.body.meta.cacheHit).toBe(true);
    });

    it('should validate required parameters', async () => {
      const response = await request(app)
        .get('/api/games/nearby')
        .query({ lng: -79.3832 }); // Missing lat

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('lat');
    });

    it('should filter by sport and game type', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockGameModel.findGamesNearLocation.mockResolvedValue([]);

      await request(app)
        .get('/api/games/nearby')
        .query({
          lat: 43.6532,
          lng: -79.3832,
          sport: 'basketball',
          gameType: 'drop-in',
        });

      expect(mockGameModel.findGamesNearLocation).toHaveBeenCalledWith(
        43.6532,
        -79.3832,
        10,
        expect.objectContaining({
          sport: 'basketball',
          gameType: 'drop-in',
        })
      );
    });
  });

  describe('POST /api/games/submit', () => {
    it('should submit a new game', async () => {
      const gameData = {
        venue: {
          name: 'Test Gym',
          address: '123 Test St',
          latitude: 43.6532,
          longitude: -79.3832,
          type: 'gym',
        },
        game: {
          sport: 'basketball',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 93600000).toISOString(),
          gameType: 'drop-in',
          skillLevel: 'all',
          capacity: 20,
          price: 0,
        },
        user: {
          id: 'user123',
          email: 'test@example.com',
        },
      };

      mockUserGameService.submitGame.mockResolvedValue({
        success: true,
        gameId: 'game123',
        venueId: 'venue123',
        verificationStatus: 'pending',
      });

      const response = await request(app)
        .post('/api/games/submit')
        .send(gameData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.gameId).toBe('game123');
    });

    it('should handle validation errors', async () => {
      mockUserGameService.submitGame.mockRejectedValue(
        new Error('Validation error: Invalid sport type')
      );

      const response = await request(app)
        .post('/api/games/submit')
        .send({ invalid: 'data' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Validation error');
    });
  });

  describe('POST /api/games/:gameId/verify', () => {
    it('should verify a game', async () => {
      mockUserGameService.verifyGame.mockResolvedValue({
        success: true,
        action: 'confirm',
        newStatus: 'verified',
        verificationCount: 3,
        reportedCount: 0,
      });

      const response = await request(app)
        .post('/api/games/game123/verify')
        .send({ action: 'confirm' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.newStatus).toBe('verified');
    });

    it('should report a game', async () => {
      mockUserGameService.verifyGame.mockResolvedValue({
        success: true,
        action: 'report',
        newStatus: 'pending',
        verificationCount: 0,
        reportedCount: 1,
      });

      const response = await request(app)
        .post('/api/games/game123/verify')
        .send({ action: 'report' });

      expect(response.status).toBe(200);
      expect(response.body.reportedCount).toBe(1);
    });

    it('should validate action parameter', async () => {
      const response = await request(app)
        .post('/api/games/game123/verify')
        .send({ action: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid action');
    });
  });

  describe('GET /api/games/stats/cache', () => {
    it('should return cache statistics', async () => {
      const response = await request(app)
        .get('/api/games/stats/cache');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.l1Hits).toBe(100);
      expect(response.body.data.l1Misses).toBe(20);
    });
  });
});

describe('Performance Requirements', () => {
  it('should handle location queries efficiently', async () => {
    const app = express();
    const mockCacheManager = {
      get: jest.fn().mockResolvedValue([{ id: 'cached' }]),
      generateCacheKey: jest.fn(() => 'test-key'),
      stats: { dbHits: 0 },
    };

    app.use('/api/games', createGamesRouter(
      {},
      mockCacheManager,
      {},
      {}
    ));

    const start = Date.now();
    const response = await request(app)
      .get('/api/games/nearby')
      .query({ lat: 43.6532, lng: -79.3832 });

    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(100); // Should respond in under 100ms
  });
});