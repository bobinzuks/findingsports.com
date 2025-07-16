const axios = require('axios');
const cron = require('node-cron');
const winston = require('winston');
const { RateLimiterMemory } = require('rate-limiter-flexible');

class DataAggregator {
  constructor(gameModel, cacheManager, config = {}) {
    this.gameModel = gameModel;
    this.cacheManager = cacheManager;
    this.config = config;
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });

    // Initialize data sources
    this.dataSources = new Map();
    this.initializeDataSources();

    // Rate limiters for each API
    this.rateLimiters = new Map();
    this.initializeRateLimiters();

    // Track sync status
    this.syncStatus = new Map();
  }

  initializeDataSources() {
    // Google Places API
    if (this.config.googlePlacesApiKey) {
      this.dataSources.set('google_places', {
        name: 'Google Places API',
        enabled: true,
        priority: 1,
        handler: this.fetchGooglePlacesData.bind(this),
        rateLimit: { points: 100, duration: 60 }, // 100 requests per minute
      });
    }

    // Municipal APIs
    this.dataSources.set('toronto_open_data', {
      name: 'Toronto Open Data',
      enabled: true,
      priority: 2,
      handler: this.fetchTorontoData.bind(this),
      rateLimit: { points: 60, duration: 60 },
    });

    this.dataSources.set('nyc_open_data', {
      name: 'NYC Open Data',
      enabled: true,
      priority: 2,
      handler: this.fetchNYCData.bind(this),
      rateLimit: { points: 60, duration: 60 },
    });

    // Recreation Management Systems
    this.dataSources.set('activenet', {
      name: 'ActiveNet',
      enabled: false, // Requires API key
      priority: 3,
      handler: this.fetchActiveNetData.bind(this),
      rateLimit: { points: 30, duration: 60 },
    });

    // Web Scrapers
    this.dataSources.set('ymca_scraper', {
      name: 'YMCA Scraper',
      enabled: true,
      priority: 4,
      handler: this.scrapeYMCAData.bind(this),
      rateLimit: { points: 10, duration: 60 },
    });

    this.dataSources.set('community_center_scraper', {
      name: 'Community Center Scraper',
      enabled: true,
      priority: 4,
      handler: this.scrapeCommunityData.bind(this),
      rateLimit: { points: 20, duration: 60 },
    });

    // RSS/Email parsers
    this.dataSources.set('rss_parser', {
      name: 'RSS Feed Parser',
      enabled: true,
      priority: 5,
      handler: this.parseRSSFeeds.bind(this),
      rateLimit: { points: 30, duration: 60 },
    });
  }

  initializeRateLimiters() {
    for (const [key, source] of this.dataSources) {
      if (source.rateLimit) {
        this.rateLimiters.set(key, new RateLimiterMemory({
          points: source.rateLimit.points,
          duration: source.rateLimit.duration,
        }));
      }
    }
  }

  async aggregateData(location, radius = 10) {
    const results = {
      success: [],
      failed: [],
      totalVenues: 0,
      totalGames: 0,
    };

    // Sort sources by priority
    const sortedSources = Array.from(this.dataSources.entries())
      .filter(([_, source]) => source.enabled)
      .sort((a, b) => a[1].priority - b[1].priority);

    // Fetch data from each source in parallel with rate limiting
    const promises = sortedSources.map(async ([key, source]) => {
      try {
        // Check rate limit
        const rateLimiter = this.rateLimiters.get(key);
        if (rateLimiter) {
          await rateLimiter.consume(key);
        }

        const startTime = Date.now();
        const data = await source.handler(location, radius);
        const duration = Date.now() - startTime;

        // Process and store data
        const processed = await this.processSourceData(key, data);
        
        results.success.push({
          source: source.name,
          venuesFound: processed.venues,
          gamesFound: processed.games,
          duration,
        });

        results.totalVenues += processed.venues;
        results.totalGames += processed.games;

        this.logger.info(`${source.name}: Found ${processed.venues} venues, ${processed.games} games in ${duration}ms`);
      } catch (error) {
        results.failed.push({
          source: source.name,
          error: error.message,
        });
        this.logger.error(`${source.name} failed:`, error);
      }
    });

    await Promise.allSettled(promises);
    
    // Invalidate cache for the area
    await this.cacheManager.invalidate(`search:${location.geohash}`);

    return results;
  }

  async fetchGooglePlacesData(location, radius) {
    const types = ['gym', 'stadium', 'park'];
    const results = [];

    for (const type of types) {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          location: `${location.lat},${location.lng}`,
          radius: radius * 1000,
          type,
          key: this.config.googlePlacesApiKey,
        },
      });

      if (response.data.results) {
        results.push(...response.data.results.map(place => ({
          source: 'google_places',
          sourceId: place.place_id,
          name: place.name,
          address: place.vicinity,
          location: place.geometry.location,
          types: place.types,
          rating: place.rating,
          openingHours: place.opening_hours,
        })));
      }
    }

    return results;
  }

  async fetchTorontoData(location, radius) {
    try {
      // Toronto Recreation Facilities
      const response = await axios.get('https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search', {
        params: {
          resource_id: 'e7c6e6cc-2e4f-4abd-8da3-87f595926744', // Recreation facilities dataset
          limit: 500,
        },
      });

      const facilities = response.data.result.records || [];
      
      // Filter by distance (simple approximation)
      const nearbyFacilities = facilities.filter(facility => {
        if (!facility.Latitude || !facility.Longitude) return false;
        const distance = this.calculateDistance(
          location.lat, location.lng,
          parseFloat(facility.Latitude), parseFloat(facility.Longitude)
        );
        return distance <= radius;
      });

      return nearbyFacilities.map(facility => ({
        source: 'toronto_open_data',
        sourceId: facility._id,
        name: facility.Name,
        address: facility.Address,
        location: {
          lat: parseFloat(facility.Latitude),
          lng: parseFloat(facility.Longitude),
        },
        type: facility.FacilityType,
        programs: facility.Programs,
      }));
    } catch (error) {
      this.logger.error('Toronto API error:', error);
      return [];
    }
  }

  async fetchNYCData(location, radius) {
    try {
      const response = await axios.get('https://data.cityofnewyork.us/resource/xx67-kt59.json', {
        params: {
          $limit: 500,
          $where: `latitude IS NOT NULL AND longitude IS NOT NULL`,
        },
      });

      const facilities = response.data || [];
      
      // Filter by distance
      const nearbyFacilities = facilities.filter(facility => {
        const distance = this.calculateDistance(
          location.lat, location.lng,
          parseFloat(facility.latitude), parseFloat(facility.longitude)
        );
        return distance <= radius;
      });

      return nearbyFacilities.map(facility => ({
        source: 'nyc_open_data',
        sourceId: facility.prop_id,
        name: facility.name,
        address: facility.location,
        location: {
          lat: parseFloat(facility.latitude),
          lng: parseFloat(facility.longitude),
        },
        type: 'athletic_facility',
        sports: facility.sports,
      }));
    } catch (error) {
      this.logger.error('NYC API error:', error);
      return [];
    }
  }

  async fetchActiveNetData(location, radius) {
    // ActiveNet requires authentication and custom implementation
    // This is a placeholder for when API credentials are available
    return [];
  }

  async scrapeYMCAData(location, radius) {
    // Implementation would use puppeteer to scrape YMCA websites
    // This is a simplified version
    const YMCAScraper = require('../scrapers/ymca-scraper');
    const scraper = new YMCAScraper();
    
    try {
      return await scraper.scrapeNearbyLocations(location, radius);
    } catch (error) {
      this.logger.error('YMCA scraper error:', error);
      return [];
    }
  }

  async scrapeCommunityData(location, radius) {
    // Implementation would scrape various community center websites
    const CommunityScraper = require('../scrapers/community-scraper');
    const scraper = new CommunityScraper();
    
    try {
      return await scraper.scrapeNearbyLocations(location, radius);
    } catch (error) {
      this.logger.error('Community scraper error:', error);
      return [];
    }
  }

  async parseRSSFeeds(location, radius) {
    const RSSParser = require('rss-parser');
    const parser = new RSSParser();
    
    // List of RSS feeds for sports venues (would be configured)
    const feeds = this.config.rssFeeds || [];
    const results = [];

    for (const feedUrl of feeds) {
      try {
        const feed = await parser.parseURL(feedUrl);
        // Parse and filter feed items for sports events
        // This is a simplified implementation
        results.push(...this.parseRSSItems(feed.items, location, radius));
      } catch (error) {
        this.logger.error(`RSS feed error (${feedUrl}):`, error);
      }
    }

    return results;
  }

  async processSourceData(source, data) {
    let venueCount = 0;
    let gameCount = 0;

    for (const item of data) {
      try {
        // Add or update venue
        const venue = await this.gameModel.addVenue({
          name: item.name,
          address: item.address,
          latitude: item.location.lat,
          longitude: item.location.lng || item.location.lon,
          type: this.mapVenueType(item.type || item.types),
          source: item.source,
          sourceId: item.sourceId,
          metadata: item,
        });
        venueCount++;

        // Extract games if available
        if (item.games || item.schedule) {
          const games = Array.isArray(item.games) ? item.games : [item.games].filter(Boolean);
          
          for (const game of games) {
            await this.gameModel.addGame({
              venueId: venue.id,
              sport: this.mapSportType(game.sport || game.activity),
              gameType: game.type || 'drop-in',
              startTime: new Date(game.startTime),
              endTime: new Date(game.endTime),
              capacity: game.capacity,
              skillLevel: game.skillLevel || 'all',
              price: game.price || 0,
              source: item.source,
              metadata: game,
            });
            gameCount++;
          }
        }
      } catch (error) {
        this.logger.error(`Error processing ${source} data:`, error);
      }
    }

    return { venues: venueCount, games: gameCount };
  }

  mapVenueType(types) {
    if (!types) return 'other';
    
    const typeArray = Array.isArray(types) ? types : [types];
    const typeString = typeArray.join(' ').toLowerCase();
    
    if (typeString.includes('gym') || typeString.includes('fitness')) return 'gym';
    if (typeString.includes('park')) return 'park';
    if (typeString.includes('arena') || typeString.includes('rink')) return 'arena';
    if (typeString.includes('community') || typeString.includes('recreation')) return 'community_center';
    
    return 'other';
  }

  mapSportType(activity) {
    if (!activity) return 'other';
    
    const normalized = activity.toLowerCase();
    const sportMap = {
      'basketball': ['basketball', 'hoops', 'bball'],
      'soccer': ['soccer', 'football', 'futbol'],
      'hockey': ['hockey', 'ice hockey', 'floor hockey'],
      'volleyball': ['volleyball', 'vball'],
      'tennis': ['tennis'],
      'pickleball': ['pickleball'],
      'badminton': ['badminton'],
      'baseball': ['baseball', 'softball'],
      'football': ['football', 'american football'],
    };

    for (const [sport, keywords] of Object.entries(sportMap)) {
      if (keywords.some(keyword => normalized.includes(keyword))) {
        return sport;
      }
    }

    return 'other';
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async startScheduledSync() {
    // Sync data every hour for major cities
    cron.schedule('0 * * * *', async () => {
      this.logger.info('Starting scheduled data sync...');
      
      const majorCities = this.config.majorCities || [
        { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
        { name: 'New York', lat: 40.7128, lng: -74.0060 },
        { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
      ];

      for (const city of majorCities) {
        try {
          const result = await this.aggregateData({
            lat: city.lat,
            lng: city.lng,
            geohash: geohash.encode(city.lat, city.lng, 4),
          }, 20); // 20km radius for major cities
          
          this.syncStatus.set(city.name, {
            lastSync: new Date(),
            result,
          });
        } catch (error) {
          this.logger.error(`Sync failed for ${city.name}:`, error);
        }
      }
    });
  }

  getSyncStatus() {
    return Object.fromEntries(this.syncStatus);
  }
}

module.exports = DataAggregator;