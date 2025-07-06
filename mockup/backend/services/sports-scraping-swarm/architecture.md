# 🏗️ Sports Game Scraping System Architecture

## 🎯 System Overview

A distributed, resilient sports game scraping system designed to collect, process, and serve drop-in sports game data from 500+ sources in real-time.

## 🏛️ Microservices Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User API      │    │   Admin API     │    │  WebSocket API  │
│   (Express)     │    │   (Express)     │    │   (Socket.io)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
┌──────────────────────────────────────────────────────────────────┐
│                     API Gateway (Kong/Nginx)                     │
└─────────────────────────┬────────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────────────┐
│                    Service Mesh                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Scraper     │  │ Data        │  │ Location    │  │ Notification│ │
│  │ Orchestrator│  │ Processor   │  │ Service     │  │ Service     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ ML Engine   │  │ Cache       │  │ Monitoring  │  │ Analytics   │ │
│  │ Service     │  │ Service     │  │ Service     │  │ Service     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────┼────────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────────────┐
│                    Data Layer                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ PostgreSQL  │  │ Redis       │  │ Elasticsearch│  │ InfluxDB    │ │
│  │ (Primary)   │  │ (Cache)     │  │ (Search)    │  │ (Metrics)   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────┼────────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────────────┐
│                 Message Queue Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │ RabbitMQ    │  │ Apache      │  │ Redis       │               │
│  │ (Tasks)     │  │ Kafka       │  │ Pub/Sub     │               │
│  │             │  │ (Streaming) │  │ (Real-time) │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow Architecture

### 1. Ingestion Pipeline
```
Sources → Scrapers → Raw Data Queue → Data Processor → Normalized Data → Cache → API
```

### 2. Real-time Processing
```
Live Sources → WebSocket → Event Stream → Real-time Updates → User Notifications
```

### 3. ML Enhancement
```
Historical Data → ML Models → Predictions → Enhanced Game Data → User Recommendations
```

## 🗃️ Database Schema

### Games Table
```sql
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE,
    title VARCHAR(255) NOT NULL,
    sport VARCHAR(100) NOT NULL,
    venue_id INTEGER REFERENCES venues(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    price DECIMAL(10,2),
    skill_level VARCHAR(50),
    age_group VARCHAR(50),
    description TEXT,
    requirements TEXT[],
    organizer_id INTEGER REFERENCES organizers(id),
    source_id INTEGER REFERENCES sources(id),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB,
    status VARCHAR(50) DEFAULT 'active',
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_games_sport_location_time ON games(sport, venue_id, start_time);
CREATE INDEX idx_games_location_time ON games(venue_id, start_time);
CREATE INDEX idx_games_time_sport ON games(start_time, sport);
```

### Venues Table
```sql
CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(50) NOT NULL,
    postal_code VARCHAR(10),
    coordinates POINT NOT NULL,
    venue_type VARCHAR(100),
    facilities TEXT[],
    capacity INTEGER,
    indoor BOOLEAN,
    accessibility_features TEXT[],
    contact_info JSONB,
    operating_hours JSONB,
    source_id INTEGER REFERENCES sources(id),
    verified BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_venues_coordinates ON venues USING GIST(coordinates);
CREATE INDEX idx_venues_city ON venues(city);
```

### Sources Table
```sql
CREATE TABLE sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'website', 'api', 'social', 'app'
    url TEXT,
    scraping_config JSONB,
    rate_limit INTEGER DEFAULT 60, -- requests per minute
    last_successful_scrape TIMESTAMP,
    success_rate DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'active',
    region VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Scraper Orchestrator Service

### Core Components

1. **Source Manager**: Manages scraping sources and configurations
2. **Worker Pool**: Distributes scraping tasks across multiple workers
3. **Rate Limiter**: Enforces respectful scraping practices
4. **Retry Logic**: Handles failures with exponential backoff
5. **Health Monitor**: Tracks scraper performance and success rates

### Implementation Strategy

```javascript
// Scraper Orchestrator
class ScraperOrchestrator {
    constructor() {
        this.workerPool = new WorkerPool(50); // 50 concurrent workers
        this.rateLimiter = new RateLimiter();
        this.retryQueue = new RetryQueue();
        this.healthMonitor = new HealthMonitor();
    }

    async orchestrateScraping() {
        const sources = await this.getActiveSources();
        const tasks = this.createScrapingTasks(sources);
        
        return Promise.allSettled(
            tasks.map(task => this.executeTask(task))
        );
    }

    async executeTask(task) {
        try {
            await this.rateLimiter.acquire(task.source.id);
            const data = await this.scrapeSource(task);
            await this.processData(data);
            this.healthMonitor.recordSuccess(task.source.id);
        } catch (error) {
            this.healthMonitor.recordFailure(task.source.id, error);
            await this.retryQueue.add(task);
        }
    }
}
```

## 🎯 Performance Targets

### Throughput
- **10,000+ games processed per hour**
- **500+ sources monitored concurrently**
- **< 5 minute data freshness**
- **< 200ms API response time**

### Reliability
- **99.9% uptime**
- **95%+ scraping success rate**
- **Automatic failover and recovery**
- **Zero data loss guarantee**

## 🔄 Real-time Data Streaming

### WebSocket Architecture
```javascript
// Real-time Game Updates
class GameUpdateStreamer {
    constructor() {
        this.kafka = new KafkaConsumer(['game-updates']);
        this.socketManager = new SocketManager();
    }

    async streamUpdates() {
        this.kafka.on('message', (message) => {
            const update = JSON.parse(message.value);
            this.socketManager.broadcastToRegion(
                update.region, 
                update
            );
        });
    }
}
```

## 📡 API Specifications

### Game Search API
```javascript
GET /api/games/search
Query Parameters:
- lat, lng: Geographic coordinates
- radius: Search radius in km (default: 10)
- sport: Sport type filter
- date: Date filter (ISO format)
- skill_level: Skill level filter
- max_price: Maximum price filter
- limit: Results limit (default: 50)

Response:
{
    "games": [...],
    "total": 1250,
    "filters_applied": {...},
    "search_metadata": {
        "radius_km": 10,
        "sources_checked": 45,
        "last_updated": "2025-01-06T..."
    }
}
```

### Real-time Updates API
```javascript
WebSocket: /api/games/live
Events:
- game_added: New game discovered
- game_updated: Game details changed
- game_cancelled: Game cancelled
- venue_status: Venue availability changed
```

## 🛡️ Fault Tolerance

### Circuit Breaker Pattern
```javascript
class SourceCircuitBreaker {
    constructor(source) {
        this.source = source;
        this.failureCount = 0;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.lastFailureTime = null;
    }

    async execute(scrapingFunction) {
        if (this.state === 'OPEN') {
            if (this.shouldAttemptReset()) {
                this.state = 'HALF_OPEN';
            } else {
                throw new Error('Circuit breaker is OPEN');
            }
        }

        try {
            const result = await scrapingFunction();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }
}
```

## 📈 Monitoring & Alerting

### Key Metrics
- Scraping success rate per source
- Data freshness by region
- API response times
- User engagement metrics
- System resource utilization

### Alert Conditions
- Source failure rate > 10%
- Data age > 30 minutes
- API response time > 500ms
- Database connection issues
- Queue backlog > 1000 items

This architecture provides a robust foundation for comprehensive sports game data collection and real-time delivery to users.