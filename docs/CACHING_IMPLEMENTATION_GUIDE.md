# Caching Implementation Guide

## Overview

This guide details the multi-level caching system that achieves sub-100ms response times for location-based queries. The system uses a three-tier approach: Memory → Redis → Database.

## Cache Architecture

### Three-Level Cache Hierarchy

```
Request → L1 Memory (1-10ms) → L2 Redis (10-30ms) → L3 Database (50-200ms)
```

### Cache Flow Diagram
```
┌─────────┐     Miss      ┌─────────┐     Miss      ┌──────────┐
│   L1    │──────────────→│   L2    │──────────────→│    L3    │
│ Memory  │               │  Redis  │               │Database  │
└────┬────┘               └────┬────┘               └────┬─────┘
     │ Hit                     │ Hit                      │
     ↓                         ↓                          │
  Return                    Return                        │
                           + Populate L1               Populate
                                                      L1 + L2
```

## Implementation Details

### L1: In-Memory LRU Cache

```javascript
const { LRUCache } = require('lru-cache');

class MemoryCache {
  constructor() {
    this.cache = new LRUCache({
      max: 1000,                    // Maximum entries
      ttl: 60 * 1000,              // 1 minute TTL
      updateAgeOnGet: true,        // Refresh TTL on access
      updateAgeOnHas: true,
      
      // Size calculation for memory management
      sizeCalculation: (value) => {
        return JSON.stringify(value).length;
      },
      
      // Maximum memory usage (10MB)
      maxSize: 10 * 1024 * 1024,
    });
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value, ttl) {
    this.cache.set(key, value, { ttl });
  }
}
```

### L2: Redis Cache with MessagePack

```javascript
const Redis = require('ioredis');
const msgpack = require('msgpack-lite');

class RedisCache {
  constructor(config) {
    this.redis = new Redis({
      host: config.host,
      port: config.port,
      keyPrefix: 'sports:',
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      
      // Connection pool settings
      enableAutoPipelining: true,
      autoPipeliningIgnoredCommands: ['info'],
    });
  }

  async get(key) {
    const packed = await this.redis.getBuffer(key);
    if (!packed) return null;
    
    return msgpack.decode(packed);
  }

  async set(key, value, ttl) {
    const packed = msgpack.encode(value);
    await this.redis.setex(key, ttl, packed);
  }

  async multiGet(keys) {
    const pipeline = this.redis.pipeline();
    keys.forEach(key => pipeline.getBuffer(key));
    
    const results = await pipeline.exec();
    return results.map(([err, data]) => 
      data ? msgpack.decode(data) : null
    );
  }
}
```

## Cache Key Design

### Location-Based Keys

```javascript
function generateLocationKey(lat, lng, radius, filters = {}) {
  // Geohash precision based on radius
  const precision = calculatePrecision(radius);
  const hash = geohash.encode(lat, lng, precision);
  
  // Build key components
  const parts = [
    'search',
    hash,
    radius,
    filters.sport || 'all',
    filters.gameType || 'all'
  ];
  
  return parts.join(':');
}

function calculatePrecision(radiusKm) {
  // Higher precision for smaller radius
  if (radiusKm <= 1) return 7;
  if (radiusKm <= 5) return 6;
  if (radiusKm <= 10) return 5;
  if (radiusKm <= 20) return 4;
  return 3;
}
```

### Cache Key Examples

```
search:dpz8c:5:basketball:drop-in     // 5km radius, basketball drop-ins
search:dpz8:10:all:all               // 10km radius, all sports
search:dpz:20:soccer:organized       // 20km radius, organized soccer
venue:550e8400-e29b-41d4-a716       // Specific venue
game:6ba7b810-9dad-11d1-80b4        // Specific game
```

## Dynamic TTL Strategy

### TTL Calculation

