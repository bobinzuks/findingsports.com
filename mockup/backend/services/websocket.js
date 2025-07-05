const socketIO = require('socket.io');

class WebSocketService {
    constructor() {
        this.io = null;
        this.gameRooms = new Map(); // gameId -> Set of socket ids
        this.locationRooms = new Map(); // location -> Set of socket ids
        this.userSockets = new Map(); // userId -> socket id
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
            authenticatedUsers: this.userSockets.size
        };
    }
}

module.exports = new WebSocketService();
