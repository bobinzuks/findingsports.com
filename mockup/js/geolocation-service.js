// Enhanced Geolocation Service with Mapbox Integration
class GeolocationService {
  constructor() {
    this.userLocation = null;
    this.locationPermission = null;
    this.watchId = null;
    this.locationListeners = [];
    this.nearbyGames = [];
    this.searchRadius = 10; // Default 10km radius
    
    // Initialize Mapbox geocoder
    this.mapboxToken = window.CONFIG?.MAPBOX_API_KEY || null;
    this.geocoder = null;
    
    // Location update throttling
    this.lastLocationUpdate = 0;
    this.updateThreshold = 1000; // Update at most once per second
    
    // Games data cache
    this.gamesCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
  }

  async initialize() {
    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      // Check permission status if available
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        this.locationPermission = permission.state;
        
        permission.addEventListener('change', () => {
          this.locationPermission = permission.state;
          this.notifyListeners('permissionChange', permission.state);
        });
      }

      // Initialize Mapbox geocoder if token is available
      if (this.mapboxToken && window.mapboxgl) {
        this.geocoder = new window.MapboxGeocoder({
          accessToken: this.mapboxToken,
          mapboxgl: window.mapboxgl,
          placeholder: 'Search for location...',
          countries: 'ca', // Limit to Canada
          bbox: [-141.003, 41.676, -52.621, 83.108], // Canada bounding box
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize geolocation service:', error);
      throw error;
    }
  }

  // Get current user location
  async getCurrentLocation(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000, // Cache location for 30 seconds
      ...options
    };

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            source: 'gps'
          };

          // Reverse geocode to get city name
          if (this.mapboxToken) {
            try {
              const cityInfo = await this.reverseGeocode(location.lat, location.lng);
              location.city = cityInfo.city;
              location.region = cityInfo.region;
              location.address = cityInfo.address;
            } catch (error) {
              console.warn('Reverse geocoding failed:', error);
            }
          }

          this.userLocation = location;
          this.notifyListeners('locationUpdate', location);
          
          // Automatically fetch nearby games
          this.fetchNearbyGames(location);
          
