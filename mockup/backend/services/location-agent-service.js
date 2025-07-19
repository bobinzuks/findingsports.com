const { exec } = require('child_process');
// const geoip = require('geoip-lite'); // Commented out - not essential for MVP
const { promisify } = require('util');
const execAsync = promisify(exec);

class LocationAgentService {
  constructor() {
    this.searchingLocations = new Map(); // Track ongoing searches
    this.locationCache = new Map();
    this.searchResults = new Map();
    this.webSocketService = null;
  }

  setWebSocketService(ws) {
    this.webSocketService = ws;
  }

  async checkLocation(req, res) {
    try {
      // Detect user location
      const userLocation = this.detectLocation(req);
      console.log('Detected location:', userLocation);

      // Check if we're already searching
      if (this.searchingLocations.has(userLocation.id)) {
        const searchId = this.searchingLocations.get(userLocation.id);
        return res.json({
          status: 'searching',
          message: `Already searching for sports in ${userLocation.city}`,
          searchId,
          location: userLocation
        });
      }

      // Check cache
      const cachedData = this.locationCache.get(userLocation.id);
      if (cachedData && this.isCacheValid(cachedData)) {
        return res.json({
          status: 'ready',
          games: cachedData.games,
          location: userLocation
        });
      }

      // Check if location has data in main database
      const hasData = await this.checkLocationData(userLocation);
      if (hasData) {
        return res.json({
          status: 'ready',
          games: hasData,
          location: userLocation
        });
      }

      // Start new search
      const searchId = await this.startLocationSearch(userLocation, req.user?.id);

      return res.json({
        status: 'searching',
        message: `Searching for drop-in sports in ${userLocation.city}. This usually takes 2-5 minutes.`,
        searchId,
        estimatedTime: 180000, // 3 minutes
        location: userLocation
      });
    } catch (error) {
      console.error('Location check error:', error);
      return res.status(500).json({
        error: 'Failed to process location',
        message: error.message
      });
    }
  }

  detectLocation(req) {
    // Priority: query params > geoip > default
    if (req.query.city && req.query.region) {
      return {
        city: req.query.city,
        region: req.query.region,
        country: req.query.country || 'CA',
        lat: parseFloat(req.query.lat) || null,
        lng: parseFloat(req.query.lng) || null,
        id: `${req.query.city}-${req.query.region}`.toLowerCase().replace(/\s+/g, '-')
      };
    }

    // Try IP geolocation - commented out for now
    // const ip = req.ip || req.connection.remoteAddress;
    // const geo = geoip.lookup(ip);
    //
    // if (geo) {
    //     return {
    //         city: geo.city,
    //         region: geo.region,
    //         country: geo.country,
    //         lat: geo.ll[0],
    //         lng: geo.ll[1],
    //         id: `${geo.city}-${geo.region}-${geo.country}`.toLowerCase().replace(/\s+/g, '-')
    //     };
    // }

    // Default to Vancouver
    return {
      city: 'Vancouver',
      region: 'BC',
      country: 'CA',
      lat: 49.2827,
      lng: -123.1207,
      id: 'vancouver-bc-ca'
    };
  }

  async checkLocationData(location) {
    // Check main data pipeline
    const { getInstance: getDataPipeline } = require('./data-aggregation-pipeline');
    const pipeline = getDataPipeline();

    const games = await pipeline.searchGames({
      location: location.city,
      lat: location.lat,
      lng: location.lng
    });

    return games.length > 0 ? games : null;
  }

  async startLocationSearch(location, userId) {
    const searchId = `search_${Date.now()}_${location.id}`;
    this.searchingLocations.set(location.id, searchId);

    // Initialize search tracking
    const searchData = {
      id: searchId,
      location,
      userId,
      status: 'initializing',
      startedAt: new Date(),
      stages: {
        agents: { status: 'pending', progress: 0 },
        search: { status: 'pending', progress: 0 },
        analysis: { status: 'pending', progress: 0 },
        validation: { status: 'pending', progress: 0 },
        storage: { status: 'pending', progress: 0 }
      }
    };

    this.searchResults.set(searchId, searchData);

    // Start async search process
    this.executeSearch(searchId, location, userId).catch(error => {
      console.error('Search execution error:', error);
      this.searchingLocations.delete(location.id);
    });

    return searchId;
  }

