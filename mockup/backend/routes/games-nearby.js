// Games Nearby API endpoint for MapLibre implementation
const express = require('express');
const router = express.Router();

// GET /api/games/nearby - Get games near user location
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 10 } = req.query;
        
        // Mock games data for MapLibre
        const games = [
            {
                id: '1',
                sport: 'Basketball',
                venue: 'Kitsilano Beach Courts',
                lat: 49.2747,
                lng: -123.1442,
                time: '6:00 PM',
                players: '5/10',
                skillLevel: 'Intermediate',
                distance: '2.3 km'
            },
            {
                id: '2',
                sport: 'Soccer',
                venue: 'UBC Fields',
                lat: 49.2606,
                lng: -123.2460,
                time: '7:00 PM',
                players: '14/22',
                skillLevel: 'All Levels',
                distance: '5.1 km'
            },
            {
                id: '3',
                sport: 'Volleyball',
                venue: 'English Bay Beach',
                lat: 49.2863,
                lng: -123.1436,
                time: '5:30 PM',
                players: '4/6',
                skillLevel: 'Beginner',
                distance: '1.8 km'
            },
            {
                id: '4',
                sport: 'Tennis',
                venue: 'Queen Elizabeth Park',
                lat: 49.2418,
                lng: -123.1125,
                time: '6:30 PM',
                players: '2/4',
                skillLevel: 'Advanced',
                distance: '3.2 km'
            },
            {
                id: '5',
                sport: 'Hockey',
                venue: 'Hillcrest Centre',
                lat: 49.2447,
                lng: -123.1074,
                time: '8:00 PM',
                players: '10/20',
                skillLevel: 'Intermediate',
                distance: '4.5 km'
            },
            {
                id: '6',
                sport: 'Basketball',
                venue: 'False Creek Community Centre',
                lat: 49.2721,
                lng: -123.1340,
                time: '7:30 PM',
                players: '8/12',
                skillLevel: 'All Levels',
                distance: '0.8 km'
            }
        ];
        
        // Filter by distance if lat/lng provided
        let filteredGames = games;
        if (lat && lng) {
            // Add some variation to simulate distance filtering
            filteredGames = games.filter(() => Math.random() > 0.2);
        }
        
        res.json({
            success: true,
            games: filteredGames,
            total: filteredGames.length,
            location: { lat: parseFloat(lat) || 49.2827, lng: parseFloat(lng) || -123.1207 },
            radius: parseFloat(radius)
        });
    } catch (error) {
        console.error('Games nearby error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch nearby games'
        });
    }
});

module.exports = router;