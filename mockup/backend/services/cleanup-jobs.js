const cron = require('node-cron');

class CleanupJobsService {
  constructor(db, websocketService, cacheService) {
    this.db = db;
    this.websocketService = websocketService;
    this.cacheService = cacheService;
    this.jobs = new Map();
    this.jobStats = new Map();
  }

  // Initialize all cleanup jobs
  initialize() {
    console.log('Initializing cleanup jobs...');

    // Clean up expired chat rooms every hour
    this.scheduleJob('cleanup-expired-chats', '0 * * * *', async () => {
      await this.cleanupExpiredChats();
    });

    // Archive old messages every day at 2 AM
    this.scheduleJob('archive-old-messages', '0 2 * * *', async () => {
      await this.archiveOldMessages();
    });

    // Clean up stale WebSocket connections every 15 minutes
    this.scheduleJob('cleanup-stale-connections', '*/15 * * * *', async () => {
      await this.cleanupStaleConnections();
    });

    // Clear expired cache entries every 30 minutes
    this.scheduleJob('cleanup-cache', '*/30 * * * *', async () => {
      await this.cleanupCache();
    });

    // Clean up old performance metrics every day at 3 AM
    this.scheduleJob('cleanup-metrics', '0 3 * * *', async () => {
      await this.cleanupOldMetrics();
    });

    // Vacuum database tables weekly on Sunday at 4 AM
    this.scheduleJob('vacuum-database', '0 4 * * 0', async () => {
      await this.vacuumDatabase();
    });

    // Clean up orphaned data every day at 4 AM
    this.scheduleJob('cleanup-orphaned-data', '0 4 * * *', async () => {
      await this.cleanupOrphanedData();
    });

    // Refresh materialized views every 15 minutes
    this.scheduleJob('refresh-materialized-views', '*/15 * * * *', async () => {
      await this.refreshMaterializedViews();
    });

    console.log(`Initialized ${this.jobs.size} cleanup jobs`);
  }

