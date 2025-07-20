// Gamification System for FindingSports Social Feed
window.Gamification = {
  // Point values for different actions
  POINTS: {
    // Messaging & Chat
    SEND_MESSAGE: 1,
    RECEIVE_REACTION: 2,
    HELPFUL_MESSAGE: 5, // When message gets 5+ positive reactions
    DAILY_CHAT: 10, // First message of the day
    
    // Game Organization
    CREATE_GAME: 20,
    JOIN_GAME: 10,
    HOST_SUCCESSFUL_GAME: 50, // When 80%+ attendees show up
    PERFECT_ATTENDANCE: 25, // Show up to all games joined in a week
    
    // Helping Others
    HELP_FIND_GAME: 15, // When someone joins a game you recommended
    ANSWER_QUESTION: 10, // When your answer gets marked helpful
    SHARE_VENUE_INFO: 10,
    CARPOOL_OFFER: 20,
    CARPOOL_ACCEPT: 10,
    
    // Marketplace
    LIST_EQUIPMENT: 5,
    SUCCESSFUL_TRADE: 25,
    DONATE_EQUIPMENT: 30, // List as free
    
    // Community Building
    WELCOME_NEW_USER: 5,
    INVITE_FRIEND: 25, // When invited friend joins
    CREATE_TEAM: 30,
    ORGANIZE_TOURNAMENT: 100,
    
    // Consistency Bonuses
    WEEK_STREAK: 50, // Active 7 days in a row
    MONTH_STREAK: 200, // Active 30 days in a row
    PLAY_DIFFERENT_SPORTS: 20, // Try 3+ different sports in a week
  },
  
  // Badge definitions
  BADGES: {
    // Starter Badges
    FIRST_STEPS: {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Send your first message',
      icon: '👋',
      condition: (stats) => stats.messages_sent >= 1,
      points: 10,
      tier: 'bronze'
    },
    
    GAME_ON: {
      id: 'game_on',
      name: 'Game On!',
      description: 'Join your first game',
      icon: '🎮',
      condition: (stats) => stats.games_joined >= 1,
      points: 20,
      tier: 'bronze'
    },
    
    // Communication Badges
    CHATTERBOX: {
      id: 'chatterbox',
      name: 'Chatterbox',
      description: 'Send 100 messages',
      icon: '💬',
      condition: (stats) => stats.messages_sent >= 100,
      points: 50,
      tier: 'silver'
    },
    
    HELPFUL_HAND: {
      id: 'helpful_hand',
      name: 'Helpful Hand',
      description: 'Receive 50 positive reactions',
      icon: '🤝',
      condition: (stats) => stats.reactions_received >= 50,
      points: 100,
      tier: 'gold'
    },
    
    COMMUNITY_SAGE: {
      id: 'community_sage',
      name: 'Community Sage',
      description: 'Answer 25 questions marked as helpful',
      icon: '🧙',
      condition: (stats) => stats.helpful_answers >= 25,
      points: 200,
      tier: 'platinum'
    },
    
    // Game Organization Badges
    TEAM_PLAYER: {
      id: 'team_player',
      name: 'Team Player',
      description: 'Join 10 games',
      icon: '⚽',
      condition: (stats) => stats.games_joined >= 10,
      points: 50,
      tier: 'silver'
    },
    
    GAME_MASTER: {
      id: 'game_master',
      name: 'Game Master',
      description: 'Host 5 successful games',
      icon: '🎯',
      condition: (stats) => stats.successful_games_hosted >= 5,
      points: 150,
      tier: 'gold'
    },
    
    PERFECT_RECORD: {
      id: 'perfect_record',
      name: 'Perfect Record',
      description: 'Attend all games joined for a month',
      icon: '💯',
      condition: (stats) => stats.perfect_attendance_weeks >= 4,
      points: 300,
      tier: 'platinum'
    },
    
    // Sport Variety Badges
    MULTI_SPORT: {
      id: 'multi_sport',
      name: 'Multi-Sport Athlete',
      description: 'Play 3 different sports',
      icon: '🏃',
      condition: (stats) => stats.sports_played.length >= 3,
      points: 75,
      tier: 'silver'
    },
    
    SPORT_EXPLORER: {
      id: 'sport_explorer',
      name: 'Sport Explorer',
      description: 'Try 5 different sports',
      icon: '🗺️',
      condition: (stats) => stats.sports_played.length >= 5,
      points: 150,
      tier: 'gold'
    },
    
    // Community Builder Badges
    WELCOMER: {
      id: 'welcomer',
      name: 'Community Welcomer',
      description: 'Welcome 10 new users',
      icon: '🌟',
      condition: (stats) => stats.users_welcomed >= 10,
      points: 100,
      tier: 'gold'
    },
    
    CONNECTOR: {
      id: 'connector',
      name: 'Game Connector',
      description: 'Help 20 people find games',
      icon: '🔗',
      condition: (stats) => stats.people_helped >= 20,
      points: 200,
      tier: 'platinum'
    },
    
    CARPOOL_HERO: {
      id: 'carpool_hero',
      name: 'Carpool Hero',
      description: 'Offer 10 carpools',
      icon: '🚗',
      condition: (stats) => stats.carpools_offered >= 10,
      points: 150,
      tier: 'gold'
    },
    
    // Marketplace Badges
    TRADER: {
      id: 'trader',
      name: 'Equipment Trader',
      description: 'Complete 5 marketplace transactions',
      icon: '🔄',
      condition: (stats) => stats.marketplace_trades >= 5,
      points: 100,
      tier: 'gold'
    },
    
    GENEROUS_SOUL: {
      id: 'generous_soul',
      name: 'Generous Soul',
      description: 'Donate 3 pieces of equipment',
      icon: '💝',
      condition: (stats) => stats.equipment_donated >= 3,
      points: 150,
      tier: 'gold'
    },
    
    // Streak Badges
    WEEK_WARRIOR: {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Active for 7 consecutive days',
      icon: '🔥',
      condition: (stats) => stats.current_streak >= 7,
      points: 100,
      tier: 'silver'
    },
    
    MONTH_MASTER: {
      id: 'month_master',
      name: 'Month Master',
      description: 'Active for 30 consecutive days',
      icon: '⚡',
      condition: (stats) => stats.current_streak >= 30,
      points: 300,
      tier: 'platinum'
    },
    
    // Location-based Badges
    LOCAL_LEGEND: {
      id: 'local_legend',
      name: 'Local Legend',
      description: 'Play at 10 different venues',
      icon: '📍',
      condition: (stats) => stats.venues_visited >= 10,
      points: 150,
      tier: 'gold'
    },
    
    CITY_CHAMPION: {
      id: 'city_champion',
      name: 'City Champion',
      description: 'Top contributor in your city',
      icon: '🏆',
      condition: (stats) => stats.city_rank <= 10,
      points: 500,
      tier: 'legendary'
    }
  },
  
  // Leaderboard categories
  LEADERBOARDS: {
    WEEKLY_POINTS: {
      id: 'weekly_points',
      name: 'Weekly Points',
      description: 'Most points earned this week',
      icon: '📊',
      timeframe: 'week'
    },
    
    GAMES_ORGANIZED: {
      id: 'games_organized',
      name: 'Game Organizers',
      description: 'Most games organized this month',
      icon: '🎯',
      timeframe: 'month'
    },
    
    HELPFUL_MEMBERS: {
      id: 'helpful_members',
      name: 'Most Helpful',
      description: 'Members who help others find games',
      icon: '🤝',
      timeframe: 'alltime'
    },
    
    SPORT_CHAMPIONS: {
      id: 'sport_champions',
      name: 'Sport Champions',
      description: 'Top players by sport',
      icon: '🏅',
      timeframe: 'month',
      categories: ['basketball', 'soccer', 'volleyball', 'tennis', 'hockey']
    },
    
    CITY_LEADERS: {
      id: 'city_leaders',
      name: 'City Leaders',
      description: 'Top contributors by city',
      icon: '🌆',
      timeframe: 'month',
      categories: ['vancouver', 'burnaby', 'richmond', 'surrey']
    }
  },
  
  // Daily challenges
  DAILY_CHALLENGES: [
    {
      id: 'welcome_newcomer',
      name: 'Welcome a Newcomer',
      description: 'Be the first to welcome a new member',
      points: 20,
      icon: '👋',
      check: (action) => action.type === 'welcome_user'
    },
    {
      id: 'game_matchmaker',
      name: 'Game Matchmaker',
      description: 'Help 3 people find games today',
      points: 50,
      icon: '🎯',
      progress: 0,
      target: 3,
      check: (action) => action.type === 'help_find_game'
    },
    {
      id: 'conversation_starter',
      name: 'Conversation Starter',
      description: 'Start conversations in 3 different channels',
      points: 30,
      icon: '💬',
      progress: 0,
      target: 3,
      channels: new Set(),
      check: (action) => action.type === 'send_message'
    },
    {
      id: 'sport_variety',
      name: 'Sport Variety',
      description: 'Join or discuss 2 different sports today',
      points: 40,
      icon: '🏃',
      progress: 0,
      target: 2,
      sports: new Set(),
      check: (action) => ['join_game', 'discuss_sport'].includes(action.type)
    },
    {
      id: 'equipment_helper',
      name: 'Equipment Helper',
      description: 'Share equipment info or offer in marketplace',
      points: 25,
      icon: '🎾',
      check: (action) => ['list_equipment', 'share_equipment_info'].includes(action.type)
    }
  ],
  
  // Unlockable features based on points/badges
  UNLOCKABLES: {
    CUSTOM_AVATAR: {
      id: 'custom_avatar',
      name: 'Custom Avatar',
      description: 'Upload a custom profile picture',
      requirement: { points: 100 },
      icon: '🖼️'
    },
    
    EMOJI_REACTIONS: {
      id: 'emoji_reactions',
      name: 'Extra Emoji Reactions',
      description: 'Access to special sports emoji reactions',
      requirement: { points: 200 },
      icon: '😄',
      emojis: ['🏀', '⚽', '🏐', '🎾', '🏒', '🥇', '🏆', '🎯']
    },
    
    CREATE_PRIVATE_GAMES: {
      id: 'create_private_games',
      name: 'Private Games',
      description: 'Create invite-only games',
      requirement: { points: 500 },
      icon: '🔒'
    },
    
    PRIORITY_NOTIFICATIONS: {
      id: 'priority_notifications',
      name: 'Priority Notifications',
      description: 'Get notified first about new games',
      requirement: { badge: 'team_player' },
      icon: '🔔'
    },
    
    GAME_HISTORY: {
      id: 'game_history',
      name: 'Game History',
      description: 'View your complete game history',
      requirement: { badge: 'game_on' },
      icon: '📜'
    },
    
    ADVANCED_FILTERS: {
      id: 'advanced_filters',
      name: 'Advanced Search Filters',
      description: 'Access to advanced game search filters',
      requirement: { points: 300 },
      icon: '🔍'
    },
    
    CREATE_TOURNAMENTS: {
      id: 'create_tournaments',
      name: 'Tournament Creator',
      description: 'Organize multi-game tournaments',
      requirement: { badge: 'game_master' },
      icon: '🏆'
    },
    
    VERIFIED_BADGE: {
      id: 'verified_badge',
      name: 'Verified Member',
      description: 'Show verified badge on profile',
      requirement: { points: 1000, badge: 'helpful_hand' },
      icon: '✅'
    },
    
    CUSTOM_CHANNELS: {
      id: 'custom_channels',
      name: 'Create Custom Channels',
      description: 'Create sport or location specific channels',
      requirement: { badge: 'community_sage' },
      icon: '📢'
    },
    
    STATS_DASHBOARD: {
      id: 'stats_dashboard',
      name: 'Personal Stats Dashboard',
      description: 'View detailed statistics about your activity',
      requirement: { points: 750 },
      icon: '📊'
    }
  },
  
  // Initialize gamification system
  async initialize() {
    // Load user stats from server
    await this.loadUserStats();
    
    // Check for new badges
    this.checkBadges();
    
    // Load today's challenges
    this.loadDailyChallenges();
    
    // Set up event listeners
    this.setupEventListeners();
  },
  
  // Load user statistics
  async loadUserStats() {
    try {
      const response = await fetch('/api/gamification/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        this.userStats = await response.json();
      } else {
        // Initialize with default stats
        this.userStats = {
          points: 0,
          level: 1,
          messages_sent: 0,
          games_joined: 0,
          games_created: 0,
          reactions_received: 0,
          helpful_answers: 0,
          people_helped: 0,
          current_streak: 0,
          longest_streak: 0,
          badges: [],
          unlocked_features: [],
          sports_played: [],
          venues_visited: 0,
          city_rank: null
        };
      }
    } catch (error) {
      console.error('Failed to load gamification stats:', error);
    }
  },
  
  // Award points for an action
  async awardPoints(action, points, description) {
    // Update local stats
    this.userStats.points += points;
    
    // Calculate level (every 500 points = 1 level)
    this.userStats.level = Math.floor(this.userStats.points / 500) + 1;
    
    // Show notification
    this.showPointNotification(points, description);
    
    // Update daily challenges
    this.updateDailyChallenges(action);
    
    // Check for new badges
    this.checkBadges();
    
    // Check for new unlockables
    this.checkUnlockables();
    
    // Save to server
    try {
      await fetch('/api/gamification/award-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ action, points, description })
      });
    } catch (error) {
      console.error('Failed to save points:', error);
    }
  },
  
  // Check for new badges
  checkBadges() {
    const newBadges = [];
    
    for (const [key, badge] of Object.entries(this.BADGES)) {
      if (!this.userStats.badges.includes(badge.id) && badge.condition(this.userStats)) {
        newBadges.push(badge);
        this.userStats.badges.push(badge.id);
      }
    }
    
    // Show badge notifications
    newBadges.forEach(badge => {
      this.showBadgeNotification(badge);
      this.awardPoints({ type: 'badge_earned', badge: badge.id }, badge.points, `Earned ${badge.name} badge`);
    });
  },
  
  // Check for new unlockables
  checkUnlockables() {
    const newUnlocks = [];
    
    for (const [key, feature] of Object.entries(this.UNLOCKABLES)) {
      if (!this.userStats.unlocked_features.includes(feature.id)) {
        let unlocked = true;
        
        if (feature.requirement.points && this.userStats.points < feature.requirement.points) {
          unlocked = false;
        }
        
        if (feature.requirement.badge && !this.userStats.badges.includes(feature.requirement.badge)) {
          unlocked = false;
        }
        
        if (unlocked) {
          newUnlocks.push(feature);
          this.userStats.unlocked_features.push(feature.id);
        }
      }
    }
    
    // Show unlock notifications
    newUnlocks.forEach(feature => {
      this.showUnlockNotification(feature);
    });
  },
  
  // Load daily challenges
  loadDailyChallenges() {
    // Get 3 random challenges for today
    const today = new Date().toDateString();
    const savedChallenges = localStorage.getItem('dailyChallenges');
    
    if (savedChallenges) {
      const parsed = JSON.parse(savedChallenges);
      if (parsed.date === today) {
        this.todaysChallenges = parsed.challenges;
        return;
      }
    }
    
    // Select new challenges
    const shuffled = [...this.DAILY_CHALLENGES].sort(() => 0.5 - Math.random());
    this.todaysChallenges = shuffled.slice(0, 3).map(c => ({ ...c, completed: false, progress: c.progress || 0 }));
    
    localStorage.setItem('dailyChallenges', JSON.stringify({
      date: today,
      challenges: this.todaysChallenges
    }));
  },
  
  // Update daily challenge progress
  updateDailyChallenges(action) {
    this.todaysChallenges.forEach(challenge => {
      if (!challenge.completed && challenge.check(action)) {
        if (challenge.target) {
          challenge.progress++;
          
          // Handle special tracking
          if (challenge.channels && action.channel) {
            challenge.channels.add(action.channel);
            challenge.progress = challenge.channels.size;
          }
          if (challenge.sports && action.sport) {
            challenge.sports.add(action.sport);
            challenge.progress = challenge.sports.size;
          }
          
          if (challenge.progress >= challenge.target) {
            challenge.completed = true;
            this.awardPoints(
              { type: 'daily_challenge', challenge: challenge.id },
              challenge.points,
              `Completed daily challenge: ${challenge.name}`
            );
          }
        } else {
          challenge.completed = true;
          this.awardPoints(
            { type: 'daily_challenge', challenge: challenge.id },
            challenge.points,
            `Completed daily challenge: ${challenge.name}`
          );
        }
      }
    });
    
    // Save progress
    localStorage.setItem('dailyChallenges', JSON.stringify({
      date: new Date().toDateString(),
      challenges: this.todaysChallenges
    }));
  },
  
  // Show point notification
  showPointNotification(points, description) {
    const notification = document.createElement('div');
    notification.className = 'gamification-notification points-notification';
    notification.innerHTML = `
      <div class="notification-icon">+${points}</div>
      <div class="notification-text">${description}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },
  
  // Show badge notification
  showBadgeNotification(badge) {
    const notification = document.createElement('div');
    notification.className = 'gamification-notification badge-notification';
    notification.innerHTML = `
      <div class="badge-earned">
        <div class="badge-icon">${badge.icon}</div>
        <div class="badge-info">
          <h3>Badge Earned!</h3>
          <h4>${badge.name}</h4>
          <p>${badge.description}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  },
  
  // Show unlock notification
  showUnlockNotification(feature) {
    const notification = document.createElement('div');
    notification.className = 'gamification-notification unlock-notification';
    notification.innerHTML = `
      <div class="feature-unlocked">
        <div class="feature-icon">${feature.icon}</div>
        <div class="feature-info">
          <h3>Feature Unlocked!</h3>
          <h4>${feature.name}</h4>
          <p>${feature.description}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  },
  
  // Get leaderboard data
  async getLeaderboard(leaderboardId, category = null) {
    try {
      const url = category 
        ? `/api/gamification/leaderboard/${leaderboardId}?category=${category}`
        : `/api/gamification/leaderboard/${leaderboardId}`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
    
    return [];
  },
  
  // Render gamification UI components
  renderDashboard() {
    return `
      <div class="gamification-dashboard">
        <div class="user-progress">
          <div class="level-info">
            <span class="level">Level ${this.userStats.level}</span>
            <div class="xp-bar">
              <div class="xp-fill" style="width: ${(this.userStats.points % 500) / 5}%"></div>
            </div>
            <span class="points">${this.userStats.points} points</span>
          </div>
          
          <div class="streak-info">
            <span class="streak-icon">🔥</span>
            <span class="streak-count">${this.userStats.current_streak} day streak</span>
          </div>
        </div>
        
        <div class="daily-challenges">
          <h3>Daily Challenges</h3>
          ${this.todaysChallenges.map(challenge => `
            <div class="challenge ${challenge.completed ? 'completed' : ''}">
              <span class="challenge-icon">${challenge.icon}</span>
              <div class="challenge-info">
                <h4>${challenge.name}</h4>
                <p>${challenge.description}</p>
                ${challenge.target ? `
                  <div class="challenge-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${(challenge.progress / challenge.target) * 100}%"></div>
                    </div>
                    <span>${challenge.progress}/${challenge.target}</span>
                  </div>
                ` : ''}
              </div>
              <span class="challenge-points">+${challenge.points}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="recent-badges">
          <h3>Recent Badges</h3>
          <div class="badge-grid">
            ${this.userStats.badges.slice(-6).map(badgeId => {
              const badge = Object.values(this.BADGES).find(b => b.id === badgeId);
              return badge ? `
                <div class="badge-item ${badge.tier}">
                  <span class="badge-icon">${badge.icon}</span>
                  <span class="badge-name">${badge.name}</span>
                </div>
              ` : '';
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },
  
  // Set up event listeners for gamification actions
  setupEventListeners() {
    // Override WebSocket message handler to track actions
    const originalHandler = window.wsClient.on;
    window.wsClient.on = (event, handler) => {
      if (event === 'chat-message') {
        originalHandler.call(window.wsClient, event, (data) => {
          handler(data);
          // Track message sent
          if (data.message.author.userId === this.currentUserId) {
            this.awardPoints(
              { type: 'send_message', channel: data.channel },
              this.POINTS.SEND_MESSAGE,
              'Sent a message'
            );
          }
        });
      } else {
        originalHandler.call(window.wsClient, event, handler);
      }
    };
  }
};

// CSS for gamification notifications
const style = document.createElement('style');
style.textContent = `
  .gamification-notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #5865f2;
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
    z-index: 10000;
    max-width: 400px;
  }
  
  .gamification-notification.show {
    opacity: 1;
    transform: translateY(0);
  }
  
  .points-notification {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .notification-icon {
    font-size: 24px;
    font-weight: bold;
    color: #ffd700;
  }
  
  .badge-notification {
    background: linear-gradient(135deg, #5865f2, #7289da);
  }
  
  .badge-earned, .feature-unlocked {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .badge-icon, .feature-icon {
    font-size: 48px;
  }
  
  .badge-info h3, .feature-info h3 {
    margin: 0 0 4px 0;
    font-size: 14px;
    opacity: 0.9;
  }
  
  .badge-info h4, .feature-info h4 {
    margin: 0 0 4px 0;
    font-size: 18px;
  }
  
  .badge-info p, .feature-info p {
    margin: 0;
    font-size: 14px;
    opacity: 0.9;
  }
  
  .gamification-dashboard {
    background: #2f3136;
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
  }
  
  .user-progress {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .level-info {
    flex: 1;
  }
  
  .level {
    font-size: 20px;
    font-weight: bold;
    color: #ffd700;
  }
  
  .xp-bar {
    height: 8px;
    background: #40444b;
    border-radius: 4px;
    margin: 8px 0;
    overflow: hidden;
  }
  
  .xp-fill {
    height: 100%;
    background: linear-gradient(90deg, #5865f2, #7289da);
    transition: width 0.5s ease;
  }
  
  .streak-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
  }
  
  .daily-challenges {
    margin-bottom: 20px;
  }
  
  .challenge {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #40444b;
    border-radius: 8px;
    margin: 8px 0;
    transition: all 0.3s ease;
  }
  
  .challenge.completed {
    opacity: 0.6;
    background: #3ba55c;
  }
  
  .challenge-icon {
    font-size: 24px;
  }
  
  .challenge-info {
    flex: 1;
  }
  
  .challenge-info h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
  }
  
  .challenge-info p {
    margin: 0;
    font-size: 14px;
    opacity: 0.9;
  }
  
  .challenge-progress {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }
  
  .progress-bar {
    flex: 1;
    height: 4px;
    background: #202225;
    border-radius: 2px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: #ffd700;
    transition: width 0.3s ease;
  }
  
  .challenge-points {
    font-size: 18px;
    font-weight: bold;
    color: #ffd700;
  }
  
  .badge-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }
  
  .badge-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px;
    background: #40444b;
    border-radius: 8px;
    text-align: center;
  }
  
  .badge-item.bronze {
    background: linear-gradient(135deg, #cd7f32, #b87333);
  }
  
  .badge-item.silver {
    background: linear-gradient(135deg, #c0c0c0, #b8b8b8);
  }
  
  .badge-item.gold {
    background: linear-gradient(135deg, #ffd700, #ffed4e);
  }
  
  .badge-item.platinum {
    background: linear-gradient(135deg, #e5e4e2, #bbb);
  }
  
  .badge-item.legendary {
    background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
  }
  
  .badge-icon {
    font-size: 32px;
    margin-bottom: 4px;
  }
  
  .badge-name {
    font-size: 12px;
  }
`;
document.head.appendChild(style);