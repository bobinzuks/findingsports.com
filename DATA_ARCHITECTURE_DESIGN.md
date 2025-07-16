# Sports Game Data Architecture Design

## Executive Summary

This document outlines an efficient, scalable storage system for sports game data that prioritizes **speed** and **simplicity**. The architecture supports geospatial queries, automatic data expiry, sub-100ms response times, and scalability for 1000+ venues.

## Core Requirements Recap

1. **Geospatial Queries**: 10km radius searches (adjustable)
2. **Data Expiry**: Automatic cleanup as game dates pass
3. **Caching**: Sub-100ms response times for location queries
4. **Scalability**: Handle 1000+ venues with multiple daily games

## Architecture Overview

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   API Gateway       │────▶│   Redis Cache    │────▶│  PostgreSQL +   │
│  (Location Query)   │     │  (Hot Data)      │     │    PostGIS      │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
         │                           │                         │
         │                           ▼                         ▼
         │                   ┌──────────────────┐     ┌─────────────────┐
         └──────────────────▶│  Location Index  │     │   Time-Series   │
                            │   (Geohash)      │     │   Partitions    │
                            └──────────────────┘     └─────────────────┘
```

## 1. Primary Database Schema (PostgreSQL with PostGIS)

### 1.1 Core Tables

```sql
-- Enhanced venues table with geospatial indexing
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(50) NOT NULL,
    postal_code VARCHAR(10),
    
    -- PostGIS geography type for accurate distance calculations
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    
    -- Denormalized coordinates for quick access
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    
    -- Geohash for grid-based queries
    geohash VARCHAR(12) GENERATED ALWAYS AS (
        ST_GeoHash(location::geometry, 12)
    ) STORED,
    
    -- Metadata
    amenities TEXT[] DEFAULT '{}',
    venue_type VARCHAR(50) NOT NULL,
    source_url TEXT,
    popularity_score INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table with partitioning support
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    
    -- Sport and game details
    sport_type VARCHAR(50) NOT NULL,
    game_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Time information (crucial for partitioning)
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Game status for quick filtering
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (
        status IN ('upcoming', 'active', 'completed', 'cancelled')
    ),
    
    -- Capacity and pricing
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    price DECIMAL(10, 2),
    
    -- Additional metadata
    is_indoor BOOLEAN DEFAULT false,
    skill_level VARCHAR(50),
    organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    source_url TEXT,
    
    -- Cache control
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (start_time);

-- Create partitions for efficient time-based queries
CREATE TABLE games_past PARTITION OF games
    FOR VALUES FROM (MINVALUE) TO (CURRENT_DATE);

CREATE TABLE games_today PARTITION OF games
    FOR VALUES FROM (CURRENT_DATE) TO (CURRENT_DATE + INTERVAL '1 day');

CREATE TABLE games_tomorrow PARTITION OF games
    FOR VALUES FROM (CURRENT_DATE + INTERVAL '1 day') TO (CURRENT_DATE + INTERVAL '2 days');

CREATE TABLE games_this_week PARTITION OF games
    FOR VALUES FROM (CURRENT_DATE + INTERVAL '2 days') TO (CURRENT_DATE + INTERVAL '7 days');

CREATE TABLE games_next_week PARTITION OF games
    FOR VALUES FROM (CURRENT_DATE + INTERVAL '7 days') TO (CURRENT_DATE + INTERVAL '14 days');

CREATE TABLE games_future PARTITION OF games
    FOR VALUES FROM (CURRENT_DATE + INTERVAL '14 days') TO (MAXVALUE);
```

### 1.2 Optimized Indexes

```sql
-- Spatial indexes for location queries
CREATE INDEX idx_venues_location_gist ON venues USING GIST(location);
CREATE INDEX idx_venues_geohash ON venues(geohash);
CREATE INDEX idx_venues_geohash_prefix ON venues(substring(geohash, 1, 6));

