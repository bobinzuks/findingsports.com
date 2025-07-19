const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Mock user data
const mockUsers = {
    regular: {
        id: 'user-1',
        username: 'testuser',
        email: 'testuser@example.com',
        role: 'user',
        permissions: {},
        warning_count: 0
    },
    moderator: {
        id: 'mod-1',
        username: 'testmod',
        email: 'testmod@example.com',
        role: 'moderator',
        permissions: {
            can_mute: true,
            can_kick: true,
            can_delete_messages: true,
            can_ban: false
        },
        warning_count: 0
    },
    admin: {
        id: 'admin-1',
        username: 'testadmin',
        email: 'testadmin@example.com',
        role: 'admin',
        permissions: {
            can_mute: true,
            can_kick: true,
            can_delete_messages: true,
            can_ban: true,
            can_manage_moderators: true
        },
        warning_count: 0
    },
    banned: {
        id: 'banned-1',
        username: 'banneduser',
        email: 'banned@example.com',
        role: 'user',
        permissions: {},
        banned_until: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
        ban_reason: 'Violating community guidelines',
        warning_count: 3
    }
};

// Generate JWT tokens
function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

// Create mock game data
function createMockGame(overrides = {}) {
    return {
        id: uuidv4(),
        sport: 'basketball',
        venue_id: 'venue-1',
        venue_name: 'Test Community Center',
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        time: '19:00',
        duration: 60,
        skill_level: 'intermediate',
        max_players: 10,
        current_players: 5,
        organizer_id: mockUsers.regular.id,
        status: 'active',
        created_at: new Date().toISOString(),
        ...overrides
    };
}

// Create mock chat room
function createMockChatRoom(gameId, overrides = {}) {
    return {
        id: uuidv4(),
        game_id: gameId,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 172800000).toISOString(), // 48 hours
        is_active: true,
        is_locked: false,
        participant_count: 0,
        ...overrides
    };
}

// Create mock message
function createMockMessage(roomId, userId, overrides = {}) {
    return {
        id: uuidv4(),
        room_id: roomId,
        user_id: userId,
        content: 'Test message content',
        message_type: 'text',
        created_at: new Date().toISOString(),
        edited_at: null,
        is_deleted: false,
        ...overrides
    };
}

// Create mock report
function createMockReport(reporterId, overrides = {}) {
    return {
        id: uuidv4(),
        reporter_id: reporterId,
        report_type: 'harassment',
        description: 'User is sending inappropriate messages',
        status: 'pending',
        created_at: new Date().toISOString(),
        resolved_at: null,
        resolved_by: null,
        ...overrides
    };
}

// Database cleanup helper
async function cleanupTestData(db) {
    // This would clean up test data from database
    // For now, just clear in-memory stores
    if (global.users) global.users.clear();
    if (global.games) global.games.clear();
    if (global.chatRooms) global.chatRooms.clear();
    if (global.messages) global.messages.clear();
    if (global.reports) global.reports.clear();
    if (global.moderationActions) global.moderationActions.clear();
}

// Initialize test data stores
function initializeTestStores() {
    global.users = new Map();
    global.games = new Map();
    global.chatRooms = new Map();
    global.messages = new Map();
    global.reports = new Map();
    global.moderationActions = new Map();
    global.bannedWords = new Set(['spam', 'offensive', 'inappropriate']);
    
    // Add mock users to store
    Object.values(mockUsers).forEach(user => {
        global.users.set(user.id, { ...user });
    });
}

// WebSocket test client helper
class MockSocketClient {
    constructor() {
        this.events = new Map();
        this.emittedEvents = [];
        this.rooms = new Set();
        this.id = uuidv4();
    }

    on(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(handler);
    }

    emit(event, data) {
        this.emittedEvents.push({ event, data, timestamp: new Date().toISOString() });
        
        // Simulate server response for certain events
        if (event === 'authenticate' && data) {
            const handlers = this.events.get('authenticated') || [];
            handlers.forEach(handler => handler({ userId: 'user-1' }));
        }
    }

    join(room) {
        this.rooms.add(room);
    }

    leave(room) {
        this.rooms.delete(room);
    }

    to(room) {
        return {
            emit: (event, data) => {
                this.emittedEvents.push({ event, data, room, timestamp: new Date().toISOString() });
            }
        };
    }

    disconnect() {
        const handlers = this.events.get('disconnect') || [];
        handlers.forEach(handler => handler());
    }

    getEmittedEvents(event = null) {
        if (event) {
            return this.emittedEvents.filter(e => e.event === event);
        }
        return this.emittedEvents;
    }

    clearEmittedEvents() {
        this.emittedEvents = [];
    }
}

// Message filter helper
function filterMessage(content, bannedWords = global.bannedWords) {
    if (!content || !bannedWords) return { filtered: false, content };
    
    const lowerContent = content.toLowerCase();
    let filtered = false;
    let filteredContent = content;
    
    bannedWords.forEach(word => {
        if (lowerContent.includes(word.toLowerCase())) {
            filtered = true;
            const regex = new RegExp(word, 'gi');
            filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
        }
    });
    
    return { filtered, content: filteredContent };
}

// Permission checker helper
function hasPermission(user, permission) {
    if (!user) return false;
    
    // Admins have all permissions
    if (user.role === 'admin') return true;
    
    // Check specific permissions for moderators
    if (user.role === 'moderator' && user.permissions) {
        return user.permissions[permission] === true;
    }
    
    // Regular users have no special permissions
    return false;
}

// Rate limit simulator
class RateLimiter {
    constructor(maxRequests = 10, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }

    check(userId) {
        const now = Date.now();
        const userRequests = this.requests.get(userId) || [];
        
        // Remove old requests outside the window
        const validRequests = userRequests.filter(timestamp => 
            now - timestamp < this.windowMs
        );
        
        if (validRequests.length >= this.maxRequests) {
            return { allowed: false, retryAfter: this.windowMs / 1000 };
        }
        
        validRequests.push(now);
        this.requests.set(userId, validRequests);
        
        return { allowed: true };
    }

    reset(userId = null) {
        if (userId) {
            this.requests.delete(userId);
        } else {
            this.requests.clear();
        }
    }
}

module.exports = {
    mockUsers,
    generateToken,
    createMockGame,
    createMockChatRoom,
    createMockMessage,
    createMockReport,
    cleanupTestData,
    initializeTestStores,
    MockSocketClient,
    filterMessage,
    hasPermission,
    RateLimiter,
    JWT_SECRET
};