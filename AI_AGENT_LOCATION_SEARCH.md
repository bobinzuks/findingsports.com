# AI Agent Autonomous Location Search System

## Overview

When a user in a new location (e.g., Calgary, Toronto, Seattle) visits Finding Sports, the system automatically dispatches AI agents to search for drop-in sports in that area.

## Architecture

```
User visits from new location
         ↓
Location Detection (IP/GPS)
         ↓
Check Cache → Found? → Serve Data
         ↓ Not Found
Trigger AI Agent Search
         ↓
┌────────────────────────────┐
│   Claude Code + ruv-swarm  │
├────────────────────────────┤
│ 1. Spawn Location Agents   │
│ 2. Search Multiple Sources │
│ 3. Validate Drop-in Only   │
│ 4. Store Results           │
│ 5. Notify User             │
└────────────────────────────┘
```

## Implementation Plan

### 1. Automatic Location Detection & Agent Trigger

```javascript
// backend/services/location-agent-service.js
const { exec } = require('child_process');
const geoip = require('geoip-lite');

class LocationAgentService {
    constructor() {
        this.searchingLocations = new Map(); // Track ongoing searches
        this.locationCache = new Map();
    }

    async handleNewLocation(req, res) {
        // Detect user location
        const userLocation = this.detectLocation(req);
        
        // Check if we have data for this location
        const hasData = await this.checkLocationData(userLocation);
        
        if (!hasData && !this.searchingLocations.has(userLocation.city)) {
            // Trigger AI agent search
            this.searchingLocations.set(userLocation.city, 'searching');
            this.triggerAgentSearch(userLocation);
            
            return res.json({
                status: 'searching',
                message: `We're searching for drop-in sports in ${userLocation.city}. This usually takes 2-5 minutes.`,
                estimatedTime: 300000, // 5 minutes
                locationId: userLocation.id
            });
        }
        
        return res.json({
            status: 'ready',
            games: await this.getGamesForLocation(userLocation)
        });
    }

    detectLocation(req) {
        // Try multiple methods
        const ip = req.ip || req.connection.remoteAddress;
        const geoData = geoip.lookup(ip);
        
        return {
            city: req.query.city || geoData?.city || 'Unknown',
            region: geoData?.region,
            country: geoData?.country,
            lat: req.query.lat || geoData?.ll[0],
            lng: req.query.lng || geoData?.ll[1],
            id: `${geoData?.city}-${geoData?.region}-${geoData?.country}`.toLowerCase()
        };
    }

    async triggerAgentSearch(location) {
        // Call Claude Code with ruv-swarm
        const command = `npx ruv-swarm orchestrate "Search for all drop-in sports, open gyms, and public recreational activities in ${location.city}, ${location.region}. Find: 1) Community centers with schedules, 2) Public sports facilities, 3) Meetup groups, 4) Facebook groups, 5) Local sports websites. Focus only on drop-in/public games, not leagues. Create a comprehensive list with venues, schedules, and contact info."`;
        
        exec(command, { cwd: process.cwd() }, async (error, stdout, stderr) => {
            if (!error) {
                // Process results
                await this.processAgentResults(location, stdout);
            }
        });
        
        // Also trigger web searches
        this.startWebSearch(location);
    }
}
```

### 2. Claude Code Integration Script

```bash
#!/bin/bash
# claude-sports-search.sh

LOCATION=$1
CITY=$(echo $LOCATION | jq -r '.city')
REGION=$(echo $LOCATION | jq -r '.region')

# Use Claude Code to search
claude_response=$(cat <<EOF | claude
I need to find drop-in sports and open gym schedules in $CITY, $REGION.

Please search for:
1. "$CITY recreation centers drop-in sports"
2. "$CITY community centers gym schedule"
3. "$CITY pickup basketball"
4. "$CITY drop-in soccer"
5. "$CITY open volleyball"
6. "$CITY public tennis courts"
7. "$CITY YMCA drop-in schedule"

For each facility found, I need:
- Facility name and address
- Drop-in sports offered
- Schedule (days and times)
- Cost (if any)
- Website or contact info

Focus only on public, drop-in activities. Exclude leagues or members-only programs.
EOF
)

# Process Claude's response
echo "$claude_response" > "searches/${CITY}_initial_results.md"

# Trigger ruv-swarm for deep search
npx ruv-swarm spawn researcher "${CITY} Sports Researcher"
npx ruv-swarm spawn analyst "${CITY} Schedule Analyst"
npx ruv-swarm spawn coordinator "${CITY} Data Coordinator"

