// Play Now service - finds nearest and soonest games
class PlayNowService {
  constructor() {
    this.userLocation = null;
    this.gameCache = new Map();
    this.lastUpdate = null;
  }

  // Set user location
  setUserLocation(lat, lng) {
    this.userLocation = { lat, lng };
  }

  // Calculate distance between user and game
  calculateDistance(gameLat, gameLng) {
    if (!this.userLocation) {
      return Infinity;
    }

    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(gameLat - this.userLocation.lat);
    const dLng = this.toRad(gameLng - this.userLocation.lng);
    const a =
            (Math.sin(dLat / 2) * Math.sin(dLat / 2)) +
            (Math.cos(this.toRad(this.userLocation.lat)) *
                Math.cos(this.toRad(gameLat)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2));
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Get time until game starts in minutes
  getTimeUntilStart(startTime) {
    const now = new Date();
    const gameTime = new Date(startTime);
    return Math.max(0, Math.floor((gameTime - now) / 60000)); // minutes
  }

  // Score games based on proximity and time
  scoreGame(game) {
    let coords = null;

    // Extract coordinates
    if (game.coords && Array.isArray(game.coords)) {
      coords = { lat: game.coords[0], lng: game.coords[1] };
    } else if (game.venue?.coordinates) {
      coords = game.venue.coordinates;
    }

    if (!coords) {
      return -1;
    } // No coordinates, lowest priority

    const distance = this.calculateDistance(coords.lat, coords.lng);
    const timeUntilStart = this.getTimeUntilStart(game.startTime || game.date);

    // Scoring algorithm:
    // - Closer games score higher (inversely proportional to distance)
    // - Games starting soon score higher (but not too soon - need travel time)
    // - Games starting in 30-120 minutes are ideal

    const distanceScore = Math.max(0, 100 - distance); // 100 points at 0km, 0 points at 100km+
    let timeScore = 0;

    if (timeUntilStart < 15) {
      timeScore = 0; // Too soon to get there
    } else if (timeUntilStart <= 30) {
      timeScore = 50; // Cutting it close
    } else if (timeUntilStart <= 120) {
      timeScore = 100; // Perfect timing
    } else if (timeUntilStart <= 360) {
      timeScore = 80 - ((timeUntilStart - 120) * 0.2); // Gradually decrease
    } else {
      timeScore = 20; // Too far in the future
    }

    // Bonus for indoor games (weather-independent)
    const indoorBonus = game.isIndoor || game.indoor ? 10 : 0;

    // Bonus for games with available spots
    const availabilityBonus = this.getAvailabilityBonus(game);

    const totalScore = (distanceScore * 0.4) + (timeScore * 0.4) + indoorBonus + availabilityBonus;

    return {
      score: totalScore,
      distance: Math.round(distance),
      timeUntilStart,
      breakdown: {
        distanceScore,
        timeScore,
        indoorBonus,
        availabilityBonus
      }
    };
  }

  // Calculate availability bonus
  getAvailabilityBonus(game) {
    const current = game.attendees || game.capacity?.current || 0;
    const max = game.maxAttendees || game.capacity?.max || 20;

    const ratio = current / max;

    if (ratio < 0.3) {
      return 15;
    } // Plenty of spots
    if (ratio < 0.7) {
      return 10;
    } // Good availability
    if (ratio < 0.9) {
      return 5;
    } // Getting full
    return 0; // Nearly full
  }

  // Find best "Play Now" games
  async findPlayNowGames(games, maxResults = 3) {
    if (!games || games.length === 0) {
      return [];
    }

    const now = new Date();
    const scoredGames = [];

    for (const game of games) {
      // Skip games that have already started or are full
      const gameTime = new Date(game.startTime || game.date);
      if (gameTime <= now) {
        continue;
      }

      const current = game.attendees || game.capacity?.current || 0;
      const max = game.maxAttendees || game.capacity?.max || 20;
      if (current >= max) {
        continue;
      }

      const scoring = this.scoreGame(game);
      if (scoring.score > 0) {
        scoredGames.push({
          ...game,
          playNowScore: scoring.score,
          distance: scoring.distance,
          timeUntilStart: scoring.timeUntilStart,
          scoreBreakdown: scoring.breakdown
        });
      }
    }

    // Sort by score (highest first)
    scoredGames.sort((a, b) => b.playNowScore - a.playNowScore);

    return scoredGames.slice(0, maxResults);
  }

  // Get recommended games with different criteria
  async getRecommendations(games) {
    const now = new Date();
    const recommendations = {
      playNow: [],
      nearestGames: [],
      soonestGames: [],
      todayGames: [],
      thisWeekGames: []
    };

    // Play Now games (best overall score)
    recommendations.playNow = await this.findPlayNowGames(games, 3);

    // Nearest games (by distance)
    const gamesWithDistance = games
      .map(game => {
        let coords = null;
        if (game.coords && Array.isArray(game.coords)) {
          coords = { lat: game.coords[0], lng: game.coords[1] };
        } else if (game.venue?.coordinates) {
          coords = game.venue.coordinates;
        }

        if (!coords) {
          return null;
        }

        return {
          ...game,
          distance: this.calculateDistance(coords.lat, coords.lng)
        };
      })
      .filter(game => game !== null)
      .sort((a, b) => a.distance - b.distance);

    recommendations.nearestGames = gamesWithDistance.slice(0, 5);

    // Soonest games (by time)
    const futureGames = games
      .filter(game => {
        const gameTime = new Date(game.startTime || game.date);
        return gameTime > now;
      })
      .sort((a, b) => {
        const timeA = new Date(a.startTime || a.date);
        const timeB = new Date(b.startTime || b.date);
        return timeA - timeB;
      });

    recommendations.soonestGames = futureGames.slice(0, 5);

    // Today's games
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    recommendations.todayGames = games.filter(game => {
      const gameTime = new Date(game.startTime || game.date);
      return gameTime >= todayStart && gameTime <= todayEnd && gameTime > now;
    });

    // This week's games
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);

    recommendations.thisWeekGames = games.filter(game => {
      const gameTime = new Date(game.startTime || game.date);
      return gameTime >= weekStart && gameTime <= weekEnd && gameTime > now;
    });

    return recommendations;
  }

  // Format time until start for display
  formatTimeUntilStart(minutes) {
    if (minutes < 60) {
      return `${minutes}m`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    }
  }

  // Format distance for display
  formatDistance(km) {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    } else if (km < 10) {
      return `${km.toFixed(1)}km`;
    } else {
      return `${Math.round(km)}km`;
    }
  }

  // Get urgency level for a game
  getUrgencyLevel(timeUntilStart) {
    if (timeUntilStart <= 30) {
      return 'urgent';
    }
    if (timeUntilStart <= 60) {
      return 'soon';
    }
    if (timeUntilStart <= 120) {
      return 'moderate';
    }
    return 'later';
  }

  // Generate play now recommendation text
  generateRecommendation(game) {
    const urgency = this.getUrgencyLevel(game.timeUntilStart);
    const timeText = this.formatTimeUntilStart(game.timeUntilStart);
    const distanceText = this.formatDistance(game.distance);

    let recommendation = `${game.title} in ${timeText}`;

    if (game.distance < 5) {
      recommendation += ` (${distanceText} away)`;
    } else {
      recommendation += ` (${distanceText})`;
    }

    if (urgency === 'urgent') {
      recommendation += ' - Hurry!';
    } else if (urgency === 'soon') {
      recommendation += ' - Leave soon';
    }

    return recommendation;
  }
}

// Create global instance
window.playNowService = new PlayNowService();
