-- Community Reputation and Social Dynamics Schema
-- Implements user reputation, trust scores, and community building features

-- User reputation scores
CREATE TABLE IF NOT EXISTS user_reputation (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    reputation_score INTEGER NOT NULL DEFAULT 0,
    trust_level INTEGER NOT NULL DEFAULT 1 CHECK (trust_level BETWEEN 1 AND 5),
    helpfulness_score INTEGER NOT NULL DEFAULT 0,
    reliability_score INTEGER NOT NULL DEFAULT 0,
    community_builder_score INTEGER NOT NULL DEFAULT 0,
    sportsmanship_score INTEGER NOT NULL DEFAULT 0,
    total_upvotes INTEGER NOT NULL DEFAULT 0,
    total_downvotes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reputation actions log
CREATE TABLE IF NOT EXISTS reputation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL,
    from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User endorsements
CREATE TABLE IF NOT EXISTS user_endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endorser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endorsed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_type VARCHAR(50) NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(endorser_id, endorsed_id, skill_type)
);

-- Ice breaker prompts
CREATE TABLE IF NOT EXISTS ice_breaker_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'easy',
    sport_specific VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User ice breaker responses
CREATE TABLE IF NOT EXISTS ice_breaker_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES ice_breaker_prompts(id) ON DELETE CASCADE,
    response TEXT NOT NULL,
    visibility VARCHAR(20) DEFAULT 'public',
    reactions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Team formation requests
CREATE TABLE IF NOT EXISTS team_formation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sport VARCHAR(50) NOT NULL,
    skill_level VARCHAR(20) NOT NULL,
    team_name VARCHAR(100),
    description TEXT,
    location JSONB NOT NULL,
    preferred_play_times JSONB,
    max_members INTEGER NOT NULL DEFAULT 10,
    current_members INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'open',
    requirements JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES team_formation_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    position VARCHAR(50),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    UNIQUE(team_id, user_id)
);

-- Social connections
CREATE TABLE IF NOT EXISTS social_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connected_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_type VARCHAR(50) NOT NULL,
    interaction_count INTEGER DEFAULT 0,
    trust_score DECIMAL(3,2) DEFAULT 0.0,
    last_interaction TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, connected_user_id, connection_type)
);

-- Community groups
CREATE TABLE IF NOT EXISTS community_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location JSONB,
    is_public BOOLEAN DEFAULT TRUE,
    member_count INTEGER DEFAULT 0,
    activity_score INTEGER DEFAULT 0,
    rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Group members
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    contribution_score INTEGER DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- Community achievements
CREATE TABLE IF NOT EXISTS community_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Trust signals
CREATE TABLE IF NOT EXISTS trust_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    signal_type VARCHAR(50) NOT NULL,
    signal_value INTEGER NOT NULL,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default ice breaker prompts
INSERT INTO ice_breaker_prompts (category, prompt, difficulty, sport_specific) VALUES
-- General sports prompts
('sports_general', 'What''s your most memorable sports moment?', 'easy', NULL),
('sports_general', 'If you could play any sport professionally, which would it be?', 'easy', NULL),
('sports_general', 'What''s the funniest thing that happened to you during a game?', 'easy', NULL),
('sports_general', 'Who''s your sports hero and why?', 'medium', NULL),
('sports_general', 'What''s your pre-game ritual?', 'easy', NULL),

-- Team building prompts
('team_building', 'What makes a great teammate?', 'easy', NULL),
('team_building', 'Describe your ideal sports buddy', 'easy', NULL),
('team_building', 'What''s your team position preference and why?', 'medium', NULL),
('team_building', 'Share a time when teamwork made the dream work', 'medium', NULL),

-- Local community prompts
('local_community', 'What''s your favorite local sports venue?', 'easy', NULL),
('local_community', 'How did you discover this community?', 'easy', NULL),
('local_community', 'What sports facility do you wish we had nearby?', 'medium', NULL),

-- Sport-specific prompts
('sport_specific', 'What''s your go-to move in basketball?', 'medium', 'basketball'),
('sport_specific', 'Describe your perfect soccer goal', 'medium', 'soccer'),
('sport_specific', 'What''s your tennis serve style?', 'medium', 'tennis'),
('sport_specific', 'Share your best volleyball spike story', 'medium', 'volleyball'),

