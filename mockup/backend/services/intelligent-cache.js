const EventEmitter = require('events');
const crypto = require('crypto');

/**
 * Intelligent Caching Service
 * Provides smart caching with predictive pre-fetching, automatic invalidation,
 * and daily update triggers
 */
class IntelligentCache extends EventEmitter {
    constructor(redisClient = null) {
        super();
        
        // Use in-memory cache if Redis not available
        this.redis = redisClient;
        this.memoryCache = new Map();
        this.metadata = new Map();
        
        // Cache statistics
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            prefetches: 0,
            dailyRefreshes: 0,
            avgHitRate: 0
        };
        
        // Configuration
        this.config = {
            defaultTTL: 3600, // 1 hour in seconds
            maxMemorySize: 1000, // Max items in memory cache
            prefetchThreshold: 0.8, // Prefetch when 80% through TTL
            dailyRefreshHour: 3, // 3 AM local time
            enablePredictiveCaching: true,
            enableAutoEviction: true
        };
        
        // Track access patterns
        this.accessPatterns = new Map();
        this.popularKeys = new Map();
        
        // Start background jobs
        this.startBackgroundJobs();
    }

    /**
     * Get value from cache with intelligent handling
     */
    async get(key, options = {}) {
        const {
            forceFresh = false,
            includeMeta = false,
            trackAccess = true
        } = options;
        
        // Track access pattern
        if (trackAccess) {
            this.trackAccess(key);
        }
        
        // Check if it's the first request of the day
        if (this.isFirstDailyRequest(key)) {
            this.stats.dailyRefreshes++;
            this.emit('daily:refresh', { key });
            return null; // Force refresh
        }
        
        // Force fresh if requested
        if (forceFresh) {
            this.stats.misses++;
            return null;
        }
        
        // Try to get from cache
        let cached = await this.getFromCache(key);
        
        if (!cached) {
            this.stats.misses++;
            return null;
        }
        
        // Check if stale
        if (this.isStale(cached, options)) {
            this.stats.misses++;
            
            // Trigger prefetch if close to expiry
            if (this.shouldPrefetch(cached)) {
                this.emit('prefetch:needed', { key, ttl: cached.ttl });
                this.stats.prefetches++;
            }
            
            return null;
        }
        
        this.stats.hits++;
        this.updateHitRate();
        
        // Schedule predictive prefetch if needed
        if (this.config.enablePredictiveCaching) {
            this.schedulePredictivePrefetch(key, cached);
        }
        
        return includeMeta ? cached : cached.value;
    }

    /**
     * Set value in cache with intelligent TTL
     */
    async set(key, value, options = {}) {
        const {
            ttl = this.config.defaultTTL,
            priority = 'normal',
            tags = [],
            source = 'unknown'
        } = options;
        
        // Calculate intelligent TTL
        const intelligentTTL = this.calculateIntelligentTTL(key, value, options);
        
        const cacheEntry = {
            value,
            timestamp: Date.now(),
            ttl: intelligentTTL,
            expiresAt: Date.now() + (intelligentTTL * 1000),
            priority,
            tags,
            source,
            accessCount: 0,
            lastAccessed: Date.now(),
            size: this.estimateSize(value)
        };
        
        // Store metadata separately
        this.metadata.set(key, {
            created: Date.now(),
            dailyRefreshTime: this.getNextDailyRefresh(),
            accessPattern: this.accessPatterns.get(key) || { count: 0, times: [] },
            reliability: options.reliability || 0.8
        });
        
        // Store in cache
        await this.setInCache(key, cacheEntry);
        
        // Evict if needed
        if (this.config.enableAutoEviction && this.memoryCache.size > this.config.maxMemorySize) {
            await this.evictLRU();
        }
        
        this.emit('cache:set', { key, ttl: intelligentTTL, size: cacheEntry.size });
        
        return true;
    }

    /**
     * Calculate intelligent TTL based on various factors
     */
    calculateIntelligentTTL(key, value, options) {
        let ttl = options.ttl || this.config.defaultTTL;
        
        // Factor 1: Source reliability
        if (options.reliability) {
            ttl = ttl * options.reliability;
        }
        
        // Factor 2: Data type
        if (options.dataType) {
            const dataTypeFactors = {
                'live-scores': 60, // 1 minute for live data
                'drop-in': 1800, // 30 minutes for drop-in games
                'league': 7200, // 2 hours for league games
                'venue': 86400, // 24 hours for venue info
                'static': 604800 // 1 week for static data
            };
            
            if (dataTypeFactors[options.dataType]) {
                ttl = dataTypeFactors[options.dataType];
            }
        }
        
        // Factor 3: Time of day
        const hour = new Date().getHours();
        if (hour >= 6 && hour <= 22) {
            // Active hours - shorter TTL
            ttl = ttl * 0.8;
        } else {
            // Night hours - longer TTL
            ttl = ttl * 1.5;
        }
        
        // Factor 4: Access frequency
        const accessPattern = this.accessPatterns.get(key);
        if (accessPattern && accessPattern.count > 10) {
            // Popular items get shorter TTL for freshness
            ttl = ttl * 0.7;
        }
        
        // Factor 5: Day of week
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            // Weekends - more activity, shorter TTL
            ttl = ttl * 0.9;
        }
        
        // Ensure reasonable bounds
        ttl = Math.max(60, Math.min(86400, Math.round(ttl)));
        
        return ttl;
    }

    /**
     * Check if cached data is stale
     */
    isStale(cached, options = {}) {
        const now = Date.now();
        
        // Check expiry
        if (cached.expiresAt && now > cached.expiresAt) {
            return true;
        }
        
        // Check daily refresh
        const meta = this.metadata.get(cached.key);
        if (meta && meta.dailyRefreshTime && now > meta.dailyRefreshTime) {
            return true;
        }
        
        // Check custom staleness rules
        if (options.maxAge) {
            const age = now - cached.timestamp;
            if (age > options.maxAge * 1000) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if this is the first request of the day
     */
    isFirstDailyRequest(key) {
        const meta = this.metadata.get(key);
        if (!meta) return false;
        
        const now = new Date();
        const lastRefresh = new Date(meta.dailyRefreshTime);
        
        return now > lastRefresh;
    }

    /**
     * Get next daily refresh time
     */
    getNextDailyRefresh() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(this.config.dailyRefreshHour, 0, 0, 0);
        
        return tomorrow.getTime();
    }

    /**
     * Check if should prefetch
     */
    shouldPrefetch(cached) {
        if (!cached.expiresAt) return false;
        
        const now = Date.now();
        const timeLeft = cached.expiresAt - now;
        const totalTTL = cached.ttl * 1000;
        const percentLeft = timeLeft / totalTTL;
        
        return percentLeft < (1 - this.config.prefetchThreshold);
    }

    /**
     * Schedule predictive prefetch based on access patterns
     */
    schedulePredictivePrefetch(key, cached) {
        const pattern = this.accessPatterns.get(key);
        if (!pattern || pattern.times.length < 5) return;
        
        // Analyze access times to predict next access
        const intervals = [];
        for (let i = 1; i < pattern.times.length; i++) {
            intervals.push(pattern.times[i] - pattern.times[i-1]);
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const lastAccess = pattern.times[pattern.times.length - 1];
        const predictedNextAccess = lastAccess + avgInterval;
        
        // Schedule prefetch slightly before predicted access
        const prefetchTime = predictedNextAccess - 60000; // 1 minute before
        
        if (prefetchTime > Date.now()) {
            setTimeout(() => {
                this.emit('predictive:prefetch', { key, predictedTime: predictedNextAccess });
            }, prefetchTime - Date.now());
        }
    }

    /**
     * Track access patterns for predictive caching
     */
    trackAccess(key) {
        const now = Date.now();
        
        if (!this.accessPatterns.has(key)) {
            this.accessPatterns.set(key, {
                count: 0,
                times: [],
                avgInterval: 0
            });
        }
        
        const pattern = this.accessPatterns.get(key);
        pattern.count++;
        pattern.times.push(now);
        
        // Keep only last 20 access times
        if (pattern.times.length > 20) {
            pattern.times.shift();
        }
        
        // Update popular keys
        this.popularKeys.set(key, pattern.count);
        
        // Update cache entry if exists
        const cached = this.memoryCache.get(key);
        if (cached) {
            cached.accessCount++;
            cached.lastAccessed = now;
        }
    }

    /**
     * Invalidate cache entries by pattern or tags
     */
    async invalidate(options = {}) {
        const { pattern, tags, olderThan } = options;
        let invalidated = 0;
        
        if (pattern) {
            // Invalidate by key pattern
            const regex = new RegExp(pattern);
            for (const [key, entry] of this.memoryCache.entries()) {
                if (regex.test(key)) {
                    await this.delete(key);
                    invalidated++;
                }
            }
        }
        
        if (tags && tags.length > 0) {
            // Invalidate by tags
            for (const [key, entry] of this.memoryCache.entries()) {
                if (entry.tags && tags.some(tag => entry.tags.includes(tag))) {
                    await this.delete(key);
                    invalidated++;
                }
            }
        }
        
        if (olderThan) {
            // Invalidate entries older than specified time
            const cutoff = Date.now() - olderThan;
            for (const [key, entry] of this.memoryCache.entries()) {
                if (entry.timestamp < cutoff) {
                    await this.delete(key);
                    invalidated++;
                }
            }
        }
        
        this.emit('cache:invalidated', { count: invalidated, options });
        return invalidated;
    }

    /**
     * Delete specific key
     */
    async delete(key) {
        if (this.redis) {
            await this.redis.del(key);
        }
        
        this.memoryCache.delete(key);
        this.metadata.delete(key);
        this.accessPatterns.delete(key);
        this.popularKeys.delete(key);
        
        return true;
    }

    /**
     * Clear entire cache
     */
    async clear() {
        if (this.redis) {
            await this.redis.flushall();
        }
        
        this.memoryCache.clear();
        this.metadata.clear();
        this.accessPatterns.clear();
        this.popularKeys.clear();
        
        this.emit('cache:cleared');
        return true;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const memoryUsage = Array.from(this.memoryCache.values())
            .reduce((total, entry) => total + (entry.size || 0), 0);
        
        const popularItems = Array.from(this.popularKeys.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([key, count]) => ({ key, accessCount: count }));
        
        return {
            ...this.stats,
            currentSize: this.memoryCache.size,
            memoryUsage,
            popularItems,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
            avgTTL: this.calculateAvgTTL(),
            oldestEntry: this.getOldestEntry(),
            newestEntry: this.getNewestEntry()
        };
    }

    /**
     * Warm up cache with predicted popular items
     */
    async warmUp(items) {
        console.log(`🔥 Warming up cache with ${items.length} items`);
        
        const warmed = [];
        for (const item of items) {
            const { key, fetcher, options } = item;
            
            try {
                const value = await fetcher();
                await this.set(key, value, options);
                warmed.push(key);
            } catch (error) {
                console.error(`Failed to warm ${key}:`, error);
            }
        }
        
        this.emit('cache:warmed', { count: warmed.length, keys: warmed });
        return warmed;
    }

    /**
     * Background jobs
     */
    startBackgroundJobs() {
        // Cleanup job - every hour
        setInterval(() => {
            this.cleanup();
        }, 3600000);
        
        // Stats calculation - every 5 minutes
        setInterval(() => {
            this.updateHitRate();
        }, 300000);
        
        // Predictive analysis - every 15 minutes
        setInterval(() => {
            this.analyzePredictivePatterns();
        }, 900000);
    }

    /**
     * Cleanup expired entries
     */
    async cleanup() {
        let cleaned = 0;
        const now = Date.now();
        
        for (const [key, entry] of this.memoryCache.entries()) {
            if (entry.expiresAt && entry.expiresAt < now) {
                await this.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            this.emit('cache:cleanup', { cleaned });
        }
    }

    /**
     * Evict least recently used items
     */
    async evictLRU() {
        const entries = Array.from(this.memoryCache.entries())
            .map(([key, entry]) => ({ key, ...entry }))
            .sort((a, b) => {
                // Sort by priority first, then by last accessed
                if (a.priority !== b.priority) {
                    const priorityOrder = { high: 3, normal: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                }
                return a.lastAccessed - b.lastAccessed;
            });
        
        // Evict bottom 10%
        const toEvict = Math.ceil(entries.length * 0.1);
        
        for (let i = 0; i < toEvict; i++) {
            if (entries[i]) {
                await this.delete(entries[i].key);
                this.stats.evictions++;
            }
        }
    }

    /**
     * Analyze predictive patterns
     */
    analyzePredictivePatterns() {
        // Find patterns in access times
        for (const [key, pattern] of this.accessPatterns.entries()) {
            if (pattern.times.length < 3) continue;
            
            // Check for regular intervals (e.g., every hour)
            const intervals = [];
            for (let i = 1; i < pattern.times.length; i++) {
                intervals.push(pattern.times[i] - pattern.times[i-1]);
            }
            
            // Calculate standard deviation
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
            const stdDev = Math.sqrt(variance);
            
            // If standard deviation is low, we have a regular pattern
            if (stdDev < avgInterval * 0.2) {
                pattern.avgInterval = avgInterval;
                pattern.isRegular = true;
                pattern.nextPredicted = pattern.times[pattern.times.length - 1] + avgInterval;
            }
        }
    }

    /**
     * Helper methods
     */
    async getFromCache(key) {
        if (this.redis) {
            try {
                const data = await this.redis.get(key);
                return data ? JSON.parse(data) : null;
            } catch (error) {
                // Fall back to memory cache
            }
        }
        
        return this.memoryCache.get(key);
    }

    async setInCache(key, value) {
        if (this.redis) {
            try {
                await this.redis.setex(key, value.ttl, JSON.stringify(value));
            } catch (error) {
                // Fall back to memory cache
            }
        }
        
        this.memoryCache.set(key, value);
    }

    estimateSize(value) {
        // Rough estimation of object size in bytes
        const str = JSON.stringify(value);
        return str.length * 2; // 2 bytes per character
    }

    updateHitRate() {
        const total = this.stats.hits + this.stats.misses;
        if (total > 0) {
            this.stats.avgHitRate = (this.stats.hits / total).toFixed(3);
        }
    }

    calculateAvgTTL() {
        const ttls = Array.from(this.memoryCache.values()).map(entry => entry.ttl);
        if (ttls.length === 0) return 0;
        return Math.round(ttls.reduce((a, b) => a + b, 0) / ttls.length);
    }

    getOldestEntry() {
        let oldest = null;
        for (const [key, entry] of this.memoryCache.entries()) {
            if (!oldest || entry.timestamp < oldest.timestamp) {
                oldest = { key, timestamp: entry.timestamp };
            }
        }
        return oldest;
    }

    getNewestEntry() {
        let newest = null;
        for (const [key, entry] of this.memoryCache.entries()) {
            if (!newest || entry.timestamp > newest.timestamp) {
                newest = { key, timestamp: entry.timestamp };
            }
        }
        return newest;
    }

    /**
     * Export cache state for debugging
     */
    exportState() {
        return {
            config: this.config,
            stats: this.getStats(),
            entries: Array.from(this.memoryCache.entries()).map(([key, entry]) => ({
                key,
                timestamp: entry.timestamp,
                expiresAt: entry.expiresAt,
                accessCount: entry.accessCount,
                size: entry.size,
                tags: entry.tags
            })),
            patterns: Array.from(this.accessPatterns.entries()).map(([key, pattern]) => ({
                key,
                count: pattern.count,
                isRegular: pattern.isRegular,
                avgInterval: pattern.avgInterval
            }))
        };
    }
}

// Singleton instance
let instance;

module.exports = {
    getInstance: (redisClient = null) => {
        if (!instance) {
            instance = new IntelligentCache(redisClient);
        }
        return instance;
    },
    IntelligentCache
};