const { getInstance: getDataPipeline } = require('./data-aggregation-pipeline');
const EventEmitter = require('events');
const crypto = require('crypto');

/**
 * Enhanced Data Aggregation Service with Swarm Support
 * Manages 100+ data sources with intelligent coordination
 */
class DataAggregationSwarm extends EventEmitter {
    constructor() {
        super();
        this.sources = new Map();
        this.collectors = new Map();
        this.siteMethodsDb = new Map(); // In-memory for now, will migrate to PostgreSQL
        this.activeJobs = new Map();
        this.rateLimiters = new Map();
        this.cache = new Map();
        this.discoveryQueue = [];
        this.stats = {
            totalSources: 0,
            successfulCollections: 0,
            failedCollections: 0,
            cacheHits: 0,
            cacheMisses: 0,
            discoveredSources: 0
        };
        
        // Initialize with base pipeline
        this.basePipeline = getDataPipeline();
        
        // Swarm configuration
        this.swarmConfig = {
            maxConcurrentJobs: 20,
            discoveryBatchSize: 5,
            cacheStrategy: 'intelligent',
            rateLimitBuffer: 0.8 // Use 80% of rate limit
        };
        
        this.initializeKnownSources();
    }

    /**
     * Initialize known data sources with their collection methods
     */
    initializeKnownSources() {
        // Import local sports sources
        const { localSportsSources } = require('./local-sports-sources');
        
        // Register all local sports sources
        localSportsSources.forEach(source => {
            this.registerSource({
                ...source,
                reliability: source.reliability || 0.85,
                priority: source.gameType === 'drop-in' ? 'high' : 'normal'
            });
        });

        // Also register existing pipeline sources
        this.registerSource({
            siteId: 'vancouver-community-centers-legacy',
            domain: 'vancouver.ca',
            sport: 'multiple',
            method: {
                type: 'handler',
                handler: 'communityCenter', // Uses existing scraper from pipeline
                rateLimit: { requests: 100, window: '1h' }
            },
            reliability: 0.90
        });

        this.registerSource({
            siteId: 'nvrc-gymnasiums-legacy',
            domain: 'nvrc.ca',
            sport: 'multiple',
            gameType: 'drop-in',
            method: {
                type: 'handler',
                handler: 'nvrcGymnasiums', // Uses existing scraper
                rateLimit: { requests: 50, window: '1h' }
            },
            reliability: 0.88
        });

        console.log(`✅ Initialized ${this.sources.size} local sports data sources`);
        console.log(`📊 Categories: ${this.getSourcesByCategory()}`);
    }

    /**
     * Get sources grouped by category
     */
    getSourcesByCategory() {
        const categories = {
            dropIn: 0,
            openField: 0,
            pickup: 0,
            api: 0,
            scraper: 0
        };

        this.sources.forEach(source => {
            if (source.gameType === 'drop-in') categories.dropIn++;
            if (source.gameType === 'open-field' || source.gameType === 'open-court') categories.openField++;
            if (source.gameType === 'pickup') categories.pickup++;
            if (source.method.type === 'api') categories.api++;
            if (source.method.type === 'scraper') categories.scraper++;
        });

        return categories;
    }

    /**
     * Register a new data source
     */
    registerSource(sourceConfig) {
        const { siteId, domain, method } = sourceConfig;
        
        // Store in site methods database
        this.siteMethodsDb.set(siteId, {
            ...sourceConfig,
            lastUpdated: new Date(),
            failureCount: 0,
            lastSuccessfulCollection: null
        });
        
        // Create rate limiter if needed
        if (method.rateLimit) {
            this.rateLimiters.set(siteId, {
                tokens: method.rateLimit.requests,
                maxTokens: method.rateLimit.requests,
                window: method.rateLimit.window,
                lastRefill: Date.now()
            });
        }
        
        this.sources.set(siteId, sourceConfig);
        this.stats.totalSources++;
        
        this.emit('source:registered', { siteId, domain });
    }

