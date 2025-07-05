# Finding Sports - Complete Implementation Plan

## Executive Summary

Finding Sports solves a critical problem: users waste hours searching multiple recreation center websites to find drop-in sports games. Our solution aggregates all sports venue data into a unified platform with real-time availability, social features, and instant game discovery.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Applications                      │
├─────────────────────┬────────────────────┬─────────────────────┤
│   Web App (React)   │  iOS App (React    │  Android App        │
│                     │  Native)            │  (React Native)     │
└──────────┬──────────┴────────────────────┴──────────┬──────────┘
           │                                           │
┌──────────▼───────────────────────────────────────────▼──────────┐
│                         API Gateway                              │
│                    (Kong/Nginx + Rate Limiting)                  │
└──────────┬───────────────────────────────────────────┬──────────┘
           │                                           │
┌──────────▼───────────────────────────────────────────▼──────────┐
│                      GraphQL Federation                          │
├─────────────┬─────────────┬─────────────┬──────────────────────┤
│  Auth       │   Venue     │   Social    │    Scraper          │
│  Service    │   Service   │   Service   │    Service          │
│  (Rust)     │   (Rust)    │   (Rust)    │    (Rust)           │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬───────────────┘
       │             │              │             │
┌──────▼─────────────▼──────────────▼─────────────▼───────────────┐
│                    Data Layer Architecture                       │
├─────────────┬──────────────┬──────────────┬────────────────────┤
│ PostgreSQL  │    Redis     │ Elasticsearch│   Message Queue    │
│ + PostGIS   │  (Cache +    │  (Search)    │  (RabbitMQ/Kafka)  │
│             │  Real-time)  │              │                    │
└─────────────┴──────────────┴──────────────┴────────────────────┘
```

## Core Technology Stack

### Backend Framework: Rust with Axum
```toml
[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
sqlx = { version = "0.7", features = ["postgres", "runtime-tokio"] }
redis = "0.24"
serde = { version = "1.0", features = ["derive"] }
```

**Why Rust + Axum:**
- Handles 1M+ concurrent connections
- Memory safety without garbage collection
- Perfect for real-time WebSocket connections
- Excellent async performance for web scraping

### Database: PostgreSQL + PostGIS
```sql
-- Core venue table with geospatial indexing
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    amenities JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_location ON venues USING GIST(location);
CREATE INDEX idx_venues_amenities ON venues USING GIN(amenities);

-- Sports availability with temporal data
CREATE TABLE sports_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id),
    sport_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    availability_type VARCHAR(20), -- 'drop-in', 'league', 'bookable'
    current_attendees INTEGER DEFAULT 0,
    max_attendees INTEGER,
    price DECIMAL(10,2),
    source_url TEXT,
    last_scraped TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_availability_time ON sports_availability(start_time, end_time);
CREATE INDEX idx_availability_sport ON sports_availability(sport_type);
```

## MCP Server Architecture

### Multi-Source Data Aggregation
```yaml
# MCP Server Configuration
mcp_servers:
  - name: rec_center_scraper
    type: web_scraper
    sources:
      - url_pattern: "*.vancouver.ca/recreation/*"
        parser: vancouver_rec_parser
      - url_pattern: "*.burnaby.ca/recreation/*"
        parser: burnaby_rec_parser
    
  - name: facebook_integration
    type: social_api
    endpoints:
      - events: "graph.facebook.com/v18.0/search"
      - groups: "graph.facebook.com/v18.0/groups"
    
  - name: email_monitor
    type: email_parser
    providers:
      - gmail_api
      - outlook_api
    filters:
      - subject_contains: ["drop-in", "sports", "basketball", "soccer"]
```

### Scraping Strategy

```rust
// Intelligent scraping with rate limiting and caching
pub struct ScraperService {
    scrapers: Vec<Box<dyn VenueScraper>>,
    rate_limiter: RateLimiter,
    cache: RedisCache,
}

impl ScraperService {
    pub async fn scrape_all_sources(&self) -> Result<Vec<VenueData>> {
        let mut all_venues = Vec::new();
        
        // Parallel scraping with rate limiting
        let futures = self.scrapers.iter().map(|scraper| {
            async move {
                self.rate_limiter.acquire().await;
                scraper.scrape().await
            }
        });
        
        let results = futures::future::join_all(futures).await;
        
        // Deduplicate and merge venue data
        for result in results {
            if let Ok(venues) = result {
                all_venues.extend(venues);
            }
        }
        
        self.deduplicate_venues(all_venues).await
    }
}

