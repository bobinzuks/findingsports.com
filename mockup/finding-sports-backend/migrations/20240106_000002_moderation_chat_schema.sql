-- Migration: Add moderation and chat system tables
-- Description: Adds tables for user roles, chat rooms, messages, moderation actions, and reporting

-- 1. USER ROLES AND PERMISSIONS
-- ==============================

-- Add role columns to users table
ALTER TABLE users 
ADD COLUMN role VARCHAR(50) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'moderator', 'admin')),
ADD COLUMN permissions JSONB DEFAULT '{}',
ADD COLUMN banned_until TIMESTAMPTZ,
ADD COLUMN ban_reason TEXT,
ADD COLUMN warning_count INTEGER DEFAULT 0;

-- Create role permissions table for fine-grained control
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, permission, resource)
);

-- 2. CHAT ROOMS
-- =============

-- Chat rooms linked to games (temporary, auto-expire)
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    max_participants INTEGER DEFAULT 50,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL, -- Auto-calculated: game end_time + 24 hours
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_id)
);

-- Chat room participants
CREATE TABLE chat_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    is_muted BOOLEAN DEFAULT false,
    muted_until TIMESTAMPTZ,
    UNIQUE(room_id, user_id)
);

-- 3. CHAT MESSAGES
-- ================

-- Messages with support for replies and edits
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'announcement')),
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message read receipts (optional, for tracking unread messages)
CREATE TABLE message_read_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- 4. MODERATION SYSTEM
-- ====================

-- Moderation actions log
CREATE TABLE moderation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'warn', 'mute', 'kick', 'ban', 'unban', 'unmute', 
        'delete_message', 'edit_message', 'lock_chat', 'unlock_chat'
    )),
    moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    target_room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    duration_minutes INTEGER, -- For temporary actions like mute/ban
    metadata JSONB DEFAULT '{}', -- Additional context
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User reports
CREATE TABLE user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reported_message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
        'spam', 'harassment', 'inappropriate_content', 'impersonation', 
        'violence', 'hate_speech', 'other'
    )),
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'reviewing', 'resolved', 'dismissed', 'escalated'
    )),
    resolution TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report attachments (screenshots, etc.)
CREATE TABLE report_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES user_reports(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MODERATION RULES AND FILTERS
-- ================================

-- Automated moderation rules
CREATE TABLE moderation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('word_filter', 'regex', 'behavior')),
    pattern TEXT NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('warn', 'mute', 'delete', 'flag')),
    severity VARCHAR(50) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banned words/phrases
CREATE TABLE banned_words (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(50),
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PERFORMANCE INDEXES
-- ======================

-- Chat room indexes
CREATE INDEX idx_chat_rooms_game_id ON chat_rooms(game_id);
CREATE INDEX idx_chat_rooms_expires_at ON chat_rooms(expires_at) WHERE is_active = true;
CREATE INDEX idx_chat_rooms_created_by ON chat_rooms(created_by);

-- Chat participant indexes
CREATE INDEX idx_chat_participants_room_id ON chat_participants(room_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX idx_chat_participants_active ON chat_participants(room_id, user_id) WHERE left_at IS NULL;

-- Message indexes
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_parent ON chat_messages(parent_message_id) WHERE parent_message_id IS NOT NULL;
CREATE INDEX idx_chat_messages_active ON chat_messages(room_id, created_at DESC) WHERE is_deleted = false;

-- Moderation indexes
CREATE INDEX idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX idx_moderation_actions_target_user ON moderation_actions(target_user_id);
CREATE INDEX idx_moderation_actions_created_at ON moderation_actions(created_at DESC);
CREATE INDEX idx_moderation_actions_type ON moderation_actions(action_type);

-- Report indexes
CREATE INDEX idx_user_reports_reporter ON user_reports(reporter_id);
CREATE INDEX idx_user_reports_reported_user ON user_reports(reported_user_id);
CREATE INDEX idx_user_reports_status ON user_reports(status);
CREATE INDEX idx_user_reports_pending ON user_reports(created_at) WHERE status = 'pending';

-- User role indexes
CREATE INDEX idx_users_role ON users(role) WHERE role != 'user';
CREATE INDEX idx_users_banned ON users(banned_until) WHERE banned_until > NOW();

-- 7. TRIGGERS
-- ===========

-- Auto-set chat room expiration based on game end time
CREATE OR REPLACE FUNCTION set_chat_room_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NULL THEN
        SELECT end_time + INTERVAL '24 hours' INTO NEW.expires_at
        FROM games
        WHERE id = NEW.game_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_chat_expiration
    BEFORE INSERT ON chat_rooms
    FOR EACH ROW
    EXECUTE FUNCTION set_chat_room_expiration();

-- Update triggers for new tables
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_reports_updated_at BEFORE UPDATE ON user_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moderation_rules_updated_at BEFORE UPDATE ON moderation_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment warning count on warn action
CREATE OR REPLACE FUNCTION increment_warning_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.action_type = 'warn' AND NEW.target_user_id IS NOT NULL THEN
        UPDATE users 
        SET warning_count = warning_count + 1 
        WHERE id = NEW.target_user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_increment_warnings
    AFTER INSERT ON moderation_actions
    FOR EACH ROW
    EXECUTE FUNCTION increment_warning_count();

-- 8. DEFAULT PERMISSIONS
-- ======================

-- Insert default role permissions
INSERT INTO role_permissions (role, permission, resource) VALUES
-- User permissions
('user', 'read', 'chat'),
('user', 'write', 'chat'),
('user', 'report', 'user'),
('user', 'report', 'message'),

-- Moderator permissions (includes all user permissions)
('moderator', 'read', 'chat'),
('moderator', 'write', 'chat'),
('moderator', 'report', 'user'),
('moderator', 'report', 'message'),
('moderator', 'delete', 'message'),
('moderator', 'mute', 'user'),
('moderator', 'kick', 'user'),
('moderator', 'warn', 'user'),
('moderator', 'review', 'report'),
('moderator', 'resolve', 'report'),

-- Admin permissions (all permissions)
('admin', 'read', 'chat'),
('admin', 'write', 'chat'),
('admin', 'report', 'user'),
('admin', 'report', 'message'),
('admin', 'delete', 'message'),
('admin', 'mute', 'user'),
('admin', 'kick', 'user'),
('admin', 'warn', 'user'),
('admin', 'ban', 'user'),
('admin', 'unban', 'user'),
('admin', 'review', 'report'),
('admin', 'resolve', 'report'),
('admin', 'manage', 'moderator'),
('admin', 'manage', 'rules'),
('admin', 'lock', 'chat'),
('admin', 'unlock', 'chat');

-- 9. CLEANUP FUNCTIONS
-- ====================

-- Function to clean up expired chat rooms and their messages
CREATE OR REPLACE FUNCTION cleanup_expired_chats()
RETURNS void AS $$
BEGIN
    -- Mark chat rooms as inactive
    UPDATE chat_rooms 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
    
    -- Optionally delete old messages (adjust retention period as needed)
    DELETE FROM chat_messages 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND room_id IN (
        SELECT id FROM chat_rooms 
        WHERE is_active = false 
        AND expires_at < NOW() - INTERVAL '7 days'
    );
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- COMMENT: Uncomment and adjust if pg_cron is available
-- SELECT cron.schedule('cleanup-expired-chats', '0 2 * * *', 'SELECT cleanup_expired_chats();');