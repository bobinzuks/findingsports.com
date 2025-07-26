// SECURE Social Feed System - Fixed XSS and Security Issues
(function() {
    'use strict';
    
    console.log('SECURE Social Feed System Loading...');
    
    // Secure social feed state
    window.socialFeedSecure = {
        posts: [],
        chatRooms: new Map(),
        activeChat: null,
        isLoading: false,
        currentFilter: 'all',
        maxPosts: 100, // Limit posts for performance
        maxChatMessages: 500, // Limit chat messages
        eventListeners: new Map() // Track event listeners for cleanup
    };
    
    // Initialize secure social feed
    window.initSecureSocialFeed = function() {
        console.log('Initializing secure social feed...');
        
        // Load posts with error handling
        loadSocialPostsSecure();
        
        // Setup real-time updates placeholder
        setupRealTimeUpdatesSecure();
        
        // Render initial feed
        renderSocialFeedSecure();
        
        // Setup periodic refresh
        setupPeriodicRefresh();
    };
    
    // Load social posts with comprehensive security
    async function loadSocialPostsSecure() {
        if (window.socialFeedSecure.isLoading) return;
        
        window.socialFeedSecure.isLoading = true;
        
        // Show loading state
        const feedContainer = document.getElementById('social-feed-container');
        if (feedContainer) {
            showLoadingState(feedContainer);
        }
        
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Add auth token if available
            if (window.authState && window.authState.token) {
                headers['Authorization'] = `Bearer ${window.authState.token}`;
            }
            
            // Add CSRF token
            if (window.SecurityUtils) {
                headers['X-CSRF-Token'] = SecurityUtils.setCSRFToken();
            }
            
            const response = await fetch('/api/social/posts', {
                method: 'GET',
                headers: headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && Array.isArray(data.posts)) {
                // Sanitize and validate posts
                const sanitizedPosts = data.posts.map(sanitizePost).filter(Boolean);
                
                // Limit number of posts for performance
                window.socialFeedSecure.posts = sanitizedPosts.slice(0, window.socialFeedSecure.maxPosts);
                
                console.log(`Loaded ${window.socialFeedSecure.posts.length} posts`);
            } else {
                console.warn('Invalid posts data received, using demo data');
                window.socialFeedSecure.posts = getDemoPostsSecure();
            }
            
            renderSocialFeedSecure();
        } catch (error) {
            console.error('Error loading social posts:', error);
            
            // Show error state
            if (feedContainer) {
                showErrorState(feedContainer, 'Failed to load social feed. Please try again.');
            }
            
            // Fall back to demo data
            window.socialFeedSecure.posts = getDemoPostsSecure();
            renderSocialFeedSecure();
        } finally {
            window.socialFeedSecure.isLoading = false;
        }
    }
    
    // Sanitize a single post
    function sanitizePost(post) {
        if (!post || typeof post !== 'object') return null;
        
        try {
            return {
                id: SecurityUtils.sanitizeHTML(post.id || ''),
                author: sanitizeAuthor(post.author),
                content: SecurityUtils.sanitizeMessage(post.content || ''),
                timestamp: validateTimestamp(post.timestamp),
                likes: Math.max(0, parseInt(post.likes) || 0),
                comments: Math.max(0, parseInt(post.comments) || 0),
                type: ['post', 'game'].includes(post.type) ? post.type : 'post',
                gameId: post.gameId ? SecurityUtils.sanitizeHTML(post.gameId) : null,
                gameInfo: post.gameInfo ? sanitizeGameInfo(post.gameInfo) : null
            };
        } catch (error) {
            console.error('Error sanitizing post:', error);
            return null;
        }
    }
    
    // Sanitize author information
    function sanitizeAuthor(author) {
        if (!author || typeof author !== 'object') {
            return {
                name: 'Unknown User',
                avatar: 'https://via.placeholder.com/40x40?text=U',
                isAdmin: false
            };
        }
        
        return {
            name: SecurityUtils.sanitizeName(author.name || 'Unknown User'),
            avatar: SecurityUtils.sanitizeURL(author.avatar || author.picture || '') || 'https://via.placeholder.com/40x40?text=U',
            isAdmin: Boolean(author.isAdmin)
        };
    }
    
    // Sanitize game information
    function sanitizeGameInfo(gameInfo) {
        if (!gameInfo || typeof gameInfo !== 'object') return null;
        
        return {
            sport: SecurityUtils.sanitizeHTML(gameInfo.sport || 'Sport'),
            location: SecurityUtils.sanitizeHTML(gameInfo.location || 'Location TBD'),
            time: SecurityUtils.sanitizeHTML(gameInfo.time || 'Time TBD'),
            spotsLeft: Math.max(0, parseInt(gameInfo.spotsLeft) || 0)
        };
    }
    
    // Validate timestamp
    function validateTimestamp(timestamp) {
        const ts = parseInt(timestamp);
        if (isNaN(ts) || ts < 0 || ts > Date.now() + 86400000) {
            return Date.now() - 3600000; // Default to 1 hour ago
        }
        return ts;
    }
    
    // Get demo posts with security
    function getDemoPostsSecure() {
        const demoData = [
            {
                id: 'demo-1',
                author: {
                    name: 'Demo User',
                    avatar: 'https://via.placeholder.com/40x40?text=D',
                    isAdmin: false
                },
                content: 'Welcome to the secure social feed! All content is now properly sanitized.',
                timestamp: Date.now() - 3600000,
                likes: 8,
                comments: 3,
                type: 'post',
                gameId: null
            },
            {
                id: 'demo-2',
                author: {
                    name: 'Game Host',
                    avatar: 'https://via.placeholder.com/40x40?text=G',
                    isAdmin: true
                },
                content: 'Basketball game at Hillcrest Community Centre - 2 spots left! Secure chat available.',
                timestamp: Date.now() - 1800000,
                likes: 15,
                comments: 12,
                type: 'game',
                gameId: 'game-123',
                gameInfo: {
                    sport: 'Basketball',
                    location: 'Hillcrest Community Centre',
                    time: '7:00 PM',
                    spotsLeft: 2
                }
            }
        ];
        
        return demoData.map(sanitizePost).filter(Boolean);
    }
    
    // Render social feed with security
    function renderSocialFeedSecure() {
        const feedContainer = document.getElementById('social-feed-container');
        if (!feedContainer) return;
        
        // Clear existing content
        feedContainer.innerHTML = '';
        
        if (window.socialFeedSecure.posts.length === 0) {
            showEmptyState(feedContainer);
            return;
        }
        
        // Create posts container
        const postsContainer = document.createElement('div');
        postsContainer.className = 'posts-container';
        
        // Render posts securely
        window.socialFeedSecure.posts.forEach(post => {
            const postElement = createPostElementSecure(post);
            if (postElement) {
                postsContainer.appendChild(postElement);
            }
        });
        
        feedContainer.appendChild(postsContainer);
    }
    
    // Create post element securely
    function createPostElementSecure(post) {
        try {
            const postDiv = document.createElement('div');
            postDiv.className = 'social-post';
            postDiv.setAttribute('data-post-id', post.id);
            
            // Post header
            const header = document.createElement('div');
            header.className = 'post-header';
            
            // Author avatar
            const avatar = document.createElement('img');
            avatar.className = 'author-avatar';
            avatar.src = post.author.avatar;
            avatar.alt = `${post.author.name} avatar`;
            avatar.onerror = function() {
                this.src = 'https://via.placeholder.com/40x40?text=U';
            };
            
            // Author info
            const authorInfo = document.createElement('div');
            authorInfo.className = 'author-info';
            
            const authorName = document.createElement('span');
            authorName.className = 'author-name';
            authorName.textContent = post.author.name;
            
            const postTime = document.createElement('span');
            postTime.className = 'post-time';
            postTime.textContent = formatTimeSecure(post.timestamp);
            
            authorInfo.appendChild(authorName);
            
            // Admin badge
            if (post.author.isAdmin) {
                const adminBadge = document.createElement('span');
                adminBadge.className = 'admin-badge';
                adminBadge.textContent = 'Admin';
                authorInfo.appendChild(adminBadge);
            }
            
            authorInfo.appendChild(postTime);
            
            header.appendChild(avatar);
            header.appendChild(authorInfo);
            
            // Post content
            const content = document.createElement('div');
            content.className = 'post-content';
            content.textContent = post.content;
            
            // Game info if applicable
            if (post.type === 'game' && post.gameInfo) {
                const gameInfo = createGameInfoElementSecure(post.gameInfo, post.gameId);
                if (gameInfo) {
                    content.appendChild(gameInfo);
                }
            }
            
            // Post actions
            const actions = createPostActionsSecure(post);
            
            // Assemble post
            postDiv.appendChild(header);
            postDiv.appendChild(content);
            postDiv.appendChild(actions);
            
            return postDiv;
        } catch (error) {
            console.error('Error creating post element:', error);
            return null;
        }
    }
    
    // Create game info element securely
    function createGameInfoElementSecure(gameInfo, gameId) {
        const gameDiv = document.createElement('div');
        gameDiv.className = 'game-info';
        
        const gameDetails = document.createElement('div');
        gameDetails.className = 'game-details';
        
        // Sport
        const sport = document.createElement('span');
        sport.innerHTML = `🏀 ${gameInfo.sport}`;
        
        // Location
        const location = document.createElement('span');
        location.innerHTML = `📍 ${gameInfo.location}`;
        
        // Time
        const time = document.createElement('span');
        time.innerHTML = `🕐 ${gameInfo.time}`;
        
        // Spots left
        const spots = document.createElement('span');
        spots.className = 'spots-left';
        spots.textContent = `${gameInfo.spotsLeft} spots left`;
        
        gameDetails.appendChild(sport);
        gameDetails.appendChild(location);
        gameDetails.appendChild(time);
        gameDetails.appendChild(spots);
        
        // Join game button
        const joinBtn = document.createElement('button');
        joinBtn.className = 'join-game-btn';
        joinBtn.textContent = 'Join Game';
        joinBtn.onclick = () => joinGameSecure(gameId);
        
        gameDiv.appendChild(gameDetails);
        gameDiv.appendChild(joinBtn);
        
        return gameDiv;
    }
    
    // Create post actions securely
    function createPostActionsSecure(post) {
        const actions = document.createElement('div');
        actions.className = 'post-actions';
        
        // Like button
        const likeBtn = document.createElement('button');
        likeBtn.className = 'like-btn';
        likeBtn.innerHTML = `👍 ${post.likes}`;
        likeBtn.onclick = () => likePostSecure(post.id);
        
        // Comment button
        const commentBtn = document.createElement('button');
        commentBtn.className = 'comment-btn';
        commentBtn.innerHTML = `💬 ${post.comments}`;
        commentBtn.onclick = () => showCommentsSecure(post.id);
        
        actions.appendChild(likeBtn);
        actions.appendChild(commentBtn);
        
        // Chat button for game posts
        if (post.type === 'game' && post.gameId) {
            const chatBtn = document.createElement('button');
            chatBtn.className = 'chat-btn';
            chatBtn.innerHTML = '💬 Chat';
            chatBtn.onclick = () => joinGameChatSecure(post.gameId);
            actions.appendChild(chatBtn);
        }
        
        return actions;
    }
    
    // Format time securely
    function formatTimeSecure(timestamp) {
        try {
            const now = Date.now();
            const diff = now - timestamp;
            
            if (diff < 3600000) { // Less than 1 hour
                const minutes = Math.floor(diff / 60000);
                return `${minutes}m ago`;
            } else if (diff < 86400000) { // Less than 24 hours
                const hours = Math.floor(diff / 3600000);
                return `${hours}h ago`;
            } else {
                const days = Math.floor(diff / 86400000);
                return `${days}d ago`;
            }
        } catch (error) {
            return 'Recently';
        }
    }
    
    // Like post securely
    window.likePostSecure = async function(postId) {
        // Check authentication
        if (!window.authState || !window.authState.isAuthenticated) {
            if (window.showLoginModal) {
                window.showLoginModal();
            }
            return;
        }
        
        // Rate limiting
        if (!SecurityUtils.rateLimiter(`like_${postId}`, 1, 5000)) {
            console.log('Rate limit exceeded for like action');
            return;
        }
        
        try {
            const response = await fetch(`/api/social/posts/${encodeURIComponent(postId)}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.authState.token}`,
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': SecurityUtils.setCSRFToken()
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Update post likes in UI
                const post = window.socialFeedSecure.posts.find(p => p.id === postId);
                if (post) {
                    post.likes = Math.max(0, parseInt(data.likes) || post.likes + 1);
                    renderSocialFeedSecure();
                }
            }
        } catch (error) {
            console.error('Error liking post:', error);
            
            // Optimistic update for demo
            const post = window.socialFeedSecure.posts.find(p => p.id === postId);
            if (post) {
                post.likes = Math.max(0, post.likes + 1);
                renderSocialFeedSecure();
            }
        }
    };
    
    // Join game chat securely
    window.joinGameChatSecure = function(gameId) {
        // Check authentication
        if (!window.authState || !window.authState.isAuthenticated) {
            if (window.showLoginModal) {
                window.showLoginModal();
            }
            return;
        }
        
        // Sanitize game ID
        const sanitizedGameId = SecurityUtils.sanitizeHTML(gameId);
        if (!sanitizedGameId) {
            console.error('Invalid game ID');
            return;
        }
        
        // Create or join chat room for the game
        const chatRoom = `game-${sanitizedGameId}`;
        window.socialFeedSecure.activeChat = chatRoom;
        
        // Initialize chat room if not exists
        if (!window.socialFeedSecure.chatRooms.has(chatRoom)) {
            window.socialFeedSecure.chatRooms.set(chatRoom, {
                messages: [],
                participants: []
            });
        }
        
        // Show chat modal
        showChatModalSecure(chatRoom);
    };
    
    // Show chat modal securely
    function showChatModalSecure(chatRoom) {
        // Remove any existing chat modal
        const existingModal = document.getElementById('chat-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'chat-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            width: 90%;
            max-width: 600px;
            height: 80%;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
        `;
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 1rem;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const title = document.createElement('h3');
        title.textContent = 'Game Chat';
        title.style.margin = '0';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
        `;
        closeBtn.onclick = closeChatModalSecure;
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // Messages container
        const messagesDiv = document.createElement('div');
        messagesDiv.id = 'chat-messages';
        messagesDiv.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
            background: #f9f9f9;
        `;
        
        // Input container
        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = `
            padding: 1rem;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
        `;
        
        const chatInput = document.createElement('input');
        chatInput.type = 'text';
        chatInput.id = 'chat-input';
        chatInput.placeholder = 'Type a message...';
        chatInput.maxLength = 1000;
        chatInput.style.cssText = `
            flex: 1;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            outline: none;
        `;
        
        const sendBtn = document.createElement('button');
        sendBtn.textContent = 'Send';
        sendBtn.style.cssText = `
            padding: 12px 20px;
            background: #ff6b35;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
        `;
        sendBtn.onclick = () => sendChatMessageSecure(chatRoom);
        
        inputContainer.appendChild(chatInput);
        inputContainer.appendChild(sendBtn);
        
        // Assemble modal
        modalContent.appendChild(header);
        modalContent.appendChild(messagesDiv);
        modalContent.appendChild(inputContainer);
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Load chat messages
        loadChatMessagesSecure(chatRoom);
        
        // Focus input
        chatInput.focus();
        
        // Handle Enter key
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessageSecure(chatRoom);
            }
        });
        
        // Handle click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeChatModalSecure();
            }
        });
    }
    
    // Send chat message securely
    function sendChatMessageSecure(chatRoom) {
        const input = document.getElementById('chat-input');
        if (!input || !input.value.trim()) return;
        
        const messageText = input.value.trim();
        
        // Rate limiting
        if (!SecurityUtils.rateLimiter('chat_message', 10, 60000)) {
            alert('You are sending messages too quickly. Please wait.');
            return;
        }
        
        // Sanitize message
        const sanitizedMessage = SecurityUtils.sanitizeMessage(messageText);
        if (!sanitizedMessage) {
            alert('Invalid message content.');
            return;
        }
        
        // Create message object
        const message = {
            id: Date.now().toString(),
            author: {
                name: window.authState.user.name || window.authState.user.email,
                avatar: window.authState.user.avatar || 'https://via.placeholder.com/24x24?text=U'
            },
            content: sanitizedMessage,
            timestamp: Date.now()
        };
        
        // Add to room
        const roomData = window.socialFeedSecure.chatRooms.get(chatRoom);
        if (roomData) {
            // Limit number of messages
            if (roomData.messages.length >= window.socialFeedSecure.maxChatMessages) {
                roomData.messages.shift(); // Remove oldest message
            }
            
            roomData.messages.push(message);
            loadChatMessagesSecure(chatRoom);
        }
        
        // Clear input
        input.value = '';
        
        // TODO: Send to server via WebSocket
        console.log('Message sent:', message);
    }
    
    // Load chat messages securely
    function loadChatMessagesSecure(chatRoom) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        messagesContainer.innerHTML = '';
        
        const roomData = window.socialFeedSecure.chatRooms.get(chatRoom);
        if (!roomData || roomData.messages.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = 'text-align: center; color: #666; padding: 2rem;';
            emptyMsg.textContent = 'No messages yet. Start the conversation!';
            messagesContainer.appendChild(emptyMsg);
            return;
        }
        
        // Render messages
        roomData.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message';
            messageDiv.style.cssText = 'margin-bottom: 1rem;';
            
            const header = document.createElement('div');
            header.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 5px;';
            
            const avatar = document.createElement('img');
            avatar.src = msg.author.avatar;
            avatar.alt = 'Avatar';
            avatar.style.cssText = 'width: 24px; height: 24px; border-radius: 50%;';
            avatar.onerror = function() {
                this.src = 'https://via.placeholder.com/24x24?text=U';
            };
            
            const name = document.createElement('strong');
            name.textContent = msg.author.name;
            
            const time = document.createElement('span');
            time.textContent = formatTimeSecure(msg.timestamp);
            time.style.cssText = 'color: #666; font-size: 0.8em;';
            
            header.appendChild(avatar);
            header.appendChild(name);
            header.appendChild(time);
            
            const content = document.createElement('div');
            content.style.cssText = 'margin-left: 34px; word-wrap: break-word;';
            content.textContent = msg.content;
            
            messageDiv.appendChild(header);
            messageDiv.appendChild(content);
            
            messagesContainer.appendChild(messageDiv);
        });
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Close chat modal securely
    function closeChatModalSecure() {
        const modal = document.getElementById('chat-modal');
        if (modal) {
            modal.remove();
        }
        window.socialFeedSecure.activeChat = null;
    }
    
    // Join game securely
    function joinGameSecure(gameId) {
        // Check authentication
        if (!window.authState || !window.authState.isAuthenticated) {
            if (window.showLoginModal) {
                window.showLoginModal();
            }
            return;
        }
        
        // Sanitize game ID
        const sanitizedGameId = SecurityUtils.sanitizeHTML(gameId);
        if (!sanitizedGameId) {
            console.error('Invalid game ID');
            return;
        }
        
        // Make join request
        fetch(`/api/games/${encodeURIComponent(sanitizedGameId)}/join`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.authState.token}`,
                'Content-Type': 'application/json',
                'X-CSRF-Token': SecurityUtils.setCSRFToken()
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Successfully joined the game!');
                // Refresh the feed
                loadSocialPostsSecure();
            } else {
                alert('Failed to join game: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error joining game:', error);
            alert('Error joining game. Please try again.');
        });
    }
    
    // Show loading state
    function showLoadingState(container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <div style="width: 40px; height: 40px; border: 3px solid #f0f0f0; border-top-color: #ff6b35; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                <p>Loading social feed...</p>
            </div>
        `;
    }
    
    // Show error state
    function showErrorState(container, message) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <p style="color: #e74c3c;">${SecurityUtils.sanitizeHTML(message)}</p>
                <button onclick="loadSocialPostsSecure()" style="padding: 0.5rem 1rem; background: #ff6b35; color: white; border: none; border-radius: 4px; cursor: pointer;">Try Again</button>
            </div>
        `;
    }
    
    // Show empty state
    function showEmptyState(container) {
        container.innerHTML = `
            <div class="empty-feed" style="text-align: center; padding: 3rem; color: #666;">
                <h3>No posts yet</h3>
                <p>Be the first to share something!</p>
            </div>
        `;
    }
    
    // Setup real-time updates placeholder
    function setupRealTimeUpdatesSecure() {
        console.log('Real-time updates ready (WebSocket implementation pending)');
    }
    
    // Setup periodic refresh
    function setupPeriodicRefresh() {
        // Refresh feed every 5 minutes
        setInterval(() => {
            if (!window.socialFeedSecure.isLoading) {
                loadSocialPostsSecure();
            }
        }, 300000);
    }
    
    // Create new post securely
    window.createPostSecure = function() {
        // Check authentication
        if (!window.authState || !window.authState.isAuthenticated) {
            if (window.showLoginModal) {
                window.showLoginModal();
            }
            return;
        }
        
        // Rate limiting
        if (!SecurityUtils.rateLimiter('create_post', 5, 3600000)) {
            alert('You have reached the post limit. Please wait before posting again.');
            return;
        }
        
        const content = prompt('What would you like to share?');
        if (!content) return;
        
        const sanitizedContent = SecurityUtils.sanitizeMessage(content);
        if (!sanitizedContent) {
            alert('Invalid post content.');
            return;
        }
        
        const post = {
            id: Date.now().toString(),
            author: {
                name: window.authState.user.name || window.authState.user.email,
                avatar: window.authState.user.avatar || 'https://via.placeholder.com/40x40?text=U',
                isAdmin: window.authState.isAdmin
            },
            content: sanitizedContent,
            timestamp: Date.now(),
            likes: 0,
            comments: 0,
            type: 'post',
            gameId: null
        };
        
        // Add to posts (optimistic update)
        window.socialFeedSecure.posts.unshift(post);
        
        // Limit posts
        if (window.socialFeedSecure.posts.length > window.socialFeedSecure.maxPosts) {
            window.socialFeedSecure.posts.pop();
        }
        
        renderSocialFeedSecure();
        
        // TODO: Send to server
        console.log('Post created:', post);
    };
    
    // Placeholder for comments
    function showCommentsSecure(postId) {
        alert('Comments feature coming soon!');
    }
    
    // Make functions globally accessible
    window.likePost = window.likePostSecure;
    window.joinGameChat = window.joinGameChatSecure;
    window.sendChatMessage = function() { sendChatMessageSecure(window.socialFeedSecure.activeChat); };
    window.closeChatModal = closeChatModalSecure;
    window.createPost = window.createPostSecure;
    window.joinGame = joinGameSecure;
    window.showComments = showCommentsSecure;
    
    // Initialize when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait for auth to be ready
            setTimeout(window.initSecureSocialFeed, 1000);
        });
    } else {
        setTimeout(window.initSecureSocialFeed, 1000);
    }
    
    console.log('SECURE Social Feed System Ready');
})();