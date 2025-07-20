# Alternative API Implementation Guide

## Overview
This guide provides implementation details for replacing failed APIs with working alternatives for the Finding Sports application.

## Failed APIs Being Replaced

### 1. ❌ OpenSports API → ✅ Multiple Alternatives
- **Meetup GraphQL API**: For organized pickup games
- **Facebook Graph API**: For public sports events
- **Google Places API**: For venue information

### 2. ❌ Courts of the World → ✅ Google Places + Foursquare
- **Google Places API**: Find sports facilities with real-time data
- **Foursquare Places API**: Alternative venue database
- **Web Scraping**: Direct scraping of courtsoftheworld.com

### 3. ❌ PlaySports/Javelin Apps → ✅ Active Network + EventBrite
- **Active Network API**: Recreation programs and activities
- **EventBrite API**: Sports events and tournaments
- **Meetup API**: Community sports groups

### 4. ❌ Rainout Line → ✅ Weather API + City Data
- **OpenWeatherMap API**: Current conditions for field status
- **City Open Data APIs**: Official facility status
- **Web Scraping**: City recreation websites

## Priority Implementation Order

### Phase 1: Free/Low-Cost APIs (Immediate)
1. **Vancouver Open Data API** (FREE)
   ```javascript
   // No API key required
   const endpoint = 'https://opendata.vancouver.ca/api/records/1.0/search/';
   const params = {
     dataset: 'community-centres',
     rows: 100
   };
   ```

2. **OpenWeatherMap API** (FREE tier: 1000 calls/day)
   ```javascript
   // Sign up at: https://openweathermap.org/api
   const apiKey = process.env.OPENWEATHER_API_KEY;
   const endpoint = `https://api.openweathermap.org/data/2.5/weather?appid=${apiKey}`;
   ```

3. **Web Scraping Implementation**
   ```bash
   npm install puppeteer cheerio
   ```

### Phase 2: Essential Paid APIs
1. **Google Places API** ($)
   - Pricing: $17 per 1000 requests (Nearby Search)
   - Required for: Venue details, busy times, reviews
   - Setup: https://console.cloud.google.com/apis/library/places-backend.googleapis.com

2. **Meetup API** (OAuth2)
   - Pricing: Free for basic use, paid for high volume
   - Required for: Pickup games, sports groups
   - Setup: https://www.meetup.com/api/oauth/list/

3. **EventBrite API** (Free tier available)
   - Pricing: Free for public event data
   - Required for: Organized sports events
   - Setup: https://www.eventbrite.com/platform/api

### Phase 3: Premium Features
1. **Strava API**: Popular sports locations
2. **Facebook Graph API**: Social sports events
3. **Foursquare API**: Venue recommendations

## Implementation Steps

### Step 1: Environment Configuration
```bash
# Add to .env file
GOOGLE_PLACES_API_KEY=your_key_here
OPENWEATHER_API_KEY=your_key_here
MEETUP_CLIENT_ID=your_id_here
MEETUP_CLIENT_SECRET=your_secret_here
EVENTBRITE_TOKEN=your_token_here
FOURSQUARE_API_KEY=your_key_here
```

### Step 2: Update Data Aggregation Service
```javascript
// services/api-client.js
const apiClients = {
  googlePlaces: {
    baseURL: 'https://maps.googleapis.com/maps/api/place',
    headers: { 'Accept': 'application/json' },
    auth: { key: process.env.GOOGLE_PLACES_API_KEY }
  },
  meetup: {
    baseURL: 'https://api.meetup.com',
    headers: { 'Authorization': `Bearer ${process.env.MEETUP_TOKEN}` }
  },
  // ... other APIs
};
```

### Step 3: Implement Scraping Service
```javascript
// services/scraper-service.js
const puppeteer = require('puppeteer');

class ScraperService {
  async scrapeVancouverRec() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    await page.goto('https://vancouver.ca/parks-recreation-culture/drop-in-schedules.aspx');
    await page.waitForSelector('.schedule-table');
    
    const activities = await page.evaluate(() => {
      // Extract data from page
    });
    
    await browser.close();
    return activities;
  }
}
```

### Step 4: Add Caching Layer
```javascript
// services/cache-service.js
const cache = new Map();
const TTL = 3600000; // 1 hour

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < TTL) {
    return item.data;
  }
  return null;
}

