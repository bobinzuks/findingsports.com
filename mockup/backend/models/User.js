const { query, transaction } = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * User Model - Database operations for user management
 * Replaces in-memory users Map with PostgreSQL persistence
 */

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Object} Created user
   */
  static async create(userData) {
    const {
      id,
      email,
      username,
      name,
      passwordHash,
      googleId,
      picture,
      provider = 'local',
      role = 'user',
      permissions = {},
      emailVerified = false
    } = userData;

    const result = await query(`
      INSERT INTO users (
        id, email, username, name, password_hash, google_id, picture,
        provider, role, permissions, email_verified, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `, [
      id, email, username, name, passwordHash, googleId, picture,
      provider, role, JSON.stringify(permissions), emailVerified
    ]);

    return this.formatUser(result.rows[0]);
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Object|null} User object or null
   */
  static async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? this.formatUser(result.rows[0]) : null;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Object|null} User object or null
   */
  static async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] ? this.formatUser(result.rows[0]) : null;
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Object|null} User object or null
   */
  static async findByUsername(username) {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] ? this.formatUser(result.rows[0]) : null;
  }

  /**
   * Find user by Google ID
   * @param {string} googleId - Google ID
   * @returns {Object|null} User object or null
   */
  static async findByGoogleId(googleId) {
    const result = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    return result.rows[0] ? this.formatUser(result.rows[0]) : null;
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated user
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.keys(updates).forEach(key => {
      if (key === 'permissions') {
        fields.push(`${key} = $${paramCount}`);
        values.push(JSON.stringify(updates[key]));
      } else {
        fields.push(`${this.mapFieldName(key)} = $${paramCount}`);
        values.push(updates[key]);
      }
      paramCount++;
    });

    values.push(id); // Add ID as last parameter

    const result = await query(`
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    return result.rows[0] ? this.formatUser(result.rows[0]) : null;
  }

  /**
   * Delete user (soft delete by setting banned status)
   * @param {string} id - User ID
   * @param {string} reason - Deletion reason
   * @returns {boolean} Success status
   */
  static async delete(id, reason = 'Account deleted') {
    const result = await query(`
      UPDATE users 
      SET banned_until = '2099-12-31'::timestamp, 
          ban_reason = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `, [id, reason]);

    return result.rowCount > 0;
  }

  /**
   * Authenticate user with email/password
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Object|null} User object if authenticated, null otherwise
   */
  static async authenticate(email, password) {
    const user = await this.findByEmail(email);
    if (!user || !user.passwordHash) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    // Update last login
    await this.updateLastLogin(user.id);
    
    return user;
  }

  /**
   * Update last login timestamp
   * @param {string} id - User ID
   */
  static async updateLastLogin(id) {
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [id]);
  }

  /**
   * Check if user exists by email or username
   * @param {string} email - Email to check
   * @param {string} username - Username to check
   * @returns {Object} Existence status
   */
  static async exists(email, username) {
    const result = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE email = $1) as email_exists,
        COUNT(*) FILTER (WHERE username = $2) as username_exists
      FROM users
    `, [email, username]);

    return {
      email: parseInt(result.rows[0].email_exists) > 0,
      username: parseInt(result.rows[0].username_exists) > 0
    };
  }

  /**
   * Get user preferences
   * @param {string} userId - User ID
   * @returns {Object|null} User preferences
   */
  static async getPreferences(userId) {
    const result = await query(`
      SELECT * FROM user_preferences WHERE user_id = $1
    `, [userId]);

    return result.rows[0] || null;
  }

  /**
   * Update user preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - Preferences object
   * @returns {Object} Updated preferences
   */
  static async updatePreferences(userId, preferences) {
    const { location, sports, mcpServers, timePreferences, notificationSettings, privacySettings } = preferences;

    const result = await query(`
      INSERT INTO user_preferences (
        user_id, location, sports, mcp_servers, time_preferences, 
        notification_settings, privacy_settings, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        location = EXCLUDED.location,
        sports = EXCLUDED.sports,
        mcp_servers = EXCLUDED.mcp_servers,
        time_preferences = EXCLUDED.time_preferences,
        notification_settings = EXCLUDED.notification_settings,
        privacy_settings = EXCLUDED.privacy_settings,
        updated_at = NOW()
      RETURNING *
    `, [
      userId,
      JSON.stringify(location),
      sports,
      JSON.stringify(mcpServers),
      JSON.stringify(timePreferences),
      JSON.stringify(notificationSettings || {}),
      JSON.stringify(privacySettings || {})
    ]);

    // Mark user as onboarded
    await this.update(userId, { onboarded: true });

    return result.rows[0];
  }

  /**
   * Ban user
   * @param {string} userId - User ID to ban
   * @param {string} reason - Ban reason
   * @param {Date} until - Ban expiration date
   * @param {string} moderatorId - ID of moderator who issued the ban
   * @returns {Object} Updated user
   */
  static async ban(userId, reason, until, moderatorId) {
    return await transaction(async (client) => {
      // Update user ban status
      const userResult = await client.query(`
        UPDATE users 
        SET banned_until = $2, ban_reason = $3, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [userId, until, reason]);

      // Record moderation action
      await client.query(`
        INSERT INTO moderation_actions (
          action_type, moderator_id, target_user_id, reason, expires_at
        ) VALUES ('ban', $1, $2, $3, $4)
      `, [moderatorId, userId, reason, until]);

      return this.formatUser(userResult.rows[0]);
    });
  }

  /**
   * Unban user
   * @param {string} userId - User ID to unban
   * @param {string} moderatorId - ID of moderator who lifted the ban
   * @returns {Object} Updated user
   */
  static async unban(userId, moderatorId) {
    return await transaction(async (client) => {
      // Remove ban
      const userResult = await client.query(`
        UPDATE users 
        SET banned_until = NULL, ban_reason = NULL, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [userId]);

      // Record moderation action
      await client.query(`
        INSERT INTO moderation_actions (
          action_type, moderator_id, target_user_id, reason
        ) VALUES ('unban', $1, $2, 'Ban lifted')
      `, [moderatorId, userId]);

      return this.formatUser(userResult.rows[0]);
    });
  }

  /**
   * Get user statistics
   * @param {string} userId - User ID
   * @returns {Object} User statistics
   */
  static async getStats(userId) {
    const result = await query(`
      SELECT 
        COUNT(DISTINCT ug.id) as games_created,
        COUNT(DISTINCT gp.id) as games_joined,
        COUNT(DISTINCT cm.id) as messages_sent,
        COUNT(DISTINCT vr.id) as venue_requests
      FROM users u
      LEFT JOIN user_games ug ON u.id = ug.creator_id
      LEFT JOIN game_participants gp ON u.id = gp.user_id
      LEFT JOIN chat_messages cm ON u.id = cm.user_id AND cm.is_deleted = FALSE
      LEFT JOIN venue_requests vr ON u.id = vr.requester_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [userId]);

    return result.rows[0] || {
      games_created: 0,
      games_joined: 0,
      messages_sent: 0,
      venue_requests: 0
    };
  }

  /**
   * Search users
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Array} Array of users
   */
  static async search(searchTerm, options = {}) {
    const { limit = 20, offset = 0, role = null } = options;

    let whereClause = `
      WHERE (
        name ILIKE $1 OR 
        username ILIKE $1 OR 
        email ILIKE $1
      )
    `;
    const params = [`%${searchTerm}%`];

    if (role) {
      whereClause += ' AND role = $2';
      params.push(role);
    }

    const result = await query(`
      SELECT id, email, username, name, role, created_at, last_login
      FROM users
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    return result.rows;
  }

  /**
   * Get all users with pagination
   * @param {Object} options - Query options
   * @returns {Object} Users with pagination info
   */
  static async getAll(options = {}) {
    const { 
      limit = 50, 
      offset = 0, 
      role = null, 
      orderBy = 'created_at', 
      orderDir = 'DESC' 
    } = options;

    let whereClause = '';
    const params = [];

    if (role) {
      whereClause = 'WHERE role = $1';
      params.push(role);
    }

    const result = await query(`
      SELECT id, email, username, name, role, created_at, last_login,
             banned_until, warning_count
      FROM users
      ${whereClause}
      ORDER BY ${orderBy} ${orderDir}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    const countResult = await query(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, params);

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset,
      hasMore: offset + limit < parseInt(countResult.rows[0].total)
    };
  }

  /**
   * Map API field names to database column names
   * @param {string} fieldName - API field name
   * @returns {string} Database column name
   */
  static mapFieldName(fieldName) {
    const fieldMap = {
      passwordHash: 'password_hash',
      googleId: 'google_id',
      emailVerified: 'email_verified',
      bannedUntil: 'banned_until',
      banReason: 'ban_reason',
      warningCount: 'warning_count',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      lastLogin: 'last_login'
    };

    return fieldMap[fieldName] || fieldName;
  }

  /**
   * Format user object for API response
   * @param {Object} dbUser - Database user object
   * @returns {Object} Formatted user object
   */
  static formatUser(dbUser) {
    if (!dbUser) return null;

    return {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      name: dbUser.name,
      passwordHash: dbUser.password_hash,
      googleId: dbUser.google_id,
      picture: dbUser.picture,
      provider: dbUser.provider,
      role: dbUser.role,
      permissions: typeof dbUser.permissions === 'string' 
        ? JSON.parse(dbUser.permissions) 
        : dbUser.permissions,
      emailVerified: dbUser.email_verified,
      onboarded: dbUser.onboarded,
      bannedUntil: dbUser.banned_until,
      banReason: dbUser.ban_reason,
      warningCount: dbUser.warning_count,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      lastLogin: dbUser.last_login
    };
  }
}

module.exports = User;