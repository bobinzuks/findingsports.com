const express = require('express');
const router = express.Router();
const { getInstance: getPlayNowService } = require('../services/play-now-service');

const playNowService = getPlayNowService();

/**
 * Debug endpoint to check real data loading
 */
router.get('/data-status', (req, res) => {
    const status = {
        dataLoaded: playNowService.dataLoaded,
        realSchedulesCount: playNowService.realSchedules.size,
        venues: [],
        config: playNowService.config
    };
    
    // Get venue details
    for (const [venueId, venue] of playNowService.realSchedules) {
        status.venues.push({
            id: venueId,
            name: venue.name,
            address: venue.address,
            coordinates: venue.coordinates,
            activitiesCount: venue.activities.length,
            activities: venue.activities.map(a => ({
                sport: a.sport,
                days: a.schedule.days,
                time: `${a.schedule.startHour}:00 - ${a.schedule.endHour}:00`,
                realData: a.realData
            }))
        });
    }
    
    res.json(status);
});

module.exports = router;