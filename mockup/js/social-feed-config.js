// Social Feed Performance Configuration
window.SocialFeedConfig = {
  // Performance settings
  performance: {
    // Virtual scrolling
    virtualScroll: {
      enabled: true,
      threshold: 50, // Enable virtual scrolling for > 50 messages
      itemHeight: 80, // Estimated height per message
      bufferSize: 5, // Items to render outside viewport
      scrollDebounce: 16 // ~60fps
    },
    
    // Lazy loading
    lazyLoading: {
      enabled: true,
      rootMargin: '100px', // Start loading 100px before visible
      threshold: 0.01, // Trigger when 1% visible
      avatarPlaceholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0MDQ0NGIiLz48L3N2Zz4='
    },
    
    // Caching
    cache: {
      enabled: true,
      ttl: 5 * 60 * 1000, // 5 minutes
      maxMemoryItems: 1000,
      maxStorageSize: 10 * 1024 * 1024, // 10MB
      strategies: {
        messages: 'cache-first',
        users: 'network-first',
        marketplace: 'stale-while-revalidate'
      }
    },
    
    // Code splitting
    codeSplitting: {
      enabled: true,
      preloadOnHover: true,
      modules: {
        'emoji-picker': '/js/modules/emoji-picker.js',
        'voice-messages': '/js/modules/voice-messages.js',
        'file-sharing': '/js/modules/file-sharing.js',
        'marketplace-advanced': '/js/modules/marketplace-advanced.js'
      }
    },
    
    // Service worker
    serviceWorker: {
      enabled: true,
      scope: '/',
      updateInterval: 24 * 60 * 60 * 1000, // Check for updates daily
      offlineSupport: true,
      backgroundSync: true
    },
    
    // Optimization thresholds
    thresholds: {
      batchUpdateSize: 10, // Batch DOM updates in groups
      debounceDelay: 300, // Debounce user input
      throttleScroll: 16, // Throttle scroll events
      idleTimeout: 2000, // Wait for idle before non-critical tasks
      messageQueueSize: 100 // Max pending messages in queue
    }
  },
  
  // Feature flags
  features: {
    virtualScrolling: true,
    infiniteScroll: true,
    optimisticUpdates: true,
    backgroundSync: true,
    pushNotifications: true,
    webRTC: false, // Voice/video calls
    e2eEncryption: false // End-to-end encryption
  },
  
  // API endpoints
  api: {
    baseUrl: '/api/v2',
    endpoints: {
      messages: '/social/messages',
      users: '/social/users',
      marketplace: '/marketplace/items',
      notifications: '/notifications',
      analytics: '/analytics'
    },
    timeout: 10000, // 10 seconds
    retries: 3,
    retryDelay: 1000 // 1 second between retries
  },
  
  // IndexedDB configuration
  database: {
    name: 'socialFeedDB',
    version: 2,
    stores: {
      messages: {
        keyPath: 'id',
        indexes: ['channel', 'timestamp', 'author.userId']
      },
      users: {
        keyPath: 'userId',
        indexes: ['status', 'lastSeen']
      },
      marketplace: {
        keyPath: 'id',
        indexes: ['category', 'sport', 'location', 'price']
      },
      cache: {
        keyPath: 'key',
        indexes: ['timestamp', 'type']
      },
      queue: {
        keyPath: 'id',
        indexes: ['type', 'status', 'timestamp']
      }
    }
  },
  
  // Performance monitoring
  monitoring: {
    enabled: true,
    sampleRate: 0.1, // Sample 10% of users
    metrics: [
      'first-contentful-paint',
      'largest-contentful-paint',
      'first-input-delay',
      'cumulative-layout-shift',
      'time-to-interactive'
    ],
    customMetrics: {
      'message-render-time': true,
      'virtual-scroll-performance': true,
      'cache-hit-rate': true,
      'websocket-latency': true
    }
  },
  
  // Prefetch configuration
  prefetch: {
    enabled: true,
    strategy: 'hover', // 'hover' | 'visible' | 'idle'
    resources: [
      '/api/social/channels/popular',
      '/api/marketplace/featured',
      '/api/social/users/online'
    ],
    delay: 100, // Delay before prefetching on hover
    priority: 'low' // 'high' | 'low' | 'auto'
  },
  
  // Image optimization
  images: {
    lazy: true,
    placeholder: 'blur', // 'blur' | 'solid' | 'skeleton'
    formats: ['webp', 'jpg'], // Preferred formats in order
    sizes: {
      avatar: { width: 40, height: 40 },
      thumbnail: { width: 150, height: 150 },
      full: { width: 800, height: 600 }
    },
    quality: {
      webp: 85,
      jpg: 80
    }
  },
  
  // WebSocket configuration
  websocket: {
    url: window.location.protocol === 'https:' 
      ? 'wss://' + window.location.host + '/ws'
      : 'ws://' + window.location.host + '/ws',
    reconnect: true,
    reconnectDelay: 1000,
    reconnectDelayMax: 5000,
    reconnectAttempts: Infinity,
    heartbeat: 30000, // 30 seconds
    compression: true
  },
  
  // Memory management
  memory: {
    maxMessages: 1000, // Max messages to keep in memory
    maxUsers: 500, // Max user profiles to cache
    cleanupInterval: 60000, // Clean up every minute
    lowMemoryThreshold: 50 * 1024 * 1024, // 50MB
    criticalMemoryThreshold: 20 * 1024 * 1024 // 20MB
  }
};

// Auto-adjust configuration based on device capabilities
(function adjustConfig() {
  // Check connection speed
  if ('connection' in navigator) {
    const connection = navigator.connection;
    if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
      // Reduce performance features for slow connections
      SocialFeedConfig.features.virtualScrolling = true; // Keep this for performance
      SocialFeedConfig.features.infiniteScroll = false;
      SocialFeedConfig.performance.lazyLoading.rootMargin = '200px';
      SocialFeedConfig.images.quality.webp = 70;
      SocialFeedConfig.images.quality.jpg = 60;
    }
  }
  
  // Check device memory
  if ('deviceMemory' in navigator) {
    if (navigator.deviceMemory < 4) { // Less than 4GB RAM
      SocialFeedConfig.memory.maxMessages = 500;
      SocialFeedConfig.memory.maxUsers = 200;
      SocialFeedConfig.performance.cache.maxMemoryItems = 500;
    }
  }
  
  // Check CPU cores
  if ('hardwareConcurrency' in navigator) {
    if (navigator.hardwareConcurrency < 4) {
      // Reduce concurrent operations for low-end devices
      SocialFeedConfig.performance.thresholds.batchUpdateSize = 5;
      SocialFeedConfig.performance.virtualScroll.bufferSize = 3;
    }
  }
  
  // Check if on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    SocialFeedConfig.performance.virtualScroll.enabled = true; // Essential for mobile
    SocialFeedConfig.performance.thresholds.debounceDelay = 500;
    SocialFeedConfig.features.webRTC = false; // Disable heavy features
  }
})();