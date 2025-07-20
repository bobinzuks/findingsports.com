-- Gamification System Schema
-- Tracks user points, badges, leaderboards, and challenges

-- Gamification stats table
CREATE TABLE IF NOT EXISTS gamification_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    badges JSONB DEFAULT '[]'::jsonb,
    unlocked_features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Gamification actions log
CREATE TABLE IF NOT EXISTS gamification_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Track who helped whom find games
CREATE TABLE IF NOT EXISTS people_helped (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    helper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    helped_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES user_games(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(helper_id, helped_id, game_id)
);

-- Track helpful answers in chat
CREATE TABLE IF NOT EXISTS helpful_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    marked_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, marked_by_user_id)
);

-- Daily challenges
CREATE TABLE IF NOT EXISTS daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    challenge_type VARCHAR(50) NOT NULL,
    target_value INTEGER NOT NULL,
    points INTEGER NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily challenge progress
CREATE TABLE IF NOT EXISTS daily_challenge_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, challenge_id)
);

-- Badge definitions (static data)
CREATE TABLE IF NOT EXISTS badge_definitions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'legendary')),
    points INTEGER NOT NULL,
    condition_type VARCHAR(50) NOT NULL,
    condition_value INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboard snapshots (for performance)
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    timeframe VARCHAR(20) NOT NULL,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_gamification_stats_points ON gamification_stats(points DESC);
CREATE INDEX idx_gamification_stats_level ON gamification_stats(level DESC);
CREATE INDEX idx_gamification_actions_user_date ON gamification_actions(user_id, created_at);
CREATE INDEX idx_gamification_actions_type ON gamification_actions(action_type);
CREATE INDEX idx_people_helped_helper ON people_helped(helper_id);
CREATE INDEX idx_people_helped_game ON people_helped(game_id);
CREATE INDEX idx_helpful_answers_user ON helpful_answers(user_id);
CREATE INDEX idx_daily_challenges_date ON daily_challenges(date);
CREATE INDEX idx_daily_challenge_progress_user ON daily_challenge_progress(user_id);
CREATE INDEX idx_leaderboard_snapshots_type_time ON leaderboard_snapshots(leaderboard_type, created_at);

-- Insert badge definitions
INSERT INTO badge_definitions (id, name, description, icon, tier, points, condition_type, condition_value) VALUES
-- Starter Badges
('first_steps', 'First Steps', 'Send your first message', '👋', 'bronze', 10, 'messages_sent', 1),
('game_on', 'Game On!', 'Join your first game', '🎮', 'bronze', 20, 'games_joined', 1),

-- Communication Badges
('chatterbox', 'Chatterbox', 'Send 100 messages', '💬', 'silver', 50, 'messages_sent', 100),
('helpful_hand', 'Helpful Hand', 'Receive 50 positive reactions', '🤝', 'gold', 100, 'reactions_received', 50),
('community_sage', 'Community Sage', 'Answer 25 questions marked as helpful', '🧙', 'platinum', 200, 'helpful_answers', 25),

-- Game Organization Badges
('team_player', 'Team Player', 'Join 10 games', '⚽', 'silver', 50, 'games_joined', 10),
('game_master', 'Game Master', 'Host 5 successful games', '🎯', 'gold', 150, 'successful_games_hosted', 5),
('perfect_record', 'Perfect Record', 'Attend all games joined for a month', '💯', 'platinum', 300, 'perfect_attendance_weeks', 4),

-- Sport Variety Badges
('multi_sport', 'Multi-Sport Athlete', 'Play 3 different sports', '🏃', 'silver', 75, 'sports_played', 3),
('sport_explorer', 'Sport Explorer', 'Try 5 different sports', '🗺️', 'gold', 150, 'sports_played', 5),

-- Community Builder Badges
('welcomer', 'Community Welcomer', 'Welcome 10 new users', '🌟', 'gold', 100, 'users_welcomed', 10),
('connector', 'Game Connector', 'Help 20 people find games', '🔗', 'platinum', 200, 'people_helped', 20),
('carpool_hero', 'Carpool Hero', 'Offer 10 carpools', '🚗', 'gold', 150, 'carpools_offered', 10),

-- Marketplace Badges
('trader', 'Equipment Trader', 'Complete 5 marketplace transactions', '🔄', 'gold', 100, 'marketplace_trades', 5),
('generous_soul', 'Generous Soul', 'Donate 3 pieces of equipment', '💝', 'gold', 150, 'equipment_donated', 3),

-- Streak Badges
('week_warrior', 'Week Warrior', 'Active for 7 consecutive days', '🔥', 'silver', 100, 'current_streak', 7),
('month_master', 'Month Master', 'Active for 30 consecutive days', '⚡', 'platinum', 300, 'current_streak', 30),

-- Location-based Badges
('local_legend', 'Local Legend', 'Play at 10 different venues', '📍', 'gold', 150, 'venues_visited', 10),
('city_champion', 'City Champion', 'Top contributor in your city', '🏆', 'legendary', 500, 'city_rank', 10)
ON CONFLICT (id) DO NOTHING;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS TABLE(new_badge_id VARCHAR(50), badge_name VARCHAR(100), badge_points INTEGER) AS $$
DECLARE
    v_stats RECORD;
    v_badge RECORD;
    v_current_badges JSONB;
