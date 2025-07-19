const chatRoomService = require('./chat-room-service');

class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }

  /**
     * Start the scheduler
     */
  start() {
    console.log('🕒 Starting scheduler service...');

    // Schedule chat room cleanup every hour
    this.scheduleJob('chat-room-cleanup', 60 * 60 * 1000, async () => {
      try {
        console.log('🧹 Running chat room cleanup...');
        const result = await chatRoomService.cleanupExpiredRooms();
        console.log(`✅ Cleaned up ${result.cleanedCount} expired chat rooms`);
      } catch (error) {
        console.error('❌ Chat room cleanup failed:', error);
      }
    });

    // Run initial cleanup
    this.runJob('chat-room-cleanup');
  }

  /**
     * Schedule a job
     * @param {string} name - Job name
     * @param {number} interval - Interval in milliseconds
     * @param {Function} handler - Job handler function
     */
  scheduleJob(name, interval, handler) {
    if (this.jobs.has(name)) {
      this.cancelJob(name);
    }

    const intervalId = setInterval(handler, interval);
    this.jobs.set(name, {
      name,
      interval,
      handler,
      intervalId,
      lastRun: null
    });

    console.log(`📅 Scheduled job: ${name} (every ${interval / 1000}s)`);
  }

  /**
     * Run a job immediately
     * @param {string} name - Job name
     */
  async runJob(name) {
    const job = this.jobs.get(name);
    if (!job) {
      console.error(`Job not found: ${name}`);
      return;
    }

    try {
      await job.handler();
      job.lastRun = new Date();
    } catch (error) {
      console.error(`Error running job ${name}:`, error);
    }
  }

  /**
     * Cancel a job
     * @param {string} name - Job name
     */
  cancelJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      clearInterval(job.intervalId);
      this.jobs.delete(name);
      console.log(`🚫 Cancelled job: ${name}`);
    }
  }

  /**
     * Stop all jobs
     */
  stop() {
    for (const [name] of this.jobs) {
      this.cancelJob(name);
    }
    console.log('🛑 Scheduler service stopped');
  }

  /**
     * Get scheduler status
     * @returns {Object} Scheduler status
     */
  getStatus() {
    const jobs = [];
    for (const [name, job] of this.jobs) {
      jobs.push({
        name,
        interval: job.interval,
        lastRun: job.lastRun
      });
    }
    return { jobs };
  }
}

module.exports = new SchedulerService();
