// WebSocket client for real-time features
class WebSocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventHandlers = new Map();
    this.currentGameId = null;
    this.currentLocation = null;
  }

  // Connect to WebSocket server
  connect() {
    const wsUrl = window.location.hostname === 'localhost' ? 'ws://localhost:8080' : 'wss://findingsports.com';

    try {
      this.socket = io(wsUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }

  // Set up WebSocket event handlers
  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected = true;
      this.reconnectAttempts = 0;

      // Authenticate if we have a token
      const token = localStorage.getItem('authToken');
      if (token) {
        this.authenticate(token);
      }

      // Re-join rooms if we were in any
      if (this.currentGameId) {
        this.joinGame(this.currentGameId);
      }
      if (this.currentLocation) {
        this.subscribeToLocation(this.currentLocation);
      }

      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connected = false;
      this.emit('disconnected');
    });

    this.socket.on('authenticated', data => {
      console.log('WebSocket authenticated:', data.userId);
      this.emit('authenticated', data);
    });

    this.socket.on('auth-error', data => {
      console.error('WebSocket auth error:', data);
      this.emit('auth-error', data);
    });

    // Game-related events
    this.socket.on('game-updated', data => {
      console.log('Game updated:', data);
      this.emit('game-updated', data);
      this.updateGameUI(data);
    });

    this.socket.on('user-joined', data => {
      console.log('User joined game:', data);
      this.emit('user-joined', data);
      this.showNotification(`${data.user.name} joined the game!`);
    });

    this.socket.on('user-left', data => {
      console.log('User left game:', data);
      this.emit('user-left', data);
    });

    this.socket.on('new-game', data => {
      console.log('New game in location:', data);
      this.emit('new-game', data);
      this.showNotification(`New ${data.game.type} game in ${data.location}!`);
    });

    // Chat messages
    this.socket.on('new-message', data => {
      console.log('New message:', data);
      this.emit('new-message', data);
    });

    // General notifications
    this.socket.on('notification', data => {
      console.log('Notification:', data);
      this.emit('notification', data);
      this.showNotification(data.message);
    });

    // Chat-specific events
    this.socket.on('chat-message', data => {
      console.log('Chat message:', data);
      this.emit('chat-message', data);
    });

    this.socket.on('user-typing', data => {
      console.log('User typing:', data);
      this.emit('user-typing', data);
    });

    this.socket.on('user-stopped-typing', data => {
      console.log('User stopped typing:', data);
      this.emit('user-stopped-typing', data);
    });

    this.socket.on('message-reaction', data => {
      console.log('Message reaction:', data);
      this.emit('message-reaction', data);
    });

    this.socket.on('user-online', data => {
      console.log('User online:', data);
      this.emit('user-online', data);
    });

    this.socket.on('user-offline', data => {
      console.log('User offline:', data);
      this.emit('user-offline', data);
    });
  }

  // Authenticate with the server
  authenticate(token) {
    if (this.socket && this.connected) {
      this.socket.emit('authenticate', token);
    }
  }

  // Join a game room for real-time updates
  joinGame(gameId) {
    if (this.socket && this.connected) {
      this.currentGameId = gameId;
      this.socket.emit('join-game', gameId);
    }
  }

  // Leave a game room
  leaveGame(gameId) {
    if (this.socket && this.connected) {
      this.socket.emit('leave-game', gameId);
      if (this.currentGameId === gameId) {
        this.currentGameId = null;
      }
    }
  }

  // Subscribe to location updates
  subscribeToLocation(location) {
    if (this.socket && this.connected) {
      this.currentLocation = location;
      this.socket.emit('subscribe-location', location);
    }
  }

  // Unsubscribe from location updates
  unsubscribeFromLocation(location) {
    if (this.socket && this.connected) {
      this.socket.emit('unsubscribe-location', location);
      if (this.currentLocation === location) {
        this.currentLocation = null;
      }
    }
  }

  // Send a chat message
  sendMessage(gameId, message) {
    if (this.socket && this.connected) {
      this.socket.emit('game-message', { gameId, message });
    }
  }

  // Register event handler
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  // Remove event handler
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Emit event to registered handlers
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Update game UI with real-time data
  updateGameUI(data) {
    // Find and update the game card if it exists
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
      if (card.dataset.gameId === String(data.gameId)) {
        // Update attendee count
        const attendeesEl = card.querySelector('.attendees');
        if (attendeesEl && data.update.attendees !== undefined) {
          attendeesEl.textContent = `${data.update.attendees} attendees`;
        }

        // Add update indicator
        card.classList.add('updated');
        setTimeout(() => card.classList.remove('updated'), 2000);
      }
    });
  }

  // Show browser notification
  showNotification(message) {
    // Check if browser supports notifications
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Finding Sports', {
        body: message,
        icon: '/favicon.ico',
        badge: '/badge.png'
      });
      // Close notification after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } else {
      // Fallback to in-app notification
      this.showInAppNotification(message);
    }
  }

  // Show in-app notification
  showInAppNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'in-app-notification';
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

// Create global WebSocket client instance
window.wsClient = new WebSocketClient();
