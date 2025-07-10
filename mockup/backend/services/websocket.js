const socketIO = require('socket.io');

class WebSocketService {
    constructor() {
        this.io = null;
        this.gameRooms = new Map(); // gameId -> Set of socket ids
        this.locationRooms = new Map(); // location -> Set of socket ids
        this.userSockets = new Map(); // userId -> socket id
        this.channelRooms = new Map(); // channel -> Set of socket ids
        this.messageHistory = new Map(); // channel -> Array of messages (in-memory for demo)
        this.messageIdCounter = 1;
    }

    initialize(server, corsOrigin) {
        this.io = socketIO(server, {
            cors: {
                origin: corsOrigin || true,
                credentials: true
            }
        });

        this.io.on('connection', socket => {
            console.log('New WebSocket connection:', socket.id);

            // Handle user authentication
            socket.on('authenticate', token => {
                try {
                    const jwt = require('jsonwebtoken');
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key-change-in-production');
                    socket.userId = decoded.id;
                    this.userSockets.set(decoded.id, socket.id);
                    socket.emit('authenticated', { userId: decoded.id });
                } catch (error) {
                    socket.emit('auth-error', { error: 'Invalid token' });
                }
            });

            // Join game room for real-time updates
            socket.on('join-game', gameId => {
                socket.join(`game-${gameId}`);
                if (!this.gameRooms.has(gameId)) {
                    this.gameRooms.set(gameId, new Set());
                }
                this.gameRooms.get(gameId).add(socket.id);

                // Send current game state
                this.io.to(socket.id).emit('game-joined', { gameId });
            });

            // Leave game room
            socket.on('leave-game', gameId => {
                socket.leave(`game-${gameId}`);
                if (this.gameRooms.has(gameId)) {
                    this.gameRooms.get(gameId).delete(socket.id);
                }
            });

            // Subscribe to location updates
            socket.on('subscribe-location', location => {
                socket.join(`location-${location}`);
                if (!this.locationRooms.has(location)) {
                    this.locationRooms.set(location, new Set());
                }
                this.locationRooms.get(location).add(socket.id);
            });

            // Unsubscribe from location
            socket.on('unsubscribe-location', location => {
                socket.leave(`location-${location}`);
                if (this.locationRooms.has(location)) {
                    this.locationRooms.get(location).delete(socket.id);
                }
            });

            // Handle game chat messages
            socket.on('game-message', data => {
                if (socket.userId) {
                    this.io.to(`game-${data.gameId}`).emit('new-message', {
                        gameId: data.gameId,
                        userId: socket.userId,
                        message: data.message,
                        timestamp: new Date().toISOString()
                    });
                }
            });

            // Join chat channel
            socket.on('join-channel', data => {
                const { channel } = data;
                socket.join(`channel-${channel}`);

                if (!this.channelRooms.has(channel)) {
                    this.channelRooms.set(channel, new Set());
                }
                this.channelRooms.get(channel).add(socket.id);

                // Send message history for the channel
                const history = this.messageHistory.get(channel) || [];
                socket.emit('channel-history', { channel, messages: history.slice(-50) }); // Last 50 messages

                console.log(`Socket ${socket.id} joined channel: ${channel}`);
            });

            // Leave chat channel
            socket.on('leave-channel', data => {
                const { channel } = data;
                socket.leave(`channel-${channel}`);

                if (this.channelRooms.has(channel)) {
                    this.channelRooms.get(channel).delete(socket.id);
                }

                console.log(`Socket ${socket.id} left channel: ${channel}`);
            });

            // Handle chat messages
            socket.on('send-message', data => {
                const { channel, message } = data;

                // Add unique ID and timestamp
                message.id = this.messageIdCounter++;
                message.timestamp = new Date().toISOString();

                // Store message in history (in production, save to database)
                if (!this.messageHistory.has(channel)) {
                    this.messageHistory.set(channel, []);
                }
                const channelHistory = this.messageHistory.get(channel);
                channelHistory.push(message);

                // Keep only last 1000 messages per channel (for demo)
                if (channelHistory.length > 1000) {
                    channelHistory.shift();
                }

                // Broadcast to all users in the channel
                this.io.to(`channel-${channel}`).emit('channel-message', {
                    channel,
                    message
                });

                console.log(`Message sent to channel ${channel}:`, message.message);
            });

            // Handle typing indicators
            socket.on('start-typing', data => {
                const { channel, userName } = data;
                socket.to(`channel-${channel}`).emit('user-typing', {
                    userId: socket.id,
                    userName,
                    channel
                });
            });

            socket.on('stop-typing', data => {
                const { channel } = data;
                socket.to(`channel-${channel}`).emit('user-stopped-typing', {
                    userId: socket.id,
                    channel
                });
            });

            // Handle message reactions
            socket.on('toggle-reaction', data => {
                const { channel, messageId, emoji, userId } = data;

                // Find message in history
                const messages = this.messageHistory.get(channel) || [];
                const message = messages.find(m => m.id === messageId);

                if (message) {
                    if (!message.reactions) {
                        message.reactions = [];
                    }

                    const reaction = message.reactions.find(r => r.emoji === emoji);
                    let action = 'add';

                    if (reaction) {
                        if (!reaction.users) { reaction.users = []; }
                        const userIndex = reaction.users.indexOf(userId);

                        if (userIndex === -1) {
                            reaction.users.push(userId);
                            reaction.count++;
                        } else {
                            reaction.users.splice(userIndex, 1);
                            reaction.count--;
                            action = 'remove';

                            if (reaction.count === 0) {
                                message.reactions = message.reactions.filter(r => r.emoji !== emoji);
                            }
                        }
                    } else {
                        message.reactions.push({ emoji, count: 1, users: [userId] });
                    }

                    // Broadcast reaction update
                    this.io.to(`channel-${channel}`).emit('message-reaction', {
                        channel,
                        messageId,
                        emoji,
                        userId,
                        action
                    });
                }
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                console.log('WebSocket disconnected:', socket.id);

                // Clean up user socket mapping
                if (socket.userId) {
                    this.userSockets.delete(socket.userId);
                }

                // Clean up room memberships
                this.gameRooms.forEach((sockets, gameId) => {
                    if (sockets.has(socket.id)) {
                        sockets.delete(socket.id);
                    }
                });

                this.locationRooms.forEach((sockets, location) => {
                    if (sockets.has(socket.id)) {
                        sockets.delete(socket.id);
                    }
                });

                this.channelRooms.forEach((sockets, channel) => {
                    if (sockets.has(socket.id)) {
                        sockets.delete(socket.id);
                    }
                });
            });
        });
    }

