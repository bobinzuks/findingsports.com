const express = require('express');
const router = express.Router();

// LOCAL venues - Community Centers, Parks, Gymnasiums, Arenas  
const LOCAL_VENUES = [
    { id: 1, name: 'Killarney Community Centre', type: 'community_center', city: 'Vancouver', sports: ['soccer', 'basketball', 'volleyball'], address: '6260 Killarney Street' },
    { id: 2, name: 'Trout Lake Community Centre', type: 'community_center', city: 'Vancouver', sports: ['hockey', 'skating', 'basketball'], address: '3350 Victoria Drive' },
    { id: 3, name: 'Hillcrest Community Centre', type: 'community_center', city: 'Vancouver', sports: ['swimming', 'basketball', 'badminton'], address: '4575 Clancy Loranger Way' },
    { id: 4, name: 'Queen Elizabeth Park', type: 'park', city: 'Vancouver', sports: ['tennis', 'soccer'], address: '4600 Cambie Street' },
    { id: 5, name: 'UBC War Memorial Gym', type: 'gymnasium', city: 'Vancouver', sports: ['basketball', 'volleyball', 'badminton'], address: '6081 University Boulevard' },
    { id: 6, name: 'Britannia Ice Rink', type: 'arena', city: 'Vancouver', sports: ['hockey', 'skating'], address: '1661 Napier Street' }
];

router.get('/', (req, res) => {
    const { city, sport, type } = req.query;
    let venues = [...LOCAL_VENUES];
    
    if (city) venues = venues.filter(v => v.city.toLowerCase().includes(city.toLowerCase()));
    if (sport) venues = venues.filter(v => v.sports.includes(sport.toLowerCase()));
    if (type) venues = venues.filter(v => v.type === type);
    
    res.json({
        success: true,
        count: venues.length,
        venues: venues.map(v => ({
            ...v,
            dropInAvailable: true,
            openHours: '6 AM - 10 PM'
        }))
    });
});

router.get('/:id', (req, res) => {
    const venue = LOCAL_VENUES.find(v => v.id === parseInt(req.params.id));
    if (!venue) return res.status(404).json({ error: 'Venue not found' });
    
    res.json({
        success: true,
        venue: {
            ...venue,
            dropInSchedule: {
                monday: ['7-9 AM', '7-9 PM'],
                tuesday: ['7-9 AM', '7-9 PM'],
                saturday: ['9 AM - 5 PM']
            }
        }
    });
});

module.exports = router;