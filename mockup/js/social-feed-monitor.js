// Social Feed Performance Monitoring
window.SocialFeedMonitor = {
  metrics: {
    renderTimes: [],
    cacheHits: 0,
    cacheMisses: 0,
    messagesRendered: 0,
    virtualScrollUpdates: 0,
    lazyLoadedImages: 0,
    websocketLatency: [],
    memoryUsage: []
  },

  // Initialize performance monitoring
  initialize() {
    // Set up Performance Observer
    if ('PerformanceObserver' in window) {
      this.setupPerformanceObserver();
    }

    // Monitor memory usage
    this.startMemoryMonitoring();

    // Monitor render performance
    this.setupRenderMonitoring();

    // Set up error tracking
    this.setupErrorTracking();

    // Report metrics periodically
    this.startMetricsReporting();
  },

  // Set up Performance Observer for Web Vitals
  setupPerformanceObserver() {
    // Observe paint timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('paint', {
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration
          });
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('Paint observer not supported');
    }

    // Observe largest contentful paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('lcp', {
          value: lastEntry.renderTime || lastEntry.loadTime,
          element: lastEntry.element?.tagName
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // Observe first input delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('fid', {
            delay: entry.processingStart - entry.startTime,
            name: entry.name
          });
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // Observe layout shifts
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.recordMetric('cls', { value: clsValue });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observer not supported');
    }
  },

  // Monitor memory usage
  startMemoryMonitoring() {
    if (!performance.memory) return;

    setInterval(() => {
      const memory = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };

      this.metrics.memoryUsage.push(memory);

      // Keep only last 100 measurements
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift();
      }

      // Check for memory pressure
      const usagePercent = (memory.used / memory.limit) * 100;
      if (usagePercent > 90) {
        this.handleMemoryPressure(usagePercent);
      }
    }, 5000); // Check every 5 seconds
  },

  // Handle high memory usage
  handleMemoryPressure(usagePercent) {
    console.warn(`High memory usage: ${usagePercent.toFixed(2)}%`);

    // Trigger cleanup
    if (window.SocialFeedPerformance) {
      // Clear old cache entries
      window.SocialFeedPerformance.cache.messages.clear();
      window.SocialFeedPerformance.cache.users.clear();

      // Trigger garbage collection if available
      if (window.gc) {
        window.gc();
      }
    }

    // Notify user if critical
    if (usagePercent > 95) {
      this.showPerformanceWarning('High memory usage detected. Some features may be limited.');
    }
  },

  // Monitor render performance
  setupRenderMonitoring() {
    // Override message rendering to measure performance
    const originalRender = window.SocialFeedPage.displayMessages;
    if (originalRender) {
      window.SocialFeedPage.displayMessages = function(...args) {
        const startTime = performance.now();
        const result = originalRender.apply(this, args);
        const endTime = performance.now();

        window.SocialFeedMonitor.recordRenderTime(endTime - startTime, args[0]?.length || 0);
        return result;
      };
    }

    // Monitor virtual scroll performance
    if (window.SocialFeedPerformance?.setupVirtualScrolling) {
      const originalSetup = window.SocialFeedPerformance.setupVirtualScrolling;
      window.SocialFeedPerformance.setupVirtualScrolling = function(...args) {
        const scroller = originalSetup.apply(this, args);
        
        // Wrap update method
        const originalUpdate = scroller.update;
        scroller.update = function(...updateArgs) {
          const startTime = performance.now();
          const result = originalUpdate.apply(this, updateArgs);
          const endTime = performance.now();

          window.SocialFeedMonitor.metrics.virtualScrollUpdates++;
          window.SocialFeedMonitor.recordMetric('virtual-scroll-update', {
            duration: endTime - startTime,
            itemCount: updateArgs[0]?.length || 0
          });

          return result;
        };

        return scroller;
      };
    }
  },

  // Record render time
  recordRenderTime(duration, messageCount) {
    this.metrics.renderTimes.push({
      duration,
      messageCount,
      timestamp: Date.now(),
      averagePerMessage: messageCount > 0 ? duration / messageCount : 0
    });

    this.metrics.messagesRendered += messageCount;

    // Keep only last 50 measurements
    if (this.metrics.renderTimes.length > 50) {
      this.metrics.renderTimes.shift();
    }

    // Warn if render is slow
    if (duration > 100) {
      console.warn(`Slow render detected: ${duration.toFixed(2)}ms for ${messageCount} messages`);
    }
  },

  // Track cache performance
  recordCacheHit(cacheType) {
    this.metrics.cacheHits++;
    this.recordMetric('cache-hit', { type: cacheType });
  },

  recordCacheMiss(cacheType) {
    this.metrics.cacheMisses++;
    this.recordMetric('cache-miss', { type: cacheType });
  },

  // Track lazy loading
  recordLazyLoad(elementType) {
    this.metrics.lazyLoadedImages++;
    this.recordMetric('lazy-load', { type: elementType });
  },

  // Track WebSocket latency
  recordWebSocketLatency(latency) {
    this.metrics.websocketLatency.push({
      latency,
      timestamp: Date.now()
    });

    // Keep only last 100 measurements
    if (this.metrics.websocketLatency.length > 100) {
      this.metrics.websocketLatency.shift();
    }
  },

  // Generic metric recording
  recordMetric(name, data) {
    // Send to analytics if configured
    if (window.SocialFeedConfig?.monitoring?.enabled) {
      this.queueMetric({
        name,
        data,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    }
  },

  // Queue metrics for batch sending
  metricsQueue: [],
  queueMetric(metric) {
    this.metricsQueue.push(metric);

    // Send when queue reaches threshold
    if (this.metricsQueue.length >= 10) {
      this.sendMetrics();
    }
  },

  // Send metrics to server
  async sendMetrics() {
    if (this.metricsQueue.length === 0) return;

    const metrics = [...this.metricsQueue];
    this.metricsQueue = [];

    try {
      await fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          session: this.getSessionId(),
          timestamp: Date.now()
        })
      });
    } catch (error) {
      // Re-queue metrics on failure
      this.metricsQueue.unshift(...metrics);
    }
  },

  // Get session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('monitor-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('monitor-session-id', sessionId);
    }
    return sessionId;
  },

  // Error tracking
  setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.recordError({
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        type: 'unhandledRejection',
        reason: event.reason,
        promise: event.promise
      });
    });
  },

  // Record errors
  recordError(error) {
    this.recordMetric('error', error);
    console.error('Social Feed Error:', error);
  },

  // Start periodic reporting
  startMetricsReporting() {
    // Send metrics every 30 seconds
    setInterval(() => {
      this.sendMetrics();
      this.generateReport();
    }, 30000);

    // Send metrics on page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics();
    });
  },

  // Generate performance report
  generateReport() {
    const report = {
      timestamp: Date.now(),
      metrics: {
        rendering: this.calculateRenderingMetrics(),
        cache: this.calculateCacheMetrics(),
        memory: this.calculateMemoryMetrics(),
        websocket: this.calculateWebSocketMetrics(),
        overall: this.calculateOverallScore()
      }
    };

    // Log report in development
    if (window.location.hostname === 'localhost') {
      console.log('Social Feed Performance Report:', report);
    }

    return report;
  },

  // Calculate rendering metrics
  calculateRenderingMetrics() {
    if (this.metrics.renderTimes.length === 0) {
      return { average: 0, p95: 0, total: 0 };
    }

    const times = this.metrics.renderTimes.map(r => r.duration).sort((a, b) => a - b);
    const average = times.reduce((sum, t) => sum + t, 0) / times.length;
    const p95Index = Math.floor(times.length * 0.95);
    const p95 = times[p95Index] || times[times.length - 1];

    return {
      average: average.toFixed(2),
      p95: p95.toFixed(2),
      total: this.metrics.messagesRendered,
      virtualScrollUpdates: this.metrics.virtualScrollUpdates
    };
  },

  // Calculate cache metrics
  calculateCacheMetrics() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    const hitRate = total > 0 ? (this.metrics.cacheHits / total) * 100 : 0;

    return {
      hits: this.metrics.cacheHits,
      misses: this.metrics.cacheMisses,
      hitRate: hitRate.toFixed(2) + '%',
      lazyLoadedImages: this.metrics.lazyLoadedImages
    };
  },

  // Calculate memory metrics
  calculateMemoryMetrics() {
    if (this.metrics.memoryUsage.length === 0) {
      return { current: 0, average: 0, peak: 0 };
    }

    const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    const usedMB = (latest.used / 1024 / 1024).toFixed(2);
    const limitMB = (latest.limit / 1024 / 1024).toFixed(2);
    const usagePercent = ((latest.used / latest.limit) * 100).toFixed(2);

    const allUsed = this.metrics.memoryUsage.map(m => m.used);
    const average = allUsed.reduce((sum, u) => sum + u, 0) / allUsed.length;
    const peak = Math.max(...allUsed);

    return {
      current: `${usedMB}MB / ${limitMB}MB (${usagePercent}%)`,
      average: (average / 1024 / 1024).toFixed(2) + 'MB',
      peak: (peak / 1024 / 1024).toFixed(2) + 'MB'
    };
  },

  // Calculate WebSocket metrics
  calculateWebSocketMetrics() {
    if (this.metrics.websocketLatency.length === 0) {
      return { average: 0, p95: 0 };
    }

    const latencies = this.metrics.websocketLatency.map(w => w.latency).sort((a, b) => a - b);
    const average = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95 = latencies[p95Index] || latencies[latencies.length - 1];

    return {
      average: average.toFixed(2) + 'ms',
      p95: p95.toFixed(2) + 'ms'
    };
  },

  // Calculate overall performance score
  calculateOverallScore() {
    let score = 100;

    // Deduct points for slow rendering
    const renderMetrics = this.calculateRenderingMetrics();
    if (parseFloat(renderMetrics.average) > 50) score -= 10;
    if (parseFloat(renderMetrics.p95) > 100) score -= 10;

    // Deduct points for low cache hit rate
    const cacheMetrics = this.calculateCacheMetrics();
    const hitRate = parseFloat(cacheMetrics.hitRate);
    if (hitRate < 80) score -= (80 - hitRate) / 2;

    // Deduct points for high memory usage
    const memoryMetrics = this.calculateMemoryMetrics();
    const usageMatch = memoryMetrics.current.match(/(\d+\.\d+)%/);
    if (usageMatch) {
      const usage = parseFloat(usageMatch[1]);
      if (usage > 80) score -= (usage - 80);
    }

    return Math.max(0, Math.min(100, score)).toFixed(0);
  },

  // Show performance warning to user
  showPerformanceWarning(message) {
    const warning = document.createElement('div');
    warning.className = 'performance-warning';
    warning.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #ff9800;
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 300px;
    `;
    warning.innerHTML = `
      <strong>Performance Notice</strong>
      <p>${message}</p>
      <button onclick="this.parentElement.remove()" style="
        background: white;
        color: #ff9800;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 8px;
      ">Dismiss</button>
    `;
    document.body.appendChild(warning);

    // Auto-remove after 10 seconds
    setTimeout(() => warning.remove(), 10000);
  }
};

// Auto-initialize when social feed loads
document.addEventListener('DOMContentLoaded', () => {
  // Initialize monitoring when social feed is activated
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        const socialSection = document.querySelector('.social-feed-section');
        if (socialSection && socialSection.style.display !== 'none') {
          window.SocialFeedMonitor.initialize();
          observer.disconnect();
          break;
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});