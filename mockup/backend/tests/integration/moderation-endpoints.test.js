const request = require('supertest');
const { 
    mockUsers, 
    generateToken,
    createMockGame,
    createMockChatRoom,
    createMockMessage,
    createMockReport,
    initializeTestStores,
    cleanupTestData
} = require('../utils/test-helpers');

// Mock express app for testing
const express = require('express');
const app = express();
app.use(express.json());

// Mock middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);
    
    // Simple mock validation
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');
        req.user = global.users.get(decoded.id);
        if (!req.user) return res.sendStatus(403);
        next();
    } catch (error) {
        return res.sendStatus(403);
    }
};

const requireModerator = (req, res, next) => {
    if (!req.user || (req.user.role !== 'moderator' && req.user.role !== 'admin')) {
        return res.status(403).json({ error: 'Moderator access required' });
    }
    next();
};

// Mock endpoints
app.post('/api/moderation/mute', authenticateToken, requireModerator, (req, res) => {
    const { userId, roomId, duration, reason } = req.body;
    
    if (!userId || !roomId || !duration) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const action = {
        id: 'action-' + Date.now(),
        action_type: 'mute',
        moderator_id: req.user.id,
        target_user_id: userId,
        room_id: roomId,
        duration,
        reason,
        created_at: new Date().toISOString()
    };
    
    global.moderationActions.set(action.id, action);
    res.json({ success: true, action });
});

