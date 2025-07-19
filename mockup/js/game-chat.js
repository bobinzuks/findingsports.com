/**
 * Game Chat Room Manager
 * Handles real-time chat functionality for game-specific chat rooms
 */

class GameChatManager {
  constructor() {
    this.socket = null;
    this.currentGameId = null;
    this.currentRoom = null;
    this.messages = [];
    this.typingUsers = new Set();
    this.typingTimeout = null;
  }

  /**
     * Initialize the chat manager with Socket.IO connection
     * @param {Object} socket - Socket.IO instance
     */
  initialize(socket) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  /**
     * Set up Socket.IO event listeners
     */
  setupSocketListeners() {
    // Chat room events
    this.socket.on('joined-game-chat', (data) => {
      console.log('Joined game chat:', data.gameId);
      this.onJoinedChat(data);
    });

    this.socket.on('left-game-chat', (data) => {
      console.log('Left game chat:', data.gameId);
      this.onLeftChat(data);
    });

    // Message events
    this.socket.on('chat-message', (data) => {
      if (data.roomId === this.currentRoom?.id) {
        this.onNewMessage(data.message);
      }
    });

    this.socket.on('message-deleted', (data) => {
      if (data.roomId === this.currentRoom?.id) {
        this.onMessageDeleted(data.messageId);
      }
    });

    // Typing indicators
    this.socket.on('user-typing', (data) => {
      if (data.gameId === this.currentGameId) {
        this.onUserTyping(data);
      }
    });

    this.socket.on('user-stopped-typing', (data) => {
      if (data.gameId === this.currentGameId) {
        this.onUserStoppedTyping(data);
      }
    });

    // Moderation events
    this.socket.on('kicked_from_chat', (data) => {
      this.onKickedFromChat(data);
    });

    this.socket.on('muted_in_chat', (data) => {
      this.onMutedInChat(data);
    });
  }

  /**
     * Join a game chat room
     * @param {string} gameId - Game ID
     * @returns {Promise<Object>} Chat room info
     */
  async joinGameChat(gameId) {
    try {
      // Get chat room info
      const response = await fetch(`/api/games/${gameId}/chat`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get chat room info');
      }

      const { room } = await response.json();

      // Join via API
      const joinResponse = await fetch(`/api/games/${gameId}/chat/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!joinResponse.ok) {
        throw new Error('Failed to join chat room');
      }

      // Join Socket.IO room
      this.socket.emit('join-game-chat', { gameId });

      this.currentGameId = gameId;
      this.currentRoom = room;

      // Load message history
      await this.loadMessages();

      return room;
    } catch (error) {
      console.error('Error joining game chat:', error);
      throw error;
    }
  }

  /**
     * Leave current game chat
     */
  async leaveGameChat() {
    if (!this.currentGameId) return;

    try {
      // Leave via API
      await fetch(`/api/games/${this.currentGameId}/chat/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Leave Socket.IO room
      this.socket.emit('leave-game-chat', { gameId: this.currentGameId });

      this.currentGameId = null;
      this.currentRoom = null;
      this.messages = [];
      this.typingUsers.clear();
    } catch (error) {
      console.error('Error leaving game chat:', error);
    }
  }

  /**
     * Load message history
     * @param {string} beforeId - Load messages before this ID
     */
  async loadMessages(beforeId = null) {
    if (!this.currentGameId) return;

    try {
      const params = new URLSearchParams({ limit: 50 });
      if (beforeId) params.append('before', beforeId);

      const response = await fetch(`/api/games/${this.currentGameId}/chat/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const { messages } = await response.json();

      if (beforeId) {
        // Prepend older messages
        this.messages = [...messages, ...this.messages];
      } else {
        // Initial load
        this.messages = messages;
      }

      this.renderMessages();
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  /**
     * Send a message
     * @param {string} content - Message content
     * @param {string} parentMessageId - Parent message ID for replies
     */
  async sendMessage(content, parentMessageId = null) {
    if (!this.currentGameId || !content.trim()) return;

    try {
      const response = await fetch(`/api/games/${this.currentGameId}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content, parentMessageId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      // Message will be added via Socket.IO event
      this.stopTyping();
    } catch (error) {
      console.error('Error sending message:', error);
      this.showError(error.message);
    }
  }

  /**
     * Delete a message
     * @param {string} messageId - Message ID
     */
  async deleteMessage(messageId) {
    if (!this.currentGameId) return;

    try {
      const response = await fetch(`/api/games/${this.currentGameId}/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      // Message will be updated via Socket.IO event
    } catch (error) {
      console.error('Error deleting message:', error);
      this.showError('Failed to delete message');
    }
  }

  /**
     * Report a message
     * @param {string} messageId - Message ID
     * @param {string} userId - User ID who sent the message
     * @param {string} reportType - Type of report
     * @param {string} description - Report description
     */
  async reportMessage(messageId, userId, reportType, description) {
    if (!this.currentGameId) return;

    try {
      const response = await fetch(`/api/games/${this.currentGameId}/chat/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          messageId,
          userId,
          reportType,
          description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      this.showSuccess('Report submitted successfully');
    } catch (error) {
      console.error('Error reporting message:', error);
      this.showError('Failed to submit report');
    }
  }

  /**
     * Start typing indicator
     */
  startTyping() {
    if (!this.currentGameId) return;

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Send typing event
    const userName = localStorage.getItem('userName') || 'User';
    this.socket.emit('game-chat-typing', {
      gameId: this.currentGameId,
      userName
    });

    // Auto-stop after 3 seconds
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 3000);
  }

  /**
     * Stop typing indicator
     */
  stopTyping() {
    if (!this.currentGameId) return;

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    this.socket.emit('game-chat-stop-typing', {
      gameId: this.currentGameId
    });
  }

  /**
     * Event handlers
     */
  onJoinedChat(data) {
    this.showSuccess('Joined chat room');
  }

  onLeftChat(data) {
    this.showInfo('Left chat room');
  }

  onNewMessage(message) {
    this.messages.push(message);
    this.renderNewMessage(message);
  }

  onMessageDeleted(messageId) {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.isDeleted = true;
      this.updateMessageDisplay(messageId);
    }
  }

  onUserTyping(data) {
    this.typingUsers.add(data.userId);
    this.updateTypingIndicator();
  }

  onUserStoppedTyping(data) {
    this.typingUsers.delete(data.userId);
    this.updateTypingIndicator();
  }

  onKickedFromChat(data) {
    this.showError(`You have been removed from the chat. Reason: ${data.reason}`);
    this.currentGameId = null;
    this.currentRoom = null;
    this.messages = [];
  }

  onMutedInChat(data) {
    this.showWarning(`You have been muted for ${data.duration} minutes. Reason: ${data.reason}`);
  }

  /**
     * UI Helper methods
     */
  renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    container.innerHTML = this.messages.map(msg => this.renderMessage(msg)).join('');
    container.scrollTop = container.scrollHeight;
  }

