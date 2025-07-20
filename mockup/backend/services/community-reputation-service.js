const { query, transaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class CommunityReputationService {
  /**
   * Get user reputation details
   */
  async getUserReputation(userId) {
    const result = await query(`
      SELECT 
        ur.*,
        u.username,
        u.name,
        u.picture,
        COUNT(DISTINCT ue.id) as endorsement_count,
        COUNT(DISTINCT ca.id) as achievement_count,
        COUNT(DISTINCT tm.team_id) as teams_joined,
        COUNT(DISTINCT gm.group_id) as groups_joined
      FROM user_reputation ur
      JOIN users u ON ur.user_id = u.id
      LEFT JOIN user_endorsements ue ON ur.user_id = ue.endorsed_id
      LEFT JOIN community_achievements ca ON ur.user_id = ca.user_id
      LEFT JOIN team_members tm ON ur.user_id = tm.user_id AND tm.status = 'active'
      LEFT JOIN group_members gm ON ur.user_id = gm.user_id
      WHERE ur.user_id = $1
      GROUP BY ur.user_id, u.username, u.name, u.picture
    `, [userId]);

    if (result.rows.length === 0) {
      // Initialize reputation for new user
      await this.initializeUserReputation(userId);
      return this.getUserReputation(userId);
    }

    return result.rows[0];
  }

  /**
   * Initialize reputation for new user
   */
  async initializeUserReputation(userId) {
    await query(`
      INSERT INTO user_reputation (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
    `, [userId]);
  }

  /**
   * Add reputation points
   */
  async addReputationPoints(userId, actionType, points, fromUserId = null, reason = null) {
    return await transaction(async (client) => {
      // Log the action
      await client.query(`
        INSERT INTO reputation_actions (
          user_id, action_type, points, from_user_id, reason
        ) VALUES ($1, $2, $3, $4, $5)
      `, [userId, actionType, points, fromUserId, reason]);

      // Update reputation scores
      const categoryMap = {
        'helpful_answer': 'helpfulness_score',
        'game_organized': 'reliability_score',
        'user_welcomed': 'community_builder_score',
        'positive_feedback': 'sportsmanship_score',
        'team_created': 'community_builder_score',
        'endorsement_received': 'helpfulness_score'
      };

      const scoreField = categoryMap[actionType] || 'reputation_score';

      await client.query(`
        UPDATE user_reputation
        SET 
          ${scoreField} = ${scoreField} + $2,
          reputation_score = reputation_score + $2,
          trust_level = CASE
            WHEN reputation_score + $2 >= 1000 THEN 5
            WHEN reputation_score + $2 >= 500 THEN 4
            WHEN reputation_score + $2 >= 200 THEN 3
            WHEN reputation_score + $2 >= 50 THEN 2
            ELSE 1
          END,
          updated_at = NOW()
        WHERE user_id = $1
      `, [userId, points]);

      // Update social connection if from another user
      if (fromUserId) {
        await this.updateSocialConnection(fromUserId, userId, 'reputation_given');
      }

      return { success: true, points };
    });
  }

  /**
   * Endorse a user
   */
  async endorseUser(endorserId, endorsedId, skillType, message) {
    if (endorserId === endorsedId) {
      throw new Error('Cannot endorse yourself');
    }

    const result = await query(`
      INSERT INTO user_endorsements (
        endorser_id, endorsed_id, skill_type, message
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (endorser_id, endorsed_id, skill_type) DO NOTHING
      RETURNING *
    `, [endorserId, endorsedId, skillType, message]);

    if (result.rows.length > 0) {
      // Add reputation points
      await this.addReputationPoints(endorsedId, 'endorsement_received', 15, endorserId, `Endorsed for ${skillType}`);
      
      // Update social connection
      await this.updateSocialConnection(endorserId, endorsedId, 'endorsement');
    }

    return result.rows[0];
  }

  /**
   * Get user endorsements
   */
  async getUserEndorsements(userId) {
    const result = await query(`
      SELECT 
        ue.*,
        u.username as endorser_username,
        u.name as endorser_name,
        u.picture as endorser_picture
      FROM user_endorsements ue
      JOIN users u ON ue.endorser_id = u.id
      WHERE ue.endorsed_id = $1
      ORDER BY ue.created_at DESC
    `, [userId]);

    return result.rows;
  }

  /**
   * Get ice breaker prompts
   */
  async getIceBreakerPrompts(category = null, sport = null) {
    let whereClause = 'WHERE is_active = true';
    const params = [];

    if (category) {
      params.push(category);
      whereClause += ` AND category = $${params.length}`;
    }

    if (sport) {
      params.push(sport);
      whereClause += ` AND (sport_specific = $${params.length} OR sport_specific IS NULL)`;
    }

    const result = await query(`
      SELECT * FROM ice_breaker_prompts
      ${whereClause}
      ORDER BY usage_count ASC, RANDOM()
      LIMIT 5
    `, params);

    // Increment usage count
    if (result.rows.length > 0) {
      const promptIds = result.rows.map(p => p.id);
      await query(`
        UPDATE ice_breaker_prompts
        SET usage_count = usage_count + 1
        WHERE id = ANY($1)
      `, [promptIds]);
    }

    return result.rows;
  }

  /**
   * Save ice breaker response
   */
  async saveIceBreakerResponse(userId, promptId, response, visibility = 'public') {
    const result = await query(`
      INSERT INTO ice_breaker_responses (
        user_id, prompt_id, response, visibility
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [userId, promptId, response, visibility]);

    // Add small reputation boost for engagement
    await this.addReputationPoints(userId, 'ice_breaker_answered', 2);

    return result.rows[0];
  }

  /**
   * Create team formation request
   */
  async createTeamFormation(data) {
    const {
      creatorId,
      sport,
      skillLevel,
      teamName,
      description,
      location,
      preferredPlayTimes,
      maxMembers,
      requirements
    } = data;

    const teamId = uuidv4();

    return await transaction(async (client) => {
      // Create team
      const teamResult = await client.query(`
        INSERT INTO team_formation_requests (
          id, creator_id, sport, skill_level, team_name, description,
          location, preferred_play_times, max_members, requirements
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        teamId, creatorId, sport, skillLevel, teamName, description,
        JSON.stringify(location), JSON.stringify(preferredPlayTimes),
        maxMembers, JSON.stringify(requirements)
      ]);

      // Add creator as first member
      await client.query(`
        INSERT INTO team_members (
          team_id, user_id, role
        ) VALUES ($1, $2, 'captain')
      `, [teamId, creatorId]);

      // Add reputation for team creation
      await this.addReputationPoints(creatorId, 'team_created', 20);

      return teamResult.rows[0];
    });
  }

  /**
   * Join team
   */
  async joinTeam(teamId, userId, position = null) {
    return await transaction(async (client) => {
      // Check if team has space
      const teamResult = await client.query(`
        SELECT current_members, max_members, creator_id
        FROM team_formation_requests
        WHERE id = $1 AND status = 'open'
      `, [teamId]);

      if (teamResult.rows.length === 0) {
        throw new Error('Team not found or closed');
      }

      const team = teamResult.rows[0];
      if (team.current_members >= team.max_members) {
        throw new Error('Team is full');
      }

      // Add member
      await client.query(`
        INSERT INTO team_members (
          team_id, user_id, position
        ) VALUES ($1, $2, $3)
        ON CONFLICT (team_id, user_id) DO NOTHING
      `, [teamId, userId, position]);

      // Update member count
      await client.query(`
        UPDATE team_formation_requests
        SET current_members = current_members + 1
        WHERE id = $1
      `, [teamId]);

      // Update social connection
      await this.updateSocialConnection(userId, team.creator_id, 'team_joined');

      return { success: true };
    });
  }

  /**
   * Get team recommendations
   */
  async getTeamRecommendations(userId, sport = null) {
    // Get user preferences and skill level
    const userResult = await query(`
      SELECT 
        up.sports,
        up.location,
        ur.trust_level
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      LEFT JOIN user_reputation ur ON u.id = ur.user_id
      WHERE u.id = $1
    `, [userId]);

    const user = userResult.rows[0];
    if (!user) return [];

    let whereClause = 'WHERE tfr.status = \'open\' AND tfr.current_members < tfr.max_members';
    const params = [userId];

    if (sport) {
      params.push(sport);
      whereClause += ` AND tfr.sport = $${params.length}`;
    } else if (user.sports && user.sports.length > 0) {
      params.push(user.sports);
      whereClause += ` AND tfr.sport = ANY($${params.length})`;
    }

    const result = await query(`
      SELECT 
        tfr.*,
        u.username as creator_username,
        u.name as creator_name,
        ur.reputation_score as creator_reputation,
        COUNT(tm.id) as member_count,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'user_id', tm.user_id,
            'username', mu.username,
            'role', tm.role
          )
        ) as members
      FROM team_formation_requests tfr
      JOIN users u ON tfr.creator_id = u.id
      LEFT JOIN user_reputation ur ON u.id = ur.user_id
      LEFT JOIN team_members tm ON tfr.id = tm.team_id
      LEFT JOIN users mu ON tm.user_id = mu.id
      ${whereClause}
      AND NOT EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = tfr.id AND user_id = $1
      )
      GROUP BY tfr.id, u.username, u.name, ur.reputation_score
      ORDER BY 
        CASE WHEN tfr.skill_level = 'intermediate' THEN 1
             WHEN tfr.skill_level = 'beginner' THEN 2
             WHEN tfr.skill_level = 'advanced' THEN 3
             ELSE 4 END,
        tfr.created_at DESC
      LIMIT 10
    `, params);

    return result.rows;
  }

  /**
   * Get social graph data
   */
  async getUserSocialGraph(userId, depth = 2) {
    // Get direct connections
    const directConnections = await query(`
      SELECT 
        sc.*,
        u.username,
        u.name,
        u.picture,
        ur.reputation_score,
        ur.trust_level
      FROM social_connections sc
      JOIN users u ON sc.connected_user_id = u.id
      LEFT JOIN user_reputation ur ON u.id = ur.user_id
      WHERE sc.user_id = $1
      AND sc.trust_score >= 0.3
      ORDER BY sc.trust_score DESC, sc.interaction_count DESC
      LIMIT 50
    `, [userId]);

    const nodes = [{
      id: userId,
      type: 'self',
      level: 0
    }];

    const edges = [];

    // Add direct connections
    directConnections.rows.forEach(conn => {
      nodes.push({
        id: conn.connected_user_id,
        username: conn.username,
        name: conn.name,
        picture: conn.picture,
        reputation: conn.reputation_score,
        trustLevel: conn.trust_level,
        type: 'direct',
        level: 1
      });

      edges.push({
        source: userId,
        target: conn.connected_user_id,
        type: conn.connection_type,
        strength: conn.trust_score,
        interactions: conn.interaction_count
      });
    });

    // If depth > 1, get second-degree connections
    if (depth > 1 && directConnections.rows.length > 0) {
      const connectedIds = directConnections.rows.map(c => c.connected_user_id);
      
      const secondDegree = await query(`
        SELECT DISTINCT
          sc.user_id as from_user,
          sc.connected_user_id,
          u.username,
          u.name,
          ur.reputation_score
        FROM social_connections sc
        JOIN users u ON sc.connected_user_id = u.id
        LEFT JOIN user_reputation ur ON u.id = ur.user_id
        WHERE sc.user_id = ANY($1)
        AND sc.connected_user_id != $2
        AND sc.connected_user_id NOT IN (
          SELECT connected_user_id 
          FROM social_connections 
          WHERE user_id = $2
        )
        AND sc.trust_score >= 0.2
        LIMIT 100
      `, [connectedIds, userId]);

      secondDegree.rows.forEach(conn => {
        const existingNode = nodes.find(n => n.id === conn.connected_user_id);
        if (!existingNode) {
          nodes.push({
            id: conn.connected_user_id,
            username: conn.username,
            name: conn.name,
            reputation: conn.reputation_score,
            type: 'indirect',
            level: 2
          });
        }

        edges.push({
          source: conn.from_user,
          target: conn.connected_user_id,
          type: 'indirect',
          strength: 0.5
        });
      });
    }

    return { nodes, edges };
  }

  /**
   * Update social connection
   */
  async updateSocialConnection(userId, connectedUserId, connectionType, interactionValue = 1) {
    await query(`
      SELECT update_social_connection($1, $2, $3, $4)
    `, [userId, connectedUserId, connectionType, interactionValue]);

    // Also create reverse connection for bidirectional relationships
    if (connectionType !== 'follower') {
      await query(`
        SELECT update_social_connection($1, $2, $3, $4)
      `, [connectedUserId, userId, connectionType, interactionValue]);
    }
  }

  /**
   * Get community groups
   */
  async getCommunityGroups(filters = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (filters.category) {
      params.push(filters.category);
      whereClause += ` AND category = $${params.length}`;
    }

    if (filters.isPublic !== undefined) {
      params.push(filters.isPublic);
      whereClause += ` AND is_public = $${params.length}`;
    }

    if (filters.location) {
      params.push(JSON.stringify(filters.location));
      whereClause += ` AND location @> $${params.length}`;
    }

    const result = await query(`
      SELECT 
        cg.*,
        u.username as creator_username,
        u.name as creator_name,
        COUNT(DISTINCT gm.id) as actual_member_count
      FROM community_groups cg
      JOIN users u ON cg.creator_id = u.id
      LEFT JOIN group_members gm ON cg.id = gm.group_id
      ${whereClause}
      GROUP BY cg.id, u.username, u.name
      ORDER BY cg.activity_score DESC, cg.member_count DESC
      LIMIT 20
    `, params);

    return result.rows;
  }

  /**
   * Create community group
   */
  async createCommunityGroup(data) {
    const {
      name,
      description,
      category,
      creatorId,
      location,
      isPublic,
      rules
    } = data;

    const groupId = uuidv4();

    return await transaction(async (client) => {
      // Create group
      const groupResult = await client.query(`
        INSERT INTO community_groups (
          id, name, description, category, creator_id,
          location, is_public, rules, member_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
        RETURNING *
      `, [
        groupId, name, description, category, creatorId,
        JSON.stringify(location), isPublic, JSON.stringify(rules)
      ]);

      // Add creator as admin
      await client.query(`
        INSERT INTO group_members (
          group_id, user_id, role
        ) VALUES ($1, $2, 'admin')
      `, [groupId, creatorId]);

      // Add reputation for community building
      await this.addReputationPoints(creatorId, 'group_created', 25);

      return groupResult.rows[0];
    });
  }

  /**
   * Award community achievement
   */
  async awardAchievement(userId, achievementType, achievementName, description, metadata = {}) {
    await query(`
      INSERT INTO community_achievements (
        user_id, achievement_type, achievement_name, description, metadata
      ) VALUES ($1, $2, $3, $4, $5)
    `, [userId, achievementType, achievementName, description, JSON.stringify(metadata)]);

    // Add reputation for achievement
    const pointsMap = {
      'community_hero': 100,
      'super_connector': 75,
      'team_builder': 50,
      'ice_breaker': 25,
      'trusted_member': 40
    };

    const points = pointsMap[achievementType] || 20;
    await this.addReputationPoints(userId, 'achievement_earned', points);
  }

  /**
   * Get trust signals for a user
   */
  async getUserTrustSignals(userId) {
    const result = await query(`
      SELECT * FROM trust_signals
      WHERE user_id = $1
      AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
    `, [userId]);

    return result.rows;
  }

  /**
   * Add trust signal
   */
  async addTrustSignal(userId, signalType, signalValue, verifiedBy = null, expiresAt = null) {
    await query(`
      INSERT INTO trust_signals (
        user_id, signal_type, signal_value, verified_by, expires_at
      ) VALUES ($1, $2, $3, $4, $5)
    `, [userId, signalType, signalValue, verifiedBy, expiresAt]);

    // Update reputation based on signal
    const reputationBoost = Math.min(signalValue * 10, 100);
    await this.addReputationPoints(userId, 'trust_signal_added', reputationBoost, verifiedBy);
  }
}

module.exports = new CommunityReputationService();