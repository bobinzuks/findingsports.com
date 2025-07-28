const { parentPort, workerData } = require('worker_threads');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const AbortController = require('abort-controller');

/**
 * Worker thread for parallel data collection
 * Handles API calls, web scraping, and data processing
 */
class AggregatorWorker {
  constructor(workerId, config) {
    this.workerId = workerId;
    this.config = config;
    this.activeRequests = new Map();
  }

  /**
   * Process a batch of sources
   */
  async processBatch(batch) {
    const results = [];
    const promises = [];

    // Process sources in parallel within the batch
    for (const source of batch.sources) {
      const promise = this.collectFromSource(source)
        .then(data => ({
          siteId: source.siteId,
          success: true,
          data,
          timestamp: Date.now()
        }))
        .catch(error => ({
          siteId: source.siteId,
          success: false,
          error: error.message,
          timestamp: Date.now()
        }));

      promises.push(promise);
    }

    // Wait for all sources in batch
    const batchResults = await Promise.allSettled(promises);
    
    // Extract results
    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          siteId: 'unknown',
          success: false,
          error: result.reason?.message || 'Unknown error'
        });
      }
    });

    return results;
  }

  /**
   * Collect data from a single source
   */
  async collectFromSource(source) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      let data = [];

      switch (source.method?.type) {
        case 'api':
          data = await this.collectFromAPI(source, controller.signal);
          break;
        
        case 'scraper':
          data = await this.collectFromScraper(source, controller.signal);
          break;
        
        case 'hybrid':
          data = await this.collectFromHybrid(source, controller.signal);
          break;
        
        default:
          throw new Error(`Unknown collection method: ${source.method?.type}`);
      }

      clearTimeout(timeout);
      return data;

    } catch (error) {
      clearTimeout(timeout);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Collect from API endpoint
   */
  async collectFromAPI(source, signal) {
    const { endpoint, auth, params, headers = {} } = source.method;

    // Build URL with params
    const url = new URL(endpoint);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // Prepare headers
    const requestHeaders = {
      'User-Agent': 'FindingSports/2.0',
      'Accept': 'application/json',
      ...headers
    };

    // Add auth if needed
    if (auth) {
      if (auth.type === 'bearer') {
        requestHeaders['Authorization'] = `Bearer ${auth.token}`;
      } else if (auth.type === 'apiKey') {
        requestHeaders[auth.header || 'X-API-Key'] = auth.key;
      }
    }

    // Make request
    const response = await fetch(url.toString(), {
      headers: requestHeaders,
      signal,
      compress: true
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform data using mapping
    return this.transformAPIData(data, source.method.dataMapping);
  }

  /**
   * Collect from web scraper
   */
  async collectFromScraper(source, signal) {
    const { url, selectors, requiresJS = false } = source.method;

    // For now, use simple HTML parsing
    // In production, would use Puppeteer/Playwright for JS sites
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FindingSports/2.0)'
      },
      signal
    });

    if (!response.ok) {
      throw new Error(`Scraper returned ${response.status}`);
    }

    const html = await response.text();
    
    // Parse HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract data using selectors
    const games = [];
    const gameElements = document.querySelectorAll(selectors.games || '.game');

    gameElements.forEach(element => {
      try {
        const game = this.extractGameData(element, selectors, document);
        if (game && game.venue) {
          games.push(game);
        }
      } catch (error) {
        console.error(`Error extracting game data: ${error.message}`);
      }
    });

    return games;
  }

  /**
   * Collect from hybrid source (API with scraper fallback)
   */
  async collectFromHybrid(source, signal) {
    const { api, scraper, preferredMethod = 'api' } = source.method;

    try {
      if (preferredMethod === 'api') {
        return await this.collectFromAPI({ ...source, method: api }, signal);
      }
    } catch (error) {
      console.log(`API failed for ${source.siteId}, falling back to scraper:`, error.message);
    }

    // Fallback to scraper
    return await this.collectFromScraper({ ...source, method: scraper }, signal);
  }

  /**
   * Transform API data using mapping configuration
   */
  transformAPIData(data, mapping) {
    if (!mapping) return [];

    const games = [];
    const gamesData = this.getNestedValue(data, mapping.games);

    if (!Array.isArray(gamesData)) return [];

    for (const item of gamesData) {
      try {
        const game = {
          id: this.getNestedValue(item, mapping.gameId),
          title: this.getNestedValue(item, mapping.title) || 'Game',
          sport: this.getNestedValue(item, mapping.sport) || source.sport || 'unknown',
          venue: {
            name: this.getNestedValue(item, mapping.venue) || 'Unknown Venue',
            address: this.getNestedValue(item, mapping.address),
            coordinates: this.extractCoordinates(item, mapping)
          },
          startTime: this.getNestedValue(item, mapping.startTime),
          endTime: this.getNestedValue(item, mapping.endTime),
          type: this.getNestedValue(item, mapping.type) || 'general',
          status: this.getNestedValue(item, mapping.status),
          description: this.getNestedValue(item, mapping.description),
          source: source.siteId
        };

        // Validate required fields
        if (game.venue.name && game.startTime) {
          games.push(game);
        }
      } catch (error) {
        console.error(`Error transforming game data: ${error.message}`);
      }
    }

    return games;
  }

  /**
   * Extract game data from DOM element
   */
  extractGameData(element, selectors, document) {
    const game = {
      venue: {},
      source: 'scraper'
    };

    // Extract venue
    if (selectors.venue) {
      const venueEl = element.querySelector(selectors.venue);
      game.venue.name = venueEl?.textContent?.trim();
    }

    // Extract time
    if (selectors.time) {
      const timeEl = element.querySelector(selectors.time);
      game.startTime = this.parseTime(timeEl?.textContent?.trim());
    }

    // Extract sport
    if (selectors.sport) {
      const sportEl = element.querySelector(selectors.sport);
      game.sport = sportEl?.textContent?.trim()?.toLowerCase();
    }

    // Extract title
    if (selectors.title) {
      const titleEl = element.querySelector(selectors.title);
      game.title = titleEl?.textContent?.trim();
    }

    // Extract type
    if (selectors.type) {
      const typeEl = element.querySelector(selectors.type);
      game.type = typeEl?.textContent?.trim()?.toLowerCase();
    }

    return game;
  }

  /**
   * Get nested value from object using path
   */
  getNestedValue(obj, path) {
    if (!path) return undefined;

    return path.split('.').reduce((current, prop) => {
      if (!current) return undefined;

      // Handle array notation
      const arrayMatch = prop.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayProp, index] = arrayMatch;
        return current[arrayProp]?.[parseInt(index)];
      }

      return current[prop];
    }, obj);
  }

  /**
   * Extract coordinates from data
   */
  extractCoordinates(data, mapping) {
    if (!mapping.coordinates) return null;

    const lat = this.getNestedValue(data, mapping.coordinates.lat);
    const lng = this.getNestedValue(data, mapping.coordinates.lng);

    if (lat && lng) {
      return { lat: parseFloat(lat), lng: parseFloat(lng) };
    }

    return null;
  }

  /**
   * Parse time string to ISO format
   */
  parseTime(timeStr) {
    if (!timeStr) return null;

    try {
      // Try parsing as-is
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }

      // Try common formats
      // Add more parsing logic as needed
      return null;
    } catch {
      return null;
    }
  }
}

// Worker thread message handler
const worker = new AggregatorWorker(workerData.workerId, workerData.config);

parentPort.on('message', async (message) => {
  try {
    switch (message.type) {
      case 'PROCESS_BATCH':
        const results = await worker.processBatch(message.batch);
        parentPort.postMessage({
          type: 'BATCH_COMPLETE',
          workerId: workerData.workerId,
          results,
          duration: Date.now() - message.timestamp
        });
        break;

      case 'HEALTH_CHECK':
        parentPort.postMessage({
          type: 'HEALTH_RESPONSE',
          workerId: workerData.workerId,
          status: 'healthy'
        });
        break;

      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  } catch (error) {
    parentPort.postMessage({
      type: 'ERROR',
      workerId: workerData.workerId,
      error: error.message,
      stack: error.stack
    });
  }
});