# 🏗️ Finding Sports Backend Architecture V2 - Scalable Data Aggregation System

## Overview

This architecture supports aggregating sports data from 100+ sources using a hierarchical swarm approach with intelligent caching, AI-powered discovery, and real-time updates.

## 🎯 Core Components

### 1. **Hierarchical Data Collection Swarm**
- **Master Coordinator**: Orchestrates all data collection activities
- **API Collection Manager**: Manages API-based sources
- **Scraping Manager**: Manages web scraping sources
- **Discovery Agent**: AI-powered discovery for new sources
- **Cache Coordinator**: Manages intelligent caching strategies

### 2. **Site Methods Database**
```javascript
// Schema for storing site-specific collection methods
{
  siteId: "espn-basketball",
  domain: "espn.com",
  sport: "basketball",
  method: {
    type: "api",
    endpoint: "https://api.espn.com/v2/sports/basketball/events",
    auth: {
      type: "bearer",
      tokenEndpoint: "/auth/token"
    },
    rateLimit: {
      requests: 1000,
      window: "1h"
    },
    dataMapping: {
      games: "events",
      venue: "competitions[0].venue",
      time: "competitions[0].date"
    }
  },
  reliability: 0.95,
  lastUpdated: "2025-01-10T12:00:00Z",
  discoveredBy: "ai-discovery-agent",
  validationStatus: "verified"
}
```

### 3. **Parallel Collection Engine**
```javascript
// Parallel collection with rate limiting
class ParallelCollector {
  constructor() {
    this.collectors = new Map();
    this.rateLimiters = new Map();
    this.queue = new PriorityQueue();
  }

  async collectFromSources(sources) {
    // Group sources by rate limit tier
    const tiers = this.groupByRateLimit(sources);
    
    // Execute in parallel with controlled concurrency
    const results = await Promise.allSettled(
      tiers.map(tier => this.collectTier(tier))
    );
    
    return this.aggregateResults(results);
  }
}
```

### 4. **AI Discovery System**
```javascript
// AI-powered source discovery
class SourceDiscoveryAgent {
  async discoverCollectionMethod(url) {
    // Analyze page structure
    const analysis = await this.analyzePage(url);
    
    // Check for API endpoints
    const apiEndpoints = await this.detectAPIs(analysis);
    
    // Generate scraping patterns
    const scrapingPatterns = await this.generateSelectors(analysis);
    
    // Test and validate methods
    const validatedMethod = await this.validateMethod({
      apis: apiEndpoints,
      scraping: scrapingPatterns
    });
    
    return validatedMethod;
  }
}
```

### 5. **Intelligent Caching Layer**
```javascript
// Smart caching with automatic invalidation
class IntelligentCache {
  constructor() {
    this.redis = new Redis();
    this.strategies = new Map();
  }

  async get(key, options = {}) {
    // Check if first request of the day
    if (this.isFirstDailyRequest(key)) {
      return null; // Force refresh
    }
    
    // Get from cache with TTL check
    const cached = await this.redis.get(key);
    if (cached && !this.isStale(cached, options)) {
      return cached;
    }
    
    return null;
  }

  async set(key, value, options = {}) {
    const ttl = this.calculateTTL(key, value, options);
    await this.redis.setex(key, ttl, value);
  }
}
```

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (Railway)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  API Gateway (Express.js)                    │
│  • Rate limiting  • Auth  • Request routing  • Monitoring   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Hierarchical Swarm Coordinator                  │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────────────┐    │
│  │   Master    │ │     API     │ │    Scraping       │    │
│  │ Coordinator │ │   Manager   │ │    Manager        │    │
│  └─────────────┘ └─────────────┘ └────────────────────┘    │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────────────┐    │
│  │  Discovery  │ │    Cache    │ │   Performance     │    │
│  │    Agent    │ │ Coordinator │ │    Monitor        │    │
│  └─────────────┘ └─────────────┘ └────────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Data Collection Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────────────┐    │
│  │ ESPN API    │ │  Scraper 1  │ │   Scraper 2       │    │
│  │ Collector   │ │  (Puppeteer)│ │  (Playwright)     │    │
│  └─────────────┘ └─────────────┘ └────────────────────┘    │
│                    ... 100+ collectors ...                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Storage Layer                             │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────────────┐    │
│  │  PostgreSQL │ │    Redis    │ │   S3 Bucket      │    │
│  │  (Main DB)  │ │   (Cache)   │ │  (Backups)       │    │
│  └─────────────┘ └─────────────┘ └────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema

