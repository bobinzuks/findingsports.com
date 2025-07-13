const express = require('express');
const router = express.Router();
const { getInstance: getPlayNowService } = require('../services/play-now-service');

const playNowService = getPlayNowService();

/**
 * @api {get} /api/play-now Get activities happening now
 * @apiDescription Get sports activities happening now or starting soon near user location
 * @apiQuery {Number} lat User's latitude
 * @apiQuery {Number} lng User's longitude
 * @apiQuery {Number} radius Search radius in km (default: 10)
 * @apiQuery {Boolean} includeOpenCourts Include open courts/fields (default: true)
 */
router.get('/', async (req, res) => {
    try {
        const { lat, lng, radius = 10 } = req.query;
        
        // Default to downtown Vancouver if no location provided
        const userLocation = {
            lat: parseFloat(lat) || 49.2827,
            lng: parseFloat(lng) || -123.1207
        };
        
        const options = {
            radiusKm: parseInt(radius),
            includeOpenCourts: req.query.includeOpenCourts !== 'false'
        };
        
        const activities = await playNowService.getPlayNowActivities(userLocation, options);
        
        // Calculate summary stats
        const summary = {
            totalActivities: 
                activities.happeningNow.length + 
                activities.startingSoon.length + 
                activities.laterToday.length,
            happeningNow: activities.happeningNow.length,
            startingSoon: activities.startingSoon.length,
            laterToday: activities.laterToday.length,
            openCourts: activities.openCourts.length,
            pickupGames: activities.pickupGames.length,
            searchRadius: `${options.radiusKm} km`,
            userLocation: {
                lat: userLocation.lat,
                lng: userLocation.lng
            },
            currentTime: new Date().toISOString()
        };
        
        res.json({
            activities,
            summary
        });
        
    } catch (error) {
        console.error('Play Now API error:', error);
        res.status(500).json({
            error: 'Failed to fetch activities',
            message: error.message
        });
    }
});

/**
 * @api {get} /api/play-now/:activityId Get specific activity details
 */
router.get('/:activityId', async (req, res) => {
    try {
        const { activityId } = req.params;
        
        // In production, this would fetch from database
        // For now, return mock details
        const mockDetails = {
            id: activityId,
            venue: {
                name: 'Hillcrest Community Centre',
                address: '4575 Clancy Loranger Way, Vancouver',
                phone: '604-257-8680',
                website: 'https://vancouver.ca/parks-recreation-culture/hillcrest-centre.aspx',
                amenities: ['Parking', 'Change rooms', 'Water fountain', 'Equipment rental']
            },
            currentPlayers: Math.floor(Math.random() * 20) + 5,
            recentActivity: [
                { time: '10 mins ago', message: '3 players joined' },
                { time: '25 mins ago', message: 'Game started' }
            ],
            similarActivities: []
        };
        
        res.json(mockDetails);
        
    } catch (error) {
        console.error('Activity detail error:', error);
        res.status(500).json({
            error: 'Failed to fetch activity details',
            message: error.message
        });
    }
});


// POST search endpoint for Play Now
router.post('/search', async (req, res) => {
    try {
        const { location, sports } = req.body;
        
        // Use the same logic as GET but with body parameters
        const lat = location ? 49.2827 : req.body.lat; // Default to Vancouver
        const lng = location ? -123.1207 : req.body.lng;
        const radius = req.body.radius || 10;
        
        const activities = await playNowService.getActivitiesNearLocation(
            lat, 
            lng, 
            radius,
            { sports, includeOpenCourts: true }
        );
        
        res.json(activities);
    } catch (error) {
        console.error('Play Now search error:', error);
        res.status(500).json({ error: 'Failed to search activities' });
    }
});


module.exports = router;