const EventEmitter = require('events');
const crypto = require('crypto');
const { Worker } = require('worker_threads');
const path = require('path');

/**
 * Optimized Data Aggregation Service
 * 
 * Key Optimizations:
 * 1. Parallel data collection with worker threads
 * 2. Smart batch processing with rate limit awareness
 * 3. Multi-tier caching (memory + Redis + CDN-ready)
 * 4. Connection pooling and request pipelining
 * 5. Predictive prefetching based on usage patterns
 * 6. Circuit breaker pattern for failing sources
 * 7. Efficient data deduplication with bloom filters
 * 8. Stream-based processing for large datasets
 */
class OptimizedDataAggregator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      maxWorkers: options.maxWorkers || 4,
      maxConcurrentRequests: options.maxConcurrentRequests || 50,
      circuitBreakerThreshold: options.circuitBreakerThreshold || 5,
      circuitBreakerTimeout: options.circuitBreakerTimeout || 60000, // 1 minute
      bloomFilterSize: options.bloomFilterSize || 100000,
      bloomFilterHashFunctions: options.bloomFilterHashFunctions || 3,
      streamBatchSize: options.streamBatchSize || 100,
      prefetchWindow: options.prefetchWindow || 300000, // 5 minutes
      ...options
    };

    // Worker pool for parallel processing
    this.workerPool = [];
    this.workerQueue = [];
    this.activeWorkers = 0;

    // Circuit breakers for each source
    this.circuitBreakers = new Map();

    // Bloom filter for efficient deduplication
    this.bloomFilter = this.createBloomFilter();

    // Connection pools
    this.connectionPools = new Map();

    // Performance metrics
    this.metrics = {
      requests: new Map(),
      cacheHits: 0,
      cacheMisses: 0,
      deduplicationSaved: 0,
      workerUtilization: [],
      aggregationTime: []
    };

    // Initialize worker pool
    this.initializeWorkerPool();

    // Smart batch processor
    this.batchProcessor = new BatchProcessor(this.config);

    // Predictive prefetcher
    this.prefetcher = new PredictivePrefetcher(this.config);
  }

  /**
   * Initialize worker pool for parallel processing
   */
  initializeWorkerPool() {
    for (let i = 0; i < this.config.maxWorkers; i++) {
      const worker = new Worker(path.join(__dirname, 'aggregator-worker.js'), {
        workerData: {
          workerId: i,
          config: this.config
        }
      });

      worker.on('message', (result) => {
        this.handleWorkerResult(result);
      });

      worker.on('error', (error) => {
        console.error(`Worker ${i} error:`, error);
        this.recycleWorker(i);
      });

      this.workerPool.push({
        id: i,
        worker,
        busy: false,
        taskCount: 0
      });
    }
  }

  /**
   * Optimized data collection from all sources
   */
  async collectFromAllSources(options = {}) {
    const startTime = Date.now();
    const { sports = [], location = null, forceRefresh = false } = options;

    // Check multi-tier cache first
    if (!forceRefresh) {
      const cachedResult = await this.checkMultiTierCache(options);
      if (cachedResult) {
        this.metrics.cacheHits++;
        return cachedResult;
      }
      this.metrics.cacheMisses++;
    }

    // Get enabled sources with circuit breaker check
    const enabledSources = await this.getEnabledSources(sports, location);

    // Create optimized batches based on rate limits and priorities
    const batches = this.batchProcessor.createOptimizedBatches(enabledSources);

    // Process batches in parallel using worker pool
    const results = await this.processBatchesInParallel(batches);

    // Stream-based aggregation for efficiency
    const aggregatedData = await this.streamAggregateResults(results);

    // Store in multi-tier cache
    await this.storeInMultiTierCache(options, aggregatedData);

    // Schedule predictive prefetch
    this.prefetcher.schedulePrefetch(options, aggregatedData);

    // Update metrics
    this.metrics.aggregationTime.push({
      duration: Date.now() - startTime,
      sourceCount: enabledSources.length,
      resultCount: aggregatedData.games.length
    });

    return aggregatedData;
  }

  /**
   * Get enabled sources with circuit breaker check
   */
  async getEnabledSources(sports, location) {
    const sources = await this.getAllSources();
    
    return sources.filter(source => {
      // Check sport filter
      if (sports.length > 0 && !sports.includes(source.sport) && source.sport !== 'multiple') {
        return false;
      }

      // Check circuit breaker
      const breaker = this.getCircuitBreaker(source.siteId);
      if (breaker.isOpen()) {
        console.log(`Circuit breaker open for ${source.siteId}`);
        return false;
      }

      // Check location relevance if provided
      if (location && source.location) {
        const distance = this.calculateDistance(
          location.lat, location.lng,
          source.location.lat, source.location.lng
        );
        if (distance > (location.radius || 50) * 1000) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Process batches in parallel using worker pool
   */
  async processBatchesInParallel(batches) {
    const results = [];
    const batchPromises = [];

    for (const batch of batches) {
      const promise = this.processBatch(batch);
      batchPromises.push(promise);

      // Control concurrency
      if (batchPromises.length >= this.config.maxWorkers) {
        const batchResults = await Promise.race(batchPromises);
        results.push(...batchResults);
        
        const index = batchPromises.findIndex(p => p === batchResults);
        batchPromises.splice(index, 1);
      }
    }

    // Process remaining batches
    const remainingResults = await Promise.all(batchPromises);
    remainingResults.forEach(batchResult => results.push(...batchResult));

    return results;
  }

  /**
   * Process a single batch using worker thread
   */
  async processBatch(batch) {
    return new Promise((resolve, reject) => {
      const availableWorker = this.getAvailableWorker();
      
      if (!availableWorker) {
        // Queue if no workers available
        this.workerQueue.push({ batch, resolve, reject });
        return;
      }

      availableWorker.busy = true;
      availableWorker.taskCount++;
      this.activeWorkers++;

      availableWorker.worker.postMessage({
        type: 'PROCESS_BATCH',
        batch,
        timestamp: Date.now()
      });

      // Store resolver for when worker completes
      availableWorker.resolver = resolve;
      availableWorker.rejector = reject;
    });
  }

  /**
   * Handle worker result
   */
  handleWorkerResult(result) {
    const worker = this.workerPool.find(w => w.id === result.workerId);
    
    if (!worker) return;

    // Update circuit breaker based on results
    result.results.forEach(sourceResult => {
      const breaker = this.getCircuitBreaker(sourceResult.siteId);
      if (sourceResult.error) {
        breaker.recordFailure();
      } else {
        breaker.recordSuccess();
      }
    });

    // Resolve the promise
    if (worker.resolver) {
      worker.resolver(result.results);
      worker.resolver = null;
      worker.rejector = null;
    }

    // Mark worker as available
    worker.busy = false;
    this.activeWorkers--;

    // Update metrics
    this.updateWorkerMetrics();

    // Process queued work
    if (this.workerQueue.length > 0) {
      const queued = this.workerQueue.shift();
      this.processBatch(queued.batch)
        .then(queued.resolve)
        .catch(queued.reject);
    }
  }

  /**
   * Stream-based result aggregation
   */
  async streamAggregateResults(results) {
    const aggregated = {
      games: [],
      meta: {
        totalSources: 0,
        successfulSources: 0,
        totalGames: 0,
        deduplicatedGames: 0,
        processingTime: 0,
        timestamp: new Date().toISOString()
      }
    };

    const startTime = Date.now();
    const gameStream = new GameAggregationStream(this.bloomFilter);

    // Process results in streaming fashion
    for (const result of results) {
      aggregated.meta.totalSources++;
      
      if (result.success && result.data) {
        aggregated.meta.successfulSources++;
        
        // Stream games through deduplication
        for (const game of result.data) {
          const dedupedGame = await gameStream.process(game);
          if (dedupedGame) {
            aggregated.games.push(dedupedGame);
          } else {
            aggregated.meta.deduplicatedGames++;
            this.metrics.deduplicationSaved++;
          }
        }
      }
    }

    aggregated.meta.totalGames = aggregated.games.length;
    aggregated.meta.processingTime = Date.now() - startTime;

    // Sort games by start time
    aggregated.games.sort((a, b) => {
      const dateA = new Date(a.startTime || 0);
      const dateB = new Date(b.startTime || 0);
      return dateA - dateB;
    });

    return aggregated;
  }

  /**
   * Multi-tier cache check
   */
  async checkMultiTierCache(options) {
    const cacheKey = this.generateCacheKey(options);

    // L1: In-memory cache (fastest)
    const memoryCache = this.getMemoryCache();
    const l1Result = memoryCache.get(cacheKey);
    if (l1Result && !this.isCacheStale(l1Result)) {
      return l1Result.data;
    }

    // L2: Redis cache (fast)
    if (this.redisClient) {
      try {
        const l2Result = await this.redisClient.get(cacheKey);
        if (l2Result) {
          const parsed = JSON.parse(l2Result);
          if (!this.isCacheStale(parsed)) {
            // Promote to L1
            memoryCache.set(cacheKey, parsed);
            return parsed.data;
          }
        }
      } catch (error) {
        console.error('Redis cache error:', error);
      }
    }

    // L3: CDN cache headers will be set on response
    return null;
  }

  /**
   * Store in multi-tier cache
   */
  async storeInMultiTierCache(options, data) {
    const cacheKey = this.generateCacheKey(options);
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: this.calculateOptimalTTL(options, data)
    };

    // L1: Memory cache
    this.getMemoryCache().set(cacheKey, cacheEntry);

    // L2: Redis cache
    if (this.redisClient) {
      try {
        await this.redisClient.setex(
          cacheKey,
          cacheEntry.ttl,
          JSON.stringify(cacheEntry)
        );
      } catch (error) {
        console.error('Redis cache store error:', error);
      }
    }
  }

  /**
   * Get circuit breaker for source
   */
  getCircuitBreaker(sourceId) {
    if (!this.circuitBreakers.has(sourceId)) {
      this.circuitBreakers.set(sourceId, new CircuitBreaker({
        threshold: this.config.circuitBreakerThreshold,
        timeout: this.config.circuitBreakerTimeout
      }));
    }
    return this.circuitBreakers.get(sourceId);
  }

  /**
   * Create bloom filter for deduplication
   */
  createBloomFilter() {
    return new BloomFilter(
      this.config.bloomFilterSize,
      this.config.bloomFilterHashFunctions
    );
  }

  /**
   * Get available worker
   */
  getAvailableWorker() {
    return this.workerPool.find(w => !w.busy);
  }

  /**
   * Update worker utilization metrics
   */
  updateWorkerMetrics() {
    const utilization = (this.activeWorkers / this.workerPool.length) * 100;
    this.metrics.workerUtilization.push({
      utilization,
      timestamp: Date.now()
    });

    // Keep only last hour
    const oneHourAgo = Date.now() - 3600000;
    this.metrics.workerUtilization = this.metrics.workerUtilization
      .filter(m => m.timestamp > oneHourAgo);
  }

  /**
   * Generate cache key
   */
  generateCacheKey(options) {
    const parts = [
      'games',
      options.sports?.join('-') || 'all',
      options.location?.lat || 'any',
      options.location?.lng || 'any',
      options.location?.radius || '10',
      options.date || 'today',
      options.type || 'all'
    ];
    return parts.join(':');
  }

  /**
   * Calculate optimal TTL based on various factors
   */
  calculateOptimalTTL(options, data) {
    let ttl = 1800; // 30 minutes base

    // Adjust based on time of day
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) {
      ttl = 3600; // 1 hour during night
    } else if (hour >= 6 && hour < 9) {
      ttl = 900; // 15 minutes during morning rush
    } else if (hour >= 17 && hour < 20) {
      ttl = 600; // 10 minutes during evening rush
    }

    // Adjust based on data type
    if (options.type === 'drop-in') {
      ttl = Math.min(ttl, 900); // Max 15 minutes for drop-in
    } else if (options.type === 'league') {
      ttl = Math.min(ttl, 3600); // Max 1 hour for leagues
    }

    // Adjust based on result count
    if (data.games.length === 0) {
      ttl = 300; // 5 minutes for empty results
    }

    return ttl;
  }

  /**
   * Check if cache entry is stale
   */
  isCacheStale(entry) {
    if (!entry || !entry.timestamp) return true;
    
    const age = Date.now() - entry.timestamp;
    const ttlMs = (entry.ttl || 1800) * 1000;
    
    return age > ttlMs;
  }

  /**
   * Calculate distance between coordinates
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const avgAggregationTime = this.metrics.aggregationTime.length > 0
      ? this.metrics.aggregationTime.reduce((sum, m) => sum + m.duration, 0) / this.metrics.aggregationTime.length
      : 0;

    const avgWorkerUtilization = this.metrics.workerUtilization.length > 0
      ? this.metrics.workerUtilization.reduce((sum, m) => sum + m.utilization, 0) / this.metrics.workerUtilization.length
      : 0;

    return {
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      avgAggregationTime,
      avgWorkerUtilization,
      deduplicationSaved: this.metrics.deduplicationSaved,
      circuitBreakerStatus: Array.from(this.circuitBreakers.entries()).map(([sourceId, breaker]) => ({
        sourceId,
        state: breaker.getState(),
        failures: breaker.failures
      }))
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    // Terminate workers
    for (const worker of this.workerPool) {
      worker.worker.terminate();
    }

    // Close connection pools
    for (const pool of this.connectionPools.values()) {
      await pool.close();
    }

    // Clear caches
    this.getMemoryCache().clear();
  }

  /**
   * Get or create memory cache
   */
  getMemoryCache() {
    if (!this.memoryCache) {
      this.memoryCache = new LRUCache({
        max: 1000,
        ttl: 1800000 // 30 minutes
      });
    }
    return this.memoryCache;
  }

  /**
   * Placeholder for getting all sources
   */
  async getAllSources() {
    // This would integrate with the existing source management
    // For now, return empty array
    return [];
  }

  /**
   * Recycle a failed worker
   */
  recycleWorker(workerId) {
    const workerInfo = this.workerPool[workerId];
    if (!workerInfo) return;

    // Terminate old worker
    workerInfo.worker.terminate();

    // Create new worker
    const worker = new Worker(path.join(__dirname, 'aggregator-worker.js'), {
      workerData: {
        workerId,
        config: this.config
      }
    });

    worker.on('message', (result) => {
      this.handleWorkerResult(result);
    });

    worker.on('error', (error) => {
      console.error(`Worker ${workerId} error:`, error);
      setTimeout(() => this.recycleWorker(workerId), 5000);
    });

    workerInfo.worker = worker;
    workerInfo.busy = false;
    workerInfo.taskCount = 0;
  }
}

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
  constructor(options) {
    this.threshold = options.threshold;
    this.timeout = options.timeout;
    this.failures = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  recordSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  isOpen() {
    if (this.state === 'OPEN') {
      // Check if timeout has passed
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        return false; // Allow one request through
      }
      return true;
    }
    return false;
  }

  getState() {
    return this.state;
  }
}