# Orchestrate the search
npx ruv-swarm orchestrate "Deep search for ${CITY} drop-in sports with the following initial findings: ${claude_response}"
```

### 3. Intelligent Web Search Agent

```javascript
// backend/services/ai-web-search.js
const puppeteer = require('puppeteer');
const { GoogleSearch } = require('google-search-results-nodejs');

class AIWebSearchAgent {
    constructor(location) {
        this.location = location;
        this.searchClient = new GoogleSearch(process.env.SERP_API_KEY);
        this.results = [];
    }

    async search() {
        const queries = this.generateSearchQueries();
        
        for (const query of queries) {
            const results = await this.searchGoogle(query);
            const processed = await this.processResults(results);
            this.results.push(...processed);
        }
        
        return this.consolidateResults();
    }

    generateSearchQueries() {
        const { city, region } = this.location;
        const sports = ['basketball', 'soccer', 'volleyball', 'tennis', 'badminton'];
        const venues = ['community center', 'recreation center', 'YMCA', 'gym'];
        
        const queries = [];
        
        // City-specific searches
        queries.push(`${city} drop-in sports schedule`);
        queries.push(`${city} open gym times`);
        queries.push(`${city} public recreation activities`);
        
        // Sport-specific searches
        sports.forEach(sport => {
            queries.push(`${city} drop-in ${sport}`);
            queries.push(`${city} pickup ${sport}`);
        });
        
        // Venue-specific searches
        venues.forEach(venue => {
            queries.push(`${city} ${venue} drop-in schedule`);
        });
        
        return queries;
    }

    async processResults(searchResults) {
        const relevantResults = [];
        
        for (const result of searchResults.organic_results || []) {
            // Use AI to determine relevance
            const isRelevant = await this.checkRelevance(result);
            
            if (isRelevant) {
                // Scrape the page for details
                const details = await this.scrapePageDetails(result.link);
                if (details) {
                    relevantResults.push({
                        source: result.link,
                        title: result.title,
                        ...details
                    });
                }
            }
        }
        
        return relevantResults;
    }

    async scrapePageDetails(url) {
        try {
            const browser = await puppeteer.launch({ headless: 'new' });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });
            
            // Look for schedule information
            const details = await page.evaluate(() => {
                // Custom extraction logic
                const schedulePatterns = [
                    /drop.?in/i,
                    /open.?gym/i,
                    /public.?hours/i,
                    /recreational.?swim/i
                ];
                
                // Find relevant text
                const text = document.body.innerText;
                const relevant = schedulePatterns.some(pattern => pattern.test(text));
                
                if (relevant) {
                    // Extract schedule tables, lists, etc.
                    return extractScheduleData();
                }
                
                return null;
            });
            
            await browser.close();
            return details;
            
        } catch (error) {
            console.error('Scraping error:', error);
            return null;
        }
    }
}
```

### 4. Real-time Progress Updates

```javascript
// backend/services/search-progress-service.js
class SearchProgressService {
    constructor(webSocketService) {
        this.ws = webSocketService;
        this.searches = new Map();
    }

    startSearch(locationId, userId) {
        const search = {
            id: `search_${Date.now()}`,
            locationId,
            userId,
            status: 'initializing',
            progress: 0,
            stages: [
                { name: 'spawning_agents', status: 'pending', progress: 0 },
                { name: 'searching_web', status: 'pending', progress: 0 },
                { name: 'analyzing_results', status: 'pending', progress: 0 },
                { name: 'validating_venues', status: 'pending', progress: 0 },
                { name: 'storing_data', status: 'pending', progress: 0 }
            ],
            startedAt: new Date()
        };
        
        this.searches.set(search.id, search);
        this.notifyProgress(search);
        
        return search.id;
    }

    updateStage(searchId, stageName, progress, details) {
        const search = this.searches.get(searchId);
        if (!search) return;
        
        const stage = search.stages.find(s => s.name === stageName);
        if (stage) {
            stage.status = progress === 100 ? 'completed' : 'in_progress';
            stage.progress = progress;
            stage.details = details;
        }
        
        // Calculate overall progress
        search.progress = search.stages.reduce((sum, s) => sum + s.progress, 0) / search.stages.length;
        
        this.notifyProgress(search);
    }