    // Notify when a game is updated
    notifyGameUpdate(gameId, update) {
        if (this.io) {
            this.io.to(`game-${gameId}`).emit('game-updated', {
                gameId,
                update,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Notify when someone joins a game
    notifyGameJoin(gameId, user) {
        if (this.io) {
            this.io.to(`game-${gameId}`).emit('user-joined', {
                gameId,
                user,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Notify when someone leaves a game
    notifyGameLeave(gameId, user) {
        if (this.io) {
            this.io.to(`game-${gameId}`).emit('user-left', {
                gameId,
                user,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Notify about new games in a location
    notifyNewGame(location, game) {
        if (this.io) {
            this.io.to(`location-${location}`).emit('new-game', {
                location,
                game,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Send direct notification to a user
    notifyUser(userId, notification) {
        if (this.io && this.userSockets.has(userId)) {
            const socketId = this.userSockets.get(userId);
            this.io.to(socketId).emit('notification', notification);
        }
    }

    // Get connection stats
    getStats() {
        return {
            totalConnections: this.io ? this.io.sockets.sockets.size : 0,
            gameRooms: this.gameRooms.size,
            locationRooms: this.locationRooms.size,
            channelRooms: this.channelRooms.size,
            authenticatedUsers: this.userSockets.size,
            totalMessages: Array.from(this.messageHistory.values()).reduce((sum, messages) => sum + messages.length, 0)
        };
    }

    // Get channel message history (for admin/debugging)
    getChannelHistory(channel, limit = 50) {
        const messages = this.messageHistory.get(channel) || [];
        return messages.slice(-limit);
    }

    // Clear channel history (for admin use)
    clearChannelHistory(channel) {
        if (this.messageHistory.has(channel)) {
            this.messageHistory.set(channel, []);
        }
    }
}

module.exports = new WebSocketService();