  renderNewMessage(message) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const messageEl = document.createElement('div');
    messageEl.innerHTML = this.renderMessage(message);
    container.appendChild(messageEl.firstChild);
    container.scrollTop = container.scrollHeight;
  }

  renderMessage(message) {
    if (message.isDeleted) {
      return `<div class="chat-message deleted" data-message-id="${message.id}">
                <i>Message deleted</i>
            </div>`;
    }

    const isSystem = message.messageType === 'system';
    const isOwn = message.userId === localStorage.getItem('userId');

    return `<div class="chat-message ${isSystem ? 'system' : ''} ${isOwn ? 'own' : ''}" data-message-id="${message.id}">
            ${!isSystem ? `
                <div class="message-header">
                    <span class="message-author">${message.user?.name || 'User'}</span>
                    <span class="message-time">${new Date(message.createdAt).toLocaleTimeString()}</span>
                </div>
            ` : ''}
            <div class="message-content">${this.escapeHtml(message.content)}</div>
            ${isOwn && !isSystem ? `
                <div class="message-actions">
                    <button onclick="gameChat.deleteMessage('${message.id}')" class="btn-icon">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            ` : ''}
            ${!isOwn && !isSystem ? `
                <div class="message-actions">
                    <button onclick="gameChat.showReportDialog('${message.id}', '${message.userId}')" class="btn-icon">
                        <i class="fas fa-flag"></i>
                    </button>
                </div>
            ` : ''}
        </div>`;
  }

  updateMessageDisplay(messageId) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
      messageEl.classList.add('deleted');
      messageEl.innerHTML = '<i>Message deleted</i>';
    }
  }

  updateTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (!indicator) return;

    if (this.typingUsers.size > 0) {
      const count = this.typingUsers.size;
      indicator.textContent = `${count} ${count === 1 ? 'person is' : 'people are'} typing...`;
      indicator.style.display = 'block';
    } else {
      indicator.style.display = 'none';
    }
  }

  showReportDialog(messageId, userId) {
    // Implementation would show a modal for reporting
    const reportType = prompt('Report type (spam/harassment/inappropriate_content/other):');
    if (!reportType) return;

    const description = prompt('Please describe the issue:');
    if (!description) return;

    this.reportMessage(messageId, userId, reportType, description);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showSuccess(message) {
    console.log('Success:', message);
    // Implementation would show toast notification
  }

  showError(message) {
    console.error('Error:', message);
    // Implementation would show error notification
  }

  showWarning(message) {
    console.warn('Warning:', message);
    // Implementation would show warning notification
  }

  showInfo(message) {
    console.info('Info:', message);
    // Implementation would show info notification
  }
}

// Export for use
const gameChat = new GameChatManager();
