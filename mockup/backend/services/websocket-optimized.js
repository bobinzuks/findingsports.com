const socketIO = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');

class OptimizedWebSocketService {
  constructor() {
    this.io = null;
    this.pubClient = null;
    this.subClient = null;

    // Connection pools by type
    this.connectionPools = {
      games: new Map(),      // gameId -> Set of socket ids
      locations: new Map(),  // location -> Set of socket ids
      channels: new Map(),   // channel -> Set of socket ids
      users: new Map()       // userId -> Set of socket ids (multiple devices)
    };

    // Message batching
    this.messageBatch = new Map(); // roomId -> array of pending messages
    this.batchInterval = null;
    this.batchSize = 50;
    this.batchDelay = 100; // ms

    // Performance metrics
    this.metrics = {
      messagesPerSecond: 0,
      connectionsPerSecond: 0,
      activeConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      lastReset: Date.now()
    };

    // Rate limiting
    this.rateLimits = new Map(); // socketId -> { count, resetTime }
    this.rateLimitWindow = 60000; // 1 minute
    this.rateLimitMax = 100; // max messages per minute

    // Connection state tracking
    this.connectionStates = new Map(); // socketId -> state object
  }

  async initialize(server, options = {}) {
    // Redis adapter for horizontal scaling
    if (options.redisUrl) {
      this.pubClient = new Redis(options.redisUrl);
      this.subClient = this.pubClient.duplicate();
    }

    this.io = socketIO(server, {
      cors: {
        origin: options.corsOrigin || true,
        credentials: true
      },
      // Performance optimizations
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      maxHttpBufferSize: 1e8, // 100 MB
      // Connection pooling
      perMessageDeflate: {
        threshold: 1024 // Compress messages larger than 1KB
      },
      // Allow batching
      allowEIO3: true
    });

    // Use Redis adapter for multi-server support
    if (this.pubClient && this.subClient) {
      this.io.adapter(createAdapter(this.pubClient, this.subClient));
    }

    // Start message batching
    this.startBatching();

    // Start metrics collection
    this.startMetricsCollection();

    // Set up connection handlers
    this.setupConnectionHandlers();
  }

  setupConnectionHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  async handleConnection(socket) {
    // Track connection
    this.metrics.activeConnections++;
    this.metrics.connectionsPerSecond++;

    // Initialize connection state
    this.connectionStates.set(socket.id, {
      userId: null,
      authenticated: false,
      joinedRooms: new Set(),
      lastActivity: Date.now(),
      messageCount: 0
    });

    console.log(`WebSocket connected: ${socket.id} (Total: ${this.metrics.activeConnections})`);

    // Authentication handler with connection pooling
    socket.on('authenticate', async (token) => {
      try {
        const jwt = require('jsonwebtoken');
        // SECURITY: Fail securely if JWT_SECRET is not available
        if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
          console.error('🚨 SECURITY ERROR: JWT_SECRET not set in production');
          socket.emit('auth-error', { error: 'Server configuration error' });
          return;
        }
        const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-finding-sports-insecure-development-only';
        const decoded = jwt.verify(token, jwtSecret);

        const state = this.connectionStates.get(socket.id);
        state.userId = decoded.id;
        state.authenticated = true;

        // Add to user connection pool (support multiple devices)
        if (!this.connectionPools.users.has(decoded.id)) {
          this.connectionPools.users.set(decoded.id, new Set());
        }
        this.connectionPools.users.get(decoded.id).add(socket.id);

        socket.emit('authenticated', { userId: decoded.id });
      } catch (error) {
        socket.emit('auth-error', { error: 'Invalid token' });
      }
    });

    // Optimized room joining
    socket.on('join-game', (gameId) => {
      this.joinPool(socket, 'games', gameId, `game-${gameId}`);
    });

    socket.on('leave-game', (gameId) => {
      this.leavePool(socket, 'games', gameId, `game-${gameId}`);
    });

    socket.on('subscribe-location', (location) => {
      this.joinPool(socket, 'locations', location, `location-${location}`);
    });

