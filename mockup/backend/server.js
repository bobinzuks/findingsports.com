const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

// Initialize WebSocket service
const webSocketService = require('./services/websocket');
webSocketService.initialize(server, process.env.CORS_ORIGIN);

// Initialize data aggregation services
const { getInstance: getDataPipeline } = require('./services/data-aggregation-pipeline');
const { getInstance: getDataSwarm } = require('./services/data-aggregation-swarm');
const { getInstance: getSiteMethodsManager } = require('./services/site-methods-manager');
const { getInstance: getIntelligentCache } = require('./services/intelligent-cache');

const dataPipeline = getDataPipeline();
const dataSwarm = getDataSwarm();
const siteMethodsManager = getSiteMethodsManager();
const intelligentCache = getIntelligentCache();

// Initialize the 10-agent sports scraping swarm
const { initializeSwarmIntegration, getSwarmStatus, shutdownSwarm } = require('./integrate-swarm');

// Start data aggregation services
if (process.env.NODE_ENV !== 'production') {
    // Use in-memory queue for development
    setTimeout(() => {
        console.log('🚀 Starting enhanced data aggregation services...');
        
        // Start legacy pipeline for backwards compatibility
        dataPipeline.start();
        
        // Initialize new swarm system
        console.log('🐝 Initializing 100+ source data aggregation swarm...');
        console.log(`📊 Registered sources: ${dataSwarm.sources.size}`);
        console.log(`🧠 Site methods database: ${siteMethodsManager.methods.size} methods`);
        console.log(`💾 Intelligent cache initialized with ${intelligentCache.config.defaultTTL}s TTL`);
        
        // Warm up cache with popular searches
        setTimeout(async () => {
            try {
                console.log('🔥 Warming up cache with popular searches...');
                const warmupItems = [
                    {
                        key: 'games:basketball:any:any:10:today:drop-in',
                        fetcher: () => dataSwarm.collectFromAllSources({ sports: ['basketball'] }),
                        options: { ttl: 3600, priority: 'high' }
                    }
                ];
                await intelligentCache.warmUp(warmupItems);
            } catch (error) {
                console.error('Cache warmup failed:', error);
            }
        }, 10000);
        
        // Initialize legacy swarm after pipeline starts
        setTimeout(async () => {
            try {
                console.log('🏀 Initializing legacy 10-Agent Sports Scraping Swarm...');
                await initializeSwarmIntegration(app);
                console.log('✅ Legacy swarm integration complete');
            } catch (error) {
                console.error('❌ Legacy swarm initialization failed:', error.message);
                console.log('⚠️ Continuing with new swarm system only');
            }
        }, 5000);
    }, 2000);
}

// Initialize location agent service
const locationAgentService = require('./services/location-agent-service');
locationAgentService.setWebSocketService(webSocketService);

// Initialize BC location service
const bcLocationService = require('./services/bc-locations');

// Middleware
app.use(
    cors({
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
        credentials: true
    })
);
app.use(express.json());

// IMPORTANT: Serve static files from mockup directory
app.use(express.static(path.join(__dirname, '..')));

// In-memory database (replace with real database in production)
const users = new Map();
const sessions = new Map();

// Make users available globally for auth middleware
global.users = users;

// REMOVED: Demo user for security - users should register properly
// Demo accounts should never be hardcoded in production code