### Sites Collection Methods Table
```sql
CREATE TABLE site_collection_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255) NOT NULL,
    sport VARCHAR(100),
    method_type VARCHAR(50) NOT NULL, -- 'api', 'scraper', 'hybrid'
    method_config JSONB NOT NULL,
    reliability_score DECIMAL(3,2) DEFAULT 0.80,
    discovered_by VARCHAR(100),
    discovery_method VARCHAR(50), -- 'manual', 'ai', 'community'
    validation_status VARCHAR(50) DEFAULT 'pending',
    last_successful_collection TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_site_methods_domain ON site_collection_methods(domain);
CREATE INDEX idx_site_methods_sport ON site_collection_methods(sport);
CREATE INDEX idx_site_methods_reliability ON site_collection_methods(reliability_score DESC);
```

### Aggregated Games Table
```sql
CREATE TABLE aggregated_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255),
    source_site_id VARCHAR(255) REFERENCES site_collection_methods(site_id),
    sport VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    venue_name VARCHAR(500) NOT NULL,
    venue_address TEXT,
    venue_coordinates POINT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    game_type VARCHAR(50), -- 'drop-in', 'league', 'tournament'
    capacity_max INTEGER,
    capacity_current INTEGER,
    price DECIMAL(10,2),
    requirements TEXT[],
    raw_data JSONB,
    reliability_score DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Deduplication
    UNIQUE(source_site_id, external_id)
);

-- Indexes for performance
CREATE INDEX idx_games_sport ON aggregated_games(sport);
CREATE INDEX idx_games_start_time ON aggregated_games(start_time);
CREATE INDEX idx_games_venue_coordinates ON aggregated_games USING GIST(venue_coordinates);
```

## 🚀 Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
1. Set up PostgreSQL with schema
2. Configure Redis for caching
3. Implement base swarm coordinator
4. Create site methods database structure

### Phase 2: Collection Framework (Week 2)
1. Build parallel collection engine
2. Implement rate limiting system
3. Create API and scraper base classes
4. Add 10 initial data sources

### Phase 3: AI Discovery System (Week 3)
1. Implement page analysis agent
2. Create API endpoint detector
3. Build scraping pattern generator
4. Add validation framework

### Phase 4: Intelligent Caching (Week 4)
1. Implement cache warming strategies
2. Create invalidation rules engine
3. Add predictive pre-fetching
4. Build cache analytics

### Phase 5: Scaling & Optimization (Week 5)
1. Add horizontal scaling support
2. Implement distributed rate limiting
3. Create monitoring dashboards
4. Performance optimization

## 🛠️ Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with async middleware
- **Database**: PostgreSQL (primary), Redis (cache)
- **Queue**: Bull (Redis-based) for job processing
- **Scraping**: Puppeteer, Playwright, Cheerio
- **AI/ML**: TensorFlow.js for pattern recognition
- **Monitoring**: Prometheus + Grafana
- **Deployment**: Railway with auto-scaling

## 📈 Performance Targets

- **Collection Speed**: 100+ sources in < 5 minutes
- **API Response Time**: < 100ms (cached), < 2s (fresh)
- **Reliability**: 99.9% uptime
- **Scalability**: Support 10,000+ concurrent users
- **Data Freshness**: Updates every 2-4 hours

## 🔒 Security Considerations

1. **API Keys Management**: Vault for secure storage
2. **Rate Limit Compliance**: Respect source limits
3. **Data Privacy**: GDPR compliance
4. **Access Control**: JWT with role-based permissions
5. **Monitoring**: Anomaly detection for abuse

## 🌐 API Endpoints

### Games API
```
GET /api/v2/games
  ?sport=basketball
  &lat=49.2827
  &lng=-123.1207
  &radius=10km
  &date=2025-01-10
  &type=drop-in

Response:
{
  "games": [...],
  "meta": {
    "total": 145,
    "sources": 23,
    "cached": false,
    "responseTime": 1.2
  }
}
```

### Sources API
```
GET /api/v2/sources
  ?status=active
  &sport=basketball

POST /api/v2/sources/discover
{
  "url": "https://newsportssite.com",
  "sport": "basketball"
}
```

### Admin API
```
GET /api/v2/admin/collection-status
GET /api/v2/admin/source-health
POST /api/v2/admin/trigger-collection
```

## 🎯 Success Metrics

1. **Data Coverage**: 95%+ of available games captured
2. **Source Reliability**: 90%+ success rate per source
3. **User Satisfaction**: < 2% missing game reports
4. **Cost Efficiency**: < $0.01 per 1000 API calls
5. **Developer Experience**: New source added in < 1 hour