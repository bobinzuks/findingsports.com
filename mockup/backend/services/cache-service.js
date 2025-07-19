const NodeCache = require('node-cache');
const crypto = require('crypto');

class CacheService {
  constructor() {
    // Different cache stores for different data types with appropriate TTLs
    this.caches = {
      // User permissions cache - 5 minutes TTL
      permissions: new NodeCache({
        stdTTL: 300,
        checkperiod: 60,
        useClones: false
      }),

      // Banned words cache - 30 minutes TTL
      bannedWords: new NodeCache({
        stdTTL: 1800,
        checkperiod: 300,
        useClones: false
      }),

      // User roles cache - 10 minutes TTL
      userRoles: new NodeCache({
        stdTTL: 600,
        checkperiod: 120,
        useClones: false
      }),

      // Moderator list cache - 15 minutes TTL
      moderators: new NodeCache({
        stdTTL: 900,
        checkperiod: 180,
        useClones: false
      }),

      // Report statistics cache - 5 minutes TTL
      reportStats: new NodeCache({
        stdTTL: 300,
        checkperiod: 60,
        useClones: false
      }),

      // Room membership cache - 2 minutes TTL
      roomMembership: new NodeCache({
        stdTTL: 120,
        checkperiod: 30,
        useClones: false
      }),

      // Message history cache - 1 minute TTL (for pagination)
      messageHistory: new NodeCache({
        stdTTL: 60,
        checkperiod: 20,
        useClones: false,
        maxKeys: 1000
      }),

      // Query results cache - 30 seconds TTL
      queryResults: new NodeCache({
        stdTTL: 30,
        checkperiod: 10,
        useClones: false,
        maxKeys: 5000
      })
    };

    // Cache hit/miss statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      flushes: 0
    };

