const express = require('express');
const router = express.Router();
const { getInstance: getDataPipeline } = require('../services/data-aggregation-pipeline');
const locationAgentService = require('../services/location-agent-service');
const geohash = require('geohash');

// Get games near a specific location
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = Math.min(parseFloat(radius), 100); // Max 100km
    
    if (isNaN(latitude) || isNaN(longitude) || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Please provide valid latitude and longitude'
      });
    }

    // Get user location from headers if available
    const userLocationHeader = req.headers['x-user-location'];
    let userCity = null;
    if (userLocationHeader) {
      try {
        const parsed = JSON.parse(userLocationHeader);
        userCity = parsed.city;
      } catch (e) {
        console.warn('Failed to parse user location header:', e);
      }
    }

    // Log the request for analytics
    console.log(`Games search: lat=${latitude}, lng=${longitude}, radius=${searchRadius}km, city=${userCity || 'Unknown'}`);

    // Get data pipeline instance
    const pipeline = getDataPipeline();
    
    // Search for games with filters from query params
    const filters = {
      location: {
        lat: latitude,
        lng: longitude,
        radius: searchRadius
      },
      sport: req.query.sport,
      type: req.query.type,
      skillLevel: req.query.skillLevel,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      verified: req.query.verified === 'true',
      today: req.query.today === 'true',
      live: req.query.live === 'true'
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    // Fetch games from pipeline
    const games = await pipeline.searchGames(filters);

    // Enrich games with additional data
    const enrichedGames = games.map(game => {
      const distance = calculateDistance(
        latitude, longitude,
        game.venue.coordinates.lat || game.venue.latitude,
        game.venue.coordinates.lng || game.venue.longitude
      );

      const startTime = new Date(game.startTime || game.start_time);
      const endTime = new Date(game.endTime || game.end_time);
      const now = new Date();

      return {
        id: game.id,
        sport: game.sport,
        type: game.type || game.game_type || 'drop-in',
        venue: {
          id: game.venue.id || game.venue_id,
          name: game.venue.name || game.venue_name,
          address: game.venue.address || game.venue_address,
          coordinates: {
            lat: game.venue.coordinates?.lat || game.venue.latitude || game.venue_latitude,
            lng: game.venue.coordinates?.lng || game.venue.longitude || game.venue_longitude
          },
          type: game.venue.type || game.venue_type
        },
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        recurring: game.recurring || {
          enabled: !!game.recurring_pattern,
          pattern: game.recurring_pattern,
          daysOfWeek: game.days_of_week
        },
        capacity: game.capacity || game.max_players,
        currentPlayers: game.current_players || 0,
        skillLevel: game.skill_level || 'all',
        price: game.price || 0,
        description: game.description,
        amenities: game.amenities || [],
        source: game.source,
        verified: game.verified || game.verification_status === 'verified',
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        isToday: isToday(startTime),
        isLive: now >= startTime && now <= endTime,
        formattedTime: formatGameTime(startTime)
      };
    });

    // Sort by distance and filter by actual radius
    const filteredGames = enrichedGames
      .filter(game => game.distance <= searchRadius)
      .sort((a, b) => {
        // Live games first
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        
        // Then by distance
        return a.distance - b.distance;
      });

    // Group by distance categories
    const groupedGames = {
      nearby: filteredGames.filter(g => g.distance < 2),
      close: filteredGames.filter(g => g.distance >= 2 && g.distance < 5),
      moderate: filteredGames.filter(g => g.distance >= 5 && g.distance < 10),
      far: filteredGames.filter(g => g.distance >= 10)
    };

    // Calculate statistics
    const stats = {
      total: filteredGames.length,
      today: filteredGames.filter(g => g.isToday).length,
      live: filteredGames.filter(g => g.isLive).length,
      free: filteredGames.filter(g => g.price === 0).length,
      verified: filteredGames.filter(g => g.verified).length,
      byDistance: {
        nearby: groupedGames.nearby.length,
        close: groupedGames.close.length,
        moderate: groupedGames.moderate.length,
        far: groupedGames.far.length
      }
    };

    // Check if location needs data collection
    if (filteredGames.length === 0 && userCity) {
      // Trigger background search if no games found
      locationAgentService.startLocationSearch({
        city: userCity,
        lat: latitude,
        lng: longitude,
        id: geohash.encode(latitude, longitude, 5)
      }, req.user?.id).catch(err => {
        console.error('Background search error:', err);
      });
    }

    res.json({
      success: true,
      location: {
        lat: latitude,
        lng: longitude,
        city: userCity,
        searchRadius
      },
      games: filteredGames,
      grouped: groupedGames,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching nearby games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games',
      message: error.message
    });
  }
});

