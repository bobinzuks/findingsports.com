-- Finding Sports Database Schema
-- PostgreSQL database schema for persistent storage

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Drop tables if they exist (for fresh installs)
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS moderation_actions CASCADE;
DROP TABLE IF EXISTS chat_reports CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_participants CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;
DROP TABLE IF EXISTS game_participants CASCADE;
DROP TABLE IF EXISTS user_games CASCADE;
DROP TABLE IF EXISTS venue_requests CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE user_provider AS ENUM ('local', 'google');
CREATE TYPE chat_message_type AS ENUM ('text', 'system', 'image', 'file');
CREATE TYPE moderation_action_type AS ENUM ('warn', 'mute', 'kick', 'ban');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
CREATE TYPE report_type AS ENUM ('spam', 'harassment', 'inappropriate', 'other');

-- Users table (replaces in-memory users Map)
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255), -- NULL for OAuth users
    google_id VARCHAR(255) UNIQUE,
    picture TEXT,
    provider user_provider NOT NULL DEFAULT 'local',
    role user_role NOT NULL DEFAULT 'user',
    permissions JSONB DEFAULT '{}',
    email_verified BOOLEAN DEFAULT FALSE,
    onboarded BOOLEAN DEFAULT FALSE,
    
    -- Moderation fields
    banned_until TIMESTAMP WITH TIME ZONE,
    ban_reason TEXT,
    warning_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- User preferences table (replaces user.preferences)
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    location JSONB, -- {name, lat, lng, radius}
    sports TEXT[], -- Array of preferred sports
    mcp_servers JSONB, -- MCP server preferences
    time_preferences JSONB, -- Time and schedule preferences
    notification_settings JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table (for session management)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL, -- Hashed JWT for revocation
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- User-created games table (replaces routes/user-games storage)
CREATE TABLE user_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sport VARCHAR(100) NOT NULL,
    description TEXT,
    location JSONB NOT NULL, -- {name, address, lat, lng}
    venue JSONB, -- {name, address, type}
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 1,
    skill_level VARCHAR(50),
    equipment_provided BOOLEAN DEFAULT FALSE,
    cost DECIMAL(10,2) DEFAULT 0.00,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game participants table (for tracking who joined games)
CREATE TABLE game_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES user_games(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, pending, cancelled
    UNIQUE(game_id, user_id)
);

-- Venue requests table (replaces routes/venue-requests storage)
CREATE TABLE venue_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    venue_name VARCHAR(255) NOT NULL,
    venue_address TEXT NOT NULL,
    sport VARCHAR(100) NOT NULL,
    contact_info JSONB, -- {name, email, phone}
    location JSONB, -- {lat, lng}
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    admin_notes TEXT,
    processed_by VARCHAR(255) REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat rooms table (replaces chat-room-service.js chatRooms Map)
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES user_games(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    max_participants INTEGER DEFAULT 50,
    created_by VARCHAR(255) REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat participants table (replaces chat-room-service.js participants Map)
CREATE TABLE chat_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    is_muted BOOLEAN DEFAULT FALSE,
    muted_until TIMESTAMP WITH TIME ZONE,
    UNIQUE(room_id, user_id)
);

-- Chat messages table (replaces chat-room-service.js messages Map)
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id),
    parent_message_id UUID REFERENCES chat_messages(id), -- For replies
    content TEXT NOT NULL,
    message_type chat_message_type DEFAULT 'text',
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by VARCHAR(255) REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat reports table (replaces chat-room-service.js reports Map)
CREATE TABLE chat_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    reported_message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    report_type report_type NOT NULL,
    description TEXT,
    status report_status DEFAULT 'pending',
    reviewed_by VARCHAR(255) REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moderation actions table (replaces chat-room-service.js moderationActions Map)
CREATE TABLE moderation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type moderation_action_type NOT NULL,
    moderator_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    target_user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    target_room_id UUID REFERENCES chat_rooms(id),
    reason TEXT,
    duration_minutes INTEGER, -- For temporary actions
    expires_at TIMESTAMP WITH TIME ZONE, -- Computed expiration
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX idx_user_games_creator_id ON user_games(creator_id);
CREATE INDEX idx_user_games_sport ON user_games(sport);
CREATE INDEX idx_user_games_date_time ON user_games(date_time);
CREATE INDEX idx_user_games_is_active ON user_games(is_active);
CREATE INDEX idx_user_games_location_gin ON user_games USING GIN(location);

CREATE INDEX idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX idx_game_participants_user_id ON game_participants(user_id);

CREATE INDEX idx_venue_requests_requester_id ON venue_requests(requester_id);
CREATE INDEX idx_venue_requests_status ON venue_requests(status);
CREATE INDEX idx_venue_requests_sport ON venue_requests(sport);

CREATE INDEX idx_chat_rooms_game_id ON chat_rooms(game_id);
CREATE INDEX idx_chat_rooms_is_active ON chat_rooms(is_active);
CREATE INDEX idx_chat_rooms_expires_at ON chat_rooms(expires_at);

CREATE INDEX idx_chat_participants_room_id ON chat_participants(room_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);

CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_is_deleted ON chat_messages(is_deleted);
CREATE INDEX idx_chat_messages_parent_id ON chat_messages(parent_message_id);

CREATE INDEX idx_chat_reports_reporter_id ON chat_reports(reporter_id);
CREATE INDEX idx_chat_reports_reported_user_id ON chat_reports(reported_user_id);
CREATE INDEX idx_chat_reports_status ON chat_reports(status);
CREATE INDEX idx_chat_reports_room_id ON chat_reports(room_id);

CREATE INDEX idx_moderation_actions_moderator_id ON moderation_actions(moderator_id);
CREATE INDEX idx_moderation_actions_target_user_id ON moderation_actions(target_user_id);
CREATE INDEX idx_moderation_actions_is_active ON moderation_actions(is_active);
CREATE INDEX idx_moderation_actions_expires_at ON moderation_actions(expires_at);

-- Create full-text search indexes
CREATE INDEX idx_users_search ON users USING GIN(to_tsvector('english', name || ' ' || username));
CREATE INDEX idx_user_games_search ON user_games USING GIN(to_tsvector('english', title || ' ' || description));
CREATE INDEX idx_venue_requests_search ON venue_requests USING GIN(to_tsvector('english', venue_name || ' ' || venue_address));

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_games_updated_at BEFORE UPDATE ON user_games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venue_requests_updated_at BEFORE UPDATE ON venue_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_reports_updated_at BEFORE UPDATE ON chat_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moderation_actions_updated_at BEFORE UPDATE ON moderation_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically set expires_at for moderation actions
CREATE OR REPLACE FUNCTION set_moderation_expires_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.duration_minutes IS NOT NULL AND NEW.duration_minutes > 0 THEN
        NEW.expires_at = NOW() + (NEW.duration_minutes || ' minutes')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_moderation_expires_at_trigger BEFORE INSERT OR UPDATE ON moderation_actions
    FOR EACH ROW EXECUTE FUNCTION set_moderation_expires_at();

-- Create view for active chat room info (frequently accessed)
CREATE VIEW active_chat_rooms_info AS
SELECT 
    cr.id,
    cr.game_id,
    cr.name,
    cr.description,
    cr.max_participants,
    cr.created_by,
    cr.expires_at,
    cr.created_at,
    COUNT(DISTINCT cp.user_id) as current_participants,
    COUNT(DISTINCT cm.id) FILTER (WHERE cm.is_deleted = FALSE) as message_count
FROM chat_rooms cr
LEFT JOIN chat_participants cp ON cr.id = cp.room_id AND cp.left_at IS NULL
LEFT JOIN chat_messages cm ON cr.id = cm.room_id
WHERE cr.is_active = TRUE AND (cr.expires_at IS NULL OR cr.expires_at > NOW())
GROUP BY cr.id, cr.game_id, cr.name, cr.description, cr.max_participants, cr.created_by, cr.expires_at, cr.created_at;

-- Create view for user stats (for admin dashboard)
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    u.role,
    u.created_at,
    u.last_login,
    COUNT(DISTINCT ug.id) as games_created,
    COUNT(DISTINCT gp.id) as games_joined,
    COUNT(DISTINCT cm.id) as messages_sent,
    COUNT(DISTINCT cr.id) as reports_made,
    u.warning_count,
    CASE WHEN u.banned_until > NOW() THEN TRUE ELSE FALSE END as is_currently_banned
FROM users u
LEFT JOIN user_games ug ON u.id = ug.creator_id
LEFT JOIN game_participants gp ON u.id = gp.user_id
LEFT JOIN chat_messages cm ON u.id = cm.user_id AND cm.is_deleted = FALSE
LEFT JOIN chat_reports cr ON u.id = cr.reporter_id
GROUP BY u.id, u.username, u.role, u.created_at, u.last_login, u.warning_count, u.banned_until;

-- Insert default admin user (password: 'admin123' - CHANGE IN PRODUCTION!)
INSERT INTO users (
    id, email, username, name, password_hash, role, email_verified, onboarded, created_at
) VALUES (
    'admin_001',
    'admin@findingsports.com',
    'admin',
    'System Administrator',
    '$2b$10$rQqO8YhJGdTEjDJvE6vQ0eZhwTfzJzQRqGg8LqKJvLqGg8LqKJvLqG', -- bcrypt hash of 'admin123'
    'admin',
    TRUE,
    TRUE,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Grant permissions (assuming database user 'finding_sports')
-- You may need to adjust these based on your database setup
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO finding_sports;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO finding_sports;

-- Add helpful comments
COMMENT ON TABLE users IS 'Main user accounts with authentication and profile information';
COMMENT ON TABLE user_preferences IS 'User preferences and settings for personalization';
COMMENT ON TABLE user_games IS 'User-created games and events';
COMMENT ON TABLE chat_rooms IS 'Chat rooms associated with games';
COMMENT ON TABLE chat_messages IS 'Messages within chat rooms';
COMMENT ON TABLE moderation_actions IS 'Moderation actions taken by moderators and admins';

-- Success message
SELECT 'Database schema created successfully! 🎉' as status;