```javascript
class TTLCalculator {
  constructor() {
    this.config = {
      activeGame: 5 * 60,         // 5 minutes
      todayGame: 30 * 60,         // 30 minutes
      tomorrowGame: 2 * 60 * 60,  // 2 hours
      futureGame: 6 * 60 * 60,    // 6 hours
      venue: 24 * 60 * 60,        // 24 hours
      searchResult: 10 * 60,      // 10 minutes
    };
  }

  calculateGameTTL(game) {
    const now = new Date();
    const startTime = new Date(game.startTime);
    const hoursUntil = (startTime - now) / (1000 * 60 * 60);
    
    // Game in progress or finished
    if (hoursUntil <= 0) {
      return this.config.activeGame;
    }
    
    // Game today
    if (hoursUntil <= 12) {
      return this.config.todayGame;
    }
    
    // Game tomorrow
    if (hoursUntil <= 36) {
      return this.config.tomorrowGame;
    }
    
    // Future game
    return this.config.futureGame;
  }

  calculateSearchTTL(results) {
    if (results.length === 0) {
      return 60; // 1 minute for empty results
    }
    
    // Find the nearest game
    const nearestGame = results.reduce((nearest, game) => {
      const gameTime = new Date(game.startTime);
      return gameTime < nearest ? gameTime : nearest;
    }, new Date('2099-01-01'));
    
    // Use game TTL logic for search results
    return this.calculateGameTTL({ startTime: nearestGame });
  }
}
```

## Cache Warming Strategy

### Predictive Cache Warming

```javascript
class CacheWarmer {
  constructor(cacheManager, gameModel) {
    this.cache = cacheManager;
    this.model = gameModel;
  }

  async warmPopularLocations() {
    const popularLocations = [
      { lat: 43.6532, lng: -79.3832, name: 'Toronto Downtown' },
      { lat: 43.7184, lng: -79.5181, name: 'Toronto North York' },
      { lat: 43.5890, lng: -79.6441, name: 'Toronto Mississauga' },
    ];

    const radii = [5, 10];
    const sports = ['basketball', 'soccer', 'hockey', null];

    for (const location of popularLocations) {
      for (const radius of radii) {
        for (const sport of sports) {
          const key = this.cache.generateCacheKey('location_search', {
            lat: location.lat,
            lng: location.lng,
            radius,
            sport,
          });

          // Check if already cached
          const cached = await this.cache.get(key);
          if (!cached) {
            // Fetch and cache
            const results = await this.model.findGamesNearLocation(
              location.lat,
              location.lng,
              radius,
              { sport }
            );
            
            await this.cache.set(key, results);
          }
        }
      }
    }
  }

  async warmBasedOnAccessPatterns() {
    // Analyze access logs to identify patterns
    const patterns = await this.analyzeAccessPatterns();
    
    // Warm cache for predicted queries
    for (const pattern of patterns) {
      if (pattern.confidence > 0.7) {
        await this.warmQuery(pattern.query);
      }
    }
  }

  async scheduleWarming() {
    // Run every hour during peak times
    const peakHours = [6, 7, 8, 17, 18, 19, 20];
    const currentHour = new Date().getHours();
    
    if (peakHours.includes(currentHour)) {
      await this.warmPopularLocations();
    }
  }
}
```

## Cache Invalidation

### Invalidation Strategies

```javascript
class CacheInvalidator {
  constructor(cacheManager) {
    this.cache = cacheManager;
  }

  async invalidateLocation(lat, lng, radius = 20) {
    // Invalidate all precision levels
    const precisions = [3, 4, 5, 6, 7];
    
    for (const precision of precisions) {
      const hash = geohash.encode(lat, lng, precision);
      const pattern = `search:${hash}*`;
      
      await this.cache.invalidate(pattern);
    }
  }

  async invalidateVenue(venueId) {
    // Venue details
    await this.cache.invalidate(`venue:${venueId}`);
    
    // Find venue location for search invalidation
    const venue = await this.getVenue(venueId);
    if (venue) {
      await this.invalidateLocation(
        venue.latitude,
        venue.longitude
      );
    }
  }

  async invalidateGame(gameId, venueLocation) {
    // Game details
    await this.cache.invalidate(`game:${gameId}`);
    
    // Invalidate location searches
    if (venueLocation) {
      await this.invalidateLocation(
        venueLocation.lat,
        venueLocation.lng
      );
    }
  }

  async smartInvalidation(changeType, data) {
    switch (changeType) {
      case 'venue_added':
      case 'venue_updated':
        await this.invalidateVenue(data.venueId);
        break;
        
      case 'game_added':
      case 'game_updated':
      case 'game_cancelled':
        await this.invalidateGame(data.gameId, data.location);
        break;
        
      case 'bulk_update':
        // More aggressive invalidation
        await this.invalidatePattern('search:*');
        break;
    }
  }
}
```

