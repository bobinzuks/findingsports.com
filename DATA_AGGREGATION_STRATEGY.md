# Finding Sports - Data Aggregation & MCP Integration Strategy

## Overview

The core challenge of Finding Sports is aggregating dispersed information from hundreds of recreation center websites, social media platforms, and email notifications into a unified, real-time database. This document outlines our comprehensive data aggregation strategy using MCP servers.

## MCP Server Architecture

### 1. Web Scraper MCP Servers

```yaml
# mcp-config.yaml
servers:
  vancouver_rec_scraper:
    command: "npx @finding-sports/vancouver-scraper"
    args: ["--mode", "mcp"]
    env:
      RATE_LIMIT: "10/minute"
      CACHE_TTL: "300"
    endpoints:
      - scrape_schedule
      - get_venue_details
      - monitor_changes

  burnaby_rec_scraper:
    command: "npx @finding-sports/burnaby-scraper"
    args: ["--mode", "mcp"]
    env:
      RATE_LIMIT: "10/minute"
    
  generic_rec_scraper:
    command: "npx @finding-sports/generic-scraper"
    args: ["--mode", "mcp"]
    capabilities:
      - auto_detect_schedule_tables
      - extract_drop_in_times
      - parse_amenities
```

### 2. Social Media Integration MCP

```typescript
// Facebook Events MCP Server
interface FacebookEventsMCP {
  // Search for sports events in a geographic area
  searchSportsEvents(params: {
    latitude: number;
    longitude: number;
    radius: number;
    sportTypes: string[];
    timeRange: DateRange;
  }): Promise<FacebookEvent[]>;

  // Monitor group posts for drop-in game announcements
  monitorSportsGroups(groupIds: string[]): AsyncIterator<GroupPost>;

  // Extract game details from posts using NLP
  extractGameDetails(post: GroupPost): Promise<GameDetails>;
}

// Implementation
export class FacebookMCPServer implements MCPServer {
  async searchSportsEvents(params) {
    const events = await this.graphAPI.get('/search', {
      type: 'event',
      q: params.sportTypes.join(' OR '),
      center: `${params.latitude},${params.longitude}`,
      distance: params.radius,
    });
    
    return this.filterAndNormalize(events);
  }
}
```

### 3. Email Parser MCP

```python
# Email parsing MCP for game notifications
class EmailParserMCP:
    def __init__(self):
        self.parsers = {
            'recreation_center': RecCenterEmailParser(),
            'sports_league': LeagueEmailParser(),
            'meetup': MeetupEmailParser()
        }
    
    async def parse_sports_email(self, email_content: str) -> dict:
        # Detect email type
        email_type = self.detect_email_type(email_content)
        parser = self.parsers.get(email_type)
        
        if parser:
            return await parser.extract_game_info(email_content)
        
        # Fallback to AI parsing
        return await self.ai_parse(email_content)
    
    async def ai_parse(self, content: str) -> dict:
        prompt = """Extract sports game information:
        - Sport type
        - Date and time
        - Location/venue
        - Drop-in availability
        - Cost
        - Contact info
        """
        return await self.llm.extract(prompt, content)
```

## Data Normalization Pipeline

### Unified Data Model

```rust
// Core data structures for normalized venue data
#[derive(Serialize, Deserialize, Clone)]
pub struct NormalizedVenue {
    pub id: Uuid,
    pub name: String,
    pub address: Address,
    pub location: Point,
    pub source: DataSource,
    pub amenities: Vec<Amenity>,
    pub contact: ContactInfo,
    pub last_updated: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct NormalizedGame {
    pub id: Uuid,
    pub venue_id: Uuid,
    pub sport_type: SportType,
    pub game_type: GameType, // drop-in, league, organized
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub recurrence: Option<RecurrenceRule>,
    pub availability: AvailabilityStatus,
    pub source_url: String,
    pub metadata: HashMap<String, Value>,
}

// Data source tracking for deduplication
#[derive(Serialize, Deserialize, Clone)]
pub struct DataSource {
    pub source_type: SourceType, // website, facebook, email, api
    pub source_id: String,
    pub confidence: f32,
    pub last_scraped: DateTime<Utc>,
}
```

### Deduplication Strategy

