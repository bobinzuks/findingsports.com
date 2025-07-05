# Finding Sports - Data Aggregation Implementation

## What We've Built

We've created a comprehensive data aggregation system for drop-in sports in Vancouver that collects data from multiple sources and normalizes it into a unified format.

## Data Sources Implemented

### 1. Vancouver Open Data Portal ✅
- **Status**: Implemented
- **What it provides**: Facility locations and features
- **Data**: Parks, community centers, sports courts
- **Update frequency**: Daily
- **Reliability**: High (official city data)

### 2. Community Center Scraper ✅
- **Status**: Implemented 
- **Centers covered**: 6 major Vancouver community centers
  - Kerrisdale, Killarney, Trout Lake
  - Hillcrest, Mount Pleasant, Sunset
- **Data**: Drop-in sports schedules
- **Update frequency**: Every 6 hours
- **Reliability**: Medium (web scraping)

### 3. User Submissions ✅
- **Status**: Implemented
- **Features**:
  - Authenticated users can submit games
  - Automatic geocoding
  - Sport normalization
  - Real-time notifications
- **Endpoints**:
  - POST `/api/user-games/submit`
  - GET `/api/user-games/my-games`
  - PUT `/api/user-games/:gameId`
  - DELETE `/api/user-games/:gameId`
  - POST `/api/user-games/:gameId/report`

## Technical Architecture

### Data Pipeline
```
Sources → Collection → Normalization → Deduplication → Storage → API
```

### Key Components

1. **Base Data Source Class** (`base-source.js`)
   - Common methods for all sources
   - Sport normalization
   - Time parsing
   - Reliability scoring

2. **Data Aggregation Pipeline** (`data-aggregation-pipeline.js`)
   - Job scheduling with Bull queue
   - Data deduplication
   - Distance calculations
   - Search functionality

3. **Normalized Game Schema**
```javascript
{
  id: String,
  title: String,
  sport: String, // normalized
  venue: {
    name: String,
    address: String,
    coordinates: { lat, lng },
    type: String
  },
  startTime: Date,
  endTime: Date,
  recurring: {
    enabled: Boolean,
    pattern: String,
    dayOfWeek: String
  },
  capacity: { min, max, current },
  skillLevel: String,
  cost: Number,
  organizer: Object,
  source: {
    type: String,
    name: String,
    reliability: Number
  }
}
```

## API Endpoints

### Public Endpoints
- `GET /api/games` - Search games with filters
  - Parameters: sport, location, lat, lng, radius, date
  - Returns aggregated data when available
- `GET /api/facilities` - Get all known facilities
- `GET /api/data/stats` - Data aggregation statistics

### Authenticated Endpoints
- `POST /api/user-games/submit` - Submit new game
- `GET /api/user-games/my-games` - Get user's games
- `PUT /api/user-games/:gameId` - Update game
- `DELETE /api/user-games/:gameId` - Delete game
- `POST /api/user-games/:gameId/report` - Report game

## Current Status

### Working Features
- ✅ Vancouver facility data collection
- ✅ Community center schedule scraping
- ✅ User game submissions
- ✅ Real-time WebSocket notifications
- ✅ Game deduplication
- ✅ Location-based search
- ✅ Sport normalization
- ✅ Reliability scoring

### Demo Limitations
- Using in-memory storage (no persistence)
- Limited to 6 community centers
- No real geocoding (mock implementation)
- No Redis for production queuing

## Usage Examples

### Search for games
```bash
# Find basketball games near a location
GET /api/games?sport=basketball&lat=49.2827&lng=-123.1207&radius=5000

# Find all games in a date
GET /api/games?date=2025-01-06

# Find games by sport
GET /api/games?sport=volleyball
```

### Submit a game
```bash
POST /api/user-games/submit
Authorization: Bearer <token>

{
  "title": "Friendly Basketball Game",
  "sport": "basketball",
  "venue": {
    "name": "Local Park",
    "address": "123 Main St, Vancouver, BC"
  },
  "startTime": "2025-01-07T18:00:00",
  "endTime": "2025-01-07T20:00:00",
  "maxPlayers": 10,
  "skillLevel": "intermediate",
  "description": "Casual game, all welcome!"
}
```

## Next Steps

### Phase 1: More Data Sources
1. **GoodRec API Integration**
   - Partner with GoodRec for their game data
   - Most comprehensive sports app data

2. **Meetup.com API**
   - Sports meetup groups
   - Community organized games

3. **University Recreation**
   - UBC Recreation API/scraping
   - SFU Recreation data

### Phase 2: Production Infrastructure
1. **PostgreSQL Database**
   - Replace in-memory storage
   - PostGIS for geospatial queries

2. **Redis Queue**
   - Production job queue
   - Distributed processing

3. **Caching Layer**
   - Cache aggregated results
   - Reduce API calls

### Phase 3: Advanced Features
1. **Machine Learning**
   - Predict game availability
   - Recommend games to users
   - Detect duplicate games better

2. **Social Integration**
   - Facebook group monitoring
   - WhatsApp group integration
   - Discord bot

3. **Mobile App**
   - Native iOS/Android apps
   - Push notifications
   - Offline support

## Data Quality Metrics

Current system tracks:
- **Coverage**: Number of facilities with data
- **Freshness**: Age of game data
- **Reliability**: Score based on source and completeness
- **Accuracy**: User-reported accuracy

## Legal Considerations

- ✅ Vancouver Open Data - Open license
- ⚠️  Web scraping - Respects robots.txt
- ✅ User submissions - Terms acceptance required
- ⚠️  Social media - Requires API access/permissions

## To Run the System

```bash
# Start backend with data aggregation
cd mockup/backend
npm install
npm start

# The pipeline will automatically:
# 1. Fetch Vancouver facility data
# 2. Scrape community center schedules
# 3. Accept user submissions
# 4. Provide unified API access
```

## Monitoring

Access real-time stats:
```
GET /api/data/stats

{
  "totalGames": 45,
  "totalFacilities": 127,
  "sources": [...],
  "sportBreakdown": {
    "basketball": 15,
    "volleyball": 8,
    "soccer": 12,
    ...
  }
}
```