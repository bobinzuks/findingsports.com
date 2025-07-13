// const puppeteer = require('puppeteer'); // Removed for faster builds
const cheerio = require('cheerio');
const axios = require('axios');

/**
 * AI-powered discovery module for finding data collection methods
 * Uses pattern recognition and heuristics to identify APIs and scraping patterns
 */

/**
 * Analyze a webpage structure to understand its content
 */
async function analyzePage(url) {
    console.log(`📄 Analyzing page structure: ${url}`);
    
    try {
        // First try simple fetch for initial analysis
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        
        const analysis = {
            url,
            title: $('title').text(),
            hasCalendar: false,
            hasSchedule: false,
            hasEvents: false,
            hasTables: false,
            jsonLdData: [],
            apiHints: [],
            dataAttributes: [],
            sportsKeywords: [],
            structuredData: [],
            requiresJS: false,
            forms: [],
            pagination: null
        };
        
        // Look for calendar/schedule indicators
        const calendarSelectors = [
            '.calendar', '#calendar', '[class*="calendar"]',
            '.schedule', '#schedule', '[class*="schedule"]',
            '.events', '#events', '[class*="event"]',
            '.games', '#games', '[class*="game"]'
        ];
        
        for (const selector of calendarSelectors) {
            if ($(selector).length > 0) {
                if (selector.includes('calendar')) analysis.hasCalendar = true;
                if (selector.includes('schedule')) analysis.hasSchedule = true;
                if (selector.includes('event') || selector.includes('game')) analysis.hasEvents = true;
            }
        }
        
        // Check for tables (often used for schedules)
        analysis.hasTables = $('table').length > 0;
        
        // Extract JSON-LD structured data
        $('script[type="application/ld+json"]').each((i, elem) => {
            try {
                const data = JSON.parse($(elem).html());
                analysis.jsonLdData.push(data);
                
                // Check if it's sports event data
                if (data['@type'] === 'SportsEvent' || data['@type'] === 'Event') {
                    analysis.structuredData.push(data);
                }
            } catch (e) {
                // Invalid JSON
            }
        });
        
        // Look for API hints in scripts
        $('script').each((i, elem) => {
            const script = $(elem).html() || '';
            
            // Look for API endpoints
            const apiPatterns = [
                /(?:api|endpoint|url).*?["']([^"']*(?:api|data|events|games|schedule)[^"']*)/gi,
                /fetch\s*\(\s*["']([^"']+)["']/gi,
                /axios\s*\.\s*(?:get|post)\s*\(\s*["']([^"']+)["']/gi,
                /\$\.(?:ajax|get|post|getJSON)\s*\(\s*["']([^"']+)["']/gi
            ];
            
            for (const pattern of apiPatterns) {
                const matches = script.matchAll(pattern);
                for (const match of matches) {
                    if (match[1]) {
                        analysis.apiHints.push(match[1]);
                    }
                }
            }
            
            // Check if page requires JS rendering
            if (script.includes('React') || script.includes('Vue') || script.includes('Angular')) {
                analysis.requiresJS = true;
            }
        });
        
        // Look for data attributes
        $('[data-game-id], [data-event-id], [data-match-id]').each((i, elem) => {
            analysis.dataAttributes.push({
                tag: elem.tagName,
                attributes: elem.attribs
            });
        });
        
        // Extract sports keywords
        const pageText = $('body').text().toLowerCase();
        const sportsKeywords = [
            'basketball', 'soccer', 'football', 'volleyball', 'tennis',
            'hockey', 'baseball', 'drop-in', 'pickup', 'game', 'match',
            'tournament', 'league', 'recreation', 'sports'
        ];
        
        analysis.sportsKeywords = sportsKeywords.filter(keyword => 
            pageText.includes(keyword)
        );
        
        // Check for forms (might indicate search/filter functionality)
        $('form').each((i, elem) => {
            const form = $(elem);
            analysis.forms.push({
                action: form.attr('action'),
                method: form.attr('method'),
                inputs: form.find('input, select').map((i, el) => ({
                    name: $(el).attr('name'),
                    type: $(el).attr('type') || 'select'
                })).get()
            });
        });
        
        // Look for pagination
        const paginationSelectors = [
            '.pagination', '.pager', '[class*="page"]',
            '.next', '.load-more', '[class*="load"]'
        ];
        
        for (const selector of paginationSelectors) {
            const elem = $(selector).first();
            if (elem.length > 0) {
                analysis.pagination = {
                    type: elem.text().toLowerCase().includes('load') ? 'load-more' : 'pagination',
                    selector: selector
                };
                break;
            }
        }
        
        // If complex JS detected, do deeper analysis with Puppeteer
        if (analysis.requiresJS || analysis.apiHints.length === 0) {
            const deepAnalysis = await analyzePageWithJS(url);
            Object.assign(analysis, deepAnalysis);
        }
        
        return analysis;
        
    } catch (error) {
        console.error('Page analysis error:', error);
        throw error;
    }
}

/**
 * Analyze page with JavaScript execution
 */
async function analyzePageWithJS(url) {
    // Puppeteer disabled for faster builds - returning mock analysis
    console.log('🔍 Dynamic analysis disabled (puppeteer removed for faster builds)');
    return {
        apiCalls: [],
        dynamicContent: false,
        framework: 'unknown'
    };
    
    /* Original puppeteer code commented out:
    let browser;
    
    try {
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Intercept network requests to find API calls
        const apiCalls = [];
        page.on('request', request => {
            const url = request.url();
            if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
                apiCalls.push({
                    url,
                    method: request.method(),
                    headers: request.headers()
                });
            }
        });
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait a bit for dynamic content
        await page.waitForTimeout(3000);
        
        // Extract rendered content
        const jsAnalysis = await page.evaluate(() => {
            const analysis = {
                dynamicContent: false,
                reactApp: false,
                vueApp: false,
                angularApp: false,
                dynamicSelectors: []
            };
            
            // Check for frameworks
            analysis.reactApp = !!(window.React || document.querySelector('[data-reactroot]'));
            analysis.vueApp = !!(window.Vue || document.querySelector('#app').__vue__);
            analysis.angularApp = !!(window.ng || document.querySelector('[ng-app]'));
            
            // Look for dynamically loaded content
            const dynamicSelectors = [
                '.game-card', '.event-item', '.schedule-row',
                '[data-game]', '[data-event]', '[data-match]'
            ];
            
            for (const selector of dynamicSelectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    analysis.dynamicContent = true;
                    analysis.dynamicSelectors.push({
                        selector,
                        count: elements.length,
                        sample: elements[0].outerHTML.substring(0, 200)
                    });
                }
            }
            
            return analysis;
        });
        
        await browser.close();
        
        return {
            ...jsAnalysis,
            apiCalls: apiCalls.filter(call => 
                call.url.includes('api') || 
                call.url.includes('data') ||
                call.url.includes('event') ||
                call.url.includes('game')
            )
        };
        
    } catch (error) {
        if (browser) await browser.close();
        console.error('JS analysis error:', error);
        return { requiresJS: true };
    }
}

/**
 * Detect API endpoints from page analysis
 */
async function detectAPIs(baseUrl, analysis) {
    console.log(`🔍 Detecting APIs for ${baseUrl}`);
    
    const potentialAPIs = [];
    const { URL } = require('url');
    const baseDomain = new URL(baseUrl).origin;
    
    // Extract from analysis
    if (analysis.apiHints && analysis.apiHints.length > 0) {
        for (const hint of analysis.apiHints) {
            let apiUrl = hint;
            
            // Make relative URLs absolute
            if (hint.startsWith('/')) {
                apiUrl = baseDomain + hint;
            } else if (!hint.startsWith('http')) {
                apiUrl = baseDomain + '/' + hint;
            }
            
            potentialAPIs.push({
                endpoint: apiUrl,
                source: 'page-script',
                confidence: 0.8
            });
        }
    }
    
    // From network intercepts
    if (analysis.apiCalls && analysis.apiCalls.length > 0) {
        for (const call of analysis.apiCalls) {
            potentialAPIs.push({
                endpoint: call.url,
                method: call.method,
                headers: call.headers,
                source: 'network-intercept',
                confidence: 0.9
            });
        }
    }
    
    // Try common API patterns
    const commonPatterns = [
        '/api/v1/events',
        '/api/v2/events',
        '/api/games',
        '/api/schedule',
        '/api/sports/games',
        '/data/events.json',
        '/data/games.json',
        '/schedule.json',
        '/events.json',
        '/.json' // Some sites append .json to URLs
    ];
    
    // If site has structured data, might have JSON API
    if (analysis.structuredData && analysis.structuredData.length > 0) {
        commonPatterns.push('/api/events', '/api/structured-data');
    }
    
    for (const pattern of commonPatterns) {
        potentialAPIs.push({
            endpoint: baseDomain + pattern,
            source: 'common-pattern',
            confidence: 0.5
        });
    }
    
    // Test and validate APIs
    const validatedAPIs = [];
    for (const api of potentialAPIs) {
        const validated = await testAPIEndpoint(api);
        if (validated) {
            validatedAPIs.push(validated);
        }
    }
    
    // Sort by confidence
    validatedAPIs.sort((a, b) => b.confidence - a.confidence);
    
    return validatedAPIs;
}

/**
 * Test if an API endpoint returns valid data
 */
async function testAPIEndpoint(api) {
    try {
        const response = await axios({
            url: api.endpoint,
            method: api.method || 'GET',
            headers: {
                ...api.headers,
                'User-Agent': 'FindingSports/1.0 (Discovery Bot)'
            },
            timeout: 5000
        });
        
        if (!response.ok) {
            return null;
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('json')) {
            return null;
        }
        
        const data = await response.json();
        
        // Analyze response structure
        const analysis = analyzeAPIResponse(data);
        
        if (analysis.looksLikeSportsData) {
            return {
                ...api,
                mapping: analysis.mapping,
                dataStructure: analysis.structure,
                confidence: Math.min(api.confidence * 1.2, 1.0)
            };
        }
        
        return null;
        
    } catch (error) {
        return null;
    }
}

/**
 * Analyze API response to detect sports data
 */
function analyzeAPIResponse(data) {
    const analysis = {
        looksLikeSportsData: false,
        mapping: {},
        structure: {}
    };
    
    // Convert to string for keyword search
    const dataStr = JSON.stringify(data).toLowerCase();
    
    // Sports-related keywords
    const sportsKeywords = [
        'game', 'match', 'event', 'sport', 'team', 'player',
        'score', 'venue', 'location', 'date', 'time', 'schedule'
    ];
    
    const foundKeywords = sportsKeywords.filter(keyword => dataStr.includes(keyword));
    
    if (foundKeywords.length >= 3) {
        analysis.looksLikeSportsData = true;
    }
    
    // Try to detect data structure
    if (Array.isArray(data)) {
        analysis.structure.type = 'array';
        analysis.structure.length = data.length;
        
        if (data.length > 0) {
            analysis.mapping = detectFieldMapping(data[0]);
        }
    } else if (typeof data === 'object') {
        // Look for arrays within object
        for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value) && value.length > 0) {
                const keyLower = key.toLowerCase();
                if (sportsKeywords.some(kw => keyLower.includes(kw))) {
                    analysis.structure.type = 'object-with-array';
                    analysis.structure.arrayKey = key;
                    analysis.mapping = detectFieldMapping(value[0]);
                    analysis.looksLikeSportsData = true;
                    break;
                }
            }
        }
    }
    
    return analysis;
}