    /**
     * Discover collection method for a new site using AI
     */
    async discoverCollectionMethod(url, sport) {
        console.log(`🔍 Discovering collection method for ${url}`);
        
        try {
            // Analyze the page structure
            const analysis = await this.analyzePage(url);
            
            // Check if it has an API
            const apiEndpoints = await this.detectAPIs(url, analysis);
            
            if (apiEndpoints.length > 0) {
                // Prefer API over scraping
                const validatedEndpoint = await this.validateAPIEndpoint(apiEndpoints[0]);
                if (validatedEndpoint) {
                    return {
                        type: 'api',
                        endpoint: validatedEndpoint.url,
                        auth: validatedEndpoint.auth,
                        dataMapping: validatedEndpoint.mapping
                    };
                }
            }
            
            // Fall back to scraping
            const scrapingPattern = await this.generateScrapingPattern(analysis, sport);
            return {
                type: 'scraper',
                url: url,
                selectors: scrapingPattern.selectors,
                requiresJS: scrapingPattern.requiresJS
            };
            
        } catch (error) {
            console.error(`Failed to discover method for ${url}:`, error);
            throw error;
        }
    }

    /**
     * Analyze page structure for data extraction
     */
    async analyzePage(url) {
        // Simplified implementation - in production, use Puppeteer or Playwright
        const fetch = require('node-fetch');
        const cheerio = require('cheerio');
        
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Analyze common patterns
        const analysis = {
            hasCalendar: $('.calendar, [class*="calendar"], [id*="calendar"]').length > 0,
            hasSchedule: $('.schedule, [class*="schedule"], [id*="schedule"]').length > 0,
            hasEvents: $('.event, [class*="event"], .game, [class*="game"]').length > 0,
            dataAttributes: [],
            jsonLdData: [],
            apiHints: []
        };
        
        // Look for structured data
        $('script[type="application/ld+json"]').each((i, elem) => {
            try {
                const data = JSON.parse($(elem).html());
                analysis.jsonLdData.push(data);
            } catch (e) {
                // Invalid JSON
            }
        });
        
        // Look for API hints in JavaScript
        $('script').each((i, elem) => {
            const script = $(elem).html() || '';
            const apiMatches = script.match(/(?:api|endpoint|url).*?["']([^"']*(?:api|data|events)[^"']*)/gi);
            if (apiMatches) {
                analysis.apiHints.push(...apiMatches);
            }
        });
        
