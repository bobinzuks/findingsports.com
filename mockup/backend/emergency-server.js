const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚨 Emergency server starting...');
console.log('Port:', PORT);
console.log('Directory:', __dirname);

// Basic middleware
app.use(express.json());

// Enable CORS for everything
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        mode: 'emergency',
        timestamp: new Date().toISOString() 
    });
});

// Basic Play Now endpoint with embedded data
app.get('/api/play-now', (req, res) => {
    const activities = {
        happeningNow: [
            {
                id: 'hillcrest-basketball-now',
                sport: 'basketball',
                venue: 'Hillcrest Community Centre',
                address: '4575 Clancy Loranger Way, Vancouver',
                lat: 49.2435,
                lng: -123.1089,
                coordinates: { lat: 49.2435, lng: -123.1089 },
                time: '7:00 PM - 9:00 PM',
                distance: '2.5 km',
                distanceValue: 2.5,
                cost: 8.50,
                isRealData: true,
                source: 'Vancouver Parks & Rec'
            },
            {
                id: 'ubc-volleyball-now',
                sport: 'volleyball',
                venue: 'UBC War Memorial Gym',
                address: '6081 University Blvd, Vancouver',
                lat: 49.2668,
                lng: -123.2497,
                coordinates: { lat: 49.2668, lng: -123.2497 },
                time: '6:00 PM - 8:00 PM',
                distance: '8.1 km',
                distanceValue: 8.1,
                cost: 10.00,
                isRealData: true,
                source: 'UBC Recreation'
            }
        ],
        startingSoon: [
            {
                id: 'sunset-basketball-soon',
                sport: 'basketball',
                venue: 'Sunset Community Centre',
                address: '6810 Main St, Vancouver',
                lat: 49.2187,
                lng: -123.1008,
                coordinates: { lat: 49.2187, lng: -123.1008 },
                time: '8:00 PM - 10:00 PM',
                startsIn: '1 hour',
                distance: '3.2 km',
                distanceValue: 3.2,
                cost: 8.50,
                isRealData: true,
                source: 'Vancouver Parks & Rec'
            }
        ],
        laterToday: [
            {
                id: 'britannia-basketball-later',
                sport: 'basketball',
                venue: 'Britannia Community Centre',
                address: '1661 Napier St, Vancouver',
                lat: 49.2751,
                lng: -123.0715,
                coordinates: { lat: 49.2751, lng: -123.0715 },
                time: '9:00 PM - 11:00 PM',
                startsIn: '3 hours',
                distance: '4.8 km',
                distanceValue: 4.8,
                cost: 5.50,
                note: 'Late night basketball',
                isRealData: true,
                source: 'Vancouver Parks & Rec'
            }
        ],
        openCourts: [
            {
                id: 'qe-tennis',
                type: 'tennis',
                venue: 'Queen Elizabeth Park',
                address: '4600 Cambie St, Vancouver',
                lat: 49.2418,
                lng: -123.1126,
                coordinates: { lat: 49.2418, lng: -123.1126 },
                status: 'open',
                courts: 17,
                distance: '1.8 km',
                distanceValue: 1.8,
                isRealData: true,
                source: 'Vancouver Parks'
            }
        ],
        pickupGames: [
            {
                id: 'andy-liv-soccer',
                sport: 'soccer',
                venue: 'Andy Livingstone Park',
                coordinates: { lat: 49.2846, lng: -123.1026 },
                lat: 49.2846,
                lng: -123.1026,
                time: 'Mondays 6:00 PM',
                distance: '2.1 km',
                distanceValue: 2.1,
                organizer: 'Vancouver Pickup Soccer',
                platform: 'Facebook Group',
                isRealData: true,
                source: 'Facebook Groups'
            }
        ]
    };

    res.json({
        activities,
        summary: {
            totalActivities: 6,
            happeningNow: 2,
            startingSoon: 1,
            laterToday: 1,
            openCourts: 1,
            pickupGames: 1,
            userLocation: {
                lat: parseFloat(req.query.lat) || 49.2827,
                lng: parseFloat(req.query.lng) || -123.1207
            }
        }
    });
});

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// Catch all - serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Emergency server running on http://0.0.0.0:${PORT}`);
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});