// Example scraper implementation
pub struct VancouverRecScraper;

impl VenueScraper for VancouverRecScraper {
    async fn scrape(&self) -> Result<Vec<VenueData>> {
        // Parse schedule tables
        // Extract drop-in times
        // Normalize data format
    }
}
```

## Real-Time Features

### WebSocket Architecture
```rust
// Real-time game updates
pub async fn game_updates_handler(
    ws: WebSocketUpgrade,
    State(app_state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, app_state))
}

async fn handle_socket(mut socket: WebSocket, state: AppState) {
    // Subscribe to venue updates near user location
    let mut rx = state.redis.subscribe("venue:updates").await.unwrap();
    
    while let Some(msg) = rx.recv().await {
        if let Ok(update) = serde_json::from_str::<VenueUpdate>(&msg) {
            // Send filtered updates based on user preferences
            let _ = socket.send(Message::Text(json!(update).to_string())).await;
        }
    }
}
```

### Redis Pub/Sub for Real-Time Updates
```rust
// Publish venue updates
pub async fn publish_venue_update(redis: &Redis, update: VenueUpdate) {
    let channel = format!("venue:{}:{}", update.city, update.sport_type);
    redis.publish(channel, json!(update).to_string()).await.unwrap();
}

// Geospatial queries with caching
pub async fn find_nearby_venues(
    lat: f64,
    lon: f64,
    radius_km: f64,
    sport_type: Option<String>,
) -> Vec<Venue> {
    // Check Redis geo cache first
    let cache_key = format!("venues:{}:{}:{}", lat, lon, radius_km);
    
    if let Some(cached) = redis.get(&cache_key).await {
        return cached;
    }
    
    // Query PostGIS
    let query = sqlx::query!(
        r#"
        SELECT v.*, sa.* 
        FROM venues v
        JOIN sports_availability sa ON v.id = sa.venue_id
        WHERE ST_DWithin(
            v.location::geography,
            ST_MakePoint($1, $2)::geography,
            $3 * 1000
        )
        AND ($4::text IS NULL OR sa.sport_type = $4)
        AND sa.start_time > NOW()
        ORDER BY ST_Distance(v.location, ST_MakePoint($1, $2))
        "#,
        lon, lat, radius_km, sport_type
    );
    
    // Cache for 5 minutes
    redis.setex(&cache_key, 300, &venues).await;
    venues
}
```

## Social Features Implementation

### User Profiles & Authentication
```rust
// JWT-based authentication
pub struct AuthService {
    jwt_secret: String,
    user_repo: UserRepository,
}

// Social graph for friends
CREATE TABLE user_connections (
    user_id UUID REFERENCES users(id),
    friend_id UUID REFERENCES users(id),
    connection_type VARCHAR(20), -- 'friend', 'blocked', 'pending'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, friend_id)
);