// Environment variables (set these in Railway)
// JWT_SECRET must be set in production environment
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('WARNING: JWT_SECRET not set in production! Using default (INSECURE)');
    // DO NOT EXIT - this crashes the server!
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
// Using a test client ID for development - replace with your own in production
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '386932037035-k8v833noqjk7m4t641js92fvjmm5ri71.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Helper functions
function generateToken(user) {
    return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Import auth middleware
const { authenticateToken, authenticateAdmin } = require('./middleware/auth');

// Helper function to handle location search parameters
function handleLocationSearch(location, searchParams) {
    const normalizedLocation = bcLocationService.normalizeLocationQuery(location);
    if (!normalizedLocation) {
        searchParams.location = location;
        return;
    }

    // Get coordinates for the location
    const locationCoords = bcLocationService.getCoordinates(normalizedLocation);
    if (locationCoords && (!searchParams.lat || !searchParams.lng)) {
        searchParams.lat = locationCoords.lat;
        searchParams.lng = locationCoords.lng;
        searchParams.radius = searchParams.radius || 50; // Default 50km radius
    }

    // Expand search to include nearby BC locations
    const expandedLocations = bcLocationService.expandLocationSearch(normalizedLocation, 100);
    searchParams.locations = expandedLocations;
    searchParams.location = location;
}

// Routes

// User-submitted games routes
app.use('/api/user-games', require('./routes/user-games'));

// Venue request routes
app.use('/api/venue-requests', require('./routes/venue-requests'));

// API v2 - Enhanced swarm endpoints
app.use('/api/v2', require('./routes/api-v2'));

// Play Now endpoint
app.use('/api/play-now', require('./routes/play-now'));

// Venues endpoint
app.use('/api/venues', require('./routes/venues'));

// Sports endpoint
app.use('/api/sports', require('./routes/sports'));

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
        console.log('Google auth payload:', { email: payload.email, name: payload.name });

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
        res.status(401).json({
            error: 'Authentication failed',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Google OAuth callback (for authorization code flow)
app.post('/api/auth/google/callback', async (req, res) => {
    const { code, redirectUri } = req.body;

    try {
        // For now, we're using the simpler credential-based flow
        // This endpoint is here for future OAuth2 code flow implementation
        res.status(501).json({
            error: 'OAuth code flow not implemented',
            message: 'Please use the Google Sign-In button instead'
        });
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).json({
            error: 'OAuth callback failed',
            message: error.message
        });
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

// Debug endpoint to check scraping status
app.get('/api/debug/scraping-status', (req, res) => {
    const stats = dataPipeline.getStats();
    const wsStats = webSocketService.getStats();

    res.json({
        dataAggregation: stats,
        webSocket: wsStats,
        swarmStatus: getSwarmStatus ? getSwarmStatus() : null,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
    });
});

// Debug endpoint to manually trigger scraping
app.post('/api/debug/trigger-scraping', async (req, res) => {
    try {
        console.log('Manually triggering data collection...');
        await dataPipeline.runInitialCollection();
        res.json({ success: true, message: 'Scraping jobs queued' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Games API - PUBLIC ACCESS FOR VIEWING
app.get('/api/games', async (req, res) => {
    const { location, sport, lat, lng, radius, date } = req.query;

    try {
        const searchParams = {
            sport,
            lat: lat ? parseFloat(lat) : undefined,
            lng: lng ? parseFloat(lng) : undefined,
            radius: radius ? parseInt(radius, 10) : undefined,
            date
        };

        // Handle BC location expansion
        if (location) {
            handleLocationSearch(location, searchParams);
        }

        // Get aggregated games
        const aggregatedGames = await dataPipeline.searchGames(searchParams);

        // Filter games by BC location if needed
        let filteredGames = aggregatedGames;
        if (location && !lat && !lng) {
            const normalizedLocation = bcLocationService.normalizeLocationQuery(location);
            if (normalizedLocation) {
                // Get coordinates for the location and use them for filtering
                const locationCoords = bcLocationService.getCoordinates(normalizedLocation);
                if (locationCoords) {
                    // Update search params with location coordinates
                    searchParams.lat = locationCoords.lat;
                    searchParams.lng = locationCoords.lng;
                    searchParams.radius = searchParams.radius || 50; // Default 50km radius
                    
                    // Re-search with coordinates
                    filteredGames = await dataPipeline.searchGames(searchParams);
                } else {
                    // If no coordinates found, still try to filter by location
                    filteredGames = aggregatedGames.filter(game =>
                        bcLocationService.isGameNearLocation(game, normalizedLocation, 75)
                    );
                }
            }
        }

        // Always return aggregated data (even if empty)
        return res.json({
            games: filteredGames,
            source: 'aggregated',
            searchInfo: {
                originalLocation: location,
                normalizedLocation: bcLocationService.normalizeLocationQuery(location),
                expandedSearch: searchParams.locations?.length > 1
            }
        });
    } catch (error) {
        console.error('Error fetching aggregated games:', error);
        // Return empty array on error instead of demo data
        return res.json({ games: [], source: 'error' });
    }
});

// Join game - REQUIRES AUTH
app.post('/api/games/:gameId/join', authenticateToken, (req, res) => {
    const { gameId } = req.params;

    // In a real app, this would update the database
    // Notify other users in real-time
    webSocketService.notifyGameJoin(gameId, {
        id: req.user.id,
        name: req.user.name || req.user.username
    });

    res.json({
        success: true,
        gameId,
        message: 'Successfully joined the game!'
    });
});

// Create game - REQUIRES AUTH
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

    // Notify users in this location about new game
    if (gameData.location) {
        webSocketService.notifyNewGame(gameData.location.toLowerCase(), newGame);
    }

    res.json({
        success: true,
        game: newGame
    });
});

// Note: Catch-all route moved to after swarm initialization

// WebSocket stats endpoint
app.get('/api/ws/stats', (req, res) => {
    res.json(webSocketService.getStats());
});

// Data aggregation stats endpoint
app.get('/api/data/stats', (req, res) => {
    try {
        res.json(dataPipeline.getStats());
    } catch (error) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Get available facilities
app.get('/api/facilities', async (req, res) => {
    try {
        const facilities = Array.from(dataPipeline.facilitiesDatabase.values());
        res.json({ facilities });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch facilities' });
    }
});

// BC location endpoints
app.get('/api/locations/bc', (req, res) => {
    const locations = bcLocationService.getAllLocations();
    res.json({ locations });
});

app.get('/api/locations/suggestions', (req, res) => {
    const { q } = req.query;
    const suggestions = bcLocationService.getLocationSuggestions(q);
    res.json({ suggestions });
});

app.get('/api/locations/nearby/:location', (req, res) => {
    const { location } = req.params;
    const { radius } = req.query;
    const nearby = bcLocationService.getNearbyLocations(location, radius ? parseInt(radius, 10) : 100);
    res.json({ nearby });
});

// Field status endpoint
app.get('/api/fields/status', async (req, res) => {
    try {
        const fields = Array.from(dataPipeline.facilitiesDatabase.values()).filter(
            facility => facility.type && facility.type.includes('field')
        );

        res.json({
            success: true,
            fields,
            lastUpdated: new Date()
        });
    } catch (error) {
        console.error('Error fetching field status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch field status'
        });
    }
});

// Location-based agent search endpoints
app.post('/api/location/check', (req, res) => {
    locationAgentService.checkLocation(req, res);
});

app.get('/api/location/search/:searchId', (req, res) => {
    const search = locationAgentService.getSearchStatus(req.params.searchId);
    if (!search) {
        return res.status(404).json({ error: 'Search not found' });
    }
    res.json({ search });
});

// Catch all handler - serve index.html for client-side routing
// This MUST be after all API routes but before error handler
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Finding Sports backend running on http://0.0.0.0:${PORT}`);
    console.log('WebSocket server enabled');
    console.log('Environment:', {
        port: PORT,
        nodeEnv: process.env.NODE_ENV,
        hasJwtSecret: Boolean(process.env.JWT_SECRET),
        hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
        corsOrigin: process.env.CORS_ORIGIN || 'all'
    });
});