  async executeSearch(searchId, location, userId) {
    try {
      // Stage 1: Spawn agents
      await this.updateSearchProgress(searchId, 'agents', 20, 'Spawning search agents...');

      const agentCommand = `npx ruv-swarm spawn researcher "${location.city} Drop-in Sports Researcher"`;
      console.log('Executing:', agentCommand);

      try {
        await execAsync(agentCommand, { cwd: process.cwd() });
      } catch (error) {
        console.log('Agent spawn output:', error.stdout || error.message);
      }

      await this.updateSearchProgress(searchId, 'agents', 100, 'Agents ready');

      // Stage 2: Web search
      await this.updateSearchProgress(searchId, 'search', 10, 'Starting web search...');

      const searchResults = await this.performWebSearch(location);

      await this.updateSearchProgress(searchId, 'search', 100, `Found ${searchResults.length} potential venues`);

      // Stage 3: Analysis
      await this.updateSearchProgress(searchId, 'analysis', 20, 'Analyzing results...');

      const analyzed = await this.analyzeResults(searchResults, location);

      await this.updateSearchProgress(searchId, 'analysis', 100, `Analyzed ${analyzed.length} venues`);

      // Stage 4: Validation
      await this.updateSearchProgress(searchId, 'validation', 50, 'Validating drop-in availability...');

      const validated = this.validateDropIn(analyzed);

      await this.updateSearchProgress(
        searchId,
        'validation',
        100,
        `Validated ${validated.length} drop-in venues`
      );

      // Stage 5: Storage
      await this.updateSearchProgress(searchId, 'storage', 50, 'Storing results...');

      await this.storeResults(validated, location);

      await this.updateSearchProgress(searchId, 'storage', 100, 'Complete!');

      // Cache results
      this.locationCache.set(location.id, {
        games: validated,
        timestamp: Date.now()
      });

      // Clean up
      this.searchingLocations.delete(location.id);

      // Notify completion
      if (userId && this.webSocketService) {
        this.webSocketService.notifyUser(userId, {
          type: 'location_search_complete',
          searchId,
          location,
          gamesFound: validated.length
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      this.searchingLocations.delete(location.id);
      throw error;
    }
  }

  async performWebSearch(location) {
    // Simulate web search - in production, use real search APIs
    const queries = [
      `${location.city} drop-in sports schedule`,
      `${location.city} recreation centers open gym`,
      `${location.city} community center drop-in`,
      `${location.city} YMCA drop-in schedule`,
      `${location.city} pickup basketball`,
      `${location.city} drop-in volleyball`
    ];

    const results = [];

    // Simulated results for demo
    const demoVenues = [
      {
        name: `${location.city} Community Centre`,
        address: `123 Main St, ${location.city}, ${location.region}`,
        sports: ['basketball', 'volleyball', 'badminton'],
        schedule: 'Mon-Fri 6pm-9pm, Sat-Sun 10am-5pm',
        type: 'community-center'
      },
      {
        name: `${location.city} YMCA`,
        address: `456 Sports Ave, ${location.city}, ${location.region}`,
        sports: ['basketball', 'soccer', 'swimming'],
        schedule: 'Daily drop-in times vary by sport',
        type: 'ymca'
      },
      {
        name: `${location.city} Recreation Complex`,
        address: `789 Recreation Blvd, ${location.city}, ${location.region}`,
        sports: ['hockey', 'basketball', 'volleyball'],
        schedule: 'Check website for drop-in times',
        type: 'rec-complex'
      }
    ];

    // In production, this would do actual web searches
    return demoVenues;
  }

  async analyzeResults(searchResults, location) {
    // Process and structure the search results
    const analyzed = [];

    for (const result of searchResults) {
      // Parse schedule into structured format
      const games = this.parseSchedule(result, location);
      analyzed.push(...games);
    }

    return analyzed;
  }

  parseSchedule(venue, location) {
    // Convert venue info into game entries
    const games = [];

    venue.sports.forEach(sport => {
      // Create weekly recurring games
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

      days.forEach(day => {
        games.push({
          title: `Drop-in ${sport}`,
          sport,
          venue: {
            name: venue.name,
            address: venue.address,
            coordinates: {
              lat: location.lat || 0,
              lng: location.lng || 0
            }
          },
          type: 'drop-in',
          recurring: {
            enabled: true,
            pattern: 'weekly',
            dayOfWeek: day
          },
          startTime: this.getNextDate(day, 18), // 6 PM
          endTime: this.getNextDate(day, 21), // 9 PM
          source: {
            type: 'ai-agent',
            name: 'location-search',
            searchId: location.searchId
          }
        });
      });
    });

    return games;
  }

  getNextDate(dayName, hour) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date();
    const todayIndex = today.getDay();
    const targetIndex = days.indexOf(dayName);

    let daysUntil = targetIndex - todayIndex;
    if (daysUntil <= 0) {
      daysUntil += 7;
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    nextDate.setHours(hour, 0, 0, 0);

    return nextDate;
  }

  validateDropIn(games) {
    // Filter out non-drop-in games
    return games.filter(game => {
      const text = `${game.title} ${game.description || ''}`.toLowerCase();
      const isDropIn =
                !text.includes('league') && !text.includes('registration required') && !text.includes('members only');
      return isDropIn;
    });
  }

  async storeResults(games, location) {
    // Store in data pipeline
    const { getInstance: getDataPipeline } = require('./data-aggregation-pipeline');
    const pipeline = getDataPipeline();

    await pipeline.processGames(games);
  }

  async updateSearchProgress(searchId, stage, progress, message) {
    const search = this.searchResults.get(searchId);
    if (!search) {
      return;
    }

    search.stages[stage] = {
      status: progress === 100 ? 'completed' : 'in_progress',
      progress,
      message
    };

    // Calculate overall progress
    const stages = Object.values(search.stages);
    const totalProgress = stages.reduce((sum, s) => sum + s.progress, 0) / stages.length;
    search.progress = totalProgress;

    // Notify via WebSocket
    if (search.userId && this.webSocketService) {
      this.webSocketService.notifyUser(search.userId, {
        type: 'location_search_progress',
        searchId,
        progress: totalProgress,
        stages: search.stages,
        location: search.location
      });
    }
  }

  isCacheValid(cached) {
    const age = Date.now() - cached.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return age < maxAge;
  }

  // Get search status
  getSearchStatus(searchId) {
    return this.searchResults.get(searchId);
  }
}

module.exports = new LocationAgentService();