    socket.on('unsubscribe-location', (location) => {
      this.leavePool(socket, 'locations', location, `location-${location}`);
    });

    // Optimized message handling with batching
    socket.on('game-message', (data) => {
      if (this.checkRateLimit(socket.id)) {
        this.queueMessage(`game-${data.gameId}`, 'new-message', {
          gameId: data.gameId,
          userId: this.connectionStates.get(socket.id).userId,
          message: data.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Channel message handling with batching
    socket.on('send-message', (data) => {
      if (this.checkRateLimit(socket.id)) {
        const { channel, message } = data;

        // Add metadata
        message.id = this.generateMessageId();
        message.timestamp = new Date().toISOString();

        this.queueMessage(`channel-${channel}`, 'channel-message', {
          channel,
          message
        });

        this.metrics.messagesReceived++;
      }
    });

    // Efficient typing indicators with debouncing
    this.setupTypingIndicators(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Heartbeat for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
      const state = this.connectionStates.get(socket.id);
      if (state) state.lastActivity = Date.now();
    });
  }

  // Connection pool management
  joinPool(socket, poolType, poolId, roomName) {
    const pool = this.connectionPools[poolType];

    if (!pool.has(poolId)) {
      pool.set(poolId, new Set());
    }

    pool.get(poolId).add(socket.id);
    socket.join(roomName);

    const state = this.connectionStates.get(socket.id);
    if (state) {
      state.joinedRooms.add(roomName);
    }

    socket.emit(`joined-${poolType}`, { id: poolId });
  }

  leavePool(socket, poolType, poolId, roomName) {
    const pool = this.connectionPools[poolType];

    if (pool.has(poolId)) {
      pool.get(poolId).delete(socket.id);

      // Clean up empty pools
      if (pool.get(poolId).size === 0) {
        pool.delete(poolId);
      }
    }

    socket.leave(roomName);

    const state = this.connectionStates.get(socket.id);
    if (state) {
      state.joinedRooms.delete(roomName);
    }
  }

  // Message batching system
  queueMessage(room, event, data) {
    if (!this.messageBatch.has(room)) {
      this.messageBatch.set(room, []);
    }

    this.messageBatch.get(room).push({ event, data });

    // Send immediately if batch is full
    if (this.messageBatch.get(room).length >= this.batchSize) {
      this.flushBatch(room);
    }
  }

  flushBatch(room) {
    const batch = this.messageBatch.get(room);
    if (!batch || batch.length === 0) return;

    // Send all messages in a single emit
    this.io.to(room).emit('message-batch', batch);
    this.metrics.messagesSent += batch.length;

    // Clear the batch
    this.messageBatch.set(room, []);
  }

  startBatching() {
    this.batchInterval = setInterval(() => {
      // Flush all pending batches
      for (const [room] of this.messageBatch) {
        this.flushBatch(room);
      }
    }, this.batchDelay);
  }

  // Rate limiting
  checkRateLimit(socketId) {
    const now = Date.now();
    const limit = this.rateLimits.get(socketId);

    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(socketId, {
        count: 1,
        resetTime: now + this.rateLimitWindow
      });
      return true;
    }

    if (limit.count >= this.rateLimitMax) {
      this.io.to(socketId).emit('rate-limit-exceeded', {
        retryAfter: limit.resetTime - now
      });
      return false;
    }

    limit.count++;
    return true;
  }

  // Typing indicators with debouncing
  setupTypingIndicators(socket) {
    const typingTimers = new Map();

    socket.on('start-typing', (data) => {
      const { channel, userName } = data;

      // Clear existing timer
      if (typingTimers.has(channel)) {
        clearTimeout(typingTimers.get(channel));
      }

      // Broadcast typing indicator
      socket.to(`channel-${channel}`).emit('user-typing', {
        userId: socket.id,
        userName,
        channel
      });

      // Auto-stop typing after 3 seconds
      const timer = setTimeout(() => {
        socket.to(`channel-${channel}`).emit('user-stopped-typing', {
          userId: socket.id,
          channel
        });
        typingTimers.delete(channel);
      }, 3000);

      typingTimers.set(channel, timer);
    });

    socket.on('stop-typing', (data) => {
      const { channel } = data;

      if (typingTimers.has(channel)) {
        clearTimeout(typingTimers.get(channel));
        typingTimers.delete(channel);
      }

      socket.to(`channel-${channel}`).emit('user-stopped-typing', {
        userId: socket.id,
        channel
      });
    });

    // Clean up timers on disconnect
    socket.on('disconnect', () => {
      typingTimers.forEach(timer => clearTimeout(timer));
      typingTimers.clear();
    });
  }

  // Handle disconnection
  handleDisconnection(socket) {
    this.metrics.activeConnections--;

    const state = this.connectionStates.get(socket.id);

    if (state) {
      // Remove from user pool
      if (state.userId && this.connectionPools.users.has(state.userId)) {
        const userSockets = this.connectionPools.users.get(state.userId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          this.connectionPools.users.delete(state.userId);
        }
      }

      // Clean up all pool memberships
      Object.entries(this.connectionPools).forEach(([poolType, pools]) => {
        pools.forEach((sockets, poolId) => {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);

            if (sockets.size === 0) {
              pools.delete(poolId);
            }
          }
        });
      });
    }

    // Clean up state
    this.connectionStates.delete(socket.id);
    this.rateLimits.delete(socket.id);

    console.log(`WebSocket disconnected: ${socket.id} (Total: ${this.metrics.activeConnections})`);
  }