-- Composite indexes for common queries
CREATE INDEX idx_games_venue_start_time ON games(venue_id, start_time, status);
CREATE INDEX idx_games_sport_start_time ON games(sport_type, start_time, status);
CREATE INDEX idx_games_status_start_time ON games(status, start_time);

-- Partial indexes for active games
CREATE INDEX idx_games_upcoming ON games(start_time, venue_id) 
    WHERE status = 'upcoming' AND start_time >= NOW();

CREATE INDEX idx_games_today ON games(venue_id, start_time) 
    WHERE start_time >= CURRENT_DATE 
    AND start_time < CURRENT_DATE + INTERVAL '1 day';
```

### 1.3 Materialized Views for Performance

```sql
-- Venue popularity and game count
CREATE MATERIALIZED VIEW venue_stats AS
SELECT 
    v.id,
    v.name,
    v.location,
    v.geohash,
    COUNT(DISTINCT g.id) as total_games,
    COUNT(DISTINCT g.id) FILTER (WHERE g.start_time >= NOW()) as upcoming_games,
    COUNT(DISTINCT g.sport_type) as sport_variety,
    AVG(g.current_attendees::float / NULLIF(g.max_attendees, 0)) as avg_fill_rate
FROM venues v
LEFT JOIN games g ON v.id = g.venue_id
GROUP BY v.id, v.name, v.location, v.geohash;

CREATE INDEX idx_venue_stats_geohash ON venue_stats(geohash);
CREATE INDEX idx_venue_stats_upcoming ON venue_stats(upcoming_games DESC);

-- Refresh every hour
CREATE OR REPLACE FUNCTION refresh_venue_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY venue_stats;
END;
$$ LANGUAGE plpgsql;
```

## 2. Redis Caching Layer Structure

### 2.1 Cache Key Design

```javascript
// Key patterns for different cache types
const CACHE_KEYS = {
    // Location-based queries (TTL: 5 minutes)
    LOCATION_GAMES: 'loc:games:{geohash}:{radius}:{filters}',
    LOCATION_VENUES: 'loc:venues:{geohash}:{radius}',
    
    // Venue-specific data (TTL: 30 minutes)
    VENUE_DETAILS: 'venue:{venue_id}',
    VENUE_GAMES: 'venue:games:{venue_id}:{date}',
    
    // Game data (TTL: varies by status)
    GAME_DETAILS: 'game:{game_id}',
    GAMES_BY_SPORT: 'games:sport:{sport}:{date}',
    
    // Hot data (TTL: 1 minute)
    TRENDING_GAMES: 'trending:games:{city}',
    POPULAR_VENUES: 'popular:venues:{city}',
    
    // User-specific (TTL: 10 minutes)
    USER_NEARBY: 'user:nearby:{user_id}:{lat}:{lng}',
    USER_FAVORITES: 'user:favorites:{user_id}'
};
```

### 2.2 Redis Data Structures

```javascript
// Geospatial index for venues
GEOADD venues_geo <longitude> <latitude> <venue_id>

// Sorted sets for time-based queries
ZADD games:upcoming <timestamp> <game_id>
ZADD games:by_venue:{venue_id} <timestamp> <game_id>

// Hash for venue details
HSET venue:{venue_id} 
    name "Recreation Center"
    address "123 Main St"
    lat "49.2827"
    lng "-123.1207"
    games_today "5"
    
// Bitmap for feature flags
SETBIT venue:features:{venue_id} <feature_id> 1

// HyperLogLog for unique visitor counting
PFADD venue:visitors:{venue_id}:{date} <user_id>
```

### 2.3 Cache Warming Strategy

```javascript
class CacheWarmer {
    async warmLocationCaches() {
        // Pre-cache popular city centers
        const popularLocations = [
            { lat: 49.2827, lng: -123.1207, city: 'Vancouver' },
            { lat: 49.2488, lng: -122.9805, city: 'Burnaby' },
            { lat: 49.1666, lng: -123.1336, city: 'Richmond' }
        ];
        
        for (const loc of popularLocations) {
            // Cache 5km and 10km radius queries
            await this.cacheLocationGames(loc, [5000, 10000]);
        }
    }
    
