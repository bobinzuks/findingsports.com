// PWA Handler for Finding Sports
// Manages service worker, offline functionality, and app installation

class PWAHandler {
  constructor() {
    this.deferredPrompt = null;
    this.isOnline = navigator.onLine;
    this.swRegistration = null;
    this.messageQueue = [];
    this.db = null;
    
    this.init();
  }
  
  async init() {
    // Register service worker
    await this.registerServiceWorker();
    
    // Initialize IndexedDB
    await this.initDatabase();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Check online status
    this.updateOnlineStatus();
    
    // Request notification permission
    this.requestNotificationPermission();
  }
  
  // Register service worker
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported');
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      this.swRegistration = registration;
      
      console.log('ServiceWorker registered:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            this.showUpdateNotification();
          }
        });
      });
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', event => {
        this.handleServiceWorkerMessage(event.data);
      });
      
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  }
  
  // Initialize IndexedDB
  async initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FindingSportsDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };
      
      request.onupgradeneeded = event => {
        const db = event.target.result;
        
        // Pending messages store
        if (!db.objectStoreNames.contains('pending_messages')) {
          db.createObjectStore('pending_messages', { keyPath: 'id', autoIncrement: true });
        }
        
        // Cached messages store
        if (!db.objectStoreNames.contains('cached_messages')) {
          const messageStore = db.createObjectStore('cached_messages', { keyPath: 'id' });
          messageStore.createIndex('channel', 'channel', { unique: false });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // User preferences store
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      };
    });
  }
  
  // Set up event listeners
  setupEventListeners() {
    // Online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // App install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });
    
    // App installed
    window.addEventListener('appinstalled', () => {
      console.log('App installed');
      this.hideInstallButton();
      this.trackInstallation();
    });
    
    // Visibility change - sync when app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncMessages();
      }
    });
  }
  
  // Handle online event
  async handleOnline() {
    this.isOnline = true;
    this.updateOnlineStatus();
    
    // Sync queued messages
    await this.syncMessages();
    
    // Notify user
    this.showNotification('Back online', 'Your messages will now be sent');
  }
  
  // Handle offline event
  handleOffline() {
    this.isOnline = false;
    this.updateOnlineStatus();
    
    // Notify user
    this.showNotification('Offline mode', 'Your messages will be sent when you\'re back online');
  }
  
  // Update online status in UI - DISABLED
  updateOnlineStatus() {
    // Online status indicator has been removed from UI
    // Only update chat input placeholder if offline
    if (window.SocialFeedPage && !this.isOnline) {
      const chatInput = document.getElementById('messageInput');
      if (chatInput) {
        chatInput.placeholder = `Offline - messages will be sent later`;
      }
    }
  }
  
  // Queue message for offline sending
  async queueMessage(message) {
    if (!this.db) return;
    
    const tx = this.db.transaction('pending_messages', 'readwrite');
    const store = tx.objectStore('pending_messages');
    
    const queuedMessage = {
      ...message,
      tempId: `temp-${Date.now()}`,
      queuedAt: new Date().toISOString(),
      token: localStorage.getItem('authToken')
    };
    
    await store.add(queuedMessage);
    
    // Register sync if online
    if (this.isOnline && this.swRegistration && 'sync' in this.swRegistration) {
      try {
        await this.swRegistration.sync.register('send-messages');
      } catch (error) {
        console.error('Failed to register sync:', error);
      }
    }
    
    return queuedMessage.tempId;
  }
  
  // Sync messages when online
  async syncMessages() {
    if (!this.db || !this.isOnline) return;
    
    // Trigger service worker sync
    if (this.swRegistration && 'sync' in this.swRegistration) {
      try {
        await this.swRegistration.sync.register('send-messages');
      } catch (error) {
        console.error('Failed to register sync:', error);
      }
    }
  }
  
  // Cache messages for offline viewing
  async cacheMessages(channel, messages) {
    if (!this.db) return;
    
    const tx = this.db.transaction('cached_messages', 'readwrite');
    const store = tx.objectStore('cached_messages');
    
    for (const message of messages) {
      await store.put(message);
    }
  }
  
  // Get cached messages
  async getCachedMessages(channel, limit = 50) {
    if (!this.db) return [];
    
    const tx = this.db.transaction('cached_messages', 'readonly');
    const store = tx.objectStore('cached_messages');
    const index = store.index('channel');
    
    const messages = [];
    const cursor = await index.openCursor(IDBKeyRange.only(channel), 'prev');
    
    return new Promise((resolve) => {
      if (!cursor) {
        resolve([]);
        return;
      }
      
      cursor.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && messages.length < limit) {
          messages.push(cursor.value);
          cursor.continue();
        } else {
          resolve(messages.reverse());
        }
      };
    });
  }
  
  // Show install button
  showInstallButton() {
    const installButton = document.getElementById('installButton');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => this.installApp());
    }
    
    // Show install banner after delay
    setTimeout(() => {
      this.showInstallBanner();
    }, 30000); // 30 seconds
  }
  
  // Hide install button
  hideInstallButton() {
    const installButton = document.getElementById('installButton');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }
  
  // Install app
  async installApp() {
    if (!this.deferredPrompt) return;
    
    // Show the prompt
    this.deferredPrompt.prompt();
    
    // Wait for user choice
    const { outcome } = await this.deferredPrompt.userChoice;
    
    console.log(`User response: ${outcome}`);
    
    // Clear the deferred prompt
    this.deferredPrompt = null;
    
    // Hide install button
    this.hideInstallButton();
  }
  
  // Show install banner
  showInstallBanner() {
    if (!this.deferredPrompt) return;
    
    const banner = document.createElement('div');
    banner.className = 'install-banner';
    banner.innerHTML = `
      <div class="install-banner-content">
        <div class="install-banner-text">
          <h3>Install Finding Sports</h3>
          <p>Install our app for offline access and push notifications</p>
        </div>
        <div class="install-banner-actions">
          <button class="install-btn" onclick="window.pwaHandler.installApp()">Install</button>
          <button class="dismiss-btn" onclick="this.parentElement.parentElement.parentElement.remove()">Not now</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      banner.remove();
    }, 10000);
  }
  
  // Request notification permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'default') {
      // Wait for user interaction before requesting
      document.addEventListener('click', async () => {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          this.subscribeToNotifications();
        }
      }, { once: true });
    } else if (Notification.permission === 'granted') {
      this.subscribeToNotifications();
    }
  }
  
  // Subscribe to push notifications
  async subscribeToNotifications() {
    if (!this.swRegistration) return;
    
    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'YOUR_VAPID_PUBLIC_KEY' // Replace with actual VAPID key
        )
      });
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
    }
  }
  
  // Send subscription to server
  async sendSubscriptionToServer(subscription) {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(subscription)
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }
  
  // Show notification
  showNotification(title, body, options = {}) {
    const notification = document.createElement('div');
    notification.className = 'pwa-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <strong>${title}</strong>
        <p>${body}</p>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // Handle service worker messages
  handleServiceWorkerMessage(data) {
    switch (data.type) {
      case 'message-sent':
        // Update UI to show message was sent
        this.updateMessageStatus(data.data.tempId, data.data.messageId);
        break;
        
      case 'new-messages-available':
        // Show notification about new messages
        this.showNotification('New messages', 'Tap to view new messages');
        break;
        
      default:
        console.log('Unknown message from service worker:', data);
    }
  }
  
  // Update message status in UI
  updateMessageStatus(tempId, messageId) {
    const tempMessage = document.querySelector(`[data-temp-id="${tempId}"]`);
    if (tempMessage) {
      tempMessage.classList.remove('pending');
      tempMessage.classList.add('sent');
      tempMessage.dataset.messageId = messageId;
      delete tempMessage.dataset.tempId;
    }
  }
  
  // Show update notification
  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <p>A new version of Finding Sports is available!</p>
        <button onclick="window.pwaHandler.updateApp()">Update</button>
      </div>
    `;
    
    document.body.appendChild(notification);
  }
  
  // Update app
  updateApp() {
    if (this.swRegistration && this.swRegistration.waiting) {
      // Tell service worker to skip waiting
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload when new service worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }
  
  // Track installation
  trackInstallation() {
    // Analytics tracking
    if (window.gtag) {
      gtag('event', 'app_installed', {
        event_category: 'PWA',
        event_label: 'App installed'
      });
    }
  }
  
  // Utility function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
}

// Initialize PWA handler
window.pwaHandler = new PWAHandler();