          resolve(location);
        },
        async (error) => {
          console.error('GPS location failed:', error);
          
          // Try fallback methods
          try {
            const fallbackLocation = await this.getFallbackLocation();
            this.userLocation = fallbackLocation;
            this.notifyListeners('locationUpdate', fallbackLocation);
            resolve(fallbackLocation);
          } catch (fallbackError) {
            reject(fallbackError);
          }
        },
        defaultOptions
      );
    });
  }

  // Watch user location for real-time updates
  watchLocation(callback, options = {}) {
    if (this.watchId !== null) {
      this.stopWatching();
    }

    const watchOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
      ...options
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - this.lastLocationUpdate < this.updateThreshold) {
          return; // Throttle updates
        }

        this.lastLocationUpdate = now;
        
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          source: 'gps'
        };

        this.userLocation = location;
        this.notifyListeners('locationUpdate', location);
        
        // Fetch nearby games if location changed significantly
        if (this.hasLocationChangedSignificantly(location)) {
          this.fetchNearbyGames(location);
        }

        if (callback) {
          callback(location);
        }
      },
      (error) => {
        console.error('Location watch error:', error);
        this.notifyListeners('locationError', error);
      },
      watchOptions
    );

    return this.watchId;
  }

  // Stop watching location
  stopWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Reverse geocode coordinates to get address
  async reverseGeocode(lat, lng) {
    if (!this.mapboxToken) {
      throw new Error('Mapbox token not configured');
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${this.mapboxToken}&types=place,locality,neighborhood&country=ca`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const context = feature.context || [];
        
        const city = feature.text || this.extractFromContext(context, 'place');
        const region = this.extractFromContext(context, 'region');
        
        return {
          address: feature.place_name,
          city: city || 'Unknown',
          region: region || 'BC',
          neighborhood: this.extractFromContext(context, 'neighborhood'),
          postalCode: this.extractFromContext(context, 'postcode')
        };
      }

      return {
        address: 'Unknown location',
        city: 'Unknown',
        region: 'BC'
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  }

  // Extract value from Mapbox context
  extractFromContext(context, type) {
    const item = context.find(c => c.id.startsWith(type));
    return item ? item.text : null;
  }

  // Forward geocode address to coordinates
  async geocodeAddress(address) {
    if (!this.mapboxToken) {
      throw new Error('Mapbox token not configured');
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${this.mapboxToken}&country=ca&types=address,place`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        
        return {
          lat,
          lng,
          address: feature.place_name,
          confidence: feature.relevance
        };
      }

      throw new Error('Address not found');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  // Fetch games near a location
  async fetchNearbyGames(location, radius = null) {
    const searchRadius = radius || this.searchRadius;
    const cacheKey = `${location.lat.toFixed(3)},${location.lng.toFixed(3)}_${searchRadius}`;
    
    // Check cache first
    const cached = this.gamesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      this.nearbyGames = cached.games;
      this.notifyListeners('gamesUpdate', cached.games);
      return cached.games;
    }

    try {
      // Call the backend API to get games
      const response = await fetch(`/api/v2/games/nearby?lat=${location.lat}&lng=${location.lng}&radius=${searchRadius}`, {
        headers: {
          'Accept': 'application/json',
          'X-User-Location': JSON.stringify({
            lat: location.lat,
            lng: location.lng,
            city: location.city || 'Unknown'
          })
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch games: ${response.statusText}`);
      }

      const data = await response.json();
      const games = data.games || [];
      
      // Process and enrich game data
      const enrichedGames = games.map(game => ({
        ...game,
        distance: this.calculateDistance(
          location.lat, 
          location.lng, 
          game.venue.coordinates.lat, 
          game.venue.coordinates.lng
        ),
        isToday: this.isGameToday(game.startTime),
        isLive: this.isGameLive(game.startTime, game.endTime),
        formattedTime: this.formatGameTime(game.startTime)
      }));

      // Sort by distance and time
      enrichedGames.sort((a, b) => {
        // Prioritize live games
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        
        // Then by distance
        return a.distance - b.distance;
      });

      // Cache the results
      this.gamesCache.set(cacheKey, {
        games: enrichedGames,
        timestamp: Date.now()
      });

      this.nearbyGames = enrichedGames;
      this.notifyListeners('gamesUpdate', enrichedGames);
      
      return enrichedGames;
    } catch (error) {
      console.error('Failed to fetch nearby games:', error);
      this.notifyListeners('gamesError', error);
      throw error;
    }
  }

  // Get fallback location (IP-based or default)
  async getFallbackLocation() {
    try {
      // Try IP-based geolocation
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          lat: data.latitude,
          lng: data.longitude,
          accuracy: 10000, // 10km accuracy for IP-based
          city: data.city,
          region: data.region,
          source: 'ip',
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.warn('IP geolocation failed:', error);
    }

    // Final fallback to Vancouver
    return {
      lat: 49.2827,
      lng: -123.1207,
      accuracy: 50000, // 50km accuracy for fallback
      city: 'Vancouver',
      region: 'BC',
      source: 'fallback',
      timestamp: Date.now()
    };
  }

  // Calculate distance between two points (Haversine formula)
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

  // Check if location changed significantly (more than 100m)
  hasLocationChangedSignificantly(newLocation) {
    if (!this.userLocation) return true;
    
    const distance = this.calculateDistance(
      this.userLocation.lat,
      this.userLocation.lng,
      newLocation.lat,
      newLocation.lng
    );
    
    return distance > 0.1; // 100 meters
  }

  // Game time utilities
  isGameToday(startTime) {
    const gameDate = new Date(startTime);
    const today = new Date();
    return gameDate.toDateString() === today.toDateString();
  }

  isGameLive(startTime, endTime) {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    return now >= start && now <= end;
  }

  formatGameTime(startTime) {
    const date = new Date(startTime);
    const options = {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    if (this.isGameToday(startTime)) {
      return `Today ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
    
    return date.toLocaleDateString('en-US', options);
  }

  // Filter games by criteria
  filterGames(criteria = {}) {
    let filtered = [...this.nearbyGames];
    
    if (criteria.sport) {
      filtered = filtered.filter(game => game.sport === criteria.sport);
    }
    
    if (criteria.maxDistance) {
      filtered = filtered.filter(game => game.distance <= criteria.maxDistance);
    }
    
    if (criteria.today) {
      filtered = filtered.filter(game => this.isGameToday(game.startTime));
    }
    
    if (criteria.live) {
      filtered = filtered.filter(game => game.isLive);
    }
    
    if (criteria.type) {
      filtered = filtered.filter(game => game.type === criteria.type);
    }
    
    return filtered;
  }

  // Event listener management
  addEventListener(event, callback) {
    this.locationListeners.push({ event, callback });
  }

  removeEventListener(event, callback) {
    this.locationListeners = this.locationListeners.filter(
      listener => listener.event !== event || listener.callback !== callback
    );
  }

  notifyListeners(event, data) {
    this.locationListeners
      .filter(listener => listener.event === event)
      .forEach(listener => listener.callback(data));
  }

  // Update search radius
  setSearchRadius(radius) {
    this.searchRadius = radius;
    if (this.userLocation) {
      this.fetchNearbyGames(this.userLocation);
    }
  }

  // Get games grouped by distance
  getGamesByDistance() {
    const groups = {
      nearby: [], // < 2km
      close: [],  // 2-5km
      moderate: [], // 5-10km
      far: []     // > 10km
    };

    this.nearbyGames.forEach(game => {
      if (game.distance < 2) {
        groups.nearby.push(game);
      } else if (game.distance < 5) {
        groups.close.push(game);
      } else if (game.distance < 10) {
        groups.moderate.push(game);
      } else {
        groups.far.push(game);
      }
    });

    return groups;
  }

  // Get games grouped by sport
  getGamesBySport() {
    const groups = {};
    
    this.nearbyGames.forEach(game => {
      if (!groups[game.sport]) {
        groups[game.sport] = [];
      }
      groups[game.sport].push(game);
    });

    return groups;
  }

  // Clear all cached data
  clearCache() {
    this.gamesCache.clear();
    this.nearbyGames = [];
  }
}

// Create and export global instance
window.geolocationService = new GeolocationService();