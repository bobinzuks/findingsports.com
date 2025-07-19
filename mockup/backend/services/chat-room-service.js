const { v4: uuidv4 } = require('uuid');
const webSocketService = require('./websocket');

class ChatRoomService {
  constructor() {
    // In-memory storage for development (replace with database in production)
    this.chatRooms = new Map(); // roomId -> room object
    this.gameRooms = new Map(); // gameId -> roomId
    this.messages = new Map(); // roomId -> array of messages
    this.participants = new Map(); // roomId -> Set of userId
    this.reports = new Map(); // reportId -> report object
    this.moderationActions = new Map(); // actionId -> action object
  }

  /**
     * Create a chat room for a game
     * @param {Object} game - The game object
     * @param {string} creatorId - User ID of the game creator
     * @returns {Object} The created chat room
     */
  async createGameChatRoom(game, creatorId) {
    // Check if room already exists for this game
    if (this.gameRooms.has(game.id)) {
      return this.getChatRoom(this.gameRooms.get(game.id));
    }

    const roomId = uuidv4();
    const expiresAt = new Date(game.endTime || game.dateTime);
    expiresAt.setHours(expiresAt.getHours() + 24); // Add 24 hours after game ends

    const chatRoom = {
      id: roomId,
      gameId: game.id,
      name: `${game.sport} at ${game.venue?.name || game.location}`,
      description: `Chat room for ${game.sport} game on ${new Date(game.dateTime).toLocaleDateString()}`,
      isActive: true,
      maxParticipants: 50,
      createdBy: creatorId,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in memory
    this.chatRooms.set(roomId, chatRoom);
    this.gameRooms.set(game.id, roomId);
    this.messages.set(roomId, []);
    this.participants.set(roomId, new Set());

    // Notify via WebSocket
    webSocketService.notifyGameUpdate(game.id, {
      type: 'chat_room_created',
      roomId,
      room: chatRoom
    });

    return chatRoom;
  }

  /**
     * Get chat room by ID
     * @param {string} roomId - Chat room ID
     * @returns {Object|null} Chat room object or null
     */
  getChatRoom(roomId) {
    const room = this.chatRooms.get(roomId);
    if (room && new Date(room.expiresAt) < new Date()) {
      room.isActive = false;
    }
    return room || null;
  }

  /**
     * Get chat room by game ID
     * @param {string} gameId - Game ID
     * @returns {Object|null} Chat room object or null
     */
  getChatRoomByGameId(gameId) {
    const roomId = this.gameRooms.get(gameId);
    return roomId ? this.getChatRoom(roomId) : null;
  }

  /**
     * Join a chat room
     * @param {string} roomId - Chat room ID
     * @param {string} userId - User ID
     * @returns {Object} Join result
     */
  async joinChatRoom(roomId, userId) {
    const room = this.getChatRoom(roomId);
    if (!room) {
      throw new Error('Chat room not found');
    }

    if (!room.isActive) {
      throw new Error('Chat room has expired');
    }

    const participants = this.participants.get(roomId) || new Set();
    if (participants.size >= room.maxParticipants && !participants.has(userId)) {
      throw new Error('Chat room is full');
    }

    participants.add(userId);
    this.participants.set(roomId, participants);

    // Add system message
    const systemMessage = {
      id: uuidv4(),
      roomId,
      userId: 'system',
      content: 'User joined the chat',
      messageType: 'system',
      createdAt: new Date().toISOString()
    };
    this.addMessage(roomId, systemMessage);

    return {
      success: true,
      room,
      participantCount: participants.size
    };
  }

  /**
     * Leave a chat room
     * @param {string} roomId - Chat room ID
     * @param {string} userId - User ID
     * @returns {Object} Leave result
     */
  async leaveChatRoom(roomId, userId) {
    const participants = this.participants.get(roomId);
    if (participants) {
      participants.delete(userId);

      // Add system message
      const systemMessage = {
        id: uuidv4(),
        roomId,
        userId: 'system',
        content: 'User left the chat',
        messageType: 'system',
        createdAt: new Date().toISOString()
      };
      this.addMessage(roomId, systemMessage);
    }

    return { success: true };
  }

  /**
     * Add a message to a chat room
     * @param {string} roomId - Chat room ID
     * @param {Object} message - Message object
     * @returns {Object} The added message
     */
  addMessage(roomId, message) {
    const messages = this.messages.get(roomId) || [];
    messages.push(message);

    // Keep only last 1000 messages in memory
    if (messages.length > 1000) {
      messages.shift();
    }

    this.messages.set(roomId, messages);

    // Broadcast to room participants via WebSocket
    const room = this.getChatRoom(roomId);
    if (room) {
      webSocketService.io.to(`game-chat-${room.gameId}`).emit('chat-message', {
        roomId,
        message
      });
    }

    return message;
  }

  /**
     * Send a message to a chat room
     * @param {string} roomId - Chat room ID
     * @param {string} userId - User ID
     * @param {string} content - Message content
     * @param {string} parentMessageId - Optional parent message ID for replies
     * @returns {Object} The sent message
     */
  async sendMessage(roomId, userId, content, parentMessageId = null) {
    const room = this.getChatRoom(roomId);
    if (!room || !room.isActive) {
      throw new Error('Chat room not found or expired');
    }

    const participants = this.participants.get(roomId) || new Set();
    if (!participants.has(userId)) {
      throw new Error('User must join the chat room first');
    }

    const message = {
      id: uuidv4(),
      roomId,
      userId,
      parentMessageId,
      content,
      messageType: 'text',
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };

    return this.addMessage(roomId, message);
  }

  /**
     * Get messages from a chat room
     * @param {string} roomId - Chat room ID
     * @param {number} limit - Maximum number of messages to return
     * @param {string} beforeId - Get messages before this message ID
     * @returns {Array} Array of messages
     */
  async getMessages(roomId, limit = 50, beforeId = null) {
    const messages = this.messages.get(roomId) || [];

    let filteredMessages = messages.filter(msg => !msg.isDeleted);

    if (beforeId) {
      const index = filteredMessages.findIndex(msg => msg.id === beforeId);
      if (index > 0) {
        filteredMessages = filteredMessages.slice(0, index);
      }
    }

    return filteredMessages.slice(-limit);
  }

  /**
     * Delete a message (soft delete)
     * @param {string} roomId - Chat room ID
     * @param {string} messageId - Message ID
     * @param {string} deletedBy - User ID who deleted the message
     * @returns {Object} Delete result
     */
  async deleteMessage(roomId, messageId, deletedBy) {
    const messages = this.messages.get(roomId) || [];
    const message = messages.find(msg => msg.id === messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    message.isDeleted = true;
    message.deletedAt = new Date().toISOString();
    message.deletedBy = deletedBy;

    // Broadcast deletion to room
    const room = this.getChatRoom(roomId);
    if (room) {
      webSocketService.io.to(`game-chat-${room.gameId}`).emit('message-deleted', {
        roomId,
        messageId,
        deletedBy
      });
    }

    return { success: true };
  }

  /**
     * Report a message
     * @param {Object} reportData - Report data
     * @returns {Object} The created report
     */
  async reportMessage(reportData) {
    const { reporterId, reportedUserId, reportedMessageId, reportType, description, roomId } = reportData;

    const reportId = uuidv4();
    const report = {
      id: reportId,
      reporterId,
      reportedUserId,
      reportedMessageId,
      reportType,
      description,
      roomId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.reports.set(reportId, report);

    // Notify moderators via WebSocket
    webSocketService.io.to('moderators').emit('new-report', report);

    return report;
  }

  /**
     * Get chat room info including participant count
     * @param {string} roomId - Chat room ID
     * @returns {Object} Room info
     */
  async getChatRoomInfo(roomId) {
    const room = this.getChatRoom(roomId);
    if (!room) {
      return null;
    }

    const participants = this.participants.get(roomId) || new Set();
    const messageCount = (this.messages.get(roomId) || []).filter(msg => !msg.isDeleted).length;

    return {
      ...room,
      participantCount: participants.size,
      messageCount,
      participants: Array.from(participants)
    };
  }

  /**
     * Moderate a user (mute, kick, ban)
     * @param {Object} actionData - Moderation action data
     * @returns {Object} The moderation action
     */
  async moderateUser(actionData) {
    const { actionType, moderatorId, targetUserId, targetRoomId, reason, durationMinutes } = actionData;

    const actionId = uuidv4();
    const action = {
      id: actionId,
      actionType,
      moderatorId,
      targetUserId,
      targetRoomId,
      reason,
      durationMinutes,
      createdAt: new Date().toISOString()
    };

    this.moderationActions.set(actionId, action);

    // Apply the action
    switch (actionType) {
    case 'kick':
      if (targetRoomId && targetUserId) {
        await this.leaveChatRoom(targetRoomId, targetUserId);
        // Notify user they were kicked
        webSocketService.notifyUser(targetUserId, {
          type: 'kicked_from_chat',
          roomId: targetRoomId,
          reason
        });
      }
      break;
    case 'mute':
      // In production, update user's muted status in database
      webSocketService.notifyUser(targetUserId, {
        type: 'muted_in_chat',
        roomId: targetRoomId,
        duration: durationMinutes,
        reason
      });
      break;
    }

    return action;
  }

  /**
     * Clean up expired chat rooms
     * @returns {Object} Cleanup result
     */
  async cleanupExpiredRooms() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [roomId, room] of this.chatRooms) {
      if (new Date(room.expiresAt) < now) {
        room.isActive = false;

        // Clean up after 7 days
        const expiredDate = new Date(room.expiresAt);
        expiredDate.setDate(expiredDate.getDate() + 7);

        if (expiredDate < now) {
          this.chatRooms.delete(roomId);
          this.gameRooms.delete(room.gameId);
          this.messages.delete(roomId);
          this.participants.delete(roomId);
          cleanedCount++;
        }
      }
    }

    return { cleanedCount };
  }

  /**
     * Get moderation stats
     * @returns {Object} Moderation statistics
     */
  getModerationStats() {
    const pendingReports = Array.from(this.reports.values()).filter(r => r.status === 'pending').length;
    const totalActions = this.moderationActions.size;

    return {
      pendingReports,
      totalActions,
      activeRooms: Array.from(this.chatRooms.values()).filter(r => r.isActive).length,
      totalRooms: this.chatRooms.size
    };
  }
}

module.exports = new ChatRoomService();
