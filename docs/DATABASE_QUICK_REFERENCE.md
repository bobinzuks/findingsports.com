# Database Quick Reference

## Essential Queries

### Find Games Near Location
```sql
-- Optimized query with geohash prefix filtering
WITH nearby_venues AS (
    SELECT 
        v.*,
        ST_Distance(
            v.location::geography,
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
        ) as distance_meters
    FROM venues v
    WHERE 
        v.geohash LIKE :geohash_prefix || '%'
        AND ST_DWithin(
            v.location::geography,
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
            :radius_meters
        )
)
SELECT 
    g.*,
    nv.name as venue_name,
    nv.address as venue_address,
    nv.distance_meters,
    ST_X(nv.location::geometry) as longitude,
    ST_Y(nv.location::geometry) as latitude
FROM games g
JOIN nearby_venues nv ON g.venue_id = nv.id
WHERE 
    g.start_time >= NOW()
    AND g.start_time <= NOW() + INTERVAL '7 days'
    AND (:sport IS NULL OR g.sport = :sport)
    AND (:game_type IS NULL OR g.game_type = :game_type)
ORDER BY g.start_time, nv.distance_meters
LIMIT 100;
```

### Add New Venue
```sql
INSERT INTO venues (
    name, address, location, geohash, type, source, source_id, metadata
) VALUES (
    :name,
    :address,
    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
    :geohash,
    :type,
    :source,
    :source_id,
    :metadata::jsonb
)
ON CONFLICT (source, source_id) 
DO UPDATE SET 
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    location = EXCLUDED.location,
    geohash = EXCLUDED.geohash,
    metadata = EXCLUDED.metadata,
    updated_at = CURRENT_TIMESTAMP
RETURNING *;
```

### Get Popular Venues
```sql
-- Venues with most upcoming games
SELECT 
    v.*,
    COUNT(g.id) as game_count,
    array_agg(DISTINCT g.sport) as sports_offered
FROM venues v
JOIN games g ON g.venue_id = v.id
WHERE g.start_time >= NOW()
GROUP BY v.id
ORDER BY game_count DESC
LIMIT 20;
```

## Partition Management

### Create Daily Partitions
```sql
DO $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
BEGIN
    FOR i IN 0..7 LOOP
        partition_date := CURRENT_DATE + i;
        partition_name := 'games_' || to_char(partition_date, 'YYYY_MM_DD');
        
        -- Check if partition exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = partition_name
        ) THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF games 
                FOR VALUES FROM (%L) TO (%L)',
                partition_name, 
                partition_date, 
                partition_date + 1
            );
        END IF;
    END LOOP;
END $$;
```

### Drop Old Partitions
```sql
DO $$
DECLARE
    partition_record RECORD;
BEGIN
    FOR partition_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'games_%'
        AND tablename < 'games_' || to_char(CURRENT_DATE - INTERVAL '7 days', 'YYYY_MM_DD')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || partition_record.tablename;
        RAISE NOTICE 'Dropped partition %', partition_record.tablename;
    END LOOP;
END $$;
```

## Performance Monitoring

### Check Query Performance
```sql
-- Enable query timing
\timing on

-- Analyze query plan
EXPLAIN (ANALYZE, BUFFERS) 
SELECT ... your query here ...;
```

### Table Statistics
```sql
-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Row counts
SELECT 
    relname as table,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

### Index Usage
```sql
-- Unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;

-- Index hit rate
SELECT 
    sum(idx_blks_hit) / nullif(sum(idx_blks_hit + idx_blks_read), 0) as index_hit_rate
FROM pg_statio_user_indexes;
```

## Maintenance Commands

### Vacuum and Analyze
```sql
-- Regular maintenance
VACUUM ANALYZE venues;
VACUUM ANALYZE games;

-- More aggressive vacuum
VACUUM FULL venues;

-- Update statistics only
ANALYZE venues;
ANALYZE games;
```

### Reindex
```sql
-- Reindex specific index
REINDEX INDEX idx_venues_location;

-- Reindex entire table
REINDEX TABLE venues;

-- Concurrent reindex (no table lock)
CREATE INDEX CONCURRENTLY idx_venues_location_new ON venues USING GIST(location);
DROP INDEX idx_venues_location;
ALTER INDEX idx_venues_location_new RENAME TO idx_venues_location;
```

## Common Tasks

### Find Duplicate Venues
```sql
-- Find potential duplicate venues by name/location
WITH venue_distances AS (
    SELECT 
        v1.id as id1,
        v2.id as id2,
        v1.name as name1,
        v2.name as name2,
        ST_Distance(v1.location::geography, v2.location::geography) as distance
    FROM venues v1
    JOIN venues v2 ON v1.id < v2.id
    WHERE ST_DWithin(v1.location::geography, v2.location::geography, 100) -- Within 100m
)
SELECT * FROM venue_distances
WHERE 
    distance < 50 -- Very close
    OR similarity(name1, name2) > 0.8 -- Similar names
ORDER BY distance;
```

### Update Game Counts
```sql
-- Update current_players count
UPDATE games g
SET current_players = (
    SELECT COUNT(*) 
    FROM user_games ug 
    WHERE ug.game_id = g.id 
    AND ug.verification_status = 'verified'
)
WHERE g.start_time > NOW();
```

### Geographic Distribution
```sql
-- Games by region (using geohash prefix)
SELECT 
    LEFT(v.geohash, 4) as region,
    COUNT(DISTINCT v.id) as venue_count,
    COUNT(g.id) as game_count
FROM venues v
LEFT JOIN games g ON g.venue_id = v.id AND g.start_time >= NOW()
GROUP BY LEFT(v.geohash, 4)
ORDER BY game_count DESC;
```

## Emergency Performance Fixes

### If Queries Are Slow

1. **Update Statistics**
```sql
ANALYZE venues;
ANALYZE games;
```

2. **Check for Table Bloat**
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    (pgstattuple(schemaname||'.'||tablename)).dead_tuple_percent as bloat_percent
FROM pg_tables
WHERE schemaname = 'public';
```

3. **Emergency Index Creation**
```sql
-- Create missing indexes without locking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emergency_sport 
ON games(sport, start_time) 
WHERE start_time >= NOW();
```

4. **Kill Long-Running Queries**
```sql
-- Find queries running > 1 minute
SELECT 
    pid,
    now() - query_start as duration,
    query
FROM pg_stat_activity
WHERE state = 'active'
AND now() - query_start > interval '1 minute'
ORDER BY duration DESC;

-- Kill specific query
SELECT pg_cancel_backend(pid);
```

## Useful PostgreSQL Settings

### Performance Tuning
```sql
-- Check current settings
SHOW shared_buffers;
SHOW effective_cache_size;
SHOW work_mem;

-- Temporary performance boost for session
SET work_mem = '256MB';
SET enable_seqscan = off; -- Force index usage
```

### Connection Management
```sql
-- View current connections
SELECT 
    datname,
    usename,
    application_name,
    client_addr,
    state,
    query_start
FROM pg_stat_activity
WHERE datname = 'finding_sports';

-- Terminate idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'finding_sports'
AND state = 'idle'
AND state_change < NOW() - INTERVAL '10 minutes';
```