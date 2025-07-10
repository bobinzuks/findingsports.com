const EventEmitter = require('events');

/**
 * Site Methods Manager
 * Manages the database of site-specific collection methods
 * Includes AI discovery, validation, and optimization
 */
class SiteMethodsManager extends EventEmitter {
    constructor() {
        super();
        
        // In-memory database (will be migrated to PostgreSQL)
        this.methods = new Map();
        this.pendingDiscovery = new Map();
        this.validationQueue = [];
        
        // Statistics
        this.stats = {
            totalMethods: 0,
            apiMethods: 0,
            scraperMethods: 0,
            hybridMethods: 0,
            verifiedMethods: 0,
            pendingMethods: 0,
            failedMethods: 0
        };
        
        // Initialize with known methods
        this.initializeKnownMethods();
    }

    /**
     * Initialize with known collection methods
     */
    initializeKnownMethods() {
        const knownMethods = [
            // ESPN APIs
            {
                siteId: 'espn-nba',
                domain: 'espn.com',
                sport: 'basketball',
                league: 'nba',
                method: {
                    type: 'api',
                    endpoints: {
                        scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
                        teams: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
                        schedule: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/schedule'
                    },
                    rateLimit: { requests: 1000, window: '1h' },
                    dataMapping: {
                        games: 'events',
                        gameId: 'id',
                        teams: 'competitions[0].competitors',
                        venue: 'competitions[0].venue.fullName',
                        startTime: 'competitions[0].date',
                        status: 'competitions[0].status.type.description'
                    },
                    headers: {
                        'User-Agent': 'FindingSports/1.0'
                    }
                },
                reliability: 0.95,
                validationStatus: 'verified'
            },
            
            // Yahoo Sports Scraper
            {
                siteId: 'yahoo-sports-nba',
                domain: 'sports.yahoo.com',
                sport: 'basketball',
                league: 'nba',
                method: {
                    type: 'scraper',
                    urls: {
                        scoreboard: 'https://sports.yahoo.com/nba/scoreboard/',
                        schedule: 'https://sports.yahoo.com/nba/schedule/'
                    },
                    selectors: {
                        games: '.game-card-container',
                        teams: {
                            home: '.home-team .team-name',
                            away: '.away-team .team-name'
                        },
                        score: {
                            home: '.home-team .score',
                            away: '.away-team .score'
                        },
                        venue: '.game-location',
                        time: '.game-time',
                        status: '.game-status'
                    },
                    requiresJS: true,
                    waitForSelector: '.game-card-container',
                    scrollToLoad: false
                },
                reliability: 0.85,
                validationStatus: 'verified'
            },
            
            // SportsLine API
            {
                siteId: 'sportsline-api',
                domain: 'sportsline.com',
                sport: 'multiple',
                method: {
                    type: 'hybrid',
                    api: {
                        endpoint: 'https://api.sportsline.com/v1/games',
                        auth: {
                            type: 'apiKey',
                            header: 'X-API-Key'
                        }
                    },
                    scraper: {
                        fallbackUrl: 'https://www.sportsline.com/schedule',
                        selectors: {
                            games: '.schedule-game'
                        }
                    },
                    preferredMethod: 'api',
                    fallbackOn: ['401', '403', '500']
                },
                reliability: 0.90,
                validationStatus: 'verified'
            },
            
            // Local Recreation Centers
            {
                siteId: 'vancouver-rec-centers',
                domain: 'vancouver.ca',
                sport: 'multiple',
                gameType: 'drop-in',
                method: {
                    type: 'scraper',
                    urls: [
                        'https://vancouver.ca/parks-recreation-culture/community-centres.aspx'
                    ],
                    selectors: {
                        centers: '.centre-listing',
                        schedule: '.drop-in-schedule',
                        activity: '.activity-name',
                        time: '.time-slot',
                        location: '.facility-name'
                    },
                    pagination: {
                        type: 'load-more',
                        selector: '.load-more-button'
                    },
                    dataProcessing: {
                        filterDropIn: true,
                        excludeLeagues: true
                    }
                },
                reliability: 0.88,
                validationStatus: 'verified'
            },
            
            // Meetup Events
            {
                siteId: 'meetup-sports',
                domain: 'meetup.com',
                sport: 'multiple',
                method: {
                    type: 'api',
                    endpoint: 'https://api.meetup.com/find/upcoming_events',
                    auth: {
                        type: 'oauth2',
                        tokenEndpoint: 'https://secure.meetup.com/oauth2/access'
                    },
                    params: {
                        topic_category: 'sports',
                        radius: 50,
                        fields: 'venue,event_hosts'
                    },
                    rateLimit: { requests: 200, window: '1h' },
                    dataMapping: {
                        games: 'events',
                        title: 'name',
                        venue: 'venue.name',
                        address: 'venue.address_1',
                        startTime: 'time',
                        description: 'description',
                        attendees: 'yes_rsvp_count'
                    }
                },
                reliability: 0.82,
                validationStatus: 'verified'
            },
            
            // Facebook Events (requires approval)
            {
                siteId: 'facebook-sports-events',
                domain: 'facebook.com',
                sport: 'multiple',
                method: {
                    type: 'api',
                    endpoint: 'https://graph.facebook.com/v12.0/search',
                    auth: {
                        type: 'oauth2',
                        scope: ['public_profile', 'events']
                    },
                    params: {
                        type: 'event',
                        q: 'sports OR basketball OR soccer OR volleyball',
                        fields: 'name,start_time,place,description,attending_count'
                    },
                    rateLimit: { requests: 200, window: '1h' },
                    requiresApproval: true,
                    approvalStatus: 'pending'
                },
                reliability: 0.75,
                validationStatus: 'pending'
            }
        ];
        
        // Register all known methods
        knownMethods.forEach(method => this.registerMethod(method));
        
        console.log(`Initialized ${this.methods.size} known collection methods`);
    }

