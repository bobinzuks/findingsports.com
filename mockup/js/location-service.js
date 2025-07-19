// Location service for British Columbia cities and regions
class LocationService {
  constructor() {
    this.userLocation = null;
    this.currentCity = null;
    this.locationResult = null;

    // BC cities and towns with coordinates
    this.bcLocations = {
      'salmon-arm': {
        name: 'Salmon Arm',
        coordinates: { lat: 50.7031, lng: -119.2733 },
        region: 'Shuswap',
        population: 17464
      },
      kamloops: {
        name: 'Kamloops',
        coordinates: { lat: 50.6745, lng: -120.3273 },
        region: 'Thompson-Nicola',
        population: 97048
      },
      vernon: {
        name: 'Vernon',
        coordinates: { lat: 50.2671, lng: -119.272 },
        region: 'North Okanagan',
        population: 40116
      },
      kelowna: {
        name: 'Kelowna',
        coordinates: { lat: 49.888, lng: -119.496 },
        region: 'Central Okanagan',
        population: 144576
      },
      penticton: {
        name: 'Penticton',
        coordinates: { lat: 49.4928, lng: -119.5937 },
        region: 'South Okanagan',
        population: 33761
      },
      revelstoke: {
        name: 'Revelstoke',
        coordinates: { lat: 50.7981, lng: -118.2095 },
        region: 'Columbia-Shuswap',
        population: 8275
      },
      sicamous: {
        name: 'Sicamous',
        coordinates: { lat: 50.85, lng: -118.9773 },
        region: 'Columbia-Shuswap',
        population: 2441
      },
      enderby: {
        name: 'Enderby',
        coordinates: { lat: 50.5488, lng: -119.1414 },
        region: 'North Okanagan',
        population: 3063
      },
      armstrong: {
        name: 'Armstrong',
        coordinates: { lat: 50.449, lng: -119.2017 },
        region: 'North Okanagan',
        population: 5114
      },
      chase: {
        name: 'Chase',
        coordinates: { lat: 50.8167, lng: -119.6833 },
        region: 'Thompson-Nicola',
        population: 2399
      },
      vancouver: {
        name: 'Vancouver',
        coordinates: { lat: 49.2827, lng: -123.1207 },
        region: 'Metro Vancouver',
        population: 631486
      },
      victoria: {
        name: 'Victoria',
        coordinates: { lat: 48.4284, lng: -123.3656 },
        region: 'Capital Regional District',
        population: 91867
      },
      burnaby: {
        name: 'Burnaby',
        coordinates: { lat: 49.2488, lng: -122.9805 },
        region: 'Metro Vancouver',
        population: 249125
      },
      richmond: {
        name: 'Richmond',
        coordinates: { lat: 49.1666, lng: -123.1336 },
        region: 'Metro Vancouver',
        population: 209937
      },
      surrey: {
        name: 'Surrey',
        coordinates: { lat: 49.1913, lng: -122.849 },
        region: 'Metro Vancouver',
        population: 568322
      },
      abbotsford: {
        name: 'Abbotsford',
        coordinates: { lat: 49.0504, lng: -122.3045 },
        region: 'Fraser Valley',
        population: 153524
      },
      coquitlam: {
        name: 'Coquitlam',
        coordinates: { lat: 49.3847, lng: -122.7584 },
        region: 'Metro Vancouver',
        population: 148625
      },
      langley: {
        name: 'Langley',
        coordinates: { lat: 49.1042, lng: -122.6604 },
        region: 'Metro Vancouver',
        population: 132603
      },
      saanich: {
        name: 'Saanich',
        coordinates: { lat: 48.4959, lng: -123.365 },
        region: 'Capital Regional District',
        population: 117735
      },
      delta: {
        name: 'Delta',
        coordinates: { lat: 49.1459, lng: -123.0583 },
        region: 'Metro Vancouver',
        population: 108455
      },
      'north-vancouver': {
        name: 'North Vancouver',
        coordinates: { lat: 49.3163, lng: -123.0714 },
        region: 'Metro Vancouver',
        population: 88168
      },
      'maple-ridge': {
        name: 'Maple Ridge',
        coordinates: { lat: 49.2197, lng: -122.5957 },
        region: 'Metro Vancouver',
        population: 90990
      },
      nanaimo: {
        name: 'Nanaimo',
        coordinates: { lat: 49.1659, lng: -123.9401 },
        region: 'Regional District of Nanaimo',
        population: 90504
      },
      chilliwack: {
        name: 'Chilliwack',
        coordinates: { lat: 49.1579, lng: -121.9515 },
        region: 'Fraser Valley',
        population: 83788
      },
      'prince-george': {
        name: 'Prince George',
        coordinates: { lat: 53.9171, lng: -122.7497 },
        region: 'Fraser-Fort George',
        population: 76708
      }
    };
  }

