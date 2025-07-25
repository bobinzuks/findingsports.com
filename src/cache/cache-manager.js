const Redis = require('ioredis');
const { LRUCache } = require('lru-cache');
const msgpack = require('msgpack-lite');
const geohash = require('geohash');
const winston = require('winston');

class CacheManager {
  constructor(config = {}) {
    // L1: In-memory LRU Cache
    this.memoryCache = new LRUCache({
      max: config.memoryCacheSize || 1000,
      ttl: config.memoryTTL || 60 * 1000, // 1 minute
      updateAgeOnGet: true,
      updateAgeOnHas: true
    });

    // L2: Redis Cache
    this.redis = new Redis({
      host: config.redisHost || 'localhost',
      port: config.redisPort || 6379,
      keyPrefix: 'sports:',
      enableReadyCheck: true,
      maxRetriesPerRequest: 3
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });

    // Cache configuration
    this.ttlConfig = {
      activeGame: 5 * 60, // 5 minutes for games happening now
      upcomingGame: 30 * 60, // 30 minutes for games today
      futureGame: 2 * 60 * 60, // 2 hours for future games
      venueData: 24 * 60 * 60, // 24 hours for venue info
      searchResult: 10 * 60 // 10 minutes for search results
    };

    // Performance tracking
    this.stats = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      dbHits: 0
    };
  }

  generateCacheKey(type, params) {
    switch (type) {
    case 'location_search': {
      const precision = Math.min(6, Math.max(3, 12 - Math.log2(params.radius)));
      const hash = geohash.encode(params.lat, params.lng, precision);
      return `search:${hash}:${params.radius}:${params.sport || 'all'}:${params.gameType || 'all'}`;
    }
    case 'venue':
      return `venue:${params.id}`;

    case 'game':
      return `game:${params.id}`;

    default:
      return `${type}:${JSON.stringify(params)}`;
    }
  }

  getTTL(dataType, data) {
    if (dataType === 'game' && data.startTime) {
      const now = new Date();
      const gameTime = new Date(data.startTime);
      const hoursUntilGame = (gameTime - now) / (1000 * 60 * 60);

      if (hoursUntilGame <= 0) {
        return this.ttlConfig.activeGame;
      }
      if (hoursUntilGame <= 24) {
        return this.ttlConfig.upcomingGame;
      }
      return this.ttlConfig.futureGame;
    }

    return this.ttlConfig[dataType] || 600; // Default 10 minutes
  }

  async get(key) {
    const startTime = Date.now();

    // L1: Memory cache
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult) {
      this.stats.l1Hits++;
      this.logger.debug(`L1 cache hit: ${key} (${Date.now() - startTime}ms)`);
      return memoryResult;
    }
    this.stats.l1Misses++;

    // L2: Redis cache
    try {
      const redisResult = await this.redis.getBuffer(key);
      if (redisResult) {
        this.stats.l2Hits++;
        const decoded = msgpack.decode(redisResult);

        // Populate L1 cache
        this.memoryCache.set(key, decoded);

        this.logger.debug(`L2 cache hit: ${key} (${Date.now() - startTime}ms)`);
        return decoded;
      }
    } catch (error) {
      this.logger.error(`Redis error for key ${key}:`, error);
    }

    this.stats.l2Misses++;
    return null;
  }

  async set(key, value, ttlOverride = null) {
    const ttl = ttlOverride || this.getTTL('default', value);

    // L1: Memory cache
    this.memoryCache.set(key, value, { ttl: ttl * 1000 });

    // L2: Redis cache
    try {
      const packed = msgpack.encode(value);
      await this.redis.setex(key, ttl, packed);
    } catch (error) {
      this.logger.error(`Redis set error for key ${key}:`, error);
    }
  }

  async multiGet(keys) {
    const results = {};
    const missingKeys = [];

    // Check L1 cache first
    for (const key of keys) {
      const cached = this.memoryCache.get(key);
      if (cached) {
        results[key] = cached;
        this.stats.l1Hits++;
      } else {
        missingKeys.push(key);
        this.stats.l1Misses++;
      }
    }

    // Check L2 cache for missing keys
    if (missingKeys.length > 0) {
      try {
        const pipeline = this.redis.pipeline();
        missingKeys.forEach(key => pipeline.getBuffer(key));
        const redisResults = await pipeline.exec();

        redisResults.forEach(([err, data], index) => {
          if (!err && data) {
            const key = missingKeys[index];
            const decoded = msgpack.decode(data);
            results[key] = decoded;
            this.memoryCache.set(key, decoded);
            this.stats.l2Hits++;
          } else {
            this.stats.l2Misses++;
          }
        });
      } catch (error) {
        this.logger.error('Redis multi-get error:', error);
      }
    }

    return results;
  }

  async warmCache(locations, radius = 10) {
    const warmupPromises = [];

    for (const location of locations) {
      // Generate cache keys for different sports and time ranges
      const sports = ['basketball', 'soccer', 'hockey', 'volleyball', 'all'];
      const gameTypes = ['drop-in', 'organized', 'all'];

      for (const sport of sports) {
        for (const gameType of gameTypes) {
          const key = this.generateCacheKey('location_search', {
            lat: location.lat,
            lng: location.lng,
            radius,
            sport: sport === 'all' ? null : sport,
            gameType: gameType === 'all' ? null : gameType
          });

          warmupPromises.push(
            this.get(key).then(result => {
              if (!result) {
                this.logger.info(`Cache miss during warmup: ${key}`);
              }
            })
          );
        }
      }
    }

    await Promise.all(warmupPromises);
    this.logger.info(`Cache warmup completed for ${locations.length} locations`);
  }

  async invalidate(pattern) {
    // Clear from L1 cache
    for (const [key] of this.memoryCache.entries()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from L2 cache
    const stream = this.redis.scanStream({
      match: `sports:${pattern}*`,
      count: 100
    });

    stream.on('data', async keys => {
      if (keys.length) {
        await this.redis.del(...keys);
      }
    });

    return new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  }

  getStats() {
    const total = this.stats.l1Hits + this.stats.l1Misses;
    const l1HitRate = total > 0 ? (this.stats.l1Hits / total) * 100 : 0;
    const l2Total = this.stats.l2Hits + this.stats.l2Misses;
    const l2HitRate = l2Total > 0 ? (this.stats.l2Hits / l2Total) * 100 : 0;

    return {
      ...this.stats,
      l1HitRate: `${l1HitRate.toFixed(2)}%`,
      l2HitRate: `${l2HitRate.toFixed(2)}%`,
      memoryCacheSize: this.memoryCache.size
    };
  }

  async close() {
    await this.redis.quit();
  }
}

module.exports = CacheManager;