    /**
     * Register a new collection method
     */
    registerMethod(methodConfig) {
        const { siteId } = methodConfig;
        
        // Add metadata
        const enrichedMethod = {
            ...methodConfig,
            createdAt: methodConfig.createdAt || new Date(),
            updatedAt: new Date(),
            lastValidated: null,
            successRate: 0,
            avgResponseTime: 0,
            lastError: null,
            usageCount: 0
        };
        
        this.methods.set(siteId, enrichedMethod);
        this.updateStats();
        
        this.emit('method:registered', { siteId, method: enrichedMethod });
        
        // Queue for validation if not verified
        if (methodConfig.validationStatus !== 'verified') {
            this.validationQueue.push(siteId);
        }
    }

    /**
     * Get method by site ID
     */
    getMethod(siteId) {
        return this.methods.get(siteId);
    }

    /**
     * Get all methods for a sport
     */
    getMethodsBySport(sport) {
        return Array.from(this.methods.values()).filter(
            method => method.sport === sport || method.sport === 'multiple'
        );
    }

    /**
     * Get all verified methods
     */
    getVerifiedMethods() {
        return Array.from(this.methods.values()).filter(
            method => method.validationStatus === 'verified'
        );
    }

    /**
     * Update method performance metrics
     */
    updateMethodMetrics(siteId, metrics) {
        const method = this.methods.get(siteId);
        if (!method) return;
        
        const { success, responseTime, error } = metrics;
        
        // Update success rate (rolling average)
        method.usageCount++;
        method.successRate = (
            (method.successRate * (method.usageCount - 1) + (success ? 1 : 0)) / 
            method.usageCount
        );
        
        // Update average response time
        if (responseTime && success) {
            method.avgResponseTime = (
                (method.avgResponseTime * (method.usageCount - 1) + responseTime) / 
                method.usageCount
            );
        }
        
        // Update error info
        if (error) {
            method.lastError = {
                message: error.message,
                timestamp: new Date(),
                stack: error.stack
            };
        }
        
        // Update reliability score based on performance
        this.updateReliabilityScore(siteId);
        
        method.updatedAt = new Date();
        this.emit('method:metrics-updated', { siteId, metrics });
    }

