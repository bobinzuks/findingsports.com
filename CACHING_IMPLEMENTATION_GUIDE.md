# Caching Implementation Guide for Sports Game Data

## Overview

This guide provides concrete implementation details for achieving sub-100ms response times for location-based sports game queries using a multi-tier caching strategy.

## Cache Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│ L1: Memory  │────▶│  L2: Redis  │────▶│ L3: PostGIS │
│   Request   │◀────│   (10ms)    │◀────│   (30ms)    │◀────│   (200ms)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## 1. L1 Cache: In-Memory Implementation

```javascript
// cache/memory-cache.js
const LRUCache = require('lru-cache');
const xxhash = require('xxhash');

class InMemoryCache {
    constructor(options = {}) {
        this.cache = new LRUCache({
            max: options.maxSize || 10 * 1024 * 1024, // 10MB
            length: (item) => JSON.stringify(item).length,
            dispose: (key, value) => {
                console.log(`Evicting ${key} from L1 cache`);
            },
            maxAge: options.defaultTTL || 60 * 1000 // 1 minute default
        });
        
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
    }
    
    generateKey(params) {
        // Use xxhash for fast, consistent hashing
        const str = JSON.stringify(params);
        return xxhash.hash(Buffer.from(str), 0x1234).toString(16);
    }
    
    async get(params) {
        const key = this.generateKey(params);
        const value = this.cache.get(key);
        
        if (value) {
            this.stats.hits++;
            return value;
        }
        
        this.stats.misses++;
        return null;
    }
    
    async set(params, value, ttl) {
        const key = this.generateKey(params);
        this.cache.set(key, value, ttl || this.cache.maxAge);
    }
    
    getStats() {
        const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
        return {
            ...this.stats,
            hitRate: (hitRate * 100).toFixed(2) + '%',
            size: this.cache.length,
            itemCount: this.cache.itemCount
        };
    }
}

module.exports = InMemoryCache;
```

## 2. L2 Cache: Redis Implementation

