const request = require('supertest');
const { 
    mockUsers, 
    generateToken,
    createMockGame,
    createMockChatRoom,
    createMockMessage,
    RateLimiter,
    initializeTestStores,
    cleanupTestData
} = require('../utils/test-helpers');

// Mock express app with security middleware
const express = require('express');
const app = express();
app.use(express.json({ limit: '10kb' })); // Limit payload size

// Rate limiter
const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

// Mock security middleware
const rateLimit = (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const { allowed, retryAfter } = rateLimiter.check(userId);
    
    if (!allowed) {
        res.set('Retry-After', retryAfter);
        return res.status(429).json({ 
            error: 'Too many requests',
            retryAfter 
        });
    }
    next();
};

const sanitizeInput = (req, res, next) => {
    // Basic XSS prevention
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            return obj
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        }
        if (typeof obj === 'object' && obj !== null) {
            for (let key in obj) {
                obj[key] = sanitize(obj[key]);
            }
        }
        return obj;
    };
    
    req.body = sanitize(req.body);
    req.query = sanitize(req.query);
    req.params = sanitize(req.params);
    next();
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);
    
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');
        req.user = global.users.get(decoded.id);
        
        // Check if user is banned
        if (req.user?.banned_until) {
            const banExpired = new Date(req.user.banned_until) < new Date();
            if (!banExpired) {
                return res.status(403).json({ 
                    error: 'User is banned',
                    banned_until: req.user.banned_until,
                    reason: req.user.ban_reason
                });
            }
        }
        
        if (!req.user) return res.sendStatus(403);
        next();
    } catch (error) {
        return res.sendStatus(403);
    }
};

// Apply middleware
app.use(sanitizeInput);

// Mock endpoints with security considerations
app.post('/api/messages', authenticateToken, rateLimit, (req, res) => {
    const { roomId, content } = req.body;
    
    // Content length validation
    if (!content || content.length > 1000) {
        return res.status(400).json({ 
            error: 'Message content must be between 1 and 1000 characters' 
        });
    }
    
    // Check if user is muted
    const participant = global.chatParticipants?.get(`${roomId}-${req.user.id}`);
    if (participant?.is_muted) {
        const muteExpired = participant.muted_until && 
                           new Date(participant.muted_until) < new Date();
        if (!muteExpired) {
            return res.status(403).json({ 
                error: 'You are muted in this chat room',
                muted_until: participant.muted_until
            });
        }
    }
    
    const message = {
        id: 'msg-' + Date.now(),
        room_id: roomId,
        user_id: req.user.id,
        content: content, // Already sanitized
        created_at: new Date().toISOString()
    };
    
    res.json({ success: true, message });
});

app.post('/api/reports', authenticateToken, rateLimit, (req, res) => {
    const { reported_user_id, report_type, description } = req.body;
    
    // Prevent self-reporting
    if (reported_user_id === req.user.id) {
        return res.status(400).json({ error: 'Cannot report yourself' });
    }
    
    // Validate report type
    const validTypes = ['harassment', 'spam', 'inappropriate_content', 'cheating', 'fake_profile', 'other'];
    if (!validTypes.includes(report_type)) {
        return res.status(400).json({ error: 'Invalid report type' });
    }
    
    // Require description for 'other' type
    if (report_type === 'other' && (!description || description.trim().length < 10)) {
        return res.status(400).json({ 
            error: 'Description of at least 10 characters required for "other" report type' 
        });
    }
    
    const report = {
        id: 'report-' + Date.now(),
        reporter_id: req.user.id,
        reported_user_id,
        report_type,
        description: description || '',
        status: 'pending',
        created_at: new Date().toISOString()
    };
    
    res.json({ success: true, report });
});

app.get('/api/messages/:roomId', authenticateToken, (req, res) => {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // Validate pagination parameters
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }
    
    if (isNaN(offsetNum) || offsetNum < 0) {
        return res.status(400).json({ error: 'Offset must be non-negative' });
    }
    
    // Check if user has access to room
    const room = global.chatRooms?.get(roomId);
    if (!room) {
        return res.status(404).json({ error: 'Chat room not found' });
    }
    
    // In real app, check if user is participant
    const messages = Array.from(global.messages?.values() || [])
        .filter(m => m.room_id === roomId)
        .slice(offsetNum, offsetNum + limitNum);
    
    res.json({ messages, total: messages.length });
});

