const express = require('express');
const router = express.Router();

// Sample sports data with categories and metadata
const sportsData = [
    {
        id: 1,
        name: "Basketball",
        category: "team",
        players: "5v5",
        equipment: ["basketball", "hoop"],
        venues: ["gymnasium", "outdoor court"],
        season: "year-round",
        popularity: 9,
        skillLevels: ["beginner", "intermediate", "advanced", "professional"],
        variations: ["streetball", "3x3", "wheelchair basketball"]
    },
    {
        id: 2,
        name: "Soccer",
        category: "team",
        players: "11v11",
        equipment: ["soccer ball", "goals", "shin guards"],
        venues: ["field", "indoor facility"],
        season: "spring-fall",
        popularity: 10,
        skillLevels: ["beginner", "intermediate", "advanced", "professional"],
        variations: ["futsal", "beach soccer", "indoor soccer"]
    },
    {
        id: 3,
        name: "Tennis",
        category: "individual",
        players: "1v1 or 2v2",
        equipment: ["tennis racket", "tennis balls", "net"],
        venues: ["tennis court"],
        season: "spring-fall",
        popularity: 7,
        skillLevels: ["beginner", "intermediate", "advanced", "professional"],
        variations: ["singles", "doubles", "mixed doubles"]
    },
    {
        id: 4,
        name: "Hockey",
        category: "team",
        players: "6v6",
        equipment: ["hockey stick", "puck", "protective gear", "skates"],
        venues: ["ice rink"],
        season: "fall-spring",
        popularity: 8,
        skillLevels: ["beginner", "intermediate", "advanced", "professional"],
        variations: ["ice hockey", "ball hockey", "field hockey"]
    },
    {
        id: 5,
        name: "Volleyball",
        category: "team",
        players: "6v6",
        equipment: ["volleyball", "net"],
        venues: ["gymnasium", "beach", "outdoor court"],
        season: "year-round",
        popularity: 6,
        skillLevels: ["beginner", "intermediate", "advanced", "professional"],
        variations: ["indoor volleyball", "beach volleyball", "sitting volleyball"]
    },
    {
        id: 6,
        name: "Badminton",
        category: "individual",
        players: "1v1 or 2v2",
        equipment: ["badminton racket", "shuttlecock", "net"],
        venues: ["gymnasium", "indoor court"],
        season: "year-round",
        popularity: 5,
        skillLevels: ["beginner", "intermediate", "advanced", "professional"],
        variations: ["singles", "doubles", "mixed doubles"]
    },
    {
        id: 7,
        name: "Running",
        category: "individual",
        players: "individual or group",
        equipment: ["running shoes"],
        venues: ["track", "trail", "road", "treadmill"],
        season: "year-round",
        popularity: 9,
        skillLevels: ["beginner", "intermediate", "advanced", "elite"],
        variations: ["sprints", "distance", "trail running", "marathons"]
    },
    {
        id: 8,
        name: "Swimming",
        category: "individual",
        players: "individual",
        equipment: ["swimsuit", "goggles"],
        venues: ["pool", "lake", "ocean"],
        season: "year-round",
        popularity: 8,
        skillLevels: ["beginner", "intermediate", "advanced", "competitive"],
        variations: ["freestyle", "breaststroke", "backstroke", "butterfly"]
    }
];

// GET /api/sports/categories - Get all sport categories
router.get('/categories', (req, res) => {
    const categories = [...new Set(sportsData.map(sport => sport.category))];
    const categoryCounts = categories.map(category => ({
        name: category,
        count: sportsData.filter(sport => sport.category === category).length,
        sports: sportsData.filter(sport => sport.category === category).map(s => s.name)
    }));
    
    res.json({
        success: true,
        categories: categoryCounts,
        total: categories.length
    });
});

// GET /api/sports/popular - Get popular sports
router.get('/popular', (req, res) => {
    const { limit = 5 } = req.query;
    
    const popularSports = sportsData
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, parseInt(limit));
    
    res.json({
        success: true,
        sports: popularSports,
        limit: parseInt(limit)
    });
});

// GET /api/sports/search/:name - Search sports by name
router.get('/search/:name', (req, res) => {
    const searchName = req.params.name.toLowerCase();
    
    const matchingSports = sportsData.filter(sport =>
        sport.name.toLowerCase().includes(searchName) ||
        sport.variations.some(v => v.toLowerCase().includes(searchName))
    );
    
    res.json({
        success: true,
        sports: matchingSports,
        searchTerm: req.params.name
    });
});

// GET /api/sports - Get all sports
router.get('/', (req, res) => {
    const { category, popularity, season, venue } = req.query;
    
    let filteredSports = sportsData;
    
    // Filter by category if provided
    if (category) {
        filteredSports = filteredSports.filter(sport => 
            sport.category.toLowerCase() === category.toLowerCase()
        );
    }
    
    // Filter by minimum popularity if provided
    if (popularity) {
        const minPopularity = parseInt(popularity);
        filteredSports = filteredSports.filter(sport => 
            sport.popularity >= minPopularity
        );
    }
    
    // Filter by season if provided
    if (season) {
        const seasonLower = season.toLowerCase();
        filteredSports = filteredSports.filter(sport =>
            sport.season.toLowerCase().includes(seasonLower) ||
            sport.season.toLowerCase() === 'year-round'
        );
    }
    
    // Filter by venue type if provided
    if (venue) {
        const venueLower = venue.toLowerCase();
        filteredSports = filteredSports.filter(sport =>
            sport.venues.some(v => v.toLowerCase().includes(venueLower))
        );
    }
    
    res.json({
        success: true,
        sports: filteredSports,
        total: filteredSports.length,
        categories: [...new Set(sportsData.map(s => s.category))],
        filters: { category, popularity, season, venue }
    });
});

// GET /api/sports/:id - Get specific sport
router.get('/:id', (req, res) => {
    const sportId = parseInt(req.params.id);
    const sport = sportsData.find(s => s.id === sportId);
    
    if (!sport) {
        return res.status(404).json({
            success: false,
            error: 'Sport not found'
        });
    }
    
    res.json({
        success: true,
        sport
    });
});

// GET /api/sports/search/:name - Search sports by name
router.get('/search/:name', (req, res) => {
    const searchName = req.params.name.toLowerCase();
    
    const matchingSports = sportsData.filter(sport =>
        sport.name.toLowerCase().includes(searchName) ||
        sport.variations.some(v => v.toLowerCase().includes(searchName))
    );
    
    res.json({
        success: true,
        sports: matchingSports,
        searchTerm: req.params.name
    });
});

module.exports = router;