BEGIN
    -- Get current user stats
    SELECT 
        gs.badges,
        COUNT(DISTINCT cm.id) as messages_sent,
        COUNT(DISTINCT gp.game_id) as games_joined,
        COUNT(DISTINCT ug.id) as games_created,
        COUNT(DISTINCT cr.id) as reactions_received,
        COUNT(DISTINCT ha.id) as helpful_answers,
        COUNT(DISTINCT ph.id) as people_helped,
        COUNT(DISTINCT sp.sport) as sports_played,
        COUNT(DISTINCT vv.venue_id) as venues_visited,
        gs.current_streak
    INTO v_stats
    FROM gamification_stats gs
    LEFT JOIN chat_messages cm ON gs.user_id = cm.user_id
    LEFT JOIN game_participants gp ON gs.user_id = gp.user_id
    LEFT JOIN user_games ug ON gs.user_id = ug.creator_id
    LEFT JOIN (
        SELECT m.user_id, COUNT(*) as id
        FROM chat_messages m
        JOIN chat_reactions r ON m.id = r.message_id
        WHERE r.emoji IN ('👍', '❤️', '🙏', '💯')
        GROUP BY m.user_id
    ) cr ON gs.user_id = cr.user_id
    LEFT JOIN helpful_answers ha ON gs.user_id = ha.user_id
    LEFT JOIN people_helped ph ON gs.user_id = ph.helper_id
    LEFT JOIN (
        SELECT DISTINCT user_id, sport
        FROM game_participants gp
        JOIN user_games ug ON gp.game_id = ug.id
    ) sp ON gs.user_id = sp.user_id
    LEFT JOIN (
        SELECT DISTINCT user_id, venue_id
        FROM game_participants gp
        JOIN user_games ug ON gp.game_id = ug.id
    ) vv ON gs.user_id = vv.user_id
    WHERE gs.user_id = p_user_id
    GROUP BY gs.badges, gs.current_streak;
    
    v_current_badges := COALESCE(v_stats.badges, '[]'::jsonb);
    
    -- Check each badge
    FOR v_badge IN 
        SELECT * FROM badge_definitions
    LOOP
        -- Skip if already has badge
        IF v_current_badges @> to_jsonb(v_badge.id) THEN
            CONTINUE;
        END IF;
        
        -- Check if badge conditions are met
        IF (v_badge.condition_type = 'messages_sent' AND v_stats.messages_sent >= v_badge.condition_value) OR
           (v_badge.condition_type = 'games_joined' AND v_stats.games_joined >= v_badge.condition_value) OR
           (v_badge.condition_type = 'reactions_received' AND v_stats.reactions_received >= v_badge.condition_value) OR
           (v_badge.condition_type = 'helpful_answers' AND v_stats.helpful_answers >= v_badge.condition_value) OR
           (v_badge.condition_type = 'people_helped' AND v_stats.people_helped >= v_badge.condition_value) OR
           (v_badge.condition_type = 'sports_played' AND v_stats.sports_played >= v_badge.condition_value) OR
           (v_badge.condition_type = 'venues_visited' AND v_stats.venues_visited >= v_badge.condition_value) OR
           (v_badge.condition_type = 'current_streak' AND v_stats.current_streak >= v_badge.condition_value)
        THEN
            -- Award badge
            UPDATE gamification_stats
            SET badges = badges || to_jsonb(v_badge.id),
                points = points + v_badge.points,
                updated_at = NOW()
            WHERE user_id = p_user_id;
            
            -- Return the new badge
            RETURN QUERY SELECT v_badge.id, v_badge.name, v_badge.points;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate daily challenges
CREATE OR REPLACE FUNCTION generate_daily_challenges()
RETURNS void AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_challenge_types VARCHAR[] := ARRAY[
        'welcome_newcomer',
        'game_matchmaker', 
        'conversation_starter',
        'sport_variety',
        'equipment_helper'
    ];
    v_challenge_type VARCHAR;
BEGIN
    -- Check if challenges already exist for today
    IF EXISTS (SELECT 1 FROM daily_challenges WHERE date = v_today) THEN
        RETURN;
    END IF;
    
    -- Generate 3 random challenges for today
    FOR i IN 1..3 LOOP
        v_challenge_type := v_challenge_types[1 + floor(random() * array_length(v_challenge_types, 1))];
        
        INSERT INTO daily_challenges (date, challenge_type, target_value, points, metadata)
        VALUES (
            v_today,
            v_challenge_type,
            CASE v_challenge_type
                WHEN 'welcome_newcomer' THEN 1
                WHEN 'game_matchmaker' THEN 3
                WHEN 'conversation_starter' THEN 3
                WHEN 'sport_variety' THEN 2
                WHEN 'equipment_helper' THEN 1
            END,
            CASE v_challenge_type
                WHEN 'welcome_newcomer' THEN 20
                WHEN 'game_matchmaker' THEN 50
                WHEN 'conversation_starter' THEN 30
                WHEN 'sport_variety' THEN 40
                WHEN 'equipment_helper' THEN 25
            END,
            '{}'::jsonb
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_gamification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gamification_stats_timestamp
    BEFORE UPDATE ON gamification_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_gamification_timestamp();

CREATE TRIGGER update_daily_challenge_progress_timestamp
    BEFORE UPDATE ON daily_challenge_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_gamification_timestamp();

-- Schedule daily challenge generation (requires pg_cron extension)
-- SELECT cron.schedule('generate-daily-challenges', '0 0 * * *', 'SELECT generate_daily_challenges();');