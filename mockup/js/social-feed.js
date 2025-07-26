// Social Feed page component
window.SocialFeedPage = {
  // Current channel and view state
  currentChannel: 'general',
  currentView: 'chat', // 'chat' or 'marketplace'
  typingUsers: new Map(), // Map of userId -> timeout
  typingTimeout: null,
  messages: new Map(), // Map of channel -> messages array
  onlineUsers: new Map(), // Map of userId -> user data
  currentUserId: null,
  emojiPicker: null,
  userLocation: null,
  userSport: null,
  currentLanguage: 'en',
  i18n: null, // Reference to i18n service

  // Initialize the Social Feed page
  async initialize() {
    // Get reference to i18n service
    this.i18n = window.I18nService || window.i18n;
    
    // Initialize WebSocket for real-time chat if not already connected
    if (window.wsClient && !window.wsClient.connected) {
      window.wsClient.connect();
    }

    // Set up WebSocket event handlers for chat
    this.setupWebSocketHandlers();

    // Get current user ID
    this.currentUserId = localStorage.getItem('userId') || `guest-${Date.now()}`;

    // Auto-detect user location and preferences
    await this.autoDetectUserPreferences();

    // Load initial feed data
    await this.loadFeed();
    
    // Initialize mobile enhancements if on mobile
    if (window.SocialFeedMobile && window.SocialFeedMobile.isMobile()) {
      window.SocialFeedMobile.initialize();
    }
    
    // Initialize onboarding for first-time users
    if (window.OnboardingSystem) {
      window.OnboardingSystem.initialize();
    }
    
    // Initialize gamification system if logged in
    if (!window.isGuest && window.Gamification) {
      await window.Gamification.initialize();
      window.Gamification.currentUserId = this.currentUserId;
    }
    
    // Check if this is the first visit
    if (!localStorage.getItem('firstVisit')) {
      localStorage.setItem('firstVisit', new Date().toISOString());
    }
  },

  // Auto-detect user location and sport preferences
  async autoDetectUserPreferences() {
    // Get location from browser geolocation API
    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });

        // Map coordinates to nearest city
        this.userLocation = this.getLocationFromCoords(position.coords.latitude, position.coords.longitude);
      } catch (error) {
        console.log('Geolocation failed, using default');
      }
    }

    // Get user's sport preference from localStorage or recent activity
    this.userSport = localStorage.getItem('preferredSport') || 'general';

    // Get user's language preference
    this.currentLanguage = localStorage.getItem('preferredLanguage') || navigator.language.split('-')[0] || 'en';

    // Auto-join appropriate channel based on location and sport
    if (this.userLocation && this.userSport !== 'general') {
      // Join location-specific sport channel if available
      this.currentChannel = `${this.userLocation}-${this.userSport}`;
    } else if (this.userSport !== 'general') {
      // Join sport-specific channel
      this.currentChannel = this.userSport;
    } else if (this.userLocation) {
      // Join location-specific channel
      this.currentChannel = this.userLocation;
    }
    // Otherwise stay in general channel
  },

  // Get location name from coordinates
  getLocationFromCoords(lat, lng) {
    // Vancouver area boundaries
    const locations = {
      vancouver: { lat: 49.2827, lng: -123.1207, bounds: { north: 49.3170, south: 49.1987, east: -123.0234, west: -123.2240 } },
      burnaby: { lat: 49.2488, lng: -122.9805, bounds: { north: 49.2950, south: 49.2000, east: -122.8900, west: -123.0250 } },
      richmond: { lat: 49.1666, lng: -123.1336, bounds: { north: 49.2050, south: 49.1000, east: -123.0400, west: -123.2200 } },
      surrey: { lat: 49.1913, lng: -122.8490, bounds: { north: 49.2200, south: 49.0050, east: -122.6890, west: -122.9800 } }
    };

    // Find closest location
    for (const [name, loc] of Object.entries(locations)) {
      if (lat >= loc.bounds.south && lat <= loc.bounds.north &&
                lng >= loc.bounds.west && lng <= loc.bounds.east) {
        return name;
      }
    }

    // Default to vancouver if no match
    return 'vancouver';
  },

  // Load feed data
  async loadFeed() {
    // Initialize messages for channels if not already loaded
    if (!this.messages.has(this.currentChannel)) {
      const messages = this.getDemoMessages(this.currentChannel);
      this.messages.set(this.currentChannel, messages);
    }

    // Initialize demo online users
    const demoUsers = [
      { userId: 'user1', name: 'Alex Chen', status: 'online', activity: 'Playing Basketball' },
      { userId: 'user2', name: 'Sarah Johnson', status: 'idle', activity: 'In #soccer' },
      { userId: 'user3', name: 'Mike Williams', status: 'online', activity: 'Looking for tennis partner' },
      { userId: 'user4', name: 'Emma Davis', status: 'dnd', activity: 'In game' },
      { userId: 'user5', name: 'John Doe', status: 'online', activity: null },
      { userId: 'user6', name: 'Lisa Brown', status: 'idle', activity: 'In #volleyball' },
      { userId: 'user7', name: 'Tom Wilson', status: 'online', activity: 'Browsing marketplace' },
      { userId: 'user8', name: 'Jessica Lee', status: 'online', activity: null }
    ];

    demoUsers.forEach(user => {
      this.onlineUsers.set(user.userId, user);
    });
  },

  // Set up WebSocket event handlers
  setupWebSocketHandlers() {
    // Join chat channel
    window.wsClient.on('connected', () => {
      this.joinChannel(this.currentChannel);
    });

    // Handle new messages
    window.wsClient.on('chat-message', data => {
      this.handleNewMessage(data);
    });

    window.wsClient.on('channel-message', data => {
      this.handleNewMessage(data);
    });

    // Handle typing indicators
    window.wsClient.on('user-typing', data => {
      this.handleUserTyping(data);
    });

    window.wsClient.on('user-stopped-typing', data => {
      this.handleUserStoppedTyping(data);
    });

    // Handle user status updates
    window.wsClient.on('user-online', data => {
      this.handleUserOnline(data);
    });

    window.wsClient.on('user-offline', data => {
      this.handleUserOffline(data);
    });

    // Handle reactions
    window.wsClient.on('message-reaction', data => {
      this.handleMessageReaction(data);
    });
  },

  // Join a channel
  joinChannel(channel) {
    if (window.wsClient && window.wsClient.socket) {
      window.wsClient.socket.emit('join-channel', { channel });
    }
  },

  // Leave a channel
  leaveChannel(channel) {
    if (window.wsClient && window.wsClient.socket) {
      window.wsClient.socket.emit('leave-channel', { channel });
    }
  },

  // Handle new message from WebSocket
  handleNewMessage(data) {
    const { channel, message } = data;
    if (!this.messages.has(channel)) {
      this.messages.set(channel, []);
    }

    const messages = this.messages.get(channel);
    messages.push(message);

    // Update UI if this is the current channel
    if (channel === this.currentChannel && this.currentView === 'chat') {
      this.appendMessage(message);
    }
  },

  // Handle user typing
  handleUserTyping(data) {
    const { userId, userName, channel } = data;
    if (channel === this.currentChannel && userId !== this.currentUserId) {
      // Clear existing timeout
      if (this.typingUsers.has(userId)) {
        clearTimeout(this.typingUsers.get(userId));
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        this.typingUsers.delete(userId);
        this.updateTypingIndicator();
      }, 3000);

      this.typingUsers.set(userId, { name: userName, timeout });
      this.updateTypingIndicator();
    }
  },

  // Handle user stopped typing
  handleUserStoppedTyping(data) {
    const { userId, channel } = data;
    if (channel === this.currentChannel) {
      if (this.typingUsers.has(userId)) {
        clearTimeout(this.typingUsers.get(userId).timeout);
        this.typingUsers.delete(userId);
        this.updateTypingIndicator();
      }
    }
  },

  // Handle user online
  handleUserOnline(data) {
    const { userId, user } = data;
    this.onlineUsers.set(userId, user);
    this.updateOnlineUsersList();
  },

  // Handle user offline
  handleUserOffline(data) {
    const { userId } = data;
    this.onlineUsers.delete(userId);
    this.updateOnlineUsersList();
  },

  // Handle message reaction
  handleMessageReaction(data) {
    const { messageId, emoji, userId, action, channel } = data;
    if (channel === this.currentChannel) {
      const messages = this.messages.get(channel) || [];
      const message = messages.find(m => m.id === messageId);
      if (message) {
        if (!message.reactions) {
          message.reactions = [];
        }

        const reaction = message.reactions.find(r => r.emoji === emoji);
        if (action === 'add') {
          if (reaction) {
            reaction.count++;
            if (!reaction.users) {
              reaction.users = [];
            }
            reaction.users.push(userId);
          } else {
            message.reactions.push({ emoji, count: 1, users: [userId] });
          }
          
          // Award points to message author for receiving positive reaction
          if (window.Gamification && message.author.userId === this.currentUserId && 
              ['👍', '❤️', '🙏', '💯'].includes(emoji)) {
            window.Gamification.awardPoints(
              { type: 'receive_reaction', emoji },
              window.Gamification.POINTS.RECEIVE_REACTION,
              'Received a positive reaction'
            );
            
            // Check if message is now "helpful" (5+ positive reactions)
            const positiveCount = message.reactions
              .filter(r => ['👍', '❤️', '🙏', '💯'].includes(r.emoji))
              .reduce((sum, r) => sum + r.count, 0);
            
            if (positiveCount === 5) {
              window.Gamification.awardPoints(
                { type: 'helpful_message', messageId },
                window.Gamification.POINTS.HELPFUL_MESSAGE,
                'Your message was marked as helpful'
              );
            }
          }
        } else if (action === 'remove' && reaction) {
          reaction.count--;
          if (reaction.users) {
            reaction.users = reaction.users.filter(u => u !== userId);
          }
          if (reaction.count <= 0) {
            message.reactions = message.reactions.filter(r => r.emoji !== emoji);
          }
        }

        // Update UI
        this.updateMessageReactions(messageId, message.reactions);
      }
    }
  },

  // Render the Social Feed page content
  render() {
    const contentWrapper = document.querySelector('.content-wrapper');
    if (!contentWrapper) {
      return;
    }

    contentWrapper.innerHTML = `
            <!-- Social Feed Section -->
            <section class="social-feed-section discord-style">
                <div class="discord-container">
                    <!-- Left Sidebar - Simplified -->
                    <div class="discord-sidebar">
                        <div class="sidebar-header">
                            <h3>${this.i18n ? this.i18n.t('social.title') : 'FindingSports Community'}</h3>
                            <div style="font-size: 12px; color: #999; margin-top: 5px;">
                                📍 ${this.userLocation ? this.userLocation.charAt(0).toUpperCase() + this.userLocation.slice(1) : (this.i18n ? this.i18n.t('location.detecting') : 'Detecting location...')}
                                ${this.userSport && this.userSport !== 'general' ? `| 🏀 ${this.i18n ? this.i18n.getSportName(this.userSport) : this.userSport.charAt(0).toUpperCase() + this.userSport.slice(1)}` : ''}
                            </div>
                        </div>
                        
                        <!-- Current Channel Info -->
                        <div class="channel-section">
                            <div class="channel-header">
                                <span class="collapse-icon">▼</span>
                                ${this.i18n ? this.i18n.t('social.channels').toUpperCase() : 'CURRENT CHANNEL'}
                            </div>
                            <div class="channels-list">
                                <div class="channel-item active">
                                    <span class="channel-icon">#</span> ${this.getTranslatedChannelName(this.currentChannel)}
                                </div>
                            </div>
                        </div>

                        <!-- Quick Channel Switch -->
                        <div class="channel-section">
                            <div class="channel-header">
                                <span class="collapse-icon">▼</span>
                                QUICK SWITCH
                            </div>
                            <div class="channels-list">
                                <div class="channel-item ${this.currentChannel === 'general' ? 'active' : ''}" 
                                     onclick="window.SocialFeedPage.switchChannel('general')">
                                    <span class="channel-icon">#</span> general
                                </div>
                                ${this.userSport && this.userSport !== 'general' ? `
                                <div class="channel-item ${this.currentChannel === this.userSport ? 'active' : ''}" 
                                     onclick="window.SocialFeedPage.switchChannel('${this.userSport}')">
                                    <span class="channel-icon">#</span> ${this.userSport}
                                </div>
                                ` : ''}
                                ${this.userLocation ? `
                                <div class="channel-item ${this.currentChannel === this.userLocation ? 'active' : ''}" 
                                     onclick="window.SocialFeedPage.switchChannel('${this.userLocation}')">
                                    <span class="channel-icon">#</span> ${this.userLocation}
                                </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Marketplace Section -->
                        <div class="channel-section">
                            <div class="channel-header">
                                <span class="collapse-icon">▼</span>
                                MARKETPLACE
                            </div>
                            <div class="channels-list">
                                <div class="channel-item ${this.currentView === 'marketplace' ? 'active' : ''}" 
                                     onclick="window.SocialFeedPage.switchToMarketplace()">
                                    <span class="channel-icon">🛒</span> browse-marketplace
                                </div>
                            </div>
                        </div>

                        <!-- Gamification Section -->
                        ${!window.isGuest ? `
                        <div class="channel-section">
                            <div class="channel-header">
                                <span class="collapse-icon">▼</span>
                                REWARDS & PROGRESS
                            </div>
                            <div class="channels-list">
                                <div class="channel-item ${this.currentView === 'gamification' ? 'active' : ''}" 
                                     onclick="window.SocialFeedPage.switchToGamification()">
                                    <span class="channel-icon">🏆</span> my-progress
                                </div>
                                <div class="channel-item" 
                                     onclick="window.SocialFeedPage.showLeaderboards()">
                                    <span class="channel-icon">📊</span> leaderboards
                                </div>
                                <div class="channel-item" 
                                     onclick="window.SocialFeedPage.showDailyChallenges()">
                                    <span class="channel-icon">🎯</span> daily-challenges
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        <!-- Settings -->
                        <div class="channel-section" style="margin-top: auto; padding-bottom: 20px;">
                            <div class="channel-header">
                                <span class="collapse-icon">▼</span>
                                PREFERENCES
                            </div>
                            <div class="channels-list">
                                <div class="channel-item" onclick="window.SocialFeedPage.showPreferences()">
                                    <span class="channel-icon">⚙️</span> Change Location/Sport
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Main Content Area -->
                    <div class="discord-main">
                        ${this.currentView === 'chat' ? this.renderChatView() : 
                          this.currentView === 'marketplace' ? this.renderMarketplaceView() :
                          this.currentView === 'gamification' ? this.renderGamificationView() : ''}
                    </div>

                    <!-- Right Sidebar - Online Users -->
                    <div class="discord-users-sidebar">
                        <div class="online-section">
                            <div class="online-header">ONLINE — ${this.getOnlineCount()}</div>
                            <div id="onlineUsersList" class="online-users-list">
                                ${this.renderOnlineUsers()}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;

    // Set up event listeners
    this.setupEventListeners();

    // Load appropriate content
    if (this.currentView === 'chat') {
      this.loadChannelMessages(this.currentChannel);
    } else {
      this.loadMarketplaceItems();
    }
  },

  // Render chat view
  renderChatView() {
    return `
            <div class="channel-header-bar">
                <span class="channel-icon">#</span>
                <span class="channel-name">${this.currentChannel}</span>
                <span class="channel-topic">Connect with players interested in ${this.currentChannel}</span>
            </div>

            <div class="messages-container" id="messagesContainer">
                <!-- Messages will be loaded here -->
            </div>

            ${
  !window.isGuest ?
    `
                <div class="typing-indicator" id="typingIndicator" style="display: none;">
                    <span class="typing-text"></span>
                </div>
                <div class="message-input-container">
                    <div class="message-input-wrapper">
                        <input 
                            type="text" 
                            id="messageInput" 
                            class="message-input" 
                            placeholder="${this.i18n ? this.i18n.t('social.message.placeholder') : `Message #${this.currentChannel}`}"
                            maxlength="500"
                            onkeydown="window.SocialFeedPage.handleKeyDown(event)"
                            oninput="window.SocialFeedPage.handleTyping()"
                        />
                        <div class="message-actions">
                            <button class="emoji-btn" onclick="window.SocialFeedPage.toggleEmojiPicker()">😊</button>
                            <button class="send-btn" onclick="window.SocialFeedPage.sendMessage()">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            ` :
    `
                <div class="guest-prompt-discord">
                    <div class="blur-overlay"></div>
                    <div class="guest-message">
                        <h3>Join the conversation!</h3>
                        <p>Sign in to send messages and connect with other players</p>
                        <button class="auth-button discord-style" onclick="alert('Please sign in to continue')">
                            Sign In to Chat
                        </button>
                    </div>
                </div>
            `
}
        `;
  },

  // Render marketplace view
  renderMarketplaceView() {
    return `
            <div class="marketplace-header">
                <h2>${this.i18n ? this.i18n.t('marketplace.title') : 'Sports Marketplace'}</h2>
                <div class="marketplace-filters">
                    <select id="marketplaceCategory" class="marketplace-select" onchange="window.SocialFeedPage.filterMarketplace()">
                        <option value="all">${this.i18n ? this.i18n.t('marketplace.allCategories') : 'All Categories'}</option>
                        <option value="equipment-sale">${this.i18n ? this.i18n.t('marketplace.forSale') : 'Equipment for Sale'}</option>
                        <option value="equipment-wanted">${this.i18n ? this.i18n.t('marketplace.wanted') : 'Equipment Wanted'}</option>
                        <option value="carpool">${this.i18n ? this.i18n.t('marketplace.carpool') : 'Carpooling'}</option>
                        <option value="team-looking">${this.i18n ? this.i18n.t('marketplace.teamLooking') : 'Team Looking for Players'}</option>
                    </select>
                    <select id="marketplaceSport" class="marketplace-select" onchange="window.SocialFeedPage.filterMarketplace()">
                        <option value="all">All Sports</option>
                        <option value="basketball">Basketball</option>
                        <option value="soccer">Soccer</option>
                        <option value="volleyball">Volleyball</option>
                        <option value="tennis">Tennis</option>
                        <option value="hockey">Hockey</option>
                    </select>
                    <select id="marketplaceLocation" class="marketplace-select" onchange="window.SocialFeedPage.filterMarketplace()">
                        <option value="all">All Locations</option>
                        <option value="vancouver">Vancouver</option>
                        <option value="burnaby">Burnaby</option>
                        <option value="richmond">Richmond</option>
                        <option value="surrey">Surrey</option>
                    </select>
                    ${
  !window.isGuest ?
    `
                        <button class="create-listing-btn" onclick="window.SocialFeedPage.createListing()">
                            + Create Listing
                        </button>
                    ` :
    ''
}
                </div>
            </div>
            <div class="marketplace-grid" id="marketplaceGrid">
                <!-- Marketplace items will be loaded here -->
            </div>
        `;
  },

  // Render online users
  renderOnlineUsers() {
    const users = [
      { name: 'Alex Chen', status: 'online', activity: 'Playing Basketball' },
      { name: 'Sarah Johnson', status: 'idle', activity: 'In #soccer' },
      { name: 'Mike Williams', status: 'online', activity: 'Looking for tennis partner' },
      { name: 'Emma Davis', status: 'dnd', activity: 'In game' },
      { name: 'John Doe', status: 'online', activity: null },
      { name: 'Lisa Brown', status: 'idle', activity: 'In #volleyball' },
      { name: 'Tom Wilson', status: 'online', activity: 'Browsing marketplace' },
      { name: 'Jessica Lee', status: 'online', activity: null }
    ];

    return users
      .map(
        user => `
            <div class="online-user">
                <div class="user-avatar-wrapper">
                    <div class="user-avatar">${this.getInitials(user.name)}</div>
                    <div class="status-indicator ${user.status}"></div>
                </div>
                <div class="user-info">
                    <div class="user-name">${user.name}</div>
                    ${user.activity ? `<div class="user-activity">${user.activity}</div>` : ''}
                </div>
            </div>
        `
      )
      .join('');
  },

  // Get online users count
  getOnlineCount() {
    return 8; // Demo count
  },

  // Get user initials
  getInitials(name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  },

  // Set up event listeners
  setupEventListeners() {
    // Message input character count
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      messageInput.addEventListener('input', e => {
        // Handle typing indicator
        this.handleTyping();
      });
    }
  },

  // Switch channel
  switchChannel(channel) {
    // Leave current channel
    if (this.currentChannel) {
      this.leaveChannel(this.currentChannel);
    }

    // Update current channel
    this.currentChannel = channel;
    this.currentView = 'chat';

    // Join new channel
    this.joinChannel(channel);

    // Clear typing users for new channel
    this.typingUsers.clear();

    // Render UI
    this.render();
  },

  // Switch to marketplace
  switchToMarketplace() {
    this.currentView = 'marketplace';
    this.render();
  },
  
  // Switch to gamification view
  switchToGamification() {
    this.currentView = 'gamification';
    this.render();
  },
  
  // Show leaderboards modal
  async showLeaderboards() {
    if (!window.Gamification) return;
    
    const modal = document.createElement('div');
    modal.className = 'leaderboard-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: #2f3136;
      border-radius: 12px;
      padding: 30px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      color: white;
    `;
    
    // Load leaderboard data
    const weeklyLeaders = await window.Gamification.getLeaderboard('weekly_points');
    const helpfulLeaders = await window.Gamification.getLeaderboard('helpful_members');
    
    content.innerHTML = `
      <h2 style="margin-bottom: 20px;">Community Leaderboards</h2>
      
      <div class="leaderboard-section">
        <h3>📈 Weekly Points Leaders</h3>
        <div class="leaderboard-list">
          ${weeklyLeaders.slice(0, 10).map((user, index) => `
            <div class="leaderboard-item">
              <span class="rank">#${index + 1}</span>
              <span class="user-name">${user.name}</span>
              <span class="score">${user.score} pts</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="leaderboard-section" style="margin-top: 20px;">
        <h3>🤝 Most Helpful Members</h3>
        <div class="leaderboard-list">
          ${helpfulLeaders.slice(0, 10).map((user, index) => `
            <div class="leaderboard-item">
              <span class="rank">#${index + 1}</span>
              <span class="user-name">${user.name}</span>
              <span class="score">${user.score} helped</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <button onclick="document.querySelector('.leaderboard-modal').remove()" 
              style="width: 100%; padding: 12px; background: #5865f2; border: none; 
                     border-radius: 4px; color: white; font-weight: 600; cursor: pointer; 
                     margin-top: 20px;">
        Close
      </button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
  },
  
  // Show daily challenges modal
  showDailyChallenges() {
    if (!window.Gamification) return;
    
    const modal = document.createElement('div');
    modal.className = 'challenges-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: #2f3136;
      border-radius: 12px;
      padding: 30px;
      max-width: 500px;
      width: 90%;
      color: white;
    `;
    
    content.innerHTML = `
      <h2 style="margin-bottom: 20px;">Today's Challenges</h2>
      ${window.Gamification.renderDashboard()}
      <button onclick="document.querySelector('.challenges-modal').remove()" 
              style="width: 100%; padding: 12px; background: #5865f2; border: none; 
                     border-radius: 4px; color: white; font-weight: 600; cursor: pointer; 
                     margin-top: 20px;">
        Close
      </button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
  },

  // Load channel messages
  loadChannelMessages(channel) {
    // Use stored messages if available, otherwise get demo messages
    let messages = this.messages.get(channel);
    if (!messages) {
      messages = this.getDemoMessages(channel);
      this.messages.set(channel, messages);
    }
    this.displayMessages(messages);
  },

  // Get demo messages based on channel
  getDemoMessages(channel) {
    // Check if sample content generator is available and should show samples
    if (window.SampleContentGenerator && window.SampleContentGenerator.shouldShowSampleContent()) {
      const sampleMessages = window.SampleContentGenerator.initializeForChannel(channel);
      if (sampleMessages && sampleMessages.length > 0) {
        // Add a welcome message at the beginning
        sampleMessages.unshift({
          id: 'welcome-' + channel,
          author: { name: 'System', avatar: '🤖' },
          message: `Welcome to #${channel}! This is a sample of what the community looks like.`,
          timestamp: new Date(Date.now() - (1000 * 60 * 60 * 24)), // 1 day ago
          reactions: [],
          isSample: true
        });
        return sampleMessages;
      }
    }
    
    // Fallback to basic demo messages
    const baseMessages = {
      general: [
        {
          id: 1,
          author: { name: 'System', avatar: '🤖' },
          message: 'Welcome to #general! This is the place for general sports discussion.',
          timestamp: new Date(Date.now() - (1000 * 60 * 60 * 24)), // 1 day ago
          reactions: []
        },
        {
          id: 2,
          author: { name: 'Alex Chen', avatar: 'AC' },
          message: 'Hey everyone! Just joined the community. Excited to find some games!',
          timestamp: new Date(Date.now() - (1000 * 60 * 30)), // 30 mins ago
          reactions: [
            { emoji: '👋', count: 3 },
            { emoji: '🎉', count: 1 }
          ]
        },
        {
          id: 3,
          author: { name: 'Sarah Johnson', avatar: 'SJ' },
          message: 'Welcome Alex! What sports are you into?',
          timestamp: new Date(Date.now() - (1000 * 60 * 25)), // 25 mins ago
          reactions: []
        }
      ],
      basketball: [
        {
          id: 4,
          author: { name: 'Mike Williams', avatar: 'MW' },
          message: 'Anyone up for 3v3 at Kits Beach courts this evening? Around 6pm?',
          timestamp: new Date(Date.now() - (1000 * 60 * 15)), // 15 mins ago
          reactions: [
            { emoji: '🏀', count: 2 },
            { emoji: '✅', count: 1 }
          ]
        },
        {
          id: 5,
          author: { name: 'Emma Davis', avatar: 'ED' },
          message: 'I\'m in! Need 1 more for my side',
          timestamp: new Date(Date.now() - (1000 * 60 * 10)), // 10 mins ago
          reactions: []
        }
      ],
      soccer: [
        {
          id: 6,
          author: { name: 'John Doe', avatar: 'JD' },
          message: 'Great game at Burnaby Lake today! Thanks everyone who showed up ⚽',
          timestamp: new Date(Date.now() - (1000 * 60 * 120)), // 2 hours ago
          reactions: [
            { emoji: '⚽', count: 5 },
            { emoji: '🔥', count: 2 }
          ]
        }
      ],
      vancouver: [
        {
          id: 7,
          author: { name: 'Lisa Brown', avatar: 'LB' },
          message: 'Any volleyball drop-ins happening in Vancouver this week?',
          timestamp: new Date(Date.now() - (1000 * 60 * 45)), // 45 mins ago
          reactions: []
        }
      ]
    };

    // Return messages for the channel or empty array
    return (
      baseMessages[channel] || [
        {
          id: 999,
          author: { name: 'System', avatar: '🤖' },
          message: `Welcome to #${channel}! Start the conversation.`,
          timestamp: new Date(),
          reactions: []
        }
      ]
    );
  },

  // Display messages
  displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    if (!container) {
      return;
    }
    
    // Check if any messages are samples and show banner
    const hasSampleContent = messages.some(msg => msg.isSample);
    if (hasSampleContent && window.SampleContentGenerator && window.SampleContentGenerator.shouldShowSampleContent()) {
      window.SampleContentGenerator.showSampleContentBanner(container);
    }

    // For guest users, show blurred messages
    const isBlurred = window.isGuest;

    container.innerHTML = messages
      .map(
        msg => `
            <div class="discord-message ${isBlurred ? 'blurred' : ''}" data-message-id="${msg.id}" ${msg.isSample ? 'data-sample="true"' : ''}>
                <div class="message-avatar">${msg.author.avatar}</div>
                <div class="message-content-wrapper">
                    <div class="message-header">
                        <span class="message-author">${msg.author.name}</span>
                        <span class="message-timestamp">${this.formatTimestamp(msg.timestamp)}</span>
                    </div>
                    <div class="message-text">${msg.message}</div>
                    ${
  msg.reactions && msg.reactions.length > 0 ?
    `
                        <div class="message-reactions">
                            ${msg.reactions
    .map(
      r => `
                                <div class="reaction" onclick="window.SocialFeedPage.toggleReaction(${msg.id}, '${r.emoji}')">
                                    <span class="reaction-emoji">${r.emoji}</span>
                                    <span class="reaction-count">${r.count}</span>
                                </div>
                            `
    )
    .join('')}
                            ${
  !window.isGuest ?
    `
                                <button class="add-reaction-btn" onclick="window.SocialFeedPage.showReactionPicker(${msg.id})">
                                    +
                                </button>
                            ` :
    ''
}
                        </div>
                    ` :
    ''
}
                </div>
            </div>
        `
      )
      .join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  },

  // Format timestamp Discord style
  formatTimestamp(timestamp) {
    if (this.i18n) {
      // Use i18n service for formatting
      return this.i18n.formatRelativeTime(timestamp);
    }
    
    // Fallback to original formatting
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;

    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }

    // If yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }

    // Otherwise show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  // Handle typing
  handleTyping() {
    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Send typing event via WebSocket
    if (window.wsClient && window.wsClient.socket && !window.isGuest) {
      window.wsClient.socket.emit('start-typing', {
        channel: this.currentChannel,
        userName: localStorage.getItem('userName') || 'Anonymous'
      });
    }

    // Stop typing after 3 seconds
    this.typingTimeout = setTimeout(() => {
      if (window.wsClient && window.wsClient.socket) {
        window.wsClient.socket.emit('stop-typing', {
          channel: this.currentChannel
        });
      }
    }, 3000);
  },

  // Update typing indicator
  updateTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (!indicator) {
      return;
    }

    if (this.typingUsers.size > 0) {
      const typingArray = Array.from(this.typingUsers.values());
      let text = '';

      if (typingArray.length === 1) {
        text = `${typingArray[0].name} is typing...`;
      } else if (typingArray.length === 2) {
        text = `${typingArray[0].name} and ${typingArray[1].name} are typing...`;
      } else {
        text = `${typingArray[0].name} and ${typingArray.length - 1} others are typing...`;
      }

      indicator.querySelector('.typing-text').textContent = text;
      indicator.style.display = 'block';
    } else {
      indicator.style.display = 'none';
    }
  },

  // Append message to chat
  appendMessage(message) {
    const container = document.getElementById('messagesContainer');
    if (!container) {
      return;
    }

    const messageEl = this.createMessageElement(message);
    container.appendChild(messageEl);

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  },

  // Create message element
  createMessageElement(message) {
    const div = document.createElement('div');
    const isBlurred = window.isGuest;

    div.className = `discord-message ${isBlurred ? 'blurred' : ''}`;
    div.dataset.messageId = message.id;

    div.innerHTML = `
            <div class="message-avatar">${message.author.avatar}</div>
            <div class="message-content-wrapper">
                <div class="message-header">
                    <span class="message-author">${message.author.name}</span>
                    <span class="message-timestamp">${this.formatTimestamp(message.timestamp)}</span>
                </div>
                <div class="message-text">${message.message}</div>
                ${
  message.reactions && message.reactions.length > 0 ?
    `
                    <div class="message-reactions">
                        ${message.reactions
    .map(
      r => `
                            <div class="reaction" onclick="window.SocialFeedPage.toggleReaction(${message.id}, '${r.emoji}')">
                                <span class="reaction-emoji">${r.emoji}</span>
                                <span class="reaction-count">${r.count}</span>
                            </div>
                        `
    )
    .join('')}
                        ${
  !window.isGuest ?
    `
                            <button class="add-reaction-btn" onclick="window.SocialFeedPage.showReactionPicker(${message.id})">
                                +
                            </button>
                        ` :
    ''
}
                    </div>
                ` :
    ''
}
            </div>
        `;

    return div;
  },

  // Update message reactions in UI
  updateMessageReactions(messageId, reactions) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageEl) {
      return;
    }

    const contentWrapper = messageEl.querySelector('.message-content-wrapper');
    const reactionsEl = contentWrapper.querySelector('.message-reactions');

    if (reactions && reactions.length > 0) {
      const reactionsHTML = `
                ${reactions
    .map(
      r => `
                    <div class="reaction" onclick="window.SocialFeedPage.toggleReaction(${messageId}, '${r.emoji}')">
                        <span class="reaction-emoji">${r.emoji}</span>
                        <span class="reaction-count">${r.count}</span>
                    </div>
                `
    )
    .join('')}
                ${
  !window.isGuest ?
    `
                    <button class="add-reaction-btn" onclick="window.SocialFeedPage.showReactionPicker(${messageId})">
                        +
                    </button>
                ` :
    ''
}
            `;

      if (reactionsEl) {
        reactionsEl.innerHTML = reactionsHTML;
      } else {
        const div = document.createElement('div');
        div.className = 'message-reactions';
        div.innerHTML = reactionsHTML;
        contentWrapper.appendChild(div);
      }
    } else if (reactionsEl) {
      reactionsEl.remove();
    }
  },

  // Update online users list
  updateOnlineUsersList() {
    const listEl = document.getElementById('onlineUsersList');
    const countEl = document.querySelector('.online-header');

    if (listEl) {
      const users = Array.from(this.onlineUsers.values());
      listEl.innerHTML = users
        .map(
          user => `
                <div class="online-user">
                    <div class="user-avatar-wrapper">
                        <div class="user-avatar">${this.getInitials(user.name)}</div>
                        <div class="status-indicator ${user.status || 'online'}"></div>
                    </div>
                    <div class="user-info">
                        <div class="user-name">${user.name}</div>
                        ${user.activity ? `<div class="user-activity">${user.activity}</div>` : ''}
                    </div>
                </div>
            `
        )
        .join('');
    }

    if (countEl) {
      countEl.textContent = `ONLINE — ${this.onlineUsers.size}`;
    }
  },

  // Handle key down in message input
  handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  },

  // Send message
  async sendMessage() {
    const input = document.getElementById('messageInput');
    if (!input || !input.value.trim()) {
      return;
    }

    const message = input.value.trim();

    // Clear input
    input.value = '';

    // Stop typing
    if (window.wsClient && window.wsClient.socket) {
      window.wsClient.socket.emit('stop-typing', {
        channel: this.currentChannel
      });
    }

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
      reactions: []
    };

    // Send via WebSocket
    if (window.wsClient && window.wsClient.socket) {
      window.wsClient.socket.emit('send-message', {
        channel: this.currentChannel,
        message: newMessage
      });
    }

    // Add to local messages immediately for responsiveness
    if (!this.messages.has(this.currentChannel)) {
      this.messages.set(this.currentChannel, []);
    }
    this.messages.get(this.currentChannel).push(newMessage);

    // Update UI
    this.appendMessage(newMessage);
    
    // Track message count for feature unlocking
    const messageCount = parseInt(localStorage.getItem('messageCount') || '0');
    localStorage.setItem('messageCount', (messageCount + 1).toString());
    
    // Check for feature unlocks
    if (window.OnboardingSystem) {
      window.OnboardingSystem.checkFeatureProgress();
    }
    
    // Track gamification action
    if (window.Gamification && !window.isGuest) {
      // Award points for sending message
      window.Gamification.awardPoints(
        { type: 'send_message', channel: this.currentChannel },
        window.Gamification.POINTS.SEND_MESSAGE,
        'Sent a message'
      );
      
      // Check if it's the first message of the day
      const lastMessageDate = localStorage.getItem('lastMessageDate');
      const today = new Date().toDateString();
      if (lastMessageDate !== today) {
        localStorage.setItem('lastMessageDate', today);
        window.Gamification.awardPoints(
          { type: 'daily_chat' },
          window.Gamification.POINTS.DAILY_CHAT,
          'First message of the day'
        );
      }
    }
  },

  // Toggle reaction
  toggleReaction(messageId, emoji) {
    if (window.isGuest) {
      this.showFeedback('Sign in to react to messages', 'info');
      return;
    }

    // Send reaction via WebSocket
    if (window.wsClient && window.wsClient.socket) {
      window.wsClient.socket.emit('toggle-reaction', {
        channel: this.currentChannel,
        messageId,
        emoji,
        userId: this.currentUserId
      });
    }
    
    // Track gamification action
    if (window.Gamification) {
      // Track that user gave a reaction (helping others)
      window.Gamification.awardPoints(
        { type: 'give_reaction', emoji },
        1,
        'Reacted to a message'
      );
    }
  },

  // Show reaction picker
  showReactionPicker(messageId) {
    if (window.isGuest) {
      this.showFeedback('Sign in to react to messages', 'info');
      return;
    }

    // Create simple emoji picker
    const picker = document.createElement('div');
    picker.className = 'emoji-reaction-picker';
    picker.innerHTML = `
            <div class="emoji-grid">
                ${['👍', '❤️', '😄', '😮', '😢', '🎉', '🏀', '⚽', '🏐', '🎾', '🏒']
    .map(
      emoji =>
        `<span class="emoji-option" onclick="window.SocialFeedPage.addReaction(${messageId}, '${emoji}')">${emoji}</span>`
    )
    .join('')}
            </div>
        `;

    // Position near the message
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
      messageEl.appendChild(picker);

      // Close on click outside
      setTimeout(() => {
        document.addEventListener('click', function closePickerHandler(e) {
          if (!picker.contains(e.target)) {
            picker.remove();
            document.removeEventListener('click', closePickerHandler);
          }
        });
      }, 100);
    }
  },

  // Add reaction
  addReaction(messageId, emoji) {
    this.toggleReaction(messageId, emoji);
    // Close picker
    const picker = document.querySelector('.emoji-reaction-picker');
    if (picker) {
      picker.remove();
    }
  },

  // Toggle emoji picker for message input
  toggleEmojiPicker() {
    if (window.isGuest) {
      return;
    }

    let picker = document.getElementById('messageEmojiPicker');

    if (picker) {
      picker.remove();
    } else {
      picker = document.createElement('div');
      picker.id = 'messageEmojiPicker';
      picker.className = 'message-emoji-picker';
      picker.innerHTML = `
                <div class="emoji-grid">
                    ${['😊', '😄', '😎', '🤔', '👍', '❤️', '🎉', '🏀', '⚽', '🏐', '🎾', '🏒', '🏃', '💪', '🔥', '⭐']
    .map(
      emoji =>
        `<span class="emoji-option" onclick="window.SocialFeedPage.insertEmoji('${emoji}')">${emoji}</span>`
    )
    .join('')}
                </div>
            `;

      const inputContainer = document.querySelector('.message-input-container');
      if (inputContainer) {
        inputContainer.appendChild(picker);
      }
    }
  },

  // Insert emoji into message input
  insertEmoji(emoji) {
    const input = document.getElementById('messageInput');
    if (input) {
      input.value += emoji;
      input.focus();
    }
  },

  // Load marketplace items
  loadMarketplaceItems() {
    // Check if we should show sample content
    if (window.SampleContentGenerator && window.SampleContentGenerator.shouldShowSampleContent()) {
      const sampleItems = window.SampleContentGenerator.initializeMarketplace();
      if (sampleItems && sampleItems.length > 0) {
        this.displayMarketplaceItems(sampleItems);
        return;
      }
    }
    
    const items = [
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
      {
        id: 2,
        category: 'team-looking',
        title: 'Soccer Team Needs 2 Players',
        description: 'Intermediate level team looking for midfielders for Sunday league',
        price: 'Free',
        sport: 'soccer',
        location: 'burnaby',
        seller: 'Burnaby FC',
        image: '⚽',
        posted: new Date(Date.now() - (1000 * 60 * 60 * 5))
      },
      {
        id: 3,
        category: 'carpool',
        title: 'Carpool to Richmond Oval',
        description: 'Looking for people to share rides to volleyball games on Wednesdays',
        price: 'Gas split',
        sport: 'volleyball',
        location: 'richmond',
        seller: 'Sarah J.',
        image: '🚗',
        posted: new Date(Date.now() - (1000 * 60 * 60 * 12))
      },
      {
        id: 4,
        category: 'equipment-wanted',
        title: 'Looking for Tennis Racket',
        description: 'Beginner looking for affordable tennis racket in good condition',
        price: '$50 budget',
        sport: 'tennis',
        location: 'vancouver',
        seller: 'Mike W.',
        image: '🎾',
        posted: new Date(Date.now() - (1000 * 60 * 60 * 24))
      }
    ];

    this.displayMarketplaceItems(items);
  },

  // Display marketplace items
  displayMarketplaceItems(items) {
    const grid = document.getElementById('marketplaceGrid');
    if (!grid) {
      return;
    }
    
    // Check if showing sample content
    const hasSampleContent = items.some(item => item.isSample);
    if (hasSampleContent && window.SampleContentGenerator && window.SampleContentGenerator.shouldShowSampleContent()) {
      window.SampleContentGenerator.showSampleContentBanner(grid.parentElement);
    }

    grid.innerHTML = items
      .map(
        item => `
            <div class="marketplace-card" data-category="${item.category}" data-sport="${item.sport}" data-location="${item.location}" ${item.isSample ? 'data-sample="true"' : ''}>
                <div class="marketplace-card-header">
                    <div class="item-image">${item.image}</div>
                    <div class="item-category">${this.formatCategory(item.category)}</div>
                </div>
                <div class="marketplace-card-body">
                    <h3 class="item-title">${item.title}</h3>
                    <p class="item-description">${item.description}</p>
                    <div class="item-details">
                        <span class="item-price">${this.formatMarketplacePrice(item)}</span>
                        <span class="item-location">${item.location}</span>
                        <span class="item-sport">${this.i18n ? this.i18n.getSportName(item.sport) : item.sport}</span>
                    </div>
                    <div class="item-footer">
                        <span class="item-seller">Posted by ${item.seller}</span>
                        <span class="item-time">${this.formatTime(item.posted)}</span>
                    </div>
                    ${
  !window.isGuest ?
    `
                        <button class="contact-btn" onclick="window.SocialFeedPage.contactSeller(${item.id})">
                            Contact Seller
                        </button>
                    ` :
    `
                        <button class="contact-btn disabled" onclick="window.SocialFeedPage.showGuestPrompt()">
                            Sign in to Contact
                        </button>
                    `
}
                </div>
            </div>
        `
      )
      .join('');
  },

  // Format category name
  formatCategory(category) {
    const categories = {
      'equipment-sale': 'For Sale',
      'equipment-wanted': 'Wanted',
      carpool: 'Carpool',
      'team-looking': 'Team Needs Players'
    };
    return categories[category] || category;
  },

  // Filter marketplace
  filterMarketplace() {
    const category = document.getElementById('marketplaceCategory').value;
    const sport = document.getElementById('marketplaceSport').value;
    const location = document.getElementById('marketplaceLocation').value;

    const cards = document.querySelectorAll('.marketplace-card');

    cards.forEach(card => {
      const cardCategory = card.dataset.category;
      const cardSport = card.dataset.sport;
      const cardLocation = card.dataset.location;

      const categoryMatch = category === 'all' || cardCategory === category;
      const sportMatch = sport === 'all' || cardSport === sport;
      const locationMatch = location === 'all' || cardLocation === location;

      card.style.display = categoryMatch && sportMatch && locationMatch ? 'block' : 'none';
    });
  },

  // Contact seller
  contactSeller(itemId) {
    console.log('Contact seller for item:', itemId);
    this.showFeedback('Contact information sent to your messages', 'success');
  },

  // Show guest prompt
  showGuestPrompt() {
    this.showFeedback('Please sign in to contact sellers', 'info');
  },

  // Create listing
  createListing() {
    console.log('Create new marketplace listing');
    // Would open create listing modal
    this.showFeedback('Create listing feature coming soon!', 'info');
  },

  // Format time
  formatTime(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return 'just now';
    }
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    if (hours < 24) {
      return `${hours}h ago`;
    }
    if (days < 7) {
      return `${days}d ago`;
    }

    return timestamp.toLocaleDateString();
  },

  // Render gamification view
  renderGamificationView() {
    if (!window.Gamification) {
      return '<div class="gamification-loading">Loading rewards system...</div>';
    }
    
    return `
      <div class="gamification-header">
        <h2>Your Progress & Rewards</h2>
      </div>
      
      <div class="gamification-content">
        ${window.Gamification.renderDashboard()}
        
        <div class="unlocked-features" style="margin-top: 20px;">
          <h3>Unlocked Features</h3>
          <div class="features-grid">
            ${window.Gamification.userStats.unlocked_features.map(featureId => {
              const feature = window.Gamification.UNLOCKABLES[featureId.toUpperCase()];
              return feature ? `
                <div class="feature-card unlocked">
                  <span class="feature-icon">${feature.icon}</span>
                  <h4>${feature.name}</h4>
                  <p>${feature.description}</p>
                </div>
              ` : '';
            }).join('')}
          </div>
        </div>
        
        <div class="locked-features" style="margin-top: 20px;">
          <h3>Features to Unlock</h3>
          <div class="features-grid">
            ${Object.values(window.Gamification.UNLOCKABLES)
              .filter(f => !window.Gamification.userStats.unlocked_features.includes(f.id))
              .slice(0, 6)
              .map(feature => `
                <div class="feature-card locked">
                  <span class="feature-icon">${feature.icon}</span>
                  <h4>${feature.name}</h4>
                  <p>${feature.description}</p>
                  <div class="requirement">
                    ${feature.requirement.points ? `${feature.requirement.points} points` : ''}
                    ${feature.requirement.badge ? `${feature.requirement.badge} badge` : ''}
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
      </div>
    `;
  },
  
  // Show feedback message
  showFeedback(message, type) {
    const feedback = document.createElement('div');
    feedback.className = `feed-feedback ${type}`;
    feedback.textContent = message;
    feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${(() => {
    if (type === 'success') { return '#4CAF50'; }
    if (type === 'info') { return '#2196F3'; }
    return '#f44336';
  })()};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;

    document.body.appendChild(feedback);

    setTimeout(() => (feedback.style.opacity = '1'), 10);

    setTimeout(() => {
      feedback.style.opacity = '0';
      setTimeout(() => feedback.remove(), 300);
    }, 3000);
  },

  // Show preferences modal
  showPreferences() {
    const modal = document.createElement('div');
    modal.className = 'preferences-modal';
    modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

    const content = document.createElement('div');
    content.style.cssText = `
            background: #2f3136;
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            color: white;
        `;

    content.innerHTML = `
            <h2 style="margin-bottom: 20px;">Chat Preferences</h2>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; color: #b9bbbe;">Preferred Location</label>
                <select id="prefLocation" style="width: 100%; padding: 10px; background: #40444b; border: 1px solid #202225; border-radius: 4px; color: white;">
                    <option value="vancouver" ${this.userLocation === 'vancouver' ? 'selected' : ''}>Vancouver</option>
                    <option value="burnaby" ${this.userLocation === 'burnaby' ? 'selected' : ''}>Burnaby</option>
                    <option value="richmond" ${this.userLocation === 'richmond' ? 'selected' : ''}>Richmond</option>
                    <option value="surrey" ${this.userLocation === 'surrey' ? 'selected' : ''}>Surrey</option>
                </select>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; color: #b9bbbe;">Preferred Sport</label>
                <select id="prefSport" style="width: 100%; padding: 10px; background: #40444b; border: 1px solid #202225; border-radius: 4px; color: white;">
                    <option value="general" ${this.userSport === 'general' ? 'selected' : ''}>General (All Sports)</option>
                    <option value="basketball" ${this.userSport === 'basketball' ? 'selected' : ''}>Basketball</option>
                    <option value="soccer" ${this.userSport === 'soccer' ? 'selected' : ''}>Soccer</option>
                    <option value="volleyball" ${this.userSport === 'volleyball' ? 'selected' : ''}>Volleyball</option>
                    <option value="tennis" ${this.userSport === 'tennis' ? 'selected' : ''}>Tennis</option>
                    <option value="hockey" ${this.userSport === 'hockey' ? 'selected' : ''}>Hockey</option>
                </select>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 30px;">
                <button onclick="window.SocialFeedPage.savePreferences()" style="flex: 1; padding: 12px; background: #5865f2; border: none; border-radius: 4px; color: white; font-weight: 600; cursor: pointer;">
                    Save & Join Channel
                </button>
                <button onclick="document.querySelector('.preferences-modal').remove()" style="flex: 1; padding: 12px; background: #40444b; border: none; border-radius: 4px; color: white; font-weight: 600; cursor: pointer;">
                    Cancel
                </button>
            </div>
        `;

    modal.appendChild(content);
    document.body.appendChild(modal);
  },

  // Save preferences
  savePreferences() {
    const location = document.getElementById('prefLocation').value;
    const sport = document.getElementById('prefSport').value;

    // Save to localStorage
    localStorage.setItem('preferredLocation', location);
    localStorage.setItem('preferredSport', sport);

    // Update current preferences
    this.userLocation = location;
    this.userSport = sport;

    // Determine new channel
    let newChannel = 'general';
    if (location && sport !== 'general') {
      newChannel = sport; // Prioritize sport-specific channels
    } else if (location) {
      newChannel = location;
    }

    // Close modal
    document.querySelector('.preferences-modal').remove();

    // Switch to new channel
    if (newChannel !== this.currentChannel) {
      this.switchChannel(newChannel);
    } else {
      // Just re-render to update UI
      this.render();
    }

    this.showFeedback(`Preferences saved! Joined #${newChannel}`, 'success');
  },
  
  // Get translated channel name
  getTranslatedChannelName(channel) {
    if (!this.i18n) return channel;
    
    // Check if it's a sport channel
    const sportKey = `sport.${channel}`;
    const sportName = this.i18n.getSportName(channel);
    
    // If we found a translation, use it
    if (sportName !== channel) {
      return sportName;
    }
    
    // Otherwise return the channel name as-is (for location channels)
    return channel.charAt(0).toUpperCase() + channel.slice(1);
  },
  
  // Format marketplace price with localized currency
  formatMarketplacePrice(item) {
    if (!this.i18n) return item.price;
    
    // Check if price is a number
    if (typeof item.price === 'number') {
      return this.i18n.formatCurrency(item.price);
    }
    
    // Check for special cases
    if (item.price === 'Free' || item.price === 'free') {
      return this.i18n.t('marketplace.free');
    }
    
    if (item.price === 'Negotiable' || item.price.includes('negotiable')) {
      return this.i18n.t('marketplace.negotiable');
    }
    
    // Try to extract number from string (e.g., "$80" -> 80)
    const match = item.price.match(/[\d.]+/);
    if (match) {
      const amount = parseFloat(match[0]);
      return this.i18n.formatCurrency(amount);
    }
    
    // Return as-is if we can't parse it
    return item.price;
  }
};