/**
 * Batch Processor for optimal request batching
 */
class BatchProcessor {
  constructor(config) {
    this.config = config;
  }

  createOptimizedBatches(sources) {
    // Group by rate limit window
    const groups = new Map();
    
    sources.forEach(source => {
      const window = source.rateLimit?.window || '1h';
      if (!groups.has(window)) {
        groups.set(window, []);
      }
      groups.get(window).push(source);
    });

    // Create batches respecting rate limits
    const batches = [];
    
    for (const [window, groupSources] of groups) {
      const batchSize = this.calculateBatchSize(window, groupSources.length);
      
      for (let i = 0; i < groupSources.length; i += batchSize) {
        batches.push({
          sources: groupSources.slice(i, i + batchSize),
          priority: this.calculatePriority(groupSources[i]),
          window
        });
      }
    }

    // Sort by priority
    batches.sort((a, b) => b.priority - a.priority);

    return batches;
  }

  calculateBatchSize(window, sourceCount) {
    // Intelligent batch sizing based on rate limit window
    const windowMs = this.parseWindow(window);
    const requestsPerSecond = this.config.maxConcurrentRequests / (windowMs / 1000);
    
    return Math.max(1, Math.min(
      Math.floor(requestsPerSecond),
      Math.ceil(sourceCount / this.config.maxWorkers)
    ));
  }

