const express = require('express');
const router = express.Router();
const chatRoomService = require('../services/chat-room-service');
const { authenticateToken } = require('../middleware/auth');

// Get chat room info for a game
router.get('/:gameId/chat', async (req, res) => {
  try {
    const { gameId } = req.params;
    const room = chatRoomService.getChatRoomByGameId(gameId);

    if (!room) {
      return res.status(404).json({ error: 'Chat room not found for this game' });
    }

    const roomInfo = await chatRoomService.getChatRoomInfo(room.id);
    res.json({ room: roomInfo });
  } catch (error) {
    console.error('Error getting chat room:', error);
    res.status(500).json({ error: 'Failed to get chat room info' });
  }
});

// Join game chat room
router.post('/:gameId/chat/join', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    let room = chatRoomService.getChatRoomByGameId(gameId);

    // Create room if it doesn't exist (for existing games)
    if (!room) {
      // In production, fetch game details from database
      const game = {
        id: gameId,
        sport: 'Sport',
        location: 'Location',
        dateTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
      };

      room = await chatRoomService.createGameChatRoom(game, userId);
    }

    const result = await chatRoomService.joinChatRoom(room.id, userId);

    // Join WebSocket room
    if (req.socket) {
      req.socket.join(`game-chat-${gameId}`);
    }

    res.json(result);
  } catch (error) {
    console.error('Error joining chat room:', error);
    res.status(400).json({ error: error.message });
  }
});

// Leave game chat room
router.post('/:gameId/chat/leave', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    const room = chatRoomService.getChatRoomByGameId(gameId);
    if (!room) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    const result = await chatRoomService.leaveChatRoom(room.id, userId);

    // Leave WebSocket room
    if (req.socket) {
      req.socket.leave(`game-chat-${gameId}`);
    }

    res.json(result);
  } catch (error) {
    console.error('Error leaving chat room:', error);
    res.status(500).json({ error: 'Failed to leave chat room' });
  }
});

// Get chat messages
router.get('/:gameId/chat/messages', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { limit = 50, before } = req.query;

    const room = chatRoomService.getChatRoomByGameId(gameId);
    if (!room) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // Check if user is a participant
    const roomInfo = await chatRoomService.getChatRoomInfo(room.id);
    if (!roomInfo.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'You must join the chat room first' });
    }

    const messages = await chatRoomService.getMessages(
      room.id,
      parseInt(limit, 10),
      before
    );

    res.json({ messages });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send a message
router.post('/:gameId/chat/messages', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { content, parentMessageId } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    }

    const room = chatRoomService.getChatRoomByGameId(gameId);
    if (!room) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    const message = await chatRoomService.sendMessage(
      room.id,
      userId,
      content.trim(),
      parentMessageId
    );

    // Add user info to message for response
    message.user = {
      id: req.user.id,
      name: req.user.name || req.user.username,
      picture: req.user.picture
    };

    res.json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete a message
router.delete('/:gameId/chat/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { gameId, messageId } = req.params;
    const userId = req.user.id;

    const room = chatRoomService.getChatRoomByGameId(gameId);
    if (!room) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // In production, check if user owns the message or is a moderator
    const result = await chatRoomService.deleteMessage(room.id, messageId, userId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(400).json({ error: error.message });
  }
});

// Report a message
router.post('/:gameId/chat/report', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { messageId, userId: reportedUserId, reportType, description } = req.body;
    const reporterId = req.user.id;

    if (!reportType || !description) {
      return res.status(400).json({ error: 'Report type and description are required' });
    }

    const room = chatRoomService.getChatRoomByGameId(gameId);
    if (!room) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    const report = await chatRoomService.reportMessage({
      reporterId,
      reportedUserId,
      reportedMessageId: messageId,
      reportType,
      description,
      roomId: room.id
    });

    res.json({
      success: true,
      reportId: report.id,
      message: 'Report submitted successfully'
    });
  } catch (error) {
    console.error('Error reporting message:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// Moderate user (for moderators/admins)
router.post('/:gameId/chat/moderate', authenticateToken, async (req, res) => {
  try {
    // In production, check if user is a moderator
    const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';
    if (!isModerator) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { gameId } = req.params;
    const { actionType, targetUserId, reason, durationMinutes } = req.body;
    const moderatorId = req.user.id;

    if (!actionType || !targetUserId || !reason) {
      return res.status(400).json({ error: 'Action type, target user, and reason are required' });
    }

    const room = chatRoomService.getChatRoomByGameId(gameId);
    if (!room) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    const action = await chatRoomService.moderateUser({
      actionType,
      moderatorId,
      targetUserId,
      targetRoomId: room.id,
      reason,
      durationMinutes
    });

    res.json({
      success: true,
      actionId: action.id,
      message: `User ${actionType} successfully`
    });
  } catch (error) {
    console.error('Error moderating user:', error);
    res.status(500).json({ error: 'Failed to moderate user' });
  }
});

// Get moderation stats (for admins)
router.get('/moderation/stats', authenticateToken, async (req, res) => {
  try {
    // In production, check if user is an admin
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const stats = chatRoomService.getModerationStats();
    res.json({ stats });
  } catch (error) {
    console.error('Error getting moderation stats:', error);
    res.status(500).json({ error: 'Failed to get moderation stats' });
  }
});

module.exports = router;
