// Social Media Sharing Module
class SocialSharing {
    constructor() {
        this.init();
    }
    
    init() {
        // Add sharing buttons to all game cards
        this.addSharingButtons();
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    addSharingButtons() {
        // Add to existing game cards
        const gameCards = document.querySelectorAll('.game-card');
        gameCards.forEach(card => {
            if (!card.querySelector('.social-share-container')) {
                this.addShareButtonsToCard(card);
            }
        });
    }
    
    addShareButtonsToCard(card) {
        const shareContainer = document.createElement('div');
        shareContainer.className = 'social-share-container';
        
        // Get game data from card
        const gameTitle = card.querySelector('h3')?.textContent || 'Check out this game';
        const gameLocation = card.querySelector('.location')?.textContent || '';
        const gameTime = card.querySelector('.time')?.textContent || '';
        const gameUrl = window.location.href;
        
        shareContainer.innerHTML = `
            <div class="share-buttons">
                <button class="share-btn share-facebook" data-platform="facebook" title="Share on Facebook">
                    <i class="fab fa-facebook-f"></i>
                </button>
                <button class="share-btn share-twitter" data-platform="twitter" title="Share on Twitter">
                    <i class="fab fa-twitter"></i>
                </button>
                <button class="share-btn share-whatsapp" data-platform="whatsapp" title="Share on WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button class="share-btn share-linkedin" data-platform="linkedin" title="Share on LinkedIn">
                    <i class="fab fa-linkedin-in"></i>
                </button>
                <button class="share-btn share-email" data-platform="email" title="Share via Email">
                    <i class="fas fa-envelope"></i>
                </button>
                <button class="share-btn share-copy" data-platform="copy" title="Copy Link">
                    <i class="fas fa-link"></i>
                </button>
            </div>
        `;
        
        // Store game data in container
        shareContainer.dataset.gameTitle = gameTitle;
        shareContainer.dataset.gameLocation = gameLocation;
        shareContainer.dataset.gameTime = gameTime;
        shareContainer.dataset.gameUrl = gameUrl;
        
        // Add to card
        const cardFooter = card.querySelector('.card-footer');
        if (cardFooter) {
            cardFooter.appendChild(shareContainer);
        } else {
            card.appendChild(shareContainer);
        }
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.share-btn')) {
                const btn = e.target.closest('.share-btn');
                const platform = btn.dataset.platform;
                const container = btn.closest('.social-share-container');
                
                const shareData = {
                    title: container.dataset.gameTitle,
                    location: container.dataset.gameLocation,
                    time: container.dataset.gameTime,
                    url: container.dataset.gameUrl
                };
                
                this.share(platform, shareData);
            }
        });
    }
    
    share(platform, data) {
        const text = `${data.title} - ${data.location} at ${data.time}`;
        const url = data.url;
        
        switch(platform) {
            case 'facebook':
                this.shareOnFacebook(url, text);
                break;
            case 'twitter':
                this.shareOnTwitter(text, url);
                break;
            case 'whatsapp':
                this.shareOnWhatsApp(text, url);
                break;
            case 'linkedin':
                this.shareOnLinkedIn(url, text);
                break;
            case 'email':
                this.shareViaEmail(data.title, text, url);
                break;
            case 'copy':
                this.copyToClipboard(url);
                break;
        }
        
        // Track share
        this.trackShare(platform, data.title);
    }
    
    shareOnFacebook(url, text) {
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        window.open(shareUrl, 'facebook-share', 'width=600,height=400');
    }
    
    shareOnTwitter(text, url) {
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=FindingSports,PickupGames`;
        window.open(shareUrl, 'twitter-share', 'width=600,height=400');
    }
    
    shareOnWhatsApp(text, url) {
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        window.open(shareUrl, 'whatsapp-share');
    }
    
    shareOnLinkedIn(url, text) {
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
        window.open(shareUrl, 'linkedin-share', 'width=600,height=400');
    }
    
    shareViaEmail(subject, body, url) {
        const mailtoUrl = `mailto:?subject=${encodeURIComponent('Join me for ' + subject)}&body=${encodeURIComponent(body + '\n\nJoin here: ' + url)}`;
        window.location.href = mailtoUrl;
    }
    
    async copyToClipboard(url) {
        try {
            await navigator.clipboard.writeText(url);
            this.showNotification('Link copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Link copied to clipboard!');
        }
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'share-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    trackShare(platform, gameTitle) {
        // Analytics tracking
        console.log(`Shared on ${platform}: ${gameTitle}`);
        
        // Send to analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'share', {
                method: platform,
                content_type: 'game',
                item_id: gameTitle
            });
        }
    }
}

// Add styles for sharing buttons
const shareStyles = document.createElement('style');
shareStyles.textContent = `
    .social-share-container {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #eee;
    }
    
    .share-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    
    .share-btn {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        color: white;
        font-size: 16px;
    }
    
    .share-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .share-facebook {
        background: #1877f2;
    }
    
    .share-twitter {
        background: #1da1f2;
    }
    
    .share-whatsapp {
        background: #25d366;
    }
    
    .share-linkedin {
        background: #0077b5;
    }
    
    .share-email {
        background: #ea4335;
    }
    
    .share-copy {
        background: #6c757d;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(shareStyles);

// Initialize social sharing
window.socialSharing = new SocialSharing();