    async cacheLocationGames(location, radii) {
        for (const radius of radii) {
            const geohash = this.getGeohash(location, radius);
            const games = await this.queryGamesInRadius(location, radius);
            
            const cacheKey = `loc:games:${geohash}:${radius}`;
            await redis.setex(cacheKey, 300, JSON.stringify(games)); // 5 min TTL
        }
    }
}
```

## 3. TTL Strategy for Game Data

### 3.1 Dynamic TTL Based on Game Status

```javascript
function calculateTTL(game) {
    const now = new Date();
    const startTime = new Date(game.start_time);
    const endTime = new Date(game.end_time);
    
    // Past games: 1 hour TTL (for historical queries)
    if (endTime < now) {
        return 3600;
    }
    
    // Currently active games: 1 minute TTL
    if (startTime <= now && endTime >= now) {
        return 60;
    }
    
    // Games starting within 1 hour: 5 minute TTL
    const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);
    if (hoursUntilStart <= 1) {
        return 300;
    }
    
    // Games today: 15 minute TTL
    if (startTime.toDateString() === now.toDateString()) {
        return 900;
    }
    
    // Games this week: 1 hour TTL
    const daysUntilStart = hoursUntilStart / 24;
    if (daysUntilStart <= 7) {
        return 3600;
    }
    
    // Future games: 6 hour TTL
    return 21600;
}
```

### 3.2 Automatic Cleanup Strategy

```sql
-- Function to move expired games to archive
CREATE OR REPLACE FUNCTION archive_expired_games()
RETURNS void AS $$
BEGIN
    -- Move completed games older than 24 hours to archive
    INSERT INTO games_archive
    SELECT * FROM games 
    WHERE end_time < NOW() - INTERVAL '24 hours'
    AND status = 'completed';
    
    -- Delete from main table
    DELETE FROM games 
    WHERE end_time < NOW() - INTERVAL '24 hours'
    AND status = 'completed';
    
    -- Update game status
    UPDATE games 
    SET status = 'completed'
    WHERE end_time < NOW() 
    AND status IN ('upcoming', 'active');
END;
$$ LANGUAGE plpgsql;

-- Schedule hourly cleanup
SELECT cron.schedule('cleanup-games', '0 * * * *', 'SELECT archive_expired_games()');
```

## 4. Query Optimization for Location-Based Searches

### 4.1 Geohash-Based Query Strategy

```javascript
class LocationQueryOptimizer {
    async findGamesNearby(lat, lng, radiusKm, filters = {}) {
        // Step 1: Check Redis cache
        const geohash = geohashEncode(lat, lng, this.getPrecision(radiusKm));
        const cacheKey = `loc:games:${geohash}:${radiusKm}:${JSON.stringify(filters)}`;
        
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
        
        // Step 2: Use geohash prefix for initial filtering
        const geohashPrefixLength = this.getGeohashPrefixLength(radiusKm);
        const geohashPrefix = geohash.substring(0, geohashPrefixLength);
        
        // Step 3: Query with optimized SQL
        const query = `
            WITH nearby_venues AS (
                SELECT 
                    v.id,
                    v.name,
                    v.location,
                    ST_Distance(v.location, ST_MakePoint($1, $2)::geography) as distance
                FROM venues v
                WHERE 
                    v.geohash LIKE $3 || '%'
                    AND ST_DWithin(
                        v.location,
                        ST_MakePoint($1, $2)::geography,
                        $4
                    )
                ORDER BY distance
                LIMIT 100
            )
            SELECT 
                g.*,
                nv.name as venue_name,
                nv.distance,
                row_to_json(nv.*) as venue
            FROM games g
            JOIN nearby_venues nv ON g.venue_id = nv.id
            WHERE 
                g.start_time >= NOW()
                AND g.start_time <= NOW() + INTERVAL '7 days'
                AND g.status = 'upcoming'
                ${filters.sport ? 'AND g.sport_type = $5' : ''}
            ORDER BY g.start_time, nv.distance
            LIMIT 50
        `;
        
        const params = [lng, lat, geohashPrefix, radiusKm * 1000];
        if (filters.sport) params.push(filters.sport);
        
        const result = await db.query(query, params);
        
        // Step 4: Cache results
        await redis.setex(cacheKey, 300, JSON.stringify(result.rows));
        
        return result.rows;
    }
    
