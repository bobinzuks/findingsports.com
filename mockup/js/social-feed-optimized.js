// Optimized Social Feed with Performance Enhancements
window.SocialFeedOptimized = {
  ...window.SocialFeedPage,
  
  // Performance tracking
  performance: {
    initialized: false,
    virtualScroller: null,
    imageObserver: null,
    messageCache: new Map(),
    renderQueue: []
  },

  // Override initialize with performance optimizations
  async initialize() {
    // Initialize performance module first
    await window.SocialFeedPerformance.initialize();
    
    // Call parent initialize
    await window.SocialFeedPage.initialize.call(this);
    
    // Set up performance enhancements
    this.setupPerformanceOptimizations();
    
    this.performance.initialized = true;
  },

  // Set up all performance optimizations
  setupPerformanceOptimizations() {
    // Enable request idle callback for non-critical updates
    this.setupIdleUpdates();
    
    // Set up message caching
    this.setupMessageCaching();
    
    // Enable intersection observer for lazy loading
    this.setupLazyLoading();
    
    // Set up prefetching on hover
    this.setupPrefetching();
  },

  // Override loadChannelMessages with virtual scrolling
  loadChannelMessages(channel) {
    // Get messages from cache or fetch
    const messages = this.getCachedMessages(channel) || this.getDemoMessages(channel);
    
    // Store in cache
    this.cacheMessages(channel, messages);
    
    // Use virtual scrolling for large message lists
    if (messages.length > 50) {
      this.displayMessagesVirtual(messages);
    } else {
      this.displayMessages(messages);
    }
  },

  // Display messages with virtual scrolling
  displayMessagesVirtual(messages) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    // Set up virtual scrolling
    this.performance.virtualScroller = window.SocialFeedPerformance.setupVirtualScrolling(
      container,
      messages,
      (message) => this.createOptimizedMessageElement(message)
    );
  },

  // Create optimized message element
  createOptimizedMessageElement(message) {
    // Use template for better performance
    if (!this.messageTemplate) {
      this.messageTemplate = document.createElement('template');
      this.messageTemplate.innerHTML = `
        <div class="discord-message" data-message-id="">
          <div class="message-avatar" data-lazy></div>
          <div class="message-content-wrapper">
            <div class="message-header">
              <span class="message-author"></span>
              <span class="message-timestamp"></span>
            </div>
            <div class="message-text"></div>
            <div class="message-reactions"></div>
          </div>
        </div>
      `;
    }
    
    // Clone template
    const element = this.messageTemplate.content.cloneNode(true).firstElementChild;
    
    // Set data
    element.dataset.messageId = message.id;
    element.querySelector('.message-author').textContent = message.author.name;
    element.querySelector('.message-timestamp').textContent = this.formatTimestamp(message.timestamp);
    element.querySelector('.message-text').textContent = message.message;
    
    // Lazy load avatar
    const avatarEl = element.querySelector('.message-avatar');
    avatarEl.dataset.avatar = message.author.avatar;
    
    // Defer non-critical rendering
    requestIdleCallback(() => {
      // Add reactions if any
      if (message.reactions && message.reactions.length > 0) {
        this.renderReactionsOptimized(element, message.reactions);
      }
    });
    
    return element;
  },

  // Optimized reaction rendering
  renderReactionsOptimized(element, reactions) {
    const reactionsContainer = element.querySelector('.message-reactions');
    const fragment = document.createDocumentFragment();
    
    reactions.forEach(reaction => {
      const reactionEl = document.createElement('div');
      reactionEl.className = 'reaction';
      reactionEl.innerHTML = `
        <span class="reaction-emoji">${reaction.emoji}</span>
        <span class="reaction-count">${reaction.count}</span>
      `;
      fragment.appendChild(reactionEl);
    });
    
    reactionsContainer.appendChild(fragment);
  },

  // Cache messages in memory and IndexedDB
  async cacheMessages(channel, messages) {
    // Memory cache
    this.performance.messageCache.set(channel, {
      messages,
      timestamp: Date.now()
    });
    
    // IndexedDB cache
    await window.SocialFeedPerformance.storeInDB('messages', messages);
    
    // localStorage for quick access (limited to recent messages)
    const recentMessages = messages.slice(-50);
    try {
      localStorage.setItem(`social-messages-${channel}`, JSON.stringify({
        messages: recentMessages,
        timestamp: Date.now()
      }));
    } catch (e) {
      // Handle quota exceeded
      console.warn('localStorage quota exceeded');
    }
  },

  // Get cached messages
  getCachedMessages(channel) {
    // Check memory cache first
    const cached = this.performance.messageCache.get(channel);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.messages;
    }
    
    // Check localStorage
    try {
      const stored = localStorage.getItem(`social-messages-${channel}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < 300000) {
          return parsed.messages;
        }
      }
    } catch (e) {
      console.error('Error reading from localStorage:', e);
    }
    
    return null;
  },

  // Set up lazy loading for avatars and images
  setupLazyLoading() {
    this.performance.imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          // Load avatar
          if (element.dataset.avatar) {
            element.textContent = element.dataset.avatar;
            delete element.dataset.avatar;
          }
          
          // Load image
          if (element.dataset.src) {
            const img = new Image();
            img.onload = () => {
              element.style.backgroundImage = `url(${element.dataset.src})`;
              element.classList.add('loaded');
            };
            img.src = element.dataset.src;
            delete element.dataset.src;
          }
          
          this.performance.imageObserver.unobserve(element);
        }
      });
    }, {
      rootMargin: '50px'
    });
    
    // Observe existing lazy elements
    document.querySelectorAll('[data-lazy]').forEach(el => {
      this.performance.imageObserver.observe(el);
    });
  },

  // Set up prefetching on hover
  setupPrefetching() {
    // Prefetch channel data on hover
    document.addEventListener('mouseenter', async (e) => {
      const channelEl = e.target.closest('.channel-item');
      if (channelEl && channelEl.dataset.channel) {
        const channel = channelEl.dataset.channel;
        if (!this.getCachedMessages(channel)) {
          // Prefetch in background
          this.prefetchChannel(channel);
        }
      }
    }, true);
    
    // Prefetch marketplace on tab hover
    const marketplaceTab = document.querySelector('[data-view="marketplace"]');
    if (marketplaceTab) {
      marketplaceTab.addEventListener('mouseenter', () => {
        this.prefetchMarketplace();
      }, { once: true });
    }
  },

  // Prefetch channel data
  async prefetchChannel(channel) {
    try {
      const messages = await this.fetchChannelMessages(channel);
      this.cacheMessages(channel, messages);
    } catch (e) {
      console.error('Error prefetching channel:', e);
    }
  },

  // Prefetch marketplace data
  async prefetchMarketplace() {
    try {
      const items = await this.fetchMarketplaceItems();
      await window.SocialFeedPerformance.storeInDB('marketplace', items);
    } catch (e) {
      console.error('Error prefetching marketplace:', e);
    }
  },

  // Fetch channel messages (mock API call)
  async fetchChannelMessages(channel) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.getDemoMessages(channel);
  },

  // Fetch marketplace items (mock API call)
  async fetchMarketplaceItems() {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.getDemoMarketplaceItems();
  },

  // Set up idle updates for non-critical tasks
  setupIdleUpdates() {
    // Queue non-critical updates
    this.queueUpdate = (update) => {
      this.performance.renderQueue.push(update);
      this.processUpdateQueue();
    };
    
    // Process queue when idle
    this.processUpdateQueue = () => {
      if (this.performance.renderQueue.length === 0) return;
      
      if ('requestIdleCallback' in window) {
        requestIdleCallback((deadline) => {
          while (this.performance.renderQueue.length > 0 && deadline.timeRemaining() > 0) {
            const update = this.performance.renderQueue.shift();
            update();
          }
          
          // Continue if more updates
          if (this.performance.renderQueue.length > 0) {
            this.processUpdateQueue();
          }
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          const update = this.performance.renderQueue.shift();
          if (update) update();
          if (this.performance.renderQueue.length > 0) {
            this.processUpdateQueue();
          }
        }, 16);
      }
    };
  },

  // Override sendMessage with optimistic updates
  async sendMessage() {
    const input = document.getElementById('messageInput');
    if (!input || !input.value.trim()) return;
    
    const message = input.value.trim();
    input.value = '';
    
    // Create message object
    const newMessage = {
      id: Date.now(),
      author: {
        name: localStorage.getItem('userName') || 'Anonymous',
        avatar: this.getInitials(localStorage.getItem('userName') || 'AN'),
        userId: this.currentUserId
      },
      message,
      timestamp: new Date(),
      reactions: [],
      pending: true // Mark as pending
    };
    
    // Optimistic update - add to UI immediately
    this.addMessageOptimistic(newMessage);
    
    // Send via WebSocket
    try {
      await this.sendMessageToServer(newMessage);
      // Remove pending status
      this.updateMessageStatus(newMessage.id, 'sent');
    } catch (error) {
      // Mark as failed and queue for retry
      this.updateMessageStatus(newMessage.id, 'failed');
      this.queueMessageForRetry(newMessage);
    }
  },

  // Add message optimistically
  addMessageOptimistic(message) {
    // Add to cache
    const messages = this.messages.get(this.currentChannel) || [];
    messages.push(message);
    this.messages.set(this.currentChannel, messages);
    
    // Add to UI
    if (this.performance.virtualScroller) {
      // Update virtual scroller
      this.performance.virtualScroller.update(messages);
      this.performance.virtualScroller.scrollToBottom();
    } else {
      // Regular append
      this.appendMessage(message);
    }
  },

  // Update message status
  updateMessageStatus(messageId, status) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
      messageEl.dataset.status = status;
      
      // Update visual indicator
      if (status === 'failed') {
        messageEl.classList.add('message-failed');
      } else {
        messageEl.classList.remove('message-failed');
      }
    }
  },

  // Queue message for retry when back online
  async queueMessageForRetry(message) {
    // Store in IndexedDB for background sync
    const db = await this.openMessageQueue();
    const transaction = db.transaction(['pending'], 'readwrite');
    const store = transaction.objectStore('pending');
    store.put(message);
    
    // Register background sync
    if ('sync' in self.registration) {
      await self.registration.sync.register('send-messages');
    }
  },

  // Get demo marketplace items
  getDemoMarketplaceItems() {
    return [
      {
        id: 1,
        category: 'equipment-sale',
        title: 'Nike Basketball Shoes - Size 10',
        description: 'Barely used Nike Zoom Freak 3, excellent condition',
        price: '$80',
        sport: 'basketball',
        location: 'vancouver',
        seller: 'Alex Chen',
        image: '🏀',
        posted: new Date(Date.now() - (1000 * 60 * 60 * 2))
      },
      // ... more items
    ];
  },

  // Clean up when leaving page
  cleanup() {
    if (this.performance.virtualScroller) {
      this.performance.virtualScroller = null;
    }
    
    if (this.performance.imageObserver) {
      this.performance.imageObserver.disconnect();
    }
    
    // Clear render queue
    this.performance.renderQueue = [];
  }
};

// Replace the default social feed with optimized version
window.SocialFeedPage = window.SocialFeedOptimized;