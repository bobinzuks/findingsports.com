// Game Source Links Module
class GameSourceLinks {
    constructor() {
        this.sources = new Map();
        this.init();
    }
    
    init() {
        this.loadSources();
        this.addSourceLinks();
        this.setupEventListeners();
    }
    
    loadSources() {
        // Mock data for game sources
        this.sources.set('game-1', {
            platform: 'Meetup',
            url: 'https://www.meetup.com/example-sports-group/events/123456',
            icon: 'fab fa-meetup',
            color: '#e51937'
        });
        
        this.sources.set('game-2', {
            platform: 'Facebook Events',
            url: 'https://www.facebook.com/events/987654321',
            icon: 'fab fa-facebook',
            color: '#1877f2'
        });
        
        this.sources.set('game-3', {
            platform: 'Eventbrite',
            url: 'https://www.eventbrite.com/e/pickup-basketball-tickets-123456',
            icon: 'fas fa-ticket-alt',
            color: '#f05537'
        });
        
        this.sources.set('game-4', {
            platform: 'Local Sports Club',
            url: 'https://example-sports-club.com/events/weekly-soccer',
            icon: 'fas fa-globe',
            color: '#6c757d'
        });
        
        this.sources.set('game-5', {
            platform: 'Reddit',
            url: 'https://www.reddit.com/r/localsports/comments/abc123',
            icon: 'fab fa-reddit',
            color: '#ff4500'
        });
    }
    
    addSourceLinks() {
        const gameCards = document.querySelectorAll('.game-card');
        gameCards.forEach((card, index) => {
            const gameId = card.dataset.gameId || `game-${index + 1}`;
            const source = this.sources.get(gameId);
            
            if (source && !card.querySelector('.source-link')) {
                this.addSourceLinkToCard(card, source);
            }
        });
    }
    
    addSourceLinkToCard(card, source) {
        // Create source link element
        const sourceLink = document.createElement('div');
        sourceLink.className = 'source-link';
        sourceLink.innerHTML = `
            <a href="${source.url}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="source-link-btn"
               title="View on ${source.platform}"
               style="--source-color: ${source.color}">
                <i class="${source.icon}"></i>
                <span>View on ${source.platform}</span>
                <i class="fas fa-external-link-alt"></i>
            </a>
        `;
        
        // Add verification badge if verified source
        if (this.isVerifiedSource(source.platform)) {
            const badge = document.createElement('span');
            badge.className = 'verified-badge';
            badge.innerHTML = '<i class="fas fa-check-circle"></i> Verified';
            sourceLink.appendChild(badge);
        }
        
        // Find appropriate place to insert
        const cardFooter = card.querySelector('.card-footer');
        const commentsSection = card.querySelector('.comments-section');
        
        if (commentsSection) {
            card.insertBefore(sourceLink, commentsSection);
        } else if (cardFooter) {
            cardFooter.appendChild(sourceLink);
        } else {
            card.appendChild(sourceLink);
        }
        
        // Add source indicator to card header
        const cardHeader = card.querySelector('.card-header, h3');
        if (cardHeader && !cardHeader.querySelector('.source-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'source-indicator';
            indicator.innerHTML = `<i class="${source.icon}" style="color: ${source.color}"></i>`;
            indicator.title = `Posted on ${source.platform}`;
            
            if (cardHeader.tagName === 'H3') {
                cardHeader.appendChild(indicator);
            } else {
                cardHeader.insertBefore(indicator, cardHeader.firstChild);
            }
        }
    }
    
    setupEventListeners() {
        // Track source link clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.source-link-btn')) {
                const btn = e.target.closest('.source-link-btn');
                const platform = btn.querySelector('span').textContent.replace('View on ', '');
                this.trackSourceClick(platform, btn.href);
            }
        });
        
        // Add hover effect
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('.source-link-btn')) {
                const btn = e.target.closest('.source-link-btn');
                btn.style.transform = 'translateX(5px)';
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('.source-link-btn')) {
                const btn = e.target.closest('.source-link-btn');
                btn.style.transform = 'translateX(0)';
            }
        });
    }
    
    isVerifiedSource(platform) {
        const verifiedPlatforms = [
            'Meetup',
            'Facebook Events',
            'Eventbrite',
            'Official Sports League'
        ];
        return verifiedPlatforms.includes(platform);
    }
    
    trackSourceClick(platform, url) {
        console.log(`Source clicked: ${platform} - ${url}`);
        
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'click', {
                event_category: 'source_link',
                event_label: platform,
                value: url
            });
        }
        
        // Store in local stats
        const stats = JSON.parse(localStorage.getItem('sourceClickStats') || '{}');
        stats[platform] = (stats[platform] || 0) + 1;
        localStorage.setItem('sourceClickStats', JSON.stringify(stats));
    }
    
    // API to add source to a game dynamically
    addSource(gameId, platform, url, icon = 'fas fa-globe', color = '#6c757d') {
        this.sources.set(gameId, { platform, url, icon, color });
        
        const card = document.querySelector(`[data-game-id="${gameId}"]`);
        if (card) {
            const source = this.sources.get(gameId);
            this.addSourceLinkToCard(card, source);
        }
    }
    
    // Get all sources for analytics
    getAllSources() {
        return Array.from(this.sources.entries()).map(([gameId, source]) => ({
            gameId,
            ...source
        }));
    }
}

// Add styles for source links
const sourceLinkStyles = document.createElement('style');
sourceLinkStyles.textContent = `
    .source-link {
        margin: 15px 0;
        padding: 10px 0;
        border-top: 1px solid #eee;
        border-bottom: 1px solid #eee;
    }
    
    .source-link-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: linear-gradient(135deg, var(--source-color, #6c757d) 0%, var(--source-color, #6c757d) 100%);
        color: white;
        text-decoration: none;
        border-radius: 25px;
        font-size: 14px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .source-link-btn:hover {
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        transform: translateY(-2px);
        filter: brightness(1.1);
    }
    
    .source-link-btn i:last-child {
        font-size: 11px;
        margin-left: 5px;
        opacity: 0.8;
    }
    
    .source-indicator {
        display: inline-flex;
        align-items: center;
        margin-left: 8px;
        font-size: 16px;
        vertical-align: middle;
    }
    
    .verified-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-left: 10px;
        padding: 4px 8px;
        background: #28a745;
        color: white;
        border-radius: 12px;
        font-size: 12px;
    }
    
    .verified-badge i {
        font-size: 10px;
    }
    
    /* Platform-specific colors */
    .source-link-btn[href*="meetup.com"] {
        --source-color: #e51937;
    }
    
    .source-link-btn[href*="facebook.com"] {
        --source-color: #1877f2;
    }
    
    .source-link-btn[href*="eventbrite.com"] {
        --source-color: #f05537;
    }
    
    .source-link-btn[href*="reddit.com"] {
        --source-color: #ff4500;
    }
    
    .source-link-btn[href*="twitter.com"] {
        --source-color: #1da1f2;
    }
    
    .source-link-btn[href*="instagram.com"] {
        --source-color: #e4405f;
    }
    
    /* Mobile responsive */
    @media (max-width: 480px) {
        .source-link-btn {
            font-size: 12px;
            padding: 6px 12px;
        }
        
        .source-link-btn span {
            display: none;
        }
        
        .source-link-btn i:first-child {
            margin-right: 0;
        }
    }
`;
document.head.appendChild(sourceLinkStyles);

// Initialize source links
window.gameSourceLinks = new GameSourceLinks();