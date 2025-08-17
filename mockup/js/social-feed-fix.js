// Social Feed Fix - Ensures social feed displays properly when tab is clicked
(function() {
    'use strict';
    
    console.log('Social Feed Fix Loading...');
    
    // Enhanced social feed initialization
    window.initSocialFeed = function() {
        console.log('Initializing social feed...');
        
        const feedContainer = document.getElementById('social-feed-container');
        if (!feedContainer) {
            console.error('Social feed container not found');
            return;
        }
        
        // Check if already initialized
        if (feedContainer.dataset.initialized === 'true') {
            console.log('Social feed already initialized');
            return;
        }
        
        // Mark as initialized
        feedContainer.dataset.initialized = 'true';
        
        // Generate demo posts for the social feed
        const demoPosts = [
            {
                id: 1,
                author: {
                    name: 'Alex Chen',
                    avatar: 'https://i.pravatar.cc/150?img=1',
                    isVerified: true
                },
                content: 'Just finished an amazing basketball game at Kits Beach! Looking for more players for tomorrow evening. Who\'s in? 🏀',
                type: 'game',
                gameInfo: {
                    sport: 'Basketball',
                    location: 'Kits Beach Courts',
                    time: 'Tomorrow 6:00 PM',
                    spotsLeft: 3
                },
                timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
                likes: 12,
                comments: 5,
                gameId: 'game-123'
            },
            {
                id: 2,
                author: {
                    name: 'Sarah Johnson',
                    avatar: 'https://i.pravatar.cc/150?img=2',
                    isVerified: false
                },
                content: 'Great volleyball session today at Olympic Village! The community here is amazing. Thanks everyone who showed up! 🏐',
                type: 'social',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                likes: 8,
                comments: 3
            },
            {
                id: 3,
                author: {
                    name: 'Mike Williams',
                    avatar: 'https://i.pravatar.cc/150?img=3',
                    isVerified: true
                },
                content: 'Tennis anyone? Looking for a doubles partner for this weekend at Queen Elizabeth Park. Intermediate level preferred! 🎾',
                type: 'game',
                gameInfo: {
                    sport: 'Tennis',
                    location: 'Queen Elizabeth Park',
                    time: 'Saturday 10:00 AM',
                    spotsLeft: 1
                },
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
                likes: 6,
                comments: 2,
                gameId: 'game-456'
            },
            {
                id: 4,
                author: {
                    name: 'Emma Davis',
                    avatar: 'https://i.pravatar.cc/150?img=4',
                    isVerified: false
                },
                content: 'New to Vancouver and loving the sports scene here! Just joined a soccer league and met so many great people. This app is fantastic for finding games! ⚽',
                type: 'social',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
                likes: 15,
                comments: 8
            },
            {
                id: 5,
                author: {
                    name: 'James Liu',
                    avatar: 'https://i.pravatar.cc/150?img=5',
                    isVerified: true
                },
                content: 'Hockey pickup game tonight at Burnaby Winter Club! Still need 2 more players. Free skate rental for first-timers! 🏒',
                type: 'game',
                gameInfo: {
                    sport: 'Hockey',
                    location: 'Burnaby Winter Club',
                    time: 'Tonight 8:00 PM',
                    spotsLeft: 2
                },
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
                likes: 9,
                comments: 4,
                gameId: 'game-789'
            }
        ];
        
        // Render the social feed
        renderSocialFeed(demoPosts, feedContainer);
        
        // Setup post interactions
        setupPostInteractions();
        
        console.log('Social feed initialized successfully with', demoPosts.length, 'posts');
    };
    
    // Render social feed posts
    function renderSocialFeed(posts, container) {
        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="empty-feed" style="text-align: center; padding: 3rem; color: #666;">
                    <h3>Welcome to the Social Feed!</h3>
                    <p>This is where you'll see posts from other players in your area.</p>
                    <p style="margin-top: 1rem; font-size: 0.9em;">Sign in to share your own posts and connect with the community!</p>
                </div>
            `;
            return;
        }
        
        const postsHTML = posts.map(post => `
            <div class="social-post" data-post-id="${post.id}" style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div class="post-header" style="display: flex; align-items: center; margin-bottom: 1rem;">
                    <img src="${post.author.avatar}" alt="${post.author.name}" class="author-avatar" 
                         style="width: 48px; height: 48px; border-radius: 50%; margin-right: 12px;" 
                         onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;48&quot; height=&quot;48&quot; viewBox=&quot;0 0 48 48&quot;><circle cx=&quot;24&quot; cy=&quot;24&quot; r=&quot;24&quot; fill=&quot;%23ddd&quot;/><text x=&quot;24&quot; y=&quot;30&quot; text-anchor=&quot;middle&quot; fill=&quot;%23999&quot; font-size=&quot;16&quot;>${post.author.name.charAt(0)}</text></svg>'">
                    <div class="author-info" style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span class="author-name" style="font-weight: 600; color: #333;">${post.author.name}</span>
                            ${post.author.isVerified ? '<span class="verified-badge" style="color: #1da1f2; font-size: 0.8em;">✓</span>' : ''}
                        </div>
                        <span class="post-time" style="color: #666; font-size: 0.9em;">${formatTime(post.timestamp)}</span>
                    </div>
                </div>
                
                <div class="post-content" style="margin-bottom: 1rem; line-height: 1.6; color: #333;">
                    ${post.content}
                </div>
                
                ${post.type === 'game' ? renderGameInfo(post.gameInfo) : ''}
                
                <div class="post-actions" style="display: flex; gap: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
                    <button onclick="likePost('${post.id}')" class="like-btn" 
                            style="display: flex; align-items: center; gap: 0.5rem; background: none; border: none; color: #666; cursor: pointer; padding: 0.5rem; border-radius: 6px; transition: background-color 0.2s;"
                            onmouseover="this.style.backgroundColor='#f0f0f0'" 
                            onmouseout="this.style.backgroundColor='transparent'">
                        <span style="font-size: 1.2em;">👍</span>
                        <span>${post.likes}</span>
                    </button>
                    <button onclick="showComments('${post.id}')" class="comment-btn" 
                            style="display: flex; align-items: center; gap: 0.5rem; background: none; border: none; color: #666; cursor: pointer; padding: 0.5rem; border-radius: 6px; transition: background-color 0.2s;"
                            onmouseover="this.style.backgroundColor='#f0f0f0'" 
                            onmouseout="this.style.backgroundColor='transparent'">
                        <span style="font-size: 1.2em;">💬</span>
                        <span>${post.comments}</span>
                    </button>
                    ${post.type === 'game' ? `
                        <button onclick="joinGameChat('${post.gameId}')" class="chat-btn" 
                                style="display: flex; align-items: center; gap: 0.5rem; background: #ff6b35; border: none; color: white; cursor: pointer; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 500;">
                            <span>💬</span>
                            <span>Join Game</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = postsHTML;
    }
    
    // Render game info card
    function renderGameInfo(gameInfo) {
        if (!gameInfo) return '';
        
        return `
            <div class="game-info-card" style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h4 style="margin: 0; color: #ff6b35; font-size: 1.1em;">${gameInfo.sport} Game</h4>
                    <span style="background: #ff6b35; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8em; font-weight: 500;">
                        ${gameInfo.spotsLeft} spot${gameInfo.spotsLeft !== 1 ? 's' : ''} left
                    </span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.9em; color: #666;">
                    <div><strong>📍 Location:</strong> ${gameInfo.location}</div>
                    <div><strong>🕐 Time:</strong> ${gameInfo.time}</div>
                </div>
            </div>
        `;
    }
    
    // Format timestamp
    function formatTime(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    }
    
    // Setup post interactions
    function setupPostInteractions() {
        // Like post function
        window.likePost = function(postId) {
            console.log('Liked post:', postId);
            const likeBtn = document.querySelector(`[data-post-id="${postId}"] .like-btn span:last-child`);
            if (likeBtn) {
                const currentLikes = parseInt(likeBtn.textContent) || 0;
                likeBtn.textContent = currentLikes + 1;
                
                // Visual feedback
                const heartSpan = likeBtn.previousElementSibling;
                heartSpan.style.transform = 'scale(1.3)';
                setTimeout(() => heartSpan.style.transform = 'scale(1)', 200);
            }
        };
        
        // Show comments function
        window.showComments = function(postId) {
            console.log('Show comments for post:', postId);
            alert('Comments feature coming soon! This would open a comments modal.');
        };
        
        // Join game chat function
        window.joinGameChat = function(gameId) {
            console.log('Join game chat:', gameId);
            alert(`Joining game ${gameId}! This would redirect to the game page or open a chat.`);
        };
    }
    
    // Enhanced createPost function
    window.createPost = function() {
        console.log('Create post clicked');
        
        // Check if user is signed in
        const isSignedIn = localStorage.getItem('isSignedIn') === 'true';
        
        if (!isSignedIn) {
            alert('Please sign in to create posts!');
            return;
        }
        
        // Simple post creation (would be a modal in real app)
        const content = prompt('What would you like to share with the community?');
        if (content && content.trim()) {
            alert('Post created! (In a real app, this would be added to the feed)');
        }
    };
    
    // Auto-initialize when social feed tab is clicked
    document.addEventListener('DOMContentLoaded', function() {
        // Override the switchTab function to ensure social feed initializes
        const originalSwitchTab = window.switchTab;
        
        window.switchTab = function(tab) {
            // Call original function first
            if (originalSwitchTab) {
                originalSwitchTab(tab);
            }
            
            // If switching to social tab, ensure it's initialized
            if (tab === 'social' || tab === 'social-feed') {
                setTimeout(() => {
                    const socialSection = document.getElementById('socialSection');
                    if (socialSection && socialSection.style.display !== 'none') {
                        window.initSocialFeed();
                    }
                }, 100);
            }
        };
    });
    
    console.log('Social Feed Fix loaded successfully');
})();