```javascript
// cache/redis-cache.js
const Redis = require('ioredis');
const msgpack = require('msgpack-lite');

class RedisCache {
    constructor(options = {}) {
        this.redis = new Redis({
            host: options.host || 'localhost',
            port: options.port || 6379,
            db: options.db || 0,
            enableReadyCheck: true,
            enableOfflineQueue: true,
            
            // Connection pool for high concurrency
            maxRetriesPerRequest: 3,
            connectionPoolSize: 10,
            
            // Performance optimizations
            dropBufferSupport: false,
            enableAutoPipelining: true
        });
        
        this.prefix = options.prefix || 'sports:';
        this.defaultTTL = options.defaultTTL || 300; // 5 minutes
        
        // Use MessagePack for efficient serialization
        this.encode = msgpack.encode;
        this.decode = msgpack.decode;
    }
    
    generateKey(type, params) {
        // Hierarchical key structure for efficient invalidation
        const parts = [this.prefix, type];
        
        switch(type) {
            case 'location':
                parts.push(params.geohash, params.radius, params.filters || 'all');
                break;
            case 'venue':
                parts.push(params.venueId, params.date || 'all');
                break;
            case 'game':
                parts.push(params.gameId);
                break;
            case 'sport':
                parts.push(params.sport, params.date || 'today');
                break;
        }
        
        return parts.join(':');
    }
    
    async getLocation(lat, lng, radius, filters = {}) {
        const geohash = this.getGeohash(lat, lng, radius);
        const key = this.generateKey('location', { geohash, radius, filters });
        
        const data = await this.redis.getBuffer(key);
        if (data) {
            return this.decode(data);
        }
        return null;
    }
    
    async setLocation(lat, lng, radius, filters, data) {
        const geohash = this.getGeohash(lat, lng, radius);
        const key = this.generateKey('location', { geohash, radius, filters });
        
        // Shorter TTL for active game times
        const ttl = this.getDynamicTTL('location', data);
        
        await this.redis.setex(
            key,
            ttl,
            Buffer.from(this.encode(data))
        );
        
        // Add to geospatial index for nearby cache warming
        await this.redis.geoadd(
            'cache:locations',
            lng,
            lat,
            `${key}:${Date.now()}`
        );
    }
    
    async warmNearbyLocations(lat, lng, radius) {
        // Find cached locations within 2x radius
        const nearby = await this.redis.georadius(
            'cache:locations',
            lng,
            lat,
            radius * 2,
            'm',
            'WITHDIST'
        );
        
        // Return keys that might be useful
        return nearby
            .map(([key, distance]) => key.split(':')[0])
            .filter(key => key.startsWith(this.prefix));
    }
    
    getDynamicTTL(type, data) {
        const now = new Date();
        const hour = now.getHours();
        
        // Base TTLs by type
        const baseTTLs = {
            location: 300,    // 5 minutes
            venue: 1800,      // 30 minutes
            game: 600,        // 10 minutes
            sport: 900        // 15 minutes
        };
        
        let ttl = baseTTLs[type] || this.defaultTTL;
        
        // Adjust based on time of day
        if (hour >= 6 && hour <= 9) {
            ttl = ttl * 0.5;  // Morning rush
        } else if (hour >= 17 && hour <= 20) {
            ttl = ttl * 0.5;  // Evening rush
        } else if (hour >= 0 && hour <= 6) {
            ttl = ttl * 2;    // Night time
        }
        
        // Adjust based on data freshness needs
        if (data && Array.isArray(data)) {
            const hasActiveGames = data.some(game => {
                const start = new Date(game.start_time);
                const end = new Date(game.end_time);
                return start <= now && end >= now;
            });
            
            if (hasActiveGames) {
                ttl = Math.min(ttl, 60); // 1 minute max for active games
            }
        }
        
        return Math.round(ttl);
    }
    
    getGeohash(lat, lng, radius) {
        // Precision based on radius
        const precision = radius <= 1000 ? 7 :
                         radius <= 5000 ? 6 :
                         radius <= 10000 ? 5 : 4;
        
        return require('ngeohash').encode(lat, lng, precision);
    }
    
    async invalidatePattern(pattern) {
        const stream = this.redis.scanStream({
            match: this.prefix + pattern,
            count: 100
        });
        
        const pipeline = this.redis.pipeline();
        
        stream.on('data', (keys) => {
            keys.forEach(key => pipeline.del(key));
        });
        
        stream.on('end', () => {
            pipeline.exec();
        });
    }
    
    async getStats() {
        const info = await this.redis.info('stats');
        const dbSize = await this.redis.dbsize();
        
        return {
            connections: this.redis.status === 'ready' ? 'connected' : 'disconnected',
            dbSize,
            info: this.parseRedisInfo(info)
        };
    }
    
    parseRedisInfo(info) {
        const lines = info.split('\r\n');
        const stats = {};
        
        lines.forEach(line => {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                stats[key] = value;
            }
        });
        
        return {
            hits: parseInt(stats.keyspace_hits || 0),
            misses: parseInt(stats.keyspace_misses || 0),
            hitRate: stats.keyspace_hits / 
                    (parseInt(stats.keyspace_hits || 0) + parseInt(stats.keyspace_misses || 0)) || 0,
            evictedKeys: parseInt(stats.evicted_keys || 0)
        };
    }
}

module.exports = RedisCache;
```

## 3. Cache Manager: Orchestrating All Layers