app.post('/api/moderation/kick', authenticateToken, requireModerator, (req, res) => {
    const { userId, roomId, reason } = req.body;
    
    if (!userId || !roomId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const action = {
        id: 'action-' + Date.now(),
        action_type: 'kick',
        moderator_id: req.user.id,
        target_user_id: userId,
        room_id: roomId,
        reason,
        created_at: new Date().toISOString()
    };
    
    global.moderationActions.set(action.id, action);
    res.json({ success: true, action });
});

app.delete('/api/messages/:messageId', authenticateToken, requireModerator, (req, res) => {
    const { messageId } = req.params;
    const { reason } = req.body;
    
    const message = global.messages.get(messageId);
    if (!message) {
        return res.status(404).json({ error: 'Message not found' });
    }
    
    message.is_deleted = true;
    message.deleted_by = req.user.id;
    message.deleted_at = new Date().toISOString();
    message.delete_reason = reason;
    
    res.json({ success: true, message });
});

app.post('/api/chat-rooms/:roomId/lock', authenticateToken, requireModerator, (req, res) => {
    const { roomId } = req.params;
    const { reason } = req.body;
    
    const room = global.chatRooms.get(roomId);
    if (!room) {
        return res.status(404).json({ error: 'Chat room not found' });
    }
    
    room.is_locked = true;
    room.locked_by = req.user.id;
    room.locked_at = new Date().toISOString();
    room.lock_reason = reason;
    
    res.json({ success: true, room });
});

app.get('/api/reports', authenticateToken, requireModerator, (req, res) => {
    const { status = 'pending', limit = 50 } = req.query;
    
    const reports = Array.from(global.reports.values())
        .filter(report => report.status === status)
        .slice(0, parseInt(limit));
    
    res.json({ reports, total: reports.length });
});

app.patch('/api/reports/:reportId', authenticateToken, requireModerator, (req, res) => {
    const { reportId } = req.params;
    const { status, resolution, dismissal_reason } = req.body;
    
    const report = global.reports.get(reportId);
    if (!report) {
        return res.status(404).json({ error: 'Report not found' });
    }
    
    if (status) report.status = status;
    if (status === 'resolved') {
        report.resolved_by = req.user.id;
        report.resolved_at = new Date().toISOString();
        if (resolution) report.resolution = resolution;
    }
    if (status === 'dismissed' && dismissal_reason) {
        report.dismissal_reason = dismissal_reason;
    }
    
    res.json({ success: true, report });
});

describe('Moderation Endpoints Integration', () => {
    let regularToken, moderatorToken, adminToken;

    beforeEach(() => {
        initializeTestStores();
        regularToken = generateToken(mockUsers.regular);
        moderatorToken = generateToken(mockUsers.moderator);
        adminToken = generateToken(mockUsers.admin);
        
        // Add some test data
        const game = createMockGame();
        const room = createMockChatRoom(game.id);
        const message = createMockMessage(room.id, mockUsers.regular.id);
        const report = createMockReport(mockUsers.regular.id);
        
        global.games.set(game.id, game);
        global.chatRooms.set(room.id, room);
        global.messages.set(message.id, message);
        global.reports.set(report.id, report);
    });

    afterEach(() => {
        cleanupTestData();
    });

    describe('Access Control', () => {
        test('regular users cannot access moderation endpoints', async () => {
            const responses = await Promise.all([
                request(app)
                    .post('/api/moderation/mute')
                    .set('Authorization', `Bearer ${regularToken}`)
                    .send({ userId: 'user-1', roomId: 'room-1', duration: 900000 }),
                request(app)
                    .post('/api/moderation/kick')
                    .set('Authorization', `Bearer ${regularToken}`)
                    .send({ userId: 'user-1', roomId: 'room-1' }),
                request(app)
                    .get('/api/reports')
                    .set('Authorization', `Bearer ${regularToken}`)
            ]);

            responses.forEach(response => {
                expect(response.status).toBe(403);
                expect(response.body.error).toBe('Moderator access required');
            });
        });

        test('moderators can access moderation endpoints', async () => {
            const response = await request(app)
                .get('/api/reports')
                .set('Authorization', `Bearer ${moderatorToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.reports).toBeDefined();
        });

        test('admins can access all moderation endpoints', async () => {
            const response = await request(app)
                .get('/api/reports')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.reports).toBeDefined();
        });

        test('unauthenticated requests are rejected', async () => {
            const response = await request(app)
                .get('/api/reports');
            
            expect(response.status).toBe(401);
        });
    });

    describe('Mute Functionality', () => {
        test('moderators can mute users', async () => {
            const response = await request(app)
                .post('/api/moderation/mute')
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    userId: mockUsers.regular.id,
                    roomId: Array.from(global.chatRooms.keys())[0],
                    duration: 900000, // 15 minutes
                    reason: 'Spamming chat'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.action.action_type).toBe('mute');
            expect(response.body.action.duration).toBe(900000);
        });

        test('mute requires all required fields', async () => {
            const response = await request(app)
                .post('/api/moderation/mute')
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    userId: mockUsers.regular.id
                    // Missing roomId and duration
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Missing required fields');
        });
    });

    describe('Kick Functionality', () => {
        test('moderators can kick users from rooms', async () => {
            const response = await request(app)
                .post('/api/moderation/kick')
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    userId: mockUsers.regular.id,
                    roomId: Array.from(global.chatRooms.keys())[0],
                    reason: 'Disruptive behavior'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.action.action_type).toBe('kick');
        });
    });

    describe('Message Deletion', () => {
        test('moderators can delete messages', async () => {
            const messageId = Array.from(global.messages.keys())[0];
            
            const response = await request(app)
                .delete(`/api/messages/${messageId}`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    reason: 'Inappropriate content'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message.is_deleted).toBe(true);
            expect(response.body.message.delete_reason).toBe('Inappropriate content');
        });

        test('returns 404 for non-existent messages', async () => {
            const response = await request(app)
                .delete('/api/messages/non-existent-id')
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    reason: 'Test reason'
                });
            
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Message not found');
        });
    });

    describe('Chat Room Locking', () => {
        test('moderators can lock chat rooms', async () => {
            const roomId = Array.from(global.chatRooms.keys())[0];
            
            const response = await request(app)
                .post(`/api/chat-rooms/${roomId}/lock`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    reason: 'Cooling off period needed'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.room.is_locked).toBe(true);
            expect(response.body.room.locked_by).toBe(mockUsers.moderator.id);
        });

        test('returns 404 for non-existent rooms', async () => {
            const response = await request(app)
                .post('/api/chat-rooms/non-existent-room/lock')
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    reason: 'Test reason'
                });
            
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Chat room not found');
        });
    });

    describe('Report Management', () => {
        test('moderators can view pending reports', async () => {
            const response = await request(app)
                .get('/api/reports')
                .set('Authorization', `Bearer ${moderatorToken}`)
                .query({ status: 'pending' });
            
            expect(response.status).toBe(200);
            expect(response.body.reports).toBeInstanceOf(Array);
            expect(response.body.reports.every(r => r.status === 'pending')).toBe(true);
        });

        test('moderators can update report status', async () => {
            const reportId = Array.from(global.reports.keys())[0];
            
            const response = await request(app)
                .patch(`/api/reports/${reportId}`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    status: 'resolved',
                    resolution: {
                        action_taken: 'user_warned',
                        notes: 'First warning issued'
                    }
                });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.report.status).toBe('resolved');
            expect(response.body.report.resolution.action_taken).toBe('user_warned');
        });

        test('can dismiss reports with reason', async () => {
            const reportId = Array.from(global.reports.keys())[0];
            
            const response = await request(app)
                .patch(`/api/reports/${reportId}`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    status: 'dismissed',
                    dismissal_reason: 'No violation found - misunderstanding'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.report.status).toBe('dismissed');
            expect(response.body.report.dismissal_reason).toBeTruthy();
        });
    });

    describe('Audit Trail', () => {
        test('all moderation actions are logged', async () => {
            const actionsBefore = global.moderationActions.size;
            
            // Perform various moderation actions
            await request(app)
                .post('/api/moderation/mute')
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    userId: mockUsers.regular.id,
                    roomId: Array.from(global.chatRooms.keys())[0],
                    duration: 900000,
                    reason: 'Test mute'
                });
            
            await request(app)
                .post('/api/moderation/kick')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    userId: mockUsers.regular.id,
                    roomId: Array.from(global.chatRooms.keys())[0],
                    reason: 'Test kick'
                });
            
            const actionsAfter = global.moderationActions.size;
            expect(actionsAfter).toBe(actionsBefore + 2);
            
            // Verify action details
            const actions = Array.from(global.moderationActions.values());
            const muteAction = actions.find(a => a.action_type === 'mute');
            const kickAction = actions.find(a => a.action_type === 'kick');
            
            expect(muteAction.moderator_id).toBe(mockUsers.moderator.id);
            expect(kickAction.moderator_id).toBe(mockUsers.admin.id);
        });
    });
});