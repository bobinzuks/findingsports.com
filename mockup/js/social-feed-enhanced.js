// Enhanced Social Feed with Authentication and Chat Support
(function() {
    'use strict';
    
    console.log('Enhanced Social Feed Loading...');
    
    // Social feed state
    window.socialFeed = {
        posts: [],
        chatRooms: new Map(),
        activeChat: null,
        isLoading: false,
        currentFilter: 'all' // 'all', 'following', 'local'
    };
    
    // Initialize social feed
    window.initSocialFeed = function() {
        console.log('Initializing social feed...');
        
        // Load posts
        loadSocialPosts();
        
        // Setup real-time updates
        setupRealTimeUpdates();
        
        // Render initial feed
        renderSocialFeed();
    };
    
    // Load social posts
    async function loadSocialPosts() {
        if (window.socialFeed.isLoading) return;
        
        window.socialFeed.isLoading = true;
        
        try {
            const response = await fetch('/api/social/posts', {
                headers: {
                    'Authorization': `Bearer ${window.authState.token || ''}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                window.socialFeed.posts = data.posts || [];
            } else {
                // Use demo data if no backend
                window.socialFeed.posts = getDemoPosts();
            }
            
            renderSocialFeed();
        } catch (error) {
            console.error('Error loading social posts:', error);
            // Use demo data as fallback
            window.socialFeed.posts = getDemoPosts();
            renderSocialFeed();
        } finally {
            window.socialFeed.isLoading = false;
        }
    }
    
    // Get demo posts
    function getDemoPosts() {
        return [
            {
                id: 'demo-1',
                author: {
                    name: 'Demo User',
                    avatar: 'https://via.placeholder.com/40x40?text=D',
                    isAdmin: false
                },
                content: 'Welcome to the social feed! This is a demo post.',
                timestamp: Date.now() - 3600000, // 1 hour ago
                likes: 5,
                comments: 2,
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
                content: 'Basketball game at Central Park - 3 spots left!',
                timestamp: Date.now() - 1800000, // 30 minutes ago
                likes: 12,
                comments: 8,
                type: 'game',
                gameId: 'game-123',
                gameInfo: {
                    sport: 'Basketball',
                    location: 'Central Park',
                    time: '7:00 PM',
                    spotsLeft: 3
                }
            }
        ];
    }
    
    // Render social feed
    function renderSocialFeed() {
        const feedContainer = document.getElementById('social-feed-container');
        if (!feedContainer) return;
        
        if (window.socialFeed.posts.length === 0) {
            feedContainer.innerHTML = `
                <div class="empty-feed">
                    <h3>No posts yet</h3>
                    <p>Be the first to share something!</p>
                </div>
            `;
            return;
        }
        
        const postsHTML = window.socialFeed.posts.map(post => `
            <div class="social-post" data-post-id="${post.id}">
                <div class="post-header">
                    <img src="${post.author.avatar}" alt="${post.author.name}" class="author-avatar">
                    <div class="author-info">
                        <span class="author-name">${post.author.name}</span>
                        ${post.author.isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
                        <span class="post-time">${formatTime(post.timestamp)}</span>
                    </div>
                </div>
                
                <div class="post-content">
                    ${post.content}
                    ${post.type === 'game' ? renderGameInfo(post.gameInfo) : ''}
                </div>
                
                <div class="post-actions">
                    <button onclick="likePost('${post.id}')" class="like-btn">
                        👍 ${post.likes}
                    </button>
                    <button onclick="showComments('${post.id}')" class="comment-btn">
                        💬 ${post.comments}
                    </button>
                    ${post.type === 'game' ? `<button onclick="joinGameChat('${post.gameId}')" class="chat-btn">💬 Chat</button>` : ''}
                </div>
            </div>
        `).join('');
        
        feedContainer.innerHTML = postsHTML;
    }
    
    // Render game info
    function renderGameInfo(gameInfo) {
        if (!gameInfo) return '';
        
        return `
            <div class="game-info">
                <div class="game-details">
                    <strong>🏀 ${gameInfo.sport}</strong>
                    <span>📍 ${gameInfo.location}</span>
                    <span>🕐 ${gameInfo.time}</span>
                    <span class="spots-left">${gameInfo.spotsLeft} spots left</span>
                </div>
                <button onclick="joinGame('${gameInfo.id}')" class="join-game-btn">Join Game</button>
            </div>
        `;
    }
    
    // Format time
    function formatTime(timestamp) {
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
    }
    
    // Like post
    window.likePost = async function(postId) {
        if (!window.authState.isAuthenticated) {
            window.showLoginModal();
            return;
        }
        
        try {
            const response = await fetch(`/api/social/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.authState.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update post likes in UI
                const post = window.socialFeed.posts.find(p => p.id === postId);
                if (post) {
                    post.likes = data.likes;
                    renderSocialFeed();
                }
            }
        } catch (error) {
            console.error('Error liking post:', error);
            // Demo behavior
            const post = window.socialFeed.posts.find(p => p.id === postId);
            if (post) {
                post.likes++;
                renderSocialFeed();
            }
        }
    };
    
    // Join game chat
    window.joinGameChat = function(gameId) {
        if (!window.authState.isAuthenticated) {
            window.showLoginModal();
            return;
        }
        
        // Create or join chat room for the game
        const chatRoom = `game-${gameId}`;
        window.socialFeed.activeChat = chatRoom;
        
        // Initialize chat room if not exists
        if (!window.socialFeed.chatRooms.has(chatRoom)) {
            window.socialFeed.chatRooms.set(chatRoom, {
                messages: [],
                participants: []
            });
        }
        
        // Show chat modal
        showChatModal(chatRoom);
    };
    
    // Show chat modal
    function showChatModal(chatRoom) {
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
        
        modal.innerHTML = `
            <div style="background: white; width: 90%; max-width: 600px; height: 80%; border-radius: 12px; display: flex; flex-direction: column;">
                <div style="padding: 1rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <h3>Game Chat</h3>
                    <button onclick="closeChatModal()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                </div>
                
                <div id="chat-messages" style="flex: 1; overflow-y: auto; padding: 1rem;">
                    <!-- Messages will be loaded here -->
                </div>
                
                <div style="padding: 1rem; border-top: 1px solid #eee;">
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="chat-input" placeholder="Type a message..." style="flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 6px;">
                        <button onclick="sendChatMessage()" style="padding: 12px 20px; background: #ff6b35; color: white; border: none; border-radius: 6px; cursor: pointer;">Send</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Load chat messages
        loadChatMessages(chatRoom);
        
        // Focus input
        document.getElementById('chat-input').focus();
        
        // Handle Enter key
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    // Load chat messages
    function loadChatMessages(chatRoom) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        const roomData = window.socialFeed.chatRooms.get(chatRoom);
        if (!roomData || roomData.messages.length === 0) {
            messagesContainer.innerHTML = `
                <div style="text-align: center; color: #666; padding: 2rem;">
                    No messages yet. Start the conversation!
                </div>
            `;
            return;
        }
        
        const messagesHTML = roomData.messages.map(msg => `
            <div class="chat-message" style="margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                    <img src="${msg.author.avatar}" alt="${msg.author.name}" style="width: 24px; height: 24px; border-radius: 50%;">
                    <strong>${msg.author.name}</strong>
                    <span style="color: #666; font-size: 0.8em;">${formatTime(msg.timestamp)}</span>
                </div>
                <div style="margin-left: 34px;">${msg.content}</div>
            </div>
        `).join('');
        
        messagesContainer.innerHTML = messagesHTML;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Send chat message
    window.sendChatMessage = function() {
        const input = document.getElementById('chat-input');
        if (!input || !input.value.trim()) return;
        
        const message = {
            id: Date.now().toString(),
            author: {
                name: window.authState.user.name || window.authState.user.email,
                avatar: window.authState.user.picture || window.authState.user.avatar || 'https://via.placeholder.com/24x24?text=U'
            },
            content: input.value.trim(),
            timestamp: Date.now()
        };
        
        // Add to room
        const roomData = window.socialFeed.chatRooms.get(window.socialFeed.activeChat);
        if (roomData) {
            roomData.messages.push(message);
            loadChatMessages(window.socialFeed.activeChat);
        }
        
        // Clear input
        input.value = '';
        
        // TODO: Send to server via WebSocket
        console.log('Message sent:', message);
    };
    
    // Close chat modal
    window.closeChatModal = function() {
        const modal = document.getElementById('chat-modal');
        if (modal) {
            modal.remove();
        }
        window.socialFeed.activeChat = null;
    };
    
    // Setup real-time updates
    function setupRealTimeUpdates() {
        // TODO: Implement WebSocket connection for real-time updates
        console.log('Real-time updates ready');
    }
    
    // Create new post
    window.createPost = function() {
        if (!window.authState.isAuthenticated) {
            window.showLoginModal();
            return;
        }
        
        const content = prompt('What would you like to share?');
        if (!content) return;
        
        const post = {
            id: Date.now().toString(),
            author: {
                name: window.authState.user.name || window.authState.user.email,
                avatar: window.authState.user.picture || window.authState.user.avatar || 'https://via.placeholder.com/40x40?text=U',
                isAdmin: window.authState.isAdmin
            },
            content: content,
            timestamp: Date.now(),
            likes: 0,
            comments: 0,
            type: 'post'
        };
        
        window.socialFeed.posts.unshift(post);
        renderSocialFeed();
        
        // TODO: Send to server
        console.log('Post created:', post);
    };
    
    // Initialize if page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait for auth to be ready
            setTimeout(window.initSocialFeed, 1000);
        });
    } else {
        setTimeout(window.initSocialFeed, 1000);
    }
    
    console.log('Enhanced Social Feed Ready');
})();