```javascript
// cache/cache-manager.js
const InMemoryCache = require('./memory-cache');
const RedisCache = require('./redis-cache');

class CacheManager {
    constructor(options = {}) {
        this.l1 = new InMemoryCache(options.memory || {});
        this.l2 = new RedisCache(options.redis || {});
        this.db = options.database; // PostgreSQL connection
        
        this.stats = {
            l1Hits: 0,
            l2Hits: 0,
            dbHits: 0,
            totalRequests: 0
        };
        
        // Cache warming queue
        this.warmingQueue = [];
        this.startWarmingWorker();
    }
    
    async getGamesNearby(lat, lng, radius, filters = {}) {
        const startTime = Date.now();
        this.stats.totalRequests++;
        
        // L1 Check
        const l1Key = { lat, lng, radius, filters };
        let data = await this.l1.get(l1Key);
        if (data) {
            this.stats.l1Hits++;
            this.recordLatency('l1', Date.now() - startTime);
            return data;
        }
        
        // L2 Check
        data = await this.l2.getLocation(lat, lng, radius, filters);
        if (data) {
            this.stats.l2Hits++;
            this.recordLatency('l2', Date.now() - startTime);
            
            // Populate L1
            await this.l1.set(l1Key, data, 60000); // 1 minute
            
            // Schedule nearby warming
            this.scheduleWarming(lat, lng, radius);
            
            return data;
        }
        
        // L3 Database Query
        data = await this.queryDatabase(lat, lng, radius, filters);
        this.stats.dbHits++;
        this.recordLatency('l3', Date.now() - startTime);
        
        // Populate caches
        await this.l2.setLocation(lat, lng, radius, filters, data);
        await this.l1.set(l1Key, data, 60000);
        
        // Aggressive warming for popular queries
        if (this.isPopularQuery(lat, lng)) {
            this.aggressiveWarm(lat, lng);
        }
        
        return data;
    }
    
    async queryDatabase(lat, lng, radius, filters) {
        const query = `
            WITH nearby_venues AS (
                SELECT 
                    v.*,
                    ST_Distance(v.location, ST_MakePoint($1, $2)::geography) as distance
                FROM venues v
                WHERE ST_DWithin(
                    v.location,
                    ST_MakePoint($1, $2)::geography,
                    $3
                )
                ORDER BY distance
                LIMIT 50
            )
            SELECT 
                g.id,
                g.sport_type,
                g.title,
                g.start_time,
                g.end_time,
                g.max_attendees,
                g.current_attendees,
                g.price,
                nv.name as venue_name,
                nv.address as venue_address,
                nv.distance,
                nv.latitude,
                nv.longitude
            FROM games g
            JOIN nearby_venues nv ON g.venue_id = nv.id
            WHERE 
                g.start_time >= NOW()
                AND g.start_time <= NOW() + INTERVAL '7 days'
                AND g.status = 'upcoming'
                ${filters.sport ? "AND g.sport_type = $4" : ""}
                ${filters.date ? "AND DATE(g.start_time) = $5" : ""}
                ${filters.indoor !== undefined ? "AND g.is_indoor = $6" : ""}
            ORDER BY 
                CASE 
                    WHEN g.start_time::date = CURRENT_DATE THEN 0
                    WHEN g.start_time::date = CURRENT_DATE + 1 THEN 1
                    ELSE 2
                END,
                g.start_time,
                nv.distance
            LIMIT 100
        `;
        
        const params = [lng, lat, radius * 1000];
        if (filters.sport) params.push(filters.sport);
        if (filters.date) params.push(filters.date);
        if (filters.indoor !== undefined) params.push(filters.indoor);
        
        const result = await this.db.query(query, params);
        return result.rows;
    }
    
    scheduleWarming(lat, lng, radius) {
        // Add to warming queue with slight offset
        const variations = [
            { lat: lat + 0.01, lng, radius },          // North
            { lat: lat - 0.01, lng, radius },          // South
            { lat, lng: lng + 0.01, radius },          // East
            { lat, lng: lng - 0.01, radius },          // West
            { lat, lng, radius: radius * 0.5 },        // Smaller radius
            { lat, lng, radius: Math.min(radius * 1.5, 20000) } // Larger radius
        ];
        
        variations.forEach(v => {
            this.warmingQueue.push({
                ...v,
                priority: this.calculateWarmingPriority(v),
                timestamp: Date.now()
            });
        });
    }
    
    calculateWarmingPriority(location) {
        const hour = new Date().getHours();
        const isPeakHour = (hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 20);
        const isPopularArea = this.isPopularArea(location.lat, location.lng);
        
        let priority = 1;
        if (isPeakHour) priority *= 2;
        if (isPopularArea) priority *= 3;
        if (location.radius <= 5000) priority *= 1.5;
        
        return priority;
    }
    
    isPopularArea(lat, lng) {
        // Define popular areas (city centers, etc.)
        const popularAreas = [
            { lat: 49.2827, lng: -123.1207, name: 'Vancouver Downtown' },
            { lat: 49.2488, lng: -122.9805, name: 'Burnaby' },
            { lat: 49.1666, lng: -123.1336, name: 'Richmond' }
        ];
        
        return popularAreas.some(area => {
            const distance = this.haversineDistance(lat, lng, area.lat, area.lng);
            return distance < 5; // Within 5km of popular area
        });
    }
    
    haversineDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    async startWarmingWorker() {
        setInterval(async () => {
            if (this.warmingQueue.length === 0) return;
            
            // Sort by priority
            this.warmingQueue.sort((a, b) => b.priority - a.priority);
            
            // Process top 5 items
            const toWarm = this.warmingQueue.splice(0, 5);
            
            await Promise.all(toWarm.map(async (item) => {
                try {
                    await this.getGamesNearby(item.lat, item.lng, item.radius);
                    console.log(`Warmed cache for ${item.lat},${item.lng} r=${item.radius}`);
                } catch (error) {
                    console.error('Cache warming error:', error);
                }
            }));
        }, 5000); // Every 5 seconds
    }
    
    async aggressiveWarm(lat, lng) {
        // Pre-warm common queries for this location
        const commonFilters = [
            {},
            { sport: 'basketball' },
            { sport: 'soccer' },
            { sport: 'hockey' },
            { date: new Date().toISOString().split('T')[0] },
            { indoor: true }
        ];
        
        const commonRadii = [5000, 10000];
        
        const warmingTasks = [];
        for (const radius of commonRadii) {
            for (const filters of commonFilters) {
                warmingTasks.push(
                    this.l2.getLocation(lat, lng, radius, filters)
                        .catch(() => null) // Ignore errors
                );
            }
        }
        
        await Promise.all(warmingTasks);
    }
    
    recordLatency(level, latency) {
        // Send to monitoring system
        console.log(`Cache ${level} latency: ${latency}ms`);
        
        // Could send to StatsD, Prometheus, etc.
        // this.metrics.timing(`cache.${level}.latency`, latency);
    }
    
    async getStats() {
        const l1Stats = this.l1.getStats();
        const l2Stats = await this.l2.getStats();
        
        const totalHits = this.stats.l1Hits + this.stats.l2Hits + this.stats.dbHits;
        
        return {
            summary: {
                totalRequests: this.stats.totalRequests,
                l1HitRate: (this.stats.l1Hits / this.stats.totalRequests * 100).toFixed(2) + '%',
                l2HitRate: (this.stats.l2Hits / this.stats.totalRequests * 100).toFixed(2) + '%',
                dbHitRate: (this.stats.dbHits / this.stats.totalRequests * 100).toFixed(2) + '%',
                overallCacheHitRate: ((this.stats.l1Hits + this.stats.l2Hits) / this.stats.totalRequests * 100).toFixed(2) + '%'
            },
            l1: l1Stats,
            l2: l2Stats,
            warming: {
                queueSize: this.warmingQueue.length,
                popularAreas: this.getPopularQueryAreas()
            }
        };
    }
    
    getPopularQueryAreas() {
        // Track and return most queried areas
        // Implementation depends on tracking mechanism
        return [];
    }
    
    async invalidate(type, params) {
        // Invalidate across all cache levels
        switch(type) {
            case 'venue':
                await this.l2.invalidatePattern(`venue:${params.venueId}:*`);
                break;
            case 'sport':
                await this.l2.invalidatePattern(`*:${params.sport}:*`);
                break;
            case 'location':
                await this.l2.invalidatePattern(`location:${params.geohash}*`);
                break;
        }
        
        // Clear L1 cache for safety
        this.l1.cache.reset();
    }
}

module.exports = CacheManager;
```

