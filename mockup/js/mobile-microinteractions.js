/**
 * Mobile-Specific Microinteractions
 * Enhanced touch gestures, haptic patterns, and mobile-optimized feedback
 */

class MobileMicrointeractions {
  constructor() {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.supportsHaptic = 'vibrate' in navigator;
    this.gestureHandlers = new Map();
    
    if (this.isMobile || this.supportsTouch) {
      this.init();
    }
  }

  init() {
    this.setupTouchFeedback();
    this.setupSwipeGestures();
    this.setupPinchZoom();
    this.setupLongPress();
    this.setupDoubleTap();
    this.setupPullToRefresh();
    this.enhanceMobileButtons();
    this.setupMobileNotifications();
  }

  // Enhanced touch feedback for all interactive elements
  setupTouchFeedback() {
    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest('button, .btn, .clickable, .game-card, .tab-button, a');
      if (target) {
        // Immediate haptic feedback
        this.triggerCustomHaptic('tap');
        
        // Visual feedback
        target.classList.add('touch-active');
        target.style.transform = 'scale(0.97)';
        
        // Store original styles
        target.dataset.originalTransform = target.style.transform;
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const target = e.target.closest('button, .btn, .clickable, .game-card, .tab-button, a');
      if (target) {
        setTimeout(() => {
          target.classList.remove('touch-active');
          target.style.transform = target.dataset.originalTransform || '';
        }, 100);
      }
    }, { passive: true });

