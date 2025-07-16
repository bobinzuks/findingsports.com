# Data Architecture Design

## Overview

The Finding Sports platform uses a sophisticated multi-tier architecture optimized for geospatial queries and high-performance data retrieval. The system prioritizes **SPEED** and **SIMPLICITY** while handling 1000+ venues with multiple daily games.

## Database Design

### Technology Choice: PostgreSQL with PostGIS

**Why PostgreSQL + PostGIS:**
- Industry-standard geospatial support
- Efficient spatial indexing (GIST)
- Time-based partitioning for automatic data expiry
- ACID compliance for data integrity
- Excellent query optimizer

### Schema Design

#### Venues Table
```sql
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    location GEOGRAPHY(POINT, 4326) NOT NULL,  -- PostGIS geography type
    geohash VARCHAR(12) NOT NULL,              -- For grid-based filtering
    type VARCHAR(50),                          -- gym, park, arena, etc.
    source VARCHAR(50) NOT NULL,               -- google_places, scraper, user
    source_id VARCHAR(255),                    -- External ID
    metadata JSONB DEFAULT '{}',               -- Flexible additional data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_source_venue UNIQUE(source, source_id)
);
```

#### Games Table (Partitioned)
```sql
CREATE TABLE games (
    id UUID DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    sport VARCHAR(50) NOT NULL,
    game_type VARCHAR(50) NOT NULL DEFAULT 'drop-in',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    capacity INTEGER,
    current_players INTEGER DEFAULT 0,
    skill_level VARCHAR(50),
    price DECIMAL(10,2),
    source VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, start_time)
) PARTITION BY RANGE (start_time);
```

### Partitioning Strategy

**Time-Based Partitioning:**
- Daily partitions for games
- Automatic creation of next 7 days
- Automatic cleanup of partitions older than 7 days
- Zero-downtime partition management

```sql
-- Example partition
CREATE TABLE games_2024_01_15 
PARTITION OF games 
FOR VALUES FROM ('2024-01-15') TO ('2024-01-16');
```

### Indexing Strategy

#### Primary Indexes
```sql
-- Spatial index for location queries
CREATE INDEX idx_venues_location ON venues USING GIST(location);

-- Geohash prefix index for grid filtering
CREATE INDEX idx_venues_geohash ON venues(geohash);

-- Composite index for time-based queries
CREATE INDEX idx_games_venue_time ON games(venue_id, start_time);

-- Sport filtering
CREATE INDEX idx_games_sport ON games(sport);
```

#### Covering Index for Performance
```sql
-- Eliminates table lookups for common queries
CREATE INDEX idx_games_covering 
ON games (start_time, venue_id, sport, game_type) 
INCLUDE (end_time, capacity, current_players, skill_level, price);
```

## Geospatial Query Optimization

### Geohash-Based Filtering

**Why Geohash?**
- Converts lat/lng to hierarchical grid system
- Enables prefix-based filtering
- Reduces search space before distance calculation

**Implementation:**
```javascript
// Generate geohash with appropriate precision
const precision = Math.min(6, Math.max(3, 12 - Math.log2(radiusKm)));
const hash = geohash.encode(lat, lng, precision);

// Query uses prefix matching
WHERE geohash LIKE 'dpz8' || '%'  -- Covers ~5km area
```

### Two-Stage Location Query

1. **Grid Filter** (Fast):
   - Use geohash prefix to eliminate distant venues
   - B-tree index on varchar field

2. **Distance Filter** (Accurate):
   - PostGIS ST_DWithin for precise distance
   - GIST spatial index

```sql
WITH nearby_venues AS (
    SELECT * FROM venues
    WHERE geohash LIKE $1 || '%'              -- Stage 1: Grid filter
    AND ST_DWithin(                           -- Stage 2: Distance filter
        location::geography,
        ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
        $4  -- radius in meters
    )
)
```

## Caching Architecture

### Three-Level Cache Design

#### L1: In-Memory LRU Cache
- **Technology**: Node.js LRU-Cache
- **Size**: 1000 entries
- **TTL**: 60 seconds
- **Hit Latency**: 1-10ms
- **Use Case**: Hot data, repeated queries

#### L2: Redis Cache
- **Technology**: Redis with MessagePack
- **TTL**: Dynamic (5 min - 24 hours)
- **Hit Latency**: 10-30ms
- **Use Case**: Shared cache across instances

#### L3: PostgreSQL
- **Hit Latency**: 50-200ms
- **Optimized with indexes and partitioning

### Cache Key Strategy

```javascript
// Location-based cache key with variable precision
`search:${geohash}:${radius}:${sport}:${gameType}`

// Examples:
"search:dpz8b:10:basketball:drop-in"
"search:dpz8:20:all:all"
```

### Dynamic TTL Strategy

```javascript
function getTTL(game) {
    const hoursUntilGame = (game.startTime - Date.now()) / 3600000;
    
    if (hoursUntilGame <= 0) return 300;      // 5 min - Active game
    if (hoursUntilGame <= 24) return 1800;    // 30 min - Today
    return 7200;                               // 2 hours - Future
}
```

## Data Retention Strategy

### Automatic Cleanup

1. **Partition Drop**:
   - Daily cron job drops partitions > 7 days old
   - No row-by-row deletion needed
   - Near-instant cleanup

2. **Venue Retention**:
   - Venues kept indefinitely
   - Updated metadata on each sync

3. **User Games**:
   - Archived after 30 days
   - Aggregated statistics retained

### Archive Strategy

```sql
-- Move old user games to archive
INSERT INTO user_games_archive 
SELECT * FROM user_games 
WHERE created_at < NOW() - INTERVAL '30 days';
```

## Query Performance Targets

### Location Search Query
```sql
-- Target: <100ms for 10km radius with 1000 venues
EXPLAIN ANALYZE
WITH nearby_venues AS (
    SELECT v.*, 
           ST_Distance(v.location, ST_MakePoint(-79.3832, 43.6532)) as distance
    FROM venues v
    WHERE v.geohash LIKE 'dpz8%'
    AND ST_DWithin(v.location, ST_MakePoint(-79.3832, 43.6532), 10000)
)
SELECT g.*, nv.name, nv.distance
FROM games g
JOIN nearby_venues nv ON g.venue_id = nv.id
WHERE g.start_time >= NOW()
AND g.start_time <= NOW() + INTERVAL '7 days'
ORDER BY g.start_time, nv.distance
LIMIT 100;
```

**Expected Performance:**
- Index Scan on geohash: ~5ms
- Spatial filter: ~20ms
- Join and sort: ~30ms
- Total: ~55ms (before caching)

## Scalability Considerations

### Horizontal Scaling Ready

1. **Read Replicas**:
   - Cache handles read distribution
   - Database replicas for failover

2. **Geographic Sharding** (Future):
   - Shard by geohash prefix
   - Regional database instances

3. **Time-Based Sharding**:
   - Already implemented via partitioning
   - Easy to distribute old partitions

### Performance at Scale

**Current Design Handles:**
- 1000+ venues
- 10,000+ games/day
- 100,000+ queries/day
- Sub-100ms response time

**Future Scale (with sharding):**
- 100,000+ venues
- 1M+ games/day
- 10M+ queries/day