/**
 * Detect field mapping from a data object
 */
function detectFieldMapping(obj) {
    const mapping = {};
    
    const fieldPatterns = {
        title: ['title', 'name', 'event_name', 'game_name'],
        venue: ['venue', 'location', 'facility', 'place', 'stadium'],
        date: ['date', 'start_date', 'event_date', 'game_date'],
        time: ['time', 'start_time', 'startTime', 'event_time'],
        sport: ['sport', 'sport_type', 'sportType', 'activity'],
        teams: ['teams', 'competitors', 'participants']
    };
    
    // Recursive search for fields
    function searchObject(obj, path = '') {
        if (typeof obj !== 'object' || obj === null) return;
        
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            const keyLower = key.toLowerCase();
            
            // Check against patterns
            for (const [field, patterns] of Object.entries(fieldPatterns)) {
                if (patterns.some(pattern => keyLower.includes(pattern))) {
                    if (!mapping[field]) {
                        mapping[field] = currentPath;
                    }
                }
            }
            
            // Recurse into nested objects
            if (typeof value === 'object' && !Array.isArray(value)) {
                searchObject(value, currentPath);
            }
        }
    }
    
    searchObject(obj);
    return mapping;
}

/**
 * Generate scraping pattern from page analysis
 */
async function generateScrapingPattern(url, analysis, options = {}) {
    console.log(`🎨 Generating scraping pattern for ${url}`);
    
    const pattern = {
        url,
        selectors: {},
        requiresJS: analysis.requiresJS || false,
        pagination: analysis.pagination,
        dataProcessing: {}
    };
    
    // If we have dynamic selectors from JS analysis
    if (analysis.dynamicSelectors && analysis.dynamicSelectors.length > 0) {
        // Use the most common dynamic selector
        const gameSelector = analysis.dynamicSelectors
            .sort((a, b) => b.count - a.count)[0];
        
        pattern.selectors.games = gameSelector.selector;
        
        // Try to infer field selectors from sample HTML
        if (gameSelector.sample) {
            const $ = cheerio.load(gameSelector.sample);
            
            // Common patterns within game cards
            const fieldSelectors = {
                title: ['.title', '.name', '.event-name', 'h3', 'h4'],
                venue: ['.venue', '.location', '.place'],
                time: ['.time', '.date', '.when'],
                sport: ['.sport', '.activity', '.type']
            };
            
            for (const [field, selectors] of Object.entries(fieldSelectors)) {
                for (const sel of selectors) {
                    if ($(sel).length > 0) {
                        pattern.selectors[field] = sel;
                        break;
                    }
                }
            }
        }
    } else {
        // Fallback to common patterns
        pattern.selectors = {
            games: '.game-item, .event-item, .schedule-item',
            title: '.title, .event-name, h3',
            venue: '.venue, .location',
            time: '.time, .date',
            sport: '.sport-type, .activity'
        };
    }
    
    // Add wait conditions for JS sites
    if (pattern.requiresJS) {
        pattern.waitForSelector = pattern.selectors.games.split(',')[0].trim();
        pattern.waitTimeout = 10000;
    }
    
    // Data processing hints
    if (options.gameType === 'drop-in') {
        pattern.dataProcessing.filterKeywords = ['drop-in', 'drop in', 'casual', 'pickup'];
        pattern.dataProcessing.excludeKeywords = ['league', 'tournament', 'competitive'];
    }
    
    return pattern;
}

