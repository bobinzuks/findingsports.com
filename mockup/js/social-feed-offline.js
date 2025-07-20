// Social Feed Offline Enhancement
// Adds offline capabilities to the social feed

window.SocialFeedOffline = {
  // Initialize offline features
  init() {
    // Extend the existing SocialFeedPage with offline capabilities
    this.extendSocialFeed();
    
    // Set up offline UI elements
    this.setupOfflineUI();
    
    // Monitor connection status
    this.monitorConnection();
  },
  
  // Extend SocialFeedPage with offline methods
  extendSocialFeed() {
    const originalSendMessage = window.SocialFeedPage.sendMessage;
    const originalLoadChannelMessages = window.SocialFeedPage.loadChannelMessages;
    
    // Override sendMessage to handle offline
    window.SocialFeedPage.sendMessage = async function() {
      const input = document.getElementById('messageInput');
      if (!input || !input.value.trim()) {
        return;
      }
      
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
        channel: this.currentChannel
      };
      
      // Check if online
      if (navigator.onLine && window.wsClient && window.wsClient.socket) {
        // Online - send normally
        window.wsClient.socket.emit('send-message', {
          channel: this.currentChannel,
          message: newMessage
        });
      } else {
        // Offline - queue message
        newMessage.pending = true;
        newMessage.tempId = `temp-${Date.now()}`;
        
        // Queue in IndexedDB
        if (window.pwaHandler) {
          await window.pwaHandler.queueMessage({
            type: 'chat-message',
            data: newMessage
          });
        }
        
        // Show offline indicator on message
        newMessage.offline = true;
      }
      
      // Add to local messages
      if (!this.messages.has(this.currentChannel)) {
        this.messages.set(this.currentChannel, []);
      }
      this.messages.get(this.currentChannel).push(newMessage);
      
      // Update UI
      this.appendMessage(newMessage);
      
      // Show feedback
      if (!navigator.onLine) {
        window.SocialFeedOffline.showOfflineNotification('Message queued', 'Will be sent when online');
      }
    };
    
    // Override loadChannelMessages to use cache when offline
    window.SocialFeedPage.loadChannelMessages = async function(channel) {
      // Try to load from cache first if offline
      if (!navigator.onLine && window.pwaHandler) {
        const cachedMessages = await window.pwaHandler.getCachedMessages(channel);
        if (cachedMessages.length > 0) {
          this.messages.set(channel, cachedMessages);
          this.displayMessages(cachedMessages);
          
          // Show offline banner
          window.SocialFeedOffline.showOfflineBanner();
          return;
        }
      }
      
      // Otherwise use original method
      return originalLoadChannelMessages.call(this, channel);
    };
    
    // Override appendMessage to show offline indicators
    const originalAppendMessage = window.SocialFeedPage.appendMessage;
    window.SocialFeedPage.appendMessage = function(message) {
      const container = document.getElementById('messagesContainer');
      if (!container) return;
      
      const messageEl = this.createMessageElement(message);
      
      // Add offline indicator if message is pending
      if (message.pending || message.offline) {
        messageEl.classList.add('pending-message');
        messageEl.dataset.tempId = message.tempId;
        
        // Add pending indicator
        const pendingIndicator = document.createElement('div');
        pendingIndicator.className = 'pending-indicator';
        pendingIndicator.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>Sending when online...</span>
        `;
        messageEl.querySelector('.message-content-wrapper').appendChild(pendingIndicator);
      }
      
      container.appendChild(messageEl);
      container.scrollTop = container.scrollHeight;
    };
  },
  
  // Set up offline UI elements
  setupOfflineUI() {
    // Add connection status indicator
    const statusHtml = `
      <div id="connectionStatus" class="connection-status online">
        <span class="status-dot"></span>
        <span class="status-text">Online</span>
      </div>
    `;
    
    // Add to header if it doesn't exist
    if (!document.getElementById('connectionStatus')) {
      const header = document.querySelector('.header-content');
      if (header) {
        header.insertAdjacentHTML('beforeend', statusHtml);
      }
    }
    
    // Add offline styles
    if (!document.getElementById('offlineStyles')) {
      const styles = document.createElement('style');
      styles.id = 'offlineStyles';
      styles.textContent = `
        .connection-status {
          display: flex;
          align-items: center;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          font-size: 12px;
          margin-left: auto;
        }
        
        .connection-status .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 8px;
          background: #43b581;
        }
        
        .connection-status.offline .status-dot {
          background: #ed4245;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .offline-banner {
          background: #f39c12;
          color: white;
          padding: 12px;
          text-align: center;
          font-weight: 500;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          transform: translateY(-100%);
          transition: transform 0.3s ease;
        }
        
        .offline-banner.show {
          transform: translateY(0);
        }
        
        .pending-message {
          opacity: 0.7;
        }
        
        .pending-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #f39c12;
          margin-top: 4px;
        }
        
        .pending-indicator svg {
          animation: spin 2s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .pwa-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #2f3136;
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10000;
          opacity: 0;
          transform: translateY(-20px);
          transition: all 0.3s ease;
        }
        
        .pwa-notification.show {
          opacity: 1;
          transform: translateY(0);
        }
        
        .install-banner {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          padding: 20px;
          max-width: 400px;
          width: 90%;
          z-index: 1000;
          animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100%);
          }
          to {
            transform: translateX(-50%) translateY(0);
          }
        }
        
        .install-banner-content {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .install-banner-text h3 {
          margin: 0 0 4px 0;
          color: #333;
        }
        
        .install-banner-text p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
        
        .install-banner-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .install-btn, .dismiss-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        
        .install-btn {
          background: #f39c12;
          color: white;
        }
        
        .install-btn:hover {
          background: #e67e22;
        }
        
        .dismiss-btn {
          background: transparent;
          color: #666;
        }
        
        .dismiss-btn:hover {
          background: #f5f5f5;
        }
        
        #installButton {
          position: fixed;
          bottom: 80px;
          right: 20px;
          background: #f39c12;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 30px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
          display: none;
          z-index: 999;
          transition: all 0.3s ease;
        }
        
        #installButton:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(243, 156, 18, 0.4);
        }
      `;
      document.head.appendChild(styles);
    }
  },
  
  // Monitor connection status
  monitorConnection() {
    // Update status on load
    this.updateConnectionStatus();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.updateConnectionStatus();
      this.hideOfflineBanner();
      this.syncPendingMessages();
    });
    
    window.addEventListener('offline', () => {
      this.updateConnectionStatus();
      this.showOfflineBanner();
    });
  },
  
  // Update connection status indicator
  updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    if (!statusElement) return;
    
    const isOnline = navigator.onLine;
    statusElement.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
    statusElement.querySelector('.status-text').textContent = isOnline ? 'Online' : 'Offline';
  },
  
  // Show offline banner
  showOfflineBanner() {
    let banner = document.getElementById('offlineBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'offlineBanner';
      banner.className = 'offline-banner';
      banner.innerHTML = `
        <strong>You're offline</strong> - Messages will be sent when connection is restored
      `;
      document.body.appendChild(banner);
    }
    
    setTimeout(() => banner.classList.add('show'), 100);
  },
  
  // Hide offline banner
  hideOfflineBanner() {
    const banner = document.getElementById('offlineBanner');
    if (banner) {
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 300);
    }
  },
  
  // Show offline notification
  showOfflineNotification(title, message) {
    const notification = document.createElement('div');
    notification.className = 'pwa-notification';
    notification.innerHTML = `
      <strong>${title}</strong>
      <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.8;">${message}</p>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },
  
  // Sync pending messages when back online
  async syncPendingMessages() {
    const pendingMessages = document.querySelectorAll('.pending-message');
    
    if (pendingMessages.length > 0) {
      this.showOfflineNotification('Syncing', `Sending ${pendingMessages.length} queued messages...`);
      
      // Trigger PWA sync
      if (window.pwaHandler) {
        await window.pwaHandler.syncMessages();
      }
    }
  },
  
  // Add install button
  addInstallButton() {
    if (!document.getElementById('installButton')) {
      const button = document.createElement('button');
      button.id = 'installButton';
      button.innerHTML = '📱 Install App';
      document.body.appendChild(button);
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.SocialFeedOffline.init();
});