```rust
pub struct VenueDeduplicator {
    similarity_threshold: f32,
}

impl VenueDeduplicator {
    pub async fn deduplicate(&self, venues: Vec<RawVenue>) -> Vec<NormalizedVenue> {
        let mut unique_venues = Vec::new();
        let mut venue_clusters: HashMap<Uuid, Vec<RawVenue>> = HashMap::new();
        
        for venue in venues {
            let matched = self.find_similar_venue(&venue, &unique_venues).await;
            
            match matched {
                Some(existing_id) => {
                    // Merge venue data
                    venue_clusters.entry(existing_id)
                        .or_insert_with(Vec::new)
                        .push(venue);
                }
                None => {
                    // New unique venue
                    let id = Uuid::new_v4();
                    unique_venues.push(self.normalize_venue(venue, id));
                }
            }
        }
        
        // Merge clustered venues
        for (id, cluster) in venue_clusters {
            if let Some(venue) = unique_venues.iter_mut().find(|v| v.id == id) {
                self.merge_venue_data(venue, cluster);
            }
        }
        
        unique_venues
    }
    
    async fn find_similar_venue(&self, venue: &RawVenue, existing: &[NormalizedVenue]) -> Option<Uuid> {
        for existing_venue in existing {
            let similarity = self.calculate_similarity(venue, existing_venue).await;
            
            if similarity > self.similarity_threshold {
                return Some(existing_venue.id);
            }
        }
        None
    }
    
    async fn calculate_similarity(&self, v1: &RawVenue, v2: &NormalizedVenue) -> f32 {
        let mut score = 0.0;
        
        // Name similarity (40% weight)
        score += 0.4 * self.string_similarity(&v1.name, &v2.name);
        
        // Location proximity (40% weight)
        let distance = self.calculate_distance(&v1.location, &v2.location);
        score += 0.4 * (1.0 - (distance / 1000.0).min(1.0)); // Within 1km
        
        // Address similarity (20% weight)
        score += 0.2 * self.string_similarity(&v1.address, &v2.address.full);
        
        score
    }
}
```

## Scraping Strategies

### 1. Recreation Center Websites

```rust
// Intelligent scraper for rec center websites
pub struct RecCenterScraper {
    browser: Browser,
    patterns: Vec<SchedulePattern>,
}

impl RecCenterScraper {
    pub async fn scrape_schedule(&self, url: &str) -> Result<Vec<GameSchedule>> {
        let page = self.browser.new_page().await?;
        page.goto(url).await?;
        
        // Try multiple strategies
        let schedules = tokio::select! {
            result = self.scrape_table_format(&page) => result,
            result = self.scrape_calendar_format(&page) => result,
            result = self.scrape_pdf_schedule(&page) => result,
            result = self.ai_assisted_scrape(&page) => result,
        };
        
        Ok(schedules?)
    }
    
    async fn scrape_table_format(&self, page: &Page) -> Result<Vec<GameSchedule>> {
        // Look for common table patterns
        let tables = page.query_selector_all("table").await?;
        
        for table in tables {
            if self.is_schedule_table(&table).await? {
                return self.parse_schedule_table(&table).await;
            }
        }
        
        Err(Error::NoScheduleFound)
    }
    
    async fn ai_assisted_scrape(&self, page: &Page) -> Result<Vec<GameSchedule>> {
        // Use AI to understand page structure
        let html = page.content().await?;
        let prompt = "Extract drop-in sports schedule from this HTML. Look for times, sports types, and locations.";
        
        let extracted = self.llm.extract_structured(prompt, &html).await?;
        Ok(self.parse_ai_output(extracted))
    }
}
```

### 2. Dynamic Content Handling

```typescript
// Handle JavaScript-rendered content
export class DynamicContentScraper {
  private browser: Browser;
  
  async scrapeReactApp(url: string): Promise<Schedule[]> {
    const page = await this.browser.newPage();
    
    // Wait for React to render
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Intercept API calls
    const apiData = await this.interceptApiCalls(page);
    
    if (apiData.length > 0) {
      // Parse API responses directly
      return this.parseApiData(apiData);
    }
    
    // Fallback to DOM scraping
    await page.waitForSelector('[data-schedule]', { timeout: 30000 });
    return this.scrapeDom(page);
  }
  
  private async interceptApiCalls(page: Page): Promise<any[]> {
    const responses: any[] = [];
    
    page.on('response', async (response) => {
      if (response.url().includes('schedule') || 
          response.url().includes('calendar')) {
        try {
          const data = await response.json();
          responses.push(data);
        } catch (e) {
          // Not JSON
        }
      }
    });
    
    // Wait for API calls to complete
    await page.waitForTimeout(5000);
    return responses;
  }
}
```

