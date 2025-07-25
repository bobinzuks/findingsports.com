// Game Data Service for managing sports game information
class GameDataService {
  constructor() {
    this.games = new Map();
    this.venues = new Map();
    this.sports = ['basketball', 'soccer', 'hockey', 'volleyball', 'tennis', 'pickleball', 'badminton', 'baseball', 'football'];
    this.gameTypes = ['drop-in', 'organized', 'pickup', 'league', 'tournament'];
    
    // Sample data structure
    this.gameSchema = {
      id: null,
      sport: null,
      type: 'drop-in',
      venue: {
        id: null,
        name: null,
        address: null,
        coordinates: { lat: null, lng: null },
        type: null, // 'community_center', 'park', 'arena', 'gym', 'other'
      },
      startTime: null,
      endTime: null,
      recurring: {
        enabled: false,
        pattern: null, // 'daily', 'weekly', 'monthly'
        daysOfWeek: [], // [0-6] for recurring weekly
      },
      capacity: null,
      currentPlayers: 0,
      skillLevel: 'all', // 'beginner', 'intermediate', 'advanced', 'all'
      price: 0,
      description: '',
      amenities: [], // ['parking', 'changerooms', 'water', 'equipment']
      rules: [],
      contact: null,
      source: null, // 'user', 'official', 'scraped'
      verified: false,
      createdAt: null,
      updatedAt: null
    };
  }

  // Create a new game
  createGame(gameData) {
    const game = {
      ...this.gameSchema,
      ...gameData,
      id: gameData.id || this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Validate required fields
    if (!game.sport || !game.venue || !game.startTime) {
      throw new Error('Missing required fields: sport, venue, and startTime are required');
    }

    // Ensure venue has coordinates
    if (!game.venue.coordinates || !game.venue.coordinates.lat || !game.venue.coordinates.lng) {
      throw new Error('Venue must have valid coordinates');
    }

    this.games.set(game.id, game);
    
    // Store venue separately for quick lookup
    if (game.venue.id) {
      this.venues.set(game.venue.id, game.venue);
    }

    return game;
  }

  // Generate unique ID
  generateId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get games by location and radius
  getGamesNearLocation(lat, lng, radiusKm = 10, filters = {}) {
    const nearbyGames = [];
    
    this.games.forEach(game => {
      const distance = this.calculateDistance(
        lat, lng,
        game.venue.coordinates.lat,
        game.venue.coordinates.lng
      );

      if (distance <= radiusKm) {
        // Apply filters
        if (filters.sport && game.sport !== filters.sport) return;
        if (filters.type && game.type !== filters.type) return;
        if (filters.skillLevel && game.skillLevel !== filters.skillLevel && game.skillLevel !== 'all') return;
        if (filters.maxPrice !== undefined && game.price > filters.maxPrice) return;
        if (filters.verified && !game.verified) return;
        
        // Check if game is in the future or recurring
        const now = new Date();
        const startTime = new Date(game.startTime);
        
        if (game.recurring.enabled || startTime > now) {
          nearbyGames.push({
            ...game,
            distance: Math.round(distance * 10) / 10 // Round to 1 decimal
          });
        }
      }
    });

    // Sort by distance and start time
    return nearbyGames.sort((a, b) => {
      // First by distance
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      // Then by start time
      return new Date(a.startTime) - new Date(b.startTime);
    });
  }

  // Get games for today
  getTodaysGames(lat, lng, radiusKm = 10) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getGamesNearLocation(lat, lng, radiusKm).filter(game => {
      const gameDate = new Date(game.startTime);
      
      // Check if it's today
      if (gameDate >= today && gameDate < tomorrow) {
        return true;
      }
      
      // Check if it's a recurring game that happens today
      if (game.recurring.enabled && game.recurring.pattern === 'weekly') {
        const todayDayOfWeek = today.getDay();
        return game.recurring.daysOfWeek.includes(todayDayOfWeek);
      }
      
      return false;
    });
  }

  // Get upcoming games
  getUpcomingGames(lat, lng, radiusKm = 10, days = 7) {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.getGamesNearLocation(lat, lng, radiusKm).filter(game => {
      const gameDate = new Date(game.startTime);
      return gameDate >= now && gameDate <= endDate;
    });
  }

  // Calculate distance between coordinates
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Get games by sport
  getGamesBySport(sport, lat, lng, radiusKm = 10) {
    return this.getGamesNearLocation(lat, lng, radiusKm, { sport });
  }

  // Get venues near location
  getVenuesNearLocation(lat, lng, radiusKm = 10) {
    const nearbyVenues = [];
    
    this.venues.forEach(venue => {
      const distance = this.calculateDistance(
        lat, lng,
        venue.coordinates.lat,
        venue.coordinates.lng
      );

      if (distance <= radiusKm) {
        nearbyVenues.push({
          ...venue,
          distance: Math.round(distance * 10) / 10,
          gameCount: this.getGamesAtVenue(venue.id).length
        });
      }
    });

    return nearbyVenues.sort((a, b) => a.distance - b.distance);
  }

  // Get games at a specific venue
  getGamesAtVenue(venueId) {
    const games = [];
    this.games.forEach(game => {
      if (game.venue.id === venueId) {
        games.push(game);
      }
    });
    return games;
  }

