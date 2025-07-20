// Social Feed Performance Optimization Module
window.SocialFeedPerformance = {
  // Cache configuration
  cache: {
    messages: new Map(), // In-memory cache
    users: new Map(),
    marketplace: new Map(),
    ttl: 5 * 60 * 1000, // 5 minutes TTL
    maxSize: 1000 // Max items per cache
  },

  // Virtual scrolling configuration
  virtualScroll: {
    itemHeight: 80, // Estimated height of each message
    buffer: 5, // Number of items to render outside viewport
    container: null,
    scrollTop: 0,
    visibleStart: 0,
    visibleEnd: 0
  },

  // IndexedDB configuration
  db: {
    name: 'socialFeedDB',
    version: 1,
    instance: null
  },

  // Initialize performance optimizations
  async initialize() {
    // Initialize IndexedDB
    await this.initIndexedDB();
    
    // Set up intersection observer for lazy loading
    this.setupIntersectionObserver();
    
    // Set up service worker for offline caching
    this.registerServiceWorker();
    
    // Preload critical resources
    this.preloadResources();
  },

  // Initialize IndexedDB for persistent storage
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.db.name, this.db.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db.instance = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('channel', 'channel', { unique: false });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'userId' });
        }
        
        if (!db.objectStoreNames.contains('marketplace')) {
          const marketStore = db.createObjectStore('marketplace', { keyPath: 'id' });
          marketStore.createIndex('category', 'category', { unique: false });
          marketStore.createIndex('sport', 'sport', { unique: false });
        }
      };
    });
  },

  // Store data in IndexedDB
  async storeInDB(storeName, data) {
    if (!this.db.instance) return;
    
    const transaction = this.db.instance.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    if (Array.isArray(data)) {
      data.forEach(item => store.put(item));
    } else {
      store.put(data);
    }
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // Get data from IndexedDB
  async getFromDB(storeName, key) {
    if (!this.db.instance) return null;
    
    const transaction = this.db.instance.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = key ? store.get(key) : store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // Virtual scrolling implementation
  setupVirtualScrolling(container, items, renderItem) {
    if (!container) return;
    
    this.virtualScroll.container = container;
    
    // Create viewport and content containers
    const viewport = document.createElement('div');
    viewport.className = 'virtual-scroll-viewport';
    viewport.style.cssText = `
      height: 100%;
      overflow-y: auto;
      position: relative;
    `;
    
    const content = document.createElement('div');
    content.className = 'virtual-scroll-content';
    content.style.cssText = `
      position: relative;
      height: ${items.length * this.virtualScroll.itemHeight}px;
    `;
    
    // Clear container and add viewport
    container.innerHTML = '';
    viewport.appendChild(content);
    container.appendChild(viewport);
    
    // Render visible items
    const renderVisibleItems = () => {
      const scrollTop = viewport.scrollTop;
      const viewportHeight = viewport.clientHeight;
      
      // Calculate visible range
      const startIndex = Math.max(0, Math.floor(scrollTop / this.virtualScroll.itemHeight) - this.virtualScroll.buffer);
      const endIndex = Math.min(items.length, Math.ceil((scrollTop + viewportHeight) / this.virtualScroll.itemHeight) + this.virtualScroll.buffer);
      
      // Clear content
      content.innerHTML = '';
      
      // Render visible items
      for (let i = startIndex; i < endIndex; i++) {
        const itemEl = renderItem(items[i], i);
        itemEl.style.position = 'absolute';
        itemEl.style.top = `${i * this.virtualScroll.itemHeight}px`;
        itemEl.style.width = '100%';
        content.appendChild(itemEl);
      }
      
      this.virtualScroll.visibleStart = startIndex;
      this.virtualScroll.visibleEnd = endIndex;
    };
    
    // Debounced scroll handler
    let scrollTimeout;
    viewport.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(renderVisibleItems, 16); // ~60fps
    });
    
    // Initial render
    renderVisibleItems();
    
    return {
      update: (newItems) => {
        items = newItems;
        content.style.height = `${items.length * this.virtualScroll.itemHeight}px`;
        renderVisibleItems();
      },
      scrollToBottom: () => {
        viewport.scrollTop = content.scrollHeight;
      }
    };
  },

  // Lazy loading images with blur-up technique
  setupImageLazyLoading(element) {
    const images = element.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          
          // Create low-quality placeholder
          const placeholder = new Image();
          placeholder.src = img.dataset.placeholder || this.generatePlaceholder(src);
          
          placeholder.onload = () => {
            img.style.filter = 'blur(20px)';
            img.src = placeholder.src;
            
            // Load full image
            const fullImage = new Image();
            fullImage.src = src;
            
            fullImage.onload = () => {
              img.src = src;
              img.style.filter = 'none';
              img.style.transition = 'filter 0.3s';
              imageObserver.unobserve(img);
            };
          };
        }
      });
    }, {
      rootMargin: '50px'
    });
    
    images.forEach(img => imageObserver.observe(img));
  },

  // Generate placeholder for blur-up effect
  generatePlaceholder(src) {
    // In production, this would return a low-res version from the server
    // For now, return a data URL placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZGRkIi8+PC9zdmc+';
  },

  // Intersection Observer for tab preloading
  setupIntersectionObserver() {
    const socialTab = document.querySelector('[data-tab="social"]');
    if (!socialTab) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Preload social feed data when tab is hovered
          this.preloadSocialData();
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '100px'
    });
    
    // Observe hover area around social tab
    const hoverArea = socialTab.parentElement;
    if (hoverArea) {
      observer.observe(hoverArea);
    }
    
    // Also preload on hover
    socialTab.addEventListener('mouseenter', () => {
      this.preloadSocialData();
    }, { once: true });
  },

  // Preload social feed data
  async preloadSocialData() {
    // Check cache first
    const cachedData = await this.getCachedData('social-feed-data');
    if (cachedData) return;
    
    // Fetch data in background
    try {
      const [messages, users, marketplace] = await Promise.all([
        this.fetchWithCache('/api/social/messages', 'messages'),
        this.fetchWithCache('/api/social/users', 'users'),
        this.fetchWithCache('/api/marketplace/items', 'marketplace')
      ]);
      
      // Store in IndexedDB
      await Promise.all([
        this.storeInDB('messages', messages),
        this.storeInDB('users', users),
        this.storeInDB('marketplace', marketplace)
      ]);
    } catch (error) {
      console.error('Error preloading social data:', error);
    }
  },

  // Fetch with cache
  async fetchWithCache(url, cacheKey) {
    // Check memory cache
    const cached = this.cache[cacheKey].get(url);
    if (cached && Date.now() - cached.timestamp < this.cache.ttl) {
      return cached.data;
    }
    
    // Check IndexedDB
    const dbData = await this.getFromDB(cacheKey, url);
    if (dbData) {
      this.cache[cacheKey].set(url, { data: dbData, timestamp: Date.now() });
      return dbData;
    }
    
    // Fetch from network
    const response = await fetch(url);
    const data = await response.json();
    
    // Update caches
    this.cache[cacheKey].set(url, { data, timestamp: Date.now() });
    await this.storeInDB(cacheKey, data);
    
    return data;
  },

  // Get cached data
  async getCachedData(key) {
    // Check localStorage for quick access
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < this.cache.ttl) {
        return parsed.data;
      }
    }
    
    // Check IndexedDB
    return await this.getFromDB('cache', key);
  },

  // Store cached data
  async setCachedData(key, data) {
    // Store in localStorage for quick access
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    
    // Store in IndexedDB for persistence
    await this.storeInDB('cache', { key, data, timestamp: Date.now() });
  },

  // Code splitting for social feed module
  async loadSocialFeedModule() {
    // Dynamic import for code splitting
    const module = await import('./social-feed-module.js');
    return module.default;
  },

  // Register service worker for offline caching
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw-social-feed.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  },

  // Preload critical resources
  preloadResources() {
    // Preload fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.as = 'font';
    fontLink.type = 'font/woff2';
    fontLink.href = '/fonts/inter-var.woff2';
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);
    
    // Preload critical CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'preload';
    cssLink.as = 'style';
    cssLink.href = '/css/social-feed-critical.css';
    document.head.appendChild(cssLink);
  },

  // Optimize message rendering
  createOptimizedMessageElement(message) {
    const template = document.createElement('template');
    template.innerHTML = `
      <div class="message-item" data-id="${message.id}">
        <div class="message-avatar-placeholder"></div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">${this.escapeHtml(message.author.name)}</span>
            <span class="message-time">${this.formatTime(message.timestamp)}</span>
          </div>
          <div class="message-text">${this.escapeHtml(message.text)}</div>
        </div>
      </div>
    `;
    
    const element = template.content.firstElementChild;
    
    // Lazy load avatar
    requestIdleCallback(() => {
      const avatar = element.querySelector('.message-avatar-placeholder');
      avatar.innerHTML = `<img data-src="${message.author.avatar}" alt="${message.author.name}">`;
      this.setupImageLazyLoading(element);
    });
    
    return element;
  },

  // Escape HTML for security
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Format time efficiently
  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  },

  // Batch DOM updates
  batchUpdate(updates) {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  },

  // Debounce function for performance
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function for scroll events
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};