/**
 * Validate a generated pattern by testing it
 */
async function validateScrapingPattern(url, pattern) {
    let browser;
    
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        if (pattern.waitForSelector) {
            await page.waitForSelector(pattern.waitForSelector, {
                timeout: pattern.waitTimeout || 10000
            });
        }
        
        // Test selectors
        const games = await page.$$(pattern.selectors.games);
        
        if (games.length === 0) {
            await browser.close();
            return false;
        }
        
        // Test field extraction on first game
        const firstGame = games[0];
        const fields = {};
        
        for (const [field, selector] of Object.entries(pattern.selectors)) {
            if (field === 'games') continue;
            
            const value = await firstGame.$eval(selector, el => el.textContent.trim())
                .catch(() => null);
            
            fields[field] = value;
        }
        
        await browser.close();
        
        // Check if we got meaningful data
        const hasData = Object.values(fields).filter(v => v && v.length > 0).length >= 2;
        
        return hasData;
        
    } catch (error) {
        if (browser) await browser.close();
        console.error('Pattern validation error:', error);
        return false;
    }
}

/**
 * Generate smart selectors using ML-like pattern matching
 */
function generateSmartSelectors(html, targetData) {
    const $ = cheerio.load(html);
    const selectors = {};
    
    // Score elements based on content matching
    function scoreElement(element, targetText) {
        const text = $(element).text().toLowerCase();
        const targetLower = targetText.toLowerCase();
        
        let score = 0;
        
        // Exact match
        if (text === targetLower) score += 10;
        
        // Contains match
        if (text.includes(targetLower)) score += 5;
        
        // Partial word match
        const targetWords = targetLower.split(/\s+/);
        const textWords = text.split(/\s+/);
        const matchingWords = targetWords.filter(w => textWords.includes(w));
        score += matchingWords.length * 2;
        
        // Semantic similarity (simple version)
        const semanticMatches = {
            venue: ['location', 'place', 'facility', 'where'],
            time: ['when', 'date', 'schedule'],
            sport: ['activity', 'game', 'type']
        };
        
        for (const [key, synonyms] of Object.entries(semanticMatches)) {
            if (targetLower.includes(key)) {
                if (synonyms.some(syn => text.includes(syn))) {
                    score += 3;
                }
            }
        }
        
        return score;
    }
    
    // Find best matching elements for each field
    for (const [field, targetValue] of Object.entries(targetData)) {
        if (!targetValue) continue;
        
        let bestScore = 0;
        let bestSelector = null;
        
        // Test common element types
        const elementsToTest = $('div, span, p, td, h1, h2, h3, h4, h5, h6, a');
        
        elementsToTest.each((i, elem) => {
            const score = scoreElement(elem, targetValue);
            
            if (score > bestScore) {
                bestScore = score;
                
                // Generate unique selector
                const classes = $(elem).attr('class');
                const id = $(elem).attr('id');
                
                if (id) {
                    bestSelector = `#${id}`;
                } else if (classes) {
                    const uniqueClass = classes.split(' ')
                        .find(c => $(`.${c}`).length === 1);
                    bestSelector = uniqueClass ? `.${uniqueClass}` : 
                                  `.${classes.split(' ').join('.')}`;
                } else {
                    // Generate path-based selector
                    const path = [];
                    let current = elem;
                    
                    while (current && current.parent && path.length < 5) {
                        const parent = current.parent;
                        const index = $(parent).children(current.tagName).index(current);
                        path.unshift(`${current.tagName}:nth-child(${index + 1})`);
                        current = parent;
                    }
                    
                    bestSelector = path.join(' > ');
                }
            }
        });
        
        if (bestSelector && bestScore > 2) {
            selectors[field] = bestSelector;
        }
    }
    
    return selectors;
}

module.exports = {
    analyzePage,
    detectAPIs,
    generateScrapingPattern,
    validateScrapingPattern,
    generateSmartSelectors
};