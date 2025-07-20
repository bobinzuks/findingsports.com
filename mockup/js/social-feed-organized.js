// Enhanced Social Feed with Improved Content Organization
window.SocialFeedOrganized = {
  // Enhanced channel categorization
  channelCategories: {
    sports: {
      name: 'Sports Channels',
      icon: '🏆',
      channels: [
        { id: 'basketball', name: 'Basketball', icon: '🏀', tags: ['indoor', 'team'] },
        { id: 'soccer', name: 'Soccer', icon: '⚽', tags: ['outdoor', 'team'] },
        { id: 'volleyball', name: 'Volleyball', icon: '🏐', tags: ['indoor', 'outdoor', 'team'] },
        { id: 'tennis', name: 'Tennis', icon: '🎾', tags: ['indoor', 'outdoor', 'individual'] },
        { id: 'hockey', name: 'Hockey', icon: '🏒', tags: ['indoor', 'team'] },
        { id: 'badminton', name: 'Badminton', icon: '🏸', tags: ['indoor', 'individual'] },
        { id: 'pickleball', name: 'Pickleball', icon: '🥒', tags: ['outdoor', 'individual'] },
        { id: 'running', name: 'Running', icon: '🏃', tags: ['outdoor', 'individual'] },
        { id: 'cycling', name: 'Cycling', icon: '🚴', tags: ['outdoor', 'individual'] }
      ]
    },
    locations: {
      name: 'Location Channels',
      icon: '📍',
      channels: [
        { id: 'vancouver', name: 'Vancouver', icon: '🌊', subChannels: ['downtown', 'kits', 'ubc'] },
        { id: 'burnaby', name: 'Burnaby', icon: '🏙️', subChannels: ['metrotown', 'brentwood'] },
        { id: 'richmond', name: 'Richmond', icon: '✈️', subChannels: ['steveston', 'city-center'] },
        { id: 'surrey', name: 'Surrey', icon: '🌳', subChannels: ['guildford', 'newton'] },
        { id: 'north-van', name: 'North Vancouver', icon: '🏔️', subChannels: ['lonsdale', 'deep-cove'] },
        { id: 'new-west', name: 'New Westminster', icon: '👑', subChannels: ['quay', 'uptown'] }
      ]
    },
    skillLevels: {
      name: 'Skill Levels',
      icon: '📊',
      channels: [
        { id: 'beginners', name: 'Beginners', icon: '🌱', description: 'New to sports? Start here!' },
        { id: 'intermediate', name: 'Intermediate', icon: '📈', description: 'Casual and competitive' },
        { id: 'advanced', name: 'Advanced', icon: '🔥', description: 'High-level competition' },
        { id: 'all-levels', name: 'All Levels', icon: '🤝', description: 'Everyone welcome' }
      ]
    },
    special: {
      name: 'Special Interest',
      icon: '⭐',
      channels: [
        { id: 'tournaments', name: 'Tournaments', icon: '🏆', tags: ['competitive'] },
        { id: 'leagues', name: 'Leagues', icon: '📅', tags: ['organized'] },
        { id: 'pickup-games', name: 'Pickup Games', icon: '🎯', tags: ['casual'] },
        { id: 'training', name: 'Training & Coaching', icon: '💪', tags: ['learning'] },
        { id: 'equipment', name: 'Equipment Exchange', icon: '🛍️', tags: ['marketplace'] }
      ]
    }
  },

  // Enhanced filter system
  filters: {
    contentType: [
      { id: 'all', name: 'All Posts', icon: '📋' },
      { id: 'games', name: 'Game Announcements', icon: '🎮' },
      { id: 'looking', name: 'Looking for Players', icon: '👥' },
      { id: 'marketplace', name: 'Buy/Sell/Trade', icon: '🛒' },
      { id: 'discussion', name: 'Discussions', icon: '💬' },
      { id: 'events', name: 'Events & Tournaments', icon: '📅' },
      { id: 'tips', name: 'Tips & Advice', icon: '💡' }
    ],
    timeRange: [
      { id: 'today', name: 'Today', icon: '☀️' },
      { id: 'week', name: 'This Week', icon: '📅' },
      { id: 'month', name: 'This Month', icon: '📆' },
      { id: 'all', name: 'All Time', icon: '♾️' }
    ],
    sortBy: [
      { id: 'recent', name: 'Most Recent', icon: '🆕' },
      { id: 'popular', name: 'Most Popular', icon: '🔥' },
      { id: 'upcoming', name: 'Upcoming Games', icon: '⏰' },
      { id: 'replies', name: 'Most Replies', icon: '💬' }
    ]
  },

  // Pinned messages system
  pinnedMessages: new Map(),

  // Search functionality
  searchHistory: [],
  searchSuggestions: [],

  // Enhanced render method with better organization
  renderOrganizedSidebar() {
    return `
      <div class="organized-sidebar">
        <!-- Search Bar -->
        <div class="sidebar-search">
          <input 
            type="text" 
            id="channelSearch" 
            placeholder="Search channels, topics, or users..."
            class="channel-search-input"
            oninput="window.SocialFeedOrganized.handleSearch(this.value)"
          />
          <div id="searchSuggestions" class="search-suggestions"></div>
        </div>

        <!-- Quick Filters -->
        <div class="quick-filters">
          <div class="filter-header">
            <span class="filter-icon">🔍</span>
            QUICK FILTERS
          </div>
          <div class="filter-pills">
            <button class="filter-pill active" data-filter="all">All</button>
            <button class="filter-pill" data-filter="my-sports">My Sports</button>
            <button class="filter-pill" data-filter="nearby">Nearby</button>
            <button class="filter-pill" data-filter="today">Today</button>
            <button class="filter-pill" data-filter="unread">Unread</button>
          </div>
        </div>

        <!-- Channel Categories -->
        ${Object.entries(this.channelCategories).map(([key, category]) => `
          <div class="channel-category" data-category="${key}">
            <div class="category-header" onclick="window.SocialFeedOrganized.toggleCategory('${key}')">
              <span class="collapse-icon">▼</span>
              <span class="category-icon">${category.icon}</span>
              <span class="category-name">${category.name}</span>
              <span class="category-count">${category.channels.length}</span>
            </div>
            <div class="category-channels" id="category-${key}">
              ${category.channels.map(channel => this.renderChannel(channel, key)).join('')}
            </div>
          </div>
        `).join('')}

        <!-- Saved Channels -->
        <div class="saved-channels">
          <div class="saved-header">
            <span class="saved-icon">⭐</span>
            SAVED CHANNELS
          </div>
          <div id="savedChannelsList" class="saved-list">
            <!-- Dynamically populated -->
          </div>
        </div>
      </div>
    `;
  },

  renderChannel(channel, categoryKey) {
    const isActive = this.currentChannel === channel.id;
    const hasUnread = this.hasUnreadMessages(channel.id);
    const memberCount = this.getChannelMemberCount(channel.id);
    
    return `
      <div class="channel-item ${isActive ? 'active' : ''} ${hasUnread ? 'unread' : ''}"
           onclick="window.SocialFeedOrganized.switchToChannel('${channel.id}', '${categoryKey}')">
        <span class="channel-icon">${channel.icon || '#'}</span>
        <span class="channel-name">${channel.name}</span>
        ${hasUnread ? '<span class="unread-indicator">●</span>' : ''}
        <span class="member-count">${memberCount}</span>
        <button class="channel-star" onclick="event.stopPropagation(); window.SocialFeedOrganized.toggleSaveChannel('${channel.id}')">
          ${this.isSavedChannel(channel.id) ? '⭐' : '☆'}
        </button>
      </div>
      ${channel.subChannels ? `
        <div class="sub-channels" id="sub-${channel.id}">
          ${channel.subChannels.map(sub => `
            <div class="sub-channel-item" onclick="window.SocialFeedOrganized.switchToChannel('${channel.id}-${sub}')">
              <span class="sub-icon">└</span> ${sub}
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  },

  renderEnhancedHeader() {
    return `
      <div class="enhanced-channel-header">
        <div class="channel-info">
          <h2 class="channel-title">
            <span class="channel-icon">${this.getCurrentChannelIcon()}</span>
            ${this.getCurrentChannelName()}
          </h2>
          <div class="channel-meta">
            <span class="member-count">${this.getChannelMemberCount(this.currentChannel)} members</span>
            <span class="activity-level">${this.getActivityLevel(this.currentChannel)}</span>
          </div>
        </div>
        
        <div class="channel-controls">
          <!-- Content Type Filter -->
          <select class="content-filter" onchange="window.SocialFeedOrganized.filterContent(this.value)">
            ${this.filters.contentType.map(type => 
              `<option value="${type.id}">${type.icon} ${type.name}</option>`
            ).join('')}
          </select>
          
          <!-- Sort Options -->
          <select class="sort-filter" onchange="window.SocialFeedOrganized.sortContent(this.value)">
            ${this.filters.sortBy.map(sort => 
              `<option value="${sort.id}">${sort.icon} ${sort.name}</option>`
            ).join('')}
          </select>
          
          <!-- View Toggle -->
          <div class="view-toggle">
            <button class="view-btn active" data-view="feed" onclick="window.SocialFeedOrganized.setView('feed')">
              <svg width="16" height="16"><use href="#icon-feed"/></svg>
            </button>
            <button class="view-btn" data-view="grid" onclick="window.SocialFeedOrganized.setView('grid')">
              <svg width="16" height="16"><use href="#icon-grid"/></svg>
            </button>
            <button class="view-btn" data-view="calendar" onclick="window.SocialFeedOrganized.setView('calendar')">
              <svg width="16" height="16"><use href="#icon-calendar"/></svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Pinned Messages -->
      <div class="pinned-messages" id="pinnedMessages">
        ${this.renderPinnedMessages()}
      </div>
      
      <!-- Active Filters -->
      <div class="active-filters" id="activeFilters">
        ${this.renderActiveFilters()}
      </div>
    `;
  },

  renderPinnedMessages() {
    const pinned = this.pinnedMessages.get(this.currentChannel) || [];
    if (pinned.length === 0) return '';
    
    return `
      <div class="pinned-container">
        <div class="pinned-header">
          <span class="pin-icon">📌</span>
          Pinned Messages
          <button class="collapse-btn" onclick="window.SocialFeedOrganized.togglePinned()">
            <span class="collapse-icon">▼</span>
          </button>
        </div>
        <div class="pinned-list" id="pinnedList">
          ${pinned.map(msg => `
            <div class="pinned-message">
              <div class="pinned-content">${msg.preview}</div>
              <div class="pinned-meta">
                <span class="pinned-author">${msg.author}</span>
                <span class="pinned-time">${this.formatTime(msg.timestamp)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderActiveFilters() {
    const activeFilters = this.getActiveFilters();
    if (activeFilters.length === 0) return '';
    
    return `
      <div class="filter-tags">
        ${activeFilters.map(filter => `
          <span class="filter-tag">
            ${filter.icon} ${filter.name}
            <button class="remove-filter" onclick="window.SocialFeedOrganized.removeFilter('${filter.id}')">×</button>
          </span>
        `).join('')}
        <button class="clear-filters" onclick="window.SocialFeedOrganized.clearAllFilters()">
          Clear all
        </button>
      </div>
    `;
  },

  // Enhanced message rendering with better organization
  renderOrganizedMessage(message) {
    const messageType = this.getMessageType(message);
    const priority = this.getMessagePriority(message);
    
    return `
      <div class="organized-message ${messageType} priority-${priority}" data-message-id="${message.id}">
        ${this.renderMessageHeader(message)}
        ${this.renderMessageContent(message, messageType)}
        ${this.renderMessageFooter(message)}
      </div>
    `;
  },

  renderMessageHeader(message) {
    return `
      <div class="message-header-organized">
        <div class="author-section">
          <img class="author-avatar" src="${message.author.avatar}" alt="${message.author.name}">
          <div class="author-details">
            <span class="author-name">${message.author.name}</span>
            ${message.author.badges ? this.renderBadges(message.author.badges) : ''}
            <span class="message-time">${this.formatTimestamp(message.timestamp)}</span>
          </div>
        </div>
        <div class="message-actions">
          <button class="action-btn" onclick="window.SocialFeedOrganized.pinMessage('${message.id}')">
            📌
          </button>
          <button class="action-btn" onclick="window.SocialFeedOrganized.shareMessage('${message.id}')">
            🔗
          </button>
          <div class="dropdown-trigger" onclick="window.SocialFeedOrganized.showMessageMenu('${message.id}')">
            ⋮
          </div>
        </div>
      </div>
    `;
  },

  renderMessageContent(message, messageType) {
    const content = `<div class="message-text">${this.processMessageText(message.text)}</div>`;
    
    switch(messageType) {
      case 'game-announcement':
        return content + this.renderGameDetails(message.gameData);
      case 'marketplace':
        return content + this.renderMarketplaceItem(message.itemData);
      case 'event':
        return content + this.renderEventDetails(message.eventData);
      default:
        return content;
    }
  },

  renderMessageFooter(message) {
    return `
      <div class="message-footer-organized">
        <div class="engagement-stats">
          ${message.reactions ? this.renderReactions(message.reactions) : ''}
          <span class="reply-count">${message.replyCount || 0} replies</span>
          <span class="view-count">${message.viewCount || 0} views</span>
        </div>
        <div class="quick-actions">
          <button class="quick-reply" onclick="window.SocialFeedOrganized.quickReply('${message.id}')">
            Reply
          </button>
          ${message.gameData ? `
            <button class="quick-join" onclick="window.SocialFeedOrganized.quickJoin('${message.id}')">
              Join Game
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  // Search functionality
  handleSearch(query) {
    if (!query) {
      document.getElementById('searchSuggestions').innerHTML = '';
      return;
    }

    const suggestions = this.generateSearchSuggestions(query);
    this.renderSearchSuggestions(suggestions);
  },

  generateSearchSuggestions(query) {
    const suggestions = [];
    const lowerQuery = query.toLowerCase();

    // Search channels
    Object.values(this.channelCategories).forEach(category => {
      category.channels.forEach(channel => {
        if (channel.name.toLowerCase().includes(lowerQuery)) {
          suggestions.push({
            type: 'channel',
            data: channel,
            category: category.name
          });
        }
      });
    });

    // Search users
    this.searchUsers(lowerQuery).forEach(user => {
      suggestions.push({
        type: 'user',
        data: user
      });
    });

    // Search message history
    this.searchMessages(lowerQuery).forEach(message => {
      suggestions.push({
        type: 'message',
        data: message
      });
    });

    return suggestions.slice(0, 10); // Limit suggestions
  },

  renderSearchSuggestions(suggestions) {
    const container = document.getElementById('searchSuggestions');
    
    if (suggestions.length === 0) {
      container.innerHTML = '<div class="no-results">No results found</div>';
      return;
    }

    container.innerHTML = suggestions.map(suggestion => {
      switch(suggestion.type) {
        case 'channel':
          return `
            <div class="suggestion-item channel-suggestion" onclick="window.SocialFeedOrganized.goToChannel('${suggestion.data.id}')">
              <span class="suggestion-icon">${suggestion.data.icon}</span>
              <div class="suggestion-content">
                <div class="suggestion-title">${suggestion.data.name}</div>
                <div class="suggestion-meta">${suggestion.category}</div>
              </div>
            </div>
          `;
        case 'user':
          return `
            <div class="suggestion-item user-suggestion" onclick="window.SocialFeedOrganized.viewProfile('${suggestion.data.id}')">
              <img class="suggestion-avatar" src="${suggestion.data.avatar}" alt="${suggestion.data.name}">
              <div class="suggestion-content">
                <div class="suggestion-title">${suggestion.data.name}</div>
                <div class="suggestion-meta">@${suggestion.data.username}</div>
              </div>
            </div>
          `;
        case 'message':
          return `
            <div class="suggestion-item message-suggestion" onclick="window.SocialFeedOrganized.goToMessage('${suggestion.data.id}')">
              <span class="suggestion-icon">💬</span>
              <div class="suggestion-content">
                <div class="suggestion-title">${suggestion.data.preview}</div>
                <div class="suggestion-meta">in #${suggestion.data.channel}</div>
              </div>
            </div>
          `;
      }
    }).join('');
  },

  // Collapsible sections
  toggleCategory(categoryKey) {
    const categoryEl = document.getElementById(`category-${categoryKey}`);
    const icon = categoryEl.previousElementSibling.querySelector('.collapse-icon');
    
    if (categoryEl.classList.contains('collapsed')) {
      categoryEl.classList.remove('collapsed');
      icon.textContent = '▼';
    } else {
      categoryEl.classList.add('collapsed');
      icon.textContent = '▶';
    }
    
    // Save preference
    this.saveCategoryState(categoryKey, !categoryEl.classList.contains('collapsed'));
  },

  // Helper methods
  getCurrentChannelIcon() {
    for (const category of Object.values(this.channelCategories)) {
      const channel = category.channels.find(ch => ch.id === this.currentChannel);
      if (channel) return channel.icon;
    }
    return '#';
  },

  getCurrentChannelName() {
    for (const category of Object.values(this.channelCategories)) {
      const channel = category.channels.find(ch => ch.id === this.currentChannel);
      if (channel) return channel.name;
    }
    return this.currentChannel;
  },

  getChannelMemberCount(channelId) {
    // Mock data - in real app, this would come from backend
    const counts = {
      'basketball': 342,
      'soccer': 567,
      'volleyball': 189,
      'vancouver': 892,
      'burnaby': 456,
      'beginners': 234,
      'tournaments': 123
    };
    return counts[channelId] || Math.floor(Math.random() * 200) + 50;
  },

  getActivityLevel(channelId) {
    const messages = this.messages.get(channelId) || [];
    const recentMessages = messages.filter(m => 
      new Date() - new Date(m.timestamp) < 24 * 60 * 60 * 1000
    );
    
    if (recentMessages.length > 50) return '🔥 Very Active';
    if (recentMessages.length > 20) return '✨ Active';
    if (recentMessages.length > 5) return '💫 Moderate';
    return '💤 Quiet';
  },

  hasUnreadMessages(channelId) {
    // Mock implementation
    return Math.random() > 0.7;
  },

  isSavedChannel(channelId) {
    const saved = localStorage.getItem('savedChannels');
    return saved ? JSON.parse(saved).includes(channelId) : false;
  },

  toggleSaveChannel(channelId) {
    const saved = localStorage.getItem('savedChannels');
    let savedChannels = saved ? JSON.parse(saved) : [];
    
    if (savedChannels.includes(channelId)) {
      savedChannels = savedChannels.filter(id => id !== channelId);
    } else {
      savedChannels.push(channelId);
    }
    
    localStorage.setItem('savedChannels', JSON.stringify(savedChannels));
    this.updateSavedChannelsList();
  },

  getMessageType(message) {
    if (message.gameData) return 'game-announcement';
    if (message.itemData) return 'marketplace';
    if (message.eventData) return 'event';
    if (message.isLookingFor) return 'looking-for-players';
    return 'discussion';
  },

  getMessagePriority(message) {
    if (message.isPinned) return 'high';
    if (message.gameData && message.gameData.spotsLeft < 3) return 'high';
    if (message.mentions && message.mentions.includes(this.currentUserId)) return 'high';
    if (message.replyCount > 10) return 'medium';
    return 'normal';
  },

  processMessageText(text) {
    // Add links, mentions, hashtags
    return text
      .replace(/@(\w+)/g, '<span class="mention">@$1</span>')
      .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
  }
};