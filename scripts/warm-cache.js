#!/usr/bin/env node

const { Pool } = require('pg');
const CacheManager = require('../src/cache/cache-manager');
const GameModel = require('../src/models/game.model');
const winston = require('winston');
require('dotenv').config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

async function warmCache() {
  logger.info('Starting cache warming...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const cacheManager = new CacheManager({
    redisHost: process.env.REDIS_HOST,
    redisPort: process.env.REDIS_PORT,
  });

  const gameModel = new GameModel(pool);

  try {
    // Major cities to warm cache for
    const cities = [
      { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
      { name: 'New York', lat: 40.7128, lng: -74.0060 },
      { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
      { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
      { name: 'Vancouver', lat: 49.2827, lng: -123.1207 },
      { name: 'Montreal', lat: 45.5017, lng: -73.5673 },
      { name: 'Boston', lat: 42.3601, lng: -71.0589 },
      { name: 'Seattle', lat: 47.6062, lng: -122.3321 },
      { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
      { name: 'Miami', lat: 25.7617, lng: -80.1918 },
    ];

    const sports = ['basketball', 'soccer', 'hockey', 'volleyball', 'tennis', null];
    const gameTypes = ['drop-in', 'organized', null];
    const radii = [5, 10, 20];

    let totalQueries = 0;
    let cachedQueries = 0;

    for (const city of cities) {
      logger.info(`Warming cache for ${city.name}...`);
      
      for (const radius of radii) {
        for (const sport of sports) {
          for (const gameType of gameTypes) {
            try {
              const cacheKey = cacheManager.generateCacheKey('location_search', {
                lat: city.lat,
                lng: city.lng,
                radius,
                sport,
                gameType,
              });

              // Check if already cached
              const cached = await cacheManager.get(cacheKey);
              if (cached) {
                cachedQueries++;
                continue;
              }

              // Query database
              const results = await gameModel.findGamesNearLocation(
                city.lat,
                city.lng,
                radius,
                { sport, gameType }
              );

              // Cache results
              await cacheManager.set(cacheKey, results, 1800); // 30 minutes
              totalQueries++;

              // Small delay to avoid overwhelming the database
              await new Promise(resolve => setTimeout(resolve, 50));
              
            } catch (error) {
              logger.error(`Error warming cache for ${city.name}:`, error);
            }
          }
        }
      }
    }

    // Get popular venues and cache their details
    logger.info('Caching popular venues...');
    const popularVenues = await pool.query(`
      SELECT DISTINCT v.* 
      FROM venues v
      JOIN games g ON g.venue_id = v.id
      WHERE g.start_time >= NOW()
      GROUP BY v.id
      ORDER BY COUNT(g.id) DESC
      LIMIT 100
    `);

    for (const venue of popularVenues.rows) {
      const cacheKey = cacheManager.generateCacheKey('venue', { id: venue.id });
      await cacheManager.set(cacheKey, venue, 86400); // 24 hours
    }

    const stats = cacheManager.getStats();
    logger.info(`Cache warming completed!`);
    logger.info(`Total queries executed: ${totalQueries}`);
    logger.info(`Already cached: ${cachedQueries}`);
    logger.info(`Cache stats:`, stats);

  } catch (error) {
    logger.error('Cache warming failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    await cacheManager.close();
  }
}

// Run cache warming
warmCache();