// Mobile-optimized Social Feed Enhancements
window.SocialFeedMobile = {
  // Touch gesture configuration
  touchConfig: {
    swipeThreshold: 50, // Minimum distance for swipe detection
    swipeVelocity: 0.3, // Minimum velocity for swipe
    tapTimeout: 300, // Max time for tap gesture
    doubleTapTimeout: 500, // Max time between taps for double tap
    longPressTime: 500, // Time for long press gesture
    momentumMultiplier: 0.95, // Momentum scrolling decay
    rubberBandFactor: 0.15 // iOS-style rubber band effect
  },

  // Touch state tracking
  touchState: {
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTapTime: 0,
    isScrolling: false,
    isSwiping: false,
    currentTab: 0,
    velocity: { x: 0, y: 0 },
    lastMoveTime: 0,
    momentum: null
  },

  // Mobile detection
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.matchMedia('(max-width: 768px)').matches ||
           ('ontouchstart' in window);
  },

  // Initialize mobile enhancements
  initialize() {
    if (!this.isMobile()) return;

    // Add mobile-specific classes
    document.body.classList.add('social-feed-mobile');
    
    // Initialize touch handlers
    this.initializeTouchHandlers();
    
    // Optimize viewport
    this.optimizeViewport();
    
    // Add mobile UI elements
    this.addMobileUI();
    
    // Enable momentum scrolling
    this.enableMomentumScrolling();
    
    // Setup intersection observer for lazy loading
    this.setupLazyLoading();
    
    // Add haptic feedback support
    this.initializeHaptics();
    
    // Battery optimization
    this.optimizeForBattery();
  },

  // Initialize touch event handlers
  initializeTouchHandlers() {
    const container = document.querySelector('.discord-container');
    if (!container) return;

    // Touch start
    container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    
    // Touch move
    container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    
    // Touch end
    container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    
    // Prevent default pull-to-refresh on Chrome
    document.body.style.overscrollBehavior = 'none';
  },

  // Handle touch start
  handleTouchStart(e) {
    const touch = e.touches[0];
    this.touchState.startX = touch.clientX;
    this.touchState.startY = touch.clientY;
    this.touchState.startTime = Date.now();
    this.touchState.isScrolling = false;
    this.touchState.isSwiping = false;
    
    // Cancel any ongoing momentum
    if (this.touchState.momentum) {
      cancelAnimationFrame(this.touchState.momentum);
      this.touchState.momentum = null;
    }

    // Check for double tap
    const timeSinceLastTap = Date.now() - this.touchState.lastTapTime;
    if (timeSinceLastTap < this.touchConfig.doubleTapTimeout) {
      this.handleDoubleTap(e);
    }
    
    // Long press detection
    this.longPressTimer = setTimeout(() => {
      this.handleLongPress(e);
    }, this.touchConfig.longPressTime);
  },

  // Handle touch move
  handleTouchMove(e) {
    if (!this.touchState.startTime) return;

    clearTimeout(this.longPressTimer);

    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchState.startX;
    const deltaY = touch.clientY - this.touchState.startY;
    const currentTime = Date.now();
    
    // Calculate velocity
    if (this.touchState.lastMoveTime) {
      const timeDelta = currentTime - this.touchState.lastMoveTime;
      this.touchState.velocity.x = deltaX / timeDelta;
      this.touchState.velocity.y = deltaY / timeDelta;
    }
    
    this.touchState.lastMoveTime = currentTime;

    // Determine scroll or swipe
    if (!this.touchState.isScrolling && !this.touchState.isSwiping) {
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        this.touchState.isScrolling = true;
      } else if (Math.abs(deltaX) > 10) {
        this.touchState.isSwiping = true;
        e.preventDefault();
      }
    }

    // Handle horizontal swipe for tab switching
    if (this.touchState.isSwiping) {
      this.handleSwipeMove(deltaX);
    }
    
    // Add rubber band effect at scroll boundaries
    if (this.touchState.isScrolling) {
      this.handleScrollMove(e, deltaY);
    }
  },

  // Handle touch end
  handleTouchEnd(e) {
    clearTimeout(this.longPressTimer);

    const deltaX = e.changedTouches[0].clientX - this.touchState.startX;
    const deltaY = e.changedTouches[0].clientY - this.touchState.startY;
    const duration = Date.now() - this.touchState.startTime;

    // Handle tap
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && duration < this.touchConfig.tapTimeout) {
      this.handleTap(e);
      this.touchState.lastTapTime = Date.now();
    }

    // Handle swipe completion
    if (this.touchState.isSwiping && Math.abs(deltaX) > this.touchConfig.swipeThreshold) {
      this.completeSwipe(deltaX);
    } else if (this.touchState.isSwiping) {
      // Snap back if swipe wasn't completed
      this.snapBack();
    }

    // Apply momentum scrolling
    if (this.touchState.isScrolling && Math.abs(this.touchState.velocity.y) > 0.1) {
      this.applyMomentum();
    }

    // Reset touch state
    this.touchState.startTime = 0;
    this.touchState.isScrolling = false;
    this.touchState.isSwiping = false;
  },

  // Handle swipe movement
  handleSwipeMove(deltaX) {
    const tabContainer = document.querySelector('.mobile-tab-container');
    if (!tabContainer) return;

    // Apply transform with resistance at edges
    const resistance = this.calculateResistance(deltaX);
    const transform = deltaX * resistance;
    
    tabContainer.style.transform = `translateX(${transform}px)`;
    tabContainer.style.transition = 'none';
  },

  // Calculate edge resistance
  calculateResistance(delta) {
    const tabWidth = window.innerWidth;
    const currentOffset = this.touchState.currentTab * tabWidth;
    
    // Apply resistance at edges
    if ((this.touchState.currentTab === 0 && delta > 0) || 
        (this.touchState.currentTab === 2 && delta < 0)) {
      return this.touchConfig.rubberBandFactor;
    }
    
    return 1;
  },

  // Complete swipe gesture
  completeSwipe(deltaX) {
    const tabContainer = document.querySelector('.mobile-tab-container');
    if (!tabContainer) return;

    // Determine new tab
    if (deltaX < -this.touchConfig.swipeThreshold && this.touchState.currentTab < 2) {
      this.touchState.currentTab++;
    } else if (deltaX > this.touchConfig.swipeThreshold && this.touchState.currentTab > 0) {
      this.touchState.currentTab--;
    }

    // Animate to new position
    this.animateToTab(this.touchState.currentTab);
    
    // Provide haptic feedback
    this.triggerHaptic('light');
  },

  // Animate to specific tab
  animateToTab(tabIndex) {
    const tabContainer = document.querySelector('.mobile-tab-container');
    const tabButtons = document.querySelectorAll('.mobile-tab-button');
    if (!tabContainer) return;

    const offset = -tabIndex * 100;
    tabContainer.style.transform = `translateX(${offset}%)`;
    tabContainer.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    // Update tab buttons
    tabButtons.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === tabIndex);
    });
    
    // Update current view
    if (tabIndex === 0) {
      window.SocialFeedPage.currentView = 'chat';
    } else if (tabIndex === 1) {
      window.SocialFeedPage.currentView = 'marketplace';
    }
    
    // Load content if needed
    this.loadTabContent(tabIndex);
  },

  // Add mobile-specific UI elements
  addMobileUI() {
    // Add mobile tab bar
    const tabBar = document.createElement('div');
    tabBar.className = 'mobile-tab-bar';
    tabBar.innerHTML = `
      <button class="mobile-tab-button active" onclick="window.SocialFeedMobile.switchToTab(0)">
        <span class="tab-icon">💬</span>
        <span class="tab-label">Chat</span>
      </button>
      <button class="mobile-tab-button" onclick="window.SocialFeedMobile.switchToTab(1)">
        <span class="tab-icon">🛒</span>
        <span class="tab-label">Market</span>
      </button>
      <button class="mobile-tab-button" onclick="window.SocialFeedMobile.switchToTab(2)">
        <span class="tab-icon">👥</span>
        <span class="tab-label">Online</span>
      </button>
    `;

    // Add floating action button for quick actions
    const fab = document.createElement('button');
    fab.className = 'mobile-fab';
    fab.innerHTML = '✏️';
    fab.onclick = () => this.showQuickActions();

    // Add pull-to-refresh indicator
    const refreshIndicator = document.createElement('div');
    refreshIndicator.className = 'mobile-refresh-indicator';
    refreshIndicator.innerHTML = `
      <div class="refresh-spinner"></div>
      <span>Pull to refresh</span>
    `;

    // Insert elements
    const container = document.querySelector('.discord-container');
    if (container) {
      container.appendChild(tabBar);
      container.appendChild(fab);
      container.prepend(refreshIndicator);
    }

    // Add swipe hint on first load
    if (!localStorage.getItem('swipeHintShown')) {
      this.showSwipeHint();
    }
  },

  // Switch to specific tab
  switchToTab(index) {
    this.touchState.currentTab = index;
    this.animateToTab(index);
  },

  // Show swipe hint for first-time users
  showSwipeHint() {
    const hint = document.createElement('div');
    hint.className = 'mobile-swipe-hint';
    hint.innerHTML = `
      <div class="hint-content">
        <span class="hint-icon">👆</span>
        <span class="hint-text">Swipe left or right to switch tabs</span>
      </div>
    `;
    
    document.body.appendChild(hint);
    
    setTimeout(() => {
      hint.classList.add('show');
    }, 500);
    
    setTimeout(() => {
      hint.classList.remove('show');
      setTimeout(() => hint.remove(), 300);
      localStorage.setItem('swipeHintShown', 'true');
    }, 3000);
  },

  // Enable momentum scrolling
  enableMomentumScrolling() {
    const scrollContainers = document.querySelectorAll('.messages-container, .marketplace-grid, .online-users-list');
    
    scrollContainers.forEach(container => {
      // Add iOS-style scrolling
      container.style.webkitOverflowScrolling = 'touch';
      container.style.overflowY = 'auto';
      
      // Add scroll indicators
      this.addScrollIndicators(container);
    });
  },

  // Add scroll indicators
  addScrollIndicators(container) {
    const indicator = document.createElement('div');
    indicator.className = 'mobile-scroll-indicator';
    
    container.addEventListener('scroll', () => {
      const scrollPercentage = (container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100;
      indicator.style.height = `${scrollPercentage}%`;
    });
    
    container.appendChild(indicator);
  },

  // Apply momentum after scroll
  applyMomentum() {
    const velocity = this.touchState.velocity.y;
    let currentVelocity = velocity;
    
    const animate = () => {
      currentVelocity *= this.touchConfig.momentumMultiplier;
      
      if (Math.abs(currentVelocity) > 0.1) {
        const container = document.querySelector('.messages-container');
        if (container) {
          container.scrollTop -= currentVelocity * 16; // 60fps
        }
        
        this.touchState.momentum = requestAnimationFrame(animate);
      }
    };
    
    animate();
  },

  // Handle double tap
  handleDoubleTap(e) {
    const target = e.target;
    
    // Double tap on message to react
    const message = target.closest('.discord-message');
    if (message) {
      this.quickReact(message);
      this.triggerHaptic('medium');
    }
  },

  // Quick react to message
  quickReact(messageEl) {
    const messageId = messageEl.dataset.messageId;
    if (messageId && !window.isGuest) {
      window.SocialFeedPage.toggleReaction(messageId, '👍');
      
      // Show reaction animation
      this.showReactionAnimation(messageEl, '👍');
    }
  },

  // Show reaction animation
  showReactionAnimation(element, emoji) {
    const animation = document.createElement('div');
    animation.className = 'mobile-reaction-animation';
    animation.textContent = emoji;
    
    const rect = element.getBoundingClientRect();
    animation.style.left = `${rect.left + rect.width / 2}px`;
    animation.style.top = `${rect.top + rect.height / 2}px`;
    
    document.body.appendChild(animation);
    
    setTimeout(() => animation.remove(), 1000);
  },

  // Handle long press
  handleLongPress(e) {
    const target = e.target;
    
    // Long press on message for options
    const message = target.closest('.discord-message');
    if (message) {
      e.preventDefault();
      this.showMessageOptions(message);
      this.triggerHaptic('heavy');
    }
  },

  // Show message options
  showMessageOptions(messageEl) {
    const options = document.createElement('div');
    options.className = 'mobile-message-options';
    options.innerHTML = `
      <div class="options-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="options-menu">
        <button class="option-item" onclick="window.SocialFeedMobile.copyMessage('${messageEl.dataset.messageId}')">
          <span class="option-icon">📋</span> Copy
        </button>
        <button class="option-item" onclick="window.SocialFeedMobile.replyToMessage('${messageEl.dataset.messageId}')">
          <span class="option-icon">↩️</span> Reply
        </button>
        <button class="option-item" onclick="window.SocialFeedMobile.shareMessage('${messageEl.dataset.messageId}')">
          <span class="option-icon">🔗</span> Share
        </button>
        ${window.isGuest ? '' : `
          <button class="option-item" onclick="window.SocialFeedMobile.reportMessage('${messageEl.dataset.messageId}')">
            <span class="option-icon">🚫</span> Report
          </button>
        `}
      </div>
    `;
    
    document.body.appendChild(options);
    
    // Animate in
    requestAnimationFrame(() => {
      options.classList.add('show');
    });
  },

  // Copy message content
  copyMessage(messageId) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
      const text = messageEl.querySelector('.message-text').textContent;
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.showToast('Message copied');
        });
      }
    }
    
    document.querySelector('.mobile-message-options')?.remove();
  },

  // Reply to message
  replyToMessage(messageId) {
    if (window.isGuest) {
      window.SocialFeedPage.showFeedback('Sign in to reply', 'info');
      return;
    }
    
    const input = document.getElementById('messageInput');
    if (input) {
      input.focus();
      input.value = `@reply_${messageId} `;
    }
    
    document.querySelector('.mobile-message-options')?.remove();
  },

  // Share message
  shareMessage(messageId) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl && navigator.share) {
      const text = messageEl.querySelector('.message-text').textContent;
      
      navigator.share({
        title: 'FindingSports Message',
        text: text,
        url: window.location.href
      });
    }
    
    document.querySelector('.mobile-message-options')?.remove();
  },

  // Show quick actions
  showQuickActions() {
    const actions = document.createElement('div');
    actions.className = 'mobile-quick-actions';
    actions.innerHTML = `
      <div class="actions-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="actions-grid">
        <button class="action-item" onclick="window.SocialFeedMobile.startNewChat()">
          <span class="action-icon">💬</span>
          <span class="action-label">New Chat</span>
        </button>
        <button class="action-item" onclick="window.SocialFeedMobile.createListing()">
          <span class="action-icon">📝</span>
          <span class="action-label">Create Listing</span>
        </button>
        <button class="action-item" onclick="window.SocialFeedMobile.findGame()">
          <span class="action-icon">🏀</span>
          <span class="action-label">Find Game</span>
        </button>
        <button class="action-item" onclick="window.SocialFeedMobile.switchChannel()">
          <span class="action-icon">📱</span>
          <span class="action-label">Switch Channel</span>
        </button>
      </div>
    `;
    
    document.body.appendChild(actions);
    
    requestAnimationFrame(() => {
      actions.classList.add('show');
    });
    
    this.triggerHaptic('light');
  },

  // Optimize viewport for mobile
  optimizeViewport() {
    // Prevent zoom on input focus
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        document.querySelector('meta[name="viewport"]').setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
      });
      
      input.addEventListener('blur', () => {
        document.querySelector('meta[name="viewport"]').setAttribute('content', 
          'width=device-width, initial-scale=1.0');
      });
    });
    
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      this.handleOrientationChange();
    });
  },

  // Handle orientation change
  handleOrientationChange() {
    const orientation = window.orientation;
    document.body.classList.toggle('landscape', Math.abs(orientation) === 90);
    
    // Adjust UI for landscape
    if (Math.abs(orientation) === 90) {
      this.optimizeForLandscape();
    } else {
      this.optimizeForPortrait();
    }
  },

  // Setup lazy loading for performance
  setupLazyLoading() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadContent(entry.target);
        }
      });
    }, {
      rootMargin: '50px'
    });
    
    // Observe messages and marketplace items
    document.querySelectorAll('.discord-message, .marketplace-card').forEach(el => {
      observer.observe(el);
    });
  },

  // Initialize haptic feedback
  initializeHaptics() {
    // Check if haptic feedback is supported
    this.hapticSupported = 'vibrate' in navigator;
  },

  // Trigger haptic feedback
  triggerHaptic(style = 'light') {
    if (!this.hapticSupported) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      warning: [30, 10, 30],
      error: [50, 10, 50, 10, 50]
    };
    
    navigator.vibrate(patterns[style] || patterns.light);
  },

  // Optimize for battery
  optimizeForBattery() {
    // Reduce animations when battery is low
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        if (battery.level < 0.2) {
          document.body.classList.add('reduce-motion');
          this.reducedMotion = true;
        }
        
        battery.addEventListener('levelchange', () => {
          const lowBattery = battery.level < 0.2;
          document.body.classList.toggle('reduce-motion', lowBattery);
          this.reducedMotion = lowBattery;
        });
      });
    }
  },

  // Show toast notification
  showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className = 'mobile-toast';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Clean up
  destroy() {
    // Remove event listeners
    const container = document.querySelector('.discord-container');
    if (container) {
      container.removeEventListener('touchstart', this.handleTouchStart);
      container.removeEventListener('touchmove', this.handleTouchMove);
      container.removeEventListener('touchend', this.handleTouchEnd);
    }
    
    // Clear timers
    clearTimeout(this.longPressTimer);
    if (this.touchState.momentum) {
      cancelAnimationFrame(this.touchState.momentum);
    }
  }
};

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', () => {
  window.SocialFeedMobile.initialize();
});

// Reinitialize on page visibility change
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.SocialFeedMobile.isMobile()) {
    window.SocialFeedMobile.initialize();
  }
});