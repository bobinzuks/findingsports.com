# Finding Sports - Data Aggregation Plan

## Executive Summary

We'll build a multi-source sports data aggregation system that collects drop-in sports information from various sources in Vancouver. The system will use a combination of APIs, web scraping, user submissions, and partnerships to create the most comprehensive drop-in sports database.

## Data Sources Priority

### Tier 1: API-Based Sources (Highest Priority)
1. **Vancouver Open Data Portal** - Facility locations
2. **Meetup.com API** - Community organized games
3. **GoodRec** - Partner API integration
4. **Google Places/Maps API** - Venue information

### Tier 2: Structured Web Data
1. **Community Center Schedules** - HTML scraping
2. **Richmond Olympic Oval** - Schedule scraping
3. **University Recreation Sites** - UBC, SFU schedules
4. **LeagueLobster** - Where used by facilities

### Tier 3: Social & User-Generated
1. **User Submissions** - In-app game creation
2. **Facebook Groups** - Manual monitoring
3. **WhatsApp/Discord** - Community partnerships

## Technical Architecture

### 1. Data Collection Layer

```javascript
// backend/services/data-sources/index.js
const dataSources = {
  // API Sources
  vancouverOpenData: new VancouverOpenDataSource(),
  meetup: new MeetupAPISource(),
  googlePlaces: new GooglePlacesSource(),
  
  // Scraping Sources
  communityCenter: new CommunityCenterScraper(),
  richmondOval: new RichmondOvalScraper(),
  ubcRec: new UBCRecScraper(),
  
  // User Sources
  userSubmitted: new UserSubmissionSource(),
  socialMedia: new SocialMediaMonitor()
};
```

### 2. Data Normalization Schema

```javascript
// Unified game schema
const GameSchema = {
  // Core fields
  id: String,              // Unique identifier
  title: String,           // Game title
  sport: String,           // Sport type (normalized)
  
  // Location
  venue: {
    name: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    facilityId: String   // Links to facility data
  },
  
  // Time
  startTime: Date,
  endTime: Date,
  recurring: {
    enabled: Boolean,
    pattern: String,     // "weekly", "daily", etc.
    exceptions: [Date]   // Cancelled dates
  },
  
  // Participation
  capacity: {
    min: Number,
    max: Number,
    current: Number
  },
  
  // Meta
  source: {
    type: String,        // "api", "scrape", "user"
    name: String,        // "vancouver-open-data"
    url: String,
    lastUpdated: Date,
    reliability: Number  // 0-1 confidence score
  },
  
  // Details
  skillLevel: String,    // "beginner", "intermediate", "advanced", "all"
  cost: Number,          // 0 for free
  requirements: [String], // ["bring own ball", "indoor shoes"]
  organizer: {
    name: String,
    contact: String,
    verified: Boolean
  }
};
```

### 3. Data Collection Services

#### A. Vancouver Open Data API
```javascript
// backend/services/data-sources/vancouver-open-data.js
class VancouverOpenDataSource {
  constructor() {
    this.apiKey = process.env.VANCOUVER_OPEN_DATA_KEY;
    this.baseUrl = 'https://opendata.vancouver.ca/api/v2';
  }
  
  async getFacilities() {
    // Get parks and recreation facilities
    const facilities = await this.fetch('/catalog/datasets/parks-facilities/records');
    
    return facilities.map(f => ({
      id: f.fields.parkid,
      name: f.fields.name,
      address: f.fields.streetaddress,
      coordinates: {
        lat: f.fields.googlemapdest.lat,
        lng: f.fields.googlemapdest.lon
      },
      features: f.fields.facilities // Basketball courts, etc.
    }));
  }
}
```

#### B. Community Center Scraper
```javascript
// backend/services/data-sources/community-center-scraper.js
const puppeteer = require('puppeteer');

class CommunityCenterScraper {
  async scrapeSchedules() {
    const browser = await puppeteer.launch();
    const schedules = [];
    
    for (const center of COMMUNITY_CENTERS) {
      const page = await browser.newPage();
      await page.goto(center.scheduleUrl);
      
      // Extract drop-in schedule
      const dropIns = await page.evaluate(() => {
        // Parse schedule table
        return Array.from(document.querySelectorAll('.schedule-row')).map(row => ({
          sport: row.querySelector('.sport')?.textContent,
          day: row.querySelector('.day')?.textContent,
          time: row.querySelector('.time')?.textContent
        }));
      });
      
      schedules.push(...this.normalizeSchedule(dropIns, center));
    }
    
    await browser.close();
    return schedules;
  }
}
```

#### C. User Submission System
```javascript
// backend/routes/user-games.js
app.post('/api/games/user-submit', authenticateToken, async (req, res) => {
  const gameData = req.body;
  
  // Validate submission
  const validated = await validateUserGame(gameData);
  
  // Geocode if needed
  if (!validated.venue.coordinates && validated.venue.address) {
    validated.venue.coordinates = await geocodeAddress(validated.venue.address);
  }
  
  // Add metadata
  validated.source = {
    type: 'user',
    name: req.user.username,
    submittedAt: new Date(),
    verified: req.user.verificationLevel >= 2
  };
  
  // Store in database
  const game = await Game.create(validated);
  
  // Notify nearby users
  webSocketService.notifyNewGame(validated.venue.city, game);
  
  res.json({ success: true, game });
});
```

### 4. Data Processing Pipeline