  // Get user's current location using browser geolocation
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Try IP-based location if geolocation not available
        this.getIPBasedLocation()
          .then(resolve)
          .catch(() => {
            reject(new Error('Geolocation is not supported and IP location failed'));
          });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: 'gps'
          };
          resolve(this.userLocation);
        },
        async error => {
          console.log('GPS location failed, trying IP-based location:', error.message);
          // Fallback to IP-based detection
          try {
            const ipLocation = await this.getIPBasedLocation();
            resolve(ipLocation);
          } catch (ipError) {
            console.log('IP location failed, using Vancouver as default:', ipError.message);
            // Final fallback to Vancouver (largest BC city)
            this.userLocation = {
              ...this.bcLocations['vancouver'].coordinates,
              source: 'fallback',
              city: 'Vancouver'
            };
            resolve(this.userLocation);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // Cache for 5 minutes
        }
      );
    });
  }

  // Get location based on IP address
  async getIPBasedLocation() {
    try {
      // Try multiple IP geolocation services
      const services = [
        'https://ipapi.co/json/',
        'https://ipinfo.io/json',
        'https://api.ipgeolocation.io/ipgeo?apiKey=demo'
      ];

      for (const service of services) {
        try {
          const response = await fetch(service);
          const data = await response.json();

          let lat;
          let lng;
          let city;
          let region;

          if (service.includes('ipapi.co')) {
            lat = data.latitude;
            lng = data.longitude;
            city = data.city;
            region = data.region;
          } else if (service.includes('ipinfo.io')) {
            const [latStr, lngStr] = data.loc.split(',');
            lat = parseFloat(latStr);
            lng = parseFloat(lngStr);
            city = data.city;
            region = data.region;
          } else if (service.includes('ipgeolocation.io')) {
            lat = parseFloat(data.latitude);
            lng = parseFloat(data.longitude);
            city = data.city;
            region = data.state_prov;
          }

          if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            this.userLocation = {
              lat,
              lng,
              accuracy: 10000, // IP-based is less accurate
              source: 'ip',
              city,
              region
            };
            console.log('IP-based location detected:', this.userLocation);
            return this.userLocation;
          }
        } catch (serviceError) {
          console.log(`IP service ${service} failed:`, serviceError.message);
          continue;
        }
      }

      throw new Error('All IP geolocation services failed');
    } catch (error) {
      console.error('IP-based location detection failed:', error);
      throw error;
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
            (Math.sin(dLat / 2) * Math.sin(dLat / 2)) +
            (Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2));
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Find nearest BC city to user's location
  findNearestCity(userLat, userLng) {
    let nearestCity = null;
    let minDistance = Infinity;

    for (const [cityKey, cityData] of Object.entries(this.bcLocations)) {
      const distance = this.calculateDistance(
        userLat,
        userLng,
        cityData.coordinates.lat,
        cityData.coordinates.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = {
          key: cityKey,
          ...cityData,
          distance: Math.round(distance)
        };
      }
    }

    return nearestCity;
  }

  // Get nearby cities within specified radius (km)
  getNearbyCities(userLat, userLng, radiusKm = 100) {
    const nearbyCities = [];

    for (const [cityKey, cityData] of Object.entries(this.bcLocations)) {
      const distance = this.calculateDistance(
        userLat,
        userLng,
        cityData.coordinates.lat,
        cityData.coordinates.lng
      );

      if (distance <= radiusKm) {
        nearbyCities.push({
          key: cityKey,
          ...cityData,
          distance: Math.round(distance)
        });
      }
    }

    // Sort by distance
    return nearbyCities.sort((a, b) => a.distance - b.distance);
  }

  // Initialize location detection
  async initializeLocation() {
    try {
      const location = await this.getCurrentLocation();
      const nearestCity = this.findNearestCity(location.lat, location.lng);
      const nearbyCities = this.getNearbyCities(location.lat, location.lng, 150);

      this.currentCity = nearestCity;

      // If location was detected from IP and has city info, try to match it
      let detectedLocationInfo = null;
      if (location.source === 'ip' && location.city) {
        detectedLocationInfo = {
          detectedCity: location.city,
          detectedRegion: location.region,
          source: 'ip'
        };
      }

      const result = {
        userLocation: location,
        currentCity: nearestCity,
        nearbyCities,
        detectedLocationInfo,
        success: true,
        fallback: location.source === 'fallback'
      };

      // Store the result for later use
      this.locationResult = result;

      return result;
    } catch (error) {
      console.error('Location detection failed:', error);

      // Fallback to Vancouver (largest BC city, more universal)
      const vancouver = this.bcLocations['vancouver'];
      this.currentCity = {
        key: 'vancouver',
        ...vancouver,
        distance: 0
      };

      const fallbackResult = {
        userLocation: vancouver.coordinates,
        currentCity: this.currentCity,
        nearbyCities: this.getNearbyCities(vancouver.coordinates.lat, vancouver.coordinates.lng, 150),
        success: false,
        fallback: true,
        fallbackReason: error.message
      };

      // Store the fallback result
      this.locationResult = fallbackResult;

      return fallbackResult;
    }
  }

  // Get city data by key
  getCityData(cityKey) {
    return this.bcLocations[cityKey];
  }

  // Get all available cities
  getAllCities() {
    return Object.entries(this.bcLocations).map(([key, data]) => ({
      key,
      ...data
    }));
  }

  // Format location for display
  formatLocation(cityData) {
    return `${cityData.name}, BC`;
  }

  // Get coordinates for a city
  getCityCoordinates(cityKey) {
    const city = this.bcLocations[cityKey];
    return city ? city.coordinates : null;
  }

  // Get stored location information
  getLocationInfo() {
    return this.locationResult;
  }
}

// Create global instance
window.locationService = new LocationService();