  // Update game attendance
  updateGameAttendance(gameId, action = 'join') {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (action === 'join') {
      if (game.capacity && game.currentPlayers >= game.capacity) {
        throw new Error('Game is full');
      }
      game.currentPlayers++;
    } else if (action === 'leave') {
      if (game.currentPlayers > 0) {
        game.currentPlayers--;
      }
    }

    game.updatedAt = new Date().toISOString();
    return game;
  }

  // Load sample data for testing
  loadSampleData() {
    const sampleVenues = [
      {
        id: 'venue_1',
        name: 'Hillcrest Community Centre',
        address: '4575 Clancy Loranger Way, Vancouver, BC',
        coordinates: { lat: 49.2436, lng: -123.1089 },
        type: 'community_center'
      },
      {
        id: 'venue_2',
        name: 'Kitsilano Beach Basketball Courts',
        address: 'Cornwall Ave, Vancouver, BC',
        coordinates: { lat: 49.2743, lng: -123.1534 },
        type: 'park'
      },
      {
        id: 'venue_3',
        name: 'Mount Pleasant Community Centre',
        address: '1 Kingsway, Vancouver, BC',
        coordinates: { lat: 49.2457, lng: -123.1019 },
        type: 'community_center'
      },
      {
        id: 'venue_4',
        name: 'Trout Lake Community Centre',
        address: '3360 Victoria Dr, Vancouver, BC',
        coordinates: { lat: 49.2556, lng: -123.0657 },
        type: 'community_center'
      },
      {
        id: 'venue_5',
        name: 'UBC Recreation Centre',
        address: '6000 Student Union Blvd, Vancouver, BC',
        coordinates: { lat: 49.2696, lng: -123.2496 },
        type: 'gym'
      }
    ];

    const sports = ['basketball', 'volleyball', 'badminton', 'soccer', 'hockey'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Create sample games
    sampleVenues.forEach((venue, venueIndex) => {
      // Create 2-3 games per venue
      const numGames = 2 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < numGames; i++) {
        const sport = sports[Math.floor(Math.random() * sports.length)];
        const dayIndex = Math.floor(Math.random() * 7);
        const hour = 18 + Math.floor(Math.random() * 4); // 6 PM to 9 PM
        
        const startTime = new Date();
        startTime.setDate(startTime.getDate() + ((dayIndex - startTime.getDay() + 7) % 7));
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 2);

        this.createGame({
          sport: sport,
          type: 'drop-in',
          venue: venue,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          recurring: {
            enabled: true,
            pattern: 'weekly',
            daysOfWeek: [dayIndex]
          },
          capacity: sport === 'basketball' ? 20 : sport === 'volleyball' ? 24 : 30,
          currentPlayers: Math.floor(Math.random() * 10),
          skillLevel: ['beginner', 'intermediate', 'all'][Math.floor(Math.random() * 3)],
          price: Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 10) + 5,
          description: `Drop-in ${sport} at ${venue.name}. All skill levels welcome!`,
          amenities: ['parking', 'changerooms', 'water'],
          source: 'official',
          verified: true
        });
      }
    });

    // Add some one-time games
    for (let i = 0; i < 5; i++) {
      const venue = sampleVenues[Math.floor(Math.random() * sampleVenues.length)];
      const sport = sports[Math.floor(Math.random() * sports.length)];
      
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + Math.floor(Math.random() * 14)); // Next 2 weeks
      startTime.setHours(10 + Math.floor(Math.random() * 10), 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 2);

      this.createGame({
        sport: sport,
        type: Math.random() < 0.5 ? 'pickup' : 'tournament',
        venue: venue,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        recurring: {
          enabled: false
        },
        capacity: 20 + Math.floor(Math.random() * 30),
        currentPlayers: Math.floor(Math.random() * 15),
        skillLevel: ['intermediate', 'advanced', 'all'][Math.floor(Math.random() * 3)],
        price: Math.floor(Math.random() * 20) + 10,
        description: `Special ${sport} event at ${venue.name}`,
        amenities: ['parking', 'changerooms', 'water', 'equipment'],
        source: 'user',
        verified: Math.random() < 0.8
      });
    }

    console.log(`Loaded ${this.games.size} sample games at ${this.venues.size} venues`);
  }

  // Export games data
  exportGames() {
    return Array.from(this.games.values());
  }

  // Import games data
  importGames(gamesArray) {
    gamesArray.forEach(game => {
      this.games.set(game.id, game);
      if (game.venue.id) {
        this.venues.set(game.venue.id, game.venue);
      }
    });
  }

  // Get statistics
  getStatistics() {
    const stats = {
      totalGames: this.games.size,
      totalVenues: this.venues.size,
      gamesBySport: {},
      gamesByType: {},
      verifiedGames: 0,
      freeGames: 0,
      todaysGames: 0
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.games.forEach(game => {
      // Count by sport
      stats.gamesBySport[game.sport] = (stats.gamesBySport[game.sport] || 0) + 1;
      
      // Count by type
      stats.gamesByType[game.type] = (stats.gamesByType[game.type] || 0) + 1;
      
      // Count verified
      if (game.verified) stats.verifiedGames++;
      
      // Count free games
      if (game.price === 0) stats.freeGames++;
      
      // Count today's games
      const gameDate = new Date(game.startTime);
      if (gameDate >= today && gameDate < tomorrow) {
        stats.todaysGames++;
      }
    });

    return stats;
  }
}

// Create and export global instance
window.gameDataService = new GameDataService();