        return analysis;
    }

    /**
     * Detect potential API endpoints
     */
    async detectAPIs(baseUrl, analysis) {
        const potentialEndpoints = [];
        const { URL } = require('url');
        const baseDomain = new URL(baseUrl).origin;
        
        // Common API patterns
        const apiPatterns = [
            '/api/v1/events',
            '/api/v2/events',
            '/api/games',
            '/api/schedule',
            '/data/events',
            '/data/games',
            '/.json',
            '/feed.json'
        ];
        
        // Check common endpoints
        for (const pattern of apiPatterns) {
            potentialEndpoints.push(baseDomain + pattern);
        }
        
        // Extract from page analysis
        if (analysis.apiHints) {
            analysis.apiHints.forEach(hint => {
                if (hint.includes('http')) {
                    potentialEndpoints.push(hint);
                } else if (hint.startsWith('/')) {
                    potentialEndpoints.push(baseDomain + hint);
                }
            });
        }
        
        return [...new Set(potentialEndpoints)];
    }

    /**
     * Generate scraping pattern using AI-like heuristics
     */
    async generateScrapingPattern(analysis, sport) {
        const selectors = {
            games: '',
            venue: '',
            time: '',
            sport: ''
        };
        
        // Common selector patterns for sports data
        const patterns = {
            games: [
                '.game-card', '.event-card', '.match-item',
                '[class*="game"]', '[class*="event"]', '[class*="match"]',
                '.schedule-item', '.calendar-event'
            ],
            venue: [
                '.venue', '.location', '.facility',
                '[class*="venue"]', '[class*="location"]',
                '.address', '.place'
            ],
            time: [
                '.time', '.datetime', '.start-time',
                '[class*="time"]', '[class*="date"]',
                '.when', '.schedule-time'
            ]
        };
        
        // Try to match patterns (simplified - in production use ML)
        selectors.games = patterns.games[0];
        selectors.venue = patterns.venue[0];
        selectors.time = patterns.time[0];
        
        return {
            selectors,
            requiresJS: analysis.hasCalendar || analysis.apiHints.length > 0
        };
    }

    /**
     * Collect data from all enabled sources
     */
    async collectFromAllSources(options = {}) {
        const { sports = [], location = null, forceRefresh = false } = options;
        
        console.log(`🐝 Starting swarm collection from ${this.sources.size} sources`);
        
        // Filter sources based on criteria
        let sourcesToCollect = Array.from(this.sources.entries());
        
        if (sports.length > 0) {
            sourcesToCollect = sourcesToCollect.filter(([id, source]) => 
                sports.includes(source.sport) || source.sport === 'multiple'
            );
        }
        
        // Check cache first unless force refresh
        if (!forceRefresh) {
            sourcesToCollect = sourcesToCollect.filter(([id, source]) => {
                const cacheKey = this.getCacheKey(id, options);
                const cached = this.cache.get(cacheKey);
                if (cached && !this.isCacheStale(cached)) {
                    this.stats.cacheHits++;
                    return false;
                }
                this.stats.cacheMisses++;
                return true;
            });
        }
        
        // Group by rate limit constraints
        const batches = this.createCollectionBatches(sourcesToCollect);
        
        // Collect in parallel batches
        const results = [];
        for (const batch of batches) {
            const batchResults = await Promise.allSettled(
                batch.map(([siteId, source]) => this.collectFromSource(siteId, source))
            );
            results.push(...batchResults);
            
            // Small delay between batches
            await this.delay(100);
        }
        
        // Aggregate results
        const aggregated = this.aggregateResults(results, sourcesToCollect);
        
        // Update stats
        this.updateCollectionStats(results);
        
        return aggregated;
    }

    /**
     * Collect from a single source
     */
    async collectFromSource(siteId, source) {
        // Check rate limit
        if (!this.checkRateLimit(siteId)) {
            console.log(`⏳ Rate limited for ${siteId}, skipping`);
            return { siteId, data: [], skipped: true };
        }
        
        try {
            console.log(`📊 Collecting from ${siteId}`);
            
            let data = [];
            const method = source.method;
            
            switch (method.type) {
                case 'api':
                    data = await this.collectFromAPI(siteId, method);
                    break;
                case 'scraper':
                    data = await this.collectFromScraper(siteId, method);
                    break;
                case 'handler':
                    // Use existing pipeline handler
                    data = await this.collectFromHandler(siteId, method);
                    break;
            }
            
            // Update success metrics
            this.updateSourceMetrics(siteId, true);
            
            // Cache the results
            const cacheKey = this.getCacheKey(siteId);
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now(),
                ttl: this.calculateTTL(source)
            });
            
            return { siteId, data, success: true };
            
        } catch (error) {
            console.error(`❌ Failed to collect from ${siteId}:`, error.message);
            this.updateSourceMetrics(siteId, false);
            return { siteId, data: [], error: error.message };
        }
    }

    /**
     * Collect from API endpoint
     */
    async collectFromAPI(siteId, method) {
        const fetch = require('node-fetch');
        
        const response = await fetch(method.endpoint, {
            headers: method.auth ? { 'Authorization': method.auth } : {}
        });
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // Map data to standard format
        return this.mapAPIData(data, method.dataMapping);
    }

    /**
     * Collect from web scraper
     */
    async collectFromScraper(siteId, method) {
        // For now, return empty - would implement with Puppeteer/Playwright
        console.log(`🕷️ Scraping ${siteId} from ${method.url || method.urls?.[0]}`);
        
        // In production, this would:
        // 1. Launch headless browser
        // 2. Navigate to URL(s)
        // 3. Wait for selectors
        // 4. Extract data
        // 5. Parse and normalize
        
        return [];
    }

    /**
     * Collect using existing handler from pipeline
     */
    async collectFromHandler(siteId, method) {
        const { handler } = method;
        
        // Use existing pipeline scrapers
        if (handler === 'communityCenter' && this.basePipeline.sources.communityCenter) {
            const games = await this.basePipeline.sources.communityCenter.scrapeAllCenters();
            return games;
        }
        
        if (handler === 'nvrcGymnasiums' && this.basePipeline.sources.nvrcGymnasiums) {
            const { dropInGames } = await this.basePipeline.sources.nvrcGymnasiums.scrapeGymnasiumSchedules();
            return dropInGames;
        }
        
        console.warn(`Handler ${handler} not found`);
        return [];
    }

    /**
     * Check and update rate limit
     */
    checkRateLimit(siteId) {
        const limiter = this.rateLimiters.get(siteId);
        if (!limiter) return true;
        
        // Refill tokens if needed
        const now = Date.now();
        const windowMs = this.parseTimeWindow(limiter.window);
        const timePassed = now - limiter.lastRefill;
        
        if (timePassed >= windowMs) {
            limiter.tokens = limiter.maxTokens;
            limiter.lastRefill = now;
        }
        
        if (limiter.tokens > 0) {
            limiter.tokens--;
            return true;
        }
        
        return false;
    }

    /**
     * Create batches respecting rate limits
     */
    createCollectionBatches(sources) {
        const batches = [];
        const batchSize = this.swarmConfig.maxConcurrentJobs;
        
        for (let i = 0; i < sources.length; i += batchSize) {
            batches.push(sources.slice(i, i + batchSize));
        }
        
        return batches;
    }

    /**
     * Update source reliability metrics
     */
    updateSourceMetrics(siteId, success) {
        const source = this.siteMethodsDb.get(siteId);
        if (!source) return;
        
        if (success) {
            source.lastSuccessfulCollection = new Date();
            source.failureCount = 0;
            // Increase reliability score
            source.reliability = Math.min(1, source.reliability + 0.01);
        } else {
            source.failureCount++;
            // Decrease reliability score
            source.reliability = Math.max(0, source.reliability - 0.05);
        }
        
        source.lastUpdated = new Date();
    }

    /**
     * Calculate intelligent TTL based on source characteristics
     */
    calculateTTL(source) {
        const baseThL = 3600000; // 1 hour base
        
        // Adjust based on reliability
        const reliabilityFactor = source.reliability || 0.8;
        
        // Adjust based on sport type
        const sportFactors = {
            'drop-in': 0.5,  // More frequent updates
            'league': 2.0,   // Less frequent updates
            'tournament': 1.0
        };
        
        const sportFactor = sportFactors[source.gameType] || 1.0;
        
        return Math.floor(baseThL * reliabilityFactor * sportFactor);
    }

    /**
     * Get cache key for source
     */
    getCacheKey(siteId, options = {}) {
        const parts = [siteId];
        if (options.sport) parts.push(options.sport);
        if (options.location) parts.push(options.location);
        return parts.join(':');
    }

    /**
     * Check if cache is stale
     */
    isCacheStale(cached) {
        if (!cached || !cached.timestamp) return true;
        
        const age = Date.now() - cached.timestamp;
        const ttl = cached.ttl || 3600000; // Default 1 hour
        
        // Check if it's the first request of the day
        const now = new Date();
        const cacheDate = new Date(cached.timestamp);
        if (now.getDate() !== cacheDate.getDate()) {
            return true; // Force refresh on new day
        }
        
        return age > ttl;
    }

    /**
     * Aggregate results from multiple sources
     */
    aggregateResults(results, sources) {
        const games = [];
        const errors = [];
        const sourceSummary = {};
        
        results.forEach((result, index) => {
            const [siteId, source] = sources[index];
            
            if (result.status === 'fulfilled' && result.value.success) {
                games.push(...result.value.data);
                sourceSummary[siteId] = {
                    success: true,
                    count: result.value.data.length
                };
            } else {
                errors.push({
                    siteId,
                    error: result.reason || result.value?.error
                });
                sourceSummary[siteId] = {
                    success: false,
                    error: result.reason?.message
                };
            }
        });
        
        // Deduplicate games
        const uniqueGames = this.deduplicateGames(games);
        
        return {
            games: uniqueGames,
            meta: {
                totalSources: sources.length,
                successfulSources: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
                totalGames: uniqueGames.length,
                sourceSummary,
                errors: errors.length > 0 ? errors : undefined,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Deduplicate games based on venue, time, and sport
     */
    deduplicateGames(games) {
        const seen = new Map();
        
        return games.filter(game => {
            const key = `${game.venue?.name || ''}-${game.sport}-${new Date(game.startTime).toISOString()}`;
            if (seen.has(key)) {
                // Keep the one with higher reliability
                const existing = seen.get(key);
                if (game.reliability > existing.reliability) {
                    seen.set(key, game);
                    return true;
                }
                return false;
            }
            seen.set(key, game);
            return true;
        });
    }

    /**
     * Get swarm statistics
     */
    getStats() {
        const sourceStats = Array.from(this.siteMethodsDb.values()).map(source => ({
            siteId: source.siteId,
            domain: source.domain,
            sport: source.sport,
            reliability: source.reliability,
            lastSuccess: source.lastSuccessfulCollection,
            failureCount: source.failureCount
        }));
        
        return {
            ...this.stats,
            sources: sourceStats,
            cacheSize: this.cache.size,
            activeJobs: this.activeJobs.size,
            queuedDiscovery: this.discoveryQueue.length
        };
    }

    /**
     * Helper utilities
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    parseTimeWindow(window) {
        const units = {
            's': 1000,
            'm': 60000,
            'h': 3600000,
            'd': 86400000
        };
        
        const match = window.match(/(\d+)([smhd])/);
        if (!match) return 3600000; // Default 1 hour
        
        const [, value, unit] = match;
        return parseInt(value) * units[unit];
    }

    mapAPIData(data, mapping) {
        // Simplified data mapping - in production use more sophisticated mapping
        const games = [];
        
        // Extract games array from nested structure
        const gamesPath = mapping.games;
        const gamesData = this.getNestedValue(data, gamesPath) || [];
        
        for (const item of gamesData) {
            games.push({
                title: item.name || 'Game',
                sport: item.sport || 'basketball',
                venue: {
                    name: this.getNestedValue(item, mapping.venue) || 'Unknown Venue'
                },
                startTime: this.getNestedValue(item, mapping.time) || new Date()
            });
        }
        
        return games;
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((curr, prop) => {
            if (prop.includes('[') && prop.includes(']')) {
                const [arrProp, index] = prop.split('[');
                const idx = parseInt(index.replace(']', ''));
                return curr?.[arrProp]?.[idx];
            }
            return curr?.[prop];
        }, obj);
    }

    updateCollectionStats(results) {
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value.success) {
                this.stats.successfulCollections++;
            } else {
                this.stats.failedCollections++;
            }
        });
    }
}

// Singleton instance
let swarmInstance;

module.exports = {
    getInstance: () => {
        if (!swarmInstance) {
            swarmInstance = new DataAggregationSwarm();
        }
        return swarmInstance;
    },
    DataAggregationSwarm
};