    getGeohashPrefixLength(radiusKm) {
        // Optimize geohash precision based on search radius
        if (radiusKm <= 1) return 7;      // ~150m precision
        if (radiusKm <= 5) return 6;      // ~1.2km precision
        if (radiusKm <= 10) return 5;     // ~4.9km precision
        if (radiusKm <= 20) return 4;     // ~39km precision
        return 3;                          // ~156km precision
    }
}
```

### 4.2 Multi-Level Caching Strategy

```javascript
class MultiLevelCache {
    constructor() {
        this.l1Cache = new Map(); // In-memory cache (10MB limit)
        this.l2Cache = redis;      // Redis cache
        this.l3Cache = postgres;   // Database
    }
    
    async get(key, fetcher) {
        // L1: In-memory cache (fastest)
        if (this.l1Cache.has(key)) {
            const cached = this.l1Cache.get(key);
            if (cached.expiry > Date.now()) {
                return cached.data;
            }
            this.l1Cache.delete(key);
        }
        
        // L2: Redis cache
        const redisData = await this.l2Cache.get(key);
        if (redisData) {
            const data = JSON.parse(redisData);
            this.setL1(key, data, 60); // 1 minute L1 cache
            return data;
        }
        
        // L3: Database fetch
        const data = await fetcher();
        
        // Populate caches
        const ttl = this.calculateTTL(data);
        await this.l2Cache.setex(key, ttl, JSON.stringify(data));
        this.setL1(key, data, Math.min(ttl, 300));
        
        return data;
    }
    
    setL1(key, data, ttlSeconds) {
        // Implement simple LRU if size limit exceeded
        if (this.l1Cache.size > 1000) {
            const firstKey = this.l1Cache.keys().next().value;
            this.l1Cache.delete(firstKey);
        }
        
        this.l1Cache.set(key, {
            data,
            expiry: Date.now() + (ttlSeconds * 1000)
        });
    }
}
```

## 5. Data Partitioning Strategy

### 5.1 Time-Based Partitioning

```sql
-- Automated partition management
CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS void AS $$
DECLARE
    start_date date;
    end_date date;
    partition_name text;
BEGIN
    -- Create partitions for next 3 months
    FOR i IN 0..2 LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE + (i || ' months')::interval);
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'games_' || TO_CHAR(start_date, 'YYYY_MM');
        
        -- Check if partition exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = partition_name
        ) THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF games 
                FOR VALUES FROM (%L) TO (%L)',
                partition_name, start_date, end_date
            );
            
            -- Create indexes on partition
            EXECUTE format(
                'CREATE INDEX %I ON %I (venue_id, start_time)',
                'idx_' || partition_name || '_venue_time',
                partition_name
            );
        END IF;
    END LOOP;
    
    -- Drop old partitions (older than 3 months)
    FOR partition_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'games_20%'
        AND tablename < 'games_' || TO_CHAR(CURRENT_DATE - INTERVAL '3 months', 'YYYY_MM')
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I', partition_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly
SELECT cron.schedule('partition-maintenance', '0 0 1 * *', 'SELECT create_monthly_partitions()');
```

### 5.2 Geographic Sharding (for extreme scale)

```javascript
class GeographicShardRouter {
    constructor() {
        this.shards = {
            'west': { // British Columbia
                bounds: { minLat: 48.0, maxLat: 60.0, minLng: -139.0, maxLng: -114.0 },
                connection: pgWest
            },
            'central': { // Alberta, Saskatchewan, Manitoba
                bounds: { minLat: 49.0, maxLat: 60.0, minLng: -114.0, maxLng: -95.0 },
                connection: pgCentral
            },
            'east': { // Ontario, Quebec, Maritimes
                bounds: { minLat: 41.0, maxLat: 55.0, minLng: -95.0, maxLng: -52.0 },
                connection: pgEast
            }
        };
    }
    