  calculatePriority(source) {
    let priority = 0;
    
    if (source.reliability > 0.9) priority += 3;
    if (source.gameType === 'drop-in') priority += 2;
    if (source.sport === 'basketball' || source.sport === 'soccer') priority += 1;
    
    return priority;
  }

  parseWindow(window) {
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const match = window.match(/(\d+)([smhd])/);
    if (!match) return 3600000; // Default 1 hour
    return parseInt(match[1]) * units[match[2]];
  }
}

/**
 * Predictive Prefetcher
 */
class PredictivePrefetcher {
  constructor(config) {
    this.config = config;
    this.patterns = new Map();
  }

  schedulePrefetch(options, data) {
    // Analyze access pattern
    const key = this.generatePatternKey(options);
    
    if (!this.patterns.has(key)) {
      this.patterns.set(key, {
        accesses: [],
        predictions: []
      });
    }

    const pattern = this.patterns.get(key);
    pattern.accesses.push({
      timestamp: Date.now(),
      resultCount: data.games.length
    });

    // Keep only last 24 hours
    const oneDayAgo = Date.now() - 86400000;
    pattern.accesses = pattern.accesses.filter(a => a.timestamp > oneDayAgo);

    // Predict next access
    if (pattern.accesses.length >= 3) {
      const prediction = this.predictNextAccess(pattern.accesses);
      
      if (prediction && prediction.timestamp > Date.now()) {
        // Schedule prefetch
        const delay = prediction.timestamp - Date.now() - this.config.prefetchWindow;
        
        if (delay > 0) {
          setTimeout(() => {
            this.emit('prefetch', { options, prediction });
          }, delay);
        }
      }
    }
  }

