// Comments System Module
class CommentsSystem {
    constructor() {
        this.comments = new Map(); // Store comments by game ID
        this.currentUser = null;
        this.init();
    }
    
    init() {
        // Get current user
        const userData = localStorage.getItem('userData');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
        
        // Add comment sections to game cards
        this.addCommentSections();
        
        // Load existing comments
        this.loadComments();
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    addCommentSections() {
        const gameCards = document.querySelectorAll('.game-card');
        gameCards.forEach((card, index) => {
            const gameId = card.dataset.gameId || `game-${index + 1}`;
            card.dataset.gameId = gameId;
            
            if (!card.querySelector('.comments-section')) {
                this.addCommentSectionToCard(card, gameId);
            }
        });
    }
    
    addCommentSectionToCard(card, gameId) {
        const commentsSection = document.createElement('div');
        commentsSection.className = 'comments-section';
        commentsSection.innerHTML = `
            <div class="comments-header">
                <h4><i class="fas fa-comments"></i> Comments</h4>
                <button class="toggle-comments" data-game-id="${gameId}">
                    <span class="comment-count">0</span> comments
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="comments-container" id="comments-${gameId}" style="display: none;">
                <div class="comment-form-container">
                    ${this.currentUser ? `
                        <form class="comment-form" data-game-id="${gameId}">
                            <textarea 
                                placeholder="Add a comment..." 
                                class="comment-input" 
                                rows="2"
                                maxlength="500"
                                required
                            ></textarea>
                            <div class="comment-form-actions">
                                <span class="char-count">0/500</span>
                                <button type="submit" class="btn-comment">
                                    <i class="fas fa-paper-plane"></i> Post
                                </button>
                            </div>
                        </form>
                    ` : `
                        <div class="login-prompt">
                            <p>Please <a href="#" onclick="loginManager.showLoginModal()">login</a> to comment</p>
                        </div>
                    `}
                </div>
                <div class="comments-list" id="comments-list-${gameId}">
                    <!-- Comments will be loaded here -->
                </div>
            </div>
        `;
        
        // Add like button to card actions
        const cardActions = card.querySelector('.card-actions, .game-actions');
        if (cardActions && !cardActions.querySelector('.like-btn')) {
            const likeBtn = document.createElement('button');
            likeBtn.className = 'like-btn';
            likeBtn.innerHTML = `<i class="far fa-heart"></i> <span class="like-count">0</span>`;
            likeBtn.dataset.gameId = gameId;
            cardActions.insertBefore(likeBtn, cardActions.firstChild);
        }
        
        card.appendChild(commentsSection);
    }
    
    setupEventListeners() {
        // Toggle comments
        document.addEventListener('click', (e) => {
            if (e.target.closest('.toggle-comments')) {
                const btn = e.target.closest('.toggle-comments');
                const gameId = btn.dataset.gameId;
                this.toggleComments(gameId);
            }
            
            // Like button
            if (e.target.closest('.like-btn')) {
                const btn = e.target.closest('.like-btn');
                const gameId = btn.dataset.gameId;
                this.toggleLike(gameId, btn);
            }
            
            // Like comment
            if (e.target.closest('.comment-like')) {
                const btn = e.target.closest('.comment-like');
                const commentId = btn.dataset.commentId;
                const gameId = btn.dataset.gameId;
                this.likeComment(gameId, commentId, btn);
            }
            
            // Delete comment
            if (e.target.closest('.comment-delete')) {
                const btn = e.target.closest('.comment-delete');
                const commentId = btn.dataset.commentId;
                const gameId = btn.dataset.gameId;
                this.deleteComment(gameId, commentId);
            }
        });
        
        // Comment form submission
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('comment-form')) {
                e.preventDefault();
                const gameId = e.target.dataset.gameId;
                const input = e.target.querySelector('.comment-input');
                const comment = input.value.trim();
                
                if (comment) {
                    this.addComment(gameId, comment);
                    input.value = '';
                    this.updateCharCount(input, 0);
                }
            }
        });
        
        // Character count
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('comment-input')) {
                this.updateCharCount(e.target, e.target.value.length);
            }
        });
    }
    
    toggleComments(gameId) {
        const container = document.getElementById(`comments-${gameId}`);
        const btn = document.querySelector(`.toggle-comments[data-game-id="${gameId}"]`);
        const icon = btn.querySelector('i');
        
        if (container) {
            if (container.style.display === 'none') {
                container.style.display = 'block';
                icon.className = 'fas fa-chevron-up';
            } else {
                container.style.display = 'none';
                icon.className = 'fas fa-chevron-down';
            }
        }
    }
    
    async addComment(gameId, text) {
        if (!this.currentUser) {
            alert('Please login to comment');
            return;
        }
        
        const comment = {
            id: `comment-${Date.now()}`,
            gameId,
            text,
            author: this.currentUser.name || this.currentUser.email,
            authorId: this.currentUser.id,
            timestamp: new Date().toISOString(),
            likes: 0,
            likedBy: []
        };
        
        // Add to local storage
        if (!this.comments.has(gameId)) {
            this.comments.set(gameId, []);
        }
        this.comments.get(gameId).unshift(comment);
        
        // Save to backend (if available)
        try {
            await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(comment)
            });
        } catch (error) {
            console.log('Comment saved locally');
        }
        
        // Update UI
        this.renderComments(gameId);
        this.updateCommentCount(gameId);
    }
    
    renderComments(gameId) {
        const container = document.getElementById(`comments-list-${gameId}`);
        if (!container) return;
        
        const comments = this.comments.get(gameId) || [];
        
        if (comments.length === 0) {
            container.innerHTML = '<p class="no-comments">No comments yet. Be the first!</p>';
            return;
        }
        
        container.innerHTML = comments.map(comment => {
            const isOwner = this.currentUser && this.currentUser.id === comment.authorId;
            const hasLiked = comment.likedBy.includes(this.currentUser?.id);
            const timeAgo = this.getTimeAgo(comment.timestamp);
            
            return `
                <div class="comment" data-comment-id="${comment.id}">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author}</span>
                        <span class="comment-time">${timeAgo}</span>
                    </div>
                    <div class="comment-text">${this.escapeHtml(comment.text)}</div>
                    <div class="comment-actions">
                        <button class="comment-like ${hasLiked ? 'liked' : ''}" 
                                data-comment-id="${comment.id}" 
                                data-game-id="${gameId}">
                            <i class="${hasLiked ? 'fas' : 'far'} fa-heart"></i> 
                            <span>${comment.likes}</span>
                        </button>
                        ${isOwner ? `
                            <button class="comment-delete" 
                                    data-comment-id="${comment.id}" 
                                    data-game-id="${gameId}">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    updateCommentCount(gameId) {
        const comments = this.comments.get(gameId) || [];
        const countElement = document.querySelector(`.toggle-comments[data-game-id="${gameId}"] .comment-count`);
        if (countElement) {
            countElement.textContent = comments.length;
        }
    }
    
    likeComment(gameId, commentId, btn) {
        if (!this.currentUser) {
            alert('Please login to like comments');
            return;
        }
        
        const comments = this.comments.get(gameId) || [];
        const comment = comments.find(c => c.id === commentId);
        
        if (comment) {
            const userId = this.currentUser.id;
            const index = comment.likedBy.indexOf(userId);
            
            if (index === -1) {
                comment.likedBy.push(userId);
                comment.likes++;
                btn.classList.add('liked');
                btn.querySelector('i').className = 'fas fa-heart';
            } else {
                comment.likedBy.splice(index, 1);
                comment.likes--;
                btn.classList.remove('liked');
                btn.querySelector('i').className = 'far fa-heart';
            }
            
            btn.querySelector('span').textContent = comment.likes;
        }
    }
    
    deleteComment(gameId, commentId) {
        if (confirm('Are you sure you want to delete this comment?')) {
            const comments = this.comments.get(gameId) || [];
            const index = comments.findIndex(c => c.id === commentId);
            
            if (index !== -1) {
                comments.splice(index, 1);
                this.renderComments(gameId);
                this.updateCommentCount(gameId);
            }
        }
    }
    
    toggleLike(gameId, btn) {
        if (!this.currentUser) {
            alert('Please login to like games');
            return;
        }
        
        const icon = btn.querySelector('i');
        const count = btn.querySelector('.like-count');
        let likes = parseInt(count.textContent) || 0;
        
        if (icon.classList.contains('far')) {
            icon.className = 'fas fa-heart';
            btn.classList.add('liked');
            likes++;
        } else {
            icon.className = 'far fa-heart';
            btn.classList.remove('liked');
            likes--;
        }
        
        count.textContent = likes;
    }
    
    updateCharCount(input, count) {
        const charCount = input.parentElement.querySelector('.char-count');
        if (charCount) {
            charCount.textContent = `${count}/500`;
            charCount.style.color = count > 450 ? '#dc3545' : '#6c757d';
        }
    }
    
    getTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // seconds
        
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    loadComments() {
        // Load demo comments
        this.comments.set('game-1', [
            {
                id: 'comment-1',
                gameId: 'game-1',
                text: 'Great game! Looking forward to joining next time.',
                author: 'John Doe',
                authorId: 'user-1',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                likes: 5,
                likedBy: []
            },
            {
                id: 'comment-2',
                gameId: 'game-1',
                text: 'Count me in! What should I bring?',
                author: 'Jane Smith',
                authorId: 'user-2',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                likes: 3,
                likedBy: []
            }
        ]);
        
        // Update comment counts
        this.comments.forEach((comments, gameId) => {
            this.updateCommentCount(gameId);
        });
    }
}

// Add styles for comments
const commentStyles = document.createElement('style');
commentStyles.textContent = `
    .comments-section {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #eee;
    }
    
    .comments-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }
    
    .comments-header h4 {
        margin: 0;
        font-size: 16px;
        color: #333;
    }
    
    .toggle-comments {
        background: none;
        border: none;
        color: #6c757d;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .toggle-comments:hover {
        color: #ff6b35;
    }
    
    .comments-container {
        margin-top: 15px;
    }
    
    .comment-form {
        margin-bottom: 20px;
    }
    
    .comment-input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
        resize: vertical;
        font-family: inherit;
    }
    
    .comment-form-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 10px;
    }
    
    .char-count {
        font-size: 12px;
        color: #6c757d;
    }
    
    .btn-comment {
        padding: 8px 16px;
        background: #ff6b35;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
    }
    
    .btn-comment:hover {
        background: #e55a2b;
    }
    
    .login-prompt {
        text-align: center;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 5px;
    }
    
    .login-prompt a {
        color: #ff6b35;
        text-decoration: none;
    }
    
    .comments-list {
        margin-top: 20px;
    }
    
    .comment {
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 10px;
    }
    
    .comment-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
    }
    
    .comment-author {
        font-weight: 600;
        color: #333;
    }
    
    .comment-time {
        font-size: 12px;
        color: #6c757d;
    }
    
    .comment-text {
        margin-bottom: 10px;
        line-height: 1.5;
    }
    
    .comment-actions {
        display: flex;
        gap: 15px;
    }
    
    .comment-like,
    .comment-delete {
        background: none;
        border: none;
        color: #6c757d;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .comment-like:hover {
        color: #ff6b35;
    }
    
    .comment-like.liked {
        color: #ff6b35;
    }
    
    .comment-delete:hover {
        color: #dc3545;
    }
    
    .like-btn {
        background: none;
        border: 1px solid #ddd;
        padding: 5px 10px;
        border-radius: 5px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.3s ease;
    }
    
    .like-btn:hover {
        border-color: #ff6b35;
        color: #ff6b35;
    }
    
    .like-btn.liked {
        background: #ff6b35;
        color: white;
        border-color: #ff6b35;
    }
    
    .no-comments {
        text-align: center;
        color: #6c757d;
        padding: 20px;
    }
`;
document.head.appendChild(commentStyles);

// Initialize comments system
window.commentsSystem = new CommentsSystem();