    // Handle touch cancel
    document.addEventListener('touchcancel', (e) => {
      const target = e.target.closest('button, .btn, .clickable, .game-card, .tab-button, a');
      if (target) {
        target.classList.remove('touch-active');
        target.style.transform = target.dataset.originalTransform || '';
      }
    }, { passive: true });
  }

  // Swipe gesture detection
  setupSwipeGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const minSwipeDistance = 50;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].clientX;
      touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      // Determine swipe direction
      if (absX > minSwipeDistance || absY > minSwipeDistance) {
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            this.handleSwipe('right', e);
          } else {
            this.handleSwipe('left', e);
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            this.handleSwipe('down', e);
          } else {
            this.handleSwipe('up', e);
          }
        }
      }
    }, { passive: true });
  }

  // Handle swipe actions
  handleSwipe(direction, event) {
    const target = event.target;
    
    // Tab navigation with swipe
    if (target.closest('.tab-container')) {
      if (direction === 'left' || direction === 'right') {
        this.triggerCustomHaptic('swipe');
        this.animateTabSwipe(direction);
      }
    }
    
    // Game card swipe actions
    if (target.closest('.game-card')) {
      const card = target.closest('.game-card');
      if (direction === 'left') {
        this.showCardActions(card, 'left');
      } else if (direction === 'right') {
        this.showCardActions(card, 'right');
      }
    }
    
    // Notify listeners
    this.gestureHandlers.forEach((handler, key) => {
      if (key.startsWith('swipe')) {
        handler(direction, event);
      }
    });
  }

  // Pinch zoom for maps
  setupPinchZoom() {
    let initialDistance = 0;
    let currentScale = 1;
    
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2 && e.target.closest('#map')) {
        initialDistance = this.getDistance(e.touches[0], e.touches[1]);
      }
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && e.target.closest('#map')) {
        const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialDistance;
        
        if (Math.abs(scale - currentScale) > 0.1) {
          currentScale = scale;
          this.triggerCustomHaptic('zoom');
        }
      }
    }, { passive: true });
  }

  // Long press detection
  setupLongPress() {
    let longPressTimer;
    const longPressDuration = 500;
    
    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest('.game-card, .venue-card');
      if (target) {
        longPressTimer = setTimeout(() => {
          this.triggerCustomHaptic('longPress');
          this.showContextMenu(target, e);
        }, longPressDuration);
      }
    }, { passive: true });
    
    document.addEventListener('touchend', () => {
      clearTimeout(longPressTimer);
    }, { passive: true });
    
    document.addEventListener('touchmove', () => {
      clearTimeout(longPressTimer);
    }, { passive: true });
  }

  // Double tap detection
  setupDoubleTap() {
    let lastTap = 0;
    const doubleTapDelay = 300;
    
    document.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < doubleTapDelay && tapLength > 0) {
        e.preventDefault();
        this.handleDoubleTap(e);
      }
      
      lastTap = currentTime;
    });
  }

  // Handle double tap actions
  handleDoubleTap(event) {
    const target = event.target;
    
    // Double tap to favorite
    if (target.closest('.game-card')) {
      this.triggerCustomHaptic('doubleTap');
      this.toggleFavorite(target.closest('.game-card'));
    }
    
    // Double tap to zoom map
    if (target.closest('#map')) {
      this.triggerCustomHaptic('zoom');
      // Trigger map zoom
    }
  }

  // Pull to refresh implementation
  setupPullToRefresh() {
    let startY = 0;
    let currentY = 0;
    let refreshing = false;
    const threshold = 80;
    
    // Create refresh indicator
    const refreshIndicator = document.createElement('div');
    refreshIndicator.className = 'pull-to-refresh-indicator';
    refreshIndicator.innerHTML = `
      <div class="ptr-spinner">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M12 2v4m0 12v4m10-10h-4M6 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="ptr-text">Pull to refresh</div>
    `;
    refreshIndicator.style.cssText = `
      position: fixed;
      top: -60px;
      left: 50%;
      transform: translateX(-50%);
      transition: top 0.3s ease;
      background: white;
      padding: 12px 24px;
      border-radius: 24px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    document.body.appendChild(refreshIndicator);
    
    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0 && !refreshing) {
        startY = e.touches[0].pageY;
      }
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      if (startY > 0 && !refreshing) {
        currentY = e.touches[0].pageY;
        const diff = currentY - startY;
        
        if (diff > 0) {
          // Show indicator
          const progress = Math.min(diff / threshold, 1);
          refreshIndicator.style.top = `${Math.min(diff - 60, 20)}px`;
          
          if (progress >= 1) {
            refreshIndicator.querySelector('.ptr-text').textContent = 'Release to refresh';
            this.triggerCustomHaptic('impact');
          }
        }
      }
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      if (startY > 0 && !refreshing) {
        const diff = currentY - startY;
        
        if (diff > threshold) {
          refreshing = true;
          refreshIndicator.querySelector('.ptr-text').textContent = 'Refreshing...';
          refreshIndicator.querySelector('.ptr-spinner').style.animation = 'spin 1s linear infinite';
          
          // Trigger refresh
          this.performRefresh().then(() => {
            refreshIndicator.style.top = '-60px';
            refreshIndicator.querySelector('.ptr-spinner').style.animation = '';
            refreshing = false;
          });
        } else {
          refreshIndicator.style.top = '-60px';
        }
      }
      
      startY = 0;
      currentY = 0;
    }, { passive: true });
  }

  // Custom haptic patterns
  triggerCustomHaptic(type) {
    if (!this.supportsHaptic) return;
    
    const patterns = {
      tap: [10],
      doubleTap: [10, 50, 10],
      longPress: [20, 100, 20],
      swipe: [5, 10, 5],
      impact: [30],
      zoom: [5, 5, 5, 5],
      success: [10, 30, 10, 30, 10],
      error: [50, 100, 50],
      notification: [25, 50, 25, 50, 25],
      selection: [15, 10, 15]
    };
    
    const pattern = patterns[type] || patterns.tap;
    navigator.vibrate(pattern);
  }

  // Enhanced mobile buttons
  enhanceMobileButtons() {
    // Add 3D touch effect to buttons
    const buttons = document.querySelectorAll('button, .btn');
    
    buttons.forEach(button => {
      let force = 0;
      
      button.addEventListener('touchforcechange', (e) => {
        force = e.touches[0].force;
        const scale = 1 - (force * 0.1);
        button.style.transform = `scale(${scale})`;
        
        // Trigger haptic based on force
        if (force > 0.5 && force < 0.6) {
          this.triggerCustomHaptic('tap');
        }
      });
      
      button.addEventListener('touchend', () => {
        button.style.transform = '';
      });
    });
  }

  // Mobile-optimized notifications
  setupMobileNotifications() {
    // Override notification method for mobile
    if (window.microinteractions) {
      const originalNotification = window.microinteractions.notification;
      
      window.microinteractions.notification = (message, type = 'info') => {
        // Call original
        originalNotification.call(window.microinteractions, message, type);
        
        // Add mobile-specific feedback
        this.triggerCustomHaptic('notification');
        
        // Show native-style toast
        this.showMobileToast(message, type);
      };
    }
  }

  // Show mobile toast notification
  showMobileToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `mobile-toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#333'};
      color: white;
      padding: 12px 24px;
      border-radius: 24px;
      font-size: 14px;
      z-index: 10000;
      transition: transform 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    // Remove after delay
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(100px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Helper methods
  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  showContextMenu(element, event) {
    // Implementation for context menu
    const menu = document.createElement('div');
    menu.className = 'mobile-context-menu';
    menu.innerHTML = `
      <div class="context-menu-item" data-action="share">Share</div>
      <div class="context-menu-item" data-action="favorite">Add to Favorites</div>
      <div class="context-menu-item" data-action="info">More Info</div>
    `;
    
    // Position and show menu
    menu.style.cssText = `
      position: fixed;
      top: ${event.touches[0].clientY}px;
      left: ${event.touches[0].clientX}px;
      transform: translate(-50%, -100%);
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 8px 0;
      z-index: 10000;
    `;
    
    document.body.appendChild(menu);
    
    // Handle menu item clicks
    menu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.triggerCustomHaptic('tap');
        // Handle action
        menu.remove();
      }
    });
    
    // Remove on outside click
    setTimeout(() => {
      document.addEventListener('touchstart', () => menu.remove(), { once: true });
    }, 100);
  }

  showCardActions(card, direction) {
    this.triggerCustomHaptic('swipe');
    
    if (direction === 'left') {
      // Show delete/hide action
      card.style.transform = 'translateX(-80px)';
      // Show action buttons
    } else if (direction === 'right') {
      // Show favorite/share action
      card.style.transform = 'translateX(80px)';
      // Show action buttons
    }
    
    // Reset after delay
    setTimeout(() => {
      card.style.transform = '';
    }, 2000);
  }

  toggleFavorite(card) {
    const favoriteIcon = card.querySelector('.favorite-icon') || this.createFavoriteIcon(card);
    favoriteIcon.classList.toggle('active');
    
    if (favoriteIcon.classList.contains('active')) {
      // Animate heart
      favoriteIcon.style.animation = 'heartBeat 0.8s ease';
      this.triggerCustomHaptic('success');
    }
  }

  createFavoriteIcon(card) {
    const icon = document.createElement('div');
    icon.className = 'favorite-icon';
    icon.innerHTML = '❤️';
    icon.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 24px;
      opacity: 0.3;
      transition: all 0.3s ease;
    `;
    card.appendChild(icon);
    return icon;
  }

  animateTabSwipe(direction) {
    const tabs = document.querySelectorAll('.tab-button');
    const activeTab = document.querySelector('.tab-button.active');
    
    if (activeTab) {
      const currentIndex = Array.from(tabs).indexOf(activeTab);
      const nextIndex = direction === 'left' ? currentIndex + 1 : currentIndex - 1;
      
      if (nextIndex >= 0 && nextIndex < tabs.length) {
        tabs[nextIndex].click();
      }
    }
  }

  async performRefresh() {
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Trigger actual refresh based on current page
    if (window.PlayNowPage && window.currentPage === 'play-now') {
      window.PlayNowPage.findGames?.();
    }
    
    this.triggerCustomHaptic('success');
  }

  // Public API
  on(event, handler) {
    this.gestureHandlers.set(event, handler);
  }

  off(event) {
    this.gestureHandlers.delete(event);
  }
}

// Initialize mobile microinteractions
window.mobileMicrointeractions = new MobileMicrointeractions();

// Add CSS for mobile interactions
const mobileStyles = document.createElement('style');
mobileStyles.textContent = `
  @keyframes heartBeat {
    0% { transform: scale(1); }
    25% { transform: scale(1.3); }
    35% { transform: scale(1); }
    45% { transform: scale(1.2); }
    55% { transform: scale(1); }
    65% { transform: scale(1.1); }
    75% { transform: scale(1); }
    100% { transform: scale(1); }
  }
  
  .touch-active {
    opacity: 0.8;
  }
  
  .favorite-icon.active {
    opacity: 1 !important;
    color: #e74c3c;
  }
  
  .mobile-context-menu {
    min-width: 150px;
  }
  
  .context-menu-item {
    padding: 12px 20px;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  
  .context-menu-item:active {
    background: #f5f5f5;
  }
  
  .ptr-spinner {
    width: 24px;
    height: 24px;
  }
  
  @media (hover: none) {
    button, .btn, .clickable {
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
  }
`;
document.head.appendChild(mobileStyles);