# Play Now Swarm - Multi-Agent System for Real-Time Sports Data

## Overview

The Play Now Swarm is a sophisticated multi-agent system designed to aggregate real-time local sports data for the Finding Sports platform. It coordinates specialized agents that work in parallel to find drop-in games, open courts, and pickup games happening in the user's area.

## Architecture

### Core Components

1. **Play Now Swarm (`play-now-swarm.js`)**
   - Orchestrates multiple specialized agents
   - Manages parallel execution and caching
   - Aggregates results from all agents

2. **Play Now Service (`play-now-service.js`)**
   - Integrates swarm with the main application
   - Provides fallback to mock data
   - Manages configuration and timeouts

3. **Data Aggregation Swarm (`data-aggregation-swarm.js`)**
   - Manages 100+ data sources
   - Handles rate limiting and caching
   - Provides data to the Play Now Swarm

## Specialized Agents

### 1. LocationScoutAgent
- **Role**: Find nearby sports facilities and venues
- **Priority**: 1 (runs first)
- **Cache TTL**: 24 hours
- **Data Sources**:
  - Community centers
  - Parks and outdoor courts
  - University facilities
  - Private gyms and clubs
  - Ice rinks

### 2. ScheduleAgent
- **Role**: Check drop-in schedules and times
- **Priority**: 2
- **Cache TTL**: 1 hour
- **Data Sources**:
  - Municipal recreation schedules
  - Facility drop-in times
  - Regular programming

### 3. AvailabilityAgent
- **Role**: Monitor real-time court/field availability
- **Priority**: 3
- **Cache TTL**: 5 minutes
- **Features**:
  - Current capacity monitoring
  - Wait time estimates
  - Busy level indicators

### 4. WeatherAgent
- **Role**: Check weather conditions for outdoor games
- **Priority**: 4
- **Cache TTL**: 30 minutes
- **Features**:
  - Current conditions
  - 2-hour forecast
  - Sport-specific playability

### 5. CoordinatorAgent
- **Role**: Aggregate data and rank best options
- **Priority**: 5
- **Cache TTL**: 0 (always fresh)
- **Features**:
  - Combines all agent data
  - Sorts by distance and relevance
  - Formats for API response

## API Endpoints

### Get Activities
```
GET /api/play-now?lat=49.2827&lng=-123.1207&radius=10
```

**Query Parameters:**
- `lat`: User's latitude
- `lng`: User's longitude
- `radius`: Search radius in km (default: 10)
- `includeOpenCourts`: Include open courts/fields (default: true)
- `includePickupGames`: Include pickup games (default: true)

**Response:**
```json
{
  "activities": {
    "happeningNow": [...],
    "startingSoon": [...],
    "laterToday": [...],
    "openCourts": [...],
    "pickupGames": [...]
  },
  "summary": {
    "totalActivities": 15,
    "happeningNow": 3,
    "startingSoon": 5,
    "laterToday": 7,
    "searchRadius": "10 km",
    "currentTime": "2024-01-15T14:30:00Z"
  }
}
```

### Swarm Status
```
GET /api/play-now/swarm/status
```

**Response:**
```json
{
  "swarm": {
    "enabled": true,
    "timeout": 5000,
    "fallbackEnabled": true,
    "swarmDetails": {
      "agents": [...],
      "metrics": {...},
      "cacheSize": 25
    }
  },
  "dataSources": {
    "totalSources": 45,
    "categories": {
      "dropIn": 15,
      "openField": 10,
      "pickup": 8,
      "api": 12,
      "scraper": 33
    }
  }
}
```

### Configure Swarm
```
POST /api/play-now/swarm/config
```

**Body:**
```json
{
  "enabled": true,
  "timeout": 5000,
  "fallback": true
}
```

### Clear Cache
```
POST /api/play-now/swarm/cache/clear
```

## Data Sources

The swarm aggregates data from multiple sources:

### Municipal Recreation Centers
- City of Vancouver drop-in schedules
- Burnaby, Richmond, Surrey, North Vancouver rec centers
- Real-time capacity and availability

### Universities
- UBC Recreation facilities
- SFU fitness centers
- Drop-in gym times

### Private Facilities
- YMCA locations
- JCC Sports Centre
- Steve Nash Fitness World
- Local sports clubs

### Open Courts/Fields
- Public basketball courts
- Tennis courts
- Soccer fields
- Beach volleyball courts
- Field condition monitoring

### Social Platforms
- Facebook pickup game groups
- Meetup sports events
- OpenSports app
- Javelin app
- PlaySports app

## Performance Features

### Intelligent Caching
- Agent-specific cache TTLs
- Location-based cache keys
- Automatic cache invalidation
- Cache hit rate tracking

### Parallel Execution
- Agents run concurrently within priority groups
- Timeout protection (default 5 seconds)
- Fallback to mock data on failure

### Rate Limiting
- Per-source rate limits
- Token bucket algorithm
- 80% utilization buffer

### Performance Metrics
- Average response time tracking
- Agent execution counts
- Cache utilization rates
- Success/failure tracking

## Vancouver-Specific Features

The system is optimized for Vancouver and BC locations:

### Known Venues
- 20+ community centers
- 15+ outdoor courts
- 10+ university facilities
- Popular pickup game locations

### Weather Integration
- Rain detection for outdoor venues
- Court condition estimates
- Sport-specific playability

### Local Data Sources
- Vancouver Parks Board field status
- Municipal recreation schedules
- Local sports app integrations

## Usage Examples

### Basic Usage
```javascript
const { getInstance } = require('./services/play-now-service');
const playNowService = getInstance();

// Find games near downtown Vancouver
const activities = await playNowService.getPlayNowActivities(
  { lat: 49.2827, lng: -123.1207 },
  { radiusKm: 5, sports: ['basketball', 'volleyball'] }
);
```

### Advanced Configuration
```javascript
// Disable swarm for testing
playNowService.setSwarmEnabled(false);

// Adjust timeout for slow connections
playNowService.setSwarmTimeout(10000); // 10 seconds

// Clear cache to force fresh data
playNowService.clearSwarmCache();
```

## Testing

Run the test script to see the swarm in action:

```bash
cd backend
node test-play-now-swarm.js
```

This will:
- Show all agents and their roles
- Find games for multiple Vancouver locations
- Display performance metrics
- Compare swarm vs mock data results

## Future Enhancements

1. **Real API Integration**
   - Connect to actual recreation center APIs
   - Implement web scraping for schedules
   - Real weather API integration

2. **Machine Learning**
   - Predict busy times based on historical data
   - Personalized recommendations
   - Anomaly detection for data quality

3. **User Features**
   - Save favorite venues
   - Get notifications for games starting
   - Reserve spots in drop-in sessions

4. **Additional Agents**
   - TrafficAgent for travel time estimates
   - SocialAgent for friend availability
   - EquipmentAgent for gear requirements

## Troubleshooting

### Swarm Timeout
If the swarm times out frequently:
1. Increase timeout: `playNowService.setSwarmTimeout(10000)`
2. Check network connectivity
3. Review agent performance metrics

### No Results
If no activities are found:
1. Check location coordinates are correct
2. Verify radius is appropriate
3. Ensure swarm is enabled
4. Check cache isn't stale

### Performance Issues
1. Monitor cache hit rates
2. Review agent execution times
3. Consider reducing parallel agents
4. Clear cache if needed