// Game attendance tracking
CREATE TABLE game_attendees (
    game_id UUID REFERENCES sports_availability(id),
    user_id UUID REFERENCES users(id),
    status VARCHAR(20), -- 'confirmed', 'maybe', 'invited'
    invited_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Scalability Architecture

### Microservices with Service Mesh
```yaml
# Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: venue-service
spec:
  replicas: 10
  template:
    spec:
      containers:
      - name: venue-service
        image: finding-sports/venue-service:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "500m"
          limits:
            memory: "512Mi"
            cpu: "1000m"
---
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: venue-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: venue-service
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Caching Strategy
```rust
// Multi-level caching
pub struct CacheManager {
    l1_cache: Arc<DashMap<String, CachedItem>>, // In-memory
    l2_cache: RedisCache,                       // Redis
    l3_cache: PostgresCache,                    // Database
}

impl CacheManager {
    pub async fn get_with_fallback<T>(&self, key: &str) -> Option<T> {
        // Check L1 (memory)
        if let Some(item) = self.l1_cache.get(key) {
            return Some(item.value);
        }
        
        // Check L2 (Redis)
        if let Some(item) = self.l2_cache.get(key).await {
            self.l1_cache.insert(key.to_string(), item.clone());
            return Some(item);
        }
        
        // Check L3 (Database)
        if let Some(item) = self.l3_cache.get(key).await {
            self.l2_cache.set(key, &item, 300).await;
            self.l1_cache.insert(key.to_string(), item.clone());
            return Some(item);
        }
        
        None
    }
}
```

## API Design

### GraphQL Schema
```graphql
type Query {
  # Find venues near a location
  nearbyVenues(
    latitude: Float!
    longitude: Float!
    radiusKm: Float!
    sportTypes: [SportType!]
    timeRange: TimeRangeInput
  ): [Venue!]!
  
  # Get user's upcoming games
  myUpcomingGames: [Game!]!
  
  # Search for users
  searchUsers(query: String!): [User!]!
}

type Mutation {
  # Join a game
  joinGame(gameId: ID!): GameAttendance!
  
  # Create a new game
  createGame(input: CreateGameInput!): Game!
  
  # Add friend
  addFriend(userId: ID!): UserConnection!
}

type Subscription {
  # Real-time venue updates
  venueUpdates(latitude: Float!, longitude: Float!, radiusKm: Float!): VenueUpdate!
  
  # Game attendance changes
  gameUpdates(gameId: ID!): GameUpdate!
}

type Venue {
  id: ID!
  name: String!
  address: String!
  location: Location!
  amenities: [String!]!
  upcomingGames: [Game!]!
  distance: Float # Calculated based on user location
}

type Game {
  id: ID!
  venue: Venue!
  sportType: SportType!
  startTime: DateTime!
  endTime: DateTime!
  attendees: [User!]!
  maxAttendees: Int
  availableSpots: Int!
  gameType: GameType!
}
```

## Development Phases

### Phase 1: MVP (8 weeks)
**Week 1-2: Foundation**
- Set up Rust/Axum backend
- PostgreSQL + PostGIS database
- Basic authentication system
- CI/CD pipeline

**Week 3-4: Core Scraping**
- Implement 3 rec center scrapers
- Basic data normalization
- Redis caching layer
- Scheduled scraping jobs

**Week 5-6: API & Frontend**
- GraphQL API implementation
- React web app with map view
- Basic search functionality
- Mobile-responsive design

**Week 7-8: Testing & Launch**
- Integration testing
- Performance optimization
- Beta deployment
- User feedback collection

### Phase 2: Social Features (6 weeks)
- User profiles and authentication
- Friend system
- Game joining/organizing
- Real-time notifications
- Chat functionality

### Phase 3: Advanced Features (8 weeks)
- Machine learning for game recommendations
- Advanced filtering and preferences
- Payment integration for paid venues
- Reviews and ratings
- API for third-party developers

### Phase 4: Scale & Optimize (6 weeks)
- Kubernetes deployment
- Global CDN setup
- Advanced caching strategies
- Performance monitoring
- A/B testing framework

## Security Considerations

```rust
// Rate limiting per user/IP
pub struct RateLimiter {
    limits: HashMap<String, RateLimit>,
}

// API key management for scrapers
pub struct ApiKeyRotator {
    keys: Vec<ApiKey>,
    current_index: AtomicUsize,
}

// Data privacy
impl UserService {
    pub async fn get_user_profile(&self, requester_id: Uuid, target_id: Uuid) -> Result<UserProfile> {
        // Check privacy settings
        // Return filtered data based on relationship
    }
}
```

## Monitoring & Analytics

```yaml
# Prometheus metrics
- venue_scrape_duration_seconds
- api_request_duration_seconds
- cache_hit_ratio
- websocket_connections_active
- game_joins_per_hour

# Grafana dashboards
- Real-time user activity map
- Scraper health status
- API performance metrics
- Database query performance
```

## Cost Analysis

### Infrastructure Costs (Monthly)
- **Small (10K users)**: $1,500
  - 3x t3.medium instances
  - RDS PostgreSQL
  - ElastiCache Redis
  
- **Medium (100K users)**: $8,000
  - 10x c5.large instances
  - RDS Multi-AZ
  - ElastiCache cluster
  
- **Large (1M+ users)**: $40,000
  - 50x c5.xlarge instances
  - Aurora PostgreSQL
  - ElastiCache with replicas
  - CloudFront CDN

## Success Metrics

1. **User Engagement**
   - Daily active users
   - Games joined per user
   - Friend connections made

2. **Technical Performance**
   - API response time < 100ms
   - 99.9% uptime
   - Successful scrape rate > 95%

3. **Business Metrics**
   - User acquisition cost
   - Monthly recurring users
   - Geographic expansion rate

## Conclusion

This architecture provides a robust, scalable solution for the Finding Sports app that can handle millions of users while maintaining real-time performance. The use of Rust ensures excellent performance and low operational costs, while the MCP server architecture allows flexible integration with diverse data sources.

The phased approach allows for rapid MVP delivery while building toward a comprehensive platform that truly solves the problem of finding drop-in sports games.