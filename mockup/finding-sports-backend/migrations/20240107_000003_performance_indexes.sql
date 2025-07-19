-- Migration: Add performance optimization indexes
-- Description: Adds additional indexes for frequently queried fields and performance optimizations

-- 1. ADDITIONAL CHAT MESSAGE INDEXES
-- ==================================

-- Composite index for room_id and created_at (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created 
ON chat_messages(room_id, created_at DESC) 
WHERE is_deleted = false;

-- Index for pagination queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id_desc 
ON chat_messages(room_id, id DESC) 
WHERE is_deleted = false;

-- 2. REPORT PERFORMANCE INDEXES
-- ==============================

-- Composite index for status and created_at (for moderator dashboard)
CREATE INDEX IF NOT EXISTS idx_user_reports_status_created 
ON user_reports(status, created_at DESC);

-- Index for pending reports by type
CREATE INDEX IF NOT EXISTS idx_user_reports_pending_type 
ON user_reports(report_type, created_at DESC) 
WHERE status = 'pending';

-- Index for reports by user (to check report history)
CREATE INDEX IF NOT EXISTS idx_user_reports_by_user 
ON user_reports(reported_user_id, created_at DESC);

-- 3. MODERATION ACTION INDEXES
-- ============================

-- Composite index for user moderation history
CREATE INDEX IF NOT EXISTS idx_moderation_actions_user_created 
ON moderation_actions(target_user_id, created_at DESC);

-- Index for recent actions by moderator
CREATE INDEX IF NOT EXISTS idx_moderation_actions_mod_created 
ON moderation_actions(moderator_id, created_at DESC);

-- Index for actions by type and date
CREATE INDEX IF NOT EXISTS idx_moderation_actions_type_date 
ON moderation_actions(action_type, created_at DESC);

-- 4. BANNED WORDS OPTIMIZATION
-- ============================

-- Index for fast word lookup (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_banned_words_lower 
ON banned_words(LOWER(word));

-- Index for severity-based filtering
CREATE INDEX IF NOT EXISTS idx_banned_words_severity 
ON banned_words(severity, word);

-- 5. CHAT ROOM OPTIMIZATION
-- =========================

-- Index for active rooms by expiration
CREATE INDEX IF NOT EXISTS idx_chat_rooms_active_expires 
ON chat_rooms(expires_at) 
WHERE is_active = true;

-- Index for rooms by game
CREATE INDEX IF NOT EXISTS idx_chat_rooms_game_active 
ON chat_rooms(game_id, is_active);

-- 6. PARTICIPANT TRACKING
-- =======================

-- Index for active participants count
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_active 
ON chat_participants(room_id) 
WHERE left_at IS NULL;

-- Index for user's active chats
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_active 
ON chat_participants(user_id, joined_at DESC) 
WHERE left_at IS NULL;

-- 7. MESSAGE READ RECEIPTS
-- ========================

-- Composite index for unread message queries
CREATE INDEX IF NOT EXISTS idx_message_receipts_user_message 
ON message_read_receipts(user_id, message_id);

-- 8. ROLE PERMISSIONS CACHE
-- =========================

-- Index for fast permission lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup 
ON role_permissions(role, permission, resource);

-- 9. GAME ATTENDEES OPTIMIZATION
-- ===============================

-- Index for counting attendees
CREATE INDEX IF NOT EXISTS idx_game_attendees_game_status 
ON game_attendees(game_id, status) 
WHERE status = 'confirmed';

-- 10. USER CONNECTIONS OPTIMIZATION
-- ==================================

-- Index for friend lookup
CREATE INDEX IF NOT EXISTS idx_user_connections_bidirectional 
ON user_connections(LEAST(user_id, friend_id), GREATEST(user_id, friend_id));

-- 11. MATERIALIZED VIEW FOR MODERATOR STATS
-- ==========================================

-- Create a materialized view for moderator performance metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS moderator_stats AS
SELECT 
    m.moderator_id,
    u.username as moderator_name,
    COUNT(DISTINCT m.id) as total_actions,
    COUNT(DISTINCT CASE WHEN m.action_type = 'warn' THEN m.id END) as warnings_issued,
    COUNT(DISTINCT CASE WHEN m.action_type = 'ban' THEN m.id END) as bans_issued,
    COUNT(DISTINCT CASE WHEN m.action_type = 'delete_message' THEN m.id END) as messages_deleted,
    COUNT(DISTINCT r.id) as reports_resolved,
    DATE_TRUNC('day', MAX(m.created_at)) as last_action_date
FROM moderation_actions m
LEFT JOIN users u ON m.moderator_id = u.id
LEFT JOIN user_reports r ON r.resolved_by = m.moderator_id AND r.status = 'resolved'
GROUP BY m.moderator_id, u.username;

-- Index for the materialized view
CREATE UNIQUE INDEX idx_moderator_stats_id ON moderator_stats(moderator_id);

-- 12. PERFORMANCE MONITORING TABLE
-- =================================

CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(100) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    value NUMERIC,
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance metrics
CREATE INDEX idx_performance_metrics_type_time 
ON performance_metrics(metric_type, recorded_at DESC);

CREATE INDEX idx_performance_metrics_name_time 
ON performance_metrics(metric_name, recorded_at DESC);

-- 13. QUERY STATISTICS VIEW
-- =========================

-- Create a view for monitoring slow queries (requires pg_stat_statements extension)
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time,
    stddev_time
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries averaging over 100ms
ORDER BY mean_time DESC
LIMIT 50;

-- 14. TABLE PARTITIONING FOR CHAT MESSAGES
-- =========================================

-- Note: For very high volume, consider partitioning chat_messages by created_at
-- This is a comment for future implementation when message volume requires it
-- Example:
-- CREATE TABLE chat_messages_2024_01 PARTITION OF chat_messages
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- 15. CLEANUP FUNCTION OPTIMIZATION
-- ==================================

-- Optimized cleanup function with better performance
CREATE OR REPLACE FUNCTION cleanup_expired_chats_optimized()
RETURNS TABLE(
    expired_rooms INTEGER,
    deleted_messages BIGINT,
    execution_time INTERVAL
) AS $$
DECLARE
    start_time TIMESTAMP;
    room_count INTEGER;
    message_count BIGINT;
BEGIN
    start_time := clock_timestamp();
    
    -- Mark expired rooms as inactive (batch update)
    WITH expired AS (
        SELECT id 
        FROM chat_rooms 
        WHERE expires_at < NOW() 
        AND is_active = true
        LIMIT 1000  -- Process in batches
    )
    UPDATE chat_rooms 
    SET is_active = false 
    FROM expired 
    WHERE chat_rooms.id = expired.id;
    
    GET DIAGNOSTICS room_count = ROW_COUNT;
    
    -- Delete old messages in batches with better performance
    WITH old_messages AS (
        SELECT m.id
        FROM chat_messages m
        INNER JOIN chat_rooms r ON m.room_id = r.id
        WHERE r.is_active = false 
        AND r.expires_at < NOW() - INTERVAL '7 days'
        AND m.created_at < NOW() - INTERVAL '30 days'
        LIMIT 10000  -- Process in batches
    )
    DELETE FROM chat_messages 
    WHERE id IN (SELECT id FROM old_messages);
    
    GET DIAGNOSTICS message_count = ROW_COUNT;
    
    -- Log performance metrics
    INSERT INTO performance_metrics (metric_type, metric_name, value, metadata)
    VALUES 
        ('cleanup', 'expired_rooms', room_count, jsonb_build_object('timestamp', NOW())),
        ('cleanup', 'deleted_messages', message_count, jsonb_build_object('timestamp', NOW()));
    
    RETURN QUERY SELECT room_count, message_count, clock_timestamp() - start_time;
END;
$$ LANGUAGE plpgsql;

-- 16. CONNECTION POOLING RECOMMENDATIONS
-- ======================================

-- Add comment for connection pooling setup
COMMENT ON DATABASE finding_sports IS 'Recommended connection pool settings: 
- min_pool_size: 10
- max_pool_size: 100
- connection_timeout: 30s
- idle_timeout: 600s
- max_lifetime: 1800s';

-- 17. VACUUM AND ANALYZE SETTINGS
-- ================================

-- Set auto-vacuum settings for high-traffic tables
ALTER TABLE chat_messages SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE user_reports SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE moderation_actions SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

-- 18. REFRESH MATERIALIZED VIEW FUNCTION
-- ======================================

CREATE OR REPLACE FUNCTION refresh_moderator_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY moderator_stats;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (requires pg_cron)
-- SELECT cron.schedule('refresh-moderator-stats', '*/15 * * * *', 'SELECT refresh_moderator_stats();');