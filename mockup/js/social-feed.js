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

    // Initialize the Social Feed page
    async initialize() {
        // Initialize WebSocket for real-time chat if not already connected
        if (window.wsClient && !window.wsClient.connected) {
            window.wsClient.connect();
        }

        // Set up WebSocket event handlers for chat
        this.setupWebSocketHandlers();

        // Get current user ID
        this.currentUserId = localStorage.getItem('userId') || `guest-${Date.now()}`;

        // Load initial feed data
        await this.loadFeed();
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
                    <!-- Left Sidebar - Channels -->
                    <div class="discord-sidebar">
                        <div class="sidebar-header">
                            <h3>FindingSports Community</h3>
                        </div>
                        
                        <!-- Chat Channels -->
                        <div class="channel-section">
                            <div class="channel-header">
                                <span class="collapse-icon">▼</span>
                                TEXT CHANNELS
                            </div>
                            <div class="channels-list">
                                <div class="channel-item ${this.currentChannel === 'general' ? 'active' : ''}" 
                                     onclick="window.SocialFeedPage.switchChannel('general')">
                                    <span class="channel-icon">#</span> general
                                </div>
                                <div class="channel-item ${this.currentChannel === 'basketball' ? 'active' : ''}" 
                                     onclick="window.SocialFeedPage.switchChannel('basketball')">
                                    <span class="channel-icon">#</span> basketball
                                </div>
                                <div class="channel-item ${this.currentChannel === 'soccer' ? 'active' : ''}" 
                                     onclick="window.SocialFeedPage.switchChannel('soccer')">
                                    <span class="channel-icon">#</span> soccer
                                </div>
                                <div class="channel-item ${this.currentChannel === 'volleyball' ? 'active' : ''}" 
                                     onclick="window.SocialFeedPage.switchChannel('volleyball')">
                                    <span class="channel-icon">#</span> volleyball
                                </div>
                                <div class="channel-item ${this.currentChannel === 'tennis' ? 'active' : ''}" 
                                     onclick="window.SocialFeedPage.switchChannel('tennis')">
                                    <span class="channel-icon">#</span> tennis
                                </div>
                                <div class="channel-item ${this.currentChannel === 'hockey' ? 'active' : ''}" 
                                     onclick="window.SocialFeedPage.switchChannel('hockey')">
                                    <span class="channel-icon">#</span> hockey
                                </div>
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

                        <!-- Location Channels -->
                        <div class="channel-section">
                            <div class="channel-header">
                                <span class="collapse-icon">▼</span>
                                LOCATIONS
                            </div>
                            <div class="channels-list">
                                <div class="channel-item ${this.currentChannel === 'vancouver' ? 'active' : ''}" 
                                     onclick="window.SocialFeedPage.switchChannel('vancouver')">
                                    <span class="channel-icon">#</span> vancouver
                                </div>
                                <div class="channel-item ${this.currentChannel === 'burnaby' ? 'active' : ''}" 
                                     onclick="window.SocialFeedPage.switchChannel('burnaby')">
                                    <span class="channel-icon">#</span> burnaby
                                </div>
                                <div class="channel-item ${this.currentChannel === 'richmond' ? 'active' : ''}" 
                                     onclick="window.SocialFeedPage.switchChannel('richmond')">
                                    <span class="channel-icon">#</span> richmond
                                </div>
                                <div class="channel-item ${this.currentChannel === 'surrey' ? 'active' : ''}" 
                                     onclick="window.SocialFeedPage.switchChannel('surrey')">
                                    <span class="channel-icon">#</span> surrey
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Main Content Area -->
                    <div class="discord-main">
                        ${this.currentView === 'chat' ? this.renderChatView() : this.renderMarketplaceView()}
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
                            placeholder="Message #${this.currentChannel}"
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
                        <button class="auth-button discord-style" onclick="window.location.href='/login-google.html'">
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
                <h2>Sports Marketplace</h2>
                <div class="marketplace-filters">
                    <select id="marketplaceCategory" class="marketplace-select" onchange="window.SocialFeedPage.filterMarketplace()">
                        <option value="all">All Categories</option>
                        <option value="equipment-sale">Equipment for Sale</option>
                        <option value="equipment-wanted">Equipment Wanted</option>
                        <option value="carpool">Carpooling</option>
                        <option value="team-looking">Team Looking for Players</option>
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

        // For guest users, show blurred messages
        const isBlurred = window.isGuest;

        container.innerHTML = messages
            .map(
                msg => `
            <div class="discord-message ${isBlurred ? 'blurred' : ''}" data-message-id="${msg.id}">
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

        grid.innerHTML = items
            .map(
                item => `
            <div class="marketplace-card" data-category="${item.category}" data-sport="${item.sport}" data-location="${item.location}">
                <div class="marketplace-card-header">
                    <div class="item-image">${item.image}</div>
                    <div class="item-category">${this.formatCategory(item.category)}</div>
                </div>
                <div class="marketplace-card-body">
                    <h3 class="item-title">${item.title}</h3>
                    <p class="item-description">${item.description}</p>
                    <div class="item-details">
                        <span class="item-price">${item.price}</span>
                        <span class="item-location">${item.location}</span>
                        <span class="item-sport">${item.sport}</span>
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
                if (type === 'success') return '#4CAF50';
                if (type === 'info') return '#2196F3';
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
    }
};
