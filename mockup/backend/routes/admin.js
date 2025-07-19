const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const bcrypt = require('bcrypt');

// Get all users with stats
router.get('/users', authenticateAdmin, (req, res) => {
    const users = Array.from(global.users.values());
    
    const stats = {
        totalUsers: users.length,
        totalModerators: users.filter(u => u.role === 'moderator' || u.role === 'admin').length,
        bannedUsers: users.filter(u => u.bannedUntil && new Date(u.bannedUntil) > new Date()).length,
        pendingReports: 0 // Would come from reports database
    };
    
    // Don't send password hashes
    const sanitizedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        picture: user.picture,
        createdAt: user.createdAt,
        bannedUntil: user.bannedUntil,
        banReason: user.banReason,
        warningCount: user.warningCount
    }));
    
    res.json({
        users: sanitizedUsers,
        stats
    });
});

// Update user role
router.put('/users/:userId/role', authenticateAdmin, (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['user', 'moderator', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    
    const user = global.users.get(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't allow users to change their own role
    if (userId === req.user.id) {
        return res.status(400).json({ error: 'Cannot change your own role' });
    }
    
    user.role = role;
    global.users.set(userId, user);
    
    res.json({ success: true, message: 'Role updated successfully' });
});

// Unban user
router.post('/users/:userId/unban', authenticateAdmin, (req, res) => {
    const { userId } = req.params;
    
    const user = global.users.get(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    user.bannedUntil = null;
    user.banReason = null;
    global.users.set(userId, user);
    
    res.json({ success: true, message: 'User unbanned successfully' });
});

// Create test users
router.post('/create-test-users', authenticateAdmin, async (req, res) => {
    const testUsers = [
        {
            email: 'admin@findingsports.com',
            password: 'admin123',
            name: 'Admin User',
            username: 'admin',
            role: 'admin'
        },
        {
            email: 'mod@findingsports.com',
            password: 'mod123',
            name: 'Moderator User',
            username: 'moderator',
            role: 'moderator'
        },
        {
            email: 'user@findingsports.com',
            password: 'user123',
            name: 'Regular User',
            username: 'regularuser',
            role: 'user'
        }
    ];
    
    let created = 0;
    
    for (const testUser of testUsers) {
        // Check if user already exists
        let exists = false;
        for (const [id, u] of global.users) {
            if (u.email === testUser.email) {
                exists = true;
                break;
            }
        }
        
        if (!exists) {
            const passwordHash = await bcrypt.hash(testUser.password, 10);
            const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const user = {
                id: userId,
                email: testUser.email,
                username: testUser.username,
                name: testUser.name,
                passwordHash,
                provider: 'local',
                role: testUser.role,
                permissions: {},
                bannedUntil: null,
                banReason: null,
                warningCount: 0,
                createdAt: new Date().toISOString(),
                onboarded: true,
                preferences: {}
            };
            
            global.users.set(userId, user);
            created++;
        }
    }
    
    res.json({ success: true, created, message: `Created ${created} test users` });
});

// Get system stats
router.get('/stats', authenticateAdmin, (req, res) => {
    const users = Array.from(global.users.values());
    
    res.json({
        users: {
            total: users.length,
            byRole: {
                admin: users.filter(u => u.role === 'admin').length,
                moderator: users.filter(u => u.role === 'moderator').length,
                user: users.filter(u => u.role === 'user').length
            },
            banned: users.filter(u => u.bannedUntil && new Date(u.bannedUntil) > new Date()).length,
            warned: users.filter(u => u.warningCount > 0).length
        },
        system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version
        }
    });
});

module.exports = router;