  predictNextAccess(accesses) {
    if (accesses.length < 3) return null;

    // Calculate intervals
    const intervals = [];
    for (let i = 1; i < accesses.length; i++) {
      intervals.push(accesses[i].timestamp - accesses[i - 1].timestamp);
    }

    // Simple prediction: average interval
    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const lastAccess = accesses[accesses.length - 1];

    return {
      timestamp: lastAccess.timestamp + avgInterval,
      confidence: this.calculateConfidence(intervals)
    };
  }

  calculateConfidence(intervals) {
    if (intervals.length < 2) return 0;

    // Calculate standard deviation
    const avg = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avg, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Lower std dev = higher confidence
    return Math.max(0, 1 - (stdDev / avg));
  }

  generatePatternKey(options) {
    return [
      options.sports?.join('-') || 'all',
      options.type || 'all',
      new Date().getHours() // Hour of day
    ].join(':');
  }
}

/**
 * Stream processor for game aggregation
 */
class GameAggregationStream {
  constructor(bloomFilter) {
    this.bloomFilter = bloomFilter;
    this.seen = new Set();
  }

  async process(game) {
    // Generate unique key for game
    const key = this.generateGameKey(game);

    // Check bloom filter first (fast)
    if (this.bloomFilter.test(key)) {
      // Possible duplicate, check exact match
      if (this.seen.has(key)) {
        return null; // Duplicate
      }
    }

    // Add to bloom filter and exact set
    this.bloomFilter.add(key);
    this.seen.add(key);

    // Normalize game data
    return this.normalizeGame(game);
  }