    /**
     * Update reliability score based on performance
     */
    updateReliabilityScore(siteId) {
        const method = this.methods.get(siteId);
        if (!method) return;
        
        // Calculate new reliability score
        let score = 0;
        
        // Success rate (40% weight)
        score += method.successRate * 0.4;
        
        // Response time (20% weight) - faster is better
        const responseScore = Math.max(0, 1 - (method.avgResponseTime / 5000));
        score += responseScore * 0.2;
        
        // Validation status (20% weight)
        const validationScores = {
            'verified': 1,
            'pending': 0.5,
            'failed': 0
        };
        score += (validationScores[method.validationStatus] || 0) * 0.2;
        
        // Recency (20% weight) - recently updated methods score higher
        const daysSinceUpdate = (Date.now() - new Date(method.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.max(0, 1 - (daysSinceUpdate / 30));
        score += recencyScore * 0.2;
        
        method.reliability = Math.round(score * 100) / 100;
    }

    /**
     * Validate a collection method
     */
    async validateMethod(siteId) {
        const method = this.methods.get(siteId);
        if (!method) {
            throw new Error(`Method ${siteId} not found`);
        }
        
        console.log(`🔍 Validating method: ${siteId}`);
        
        try {
            let isValid = false;
            
            switch (method.method.type) {
                case 'api':
                    isValid = await this.validateAPIMethod(method);
                    break;
                case 'scraper':
                    isValid = await this.validateScraperMethod(method);
                    break;
                case 'hybrid':
                    isValid = await this.validateHybridMethod(method);
                    break;
            }
            
            // Update validation status
            method.validationStatus = isValid ? 'verified' : 'failed';
            method.lastValidated = new Date();
            
            this.emit('method:validated', { siteId, isValid });
            
            return isValid;
            
        } catch (error) {
            console.error(`Validation failed for ${siteId}:`, error);
            method.validationStatus = 'failed';
            method.lastError = {
                message: error.message,
                timestamp: new Date()
            };
            return false;
        }
    }

    /**
     * Validate API method
     */
    async validateAPIMethod(method) {
        const fetch = require('node-fetch');
        
        try {
            // Test the main endpoint
            const endpoint = method.method.endpoint || method.method.endpoints?.scoreboard;
            if (!endpoint) return false;
            
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: method.method.headers || {},
                timeout: 10000
            });
            
            // Check response
            if (!response.ok) {
                console.log(`API validation failed: ${response.status}`);
                return false;
            }
            
            // Verify data structure
            const data = await response.json();
            const mapping = method.method.dataMapping;
            
            if (mapping && mapping.games) {
                const games = this.getNestedValue(data, mapping.games);
                if (!Array.isArray(games)) {
                    console.log('API validation failed: games not found in expected location');
                    return false;
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('API validation error:', error);
            return false;
        }
    }

    /**
     * Validate scraper method
     */
    async validateScraperMethod(method) {
        const puppeteer = require('puppeteer');
        
        try {
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            
            // Test the main URL
            const url = method.method.url || method.method.urls?.scoreboard;
            if (!url) return false;
            
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // Check if required selectors exist
            const selectors = method.method.selectors;
            if (selectors && selectors.games) {
                const gamesExist = await page.$(selectors.games) !== null;
                if (!gamesExist) {
                    console.log('Scraper validation failed: games selector not found');
                    await browser.close();
                    return false;
                }
            }
            
            await browser.close();
            return true;
            
        } catch (error) {
            console.error('Scraper validation error:', error);
            return false;
        }
    }

    /**
     * Validate hybrid method
     */
    async validateHybridMethod(method) {
        // Try API first
        if (method.method.api) {
            const apiValid = await this.validateAPIMethod({
                method: { 
                    type: 'api',
                    ...method.method.api
                }
            });
            
            if (apiValid) return true;
        }
        
        // Fall back to scraper
        if (method.method.scraper) {
            return await this.validateScraperMethod({
                method: {
                    type: 'scraper',
                    ...method.method.scraper
                }
            });
        }
        
        return false;
    }

    /**
     * Discover method for a new site
     */
    async discoverMethod(url, options = {}) {
        const { sport, gameType, hint } = options;
        
        console.log(`🔎 Discovering collection method for: ${url}`);
        
        // Check if already discovering
        if (this.pendingDiscovery.has(url)) {
            return this.pendingDiscovery.get(url);
        }
        
        // Create discovery promise
        const discoveryPromise = this._performDiscovery(url, options);
        this.pendingDiscovery.set(url, discoveryPromise);
        
        try {
            const method = await discoveryPromise;
            this.pendingDiscovery.delete(url);
            
            // Register the discovered method
            if (method) {
                const siteId = this.generateSiteId(url, sport);
                this.registerMethod({
                    siteId,
                    domain: new URL(url).hostname,
                    sport: sport || 'multiple',
                    gameType,
                    method,
                    reliability: 0.5, // Start with medium reliability
                    validationStatus: 'pending',
                    discoveredBy: 'ai-discovery',
                    discoveryHint: hint
                });
                
                this.stats.discoveredMethods++;
                this.emit('method:discovered', { siteId, url, method });
            }
            
            return method;
            
        } catch (error) {
            this.pendingDiscovery.delete(url);
            throw error;
        }
    }

    /**
     * Perform the actual discovery
     */
    async _performDiscovery(url, options) {
        const { analyzePage, detectAPIs, generateScrapingPattern } = require('./ai-discovery');
        
        try {
            // Step 1: Analyze page structure
            const analysis = await analyzePage(url);
            
            // Step 2: Check for APIs
            const apis = await detectAPIs(url, analysis);
            
            if (apis.length > 0) {
                // Validate and select best API
                for (const api of apis) {
                    const validated = await this.validateAPIEndpoint(api);
                    if (validated) {
                        return {
                            type: 'api',
                            endpoint: api.endpoint,
                            auth: api.auth,
                            dataMapping: api.mapping,
                            rateLimit: { requests: 100, window: '1h' }
                        };
                    }
                }
            }
            
            // Step 3: Generate scraping pattern
            const scrapingPattern = await generateScrapingPattern(url, analysis, options);
            
            if (scrapingPattern) {
                return {
                    type: 'scraper',
                    url,
                    selectors: scrapingPattern.selectors,
                    requiresJS: scrapingPattern.requiresJS,
                    pagination: scrapingPattern.pagination
                };
            }
            
            return null;
            
        } catch (error) {
            console.error('Discovery failed:', error);
            throw error;
        }
    }

    /**
     * Validate discovered API endpoint
     */
    async validateAPIEndpoint(api) {
        try {
            const fetch = require('node-fetch');
            const response = await fetch(api.endpoint, {
                method: 'GET',
                headers: api.headers || {},
                timeout: 5000
            });
            
            if (!response.ok) return null;
            
            const data = await response.json();
            
            // Check if it looks like sports data
            const sportsKeywords = ['game', 'match', 'event', 'sport', 'team', 'player', 'score'];
            const dataStr = JSON.stringify(data).toLowerCase();
            
            const hasSportsData = sportsKeywords.some(keyword => dataStr.includes(keyword));
            
            if (hasSportsData) {
                // Try to detect data structure
                api.mapping = this.detectDataMapping(data);
                return api;
            }
            
            return null;
            
        } catch (error) {
            return null;
        }
    }

    /**
     * Detect data mapping from JSON structure
     */
    detectDataMapping(data) {
        const mapping = {};
        
        // Common patterns
        const patterns = {
            games: ['events', 'games', 'matches', 'schedule', 'data'],
            venue: ['venue', 'location', 'facility', 'place'],
            time: ['time', 'date', 'startTime', 'start_time', 'datetime'],
            teams: ['teams', 'competitors', 'participants']
        };
        
        // Search for patterns in data
        for (const [key, patterns] of Object.entries(patterns)) {
            for (const pattern of patterns) {
                const path = this.findKeyPath(data, pattern);
                if (path) {
                    mapping[key] = path;
                    break;
                }
            }
        }
        
        return mapping;
    }

    /**
     * Find path to a key in nested object
     */
    findKeyPath(obj, targetKey, currentPath = '') {
        if (typeof obj !== 'object' || obj === null) return null;
        
        for (const [key, value] of Object.entries(obj)) {
            const path = currentPath ? `${currentPath}.${key}` : key;
            
            if (key.toLowerCase().includes(targetKey.toLowerCase())) {
                return path;
            }
            
            if (typeof value === 'object') {
                const found = this.findKeyPath(value, targetKey, path);
                if (found) return found;
            }
        }
        
        return null;
    }

    /**
     * Generate site ID from URL and sport
     */
    generateSiteId(url, sport) {
        const domain = new URL(url).hostname.replace(/^www\./, '');
        const sportSlug = sport ? `-${sport}` : '';
        return `${domain}${sportSlug}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    }

    /**
     * Update statistics
     */
    updateStats() {
        this.stats.totalMethods = this.methods.size;
        this.stats.apiMethods = 0;
        this.stats.scraperMethods = 0;
        this.stats.hybridMethods = 0;
        this.stats.verifiedMethods = 0;
        this.stats.pendingMethods = 0;
        this.stats.failedMethods = 0;
        
        for (const method of this.methods.values()) {
            // Count by type
            switch (method.method.type) {
                case 'api':
                    this.stats.apiMethods++;
                    break;
                case 'scraper':
                    this.stats.scraperMethods++;
                    break;
                case 'hybrid':
                    this.stats.hybridMethods++;
                    break;
            }
            
            // Count by status
            switch (method.validationStatus) {
                case 'verified':
                    this.stats.verifiedMethods++;
                    break;
                case 'pending':
                    this.stats.pendingMethods++;
                    break;
                case 'failed':
                    this.stats.failedMethods++;
                    break;
            }
        }
    }

    /**
     * Get statistics
     */
    getStats() {
        this.updateStats();
        return {
            ...this.stats,
            topPerformers: this.getTopPerformers(5),
            recentlyAdded: this.getRecentlyAdded(5),
            needsAttention: this.getNeedsAttention()
        };
    }

    /**
     * Get top performing methods
     */
    getTopPerformers(limit = 5) {
        return Array.from(this.methods.values())
            .filter(m => m.validationStatus === 'verified')
            .sort((a, b) => b.reliability - a.reliability)
            .slice(0, limit)
            .map(m => ({
                siteId: m.siteId,
                domain: m.domain,
                reliability: m.reliability,
                successRate: m.successRate
            }));
    }

    /**
     * Get recently added methods
     */
    getRecentlyAdded(limit = 5) {
        return Array.from(this.methods.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit)
            .map(m => ({
                siteId: m.siteId,
                domain: m.domain,
                createdAt: m.createdAt,
                status: m.validationStatus
            }));
    }

    /**
     * Get methods that need attention
     */
    getNeedsAttention() {
        return Array.from(this.methods.values())
            .filter(m => 
                m.reliability < 0.5 || 
                m.validationStatus === 'failed' ||
                m.failureCount > 5
            )
            .map(m => ({
                siteId: m.siteId,
                domain: m.domain,
                issue: m.validationStatus === 'failed' ? 'validation_failed' : 
                       m.reliability < 0.5 ? 'low_reliability' : 'high_failure_rate',
                reliability: m.reliability,
                lastError: m.lastError
            }));
    }

    /**
     * Export methods to JSON
     */
    exportMethods() {
        const methods = Array.from(this.methods.values());
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            totalMethods: methods.length,
            methods: methods.map(m => ({
                ...m,
                // Remove sensitive data
                lastError: undefined,
                auth: m.method.auth ? { type: m.method.auth.type } : undefined
            }))
        };
    }

    /**
     * Import methods from JSON
     */
    importMethods(data) {
        if (!data.methods || !Array.isArray(data.methods)) {
            throw new Error('Invalid import data');
        }
        
        let imported = 0;
        for (const method of data.methods) {
            if (!this.methods.has(method.siteId)) {
                this.registerMethod(method);
                imported++;
            }
        }
        
        return imported;
    }

    /**
     * Helper to get nested value from object
     */
    getNestedValue(obj, path) {
        if (!path) return obj;
        
        return path.split('.').reduce((current, prop) => {
            if (!current) return undefined;
            
            // Handle array notation
            const arrayMatch = prop.match(/^(\w+)\[(\d+)\]$/);
            if (arrayMatch) {
                const [, arrayProp, index] = arrayMatch;
                return current[arrayProp]?.[parseInt(index)];
            }
            
            return current[prop];
        }, obj);
    }
}

// Singleton instance
let instance;

module.exports = {
    getInstance: () => {
        if (!instance) {
            instance = new SiteMethodsManager();
        }
        return instance;
    },
    SiteMethodsManager
};