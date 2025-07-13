const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// JWT Secret check
if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is required but not set!');
    console.error('Please set JWT_SECRET environment variable in Railway');
    process.exit(1);
}

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../')));

// In-memory data stores
let users = [];
let games = [];

// Initialize some mock games data
games = [
    {
        id: 1,
        title: "Basketball at Sunset Community Centre",
        sport: "basketball",
        location: "Sunset Community Centre",
        venue: { 
            name: "Sunset Community Centre",
            coordinates: { lat: 49.2187, lng: -123.1043 }
        },
        date: new Date(Date.now() + 86400000).toISOString(),
        time: "7:00 PM",
        attendees: 8,
        maxAttendees: 20,
        type: "drop-in",
        cost: 5.50
    },
    {
        id: 2,
        title: "Soccer at Andy Livingstone Park",
        sport: "soccer",
        location: "Andy Livingstone Park",
        venue: {
            name: "Andy Livingstone Park",
            coordinates: { lat: 49.2846, lng: -123.1026 }
        },
        date: new Date(Date.now() + 172800000).toISOString(),
        time: "6:00 PM",
        attendees: 14,
        maxAttendees: 22,
        type: "pickup",
        cost: 0
    }
];

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            id: users.length + 1,
            name,
            email,
            password: hashedPassword
        };
        
        users.push(user);
        
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
        res.json({ token, user: { id: user.id, name, email } });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email 
            } 
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Games API
app.get('/api/games', (req, res) => {
    res.json({ games, totalGames: games.length });
});

// Play Now API
app.get('/api/play-now', (req, res) => {
    const { lat = 49.2827, lng = -123.1207, radius = 5 } = req.query;
    
    // Mock Play Now data
    res.json({
        activities: {
            happeningNow: [],
            startingSoon: [
                {
                    id: "hillcrest-volleyball",
                    sport: "volleyball",
                    venue: "Hillcrest Community Centre",
                    address: "4575 Clancy Loranger Way, Vancouver",
                    coordinates: { lat: 49.2435, lng: -123.1089 },
                    distance: "4.4 km",
                    cost: 5.50,
                    ageGroup: "Adult (19+)",
                    timeString: "7:00 PM - 9:00 PM",
                    startsIn: "45 minutes"
                }
            ],
            openCourts: [
                {
                    id: "david-lam-basketball",
                    type: "basketball",
                    venue: "David Lam Park",
                    coordinates: { lat: 49.2729, lng: -123.1267 },
                    status: "open",
                    courts: 2,
                    lights: "Until 10 PM",
                    distance: "1.2 km"
                }
            ],
            pickupGames: []
        },
        summary: {
            totalActivities: 2,
            searchRadius: radius + " km",
            userLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
            currentTime: new Date().toISOString()
        }
    });
});

// Serve the main app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'NOT SET!'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});