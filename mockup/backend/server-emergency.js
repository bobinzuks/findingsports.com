const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Emergency server - no JWT required for now
console.log('🚨 EMERGENCY SERVER RUNNING - Add JWT_SECRET in Railway Variables!');

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../')));

// Mock games data
const games = [
    {
        id: 1,
        title: "Basketball at Sunset Community Centre",
        sport: "basketball",
        location: "Sunset Community Centre",
        date: new Date().toISOString(),
        attendees: 8,
        maxAttendees: 20
    }
];

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        warning: 'Running without JWT_SECRET - Add it in Railway Variables!',
        timestamp: new Date().toISOString() 
    });
});

// Basic auth endpoints (without JWT for now)
app.post('/api/auth/login', (req, res) => {
    res.json({ 
        error: 'Authentication disabled - Set JWT_SECRET in Railway' 
    });
});

// Games API
app.get('/api/games', (req, res) => {
    res.json({ games, totalGames: games.length });
});

// Play Now API
app.get('/api/play-now', (req, res) => {
    res.json({
        activities: {
            happeningNow: [],
            startingSoon: [{
                sport: "basketball",
                venue: "Sunset Community Centre",
                distance: "2.1 km",
                cost: 5.50
            }],
            openCourts: [],
            pickupGames: []
        },
        summary: { totalActivities: 1 }
    });
});

// Serve the main app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Emergency server running on port ${PORT}`);
    console.log(`⚠️  WARNING: Add JWT_SECRET in Railway Variables!`);
    console.log(`📍 Go to Railway > Variables > New Variable`);
    console.log(`🔑 Add: JWT_SECRET = your-secret-key-here`);
});