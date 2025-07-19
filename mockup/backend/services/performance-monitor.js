const os = require('os');
const { performance } = require('perf_hooks');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: new Map(), // endpoint -> { count, totalTime, errors }
      database: new Map(), // query -> { count, totalTime, slowQueries }
      websocket: {
        messagesSent: 0,
        messagesReceived: 0,
        connectionsOpened: 0,
        connectionsClosed: 0,
        errors: 0
      },
      system: {
        cpuUsage: [],
        memoryUsage: [],
        eventLoopDelay: []
      }
    };

    this.slowQueryThreshold = 100; // ms
    this.slowRequestThreshold = 1000; // ms
    this.monitoringInterval = null;
    this.alertCallbacks = [];
  }

  // Start system monitoring
  startMonitoring(intervalMs = 30000) {
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.checkAlerts();
    }, intervalMs);

    // Monitor event loop delay
    this.monitorEventLoop();
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Collect system metrics
  collectSystemMetrics() {
    // CPU usage
    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    this.metrics.system.cpuUsage.push({
      value: cpuUsage,
      timestamp: Date.now()
    });

    // Memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = (usedMem / totalMem) * 100;

    this.metrics.system.memoryUsage.push({
      value: memUsagePercent,
      used: usedMem,
      total: totalMem,
      timestamp: Date.now()
    });

    // Keep only last hour of data
    const oneHourAgo = Date.now() - 3600000;
    this.metrics.system.cpuUsage = this.metrics.system.cpuUsage.filter(m => m.timestamp > oneHourAgo);
    this.metrics.system.memoryUsage = this.metrics.system.memoryUsage.filter(m => m.timestamp > oneHourAgo);
    this.metrics.system.eventLoopDelay = this.metrics.system.eventLoopDelay.filter(m => m.timestamp > oneHourAgo);
  }

  // Monitor event loop delay
  monitorEventLoop() {
    let lastCheck = performance.now();

    setInterval(() => {
      const now = performance.now();
      const delay = now - lastCheck - 1000; // Expected 1000ms interval

      if (delay > 10) { // Only record significant delays
        this.metrics.system.eventLoopDelay.push({
          value: delay,
          timestamp: Date.now()
        });
      }

      lastCheck = now;
    }, 1000);
  }

  // Track HTTP request performance
  trackRequest(endpoint, duration, error = null) {
    if (!this.metrics.requests.has(endpoint)) {
      this.metrics.requests.set(endpoint, {
        count: 0,
        totalTime: 0,
        errors: 0,
        slowRequests: 0,
        averageTime: 0
      });
    }

    const metric = this.metrics.requests.get(endpoint);
    metric.count++;
    metric.totalTime += duration;
    metric.averageTime = metric.totalTime / metric.count;

    if (error) {
      metric.errors++;
    }

    if (duration > this.slowRequestThreshold) {
      metric.slowRequests++;
      this.triggerAlert('slow_request', {
        endpoint,
        duration,
        threshold: this.slowRequestThreshold
      });
    }
  }

  // Track database query performance
  trackQuery(query, duration, error = null) {
    const queryKey = this.normalizeQuery(query);

    if (!this.metrics.database.has(queryKey)) {
      this.metrics.database.set(queryKey, {
        count: 0,
        totalTime: 0,
        errors: 0,
        slowQueries: 0,
        averageTime: 0
      });
    }

    const metric = this.metrics.database.get(queryKey);
    metric.count++;
    metric.totalTime += duration;
    metric.averageTime = metric.totalTime / metric.count;

    if (error) {
      metric.errors++;
    }

    if (duration > this.slowQueryThreshold) {
      metric.slowQueries++;
      this.triggerAlert('slow_query', {
        query: queryKey,
        duration,
        threshold: this.slowQueryThreshold
      });
    }
  }

  // Track WebSocket metrics
  trackWebSocketMessage(direction, error = null) {
    if (direction === 'sent') {
      this.metrics.websocket.messagesSent++;
    } else if (direction === 'received') {
      this.metrics.websocket.messagesReceived++;
    }

    if (error) {
      this.metrics.websocket.errors++;
    }
  }

  trackWebSocketConnection(event) {
    if (event === 'open') {
      this.metrics.websocket.connectionsOpened++;
    } else if (event === 'close') {
      this.metrics.websocket.connectionsClosed++;
    }
  }

  // Normalize database query for grouping
  normalizeQuery(query) {
    // Remove specific values to group similar queries
    return query
      .replace(/\b\d+\b/g, '?') // Replace numbers
      .replace(/'[^']*'/g, '?') // Replace string literals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Register alert callback
  onAlert(callback) {
    this.alertCallbacks.push(callback);
  }

  // Trigger alert
  triggerAlert(type, data) {
    const alert = {
      type,
      data,
      timestamp: Date.now()
    };

    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Alert callback error:', error);
      }
    });
  }

  // Check for alerts based on thresholds
  checkAlerts() {
    // High CPU usage
    const recentCpu = this.metrics.system.cpuUsage.slice(-5);
    const avgCpu = recentCpu.reduce((sum, m) => sum + m.value, 0) / recentCpu.length;

    if (avgCpu > 80) {
      this.triggerAlert('high_cpu', {
        average: avgCpu,
        threshold: 80
      });
    }

    // High memory usage
    const recentMem = this.metrics.system.memoryUsage.slice(-5);
    const avgMem = recentMem.reduce((sum, m) => sum + m.value, 0) / recentMem.length;

    if (avgMem > 90) {
      this.triggerAlert('high_memory', {
        average: avgMem,
        threshold: 90
      });
    }

    // High event loop delay
    const recentDelay = this.metrics.system.eventLoopDelay.slice(-10);
    if (recentDelay.length > 0) {
      const avgDelay = recentDelay.reduce((sum, m) => sum + m.value, 0) / recentDelay.length;

      if (avgDelay > 100) {
        this.triggerAlert('high_event_loop_delay', {
          average: avgDelay,
          threshold: 100
        });
      }
    }
  }

  // Get performance report
  getReport() {
    // Top slow endpoints
    const slowEndpoints = Array.from(this.metrics.requests.entries())
      .map(([endpoint, metric]) => ({
        endpoint,
        ...metric,
        errorRate: metric.errors / metric.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    // Top slow queries
    const slowQueries = Array.from(this.metrics.database.entries())
      .map(([query, metric]) => ({
        query,
        ...metric,
        errorRate: metric.errors / metric.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    // System health
    const systemHealth = {
      cpu: {
        current: this.metrics.system.cpuUsage.slice(-1)[0]?.value || 0,
        average: this.calculateAverage(this.metrics.system.cpuUsage.map(m => m.value))
      },
      memory: {
        current: this.metrics.system.memoryUsage.slice(-1)[0]?.value || 0,
        average: this.calculateAverage(this.metrics.system.memoryUsage.map(m => m.value))
      },
      eventLoop: {
        current: this.metrics.system.eventLoopDelay.slice(-1)[0]?.value || 0,
        average: this.calculateAverage(this.metrics.system.eventLoopDelay.map(m => m.value))
      }
    };

    return {
      timestamp: Date.now(),
      endpoints: {
        total: this.metrics.requests.size,
        slowEndpoints,
        totalRequests: Array.from(this.metrics.requests.values()).reduce((sum, m) => sum + m.count, 0),
        totalErrors: Array.from(this.metrics.requests.values()).reduce((sum, m) => sum + m.errors, 0)
      },
      database: {
        total: this.metrics.database.size,
        slowQueries,
        totalQueries: Array.from(this.metrics.database.values()).reduce((sum, m) => sum + m.count, 0),
        totalErrors: Array.from(this.metrics.database.values()).reduce((sum, m) => sum + m.errors, 0)
      },
      websocket: this.metrics.websocket,
      system: systemHealth
    };
  }

  // Calculate average
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  // Express middleware for automatic request tracking
  middleware() {
    return (req, res, next) => {
      const start = performance.now();
      const endpoint = `${req.method} ${req.route?.path || req.path}`;

      // Override res.end to track response
      const originalEnd = res.end;
      res.end = (...args) => {
        const duration = performance.now() - start;
        const error = res.statusCode >= 400 ? res.statusCode : null;

        this.trackRequest(endpoint, duration, error);

        originalEnd.apply(res, args);
      };

      next();
    };
  }

  // Database query wrapper
  wrapQuery(queryFunction) {
    return async (...args) => {
      const start = performance.now();
      let error = null;

      try {
        const result = await queryFunction(...args);
        return result;
      } catch (err) {
        error = err;
        throw err;
      } finally {
        const duration = performance.now() - start;
        const query = args[0]; // Assuming first argument is the query

        if (typeof query === 'string') {
          this.trackQuery(query, duration, error);
        }
      }
    };
  }

  // Reset metrics
  reset() {
    this.metrics.requests.clear();
    this.metrics.database.clear();
    this.metrics.websocket = {
      messagesSent: 0,
      messagesReceived: 0,
      connectionsOpened: 0,
      connectionsClosed: 0,
      errors: 0
    };
    this.metrics.system = {
      cpuUsage: [],
      memoryUsage: [],
      eventLoopDelay: []
    };
  }
}

// Export singleton instance
module.exports = new PerformanceMonitor();
