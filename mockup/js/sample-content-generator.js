// Sample Content Generator for Empty States
window.SampleContentGenerator = {
  // Sample users for realistic feel
  sampleUsers: [
    { name: 'Sports Enthusiast', avatar: 'SE', sport: 'Multi-sport' },
    { name: 'Basketball Pro', avatar: 'BP', sport: 'Basketball' },
    { name: 'Soccer Fan', avatar: 'SF', sport: 'Soccer' },
    { name: 'Tennis Player', avatar: 'TP', sport: 'Tennis' },
    { name: 'Volleyball Ace', avatar: 'VA', sport: 'Volleyball' },
    { name: 'Hockey Lover', avatar: 'HL', sport: 'Hockey' }
  ],
  
  // Sample messages by channel type
  sampleMessages: {
    general: [
      "Welcome to Finding Sports! Great to see new faces here 👋",
      "Anyone know good sports stores in the area? Need some new gear",
      "Just moved to town, looking forward to playing with you all!",
      "Weather's perfect today! Who's up for outdoor games?",
      "Pro tip: Check the marketplace for used equipment deals 💰",
      "Remember to stay hydrated during games! 💧",
      "This community is amazing, found 3 games already this week!"
    ],
    basketball: [
      "3v3 pickup game tomorrow at 6pm, who's in? 🏀",
      "Working on my three-pointers, any tips?",
      "Great game yesterday! My legs are still sore 😅",
      "Anyone selling size 10 basketball shoes?",
      "New indoor court opened downtown, looks amazing!",
      "Looking for consistent players for weekly games",
      "Streetball tournament next month, let's form a team!"
    ],
    soccer: [
      "Need 2 more for 5-a-side tonight ⚽",
      "Best fields for pickup games around here?",
      "Anyone watching the Champions League?",
      "My team needs a goalkeeper for Sunday league",
      "Found a great deal on cleats in the marketplace!",
      "Weather forecast looks good for the weekend matches",
      "Organizing a friendly match, all skill levels welcome!"
    ],
    volleyball: [
      "Beach volleyball this weekend? 🏐",
      "Indoor courts available Tuesdays and Thursdays",
      "Looking for tips on improving my serve",
      "Great rally yesterday! Who recorded it?",
      "Team looking for a setter, intermediate level",
      "Anyone interested in joining a rec league?",
      "New to volleyball, where's the best place to start?"
    ],
    tennis: [
      "Anyone up for singles tomorrow morning? 🎾",
      "Looking for a doubles partner, 3.5 level",
      "Best public courts in the area?",
      "Racquet restringing recommendations?",
      "Great match today! Thanks for the games",
      "Tennis lessons available, DM for details",
      "Weekend tennis social, all levels welcome!"
    ],
    marketplace: [
      {
        type: 'listing',
        category: 'equipment-sale',
        title: 'Wilson Basketball - Like New',
        description: 'Used only a few times, official size',
        price: '$25',
        sport: 'basketball'
      },
      {
        type: 'listing',
        category: 'team-looking',
        title: 'Rec League Team Needs Players',
        description: 'Fun, casual team looking for 2-3 more players',
        price: 'Free',
        sport: 'soccer'
      },
      {
        type: 'listing',
        category: 'carpool',
        title: 'Carpool to Sunday Games',
        description: 'Gas split 4 ways, leaves at 9am',
        price: '$5/trip',
        sport: 'volleyball'
      },
      {
        type: 'listing',
        category: 'equipment-wanted',
        title: 'Looking for Tennis Racquet',
        description: 'Beginner level, good condition',
        price: '$30-50',
        sport: 'tennis'
      }
    ]
  },
  
  // Sample games for empty states
  sampleGames: [
    {
      sport: 'Basketball',
      venue: 'Community Center Court A',
      time: 'Today, 6:00 PM',
      players: '5/10',
      skill: 'All levels',
      type: 'happening-soon'
    },
    {
      sport: 'Soccer',
      venue: 'Central Park Field 2',
      time: 'Tomorrow, 4:00 PM',
      players: '8/16',
      skill: 'Intermediate',
      type: 'tomorrow'
    },
    {
      sport: 'Volleyball',
      venue: 'Beach Courts',
      time: 'Saturday, 2:00 PM',
      players: '4/12',
      skill: 'Casual',
      type: 'weekend'
    },
    {
      sport: 'Tennis',
      venue: 'Municipal Courts',
      time: 'Daily Drop-ins',
      players: 'Open',
      skill: 'All levels',
      type: 'regular'
    }
  ],
  
  // Generate sample chat messages
  generateSampleChat(channel, count = 5) {
    const messages = [];
    const channelMessages = this.sampleMessages[channel] || this.sampleMessages.general;
    const users = this.shuffleArray([...this.sampleUsers]);
    
    for (let i = 0; i < Math.min(count, channelMessages.length); i++) {
      const user = users[i % users.length];
      const timestamp = new Date(Date.now() - (i * 60 * 60 * 1000)); // Hours ago
      
      messages.push({
        id: `sample-${Date.now()}-${i}`,
        author: {
          name: user.name,
          avatar: user.avatar
        },
        message: channelMessages[i],
        timestamp: timestamp,
        reactions: this.generateRandomReactions(),
        isSample: true
      });
    }
    
    return messages.reverse(); // Newest first
  },
  
  // Generate random reactions
  generateRandomReactions() {
    const reactions = ['👍', '❤️', '😄', '🎉', '🏀', '⚽', '🏐', '🎾'];
    const selectedReactions = [];
    
    // Randomly add 0-3 reactions
    const reactionCount = Math.floor(Math.random() * 4);
    
    for (let i = 0; i < reactionCount; i++) {
      const emoji = reactions[Math.floor(Math.random() * reactions.length)];
      const existing = selectedReactions.find(r => r.emoji === emoji);
      
      if (existing) {
        existing.count++;
      } else {
        selectedReactions.push({
          emoji: emoji,
          count: Math.floor(Math.random() * 3) + 1
        });
      }
    }
    
    return selectedReactions;
  },
  
  // Generate sample marketplace listings
  generateSampleListings(count = 4) {
    const listings = [];
    const sampleListings = this.sampleMessages.marketplace;
    
    for (let i = 0; i < Math.min(count, sampleListings.length); i++) {
      const listing = { ...sampleListings[i] };
      listing.id = `sample-listing-${i}`;
      listing.posted = new Date(Date.now() - (i * 12 * 60 * 60 * 1000)); // 12 hours apart
      listing.seller = this.sampleUsers[i % this.sampleUsers.length].name;
      listing.image = this.getSportEmoji(listing.sport);
      listing.isSample = true;
      
      listings.push(listing);
    }
    
    return listings;
  },
  
  // Generate sample games
  generateSampleGames(location = 'your area') {
    return this.sampleGames.map((game, index) => ({
      ...game,
      id: `sample-game-${index}`,
      location: location,
      isSample: true
    }));
  },
  
  // Get sport emoji
  getSportEmoji(sport) {
    const emojis = {
      basketball: '🏀',
      soccer: '⚽',
      volleyball: '🏐',
      tennis: '🎾',
      hockey: '🏒',
      general: '🏃'
    };
    
    return emojis[sport.toLowerCase()] || '🏃';
  },
  
  // Shuffle array
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },
  
  // Show sample content banner
  showSampleContentBanner(container) {
    const banner = document.createElement('div');
    banner.className = 'sample-content-banner';
    banner.innerHTML = `
      <div class="banner-content">
        <span class="banner-icon">💡</span>
        <span class="banner-text">This is sample content to show you how the community works</span>
        <button class="banner-action" onclick="window.SampleContentGenerator.hideSampleContent()">
          Hide Samples
        </button>
      </div>
    `;
    
    container.insertBefore(banner, container.firstChild);
  },
  
  // Hide sample content
  hideSampleContent() {
    // Remove sample messages
    document.querySelectorAll('[data-sample="true"]').forEach(el => el.remove());
    
    // Remove banner
    const banner = document.querySelector('.sample-content-banner');
    if (banner) banner.remove();
    
    // Set preference
    localStorage.setItem('hideSampleContent', 'true');
  },
  
  // Check if should show sample content
  shouldShowSampleContent() {
    return !localStorage.getItem('hideSampleContent') && 
           !localStorage.getItem('onboardingCompleted');
  },
  
  // Initialize sample content for empty channels
  initializeForChannel(channel) {
    if (!this.shouldShowSampleContent()) return null;
    
    const messages = this.generateSampleChat(channel);
    
    // Mark messages as samples
    messages.forEach(msg => {
      msg.isSample = true;
    });
    
    return messages;
  },
  
  // Initialize sample marketplace
  initializeMarketplace() {
    if (!this.shouldShowSampleContent()) return null;
    
    return this.generateSampleListings();
  },
  
  // Initialize sample games
  initializeGames(location) {
    if (!this.shouldShowSampleContent()) return null;
    
    return this.generateSampleGames(location);
  },
  
  // Add sample content styles
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .sample-content-banner {
        background: linear-gradient(90deg, #fff3cd, #ffeeba);
        border: 1px solid #ffeaa7;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 16px;
        animation: slideDown 0.3s ease-out;
      }
      
      .banner-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .banner-icon {
        font-size: 20px;
      }
      
      .banner-text {
        flex: 1;
        color: #856404;
        font-weight: 500;
      }
      
      .banner-action {
        padding: 6px 12px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }
      
      .banner-action:hover {
        background: #f8f9fa;
        border-color: #adb5bd;
      }
      
      [data-sample="true"] {
        position: relative;
      }
      
      [data-sample="true"]::before {
        content: 'SAMPLE';
        position: absolute;
        top: 8px;
        right: 8px;
        background: #ffc107;
        color: #333;
        font-size: 10px;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 3px;
        opacity: 0.7;
      }
      
      @keyframes slideDown {
        from {
          transform: translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
};

// Initialize styles
window.SampleContentGenerator.addStyles();