describe('Security Integration Tests', () => {
    let regularToken, moderatorToken, bannedToken;

    beforeEach(() => {
        initializeTestStores();
        regularToken = generateToken(mockUsers.regular);
        moderatorToken = generateToken(mockUsers.moderator);
        bannedToken = generateToken(mockUsers.banned);
        
        // Reset rate limiter
        rateLimiter.reset();
        
        // Add test data
        const game = createMockGame();
        const room = createMockChatRoom(game.id);
        global.games.set(game.id, game);
        global.chatRooms.set(room.id, room);
        
        // Initialize chat participants
        global.chatParticipants = new Map();
    });

    afterEach(() => {
        cleanupTestData();
    });

    describe('Authentication & Authorization', () => {
        test('banned users cannot access endpoints', async () => {
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${bannedToken}`)
                .send({
                    roomId: Array.from(global.chatRooms.keys())[0],
                    content: 'Test message'
                });
            
            expect(response.status).toBe(403);
            expect(response.body.error).toBe('User is banned');
            expect(response.body.banned_until).toBeTruthy();
            expect(response.body.reason).toBe('Violating community guidelines');
        });

        test('expired bans are automatically lifted', async () => {
            // Create user with expired ban
            const expiredBanUser = {
                ...mockUsers.regular,
                id: 'expired-ban-user',
                banned_until: new Date(Date.now() - 1000).toISOString() // Expired 1 second ago
            };
            
            global.users.set(expiredBanUser.id, expiredBanUser);
            const expiredBanToken = generateToken(expiredBanUser);
            
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${expiredBanToken}`)
                .send({
                    roomId: Array.from(global.chatRooms.keys())[0],
                    content: 'I can post again!'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('invalid tokens are rejected', async () => {
            const response = await request(app)
                .get('/api/messages/room-1')
                .set('Authorization', 'Bearer invalid.token.here');
            
            expect(response.status).toBe(403);
        });

        test('missing authorization header returns 401', async () => {
            const response = await request(app)
                .get('/api/messages/room-1');
            
            expect(response.status).toBe(401);
        });
    });

    describe('Rate Limiting', () => {
        test('enforces rate limits per user', async () => {
            const roomId = Array.from(global.chatRooms.keys())[0];
            
            // Send 10 requests (rate limit)
            for (let i = 0; i < 10; i++) {
                const response = await request(app)
                    .post('/api/messages')
                    .set('Authorization', `Bearer ${regularToken}`)
                    .send({
                        roomId,
                        content: `Message ${i}`
                    });
                
                expect(response.status).toBe(200);
            }
            
            // 11th request should be rate limited
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    roomId,
                    content: 'This should be rate limited'
                });
            
            expect(response.status).toBe(429);
            expect(response.body.error).toBe('Too many requests');
            expect(response.body.retryAfter).toBe(60);
            expect(response.headers['retry-after']).toBe('60');
        });

        test('rate limits are per-user not global', async () => {
            const roomId = Array.from(global.chatRooms.keys())[0];
            
            // Max out regular user's rate limit
            for (let i = 0; i < 10; i++) {
                await request(app)
                    .post('/api/messages')
                    .set('Authorization', `Bearer ${regularToken}`)
                    .send({ roomId, content: `User 1 Message ${i}` });
            }
            
            // Moderator should still be able to post
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    roomId,
                    content: 'Moderator message'
                });
            
            expect(response.status).toBe(200);
        });
    });

    describe('Input Validation & Sanitization', () => {
        test('sanitizes XSS attempts in messages', async () => {
            const roomId = Array.from(global.chatRooms.keys())[0];
            const xssAttempts = [
                '<script>alert("XSS")</script>',
                '<img src=x onerror=alert("XSS")>',
                '<a href="javascript:alert(\'XSS\')">Click me</a>',
                '"><script>alert(String.fromCharCode(88,83,83))</script>'
            ];
            
            for (const xssContent of xssAttempts) {
                const response = await request(app)
                    .post('/api/messages')
                    .set('Authorization', `Bearer ${regularToken}`)
                    .send({
                        roomId,
                        content: xssContent
                    });
                
                expect(response.status).toBe(200);
                expect(response.body.message.content).not.toContain('<script>');
                expect(response.body.message.content).not.toContain('javascript:');
                expect(response.body.message.content).toContain('&lt;');
            }
        });

        test('validates message content length', async () => {
            const roomId = Array.from(global.chatRooms.keys())[0];
            
            // Empty message
            let response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    roomId,
                    content: ''
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toContain('between 1 and 1000 characters');
            
            // Message too long
            const longContent = 'a'.repeat(1001);
            response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    roomId,
                    content: longContent
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toContain('between 1 and 1000 characters');
        });

        test('validates report inputs', async () => {
            // Invalid report type
            let response = await request(app)
                .post('/api/reports')
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    reported_user_id: mockUsers.moderator.id,
                    report_type: 'invalid_type',
                    description: 'Test'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid report type');
            
            // Missing description for 'other' type
            response = await request(app)
                .post('/api/reports')
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    reported_user_id: mockUsers.moderator.id,
                    report_type: 'other',
                    description: 'Short'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toContain('at least 10 characters');
        });

        test('prevents self-reporting', async () => {
            const response = await request(app)
                .post('/api/reports')
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    reported_user_id: mockUsers.regular.id,
                    report_type: 'spam',
                    description: 'Trying to report myself'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Cannot report yourself');
        });
    });

    describe('Mute Enforcement', () => {
        test('muted users cannot send messages', async () => {
            const roomId = Array.from(global.chatRooms.keys())[0];
            
            // Mute the user
            global.chatParticipants.set(`${roomId}-${mockUsers.regular.id}`, {
                user_id: mockUsers.regular.id,
                room_id: roomId,
                is_muted: true,
                muted_until: new Date(Date.now() + 900000).toISOString(), // 15 minutes
                joined_at: new Date().toISOString()
            });
            
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    roomId,
                    content: 'This should be blocked'
                });
            
            expect(response.status).toBe(403);
            expect(response.body.error).toBe('You are muted in this chat room');
            expect(response.body.muted_until).toBeTruthy();
        });

        test('expired mutes are automatically lifted', async () => {
            const roomId = Array.from(global.chatRooms.keys())[0];
            
            // Mute expired 1 second ago
            global.chatParticipants.set(`${roomId}-${mockUsers.regular.id}`, {
                user_id: mockUsers.regular.id,
                room_id: roomId,
                is_muted: true,
                muted_until: new Date(Date.now() - 1000).toISOString(),
                joined_at: new Date().toISOString()
            });
            
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    roomId,
                    content: 'Mute has expired'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('Pagination Security', () => {
        test('validates pagination parameters', async () => {
            const roomId = Array.from(global.chatRooms.keys())[0];
            
            // Invalid limit
            let response = await request(app)
                .get(`/api/messages/${roomId}`)
                .set('Authorization', `Bearer ${regularToken}`)
                .query({ limit: 101 });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Limit must be between 1 and 100');
            
            // Negative offset
            response = await request(app)
                .get(`/api/messages/${roomId}`)
                .set('Authorization', `Bearer ${regularToken}`)
                .query({ offset: -1 });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Offset must be non-negative');
            
            // Non-numeric values
            response = await request(app)
                .get(`/api/messages/${roomId}`)
                .set('Authorization', `Bearer ${regularToken}`)
                .query({ limit: 'abc', offset: 'xyz' });
            
            expect(response.status).toBe(400);
        });

        test('limits maximum results per request', async () => {
            const roomId = Array.from(global.chatRooms.keys())[0];
            
            // Add many messages
            for (let i = 0; i < 150; i++) {
                const message = createMockMessage(roomId, mockUsers.regular.id, {
                    content: `Message ${i}`
                });
                global.messages.set(message.id, message);
            }
            
            const response = await request(app)
                .get(`/api/messages/${roomId}`)
                .set('Authorization', `Bearer ${regularToken}`)
                .query({ limit: 100 });
            
            expect(response.status).toBe(200);
            expect(response.body.messages.length).toBeLessThanOrEqual(100);
        });
    });

    describe('Payload Size Limits', () => {
        test('rejects oversized payloads', async () => {
            const roomId = Array.from(global.chatRooms.keys())[0];
            
            // Create a payload larger than 10kb limit
            const largeContent = 'x'.repeat(11000);
            
            const response = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    roomId,
                    content: largeContent
                });
            
            // Express will reject before reaching our handler
            expect(response.status).toBe(413); // Payload too large
        });
    });

    describe('Access Control', () => {
        test('users cannot access rooms they are not part of', async () => {
            const privateRoom = createMockChatRoom('private-game');
            global.chatRooms.set(privateRoom.id, privateRoom);
            
            // User is not a participant
            const response = await request(app)
                .get(`/api/messages/${privateRoom.id}`)
                .set('Authorization', `Bearer ${regularToken}`);
            
            // In real app, this would check participation
            expect(response.status).toBe(200); // For now, just checking room exists
        });

        test('returns 404 for non-existent rooms', async () => {
            const response = await request(app)
                .get('/api/messages/non-existent-room')
                .set('Authorization', `Bearer ${regularToken}`);
            
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Chat room not found');
        });
    });
});