  // Schedule a job
  scheduleJob(name, schedule, task) {
    const job = cron.schedule(schedule, async () => {
      const startTime = Date.now();
      console.log(`[${name}] Starting cleanup job...`);

      try {
        await task();

        const duration = Date.now() - startTime;
        this.recordJobStats(name, true, duration);
        console.log(`[${name}] Completed in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        this.recordJobStats(name, false, duration, error.message);
        console.error(`[${name}] Failed after ${duration}ms:`, error);
      }
    });

    this.jobs.set(name, job);
    this.jobStats.set(name, {
      runs: 0,
      successes: 0,
      failures: 0,
      totalDuration: 0,
      lastRun: null,
      lastError: null
    });
  }

  // Record job statistics
  recordJobStats(name, success, duration, error = null) {
    const stats = this.jobStats.get(name);
    if (stats) {
      stats.runs++;
      stats.totalDuration += duration;
      stats.lastRun = new Date();

      if (success) {
        stats.successes++;
      } else {
        stats.failures++;
        stats.lastError = error;
      }
    }
  }

  // Cleanup expired chat rooms
  async cleanupExpiredChats() {
    if (!this.db) {
      console.log('Database not configured, skipping chat cleanup');
      return;
    }

    try {
      // Mark expired rooms as inactive
      const expiredRoomsResult = await this.db.query(`
                UPDATE chat_rooms 
                SET is_active = false 
                WHERE expires_at < NOW() 
                AND is_active = true
                RETURNING id
            `);

      const expiredCount = expiredRoomsResult.rowCount || 0;

      // Clean up very old inactive rooms (older than 30 days)
      const deletedRoomsResult = await this.db.query(`
                DELETE FROM chat_rooms 
                WHERE is_active = false 
                AND expires_at < NOW() - INTERVAL '30 days'
                RETURNING id
            `);

      const deletedCount = deletedRoomsResult.rowCount || 0;

      // Invalidate cache for expired rooms
      if (expiredRoomsResult.rows) {
        expiredRoomsResult.rows.forEach(row => {
          this.cacheService.invalidateRoomCache(row.id);
        });
      }

      console.log(`Marked ${expiredCount} rooms as inactive, deleted ${deletedCount} old rooms`);

      return { expired: expiredCount, deleted: deletedCount };
    } catch (error) {
      console.error('Error cleaning up expired chats:', error);
      throw error;
    }
  }

  // Archive old messages
  async archiveOldMessages() {
    if (!this.db) {
      console.log('Database not configured, skipping message archival');
      return;
    }

    try {
      // Move old messages to archive table (if exists)
      const archiveResult = await this.db.query(`
                WITH archived AS (
                    INSERT INTO chat_messages_archive 
                    SELECT * FROM chat_messages 
                    WHERE created_at < NOW() - INTERVAL '90 days'
                    ON CONFLICT DO NOTHING
                    RETURNING id
                )
                DELETE FROM chat_messages 
                WHERE id IN (SELECT id FROM archived)
            `);

      const archivedCount = archiveResult.rowCount || 0;

      // Delete very old messages from inactive rooms
      const deleteResult = await this.db.query(`
                DELETE FROM chat_messages 
                WHERE created_at < NOW() - INTERVAL '30 days'
                AND room_id IN (
                    SELECT id FROM chat_rooms 
                    WHERE is_active = false 
                    AND expires_at < NOW() - INTERVAL '7 days'
                )
            `);

      const deletedCount = deleteResult.rowCount || 0;

      console.log(`Archived ${archivedCount} messages, deleted ${deletedCount} old messages`);

      return { archived: archivedCount, deleted: deletedCount };
    } catch (error) {
      // If archive table doesn't exist, just delete old messages
      if (error.message.includes('chat_messages_archive')) {
        const deleteResult = await this.db.query(`
                    DELETE FROM chat_messages 
                    WHERE created_at < NOW() - INTERVAL '90 days'
                `);

        const deletedCount = deleteResult.rowCount || 0;
        console.log(`No archive table found. Deleted ${deletedCount} old messages`);

        return { archived: 0, deleted: deletedCount };
      }

      throw error;
    }
  }

  // Clean up stale WebSocket connections
  async cleanupStaleConnections() {
    if (!this.websocketService) {
      console.log('WebSocket service not configured, skipping connection cleanup');
      return;
    }

    const stats = this.websocketService.getDetailedStats();
    const staleConnections = [];

    // Check for stale connections (no activity for 5 minutes)
    const staleThreshold = Date.now() - 300000; // 5 minutes

    this.websocketService.connectionStates.forEach((state, socketId) => {
      if (state.lastActivity < staleThreshold) {
        staleConnections.push(socketId);
      }
    });

    // Disconnect stale connections
    staleConnections.forEach(socketId => {
      const socket = this.websocketService.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
      }
    });

    console.log(`Cleaned up ${staleConnections.length} stale connections`);

    return {
      cleaned: staleConnections.length,
      active: stats.metrics.activeConnections
    };
  }

  // Clean up cache
  async cleanupCache() {
    const stats = this.cacheService.getStats();

    // The cache service already handles TTL automatically
    // This is for additional cleanup if needed

    console.log('Cache statistics:', {
      hitRate: Math.round(stats.global.hitRate * 100) + '%',
      totalKeys: Object.values(stats.caches).reduce((sum, cache) => sum + cache.keys, 0)
    });

    return stats;
  }

  // Clean up old performance metrics
  async cleanupOldMetrics() {
    if (!this.db) {
      console.log('Database not configured, skipping metrics cleanup');
      return;
    }

    try {
      // Delete metrics older than 7 days
      const result = await this.db.query(`
                DELETE FROM performance_metrics 
                WHERE recorded_at < NOW() - INTERVAL '7 days'
            `);

      const deletedCount = result.rowCount || 0;
      console.log(`Deleted ${deletedCount} old performance metrics`);

      return { deleted: deletedCount };
    } catch (error) {
      console.error('Error cleaning up metrics:', error);
      throw error;
    }
  }

  // Vacuum database tables
  async vacuumDatabase() {
    if (!this.db) {
      console.log('Database not configured, skipping vacuum');
      return;
    }

    const tables = [
      'chat_messages',
      'chat_rooms',
      'user_reports',
      'moderation_actions',
      'performance_metrics'
    ];

    const results = {};

    for (const table of tables) {
      try {
        const startTime = Date.now();
        await this.db.query(`VACUUM ANALYZE ${table}`);
        results[table] = {
          success: true,
          duration: Date.now() - startTime
        };
        console.log(`Vacuumed table ${table} in ${results[table].duration}ms`);
      } catch (error) {
        results[table] = {
          success: false,
          error: error.message
        };
        console.error(`Failed to vacuum ${table}:`, error.message);
      }
    }

    return results;
  }

  // Clean up orphaned data
  async cleanupOrphanedData() {
    if (!this.db) {
      console.log('Database not configured, skipping orphaned data cleanup');
      return;
    }

    const results = {};

    try {
      // Remove chat participants for deleted rooms
      const participantsResult = await this.db.query(`
                DELETE FROM chat_participants 
                WHERE room_id NOT IN (SELECT id FROM chat_rooms)
            `);
      results.orphanedParticipants = participantsResult.rowCount || 0;

      // Remove messages for deleted rooms
      const messagesResult = await this.db.query(`
                DELETE FROM chat_messages 
                WHERE room_id NOT IN (SELECT id FROM chat_rooms)
            `);
      results.orphanedMessages = messagesResult.rowCount || 0;

      // Remove read receipts for deleted messages
      const receiptsResult = await this.db.query(`
                DELETE FROM message_read_receipts 
                WHERE message_id NOT IN (SELECT id FROM chat_messages)
            `);
      results.orphanedReceipts = receiptsResult.rowCount || 0;

      // Remove moderation actions for deleted users
      const moderationResult = await this.db.query(`
                DELETE FROM moderation_actions 
                WHERE target_user_id IS NOT NULL 
                AND target_user_id NOT IN (SELECT id FROM users)
            `);
      results.orphanedModerationActions = moderationResult.rowCount || 0;

      console.log('Cleaned up orphaned data:', results);

      return results;
    } catch (error) {
      console.error('Error cleaning up orphaned data:', error);
      throw error;
    }
  }

  // Refresh materialized views
  async refreshMaterializedViews() {
    if (!this.db) {
      console.log('Database not configured, skipping materialized view refresh');
      return;
    }

    try {
      const startTime = Date.now();
      await this.db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY moderator_stats');
      const duration = Date.now() - startTime;

      console.log(`Refreshed materialized views in ${duration}ms`);

      return { duration };
    } catch (error) {
      // If view doesn't exist or can't be refreshed concurrently, skip
      if (error.message.includes('does not exist') || error.message.includes('CONCURRENTLY')) {
        console.log('Materialized view refresh not available');
        return { skipped: true };
      }

      throw error;
    }
  }

  // Get job statistics
  getJobStats() {
    const stats = {};

    this.jobStats.forEach((jobStat, jobName) => {
      stats[jobName] = {
        ...jobStat,
        averageDuration: jobStat.runs > 0 ? jobStat.totalDuration / jobStat.runs : 0,
        successRate: jobStat.runs > 0 ? jobStat.successes / jobStat.runs : 0
      };
    });

    return stats;
  }

  // Manually trigger a job
  async triggerJob(jobName) {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job ${jobName} not found`);
    }

    console.log(`Manually triggering job: ${jobName}`);

    // Find the task function
    switch (jobName) {
    case 'cleanup-expired-chats':
      return await this.cleanupExpiredChats();
    case 'archive-old-messages':
      return await this.archiveOldMessages();
    case 'cleanup-stale-connections':
      return await this.cleanupStaleConnections();
    case 'cleanup-cache':
      return await this.cleanupCache();
    case 'cleanup-metrics':
      return await this.cleanupOldMetrics();
    case 'vacuum-database':
      return await this.vacuumDatabase();
    case 'cleanup-orphaned-data':
      return await this.cleanupOrphanedData();
    case 'refresh-materialized-views':
      return await this.refreshMaterializedViews();
    default:
      throw new Error(`No handler for job ${jobName}`);
    }
  }

  // Stop all jobs
  stop() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });

    this.jobs.clear();
  }
}

module.exports = CleanupJobsService;
