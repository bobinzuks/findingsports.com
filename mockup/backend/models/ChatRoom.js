const { query, transaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * ChatRoom Model - Database operations for chat room management
 * Replaces in-memory chat room storage with PostgreSQL persistence
 */

class ChatRoom {
  /**
   * Create a new chat room for a game
   * @param {Object} roomData - Chat room data
   * @param {string} creatorId - User ID of the creator
   * @returns {Object} Created chat room
   */
  static async createGameChatRoom(roomData, creatorId) {
    const { game } = roomData;
    
    return await transaction(async (client) => {
      // Check if room already exists for this game
      const existingResult = await client.query(
        'SELECT * FROM chat_rooms WHERE game_id = $1',
        [game.id]
      );

      if (existingResult.rows.length > 0) {
        return this.formatChatRoom(existingResult.rows[0]);
      }

      const roomId = uuidv4();
      const expiresAt = new Date(game.endTime || game.dateTime);
      expiresAt.setHours(expiresAt.getHours() + 24); // Add 24 hours after game ends

      // Create chat room
      const result = await client.query(`
        INSERT INTO chat_rooms (
          id, game_id, name, description, created_by, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        roomId,
        game.id,
        `${game.sport} at ${game.venue?.name || game.location}`,
        `Chat room for ${game.sport} game on ${new Date(game.dateTime).toLocaleDateString()}`,
        creatorId,
        expiresAt
      ]);

      return this.formatChatRoom(result.rows[0]);
    });
  }

  /**
   * Get chat room by ID
   * @param {string} roomId - Chat room ID
   * @returns {Object|null} Chat room object or null
   */
  static async findById(roomId) {
    const result = await query(`
      SELECT cr.*, 
             COUNT(DISTINCT cp.user_id) FILTER (WHERE cp.left_at IS NULL) as current_participants,
             COUNT(DISTINCT cm.id) FILTER (WHERE cm.is_deleted = FALSE) as message_count
      FROM chat_rooms cr
      LEFT JOIN chat_participants cp ON cr.id = cp.room_id
      LEFT JOIN chat_messages cm ON cr.id = cm.room_id
      WHERE cr.id = $1
      GROUP BY cr.id
    `, [roomId]);

    return result.rows[0] ? this.formatChatRoom(result.rows[0]) : null;
  }

  /**
   * Get chat room by game ID
   * @param {string} gameId - Game ID
   * @returns {Object|null} Chat room object or null
   */
  static async findByGameId(gameId) {
    const result = await query(`
      SELECT cr.*,
             COUNT(DISTINCT cp.user_id) FILTER (WHERE cp.left_at IS NULL) as current_participants,
             COUNT(DISTINCT cm.id) FILTER (WHERE cm.is_deleted = FALSE) as message_count
      FROM chat_rooms cr
      LEFT JOIN chat_participants cp ON cr.id = cp.room_id
      LEFT JOIN chat_messages cm ON cr.id = cm.room_id
      WHERE cr.game_id = $1
      GROUP BY cr.id
    `, [gameId]);

    return result.rows[0] ? this.formatChatRoom(result.rows[0]) : null;
  }

  /**
   * Join a chat room
   * @param {string} roomId - Chat room ID
   * @param {string} userId - User ID
   * @returns {Object} Join result
   */
  static async joinChatRoom(roomId, userId) {
    return await transaction(async (client) => {
      // Get room info
      const roomResult = await client.query(
        'SELECT * FROM chat_rooms WHERE id = $1',
        [roomId]
      );

      if (!roomResult.rows.length) {
        throw new Error('Chat room not found');
      }

      const room = roomResult.rows[0];

      if (!room.is_active || (room.expires_at && new Date(room.expires_at) < new Date())) {
        throw new Error('Chat room has expired');
      }

      // Check current participant count
      const participantResult = await client.query(
        'SELECT COUNT(*) as count FROM chat_participants WHERE room_id = $1 AND left_at IS NULL',
        [roomId]
      );

      const currentCount = parseInt(participantResult.rows[0].count);
      if (currentCount >= room.max_participants) {
        // Check if user is already in the room
        const existingResult = await client.query(
          'SELECT id FROM chat_participants WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL',
          [roomId, userId]
        );

        if (!existingResult.rows.length) {
          throw new Error('Chat room is full');
        }
      }

      // Join or rejoin the room
      await client.query(`
        INSERT INTO chat_participants (room_id, user_id, joined_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (room_id, user_id) DO UPDATE SET
          left_at = NULL,
          joined_at = NOW()
      `, [roomId, userId]);

      // Add system message
      const messageId = uuidv4();
      await client.query(`
        INSERT INTO chat_messages (
          id, room_id, user_id, content, message_type
        ) VALUES ($1, $2, 'system', 'User joined the chat', 'system')
      `, [messageId, roomId]);

      // Get updated participant count
      const newCountResult = await client.query(
        'SELECT COUNT(*) as count FROM chat_participants WHERE room_id = $1 AND left_at IS NULL',
        [roomId]
      );

      return {
        success: true,
        room: this.formatChatRoom(room),
        participantCount: parseInt(newCountResult.rows[0].count)
      };
    });
  }

  /**
   * Leave a chat room
   * @param {string} roomId - Chat room ID
   * @param {string} userId - User ID
   * @returns {Object} Leave result
   */
  static async leaveChatRoom(roomId, userId) {
    return await transaction(async (client) => {
      // Mark participant as left
      await client.query(`
        UPDATE chat_participants 
        SET left_at = NOW()
        WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL
      `, [roomId, userId]);

      // Add system message
      const messageId = uuidv4();
      await client.query(`
        INSERT INTO chat_messages (
          id, room_id, user_id, content, message_type
        ) VALUES ($1, $2, 'system', 'User left the chat', 'system')
      `, [messageId, roomId]);

      return { success: true };
    });
  }

  /**
   * Send a message to a chat room
   * @param {string} roomId - Chat room ID
   * @param {string} userId - User ID
   * @param {string} content - Message content
   * @param {string} parentMessageId - Optional parent message ID for replies
   * @returns {Object} The sent message
   */
  static async sendMessage(roomId, userId, content, parentMessageId = null) {
    return await transaction(async (client) => {
      // Verify room exists and is active
      const roomResult = await client.query(
        'SELECT * FROM chat_rooms WHERE id = $1 AND is_active = TRUE',
        [roomId]
      );

      if (!roomResult.rows.length) {
        throw new Error('Chat room not found or expired');
      }

      const room = roomResult.rows[0];
      if (room.expires_at && new Date(room.expires_at) < new Date()) {
        throw new Error('Chat room has expired');
      }

      // Verify user is in the room
      const participantResult = await client.query(
        'SELECT id FROM chat_participants WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL',
        [roomId, userId]
      );

      if (!participantResult.rows.length) {
        throw new Error('User must join the chat room first');
      }

      // Check if user is muted
      const muteResult = await client.query(`
        SELECT muted_until FROM chat_participants 
        WHERE room_id = $1 AND user_id = $2 AND is_muted = TRUE
        AND (muted_until IS NULL OR muted_until > NOW())
      `, [roomId, userId]);

      if (muteResult.rows.length > 0) {
        throw new Error('User is muted and cannot send messages');
      }

      // Create message
      const messageId = uuidv4();
      const messageResult = await client.query(`
        INSERT INTO chat_messages (
          id, room_id, user_id, parent_message_id, content, message_type
        ) VALUES ($1, $2, $3, $4, $5, 'text')
        RETURNING *
      `, [messageId, roomId, userId, parentMessageId, content]);

      return this.formatMessage(messageResult.rows[0]);
    });
  }

  /**
   * Get messages from a chat room
   * @param {string} roomId - Chat room ID
   * @param {number} limit - Maximum number of messages to return
   * @param {string} beforeId - Get messages before this message ID
   * @returns {Array} Array of messages
   */
  static async getMessages(roomId, limit = 50, beforeId = null) {
    let whereClause = 'WHERE cm.room_id = $1 AND cm.is_deleted = FALSE';
    const params = [roomId];

    if (beforeId) {
      whereClause += ' AND cm.created_at < (SELECT created_at FROM chat_messages WHERE id = $2)';
      params.push(beforeId);
    }

    const result = await query(`
      SELECT cm.*, u.username, u.name as user_name, u.picture as user_picture
      FROM chat_messages cm
      LEFT JOIN users u ON cm.user_id = u.id
      ${whereClause}
      ORDER BY cm.created_at DESC
      LIMIT $${params.length + 1}
    `, [...params, limit]);

    return result.rows.map(row => this.formatMessage(row)).reverse();
  }

  /**
   * Delete a message (soft delete)
   * @param {string} roomId - Chat room ID
   * @param {string} messageId - Message ID
   * @param {string} deletedBy - User ID who deleted the message
   * @returns {Object} Delete result
   */
  static async deleteMessage(roomId, messageId, deletedBy) {
    const result = await query(`
      UPDATE chat_messages 
      SET is_deleted = TRUE, deleted_by = $3, deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND room_id = $2
      RETURNING *
    `, [messageId, roomId, deletedBy]);

    if (result.rowCount === 0) {
      throw new Error('Message not found');
    }

    return { success: true };
  }

  /**
   * Report a message
   * @param {Object} reportData - Report data
   * @returns {Object} The created report
   */
  static async reportMessage(reportData) {
    const { 
      reporterId, 
      reportedUserId, 
      reportedMessageId, 
      reportType, 
      description, 
      roomId 
    } = reportData;

    const reportId = uuidv4();
    const result = await query(`
      INSERT INTO chat_reports (
        id, reporter_id, reported_user_id, reported_message_id, 
        room_id, report_type, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      reportId, reporterId, reportedUserId, reportedMessageId,
      roomId, reportType, description
    ]);

    return this.formatReport(result.rows[0]);
  }

  /**
   * Moderate a user (mute, kick)
   * @param {Object} actionData - Moderation action data
   * @returns {Object} The moderation action
   */
  static async moderateUser(actionData) {
    const { 
      actionType, 
      moderatorId, 
      targetUserId, 
      targetRoomId, 
      reason, 
      durationMinutes 
    } = actionData;

    return await transaction(async (client) => {
      // Record moderation action
      const actionId = uuidv4();
      const actionResult = await client.query(`
        INSERT INTO moderation_actions (
          id, action_type, moderator_id, target_user_id, target_room_id, 
          reason, duration_minutes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [actionId, actionType, moderatorId, targetUserId, targetRoomId, reason, durationMinutes]);

      // Apply the action
      switch (actionType) {
      case 'kick':
        if (targetRoomId && targetUserId) {
          await client.query(`
            UPDATE chat_participants 
            SET left_at = NOW()
            WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL
          `, [targetRoomId, targetUserId]);
        }
        break;
      case 'mute':
        if (targetRoomId && targetUserId) {
          const muteUntil = durationMinutes ? 
            new Date(Date.now() + durationMinutes * 60000) : null;
          
          await client.query(`
            UPDATE chat_participants 
            SET is_muted = TRUE, muted_until = $3
            WHERE room_id = $1 AND user_id = $2
          `, [targetRoomId, targetUserId, muteUntil]);
        }
        break;
      }

      return this.formatModerationAction(actionResult.rows[0]);
    });
  }

  /**
   * Get chat room info including participant count
   * @param {string} roomId - Chat room ID
   * @returns {Object} Room info
   */
  static async getChatRoomInfo(roomId) {
    const result = await query(`
      SELECT cr.*,
             COUNT(DISTINCT cp.user_id) FILTER (WHERE cp.left_at IS NULL) as current_participants,
             COUNT(DISTINCT cm.id) FILTER (WHERE cm.is_deleted = FALSE) as message_count,
             array_agg(DISTINCT cp.user_id) FILTER (WHERE cp.left_at IS NULL) as participant_ids
      FROM chat_rooms cr
      LEFT JOIN chat_participants cp ON cr.id = cp.room_id
      LEFT JOIN chat_messages cm ON cr.id = cm.room_id
      WHERE cr.id = $1
      GROUP BY cr.id
    `, [roomId]);

    return result.rows[0] ? this.formatChatRoomInfo(result.rows[0]) : null;
  }

  /**
   * Clean up expired chat rooms
   * @returns {Object} Cleanup result
   */
  static async cleanupExpiredRooms() {
    return await transaction(async (client) => {
      // Mark rooms as inactive if expired
      await client.query(`
        UPDATE chat_rooms 
        SET is_active = FALSE 
        WHERE expires_at < NOW() AND is_active = TRUE
      `);

      // Delete rooms that have been inactive for 7 days
      const deleteResult = await client.query(`
        DELETE FROM chat_rooms 
        WHERE expires_at < NOW() - INTERVAL '7 days' 
        AND is_active = FALSE
        RETURNING id
      `);

      return { 
        cleanedCount: deleteResult.rowCount,
        timestamp: new Date().toISOString()
      };
    });
  }

  /**
   * Get moderation stats
   * @returns {Object} Moderation statistics
   */
  static async getModerationStats() {
    const result = await query(`
      SELECT 
        (SELECT COUNT(*) FROM chat_reports WHERE status = 'pending') as pending_reports,
        (SELECT COUNT(*) FROM moderation_actions WHERE created_at > NOW() - INTERVAL '24 hours') as recent_actions,
        (SELECT COUNT(*) FROM chat_rooms WHERE is_active = TRUE) as active_rooms,
        (SELECT COUNT(*) FROM chat_rooms) as total_rooms
    `);

    return result.rows[0];
  }

  /**
   * Get active chat rooms
   * @param {Object} options - Query options
   * @returns {Array} Array of active chat rooms
   */
  static async getActiveRooms(options = {}) {
    const { limit = 50, offset = 0 } = options;

    const result = await query(`
      SELECT * FROM active_chat_rooms_info
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    return result.rows.map(row => this.formatChatRoom(row));
  }

  /**
   * Format chat room object for API response
   * @param {Object} dbRoom - Database chat room object
   * @returns {Object} Formatted chat room object
   */
  static formatChatRoom(dbRoom) {
    if (!dbRoom) return null;

    return {
      id: dbRoom.id,
      gameId: dbRoom.game_id,
      name: dbRoom.name,
      description: dbRoom.description,
      isActive: dbRoom.is_active,
      maxParticipants: dbRoom.max_participants,
      currentParticipants: parseInt(dbRoom.current_participants) || 0,
      messageCount: parseInt(dbRoom.message_count) || 0,
      createdBy: dbRoom.created_by,
      expiresAt: dbRoom.expires_at,
      createdAt: dbRoom.created_at,
      updatedAt: dbRoom.updated_at
    };
  }

  /**
   * Format chat room info object for API response
   * @param {Object} dbRoom - Database chat room info object
   * @returns {Object} Formatted chat room info object
   */
  static formatChatRoomInfo(dbRoom) {
    const formatted = this.formatChatRoom(dbRoom);
    if (formatted) {
      formatted.participants = dbRoom.participant_ids || [];
    }
    return formatted;
  }

  /**
   * Format message object for API response
   * @param {Object} dbMessage - Database message object
   * @returns {Object} Formatted message object
   */
  static formatMessage(dbMessage) {
    if (!dbMessage) return null;

    return {
      id: dbMessage.id,
      roomId: dbMessage.room_id,
      userId: dbMessage.user_id,
      parentMessageId: dbMessage.parent_message_id,
      content: dbMessage.content,
      messageType: dbMessage.message_type,
      isEdited: dbMessage.is_edited,
      isDeleted: dbMessage.is_deleted,
      deletedBy: dbMessage.deleted_by,
      deletedAt: dbMessage.deleted_at,
      createdAt: dbMessage.created_at,
      updatedAt: dbMessage.updated_at,
      user: dbMessage.username ? {
        username: dbMessage.username,
        name: dbMessage.user_name,
        picture: dbMessage.user_picture
      } : null
    };
  }

  /**
   * Format report object for API response
   * @param {Object} dbReport - Database report object
   * @returns {Object} Formatted report object
   */
  static formatReport(dbReport) {
    if (!dbReport) return null;

    return {
      id: dbReport.id,
      reporterId: dbReport.reporter_id,
      reportedUserId: dbReport.reported_user_id,
      reportedMessageId: dbReport.reported_message_id,
      roomId: dbReport.room_id,
      reportType: dbReport.report_type,
      description: dbReport.description,
      status: dbReport.status,
      reviewedBy: dbReport.reviewed_by,
      reviewedAt: dbReport.reviewed_at,
      resolutionNotes: dbReport.resolution_notes,
      createdAt: dbReport.created_at,
      updatedAt: dbReport.updated_at
    };
  }

  /**
   * Format moderation action object for API response
   * @param {Object} dbAction - Database moderation action object
   * @returns {Object} Formatted moderation action object
   */
  static formatModerationAction(dbAction) {
    if (!dbAction) return null;

    return {
      id: dbAction.id,
      actionType: dbAction.action_type,
      moderatorId: dbAction.moderator_id,
      targetUserId: dbAction.target_user_id,
      targetRoomId: dbAction.target_room_id,
      reason: dbAction.reason,
      durationMinutes: dbAction.duration_minutes,
      expiresAt: dbAction.expires_at,
      isActive: dbAction.is_active,
      createdAt: dbAction.created_at,
      updatedAt: dbAction.updated_at
    };
  }
}

module.exports = ChatRoom;