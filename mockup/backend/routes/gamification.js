const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { query, transaction } = require('../config/database');

/**
 * Gamification API routes
 * Handles points, badges, leaderboards, and challenges
 */

// Get user gamification stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user stats from database
    const statsResult = await query(`
      SELECT 
        u.id,
        COALESCE(gs.points, 0) as points,
        COALESCE(gs.level, 1) as level,
        COALESCE(gs.current_streak, 0) as current_streak,
        COALESCE(gs.longest_streak, 0) as longest_streak,
        COALESCE(gs.badges, '[]'::jsonb) as badges,
        COALESCE(gs.unlocked_features, '[]'::jsonb) as unlocked_features,
        COUNT(DISTINCT cm.id) as messages_sent,
        COUNT(DISTINCT gp.game_id) as games_joined,
        COUNT(DISTINCT ug.id) as games_created,
        COUNT(DISTINCT cr.id) as reactions_received,
        COUNT(DISTINCT ha.id) as helpful_answers,
        COUNT(DISTINCT ph.id) as people_helped,
        COUNT(DISTINCT sp.sport) as sports_played_count,
        ARRAY_AGG(DISTINCT sp.sport) FILTER (WHERE sp.sport IS NOT NULL) as sports_played,
        COUNT(DISTINCT vv.venue_id) as venues_visited,
        cr.city_rank
      FROM users u
      LEFT JOIN gamification_stats gs ON u.id = gs.user_id
      LEFT JOIN chat_messages cm ON u.id = cm.user_id
      LEFT JOIN game_participants gp ON u.id = gp.user_id
      LEFT JOIN user_games ug ON u.id = ug.creator_id
      LEFT JOIN (
        SELECT m.user_id, COUNT(*) as id
        FROM chat_messages m
        JOIN chat_reactions r ON m.id = r.message_id
        WHERE r.emoji IN ('👍', '❤️', '🙏', '💯')
        GROUP BY m.user_id
      ) cr ON u.id = cr.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as id
        FROM helpful_answers
        GROUP BY user_id
      ) ha ON u.id = ha.user_id
      LEFT JOIN (
        SELECT helper_id as user_id, COUNT(*) as id
        FROM people_helped
        GROUP BY helper_id
      ) ph ON u.id = ph.user_id
      LEFT JOIN (
        SELECT DISTINCT user_id, sport
        FROM game_participants gp
        JOIN user_games ug ON gp.game_id = ug.id
      ) sp ON u.id = sp.user_id
      LEFT JOIN (
        SELECT DISTINCT user_id, venue_id
        FROM game_participants gp
        JOIN user_games ug ON gp.game_id = ug.id
      ) vv ON u.id = vv.user_id
      LEFT JOIN (
        SELECT 
          user_id,
          ROW_NUMBER() OVER (PARTITION BY city ORDER BY points DESC) as city_rank
        FROM gamification_stats gs
        JOIN user_preferences up ON gs.user_id = up.user_id
        WHERE up.location->>'city' IS NOT NULL
      ) cr ON u.id = cr.user_id
      WHERE u.id = $1
      GROUP BY u.id, gs.points, gs.level, gs.current_streak, gs.longest_streak, 
               gs.badges, gs.unlocked_features, cr.city_rank
    `, [userId]);
    
    if (statsResult.rows.length === 0) {
      // Initialize stats for new user
      await query(`
        INSERT INTO gamification_stats (user_id, points, level, badges, unlocked_features)
        VALUES ($1, 0, 1, '[]'::jsonb, '[]'::jsonb)
      `, [userId]);
      
      return res.json({
        points: 0,
        level: 1,
        messages_sent: 0,
        games_joined: 0,
        games_created: 0,
        reactions_received: 0,
        helpful_answers: 0,
        people_helped: 0,
        current_streak: 0,
        longest_streak: 0,
        badges: [],
        unlocked_features: [],
        sports_played: [],
        venues_visited: 0,
        city_rank: null
      });
    }
    
    const stats = statsResult.rows[0];
    
    res.json({
      points: parseInt(stats.points),
      level: parseInt(stats.level),
      messages_sent: parseInt(stats.messages_sent),
      games_joined: parseInt(stats.games_joined),
      games_created: parseInt(stats.games_created),
      reactions_received: parseInt(stats.reactions_received),
      helpful_answers: parseInt(stats.helpful_answers),
      people_helped: parseInt(stats.people_helped),
      current_streak: parseInt(stats.current_streak),
      longest_streak: parseInt(stats.longest_streak),
      badges: stats.badges,
      unlocked_features: stats.unlocked_features,
      sports_played: stats.sports_played || [],
      venues_visited: parseInt(stats.venues_visited),
      city_rank: stats.city_rank
    });
  } catch (error) {
    console.error('Error fetching gamification stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Award points for an action
router.post('/award-points', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { action, points, description } = req.body;
    
    await transaction(async (client) => {
      // Update user points
      await client.query(`
        INSERT INTO gamification_stats (user_id, points, level)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) DO UPDATE
        SET points = gamification_stats.points + $2,
            level = FLOOR((gamification_stats.points + $2) / 500) + 1,
            updated_at = NOW()
      `, [userId, points, Math.floor(points / 500) + 1]);
      
      // Log the action
      await client.query(`
        INSERT INTO gamification_actions (user_id, action_type, points, description, metadata)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, action.type, points, description, JSON.stringify(action)]);
      
      // Update streak if it's a new day
      const streakResult = await client.query(`
        SELECT 
          current_streak,
          last_activity_date
        FROM gamification_stats
        WHERE user_id = $1
      `, [userId]);
      
      if (streakResult.rows.length > 0) {
        const lastActivity = streakResult.rows[0].last_activity_date;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (!lastActivity || new Date(lastActivity).toDateString() !== today) {
          let newStreak = 1;
          if (lastActivity && new Date(lastActivity).toDateString() === yesterday) {
            newStreak = streakResult.rows[0].current_streak + 1;
          }
          
          await client.query(`
            UPDATE gamification_stats
            SET current_streak = $2,
                longest_streak = GREATEST(longest_streak, $2),
                last_activity_date = NOW()
            WHERE user_id = $1
          `, [userId, newStreak]);
        }
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error awarding points:', error);
    res.status(500).json({ error: 'Failed to award points' });
  }
});

// Get leaderboard
router.get('/leaderboard/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const { category, limit = 50 } = req.query;
    const userId = req.user.id;
    
    let leaderboardQuery;
    let params = [limit];
    
    switch (type) {
      case 'weekly_points':
        leaderboardQuery = `
          SELECT 
            u.id,
            u.name,
            u.username,
            u.picture,
            SUM(ga.points) as score,
            ROW_NUMBER() OVER (ORDER BY SUM(ga.points) DESC) as rank
          FROM users u
          JOIN gamification_actions ga ON u.id = ga.user_id
          WHERE ga.created_at >= DATE_TRUNC('week', CURRENT_DATE)
          GROUP BY u.id
          ORDER BY score DESC
          LIMIT $1
        `;
        break;
        
      case 'games_organized':
        leaderboardQuery = `
          SELECT 
            u.id,
            u.name,
            u.username,
            u.picture,
            COUNT(ug.id) as score,
            ROW_NUMBER() OVER (ORDER BY COUNT(ug.id) DESC) as rank
          FROM users u
          JOIN user_games ug ON u.id = ug.creator_id
          WHERE ug.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          GROUP BY u.id
          ORDER BY score DESC
          LIMIT $1
        `;
        break;
        
      case 'helpful_members':
        leaderboardQuery = `
          SELECT 
            u.id,
            u.name,
            u.username,
            u.picture,
            COUNT(ph.id) as score,
            ROW_NUMBER() OVER (ORDER BY COUNT(ph.id) DESC) as rank
          FROM users u
          JOIN people_helped ph ON u.id = ph.helper_id
          GROUP BY u.id
          ORDER BY score DESC
          LIMIT $1
        `;
        break;
        
      case 'sport_champions':
        if (!category) {
          return res.status(400).json({ error: 'Sport category required' });
        }
        params.unshift(category);
        leaderboardQuery = `
          SELECT 
            u.id,
            u.name,
            u.username,
            u.picture,
            COUNT(gp.id) as score,
            ROW_NUMBER() OVER (ORDER BY COUNT(gp.id) DESC) as rank
          FROM users u
          JOIN game_participants gp ON u.id = gp.user_id
          JOIN user_games ug ON gp.game_id = ug.id
          WHERE ug.sport = $1
            AND gp.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          GROUP BY u.id
          ORDER BY score DESC
          LIMIT $2
        `;
        break;
        
      case 'city_leaders':
        if (!category) {
          return res.status(400).json({ error: 'City category required' });
        }
        params.unshift(category);
        leaderboardQuery = `
          SELECT 
            u.id,
            u.name,
            u.username,
            u.picture,
            gs.points as score,
            ROW_NUMBER() OVER (ORDER BY gs.points DESC) as rank
          FROM users u
          JOIN gamification_stats gs ON u.id = gs.user_id
          JOIN user_preferences up ON u.id = up.user_id
          WHERE up.location->>'city' = $1
          ORDER BY score DESC
          LIMIT $2
        `;
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid leaderboard type' });
    }
    
    const result = await query(leaderboardQuery, params);
    
    // Get current user's rank
    const userRankQuery = leaderboardQuery.replace('LIMIT $1', '').replace('LIMIT $2', '');
    const userRankResult = await query(`
      WITH ranked AS (${userRankQuery})
      SELECT rank, score FROM ranked WHERE id = $${params.length + 1}
    `, [...params.slice(0, -1), userId]);
    
    res.json({
      leaderboard: result.rows,
      userRank: userRankResult.rows[0] || { rank: null, score: 0 }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get user badges
router.get('/badges', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(`
      SELECT badges
      FROM gamification_stats
      WHERE user_id = $1
    `, [userId]);
    
    res.json({
      badges: result.rows[0]?.badges || []
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// Award badge
router.post('/award-badge', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { badgeId, points } = req.body;
    
    await transaction(async (client) => {
      // Add badge to user's collection
      await client.query(`
        UPDATE gamification_stats
        SET badges = badges || $2::jsonb,
            points = points + $3,
            updated_at = NOW()
        WHERE user_id = $1
      `, [userId, JSON.stringify([badgeId]), points]);
      
      // Log the badge award
      await client.query(`
        INSERT INTO gamification_actions (user_id, action_type, points, description, metadata)
        VALUES ($1, 'badge_earned', $2, $3, $4)
      `, [userId, points, `Earned ${badgeId} badge`, JSON.stringify({ badge: badgeId })]);
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error awarding badge:', error);
    res.status(500).json({ error: 'Failed to award badge' });
  }
});

// Get daily challenges progress
router.get('/daily-challenges', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toDateString();
    
    // Get user's progress on today's challenges
    const result = await query(`
      SELECT 
        dc.id,
        dc.challenge_type,
        dc.target_value,
        dc.points,
        COALESCE(dcp.progress, 0) as progress,
        COALESCE(dcp.completed, false) as completed
      FROM daily_challenges dc
      LEFT JOIN daily_challenge_progress dcp 
        ON dc.id = dcp.challenge_id 
        AND dcp.user_id = $1
      WHERE dc.date = $2
    `, [userId, today]);
    
    res.json({
      challenges: result.rows
    });
  } catch (error) {
    console.error('Error fetching daily challenges:', error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// Update daily challenge progress
router.post('/daily-challenges/:challengeId/progress', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { challengeId } = req.params;
    const { progress } = req.body;
    
    await transaction(async (client) => {
      // Get challenge details
      const challengeResult = await client.query(`
        SELECT target_value, points
        FROM daily_challenges
        WHERE id = $1
      `, [challengeId]);
      
      if (challengeResult.rows.length === 0) {
        throw new Error('Challenge not found');
      }
      
      const challenge = challengeResult.rows[0];
      const completed = progress >= challenge.target_value;
      
      // Update progress
      await client.query(`
        INSERT INTO daily_challenge_progress (user_id, challenge_id, progress, completed)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, challenge_id) DO UPDATE
        SET progress = $3,
            completed = $4,
            updated_at = NOW()
      `, [userId, challengeId, progress, completed]);
      
      // Award points if completed
      if (completed) {
        await client.query(`
          INSERT INTO gamification_stats (user_id, points)
          VALUES ($1, $2)
          ON CONFLICT (user_id) DO UPDATE
          SET points = gamification_stats.points + $2,
              updated_at = NOW()
        `, [userId, challenge.points]);
        
        await client.query(`
          INSERT INTO gamification_actions (user_id, action_type, points, description, metadata)
          VALUES ($1, 'daily_challenge', $2, $3, $4)
        `, [userId, challenge.points, 'Completed daily challenge', JSON.stringify({ challengeId })]);
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get unlocked features
router.get('/unlocked-features', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(`
      SELECT unlocked_features
      FROM gamification_stats
      WHERE user_id = $1
    `, [userId]);
    
    res.json({
      unlockedFeatures: result.rows[0]?.unlocked_features || []
    });
  } catch (error) {
    console.error('Error fetching unlocked features:', error);
    res.status(500).json({ error: 'Failed to fetch features' });
  }
});

// Unlock feature
router.post('/unlock-feature', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { featureId } = req.body;
    
    await query(`
      UPDATE gamification_stats
      SET unlocked_features = unlocked_features || $2::jsonb,
          updated_at = NOW()
      WHERE user_id = $1
    `, [userId, JSON.stringify([featureId])]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error unlocking feature:', error);
    res.status(500).json({ error: 'Failed to unlock feature' });
  }
});

module.exports = router;