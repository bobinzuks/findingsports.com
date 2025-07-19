// BC locations mapping for server-side location handling
const bcLocations = {
  'salmon-arm': {
    name: 'Salmon Arm',
    coordinates: { lat: 50.7031, lng: -119.2733 },
    region: 'Shuswap',
    aliases: ['salmonarm', 'salmon arm']
  },
  kamloops: {
    name: 'Kamloops',
    coordinates: { lat: 50.6745, lng: -120.3273 },
    region: 'Thompson-Nicola',
    aliases: ['kamloops']
  },
  vernon: {
    name: 'Vernon',
    coordinates: { lat: 50.2671, lng: -119.272 },
    region: 'North Okanagan',
    aliases: ['vernon']
  },
  kelowna: {
    name: 'Kelowna',
    coordinates: { lat: 49.888, lng: -119.496 },
    region: 'Central Okanagan',
    aliases: ['kelowna']
  },
  penticton: {
    name: 'Penticton',
    coordinates: { lat: 49.4928, lng: -119.5937 },
    region: 'South Okanagan',
    aliases: ['penticton']
  },
  revelstoke: {
    name: 'Revelstoke',
    coordinates: { lat: 50.7981, lng: -118.2095 },
    region: 'Columbia-Shuswap',
    aliases: ['revelstoke']
  },
  sicamous: {
    name: 'Sicamous',
    coordinates: { lat: 50.85, lng: -118.9773 },
    region: 'Columbia-Shuswap',
    aliases: ['sicamous']
  },
  enderby: {
    name: 'Enderby',
    coordinates: { lat: 50.5488, lng: -119.1414 },
    region: 'North Okanagan',
    aliases: ['enderby']
  },
  armstrong: {
    name: 'Armstrong',
    coordinates: { lat: 50.449, lng: -119.2017 },
    region: 'North Okanagan',
    aliases: ['armstrong']
  },
  chase: {
    name: 'Chase',
    coordinates: { lat: 50.8167, lng: -119.6833 },
    region: 'Thompson-Nicola',
    aliases: ['chase']
  },
  vancouver: {
    name: 'Vancouver',
    coordinates: { lat: 49.2827, lng: -123.1207 },
    region: 'Metro Vancouver',
    aliases: ['vancouver', 'van']
  },
  victoria: {
    name: 'Victoria',
    coordinates: { lat: 48.4284, lng: -123.3656 },
    region: 'Capital Regional District',
    aliases: ['victoria', 'vic']
  },
  burnaby: {
    name: 'Burnaby',
    coordinates: { lat: 49.2488, lng: -122.9805 },
    region: 'Metro Vancouver',
    aliases: ['burnaby']
  },
  richmond: {
    name: 'Richmond',
    coordinates: { lat: 49.1666, lng: -123.1336 },
    region: 'Metro Vancouver',
    aliases: ['richmond']
  },
  surrey: {
    name: 'Surrey',
    coordinates: { lat: 49.1913, lng: -122.849 },
    region: 'Metro Vancouver',
    aliases: ['surrey']
  }
};

class BCLocationService {
  // Get location data by key
  getLocation(locationKey) {
    if (!locationKey) {
      return null;
    }
    return bcLocations[locationKey.toLowerCase()];
  }

  // Find location by name or alias
  findLocation(searchTerm) {
    if (!searchTerm) {
      return null;
    }

    const term = searchTerm.toLowerCase().trim();

    // Check exact key match
    if (bcLocations[term]) {
      return { key: term, ...bcLocations[term] };
    }

    // Check aliases
    for (const [key, locationData] of Object.entries(bcLocations)) {
      if (locationData.aliases.includes(term)) {
        return { key, ...locationData };
      }
    }

    return null;
  }

  // Get coordinates for a location
  getCoordinates(locationKey) {
    const location = this.getLocation(locationKey);
    return location ? location.coordinates : null;
  }

  // Calculate distance between two points
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Get nearby locations within radius
  getNearbyLocations(locationKey, radiusKm = 100) {
    const centerLocation = this.getLocation(locationKey);
    if (!centerLocation) {
      return [];
    }

    const nearbyLocations = [];
    const centerLat = centerLocation.coordinates.lat;
    const centerLng = centerLocation.coordinates.lng;

    for (const [key, locationData] of Object.entries(bcLocations)) {
      if (key === locationKey) {
        continue;
      } // Skip self

      const distance = this.calculateDistance(
        centerLat,
        centerLng,
        locationData.coordinates.lat,
        locationData.coordinates.lng
      );

      if (distance <= radiusKm) {
        nearbyLocations.push({
          key,
          ...locationData,
          distance: Math.round(distance)
        });
      }
    }

    return nearbyLocations.sort((a, b) => a.distance - b.distance);
  }

  // Expand search to include nearby locations
  expandLocationSearch(locationKey, radiusKm = 150) {
    const locations = [locationKey];
    const nearby = this.getNearbyLocations(locationKey, radiusKm);

    nearby.forEach(location => {
      locations.push(location.key);
    });

    return locations;
  }

  // Get all BC locations
  getAllLocations() {
    return Object.entries(bcLocations).map(([key, data]) => ({
      key,
      ...data
    }));
  }

  // Normalize location query for search
  normalizeLocationQuery(locationQuery) {
    if (!locationQuery) {
      return null;
    }

    // If it's already a known key, return it
    if (bcLocations[locationQuery.toLowerCase()]) {
      return locationQuery.toLowerCase();
    }

    // Try to find by name or alias
    const found = this.findLocation(locationQuery);
    return found ? found.key : null;
  }

  // Check if a game is within reasonable distance of a location
  isGameNearLocation(game, locationKey, maxDistanceKm = 50) {
    const locationData = this.getLocation(locationKey);
    if (!locationData) {
      return false;
    }

    // Get game coordinates
    let gameCoords = null;
    if (game.coords && Array.isArray(game.coords)) {
      gameCoords = { lat: game.coords[0], lng: game.coords[1] };
    } else if (game.venue?.coordinates) {
      gameCoords = game.venue.coordinates;
    }

    if (!gameCoords) {
      return false;
    }

    const distance = this.calculateDistance(
      locationData.coordinates.lat,
      locationData.coordinates.lng,
      gameCoords.lat,
      gameCoords.lng
    );

    return distance <= maxDistanceKm;
  }

  // Get search suggestions for location autocomplete
  getLocationSuggestions(query) {
    if (!query || query.length < 2) {
      return [];
    }

    const queryLower = query.toLowerCase();
    const suggestions = [];

    for (const [key, locationData] of Object.entries(bcLocations)) {
      // Check name match
      if (locationData.name.toLowerCase().includes(queryLower)) {
        suggestions.push({
          key,
          name: locationData.name,
          region: locationData.region,
          type: 'name'
        });
      }

      // Check alias matches
      locationData.aliases.forEach(alias => {
        if (alias.includes(queryLower) && !suggestions.find(s => s.key === key)) {
          suggestions.push({
            key,
            name: locationData.name,
            region: locationData.region,
            type: 'alias'
          });
        }
      });
    }

    return suggestions.slice(0, 10); // Limit to 10 suggestions
  }
}

module.exports = new BCLocationService();