  // Metrics collection
  startMetricsCollection() {
    setInterval(() => {
      const now = Date.now();
      const elapsed = (now - this.metrics.lastReset) / 1000;

      this.metrics.messagesPerSecond = this.metrics.messagesSent / elapsed;
      this.metrics.connectionsPerSecond = this.metrics.connectionsPerSecond / elapsed;

      // Log metrics
      console.log('WebSocket Metrics:', {
        activeConnections: this.metrics.activeConnections,
        messagesPerSecond: Math.round(this.metrics.messagesPerSecond * 100) / 100,
        connectionsPerSecond: Math.round(this.metrics.connectionsPerSecond * 100) / 100,
        totalMessagesSent: this.metrics.messagesSent,
        totalMessagesReceived: this.metrics.messagesReceived
      });

      // Reset counters
      this.metrics.messagesSent = 0;
      this.metrics.messagesReceived = 0;
      this.metrics.connectionsPerSecond = 0;
      this.metrics.lastReset = now;
    }, 60000); // Every minute
  }

  // Public methods for server-side events
  broadcastToGame(gameId, event, data) {
    this.queueMessage(`game-${gameId}`, event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  broadcastToLocation(location, event, data) {
    this.queueMessage(`location-${location}`, event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  sendToUser(userId, event, data) {
    const userSockets = this.connectionPools.users.get(userId);

    if (userSockets) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  // Get detailed statistics
  getDetailedStats() {
    const poolStats = {};

    Object.entries(this.connectionPools).forEach(([poolType, pools]) => {
      poolStats[poolType] = {
        totalPools: pools.size,
        totalConnections: Array.from(pools.values()).reduce((sum, set) => sum + set.size, 0),
        largestPool: Math.max(0, ...Array.from(pools.values()).map(set => set.size))
      };
    });

    return {
      metrics: this.metrics,
      pools: poolStats,
      messageBatchQueueSize: Array.from(this.messageBatch.values()).reduce((sum, batch) => sum + batch.length, 0),
      rateLimitedConnections: Array.from(this.rateLimits.values()).filter(limit => limit.count >= this.rateLimitMax).length
    };
  }

  // Generate unique message ID
  generateMessageId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup method
  async shutdown() {
    // Stop batching
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
    }

    // Flush all pending messages
    for (const [room] of this.messageBatch) {
      this.flushBatch(room);
    }

    // Close Redis connections
    if (this.pubClient) await this.pubClient.quit();
    if (this.subClient) await this.subClient.quit();

    // Close socket.io
    if (this.io) {
      await this.io.close();
    }
  }
}

module.exports = new OptimizedWebSocketService();
