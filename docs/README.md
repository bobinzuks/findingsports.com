# Finding Sports - Local Game Discovery Platform

A high-performance, real-time sports game discovery platform that aggregates drop-in games and sports activities from multiple sources with location-based search capabilities.

## 🚀 Key Features

- **Multi-Source Data Aggregation**: APIs, web scraping, user submissions, RSS/email feeds
- **Location-Based Search**: Geospatial queries with adjustable radius (default 10km)
- **Sub-100ms Response Times**: Multi-level caching (Memory → Redis → PostgreSQL)
- **Automatic Data Expiry**: Time-based partitioning for efficient cleanup
- **User-Submitted Games**: Community-driven with verification system
- **Real-Time Updates**: Continuous data synchronization from all sources

## 📊 System Architecture

### Data Flow
```
Data Sources → Aggregator → Database → Cache → API → Users
     ↑                                              ↓
     └──────── User Submissions ←──────────────────┘
```

### Technology Stack
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with PostGIS for geospatial queries
- **Cache**: Redis + In-memory LRU cache
- **Scraping**: Puppeteer with Cheerio
- **Queue**: Node-cron for scheduled tasks

## 🏃 Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/finding-sports.git
cd finding-sports
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup databases**
```bash
# PostgreSQL
createdb finding_sports
npm run db:migrate

# Redis
redis-server
```

5. **Start the server**
```bash
npm start
# or for development
npm run dev
```

## 📡 API Endpoints

### Find Nearby Games
```bash
GET /api/games/nearby?lat=43.6532&lng=-79.3832&radius=10&sport=basketball
```

**Response:**
```json
{
  "success": true,
  "data": {
    "games": [{
      "id": "123",
      "venue": {
        "name": "Community Center",
        "distance": 500
      },
      "sport": "basketball",
      "startTime": "2024-01-15T18:00:00Z",
      "gameType": "drop-in"
    }]
  },
  "meta": {
    "responseTime": 45,
    "cacheHit": true
  }
}
```

### Submit a Game
```bash
POST /api/games/submit
Content-Type: application/json

{
  "venue": {
    "name": "Local Gym",
    "address": "123 Main St",
    "latitude": 43.6532,
    "longitude": -79.3832,
    "type": "gym"
  },
  "game": {
    "sport": "basketball",
    "startTime": "2024-01-15T18:00:00Z",
    "endTime": "2024-01-15T20:00:00Z",
    "gameType": "drop-in"
  },
  "user": {
    "id": "user123",
    "email": "user@example.com"
  }
}
```

## 🔧 Configuration

### Data Sources

1. **Google Places API**
   - Set `GOOGLE_PLACES_API_KEY` in `.env`
   - Provides comprehensive venue data
   - Cost: $17-32 per 1,000 requests

2. **Municipal APIs** (Free)
   - Toronto Open Data
   - NYC Open Data
   - Chicago Data Portal
   - Auto-configured, no keys needed

3. **Web Scraping**
   - YMCA locations
   - Community centers
   - Configurable via `scrapers/` directory

### Performance Tuning

**Cache Configuration:**
```javascript
{
  memoryCacheSize: 1000,      // LRU cache entries
  memoryTTL: 60000,          // 1 minute
  redisTTL: {
    activeGame: 300,         // 5 minutes
    upcomingGame: 1800,      // 30 minutes
    futureGame: 7200,        // 2 hours
    venueData: 86400         // 24 hours
  }
}
```

**Database Optimization:**
- Geohash indexing for fast location queries
- Time-based partitioning (daily)
- Automatic partition cleanup after 7 days
- Covering indexes for common queries

## 📈 Performance Metrics

- **Response Time**: <100ms (p95)
- **Cache Hit Rate**: 80-90%
- **Data Freshness**: 5-30 minutes
- **Scalability**: 1000+ venues, 10k+ games/day

## 🛠️ Development

### Running Tests
```bash
npm test
npm run test:watch
```

### Database Migrations
```bash
npm run db:migrate
```

### Cache Warming
```bash
npm run cache:warm
```

### Data Sync
```bash
npm run data:sync
```

## 🚀 Deployment

### Prerequisites
- PostgreSQL 12+ with PostGIS
- Redis 6+
- Node.js 18+
- PM2 (for production)

### Production Setup
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Setup daily cron jobs
crontab -e
# Add: 0 3 * * * cd /path/to/app && npm run cleanup-partitions
```

### Environment Variables
See `.env.example` for all configuration options.

## 📊 Monitoring

### Health Check
```bash
GET /health
```

### Cache Statistics
```bash
GET /api/games/stats/cache
```

### Sync Status
```bash
GET /api/games/stats/sync
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- Documentation: `/docs`
- Issues: GitHub Issues
- API Reference: `/api` endpoint

## 🎯 Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Mobile app API
- [ ] Machine learning for game predictions
- [ ] Social features (teams, RSVPs)
- [ ] Payment integration for paid games
- [ ] Advanced filtering (skill level, age groups)