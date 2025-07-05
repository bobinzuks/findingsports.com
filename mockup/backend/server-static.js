const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    credentials: true
}));
app.use(express.json());

// IMPORTANT: Serve static files from mockup directory
app.use(express.static(path.join(__dirname, '..')));

// In-memory database (replace with real database in production)
const users = new Map();
const sessions = new Map();

// Create demo user
(async () => {
    const demoPasswordHash = await bcrypt.hash('demo123', 10);
    users.set('demo-user', {
        id: 'demo-user',
        email: 'demo@example.com',
        username: 'demo_user',
        name: 'Demo User',
        passwordHash: demoPasswordHash,
        provider: 'local',
        createdAt: new Date().toISOString(),
        onboarded: true,
        preferences: {
            location: 'vancouver',
            sports: ['basketball', 'soccer'],
            mcpServers: ['mcp-vancouver-rec'],
            timePreferences: ['weekday-evening', 'weekend-afternoon']
        }
    });
})();

// Environment variables (set these in Railway)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Helper functions
function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Auth middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.sendStatus(403);
    }

    req.user = users.get(decoded.id);
    next();
}

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Traditional login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    let user = null;
    for (const [id, u] of users) {
        if (u.email === email) {
            user = u;
            break;
        }
    }

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            picture: user.picture,
            onboarded: user.onboarded
        }
    });
});

// Traditional registration
app.post('/api/auth/register', async (req, res) => {
    const { email, password, username, name } = req.body;

    // Check if user exists
    for (const [id, u] of users) {
        if (u.email === email) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        if (u.username === username) {
            return res.status(400).json({ error: 'Username already taken' });
        }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user = {
        id: userId,
        email,
        username,
        name: name || username,
        passwordHash,
        provider: 'local',
        createdAt: new Date().toISOString(),
        onboarded: false,
        preferences: {}
    };

    users.set(userId, user);

    // Generate token
    const token = generateToken(user);

    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            onboarded: false
        },
        isNewUser: true
    });
});

// Google OAuth login
app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;

    try {
        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        // Find or create user
        let user = null;
        for (const [id, u] of users) {
            if (u.googleId === payload.sub || u.email === payload.email) {
                user = u;
                // Update Google ID if needed
                if (!u.googleId) {
                    u.googleId = payload.sub;
                }
                break;
            }
        }

        let isNewUser = false;
        if (!user) {
            // Create new user
            const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            user = {
                id: userId,
                email: payload.email,
                username: payload.email.split('@')[0],
                name: payload.name,
                picture: payload.picture,
                googleId: payload.sub,
                provider: 'google',
                emailVerified: payload.email_verified,
                createdAt: new Date().toISOString(),
                onboarded: false,
                preferences: {}
            };
            users.set(userId, user);
            isNewUser = true;
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                name: user.name,
                picture: user.picture,
                onboarded: user.onboarded
            },
            isNewUser
        });

    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({
        user: {
            id: req.user.id,
            email: req.user.email,
            username: req.user.username,
            name: req.user.name,
            picture: req.user.picture,
            onboarded: req.user.onboarded,
            preferences: req.user.preferences
        }
    });
});

// Update user preferences (onboarding)
app.post('/api/users/preferences', authenticateToken, (req, res) => {
    const { location, sports, mcpServers, timePreferences } = req.body;

    // Update user preferences
    req.user.preferences = {
        location,
        sports,
        mcpServers,
        timePreferences,
        updatedAt: new Date().toISOString()
    };
    req.user.onboarded = true;

    res.json({
        success: true,
        preferences: req.user.preferences
    });
});

// Get user preferences
app.get('/api/users/preferences', authenticateToken, (req, res) => {
    res.json({
        preferences: req.user.preferences || {},
        onboarded: req.user.onboarded || false
    });
});

// Logout (optional - JWT is stateless)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    // In a real app, you might want to blacklist the token
    res.json({ success: true });
});

// Games API (demo data)
app.get('/api/games', (req, res) => {
    const { location, sport } = req.query;
    
    // Demo games data
    const games = [
        {
            id: 1,
            type: 'basketball',
            title: 'Pick-up Basketball',
            location: 'North Vancouver',
            venue: 'Hillcrest Centre',
            coords: [49.3200, -123.0724],
            attendees: 6,
            maxAttendees: 10,
            host: { name: 'Luke', id: 'user_luke' },
            date: '2025-01-06T18:00:00Z',
            indoor: true
        },
        {
            id: 2,
            type: 'soccer',
            title: 'Drop-in Soccer',
            location: 'Vancouver',
            venue: 'UBC Fields',
            coords: [49.2606, -123.2460],
            attendees: 12,
            maxAttendees: 22,
            host: { name: 'Carlos', id: 'user_carlos' },
            date: '2025-01-07T16:00:00Z',
            indoor: false
        }
    ];

    // Filter by location and sport if provided
    let filteredGames = games;
    if (location) {
        filteredGames = filteredGames.filter(g => 
            g.location.toLowerCase().includes(location.toLowerCase())
        );
    }
    if (sport && sport !== 'any') {
        filteredGames = filteredGames.filter(g => g.type === sport);
    }

    res.json({ games: filteredGames });
});

// Join game
app.post('/api/games/:gameId/join', authenticateToken, (req, res) => {
    const { gameId } = req.params;
    
    // In a real app, this would update the database
    res.json({
        success: true,
        gameId,
        message: 'Successfully joined the game!'
    });
});

// Create game
app.post('/api/games', authenticateToken, (req, res) => {
    const gameData = req.body;
    
    const newGame = {
        id: Date.now(),
        ...gameData,
        host: {
            id: req.user.id,
            name: req.user.name || req.user.username
        },
        attendees: 1,
        createdAt: new Date().toISOString()
    };

    res.json({
        success: true,
        game: newGame
    });
});

// IMPORTANT: Catch-all route - serve index.html for client-side routing
app.get('*', (req, res) => {
    // Don't serve index for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Not found' });
    }
    
    // Serve the appropriate HTML file
    if (req.path.includes('login')) {
        res.sendFile(path.join(__dirname, '..', 'login-google.html'));
    } else if (req.path.includes('onboarding')) {
        res.sendFile(path.join(__dirname, '..', 'onboarding', 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Finding Sports backend running on http://0.0.0.0:${PORT}`);
    console.log('Environment:', {
        port: PORT,
        nodeEnv: process.env.NODE_ENV,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        corsOrigin: process.env.CORS_ORIGIN || 'all'
    });
});