### 3. PDF Schedule Extraction

```python
# Extract schedules from PDF documents
class PDFScheduleExtractor:
    def __init__(self):
        self.table_extractor = camelot.read_pdf
        self.text_parser = ScheduleTextParser()
    
    async def extract_from_pdf(self, pdf_url: str) -> List[GameSchedule]:
        # Download PDF
        pdf_content = await self.download_pdf(pdf_url)
        
        # Try table extraction first
        try:
            tables = self.table_extractor(pdf_content, pages='all')
            schedules = []
            
            for table in tables:
                if self.is_schedule_table(table.df):
                    schedules.extend(self.parse_schedule_table(table.df))
            
            if schedules:
                return schedules
        except:
            pass
        
        # Fallback to text extraction
        text = self.extract_text(pdf_content)
        return self.text_parser.parse_schedule_text(text)
```

## Real-Time Data Synchronization

### Change Detection System

```rust
// Monitor websites for schedule changes
pub struct ChangeMonitor {
    scrapers: Vec<Box<dyn Scraper>>,
    change_detector: ChangeDetector,
    notification_service: NotificationService,
}

impl ChangeMonitor {
    pub async fn monitor_continuously(&self) {
        loop {
            for scraper in &self.scrapers {
                if let Ok(current_data) = scraper.scrape().await {
                    let changes = self.change_detector
                        .detect_changes(&scraper.source_id(), current_data)
                        .await;
                    
                    if !changes.is_empty() {
                        self.process_changes(changes).await;
                    }
                }
            }
            
            // Adaptive scheduling based on change frequency
            let delay = self.calculate_optimal_delay().await;
            tokio::time::sleep(delay).await;
        }
    }
    
    async fn process_changes(&self, changes: Vec<DataChange>) {
        for change in changes {
            match change.change_type {
                ChangeType::NewGame => {
                    // Notify users interested in this sport/location
                    self.notification_service.notify_new_game(&change).await;
                }
                ChangeType::Cancellation => {
                    // Notify attendees
                    self.notification_service.notify_cancellation(&change).await;
                }
                ChangeType::TimeChange => {
                    // Update and notify
                    self.notification_service.notify_time_change(&change).await;
                }
            }
        }
    }
}
```

### Incremental Updates

```rust
// Efficient incremental updates
pub struct IncrementalUpdater {
    last_update_times: HashMap<String, DateTime<Utc>>,
}

impl IncrementalUpdater {
    pub async fn update_source(&mut self, source_id: &str) -> Result<UpdateResult> {
        let last_update = self.last_update_times.get(source_id)
            .copied()
            .unwrap_or_else(|| Utc::now() - Duration::days(7));
        
        // Many sites support "modified since" queries
        let updates = match source_id {
            id if id.starts_with("vancouver_") => {
                self.scrape_with_timestamp_filter(id, last_update).await?
            }
            _ => {
                // Full scrape with comparison
                self.scrape_and_compare(source_id, last_update).await?
            }
        };
        
        self.last_update_times.insert(source_id.to_string(), Utc::now());
        
        Ok(UpdateResult {
            new_items: updates.new_count,
            updated_items: updates.updated_count,
            deleted_items: updates.deleted_count,
        })
    }
}
```

## Error Handling & Resilience

### Fault-Tolerant Scraping

```rust
#[derive(Clone)]
pub struct ResilientScraper {
    retry_policy: RetryPolicy,
    fallback_strategies: Vec<Box<dyn ScrapingStrategy>>,
}

impl ResilientScraper {
    pub async fn scrape_with_fallback(&self, source: &DataSource) -> Result<ScrapedData> {
        // Try primary strategy with retries
        let primary_result = self.retry_policy
            .retry_async(|| self.primary_scrape(source))
            .await;
        
        match primary_result {
            Ok(data) => Ok(data),
            Err(e) => {
                log::warn!("Primary scraping failed: {}", e);
                
                // Try fallback strategies
                for strategy in &self.fallback_strategies {
                    if let Ok(data) = strategy.scrape(source).await {
                        return Ok(data);
                    }
                }
                
                // Last resort: cached data
                self.get_cached_data(source).await
            }
        }
    }
}

// Circuit breaker for failing sources
pub struct CircuitBreaker {
    failure_threshold: u32,
    recovery_timeout: Duration,
    source_states: DashMap<String, SourceState>,
}

impl CircuitBreaker {
    pub async fn call<F, T>(&self, source_id: &str, f: F) -> Result<T>
    where
        F: Future<Output = Result<T>>,
    {
        let state = self.source_states.entry(source_id.to_string())
            .or_insert(SourceState::Closed);
        
        match state {
            SourceState::Open(until) => {
                if Utc::now() > *until {
                    *state = SourceState::HalfOpen;
                } else {
                    return Err(Error::CircuitOpen);
                }
            }
            SourceState::HalfOpen => {
                // Test with single request
                match f.await {
                    Ok(result) => {
                        *state = SourceState::Closed;
                        return Ok(result);
                    }
                    Err(e) => {
                        *state = SourceState::Open(Utc::now() + self.recovery_timeout);
                        return Err(e);
                    }
                }
            }
            SourceState::Closed => {
                // Normal operation
                match f.await {
                    Ok(result) => Ok(result),
                    Err(e) => {
                        self.record_failure(source_id).await;
                        Err(e)
                    }
                }
            }
        }
    }
}
```