    // Set up event listeners for statistics
    Object.values(this.caches).forEach(cache => {
      cache.on('hit', () => this.stats.hits++);
      cache.on('miss', () => this.stats.misses++);
      cache.on('set', () => this.stats.sets++);
      cache.on('del', () => this.stats.deletes++);
      cache.on('flush', () => this.stats.flushes++);
    });
  }

  // Generate cache key from query parameters
  generateKey(prefix, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});

    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(sortedParams))
      .digest('hex');

    return `${prefix}:${hash}`;
  }

  // Get user permissions with caching
  async getUserPermissions(userId, roleGetter) {
    const cacheKey = `user:${userId}`;
    let permissions = this.caches.permissions.get(cacheKey);

    if (permissions === undefined) {
      // Cache miss - fetch from database/service
      const userRole = await roleGetter(userId);
      permissions = this.getRolePermissions(userRole);
      this.caches.permissions.set(cacheKey, permissions);
    }

    return permissions;
  }

  // Get role permissions
  getRolePermissions(role) {
    const basePermissions = {
      user: ['read:chat', 'write:chat', 'report:user', 'report:message'],
      moderator: [
        'read:chat', 'write:chat', 'report:user', 'report:message',
        'delete:message', 'mute:user', 'kick:user', 'warn:user',
        'review:report', 'resolve:report'
      ],
      admin: ['*'] // All permissions
    };

    return basePermissions[role] || basePermissions.user;
  }

  // Check if user has permission
  hasPermission(permissions, action, resource) {
    if (permissions.includes('*')) return true;
    return permissions.includes(`${action}:${resource}`);
  }

  // Get banned words with caching
  async getBannedWords(fetcher) {
    const cacheKey = 'all_banned_words';
    let words = this.caches.bannedWords.get(cacheKey);

    if (words === undefined) {
      // Cache miss - fetch from database
      words = await fetcher();
      this.caches.bannedWords.set(cacheKey, words);
    }

    return words;
  }

  // Get user role with caching
  async getUserRole(userId, fetcher) {
    const cacheKey = `role:${userId}`;
    let role = this.caches.userRoles.get(cacheKey);

    if (role === undefined) {
      // Cache miss - fetch from database
      const user = await fetcher(userId);
      role = user ? user.role : 'user';
      this.caches.userRoles.set(cacheKey, role);
    }

    return role;
  }

  // Get moderator list with caching
  async getModerators(fetcher) {
    const cacheKey = 'moderator_list';
    let moderators = this.caches.moderators.get(cacheKey);

    if (moderators === undefined) {
      // Cache miss - fetch from database
      moderators = await fetcher();
      this.caches.moderators.set(cacheKey, moderators);
    }

    return moderators;
  }

  // Get report statistics with caching
  async getReportStats(filter, fetcher) {
    const cacheKey = this.generateKey('report_stats', filter);
    let stats = this.caches.reportStats.get(cacheKey);

    if (stats === undefined) {
      // Cache miss - calculate statistics
      stats = await fetcher(filter);
      this.caches.reportStats.set(cacheKey, stats);
    }

    return stats;
  }

  // Get room membership with caching
  async getRoomMembership(roomId, fetcher) {
    const cacheKey = `room:${roomId}:members`;
    let members = this.caches.roomMembership.get(cacheKey);

    if (members === undefined) {
      // Cache miss - fetch from database
      members = await fetcher(roomId);
      this.caches.roomMembership.set(cacheKey, members);
    }

    return members;
  }

  // Cache message history page
  cacheMessagePage(roomId, page, limit, messages) {
    const cacheKey = `messages:${roomId}:${page}:${limit}`;
    this.caches.messageHistory.set(cacheKey, messages);
  }

  // Get cached message page
  getCachedMessagePage(roomId, page, limit) {
    const cacheKey = `messages:${roomId}:${page}:${limit}`;
    return this.caches.messageHistory.get(cacheKey);
  }

  // Cache query results
  cacheQueryResult(queryKey, result, ttl = 30) {
    this.caches.queryResults.set(queryKey, result, ttl);
  }

  // Get cached query result
  getCachedQueryResult(queryKey) {
    return this.caches.queryResults.get(queryKey);
  }

  // Invalidate user-related caches
  invalidateUserCache(userId) {
    this.caches.permissions.del(`user:${userId}`);
    this.caches.userRoles.del(`role:${userId}`);
    // If user is/was a moderator, invalidate moderator list
    this.caches.moderators.del('moderator_list');
  }

  // Invalidate room-related caches
  invalidateRoomCache(roomId) {
    this.caches.roomMembership.del(`room:${roomId}:members`);
    // Invalidate all message pages for this room
    const messageKeys = this.caches.messageHistory.keys();
    messageKeys.forEach(key => {
      if (key.startsWith(`messages:${roomId}:`)) {
        this.caches.messageHistory.del(key);
      }
    });
  }

  // Invalidate report caches
  invalidateReportCache() {
    this.caches.reportStats.flushAll();
  }

  // Invalidate banned words cache
  invalidateBannedWordsCache() {
    this.caches.bannedWords.del('all_banned_words');
  }

  // Get cache statistics
  getStats() {
    const cacheStats = {};

    Object.entries(this.caches).forEach(([name, cache]) => {
      cacheStats[name] = {
        keys: cache.keys().length,
        hits: cache.getStats().hits,
        misses: cache.getStats().misses,
        hitRate: cache.getStats().hits / (cache.getStats().hits + cache.getStats().misses) || 0
      };
    });

    return {
      global: {
        ...this.stats,
        hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
      },
      caches: cacheStats
    };
  }

  // Warm up caches
  async warmUp(options = {}) {
    const results = {
      bannedWords: false,
      moderators: false,
      startTime: Date.now()
    };

    try {
      // Warm up banned words cache
      if (options.bannedWordsFetcher) {
        await this.getBannedWords(options.bannedWordsFetcher);
        results.bannedWords = true;
      }

      // Warm up moderators cache
      if (options.moderatorsFetcher) {
        await this.getModerators(options.moderatorsFetcher);
        results.moderators = true;
      }

      results.duration = Date.now() - results.startTime;
      results.success = true;
    } catch (error) {
      results.error = error.message;
      results.success = false;
    }

    return results;
  }

  // Clear all caches
  flushAll() {
    Object.values(this.caches).forEach(cache => cache.flushAll());
    this.stats.flushes++;
  }

  // Periodic cleanup of expired entries
  startCleanupInterval(intervalMs = 60000) {
    this.cleanupInterval = setInterval(() => {
      // Node-cache handles TTL automatically, but we can do additional cleanup here
      // For example, remove entries that haven't been accessed in a while
      Object.entries(this.caches).forEach(([name, cache]) => {
        const keys = cache.keys();
        console.log(`Cache ${name} has ${keys.length} entries`);
      });
    }, intervalMs);
  }

  // Stop cleanup interval
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
module.exports = new CacheService();
