# Database Quick Reference Guide

## PostgreSQL + PostGIS Setup

### 1. Initial Setup Commands

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set optimal configuration for sports data
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET random_page_cost = 1.1;  -- For SSD storage
```

### 2. Essential Queries for Location-Based Search

#### Find Games Within Radius (Optimized)
```sql
-- Most efficient query for nearby games
WITH nearby_venues AS (
    SELECT 
        v.id,
        v.name,
        v.location,
        ST_Distance(v.location, ST_MakePoint($1, $2)::geography) as distance
    FROM venues v
    WHERE 
        -- Use geohash prefix for initial filtering (very fast)
        v.geohash LIKE substring(ST_GeoHash(ST_MakePoint($1, $2)::geometry, 12), 1, 5) || '%'
        -- Then apply actual distance filter
        AND ST_DWithin(v.location, ST_MakePoint($1, $2)::geography, $3)
    ORDER BY distance
    LIMIT 50
)
SELECT 
    g.*,
    nv.name as venue_name,
    nv.distance,
    nv.distance / 1000.0 as distance_km
FROM games_today g  -- Use partitioned table
JOIN nearby_venues nv ON g.venue_id = nv.id
WHERE g.status = 'upcoming'
ORDER BY g.start_time, nv.distance;

-- Parameters: $1 = longitude, $2 = latitude, $3 = radius in meters
```

#### Get Venue Geohash (for caching)
```sql
-- Generate geohash for a location
SELECT ST_GeoHash(ST_MakePoint(-123.1207, 49.2827)::geometry, 7) as geohash;
-- Result: "c2b2qeb" (7 character precision ≈ 150m)
```

### 3. Partition Management

#### Auto-create Daily Partitions
```sql
CREATE OR REPLACE FUNCTION create_daily_game_partitions()
RETURNS void AS $$
DECLARE
    partition_date date;
    partition_name text;
BEGIN
    -- Create partitions for next 7 days
    FOR i IN 0..6 LOOP
        partition_date := CURRENT_DATE + i;
        partition_name := 'games_' || TO_CHAR(partition_date, 'YYYY_MM_DD');
        
        -- Create partition if not exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables WHERE tablename = partition_name
        ) THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF games 
                FOR VALUES FROM (%L) TO (%L)',
                partition_name, 
                partition_date, 
                partition_date + INTERVAL '1 day'
            );
            
            -- Create indexes
            EXECUTE format(
                'CREATE INDEX %I ON %I (venue_id, start_time) WHERE status = %L',
                'idx_' || partition_name || '_upcoming',
                partition_name,
                'upcoming'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule to run daily at midnight
SELECT cron.schedule('create-partitions', '0 0 * * *', 'SELECT create_daily_game_partitions()');
```

### 4. Performance Views

#### Create Performance Monitoring View
```sql
CREATE VIEW query_performance_stats AS
SELECT 
    substring(query, 1, 50) as query_preview,
    calls,
    round(mean_exec_time::numeric, 2) as avg_ms,
    round(min_exec_time::numeric, 2) as min_ms,
    round(max_exec_time::numeric, 2) as max_ms,
    round(total_exec_time::numeric / 1000, 2) as total_sec
FROM pg_stat_statements
WHERE query LIKE '%games%' OR query LIKE '%venues%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 5. Quick Performance Checks

```sql
-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT 
    relname as table_name,
    pg_size_pretty(pg_total_relation_size(relid)) as total_size,
    pg_size_pretty(pg_relation_size(relid)) as table_size,
    pg_size_pretty(pg_indexes_size(relid)) as indexes_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Check cache hit ratios
SELECT 
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit) as heap_hit,
    round(sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read))::numeric, 4) as cache_hit_ratio
FROM pg_statio_user_tables;
```

### 6. Geospatial Index Optimization

```sql
-- Create covering index for location queries
CREATE INDEX idx_venues_location_covering ON venues 
    USING GIST(location) 
    INCLUDE (name, venue_type, amenities);

-- Create partial indexes for common filters
CREATE INDEX idx_games_basketball_upcoming ON games(venue_id, start_time)
    WHERE sport_type = 'basketball' AND status = 'upcoming';

CREATE INDEX idx_games_indoor_upcoming ON games(venue_id, start_time)
    WHERE is_indoor = true AND status = 'upcoming';

-- Cluster venues table by location for better spatial locality
CLUSTER venues USING idx_venues_location_gist;
```

### 7. Common Maintenance Tasks

```sql
-- Update venue statistics (run nightly)
REFRESH MATERIALIZED VIEW CONCURRENTLY venue_stats;

-- Vacuum and analyze tables (run after bulk updates)
VACUUM ANALYZE venues;
VACUUM ANALYZE games;

-- Reindex for optimal performance (run weekly during low traffic)
REINDEX INDEX CONCURRENTLY idx_venues_location_gist;
REINDEX INDEX CONCURRENTLY idx_games_venue_start_time;
```

### 8. Redis Integration Queries

```sql
-- Get data for Redis cache warming
SELECT 
    v.id,
    v.latitude,
    v.longitude,
    ST_GeoHash(v.location::geometry, 6) as geohash,
    COUNT(g.id) as upcoming_games
FROM venues v
LEFT JOIN games g ON v.id = g.venue_id 
    AND g.start_time >= NOW() 
    AND g.start_time <= NOW() + INTERVAL '1 day'
GROUP BY v.id
HAVING COUNT(g.id) > 0
ORDER BY upcoming_games DESC
LIMIT 100;
```

### 9. Data Expiry Queries

```sql
-- Archive old games (run daily)
WITH archived AS (
    INSERT INTO games_archive
    SELECT * FROM games
    WHERE end_time < NOW() - INTERVAL '7 days'
    RETURNING id
)
DELETE FROM games WHERE id IN (SELECT id FROM archived);

-- Clean up old partitions
DO $$
DECLARE
    partition record;
BEGIN
    FOR partition IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'games_20%'
        AND tablename < 'games_' || TO_CHAR(CURRENT_DATE - INTERVAL '7 days', 'YYYY_MM_DD')
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', partition.tablename);
    END LOOP;
END $$;
```

### 10. Emergency Performance Fixes

```sql
-- If queries are slow, update statistics
ANALYZE venues;
ANALYZE games;

-- Reset query statistics
SELECT pg_stat_statements_reset();

-- Force use of spatial index
SET enable_seqscan = off;
-- Run your query
SET enable_seqscan = on;

-- Check for missing indexes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.1
ORDER BY n_distinct DESC;
```

## Quick Connection String Examples

```bash
# PostgreSQL with PostGIS
postgresql://user:password@localhost:5432/sports_db?sslmode=require

# Redis
redis://localhost:6379/0

# Connection pooling config
PGPOOL_MIN=5
PGPOOL_MAX=20
PGPOOL_IDLE_TIMEOUT=30000
```

## Performance Benchmarks to Aim For

| Query Type | Target Time | Optimization |
|------------|-------------|--------------|
| Location search (10km) | < 50ms | Geohash + GIST index |
| Venue details | < 10ms | Covering index |
| Game list by venue | < 20ms | Composite index |
| Popular venues | < 5ms | Materialized view |
| Game count by sport | < 30ms | Partial indexes |

This quick reference provides the essential queries and configurations needed to maintain sub-100ms response times for your sports game location queries.