function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}
```

### Step 5: Implement Rate Limiting
```javascript
// services/rate-limiter.js
const rateLimits = {
  googlePlaces: { requests: 50, window: 3600000 }, // 50/hour
  meetup: { requests: 200, window: 3600000 }, // 200/hour
  openweather: { requests: 40, window: 3600000 } // 40/hour (free tier)
};
```

## API-Specific Implementation

### Google Places API
```javascript
async function searchSportsVenues(location, radius = 20000) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
    `location=${location.lat},${location.lng}&radius=${radius}` +
    `&type=gym|stadium|sports_complex&keyword=sports+drop+in` +
    `&key=${process.env.GOOGLE_PLACES_API_KEY}`
  );
  
  const data = await response.json();
  return data.results.map(place => ({
    id: place.place_id,
    name: place.name,
    address: place.vicinity,
    location: place.geometry.location,
    rating: place.rating,
    openNow: place.opening_hours?.open_now
  }));
}
```

### Meetup GraphQL API
```javascript
async function getMeetupSportsEvents(location) {
  const query = `
    query GetSportsEvents($lat: Float!, $lon: Float!) {
      rankedEvents(
        filter: {
          lat: $lat,
          lon: $lon,
          radius: 20,
          topicCategoryId: 32
        }
      ) {
        edges {
          node {
            title
            dateTime
            venue { name lat lng }
            group { name }
            going
          }
        }
      }
    }
  `;
  
  const response = await fetch('https://api.meetup.com/gql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MEETUP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables: location })
  });
  
  return response.json();
}
```

### Web Scraping with Puppeteer
```javascript
async function scrapeRecCenterSchedule(url) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait for dynamic content
    await page.waitForSelector('.schedule-container', { timeout: 10000 });
    
    // Extract schedule data
    const schedule = await page.evaluate(() => {
      const activities = [];
      document.querySelectorAll('.activity-row').forEach(row => {
        activities.push({
          name: row.querySelector('.activity-name')?.textContent,
          time: row.querySelector('.activity-time')?.textContent,
          location: row.querySelector('.activity-location')?.textContent,
          spots: row.querySelector('.available-spots')?.textContent
        });
      });
      return activities;
    });
    
    return schedule;
  } finally {
    await browser.close();
  }
}
```

## Error Handling & Fallbacks

```javascript
async function getActivitiesWithFallback(location, options) {
  const sources = [
    { name: 'googlePlaces', fn: () => getGooglePlacesData(location) },
    { name: 'meetup', fn: () => getMeetupEvents(location) },
    { name: 'cityData', fn: () => getCityOpenData(location) },
    { name: 'scraper', fn: () => scrapeLocalSites(location) },
    { name: 'cached', fn: () => getCachedData(location) }
  ];
  
  const results = [];
  
  for (const source of sources) {
    try {
      const data = await source.fn();
      results.push({ source: source.name, data, success: true });
    } catch (error) {
      console.error(`${source.name} failed:`, error.message);
      results.push({ source: source.name, error: error.message, success: false });
    }
  }
  
  // Merge successful results
  return mergeActivityData(results.filter(r => r.success));
}
```

## Testing New APIs

```javascript
// test-new-apis.js
async function testAllAPIs() {
  const testLocation = { lat: 49.2827, lng: -123.1207 };
  
  console.log('Testing Google Places API...');
  try {
    const places = await searchSportsVenues(testLocation);
    console.log(`✅ Found ${places.length} venues`);
  } catch (error) {
    console.log('❌ Google Places failed:', error.message);
  }
  
  // Test other APIs...
}
```

## Migration Timeline

### Week 1
- [ ] Set up API keys for free services
- [ ] Implement Vancouver Open Data integration
- [ ] Add OpenWeatherMap for field conditions

### Week 2
- [ ] Implement Google Places API
- [ ] Add Meetup API integration
- [ ] Set up basic web scraping

### Week 3
- [ ] Add EventBrite integration
- [ ] Implement caching layer
- [ ] Add comprehensive error handling

### Week 4
- [ ] Performance optimization
- [ ] Add monitoring and analytics
- [ ] Deploy to production

## Cost Estimates

### Monthly API Costs (Estimated)
- Google Places API: $50-100 (3,000-6,000 requests)
- Meetup API: Free (under 200 req/hour)
- EventBrite API: Free (public data)
- OpenWeatherMap: Free (under 1000 req/day)
- **Total: $50-100/month**

### Infrastructure Costs
- Puppeteer hosting: $10-20/month (for scraping)
- Caching layer: Included in existing infrastructure
- **Total: $10-20/month**

## Monitoring & Analytics

```javascript
// Track API usage and costs
const apiMetrics = {
  googlePlaces: { calls: 0, cost: 0 },
  meetup: { calls: 0, cost: 0 },
  // ...
};

function trackAPICall(service, cost = 0) {
  apiMetrics[service].calls++;
  apiMetrics[service].cost += cost;
  
  // Log to monitoring service
  console.log(`API Call: ${service} - Total: ${apiMetrics[service].calls}`);
}
```

## Conclusion

By implementing these alternative APIs and web scraping solutions, the Finding Sports application will have:

1. **More reliable data sources** - Using established APIs instead of defunct services
2. **Better coverage** - Multiple sources for comprehensive activity data
3. **Cost efficiency** - Mix of free and paid services within budget
4. **Fallback options** - Multiple data sources ensure availability
5. **Real-time information** - Google Places provides live busy times and venue status

The total implementation time is estimated at 4 weeks with ongoing monthly costs of $60-120.