## 4. Cache Warming Strategy

```javascript
// cache/cache-warmer.js
class CacheWarmer {
    constructor(cacheManager, db) {
        this.cache = cacheManager;
        this.db = db;
        this.schedule = [];
    }
    
    async initialize() {
        // Load popular locations from database
        const popularVenues = await this.db.query(`
            SELECT 
                v.latitude,
                v.longitude,
                v.city,
                COUNT(g.id) as game_count
            FROM venues v
            JOIN games g ON v.id = g.venue_id
            WHERE g.start_time >= NOW() - INTERVAL '30 days'
            GROUP BY v.id
            ORDER BY game_count DESC
            LIMIT 50
        `);
        
        // Schedule warming for popular areas
        for (const venue of popularVenues.rows) {
            this.scheduleLocationWarming(venue.latitude, venue.longitude);
        }
        
        // Start warming workers
        this.startDailyWarming();
        this.startHourlyWarming();
        this.startPeakHourWarming();
    }
    
    scheduleLocationWarming(lat, lng) {
        const times = [
            '06:00', // Morning
            '12:00', // Lunch
            '17:00', // After work
            '19:00'  // Evening
        ];
        
        times.forEach(time => {
            this.schedule.push({
                time,
                task: async () => {
                    await this.warmLocation(lat, lng);
                }
            });
        });
    }
    
    async warmLocation(lat, lng) {
        console.log(`Warming cache for ${lat}, ${lng}`);
        
        // Warm different radius and filter combinations
        const tasks = [];
        const radii = [5000, 10000];
        const filters = [
            {},
            { sport: 'basketball' },
            { sport: 'soccer' },
            { date: new Date().toISOString().split('T')[0] }
        ];
        
        for (const radius of radii) {
            for (const filter of filters) {
                tasks.push(
                    this.cache.getGamesNearby(lat, lng, radius, filter)
                        .catch(err => console.error('Warming error:', err))
                );
            }
        }
        
        await Promise.all(tasks);
    }
    
    async startDailyWarming() {
        // Run at 5 AM every day
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(5, 0, 0, 0);
        
        const msUntilTomorrow = tomorrow - now;
        
        setTimeout(() => {
            this.performDailyWarming();
            // Then run every 24 hours
            setInterval(() => this.performDailyWarming(), 24 * 60 * 60 * 1000);
        }, msUntilTomorrow);
    }
    
    async performDailyWarming() {
        console.log('Starting daily cache warming...');
        
        // Get all venues with games today
        const venues = await this.db.query(`
            SELECT DISTINCT
                v.latitude,
                v.longitude,
                COUNT(g.id) as game_count
            FROM venues v
            JOIN games g ON v.id = g.venue_id
            WHERE DATE(g.start_time) = CURRENT_DATE
            GROUP BY v.id
            ORDER BY game_count DESC
        `);
        
        // Warm cache for each venue
        for (const venue of venues.rows) {
            await this.warmLocation(venue.latitude, venue.longitude);
            // Rate limit to avoid overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`Daily warming complete. Warmed ${venues.rows.length} locations.`);
    }
    
    async startHourlyWarming() {
        setInterval(async () => {
            const hour = new Date().getHours();
            
            // Only warm during active hours
            if (hour >= 6 && hour <= 22) {
                await this.performHourlyWarming();
            }
        }, 60 * 60 * 1000); // Every hour
    }
    
    async performHourlyWarming() {
        console.log('Starting hourly cache warming...');
        
        // Get venues with games in next 2 hours
        const venues = await this.db.query(`
            SELECT DISTINCT
                v.latitude,
                v.longitude
            FROM venues v
            JOIN games g ON v.id = g.venue_id
            WHERE g.start_time >= NOW()
            AND g.start_time <= NOW() + INTERVAL '2 hours'
            LIMIT 20
        `);
        
        for (const venue of venues.rows) {
            await this.warmLocation(venue.latitude, venue.longitude);
        }
    }
    
    async startPeakHourWarming() {
        setInterval(async () => {
            const hour = new Date().getHours();
            
            // Peak hours
            if ((hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 20)) {
                await this.performPeakHourWarming();
            }
        }, 15 * 60 * 1000); // Every 15 minutes during peak
    }
    
    async performPeakHourWarming() {
        // Warm most popular queries based on recent access patterns
        const recentQueries = await this.cache.l2.redis.zrevrange(
            'recent:queries',
            0,
            10,
            'WITHSCORES'
        );
        
        for (let i = 0; i < recentQueries.length; i += 2) {
            const queryKey = recentQueries[i];
            const score = recentQueries[i + 1];
            
            // Parse query parameters from key
            const params = this.parseQueryKey(queryKey);
            if (params) {
                await this.cache.getGamesNearby(
                    params.lat,
                    params.lng,
                    params.radius,
                    params.filters
                );
            }
        }
    }
    
    parseQueryKey(key) {
        // Parse stored query keys back to parameters
        try {
            const parts = key.split(':');
            return {
                lat: parseFloat(parts[2]),
                lng: parseFloat(parts[3]),
                radius: parseInt(parts[4]),
                filters: parts[5] ? JSON.parse(parts[5]) : {}
            };
        } catch (e) {
            return null;
        }
    }
}

module.exports = CacheWarmer;
```