    getShardForLocation(lat, lng) {
        for (const [name, shard] of Object.entries(this.shards)) {
            const { bounds } = shard;
            if (lat >= bounds.minLat && lat <= bounds.maxLat &&
                lng >= bounds.minLng && lng <= bounds.maxLng) {
                return shard;
            }
        }
        return this.shards.west; // Default
    }
    
    async query(lat, lng, radius, query, params) {
        const shard = this.getShardForLocation(lat, lng);
        
        // For cross-shard queries (rare), query multiple shards
        if (this.crossesShardBoundary(lat, lng, radius)) {
            return this.queryCrossShards(lat, lng, radius, query, params);
        }
        
        return shard.connection.query(query, params);
    }
}
```

## 6. Backup and Recovery Approach

### 6.1 Continuous Backup Strategy

```bash
#!/bin/bash
# backup-strategy.sh

# 1. Continuous WAL archiving
archive_command = 'test ! -f /backup/wal/%f && cp %p /backup/wal/%f'

# 2. Daily base backups
pg_basebackup -D /backup/base/$(date +%Y%m%d) -Ft -z -P

# 3. Redis persistence
# AOF for durability
appendonly yes
appendfsync everysec

# RDB snapshots
save 900 1      # After 900 sec if at least 1 key changed
save 300 10     # After 300 sec if at least 10 keys changed
save 60 10000   # After 60 sec if at least 10000 keys changed
```

### 6.2 Point-in-Time Recovery

```sql
-- Recovery procedure
CREATE OR REPLACE FUNCTION restore_to_point_in_time(target_time timestamptz)
RETURNS void AS $$
BEGIN
    -- 1. Stop application
    -- 2. Restore base backup
    -- 3. Apply WAL logs up to target_time
    -- 4. Validate data integrity
    -- 5. Rebuild Redis cache from PostgreSQL
END;
$$ LANGUAGE plpgsql;
```

## 7. Performance Monitoring

### 7.1 Key Metrics

```sql
-- Query performance view
CREATE VIEW query_performance AS
SELECT 
    query,
    calls,
    mean_exec_time,
    total_exec_time,
    min_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%games%' OR query LIKE '%venues%'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Cache hit ratio
CREATE VIEW cache_metrics AS
SELECT 
    'L1 Memory' as cache_level,
    l1_hits::float / (l1_hits + l1_misses) as hit_ratio
FROM cache_stats
UNION ALL
SELECT 
    'L2 Redis' as cache_level,
    l2_hits::float / (l2_hits + l2_misses) as hit_ratio
FROM cache_stats;
```

## 8. Implementation Priorities

### Phase 1: Core Infrastructure (Week 1)
1. Set up PostgreSQL with PostGIS
2. Implement basic Redis caching
3. Create venue and game tables with indexes
4. Implement location-based queries

### Phase 2: Performance Optimization (Week 2)
1. Add materialized views
2. Implement intelligent caching
3. Set up time-based partitioning
4. Add query optimization

### Phase 3: Scalability Features (Week 3)
1. Implement multi-level caching
2. Add automatic cleanup jobs
3. Set up monitoring and metrics
4. Performance testing and tuning

## Conclusion

This architecture provides:
- **Sub-100ms response times** through multi-level caching
- **Efficient geospatial queries** using PostGIS and geohashing
- **Automatic data cleanup** via partitioning and scheduled jobs
- **Linear scalability** to handle 1000+ venues
- **Simple implementation** using proven technologies

The design prioritizes speed and simplicity while maintaining flexibility for future enhancements.