// Get games at a specific venue
router.get('/venue/:venueId', async (req, res) => {
  try {
    const { venueId } = req.params;
    const pipeline = getDataPipeline();
    
    const games = await pipeline.searchGames({
      venueId
    });

    const enrichedGames = games.map(game => ({
      id: game.id,
      sport: game.sport,
      type: game.type || game.game_type || 'drop-in',
      startTime: game.startTime || game.start_time,
      endTime: game.endTime || game.end_time,
      capacity: game.capacity || game.max_players,
      currentPlayers: game.current_players || 0,
      skillLevel: game.skill_level || 'all',
      price: game.price || 0,
      description: game.description,
      verified: game.verified || game.verification_status === 'verified'
    }));

    res.json({
      success: true,
      venueId,
      games: enrichedGames,
      total: enrichedGames.length
    });

  } catch (error) {
    console.error('Error fetching venue games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch venue games',
      message: error.message
    });
  }
});

// Get venues near a location
router.get('/venues', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = Math.min(parseFloat(radius), 100);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: 'Invalid coordinates'
      });
    }

    const pipeline = getDataPipeline();
    
    // Get all games in the area to extract venues
    const games = await pipeline.searchGames({
      location: {
        lat: latitude,
        lng: longitude,
        radius: searchRadius
      }
    });

    // Extract unique venues
    const venuesMap = new Map();
    
    games.forEach(game => {
      const venueId = game.venue?.id || game.venue_id;
      if (venueId && !venuesMap.has(venueId)) {
        const venueLat = game.venue?.coordinates?.lat || game.venue?.latitude || game.venue_latitude;
        const venueLng = game.venue?.coordinates?.lng || game.venue?.longitude || game.venue_longitude;
        
        venuesMap.set(venueId, {
          id: venueId,
          name: game.venue?.name || game.venue_name,
          address: game.venue?.address || game.venue_address,
          coordinates: {
            lat: venueLat,
            lng: venueLng
          },
          type: game.venue?.type || game.venue_type,
          distance: calculateDistance(latitude, longitude, venueLat, venueLng),
          gameCount: 0
        });
      }
      
      if (venueId && venuesMap.has(venueId)) {
        venuesMap.get(venueId).gameCount++;
      }
    });

    const venues = Array.from(venuesMap.values())
      .filter(venue => venue.distance <= searchRadius)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      location: {
        lat: latitude,
        lng: longitude,
        searchRadius
      },
      venues,
      total: venues.length
    });

  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch venues',
      message: error.message
    });
  }
});

// Search status endpoint
router.get('/search-status/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;
    const status = locationAgentService.getSearchStatus(searchId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Search not found'
      });
    }

    res.json({
      success: true,
      search: status
    });

  } catch (error) {
    console.error('Error getting search status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get search status',
      message: error.message
    });
  }
});

// Helper functions
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

function isToday(date) {
  const today = new Date();
  const gameDate = new Date(date);
  return gameDate.toDateString() === today.toDateString();
}

function formatGameTime(date) {
  const gameDate = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((gameDate - now) / (1000 * 60 * 60 * 24));
  
  const timeStr = gameDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (isToday(gameDate)) {
    return `Today ${timeStr}`;
  } else if (diffDays === 1) {
    return `Tomorrow ${timeStr}`;
  } else if (diffDays > 0 && diffDays < 7) {
    const dayName = gameDate.toLocaleDateString('en-US', { weekday: 'short' });
    return `${dayName} ${timeStr}`;
  } else {
    return gameDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

module.exports = router;