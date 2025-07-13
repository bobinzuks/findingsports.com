const express = require('express');
const router = express.Router();

// Sample venues data
const sampleVenues = [
    {
        id: 1,
        name: "Rogers Arena",
        location: "Vancouver, BC",
        sports: ["hockey", "basketball"],
        address: "800 Griffiths Way, Vancouver, BC V6B 6G1",
        coordinates: { lat: 49.2777, lng: -123.1087 },
        facilities: ["ice rink", "basketball court"],
        capacity: 18910,
        type: "arena"
    },
    {
        id: 2,
        name: "BC Place Stadium",
        location: "Vancouver, BC", 
        sports: ["football", "soccer"],
        address: "777 Pacific Blvd, Vancouver, BC V6B 4Y8",
        coordinates: { lat: 49.2767, lng: -123.1119 },
        facilities: ["football field", "soccer field"],
        capacity: 54500,
        type: "stadium"
    },
    {
        id: 3,
        name: "Hillcrest Community Centre",
        location: "Vancouver, BC",
        sports: ["basketball", "volleyball", "badminton"],
        address: "4575 Clancy Loranger Way, Vancouver, BC V5Y 2M4",
        coordinates: { lat: 49.2506, lng: -123.0956 },
        facilities: ["gymnasium", "fitness center", "swimming pool"],
        capacity: 200,
        type: "community_center"
    },
    {
        id: 4,
        name: "Burnaby Lake Sports Complex",
        location: "Burnaby, BC",
        sports: ["soccer", "rugby", "field hockey"],
        address: "7888 6th St, Burnaby, BC V3N 3N4",
        coordinates: { lat: 49.2328, lng: -122.9631 },
        facilities: ["soccer fields", "rugby pitch", "field hockey field"],
        capacity: 1000,
        type: "sports_complex"
    }
];

// GET /api/venues - Get all venues
router.get('/', (req, res) => {
    const { location, sport, type } = req.query;
    
    let filteredVenues = sampleVenues;
    
    // Filter by location if provided
    if (location) {
        const locationLower = location.toLowerCase();
        filteredVenues = filteredVenues.filter(venue => 
            venue.location.toLowerCase().includes(locationLower) ||
            venue.address.toLowerCase().includes(locationLower)
        );
    }
    
    // Filter by sport if provided
    if (sport) {
        const sportLower = sport.toLowerCase();
        filteredVenues = filteredVenues.filter(venue =>
            venue.sports.some(s => s.toLowerCase().includes(sportLower))
        );
    }
    
    // Filter by type if provided
    if (type) {
        const typeLower = type.toLowerCase();
        filteredVenues = filteredVenues.filter(venue =>
            venue.type.toLowerCase().includes(typeLower)
        );
    }
    
    res.json({
        success: true,
        venues: filteredVenues,
        total: filteredVenues.length,
        filters: { location, sport, type }
    });
});

// GET /api/venues/:id - Get specific venue
router.get('/:id', (req, res) => {
    const venueId = parseInt(req.params.id);
    const venue = sampleVenues.find(v => v.id === venueId);
    
    if (!venue) {
        return res.status(404).json({
            success: false,
            error: 'Venue not found'
        });
    }
    
    res.json({
        success: true,
        venue
    });
});

// GET /api/venues/search/nearby - Search venues by coordinates
router.get('/search/nearby', (req, res) => {
    const { lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
        return res.status(400).json({
            success: false,
            error: 'Latitude and longitude are required'
        });
    }
    
    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);
    const searchRadius = parseFloat(radius);
    
    // Simple distance calculation (not precise, but good for demo)
    const nearbyVenues = sampleVenues.filter(venue => {
        const distance = Math.sqrt(
            Math.pow(venue.coordinates.lat - centerLat, 2) + 
            Math.pow(venue.coordinates.lng - centerLng, 2)
        ) * 111; // Rough km conversion
        
        return distance <= searchRadius;
    });
    
    res.json({
        success: true,
        venues: nearbyVenues,
        searchParams: { lat: centerLat, lng: centerLng, radius: searchRadius }
    });
});

module.exports = router;