```javascript
// backend/services/data-pipeline.js
class DataAggregationPipeline {
  constructor() {
    this.sources = dataSources;
    this.queue = new Bull('data-aggregation');
  }
  
  async run() {
    // Schedule different sources at different intervals
    this.queue.add('vancouver-facilities', {}, { repeat: { cron: '0 3 * * *' }}); // Daily
    this.queue.add('community-centers', {}, { repeat: { cron: '0 */6 * * *' }}); // 6 hours
    this.queue.add('meetup-events', {}, { repeat: { cron: '0 * * * *' }});       // Hourly
    
    this.queue.process('*', async (job) => {
      const data = await this.collectData(job.name);
      await this.processAndStore(data);
    });
  }
  
  async collectData(sourceName) {
    switch(sourceName) {
      case 'vancouver-facilities':
        return await this.sources.vancouverOpenData.getFacilities();
      case 'community-centers':
        return await this.sources.communityCenter.scrapeSchedules();
      case 'meetup-events':
        return await this.sources.meetup.getUpcomingGames();
    }
  }
  
  async processAndStore(rawData) {
    const normalized = rawData.map(item => this.normalize(item));
    const deduplicated = this.deduplicateGames(normalized);
    
    for (const game of deduplicated) {
      await this.upsertGame(game);
    }
  }
  
  deduplicateGames(games) {
    // Use venue + time + sport as unique key
    const seen = new Map();
    
    return games.filter(game => {
      const key = `${game.venue.name}-${game.startTime}-${game.sport}`;
      if (seen.has(key)) {
        // Merge data from multiple sources
        const existing = seen.get(key);
        return this.mergeGameData(existing, game);
      }
      seen.set(key, game);
      return true;
    });
  }
}
```

### 5. Database Schema

```sql
-- PostgreSQL with PostGIS
CREATE EXTENSION postgis;

-- Facilities table
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  location GEOGRAPHY(POINT, 4326),
  city VARCHAR(100),
  features JSONB,
  source VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  sport VARCHAR(50) NOT NULL,
  facility_id UUID REFERENCES facilities(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  recurring_pattern VARCHAR(50),
  recurring_until DATE,
  capacity_min INTEGER,
  capacity_max INTEGER,
  current_attendees INTEGER DEFAULT 0,
  skill_level VARCHAR(50),
  cost DECIMAL(10,2) DEFAULT 0,
  requirements TEXT[],
  source_type VARCHAR(50),
  source_name VARCHAR(100),
  source_url TEXT,
  reliability_score DECIMAL(3,2),
  organizer_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_games_location ON games USING GIST((SELECT location FROM facilities WHERE id = facility_id));
CREATE INDEX idx_games_sport_time ON games(sport, start_time);
CREATE INDEX idx_games_facility ON games(facility_id);
```

### 6. API Endpoints

```javascript
// Search with multiple filters
app.get('/api/games/search', async (req, res) => {
  const {
    lat, lng, radius = 5000,  // 5km default
    sport, date, time,
    skillLevel, maxCost = null,
    minCapacity = null
  } = req.query;
  
  const games = await Game.searchNearby({
    location: { lat, lng },
    radius,
    filters: {
      sport,
      date,
      time,
      skillLevel,
      maxCost,
      minCapacity
    }
  });
  
  res.json({ games });
});

// Get data source statistics
app.get('/api/admin/sources/stats', authenticateAdmin, async (req, res) => {
  const stats = await DataSource.getStatistics();
  res.json({
    sources: stats,
    lastUpdate: await DataSource.getLastUpdateTime(),
    totalGames: await Game.count(),
    reliability: await Game.getAverageReliability()
  });
});
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
1. Set up PostgreSQL with PostGIS
2. Create database schema
3. Build Vancouver Open Data integration
4. Implement basic user submission

### Phase 2: Core Scrapers (Week 2)
1. Community center scraper
2. Richmond Oval scraper
3. University recreation scrapers
4. Data normalization pipeline

### Phase 3: Advanced Sources (Week 3)
1. Meetup.com API integration
2. Google Places enrichment
3. Social media monitoring setup
4. Duplicate detection system

### Phase 4: Intelligence Layer (Week 4)
1. Reliability scoring algorithm
2. Automatic data validation
3. Conflict resolution system
4. Missing data prediction

### Phase 5: User Features (Week 5)
1. Game verification system
2. User reputation scores
3. Community moderation tools
4. Feedback loop implementation

## Legal and Ethical Considerations

### 1. Data Collection
- Respect robots.txt files
- Implement rate limiting
- Cache data appropriately
- Don't overload servers

### 2. Privacy
- No personal data collection without consent
- Anonymize user submissions
- Comply with PIPEDA (Canadian privacy law)
- Clear data retention policies

### 3. Terms of Service
- Review ToS for each source
- Obtain API keys legally
- Request permission for scraping
- Attribute data sources

### 4. User Generated Content
- Clear submission guidelines
- Moderation system
- Report/flag functionality
- Terms acceptance for submissions

## Monitoring and Maintenance

### 1. Data Quality Metrics
```javascript
const metrics = {
  coverage: "% of known facilities with data",
  freshness: "Average age of game data",
  accuracy: "User-reported accuracy score",
  completeness: "% of games with full details"
};
```

### 2. Automated Alerts
- Source failures
- Data quality drops
- Unusual patterns
- Legal/ToS changes

### 3. Manual Review Queue
- Flagged submissions
- Low reliability scores
- Duplicate candidates
- Missing facility data

## Success Metrics

1. **Coverage**: 90% of drop-in sports in Vancouver
2. **Accuracy**: 95% user-verified accuracy
3. **Freshness**: Updates within 24 hours
4. **User Growth**: 1000+ active users in 3 months
5. **Engagement**: 50+ user submissions per week