## 5. Integration Example

```javascript
// server.js
const express = require('express');
const CacheManager = require('./cache/cache-manager');
const CacheWarmer = require('./cache/cache-warmer');

const app = express();

// Initialize cache system
const cacheManager = new CacheManager({
    memory: {
        maxSize: 50 * 1024 * 1024, // 50MB
        defaultTTL: 60 * 1000       // 1 minute
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        prefix: 'sports:'
    },
    database: pgPool // PostgreSQL connection pool
});

// Initialize cache warming
const cacheWarmer = new CacheWarmer(cacheManager, pgPool);
cacheWarmer.initialize();

// API endpoint with caching
app.get('/api/games/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 10000 } = req.query;
        const filters = {
            sport: req.query.sport,
            date: req.query.date,
            indoor: req.query.indoor === 'true'
        };
        
        // Remove undefined filters
        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined) delete filters[key];
        });
        
        const games = await cacheManager.getGamesNearby(
            parseFloat(lat),
            parseFloat(lng),
            parseInt(radius),
            filters
        );
        
        res.json({
            success: true,
            count: games.length,
            games
        });
    } catch (error) {
        console.error('Error fetching nearby games:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch games'
        });
    }
});

// Cache statistics endpoint
app.get('/api/cache/stats', async (req, res) => {
    const stats = await cacheManager.getStats();
    res.json(stats);
});

// Cache invalidation endpoint (admin only)
app.post('/api/cache/invalidate', authenticate, async (req, res) => {
    const { type, params } = req.body;
    await cacheManager.invalidate(type, params);
    res.json({ success: true });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
    console.log('Cache system initialized');
});
```

## Performance Benchmarks

Expected response times with this implementation:

| Cache Level | Response Time | Hit Rate Target |
|-------------|--------------|-----------------|
| L1 Memory   | 1-10ms       | 30-40%         |
| L2 Redis    | 10-30ms      | 40-50%         |
| L3 Database | 50-200ms     | 10-20%         |

**Overall target: 80-90% of requests served in under 50ms**

## Monitoring and Alerts

```javascript
// Set up monitoring alerts
const monitoring = {
    // Alert if cache hit rate drops below 70%
    cacheHitRate: {
        threshold: 0.7,
        check: () => cacheManager.getStats().summary.overallCacheHitRate
    },
    
    // Alert if L1 memory usage exceeds 80%
    memoryUsage: {
        threshold: 0.8,
        check: () => cacheManager.l1.cache.length / cacheManager.l1.cache.max
    },
    
    // Alert if Redis latency exceeds 50ms
    redisLatency: {
        threshold: 50,
        check: async () => {
            const start = Date.now();
            await cacheManager.l2.redis.ping();
            return Date.now() - start;
        }
    }
};
```

This caching implementation provides the foundation for achieving sub-100ms response times for location-based queries while maintaining data freshness and system efficiency.