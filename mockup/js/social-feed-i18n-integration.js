// Social Feed i18n Integration Module
// This module enhances the social feed with comprehensive internationalization support

window.SocialFeedI18n = {
  // Initialize i18n integration for social feed
  initialize() {
    // Listen for language changes
    window.addEventListener('languageChanged', (e) => {
      this.onLanguageChanged(e.detail);
    });
    
    // Enhance social feed with i18n
    this.enhanceSocialFeed();
    
    // Set up real-time translation for dynamic content
    this.setupDynamicTranslation();
  },
  
  // Handle language change events
  onLanguageChanged(detail) {
    const { language, locale } = detail;
    
    // Update social feed language
    if (window.SocialFeedPage) {
      window.SocialFeedPage.currentLanguage = language;
      
      // Re-render social feed with new language
      if (window.SocialFeedPage.render) {
        window.SocialFeedPage.render();
      }
    }
    
    // Update any open modals or popups
    this.updateOpenModals();
  },
  
  // Enhance social feed with i18n features
  enhanceSocialFeed() {
    // Override message formatting
    this.overrideMessageFormatting();
    
    // Add translation to message sending
    this.enhanceMessageSending();
    
    // Enhance marketplace with currency conversion
    this.enhanceMarketplace();
    
    // Add timezone support for game times
    this.enhanceGameTimes();
  },
  
  // Override message formatting to include translation
  overrideMessageFormatting() {
    if (!window.SocialFeedPage) return;
    
    const originalFormatTimestamp = window.SocialFeedPage.formatTimestamp;
    window.SocialFeedPage.formatTimestamp = function(timestamp) {
      if (this.i18n) {
        const now = new Date();
        const date = new Date(timestamp);
        
        // Use relative time for recent messages
        const diffHours = (now - date) / (1000 * 60 * 60);
        if (diffHours < 24) {
          return this.i18n.formatRelativeTime(timestamp);
        }
        
        // Use formatted date for older messages
        return this.i18n.formatDateTime(timestamp, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Fallback to original
      return originalFormatTimestamp.call(this, timestamp);
    };
  },
  
  // Enhance message sending with translation features
  enhanceMessageSending() {
    if (!window.SocialFeedPage) return;
    
    const originalSendMessage = window.SocialFeedPage.sendMessage;
    window.SocialFeedPage.sendMessage = async function() {
      // Get the message
      const input = document.getElementById('messageInput');
      if (!input || !input.value.trim()) return;
      
      let message = input.value.trim();
      
      // Auto-translate sport mentions to current language
      if (this.i18n) {
        message = this.i18n.translateSocialMessage(message);
      }
      
      // Store original message and proceed
      input.value = message;
      return originalSendMessage.call(this);
    };
  },
  
  // Enhance marketplace with currency features
  enhanceMarketplace() {
    if (!window.SocialFeedPage) return;
    
    // Add currency converter button
    const originalRenderMarketplace = window.SocialFeedPage.renderMarketplaceView;
    window.SocialFeedPage.renderMarketplaceView = function() {
      let html = originalRenderMarketplace.call(this);
      
      // Add currency converter
      if (this.i18n) {
        const converterHtml = `
          <div class="currency-converter-widget" style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
          ">
            <h4 style="margin: 0 0 10px 0; font-size: 14px;">Currency Converter</h4>
            <input type="number" id="currencyAmount" value="100" style="width: 80px; padding: 5px;">
            <select id="fromCurrency" style="padding: 5px;">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="JPY">JPY</option>
              <option value="CNY">CNY</option>
            </select>
            <span> = </span>
            <span id="convertedAmount" style="font-weight: bold;"></span>
            <button onclick="window.SocialFeedI18n.updateCurrencyConversion()" 
                    style="margin-left: 10px; padding: 5px 10px; background: #f39c12; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Convert
            </button>
          </div>
        `;
        
        // Inject converter after marketplace
        setTimeout(() => {
          const marketplace = document.querySelector('.marketplace-grid');
          if (marketplace && !document.querySelector('.currency-converter-widget')) {
            marketplace.insertAdjacentHTML('afterend', converterHtml);
            this.updateCurrencyConversion();
          }
        }, 100);
      }
      
      return html;
    };
  },
  
  // Update currency conversion
  updateCurrencyConversion() {
    const amount = parseFloat(document.getElementById('currencyAmount')?.value || 100);
    const fromCurrency = document.getElementById('fromCurrency')?.value || 'USD';
    const i18n = window.I18nService || window.i18n;
    
    if (i18n) {
      const converted = i18n.convertCurrency(amount, fromCurrency);
      const resultEl = document.getElementById('convertedAmount');
      if (resultEl) {
        resultEl.textContent = converted;
      }
    }
  },
  
  // Enhance game times with timezone support
  enhanceGameTimes() {
    // Add timezone display to game times
    document.addEventListener('DOMContentLoaded', () => {
      this.updateAllGameTimes();
    });
    
    // Update times when language changes
    window.addEventListener('languageChanged', () => {
      this.updateAllGameTimes();
    });
  },
  
  // Update all game time displays
  updateAllGameTimes() {
    const i18n = window.I18nService || window.i18n;
    if (!i18n) return;
    
    // Find all elements with game time data
    document.querySelectorAll('[data-game-time]').forEach(element => {
      const gameTime = element.getAttribute('data-game-time');
      if (gameTime) {
        element.textContent = i18n.formatGameTime(gameTime);
      }
    });
  },
  
  // Set up dynamic translation for new content
  setupDynamicTranslation() {
    // Observe DOM changes for new translatable content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            this.translateNewContent(node);
          }
        });
      });
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },
  
  // Translate newly added content
  translateNewContent(element) {
    const i18n = window.I18nService || window.i18n;
    if (!i18n) return;
    
    // Translate messages
    if (element.classList?.contains('discord-message')) {
      // Translate sport mentions in message text
      const messageText = element.querySelector('.message-text');
      if (messageText) {
        messageText.textContent = i18n.translateSocialMessage(messageText.textContent);
      }
      
      // Update timestamp
      const timestamp = element.querySelector('.message-timestamp');
      if (timestamp && timestamp.dataset.timestamp) {
        timestamp.textContent = i18n.formatRelativeTime(timestamp.dataset.timestamp);
      }
    }
    
    // Translate marketplace items
    if (element.classList?.contains('marketplace-card')) {
      // Update price
      const priceEl = element.querySelector('.item-price');
      if (priceEl && priceEl.dataset.amount) {
        priceEl.textContent = i18n.formatCurrency(parseFloat(priceEl.dataset.amount));
      }
      
      // Update sport name
      const sportEl = element.querySelector('.item-sport');
      if (sportEl && sportEl.dataset.sport) {
        sportEl.textContent = i18n.getSportName(sportEl.dataset.sport);
      }
    }
  },
  
  // Update any open modals with new translations
  updateOpenModals() {
    const i18n = window.I18nService || window.i18n;
    if (!i18n) return;
    
    // Update preferences modal if open
    const prefsModal = document.querySelector('.preferences-modal');
    if (prefsModal) {
      // Update labels and buttons
      prefsModal.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = i18n.t(key);
      });
    }
    
    // Update other modals similarly
    const modals = document.querySelectorAll('.modal, .popup, .dropdown');
    modals.forEach(modal => {
      modal.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = i18n.t(key);
      });
    });
  },
  
  // Helper: Format message with user timezone
  formatMessageTime(timestamp) {
    const i18n = window.I18nService || window.i18n;
    if (!i18n) return timestamp;
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // Today: show time only
    if (date.toDateString() === now.toDateString()) {
      return i18n.t('time.today') + ' ' + i18n.t('time.at') + ' ' + 
             i18n.formatDateTime(date, { hour: '2-digit', minute: '2-digit' });
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return i18n.t('time.yesterday') + ' ' + i18n.t('time.at') + ' ' + 
             i18n.formatDateTime(date, { hour: '2-digit', minute: '2-digit' });
    }
    
    // This week: show day and time
    const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return i18n.formatDateTime(date, { 
        weekday: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Older: show full date
    return i18n.formatDateTime(date, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  },
  
  // Helper: Get localized sport emoji
  getSportEmoji(sport) {
    const sportEmojis = {
      basketball: '🏀',
      soccer: '⚽',
      football: '🏈',
      volleyball: '🏐',
      tennis: '🎾',
      hockey: '🏒',
      cricket: '🏏',
      rugby: '🏉',
      baseball: '⚾',
      badminton: '🏸',
      tabletennis: '🏓'
    };
    
    return sportEmojis[sport] || '🏃';
  },
  
  // Helper: Format distance for display
  formatDistanceFromUser(km) {
    const i18n = window.I18nService || window.i18n;
    if (!i18n) return `${km} km`;
    
    const formatted = i18n.formatDistance(km);
    
    // Add "away" for better readability
    if (km < 1) {
      return i18n.t('location.nearYou');
    }
    
    return formatted;
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.SocialFeedI18n.initialize();
  });
} else {
  window.SocialFeedI18n.initialize();
}