## Performance Monitoring

### Cache Metrics

```javascript
class CacheMetrics {
  constructor() {
    this.stats = {
      l1Hits: 0,
      l1Misses: 0,
      l2Hits: 0,
      l2Misses: 0,
      l3Hits: 0,
      avgL1Time: 0,
      avgL2Time: 0,
      avgL3Time: 0,
    };
  }

  recordHit(level, responseTime) {
    this.stats[`l${level}Hits`]++;
    this.updateAvgTime(level, responseTime);
  }

  recordMiss(level) {
    this.stats[`l${level}Misses`]++;
  }

  updateAvgTime(level, time) {
    const key = `avgL${level}Time`;
    const hits = this.stats[`l${level}Hits`];
    
    this.stats[key] = 
      (this.stats[key] * (hits - 1) + time) / hits;
  }

  getMetrics() {
    const l1Total = this.stats.l1Hits + this.stats.l1Misses;
    const l2Total = this.stats.l2Hits + this.stats.l2Misses;
    
    return {
      ...this.stats,
      l1HitRate: l1Total ? (this.stats.l1Hits / l1Total) : 0,
      l2HitRate: l2Total ? (this.stats.l2Hits / l2Total) : 0,
      cacheEfficiency: this.calculateEfficiency(),
    };
  }

  calculateEfficiency() {
    // Weighted efficiency score
    const l1Weight = 0.5;
    const l2Weight = 0.3;
    const timeWeight = 0.2;
    
    const l1Rate = this.getMetrics().l1HitRate;
    const l2Rate = this.getMetrics().l2HitRate;
    const timeScore = Math.max(0, 1 - (this.stats.avgL3Time / 100));
    
    return l1Weight * l1Rate + l2Weight * l2Rate + timeWeight * timeScore;
  }
}
```

## Best Practices

### 1. Cache-Aside Pattern
```javascript
async function getCachedData(key, fetchFunction) {
  // Try cache first
  const cached = await cache.get(key);
  if (cached) return cached;
  
  // Fetch from source
  const data = await fetchFunction();
  
  // Cache for next time
  await cache.set(key, data);
  
  return data;
}
```

### 2. Batch Operations
```javascript
async function batchGet(keys) {
  // Check L1 first
  const l1Results = keys.map(key => ({
    key,
    value: memoryCache.get(key)
  }));
  
  // Find misses
  const misses = l1Results
    .filter(r => !r.value)
    .map(r => r.key);
  
  // Batch fetch from Redis
  if (misses.length > 0) {
    const l2Results = await redisCache.multiGet(misses);
    // Populate L1 with L2 hits
    // ... implementation
  }
  
  return mergeResults(l1Results, l2Results);
}
```

### 3. Circuit Breaker for Cache
```javascript
class CacheCircuitBreaker {
  constructor(cache, options = {}) {
    this.cache = cache;
    this.failures = 0;
    this.threshold = options.threshold || 5;
    this.timeout = options.timeout || 60000;
    this.isOpen = false;
  }

  async get(key) {
    if (this.isOpen) {
      return null; // Skip cache if circuit is open
    }

    try {
      const result = await this.cache.get(key);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      return null;
    }
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.isOpen = true;
      setTimeout(() => {
        this.isOpen = false;
        this.failures = 0;
      }, this.timeout);
    }
  }

  onSuccess() {
    this.failures = 0;
  }
}
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Reduce LRU cache size
   - Implement better size calculation
   - Use compression for large objects

2. **Redis Connection Issues**
   - Implement connection pooling
   - Add circuit breaker
   - Use Redis Sentinel for HA

3. **Cache Stampede**
   - Implement cache locks
   - Use probabilistic early expiration
   - Add jitter to TTL

4. **Stale Data**
   - Implement event-based invalidation
   - Reduce TTL for critical data
   - Add versioning to cache keys