-- Fun and casual prompts
('fun_casual', 'Sports jersey or regular clothes for casual games?', 'easy', NULL),
('fun_casual', 'Post-game celebration: food or drinks first?', 'easy', NULL),
('fun_casual', 'Morning or evening games?', 'easy', NULL),
('fun_casual', 'Indoor or outdoor sports?', 'easy', NULL)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_user_reputation_score ON user_reputation(reputation_score DESC);
CREATE INDEX idx_reputation_actions_user ON reputation_actions(user_id, created_at);
CREATE INDEX idx_endorsements_endorsed ON user_endorsements(endorsed_id);
CREATE INDEX idx_ice_breaker_active ON ice_breaker_prompts(is_active, category);
CREATE INDEX idx_team_formation_status ON team_formation_requests(status, sport);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_social_connections_user ON social_connections(user_id);
CREATE INDEX idx_social_connections_trust ON social_connections(trust_score DESC);
CREATE INDEX idx_community_groups_public ON community_groups(is_public, activity_score DESC);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_trust_signals_user ON trust_signals(user_id, signal_type);

-- Function to calculate user reputation
CREATE OR REPLACE FUNCTION calculate_user_reputation(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_reputation INTEGER := 0;
    v_helpfulness INTEGER := 0;
    v_reliability INTEGER := 0;
    v_community INTEGER := 0;
    v_sportsmanship INTEGER := 0;
BEGIN
    -- Calculate helpfulness score
    SELECT COUNT(*) * 10 INTO v_helpfulness
    FROM helpful_answers
    WHERE user_id = p_user_id;
    
    -- Add endorsements
    SELECT COUNT(*) * 15 INTO v_community
    FROM user_endorsements
    WHERE endorsed_id = p_user_id;
    
    -- Add successful game participations
    SELECT COUNT(*) * 5 INTO v_reliability
    FROM game_participants gp
    JOIN user_games ug ON gp.game_id = ug.id
    WHERE gp.user_id = p_user_id
    AND gp.status = 'confirmed'
    AND ug.status = 'completed';
    
    -- Add positive reactions received
    SELECT COUNT(*) * 2 INTO v_sportsmanship
    FROM chat_messages m
    JOIN chat_reactions r ON m.id = r.message_id
    WHERE m.user_id = p_user_id
    AND r.emoji IN ('👍', '❤️', '🙏', '💯', '⭐');
    
    -- Calculate total reputation
    v_reputation := v_helpfulness + v_reliability + v_community + v_sportsmanship;
    
    -- Update reputation table
    INSERT INTO user_reputation (
        user_id, 
        reputation_score, 
        helpfulness_score,
        reliability_score,
        community_builder_score,
        sportsmanship_score
    ) VALUES (
        p_user_id, 
        v_reputation, 
        v_helpfulness,
        v_reliability,
        v_community,
        v_sportsmanship
    )
    ON CONFLICT (user_id) DO UPDATE SET
        reputation_score = v_reputation,
        helpfulness_score = v_helpfulness,
        reliability_score = v_reliability,
        community_builder_score = v_community,
        sportsmanship_score = v_sportsmanship,
        trust_level = CASE
            WHEN v_reputation >= 1000 THEN 5
            WHEN v_reputation >= 500 THEN 4
            WHEN v_reputation >= 200 THEN 3
            WHEN v_reputation >= 50 THEN 2
            ELSE 1
        END,
        updated_at = NOW();
    
    RETURN v_reputation;
END;
$$ LANGUAGE plpgsql;

-- Function to update social connections
CREATE OR REPLACE FUNCTION update_social_connection(
    p_user_id UUID,
    p_connected_user_id UUID,
    p_connection_type VARCHAR,
    p_interaction_value INTEGER DEFAULT 1
)
RETURNS void AS $$
BEGIN
    INSERT INTO social_connections (
        user_id,
        connected_user_id,
        connection_type,
        interaction_count,
        trust_score,
        last_interaction
    ) VALUES (
        p_user_id,
        p_connected_user_id,
        p_connection_type,
        p_interaction_value,
        0.1,
        NOW()
    )
    ON CONFLICT (user_id, connected_user_id, connection_type) DO UPDATE SET
        interaction_count = social_connections.interaction_count + p_interaction_value,
        trust_score = LEAST(1.0, social_connections.trust_score + (p_interaction_value * 0.01)),
        last_interaction = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update reputation timestamp
CREATE TRIGGER update_user_reputation_timestamp
    BEFORE UPDATE ON user_reputation
    FOR EACH ROW
    EXECUTE FUNCTION update_gamification_timestamp();