  generateGameKey(game) {
    const parts = [
      game.venue?.name || game.venue || '',
      game.sport || '',
      new Date(game.startTime || 0).toISOString(),
      game.title || ''
    ];
    return parts.join('|').toLowerCase();
  }

  normalizeGame(game) {
    return {
      ...game,
      id: game.id || crypto.randomUUID(),
      startTime: this.normalizeDate(game.startTime),
      venue: this.normalizeVenue(game.venue),
      sport: (game.sport || 'unknown').toLowerCase(),
      type: game.type || game.gameType || 'general',
      lastUpdated: new Date().toISOString()
    };
  }

  normalizeDate(date) {
    if (!date) return null;
    
    try {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed.toISOString();
    } catch {
      return null;
    }
  }

  normalizeVenue(venue) {
    if (typeof venue === 'string') {
      return { name: venue };
    }
    return venue || { name: 'Unknown' };
  }
}

/**
 * Simple Bloom Filter implementation
 */
class BloomFilter {
  constructor(size, hashFunctions) {
    this.size = size;
    this.hashFunctions = hashFunctions;
    this.bits = new Uint8Array(Math.ceil(size / 8));
  }

  add(key) {
    for (let i = 0; i < this.hashFunctions; i++) {
      const hash = this.hash(key, i) % this.size;
      const byte = Math.floor(hash / 8);
      const bit = hash % 8;
      this.bits[byte] |= (1 << bit);
    }
  }

  test(key) {
    for (let i = 0; i < this.hashFunctions; i++) {
      const hash = this.hash(key, i) % this.size;
      const byte = Math.floor(hash / 8);
      const bit = hash % 8;
      if (!(this.bits[byte] & (1 << bit))) {
        return false;
      }
    }
    return true;
  }

  hash(key, seed) {
    let hash = seed;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Simple LRU Cache implementation
 */
class LRUCache {
  constructor(options) {
    this.max = options.max;
    this.ttl = options.ttl;
    this.cache = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry;
  }

  set(key, value) {
    // Delete if exists to update position
    this.cache.delete(key);

    // Add to end
    this.cache.set(key, {
      ...value,
      timestamp: value.timestamp || Date.now()
    });

    // Evict oldest if over limit
    if (this.cache.size > this.max) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clear() {
    this.cache.clear();
  }
}

// Export singleton instance
let instance;

module.exports = {
  getInstance: (options) => {
    if (!instance) {
      instance = new OptimizedDataAggregator(options);
    }
    return instance;
  },
  OptimizedDataAggregator
};