## Performance Optimization

### Parallel Processing

```rust
// Parallel scraping with controlled concurrency
pub struct ParallelScraperPool {
    max_concurrent: usize,
    scrapers: Vec<Arc<dyn Scraper + Send + Sync>>,
}

impl ParallelScraperPool {
    pub async fn scrape_all(&self) -> Vec<Result<ScrapedData>> {
        let semaphore = Arc::new(Semaphore::new(self.max_concurrent));
        let mut tasks = Vec::new();
        
        for scraper in &self.scrapers {
            let scraper = Arc::clone(scraper);
            let permit = semaphore.clone();
            
            let task = tokio::spawn(async move {
                let _permit = permit.acquire().await.unwrap();
                scraper.scrape().await
            });
            
            tasks.push(task);
        }
        
        futures::future::join_all(tasks)
            .await
            .into_iter()
            .map(|r| r.unwrap())
            .collect()
    }
}
```

### Intelligent Caching

```rust
// Smart caching based on data volatility
pub struct AdaptiveCache {
    cache: Arc<DashMap<String, CachedItem>>,
    volatility_tracker: VolatilityTracker,
}

impl AdaptiveCache {
    pub async fn get_or_fetch<F, T>(&self, key: &str, fetcher: F) -> Result<T>
    where
        F: Future<Output = Result<T>>,
        T: Clone + Serialize + DeserializeOwned,
    {
        // Check cache with adaptive TTL
        if let Some(cached) = self.cache.get(key) {
            let ttl = self.calculate_ttl(key).await;
            
            if cached.timestamp + ttl > Utc::now() {
                return Ok(cached.data.clone());
            }
        }
        
        // Fetch fresh data
        let data = fetcher.await?;
        
        // Update volatility metrics
        self.volatility_tracker.record_update(key).await;
        
        // Cache with adaptive TTL
        self.cache.insert(key.to_string(), CachedItem {
            data: data.clone(),
            timestamp: Utc::now(),
        });
        
        Ok(data)
    }
    
    async fn calculate_ttl(&self, key: &str) -> Duration {
        let volatility = self.volatility_tracker.get_volatility(key).await;
        
        match volatility {
            v if v < 0.1 => Duration::hours(24),  // Very stable
            v if v < 0.3 => Duration::hours(6),   // Stable
            v if v < 0.6 => Duration::hours(1),   // Moderate
            _ => Duration::minutes(15),           // Highly volatile
        }
    }
}
```

## Monitoring & Analytics

```yaml
# Grafana dashboard for data aggregation
dashboards:
  scraping_health:
    panels:
      - title: "Scraping Success Rate"
        query: "rate(scraper_success_total[5m]) / rate(scraper_attempts_total[5m])"
      
      - title: "Data Freshness"
        query: "time() - max(last_successful_scrape) by (source)"
      
      - title: "Deduplication Efficiency"
        query: "sum(deduplicated_venues) / sum(raw_venues)"
      
      - title: "API Rate Limits"
        query: "rate_limit_remaining{api=~'facebook|google'}"

alerts:
  - name: "Scraper Failure"
    condition: "scraper_success_rate < 0.8"
    severity: "warning"
    
  - name: "Stale Data"
    condition: "time() - last_successful_scrape > 3600"
    severity: "critical"
```

## Conclusion

This comprehensive data aggregation strategy ensures Finding Sports can reliably collect, normalize, and maintain accurate venue and game information from hundreds of diverse sources. The MCP server architecture provides flexibility for adding new data sources, while the robust error handling and monitoring ensure high availability and data quality.