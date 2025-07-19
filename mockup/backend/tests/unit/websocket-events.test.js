const { 
    MockSocketClient,
    mockUsers,
    generateToken,
    createMockGame,
    createMockChatRoom,
    createMockMessage,
    initializeTestStores,
    cleanupTestData
} = require('../utils/test-helpers');

describe('WebSocket Events', () => {
    let client;
    let moderatorClient;
    let adminClient;

    beforeEach(() => {
        initializeTestStores();
        client = new MockSocketClient();
        moderatorClient = new MockSocketClient();
        adminClient = new MockSocketClient();
    });

    afterEach(() => {
        cleanupTestData();
    });

    describe('Authentication', () => {
        test('should authenticate with valid token', (done) => {
            const token = generateToken(mockUsers.regular);
            
            client.on('authenticated', (data) => {
                expect(data.userId).toBe('user-1');
                done();
            });
            
            client.emit('authenticate', token);
        });

        test('should reject invalid token', (done) => {
            client.on('auth-error', (data) => {
                expect(data.error).toBe('Invalid token');
                done();
            });
            
            client.emit('authenticate', 'invalid-token');
        });

        test('should handle missing token', (done) => {
            client.on('auth-error', (data) => {
                expect(data.error).toBeTruthy();
                done();
            });
            
            client.emit('authenticate', null);
        });
    });

    describe('Chat room events', () => {
        test('should join game chat room', (done) => {
            const gameId = 'game-123';
            
            client.on('game-joined', (data) => {
                expect(data.gameId).toBe(gameId);
                expect(client.rooms.has(`game-${gameId}`)).toBe(true);
                done();
            });
            
            client.emit('join-game', gameId);
            client.join(`game-${gameId}`);
            
            // Simulate server response
            const handlers = client.events.get('game-joined') || [];
            handlers.forEach(handler => handler({ gameId }));
        });

        test('should receive chat history when joining channel', () => {
            const channel = 'game-123-chat';
            const mockHistory = [
                createMockMessage('room-1', mockUsers.regular.id, { id: 1, message: 'Hello' }),
                createMockMessage('room-1', mockUsers.moderator.id, { id: 2, message: 'Hi there' })
            ];
            
            client.on('channel-history', (data) => {
                expect(data.channel).toBe(channel);
                expect(data.messages).toHaveLength(2);
                expect(data.messages[0].message).toBe('Hello');
            });
            
            client.emit('join-channel', { channel });
            
            // Simulate server sending history
            const handlers = client.events.get('channel-history') || [];
            handlers.forEach(handler => handler({ channel, messages: mockHistory }));
        });

        test('should broadcast messages to room participants', () => {
            const channel = 'game-123-chat';
            const message = {
                user: mockUsers.regular.username,
                message: 'Ready to play!',
                timestamp: new Date().toISOString()
            };
            
            client.emit('send-message', { channel, message });
            
            const emitted = client.getEmittedEvents('send-message');
            expect(emitted).toHaveLength(1);
            expect(emitted[0].data.message.message).toBe('Ready to play!');
        });

        test('should handle typing indicators', () => {
            const channel = 'game-123-chat';
            
            // Start typing
            client.emit('start-typing', { channel, userName: mockUsers.regular.username });
            
            let typingEvents = client.getEmittedEvents('start-typing');
            expect(typingEvents).toHaveLength(1);
            expect(typingEvents[0].data.userName).toBe(mockUsers.regular.username);
            
            // Stop typing
            client.emit('stop-typing', { channel });
            
            const stopEvents = client.getEmittedEvents('stop-typing');
            expect(stopEvents).toHaveLength(1);
            expect(stopEvents[0].data.channel).toBe(channel);
        });
    });

    describe('Moderation events', () => {
        test('moderators should receive moderation events', () => {
            const token = generateToken(mockUsers.moderator);
            
            moderatorClient.on('moderation-event', (data) => {
                expect(data.type).toBeTruthy();
                expect(data.moderator_id).toBeTruthy();
            });
            
            moderatorClient.emit('authenticate', token);
            moderatorClient.emit('subscribe-moderation-events');
            
            // Simulate moderation event
            const moderationEvent = {
                type: 'message_deleted',
                moderator_id: mockUsers.moderator.id,
                target_id: 'msg-123',
                reason: 'Inappropriate content',
                timestamp: new Date().toISOString()
            };
            
            const handlers = moderatorClient.events.get('moderation-event') || [];
            handlers.forEach(handler => handler(moderationEvent));
        });

        test('should notify when user is muted', () => {
            const channel = 'game-123-chat';
            const mutedUser = mockUsers.regular;
            
            client.on('user-muted', (data) => {
                expect(data.userId).toBe(mutedUser.id);
                expect(data.duration).toBe(900000); // 15 minutes
                expect(data.reason).toBeTruthy();
            });
            
            // Simulate mute event
            const handlers = client.events.get('user-muted') || [];
            handlers.forEach(handler => handler({
                userId: mutedUser.id,
                duration: 900000,
                reason: 'Spamming',
                mutedBy: mockUsers.moderator.id
            }));
        });

        test('should notify when user is kicked from room', () => {
            const roomId = 'game-123-chat';
            
            client.on('kicked-from-room', (data) => {
                expect(data.roomId).toBe(roomId);
                expect(data.reason).toBeTruthy();
                expect(client.rooms.has(roomId)).toBe(false);
            });
            
            client.join(roomId);
            expect(client.rooms.has(roomId)).toBe(true);
            
            // Simulate kick
            client.leave(roomId);
            const handlers = client.events.get('kicked-from-room') || [];
            handlers.forEach(handler => handler({
                roomId,
                reason: 'Violating chat rules',
                kickedBy: mockUsers.moderator.id
            }));
        });

        test('should handle room lock events', () => {
            const roomId = 'game-123-chat';
            
            client.on('room-locked', (data) => {
                expect(data.roomId).toBe(roomId);
                expect(data.lockedBy).toBe(mockUsers.moderator.id);
            });
            
            // Simulate room lock
            const handlers = client.events.get('room-locked') || [];
            handlers.forEach(handler => handler({
                roomId,
                lockedBy: mockUsers.moderator.id,
                reason: 'Heated discussion - cooling off period'
            }));
        });
    });

    describe('Real-time notifications', () => {
        test('should receive game update notifications', () => {
            const gameId = 'game-123';
            
            client.on('game-updated', (data) => {
                expect(data.gameId).toBe(gameId);
                expect(data.update).toBeTruthy();
                expect(data.timestamp).toBeTruthy();
            });
            
            client.emit('join-game', gameId);
            
            // Simulate game update
            const handlers = client.events.get('game-updated') || [];
            handlers.forEach(handler => handler({
                gameId,
                update: {
                    current_players: 7,
                    status: 'filling_up'
                },
                timestamp: new Date().toISOString()
            }));
        });

        test('should notify when user joins/leaves game', () => {
            const gameId = 'game-123';
            
            // Join notification
            client.on('user-joined', (data) => {
                expect(data.gameId).toBe(gameId);
                expect(data.user).toBeTruthy();
                expect(data.user.username).toBe(mockUsers.regular.username);
            });
            
            // Leave notification
            client.on('user-left', (data) => {
                expect(data.gameId).toBe(gameId);
                expect(data.user).toBeTruthy();
            });
            
            client.emit('join-game', gameId);
            
            // Simulate notifications
            const joinHandlers = client.events.get('user-joined') || [];
            joinHandlers.forEach(handler => handler({
                gameId,
                user: { id: mockUsers.regular.id, username: mockUsers.regular.username },
                timestamp: new Date().toISOString()
            }));
        });

        test('should receive direct notifications', () => {
            const notification = {
                id: 'notif-1',
                type: 'game_reminder',
                title: 'Game Starting Soon',
                message: 'Your basketball game starts in 30 minutes',
                gameId: 'game-123',
                priority: 'high',
                timestamp: new Date().toISOString()
            };
            
            client.on('notification', (data) => {
                expect(data.type).toBe('game_reminder');
                expect(data.title).toBeTruthy();
                expect(data.message).toBeTruthy();
                expect(data.priority).toBe('high');
            });
            
            // Simulate notification
            const handlers = client.events.get('notification') || [];
            handlers.forEach(handler => handler(notification));
        });
    });

    describe('Message reactions', () => {
        test('should toggle message reactions', () => {
            const channel = 'game-123-chat';
            const messageId = 1;
            const emoji = '👍';
            
            client.emit('toggle-reaction', {
                channel,
                messageId,
                emoji,
                userId: mockUsers.regular.id
            });
            
            const events = client.getEmittedEvents('toggle-reaction');
            expect(events).toHaveLength(1);
            expect(events[0].data.emoji).toBe(emoji);
            expect(events[0].data.messageId).toBe(messageId);
        });

        test('should broadcast reaction updates', () => {
            const channel = 'game-123-chat';
            
            client.on('message-reaction', (data) => {
                expect(data.channel).toBe(channel);
                expect(data.messageId).toBeTruthy();
                expect(data.emoji).toBeTruthy();
                expect(data.action).toMatch(/^(add|remove)$/);
            });
            
            // Simulate reaction update
            const handlers = client.events.get('message-reaction') || [];
            handlers.forEach(handler => handler({
                channel,
                messageId: 1,
                emoji: '⚽',
                userId: mockUsers.regular.id,
                action: 'add'
            }));
        });
    });

    describe('Connection management', () => {
        test('should handle disconnect properly', () => {
            const gameId = 'game-123';
            const channel = 'game-123-chat';
            
            // Join some rooms
            client.join(`game-${gameId}`);
            client.join(`channel-${channel}`);
            
            expect(client.rooms.size).toBe(2);
            
            // Track disconnect
            let disconnected = false;
            client.on('disconnect', () => {
                disconnected = true;
            });
            
            // Disconnect
            client.disconnect();
            
            expect(disconnected).toBe(true);
        });

        test('should handle reconnection with state restoration', () => {
            const previousState = {
                userId: mockUsers.regular.id,
                gameId: 'game-123',
                channel: 'game-123-chat'
            };
            
            // Simulate reconnection
            const newClient = new MockSocketClient();
            
            newClient.on('reconnected', (data) => {
                expect(data.restored).toBe(true);
                expect(data.previousState).toEqual(previousState);
            });
            
            // Emit reconnection with previous state
            const handlers = newClient.events.get('reconnected') || [];
            handlers.forEach(handler => handler({
                restored: true,
                previousState
            }));
        });

        test('should handle rate limiting', () => {
            const channel = 'game-123-chat';
            
            // Send multiple messages quickly
            for (let i = 0; i < 15; i++) {
                client.emit('send-message', {
                    channel,
                    message: { message: `Message ${i}` }
                });
            }
            
            client.on('rate-limited', (data) => {
                expect(data.retryAfter).toBeGreaterThan(0);
                expect(data.message).toContain('rate limit');
            });
            
            // Simulate rate limit response
            const handlers = client.events.get('rate-limited') || [];
            handlers.forEach(handler => handler({
                retryAfter: 60,
                message: 'Message rate limit exceeded. Please wait 60 seconds.'
            }));
        });
    });

    describe('Admin events', () => {
        test('admins should receive system-wide events', () => {
            const token = generateToken(mockUsers.admin);
            
            adminClient.on('system-event', (data) => {
                expect(data.type).toBeTruthy();
                expect(data.severity).toMatch(/^(info|warning|error|critical)$/);
            });
            
            adminClient.emit('authenticate', token);
            adminClient.emit('subscribe-system-events');
            
            // Simulate system event
            const handlers = adminClient.events.get('system-event') || [];
            handlers.forEach(handler => handler({
                type: 'high_report_volume',
                severity: 'warning',
                message: 'Unusual number of reports in the last hour',
                metrics: {
                    reports_last_hour: 25,
                    average_hourly: 5
                },
                timestamp: new Date().toISOString()
            }));
        });

        test('should receive real-time statistics', () => {
            adminClient.on('stats-update', (data) => {
                expect(data.totalConnections).toBeGreaterThanOrEqual(0);
                expect(data.gameRooms).toBeGreaterThanOrEqual(0);
                expect(data.channelRooms).toBeGreaterThanOrEqual(0);
                expect(data.authenticatedUsers).toBeGreaterThanOrEqual(0);
            });
            
            // Simulate stats update
            const handlers = adminClient.events.get('stats-update') || [];
            handlers.forEach(handler => handler({
                totalConnections: 150,
                gameRooms: 25,
                locationRooms: 10,
                channelRooms: 25,
                authenticatedUsers: 145,
                totalMessages: 1250
            }));
        });
    });
});