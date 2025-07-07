// Agent 2: Web Scraping Specialist - Advanced Scraping Framework
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { setTimeout } = require('timers/promises');

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

class AdvancedScraper {
    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
        ];

        this.proxies = [];
        this.browser = null;
        this.requestCount = new Map();
        this.rateLimits = new Map();
        this.circuitBreakers = new Map();
    }

    // Initialize browser with stealth settings
    async initBrowser() {
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
    }

    // Get random user agent
    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    // Enhanced HTTP scraper with anti-detection
    async scrapeWithAxios(url, options = {}) {
        const domain = new URL(url).hostname;

        // Check circuit breaker
        if (this.isCircuitOpen(domain)) {
            throw new Error(`Circuit breaker open for ${domain}`);
        }

        // Apply rate limiting
        await this.applyRateLimit(domain);

        try {
            const config = {
                url,
                method: options.method || 'GET',
                headers: {
                    'User-Agent': this.getRandomUserAgent(),
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    Connection: 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Cache-Control': 'max-age=0',
                    ...options.headers
                },
                timeout: options.timeout || 30000,
                maxRedirects: 5,
                validateStatus: status => status < 500, // Don't throw on 4xx errors
                ...options.config
            };

            const response = await axios(config);

            // Update success metrics
            this.recordSuccess(domain);

            return {
                data: response.data,
                status: response.status,
                headers: response.headers,
                url: response.config.url
            };
        } catch (error) {
            this.recordFailure(domain, error);
            throw error;
        }
    }

    // Browser-based scraping for JavaScript-heavy sites
    async scrapeWithBrowser(url, options = {}) {
        if (!this.browser) {
            await this.initBrowser();
        }

        const page = await this.browser.newPage();

        try {
            // Set viewport and user agent
            await page.setViewport({ width: 1366, height: 768 });
            await page.setUserAgent(this.getRandomUserAgent());

            // Block unnecessary resources for faster loading
            await page.setRequestInterception(true);
            page.on('request', req => {
                const resourceType = req.resourceType();
                if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            // Navigate to page
            const response = await page.goto(url, {
                waitUntil: options.waitUntil || 'networkidle2',
                timeout: options.timeout || 30000
            });

            // Wait for specific elements if needed
            if (options.waitForSelector) {
                await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
            }

            // Execute custom JavaScript if provided
            if (options.evaluate) {
                await page.evaluate(options.evaluate);
            }

            // Get page content
            const content = await page.content();

            return {
                data: content,
                status: response.status(),
                url: page.url()
            };
        } finally {
            await page.close();
        }
    }

    // Intelligent content parsing
    parseContent(html, selectors) {
        const $ = cheerio.load(html);
        const results = {};

        for (const [key, selector] of Object.entries(selectors)) {
            if (typeof selector === 'string') {
                // Simple selector
                results[key] = $(selector).text().trim();
            } else if (typeof selector === 'object') {
                // Complex selector with options
                const elements = $(selector.selector);

                if (selector.multiple) {
                    results[key] = elements.map((i, el) => this.extractElementData($(el), selector)).get();
                } else {
                    results[key] = this.extractElementData(elements.first(), selector);
                }
            }
        }

        return results;
    }

    // Extract data from element based on configuration
    extractElementData($element, config) {
        const data = {};

        if (config.text) {
            data.text = $element.text().trim();
        }

        if (config.html) {
            data.html = $element.html();
        }

        if (config.attributes) {
            config.attributes.forEach(attr => {
                data[attr] = $element.attr(attr);
            });
        }

        if (config.children) {
            for (const [key, childSelector] of Object.entries(config.children)) {
                data[key] = $element.find(childSelector).text().trim();
            }
        }

        return Object.keys(data).length === 1 && data.text ? data.text : data;
    }

    // Sports-specific content extraction
    extractSportsData(html, type = 'schedule') {
        const $ = cheerio.load(html);

        switch (type) {
            case 'schedule':
                return this.extractScheduleData($);
            case 'facility':
                return this.extractFacilityData($);
            case 'event':
                return this.extractEventData($);
            default:
                return this.extractGenericSportsData($);
        }
    }

    extractScheduleData($) {
        const schedules = [];

        // Common schedule patterns
        const scheduleSelectors = [
            'table tr',
            '.schedule-item',
            '.program-item',
            '.class-item',
            '[class*="schedule"]',
            '[class*="program"]',
            '[class*="activity"]'
        ];

        for (const selector of scheduleSelectors) {
            const items = $(selector);
            if (items.length > 0) {
                items.each((i, element) => {
                    const $item = $(element);
                    const schedule = this.extractScheduleItem($item);
                    if (schedule && schedule.title) {
                        schedules.push(schedule);
                    }
                });
                break; // Use first successful pattern
            }
        }

        return schedules;
    }

    extractScheduleItem($item) {
        const text = $item.text().toLowerCase();

        // Skip if not sports-related
        if (!this.isSportsRelated(text)) {
            return null;
        }

        // Extract time patterns
        const timePattern = /(\d{1,2}):(\d{2})\s*(am|pm)/gi;
        const times = text.match(timePattern) || [];

        // Extract sport type
        const sport = this.identifySport(text);

        // Extract venue/location
        const venue = this.extractVenue($item);

        return {
            title:
                $item.find('h1, h2, h3, h4, .title, .name').first().text().trim() || $item.text().split('\n')[0].trim(),
            sport,
            venue,
            times,
            description: $item.text().trim(),
            dropIn: this.isDropIn(text),
            originalElement: $item.html()
        };
    }

    extractFacilityData($) {
        return $('.facility, .location, .venue, [class*="facility"]')
            .map((i, el) => {
                const $facility = $(el);
                return {
                    name: $facility.find('.name, h1, h2, h3').first().text().trim(),
                    address: this.extractAddress($facility),
                    hours: this.extractHours($facility),
                    amenities: this.extractAmenities($facility),
                    sports: this.extractSupportedSports($facility)
                };
            })
            .get();
    }

    // Sport identification using keywords
    identifySport(text) {
        const sportKeywords = {
            basketball: ['basketball', 'bball', 'hoops', 'court'],
            soccer: ['soccer', 'football', 'futbol', 'pitch'],
            volleyball: ['volleyball', 'vball', 'net'],
            tennis: ['tennis', 'court'],
            badminton: ['badminton', 'shuttlecock'],
            hockey: ['hockey', 'rink', 'ice'],
            swimming: ['swim', 'pool', 'aqua'],
            fitness: ['fitness', 'gym', 'workout', 'exercise'],
            baseball: ['baseball', 'diamond'],
            running: ['run', 'track', 'marathon']
        };

        for (const [sport, keywords] of Object.entries(sportKeywords)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return sport;
            }
        }

        return 'unknown';
    }

    // Check if activity is sports-related
    isSportsRelated(text) {
        const sportsKeywords = [
            'basketball',
            'soccer',
            'volleyball',
            'tennis',
            'badminton',
            'hockey',
            'swimming',
            'fitness',
            'baseball',
            'running',
            'sport',
            'athletic',
            'gym',
            'court',
            'field',
            'pool',
            'drop-in',
            'pickup',
            'recreational',
            'game'
        ];

        return sportsKeywords.some(keyword => text.includes(keyword));
    }

    // Check if activity is drop-in
    isDropIn(text) {
        const dropInKeywords = [
            'drop-in',
            'drop in',
            'dropin',
            'walk-in',
            'pickup',
            'open gym',
            'recreational',
            'casual',
            'public'
        ];

        return dropInKeywords.some(keyword => text.includes(keyword));
    }

    // Rate limiting per domain
    async applyRateLimit(domain) {
        const now = Date.now();
        const requests = this.requestCount.get(domain) || [];

        // Remove requests older than 1 minute
        const recentRequests = requests.filter(time => now - time < 60000);

        const limit = this.rateLimits.get(domain) || 30; // Default 30 requests per minute

        if (recentRequests.length >= limit) {
            const oldestRequest = Math.min(...recentRequests);
            const waitTime = 60000 - (now - oldestRequest);
            await setTimeout(waitTime);
        }

        recentRequests.push(now);
        this.requestCount.set(domain, recentRequests);
    }

    // Circuit breaker pattern
    recordSuccess(domain) {
        const breaker = this.circuitBreakers.get(domain) || { failures: 0, lastFailure: 0, state: 'CLOSED' };
        breaker.failures = 0;
        breaker.state = 'CLOSED';
        this.circuitBreakers.set(domain, breaker);
    }

    recordFailure(domain, error) {
        const breaker = this.circuitBreakers.get(domain) || { failures: 0, lastFailure: 0, state: 'CLOSED' };
        breaker.failures++;
        breaker.lastFailure = Date.now();

        if (breaker.failures >= 5) {
            breaker.state = 'OPEN';
        }

        this.circuitBreakers.set(domain, breaker);
    }

    isCircuitOpen(domain) {
        const breaker = this.circuitBreakers.get(domain);
        if (!breaker || breaker.state === 'CLOSED') {
            return false;
        }

        // Reset after 5 minutes
        if (Date.now() - breaker.lastFailure > 300000) {
            breaker.state = 'HALF_OPEN';
            breaker.failures = 0;
            return false;
        }

        return breaker.state === 'OPEN';
    }

    // Utility methods for data extraction
    extractAddress($element) {
        const addressPatterns = [
            /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd)/gi,
            /[A-Za-z\s,]+,\s*[A-Z]{2}\s*\d{5}/g
        ];

        const text = $element.text();
        for (const pattern of addressPatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[0];
            }
        }

        return null;
    }

    extractHours($element) {
        const hoursPattern = /(\d{1,2}):(\d{2})\s*(am|pm)\s*-\s*(\d{1,2}):(\d{2})\s*(am|pm)/gi;
        const matches = $element.text().match(hoursPattern);
        return matches || [];
    }

    extractAmenities($element) {
        const amenityKeywords = ['parking', 'accessible', 'wifi', 'change room', 'shower', 'lockers'];
        const text = $element.text().toLowerCase();
        return amenityKeywords.filter(amenity => text.includes(amenity));
    }

    extractVenue($item) {
        // Look for venue information in various places
        const venueSelectors = ['.venue', '.location', '.facility', '.centre', '.center'];

        for (const selector of venueSelectors) {
            const venue = $item.find(selector).text().trim();
            if (venue) {
                return venue;
            }
        }

        // Extract from parent elements
        const parent = $item.parent();
        const headerText = parent.find('h1, h2, h3').first().text().trim();
        if (headerText && headerText.length < 100) {
            return headerText;
        }

        return null;
    }

    // Cleanup
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

module.exports = AdvancedScraper;