    notifyProgress(search) {
        // Notify via WebSocket
        this.ws.notifyUser(search.userId, {
            type: 'location_search_progress',
            search: {
                id: search.id,
                locationId: search.locationId,
                progress: search.progress,
                stages: search.stages,
                estimatedCompletion: this.estimateCompletion(search)
            }
        });
    }
}
```

### 5. Frontend Real-time Search UI

```javascript
// mockup/js/location-search.js
class LocationSearchUI {
    constructor() {
        this.searchStatus = null;
        this.progressInterval = null;
    }

    async checkNewLocation() {
        const location = await this.getCurrentLocation();
        
        const response = await fetch('/api/location/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location })
        });
        
        const data = await response.json();
        
        if (data.status === 'searching') {
            this.showSearchProgress(data);
        }
    }

    showSearchProgress(searchData) {
        const modal = document.createElement('div');
        modal.className = 'search-progress-modal';
        modal.innerHTML = `
            <div class="search-content">
                <h2>🔍 Discovering Sports in ${searchData.location}</h2>
                <p>Our AI agents are searching for drop-in sports in your area...</p>
                
                <div class="progress-stages">
                    <div class="stage" data-stage="spawning_agents">
                        <span class="stage-icon">🤖</span>
                        <span class="stage-name">Deploying Search Agents</span>
                        <div class="stage-progress"></div>
                    </div>
                    
                    <div class="stage" data-stage="searching_web">
                        <span class="stage-icon">🌐</span>
                        <span class="stage-name">Searching Local Sources</span>
                        <div class="stage-progress"></div>
                    </div>
                    
                    <div class="stage" data-stage="analyzing_results">
                        <span class="stage-icon">🧠</span>
                        <span class="stage-name">Analyzing Results</span>
                        <div class="stage-progress"></div>
                    </div>
                    
                    <div class="stage" data-stage="validating_venues">
                        <span class="stage-icon">✅</span>
                        <span class="stage-name">Validating Drop-in Availability</span>
                        <div class="stage-progress"></div>
                    </div>
                    
                    <div class="stage" data-stage="storing_data">
                        <span class="stage-icon">💾</span>
                        <span class="stage-name">Saving Results</span>
                        <div class="stage-progress"></div>
                    </div>
                </div>
                
                <div class="overall-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <p class="progress-text">0% Complete</p>
                </div>
                
                <div class="search-preview">
                    <h4>Found so far:</h4>
                    <ul class="preview-list"></ul>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Listen for WebSocket updates
        window.wsClient.on('location_search_progress', (data) => {
            this.updateSearchProgress(data);
        });
    }

    updateSearchProgress(progressData) {
        progressData.stages.forEach(stage => {
            const stageEl = document.querySelector(`[data-stage="${stage.name}"]`);
            if (stageEl) {
                const progressBar = stageEl.querySelector('.stage-progress');
                progressBar.style.width = `${stage.progress}%`;
                
                if (stage.status === 'completed') {
                    stageEl.classList.add('completed');
                } else if (stage.status === 'in_progress') {
                    stageEl.classList.add('active');
                }
                
                // Show preview of found venues
                if (stage.details?.venues) {
                    this.updatePreview(stage.details.venues);
                }
            }
        });
        
        // Update overall progress
        document.querySelector('.progress-fill').style.width = `${progressData.progress}%`;
        document.querySelector('.progress-text').textContent = `${Math.round(progressData.progress)}% Complete`;
        
        // Complete
        if (progressData.progress === 100) {
            setTimeout(() => {
                this.showResults(progressData.results);
            }, 1000);
        }
    }
}
```

### 6. Automated Data Processing Pipeline

```javascript
// backend/services/agent-results-processor.js
class AgentResultsProcessor {
    constructor() {
        this.validators = {
            dropIn: new DropInValidator(),
            schedule: new ScheduleParser(),
            venue: new VenueNormalizer()
        };
    }

    async processAgentResults(location, agentOutput) {
        // Parse agent output
        const rawResults = this.parseAgentOutput(agentOutput);
        
        const processedGames = [];
        
        for (const result of rawResults) {
            // Validate it's actually drop-in
            if (!this.validators.dropIn.validate(result)) {
                continue;
            }
            
            // Parse schedule information
            const schedule = this.validators.schedule.parse(result.scheduleText);
            
            // Normalize venue
            const venue = await this.validators.venue.normalize({
                name: result.venueName,
                address: result.address,
                city: location.city
            });
            
            // Create game entries
            for (const slot of schedule) {
                processedGames.push({
                    title: `Drop-in ${result.sport}`,
                    sport: this.normalizeSport(result.sport),
                    venue: venue,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    recurring: slot.recurring,
                    source: {
                        type: 'ai-agent',
                        agent: 'location-search',
                        searchId: location.searchId,
                        confidence: result.confidence || 0.8
                    },
                    requirements: ['Drop-in', 'All skill levels welcome'],
                    cost: result.cost || 0
                });
            }
        }
        
        // Store in database
        await this.storeGames(processedGames, location);
        
        // Mark location as processed
        await this.markLocationComplete(location);
        
        return processedGames;
    }
}
```

### 7. Integration with Claude Code

```yaml
# .claude/commands/search-location.md
---
name: search-location
description: Search for drop-in sports in a new location
---

## Usage
/search-location Calgary, Alberta

## What it does
1. Spawns specialized ruv-swarm agents for the location
2. Searches multiple sources in parallel
3. Validates all results are drop-in (not leagues)
4. Stores results in database
5. Shows real-time progress

## Process
1. Initial web search for "{city} drop-in sports"
2. Deep dive into each venue found
3. Extract schedules from websites
4. Validate public access
5. Geocode all venues
6. Store in Finding Sports database

## Example
User: /search-location Seattle, Washington

Claude: I'll search for drop-in sports in Seattle. Starting search agents...

[Progress updates shown in real-time]

Found 47 drop-in sports opportunities across 23 venues in Seattle!
```

### 8. Smart Caching Strategy

```javascript
// backend/services/location-cache.js
class LocationCacheService {
    constructor() {
        this.cache = new Map();
        this.ttl = {
            recentSearch: 24 * 60 * 60 * 1000,      // 24 hours
            establishedCity: 7 * 24 * 60 * 60 * 1000, // 1 week
            smallTown: 30 * 24 * 60 * 60 * 1000     // 1 month
        };
    }

    async getLocationData(location) {
        const cacheKey = this.getCacheKey(location);
        const cached = this.cache.get(cacheKey);
        
        if (cached && !this.isExpired(cached, location)) {
            return cached.data;
        }
        
        // Trigger new search
        return null;
    }

    isExpired(cached, location) {
        const now = Date.now();
        const age = now - cached.timestamp;
        const ttl = this.getTTL(location);
        
        return age > ttl;
    }

    getTTL(location) {
        // Major cities update more frequently
        const majorCities = ['vancouver', 'toronto', 'montreal', 'calgary'];
        if (majorCities.includes(location.city.toLowerCase())) {
            return this.ttl.recentSearch;
        }
        
        // Smaller places update less frequently
        return this.ttl.smallTown;
    }
}
```

## System Flow

```
1. User visits from new location (e.g., Calgary)
   ↓
2. System detects no data for Calgary
   ↓
3. Triggers Claude Code + ruv-swarm search
   ↓
4. Shows real-time progress to user
   ↓
5. AI agents search in parallel:
   - Web scraping
   - Google searches  
   - Social media
   - Direct venue sites
   ↓
6. Validates all results are drop-in
   ↓
7. Stores in database
   ↓
8. Shows results to user (2-5 minutes total)
```

## Benefits

1. **Automatic Coverage**: Any city worldwide without manual setup
2. **Quality Control**: AI validates drop-in only
3. **Real-time Updates**: Users see progress
4. **Scalable**: Agents work in parallel
5. **Intelligent**: Learns from each search

## Implementation Steps

1. **Backend Agent Service**: Location detection and agent triggering
2. **Claude Integration**: Shell scripts for Claude Code
3. **ruv-swarm Orchestration**: Parallel agent searches
4. **Progress Tracking**: WebSocket updates
5. **Results Processing**: Validation and storage
6. **Frontend UI**: Real-time search progress
7. **Caching Layer**: Smart expiration policies

## Cost Considerations

- **API Calls**: ~$0.10 per new location search
- **Compute**: ~$0.05 per agent spawn
- **Total**: ~$0.50-1.00 per new city
- **Cached**: Free for subsequent users

## Future Enhancements

1. **Predictive Loading**: Pre-search growing cities
2. **Crowd Validation**: Users verify AI findings
3. **Continuous Updates**: Agents revisit monthly
4. **Quality Scoring**: Rate venue data quality
5. **Multi-language**: Search in local languages