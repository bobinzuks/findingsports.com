// Onboarding System for First-Time Users
window.OnboardingSystem = {
  // Onboarding state
  currentStep: 0,
  isActive: false,
  hasCompletedOnboarding: false,
  
  // Tour configuration
  tourSteps: [
    {
      id: 'welcome',
      target: null, // Full screen welcome
      title: 'Welcome to Finding Sports Community! 🎉',
      content: `
        <div class="onboarding-welcome">
          <div class="welcome-icons">
            <span>🏀</span><span>⚽</span><span>🏐</span><span>🎾</span><span>🏒</span>
          </div>
          <p>Connect with local players, find games, and grow your sports community!</p>
          <div class="feature-highlights">
            <div class="feature-item">
              <span class="feature-icon">💬</span>
              <span>Real-time chat with players</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📍</span>
              <span>Location-based channels</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🛒</span>
              <span>Sports marketplace</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🎯</span>
              <span>Find games instantly</span>
            </div>
          </div>
        </div>
      `,
      position: 'center',
      buttons: [
        { text: 'Skip Tour', action: 'skip', style: 'secondary' },
        { text: 'Take the Tour', action: 'next', style: 'primary' }
      ]
    },
    {
      id: 'social-tab',
      target: '.tab:first-child',
      title: 'Social Feed Tab',
      content: 'Click here to access the community chat, connect with players, and browse the marketplace.',
      position: 'bottom',
      highlight: true,
      requireClick: true
    },
    {
      id: 'channel-sidebar',
      target: '.discord-sidebar',
      title: 'Channel Navigation',
      content: `
        <p>Navigate between different channels:</p>
        <ul>
          <li><strong>#general</strong> - Meet players from all sports</li>
          <li><strong>#[sport]</strong> - Sport-specific discussions</li>
          <li><strong>#[location]</strong> - Local community channels</li>
        </ul>
      `,
      position: 'right',
      highlight: true
    },
    {
      id: 'current-channel',
      target: '.channel-header-bar',
      title: 'Current Channel',
      content: 'You\'re automatically connected to channels based on your location and sport preferences.',
      position: 'bottom',
      highlight: true
    },
    {
      id: 'online-users',
      target: '.discord-users-sidebar',
      title: 'Online Community',
      content: 'See who\'s online and what they\'re up to. Green = Active, Yellow = Away, Red = Busy.',
      position: 'left',
      highlight: true
    },
    {
      id: 'marketplace',
      target: '.channel-section:has(.channel-icon:contains("🛒"))',
      title: 'Sports Marketplace',
      content: 'Buy, sell, or trade sports equipment. Find teams looking for players or arrange carpools!',
      position: 'right',
      highlight: true
    },
    {
      id: 'preferences',
      target: '.channel-section:has(.channel-icon:contains("⚙️"))',
      title: 'Your Preferences',
      content: 'Change your location and sport preferences anytime to see relevant channels and content.',
      position: 'right',
      highlight: true
    },
    {
      id: 'message-input',
      target: '.message-input-container',
      title: 'Join the Conversation',
      content: 'Type your message here and press Enter to send. Use emojis and reactions to engage with the community!',
      position: 'top',
      highlight: true,
      skipIf: 'guest'
    },
    {
      id: 'completion',
      target: null,
      title: 'You\'re All Set! 🎊',
      content: `
        <div class="onboarding-completion">
          <p>You're ready to connect with your local sports community!</p>
          <div class="quick-actions">
            <h4>Quick Actions:</h4>
            <button class="quick-action-btn" onclick="window.SocialFeedPage.showPreferences()">
              ⚙️ Set Your Location & Sport
            </button>
            <button class="quick-action-btn" onclick="window.SocialFeedPage.switchToMarketplace()">
              🛒 Browse Marketplace
            </button>
            <button class="quick-action-btn" onclick="window.playNow()">
              🎯 Find Games Now
            </button>
          </div>
          <p class="tip">💡 <strong>Pro Tip:</strong> Check back daily for new games and community updates!</p>
        </div>
      `,
      position: 'center',
      buttons: [
        { text: 'Start Exploring!', action: 'complete', style: 'primary' }
      ]
    }
  ],
  
  // Progressive feature disclosure
  featureGates: {
    basicChat: { unlocked: true, level: 0 },
    reactions: { unlocked: false, level: 1, requirement: 'Send 3 messages' },
    marketplace: { unlocked: false, level: 2, requirement: 'Be active for 2 days' },
    createListings: { unlocked: false, level: 3, requirement: 'Complete profile' },
    privateMessages: { unlocked: false, level: 4, requirement: 'Join 5 games' }
  },
  
  // Initialize onboarding
  async initialize() {
    // Check if user has completed onboarding
    const hasCompleted = localStorage.getItem('onboardingCompleted');
    const lastVisit = localStorage.getItem('lastVisit');
    const isFirstTime = !lastVisit;
    
    // Update last visit
    localStorage.setItem('lastVisit', new Date().toISOString());
    
    // Show onboarding for first-time users or if requested
    if (isFirstTime && !hasCompleted) {
      // Wait for page to fully load
      setTimeout(() => {
        this.startTour();
      }, 1000);
    } else {
      // Check for feature unlocks
      this.checkFeatureProgress();
    }
    
    // Add onboarding trigger to UI
    this.addOnboardingTrigger();
    
    // Initialize contextual tooltips
    this.initializeTooltips();
    
    // Set up sample content for empty states
    this.setupEmptyStateContent();
  },
  
  // Start the onboarding tour
  startTour() {
    this.isActive = true;
    this.currentStep = 0;
    
    // Create overlay
    this.createOverlay();
    
    // Show first step
    this.showStep(0);
    
    // Track tour start
    this.trackEvent('tour_started');
  },
  
  // Create overlay for tour
  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.className = 'onboarding-overlay';
    document.body.appendChild(overlay);
  },
  
  // Show specific tour step
  showStep(stepIndex) {
    if (stepIndex >= this.tourSteps.length) {
      this.completeTour();
      return;
    }
    
    const step = this.tourSteps[stepIndex];
    this.currentStep = stepIndex;
    
    // Check if step should be skipped
    if (step.skipIf === 'guest' && window.isGuest) {
      this.nextStep();
      return;
    }
    
    // Remove existing tooltip
    const existingTooltip = document.getElementById('onboarding-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
    
    // Create tooltip
    const tooltip = this.createTooltip(step);
    document.body.appendChild(tooltip);
    
    // Position tooltip
    this.positionTooltip(tooltip, step);
    
    // Highlight target element
    if (step.highlight && step.target) {
      this.highlightElement(step.target);
    }
    
    // Handle click requirements
    if (step.requireClick && step.target) {
      this.setupClickHandler(step.target);
    }
    
    // Track step view
    this.trackEvent('step_viewed', { step: step.id });
  },
  
  // Create tooltip element
  createTooltip(step) {
    const tooltip = document.createElement('div');
    tooltip.id = 'onboarding-tooltip';
    tooltip.className = 'onboarding-tooltip';
    
    let buttonsHTML = '';
    if (step.buttons) {
      buttonsHTML = step.buttons.map(btn => 
        `<button class="onboarding-btn ${btn.style}" onclick="window.OnboardingSystem.handleAction('${btn.action}')">
          ${btn.text}
        </button>`
      ).join('');
    } else {
      buttonsHTML = `
        <button class="onboarding-btn secondary" onclick="window.OnboardingSystem.handleAction('skip')">
          Skip
        </button>
        <button class="onboarding-btn primary" onclick="window.OnboardingSystem.handleAction('next')">
          ${this.currentStep === this.tourSteps.length - 1 ? 'Finish' : 'Next'}
        </button>
      `;
    }
    
    tooltip.innerHTML = `
      <div class="onboarding-content">
        <div class="onboarding-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${((this.currentStep + 1) / this.tourSteps.length) * 100}%"></div>
          </div>
          <span class="progress-text">${this.currentStep + 1} of ${this.tourSteps.length}</span>
        </div>
        
        <h3 class="onboarding-title">${step.title}</h3>
        <div class="onboarding-body">${step.content}</div>
        
        <div class="onboarding-actions">
          ${buttonsHTML}
        </div>
      </div>
      ${step.target ? '<div class="tooltip-arrow"></div>' : ''}
    `;
    
    return tooltip;
  },
  
  // Position tooltip relative to target
  positionTooltip(tooltip, step) {
    if (!step.target) {
      // Center tooltip for full-screen steps
      tooltip.classList.add('center');
      return;
    }
    
    const target = document.querySelector(step.target);
    if (!target) {
      // If target not found, show centered
      tooltip.classList.add('center');
      return;
    }
    
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const arrow = tooltip.querySelector('.tooltip-arrow');
    
    let top, left;
    
    switch (step.position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 20;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        if (arrow) arrow.className = 'tooltip-arrow bottom';
        break;
        
      case 'bottom':
        top = targetRect.bottom + 20;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        if (arrow) arrow.className = 'tooltip-arrow top';
        break;
        
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - 20;
        if (arrow) arrow.className = 'tooltip-arrow right';
        break;
        
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + 20;
        if (arrow) arrow.className = 'tooltip-arrow left';
        break;
    }
    
    // Ensure tooltip stays within viewport
    const padding = 20;
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  },
  
  // Highlight element
  highlightElement(selector) {
    // Remove existing highlights
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight');
    });
    
    const element = document.querySelector(selector);
    if (element) {
      element.classList.add('onboarding-highlight');
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
  
  // Setup click handler for required clicks
  setupClickHandler(selector) {
    const element = document.querySelector(selector);
    if (element) {
      const handler = () => {
        element.removeEventListener('click', handler);
        this.nextStep();
      };
      element.addEventListener('click', handler);
    }
  },
  
  // Handle tour actions
  handleAction(action) {
    switch (action) {
      case 'next':
        this.nextStep();
        break;
      case 'skip':
        this.skipTour();
        break;
      case 'complete':
        this.completeTour();
        break;
    }
  },
  
  // Go to next step
  nextStep() {
    this.showStep(this.currentStep + 1);
  },
  
  // Skip the tour
  skipTour() {
    this.trackEvent('tour_skipped', { step: this.tourSteps[this.currentStep].id });
    this.completeTour();
  },
  
  // Complete the tour
  completeTour() {
    this.isActive = false;
    
    // Remove overlay and tooltip
    const overlay = document.getElementById('onboarding-overlay');
    const tooltip = document.getElementById('onboarding-tooltip');
    if (overlay) overlay.remove();
    if (tooltip) tooltip.remove();
    
    // Remove highlights
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight');
    });
    
    // Mark as completed
    localStorage.setItem('onboardingCompleted', 'true');
    this.hasCompletedOnboarding = true;
    
    // Track completion
    this.trackEvent('tour_completed');
    
    // Show completion message
    this.showCompletionMessage();
  },
  
  // Show completion message
  showCompletionMessage() {
    const message = document.createElement('div');
    message.className = 'onboarding-toast success';
    message.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">✅</span>
        <div class="toast-text">
          <strong>Tour Complete!</strong>
          <p>You can restart the tour anytime from the help menu.</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      message.classList.remove('show');
      setTimeout(() => message.remove(), 300);
    }, 5000);
  },
  
  // Add onboarding trigger button
  addOnboardingTrigger() {
    const trigger = document.createElement('button');
    trigger.className = 'onboarding-trigger';
    trigger.innerHTML = '❓ Help';
    trigger.onclick = () => this.showHelpMenu();
    
    // Add to header
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
      headerRight.appendChild(trigger);
    }
  },
  
  // Show help menu
  showHelpMenu() {
    const menu = document.createElement('div');
    menu.className = 'help-menu';
    menu.innerHTML = `
      <div class="help-menu-content">
        <h3>Help & Resources</h3>
        <button class="help-menu-item" onclick="window.OnboardingSystem.restartTour()">
          🎯 Restart Tour
        </button>
        <button class="help-menu-item" onclick="window.OnboardingSystem.showFeatureProgress()">
          🏆 Feature Progress
        </button>
        <button class="help-menu-item" onclick="window.OnboardingSystem.showTips()">
          💡 Tips & Tricks
        </button>
        <button class="help-menu-item" onclick="window.OnboardingSystem.showShortcuts()">
          ⌨️ Keyboard Shortcuts
        </button>
        <div class="help-menu-divider"></div>
        <button class="help-menu-item" onclick="window.location.href='/support'">
          📧 Contact Support
        </button>
      </div>
    `;
    
    // Position near trigger
    const trigger = document.querySelector('.onboarding-trigger');
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      menu.style.top = `${rect.bottom + 10}px`;
      menu.style.right = `${window.innerWidth - rect.right}px`;
    }
    
    document.body.appendChild(menu);
    
    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && !trigger.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 10);
  },
  
  // Restart tour
  restartTour() {
    // Close help menu
    const menu = document.querySelector('.help-menu');
    if (menu) menu.remove();
    
    // Start tour
    this.startTour();
  },
  
  // Initialize contextual tooltips
  initializeTooltips() {
    // Add tooltips to key UI elements
    const tooltips = [
      {
        selector: '.create-post-btn',
        content: 'Share game updates, find teammates, or ask questions!',
        delay: 2000
      },
      {
        selector: '.play-now-btn',
        content: 'Find games happening right now in your area!',
        delay: 3000
      },
      {
        selector: '.emoji-btn',
        content: 'Express yourself with emojis! 😊',
        delay: 5000
      }
    ];
    
    tooltips.forEach(({ selector, content, delay }) => {
      setTimeout(() => {
        this.showContextualTooltip(selector, content);
      }, delay);
    });
  },
  
  // Show contextual tooltip
  showContextualTooltip(selector, content) {
    const element = document.querySelector(selector);
    if (!element || this.isActive) return;
    
    // Check if tooltip already shown
    const tooltipKey = `tooltip_${selector}`;
    if (localStorage.getItem(tooltipKey)) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'contextual-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-content">${content}</div>
      <button class="tooltip-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + 10}px`;
    tooltip.style.left = `${rect.left}px`;
    
    document.body.appendChild(tooltip);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (tooltip.parentElement) {
        tooltip.classList.add('fade-out');
        setTimeout(() => tooltip.remove(), 300);
      }
    }, 5000);
    
    // Mark as shown
    localStorage.setItem(tooltipKey, 'true');
  },
  
  // Setup empty state content
  setupEmptyStateContent() {
    // Check if social feed is empty
    setTimeout(() => {
      const messagesContainer = document.getElementById('messagesContainer');
      if (messagesContainer && messagesContainer.children.length === 0) {
        this.showEmptyStateContent(messagesContainer);
      }
    }, 2000);
  },
  
  // Show empty state content
  showEmptyStateContent(container) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state-content';
    emptyState.innerHTML = `
      <div class="empty-state-wrapper">
        <div class="empty-state-icon">💬</div>
        <h3>No messages yet!</h3>
        <p>Be the first to start a conversation in this channel.</p>
        
        <div class="conversation-starters">
          <h4>Conversation Starters:</h4>
          <button class="starter-btn" onclick="window.OnboardingSystem.useStarter('intro')">
            👋 Introduce yourself
          </button>
          <button class="starter-btn" onclick="window.OnboardingSystem.useStarter('game')">
            🏀 Looking for a game
          </button>
          <button class="starter-btn" onclick="window.OnboardingSystem.useStarter('team')">
            👥 Find teammates
          </button>
          <button class="starter-btn" onclick="window.OnboardingSystem.useStarter('equipment')">
            🎾 Equipment question
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(emptyState);
  },
  
  // Use conversation starter
  useStarter(type) {
    const starters = {
      intro: "Hey everyone! I'm new here and looking to join some games. What sports are popular in this area?",
      game: "Anyone up for a game this weekend? I'm flexible with timing and location!",
      team: "Looking for regular teammates for weekly games. Anyone interested?",
      equipment: "Can anyone recommend good sports stores in the area? Need to get some new gear."
    };
    
    const input = document.getElementById('messageInput');
    if (input) {
      input.value = starters[type];
      input.focus();
      
      // Remove empty state
      const emptyState = document.querySelector('.empty-state-content');
      if (emptyState) emptyState.remove();
    }
  },
  
  // Check feature progress
  checkFeatureProgress() {
    const messageCount = parseInt(localStorage.getItem('messageCount') || '0');
    const daysActive = this.getDaysActive();
    const profileComplete = localStorage.getItem('profileComplete') === 'true';
    const gamesJoined = parseInt(localStorage.getItem('gamesJoined') || '0');
    
    // Update feature gates
    if (messageCount >= 3 && !this.featureGates.reactions.unlocked) {
      this.unlockFeature('reactions');
    }
    
    if (daysActive >= 2 && !this.featureGates.marketplace.unlocked) {
      this.unlockFeature('marketplace');
    }
    
    if (profileComplete && !this.featureGates.createListings.unlocked) {
      this.unlockFeature('createListings');
    }
    
    if (gamesJoined >= 5 && !this.featureGates.privateMessages.unlocked) {
      this.unlockFeature('privateMessages');
    }
  },
  
  // Get days active
  getDaysActive() {
    const firstVisit = localStorage.getItem('firstVisit');
    if (!firstVisit) return 0;
    
    const days = Math.floor((Date.now() - new Date(firstVisit).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  },
  
  // Unlock feature
  unlockFeature(featureName) {
    const feature = this.featureGates[featureName];
    if (!feature || feature.unlocked) return;
    
    feature.unlocked = true;
    
    // Show unlock notification
    this.showFeatureUnlock(featureName, feature);
    
    // Track unlock
    this.trackEvent('feature_unlocked', { feature: featureName });
  },
  
  // Show feature unlock notification
  showFeatureUnlock(featureName, feature) {
    const notification = document.createElement('div');
    notification.className = 'feature-unlock-notification';
    notification.innerHTML = `
      <div class="unlock-content">
        <div class="unlock-icon">🎉</div>
        <div class="unlock-text">
          <h4>New Feature Unlocked!</h4>
          <p>${this.getFeatureDescription(featureName)}</p>
        </div>
        <button class="unlock-cta" onclick="window.OnboardingSystem.showFeatureGuide('${featureName}')">
          Learn More
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 8000);
  },
  
  // Get feature description
  getFeatureDescription(featureName) {
    const descriptions = {
      reactions: 'React to messages with emojis!',
      marketplace: 'Access the sports marketplace!',
      createListings: 'Create your own marketplace listings!',
      privateMessages: 'Send private messages to other players!'
    };
    
    return descriptions[featureName] || 'New feature available!';
  },
  
  // Show feature guide
  showFeatureGuide(featureName) {
    // Close notification
    const notification = document.querySelector('.feature-unlock-notification');
    if (notification) notification.remove();
    
    // Show mini-tour for the feature
    const guides = {
      reactions: [
        {
          target: '.message-reactions',
          content: 'Click the + button to add reactions to messages!',
          position: 'top'
        }
      ],
      marketplace: [
        {
          target: '.channel-section:has(.channel-icon:contains("🛒"))',
          content: 'Click here to browse the marketplace!',
          position: 'right'
        }
      ]
    };
    
    const guide = guides[featureName];
    if (guide && guide.length > 0) {
      this.showMiniTour(guide);
    }
  },
  
  // Show mini tour
  showMiniTour(steps) {
    let currentStep = 0;
    
    const showStep = () => {
      if (currentStep >= steps.length) return;
      
      const step = steps[currentStep];
      const tooltip = this.createTooltip({
        ...step,
        buttons: [
          { text: 'Got it!', action: 'close', style: 'primary' }
        ]
      });
      
      tooltip.querySelector('.onboarding-btn').onclick = () => {
        tooltip.remove();
        currentStep++;
        if (currentStep < steps.length) {
          setTimeout(showStep, 300);
        }
      };
      
      document.body.appendChild(tooltip);
      this.positionTooltip(tooltip, step);
      
      if (step.target) {
        this.highlightElement(step.target);
        setTimeout(() => {
          document.querySelector(step.target)?.classList.remove('onboarding-highlight');
        }, 3000);
      }
    };
    
    showStep();
  },
  
  // Show feature progress
  showFeatureProgress() {
    const modal = document.createElement('div');
    modal.className = 'feature-progress-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
      <div class="modal-content">
        <h2>Feature Progress 🏆</h2>
        <div class="progress-list">
          ${Object.entries(this.featureGates).map(([name, feature]) => `
            <div class="progress-item ${feature.unlocked ? 'unlocked' : 'locked'}">
              <div class="progress-icon">${feature.unlocked ? '✅' : '🔒'}</div>
              <div class="progress-info">
                <h4>${this.getFeatureName(name)}</h4>
                <p>${feature.unlocked ? 'Unlocked!' : feature.requirement}</p>
              </div>
            </div>
          `).join('')}
        </div>
        <button class="modal-close" onclick="this.closest('.feature-progress-modal').remove()">
          Close
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
  },
  
  // Get feature name
  getFeatureName(key) {
    const names = {
      basicChat: 'Basic Chat',
      reactions: 'Message Reactions',
      marketplace: 'Marketplace Access',
      createListings: 'Create Listings',
      privateMessages: 'Private Messages'
    };
    
    return names[key] || key;
  },
  
  // Show tips
  showTips() {
    const tips = [
      '💡 Use @username to mention someone in chat',
      '💡 Press Ctrl+Enter for a new line in messages',
      '💡 Double-click a message to quick-react',
      '💡 Use /commands for special actions (coming soon)',
      '💡 Star channels to pin them to the top',
      '💡 Mute channels you\'re not interested in',
      '💡 Set your status to show what you\'re up to'
    ];
    
    const modal = document.createElement('div');
    modal.className = 'tips-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
      <div class="modal-content">
        <h2>Tips & Tricks 💡</h2>
        <div class="tips-list">
          ${tips.map(tip => `<div class="tip-item">${tip}</div>`).join('')}
        </div>
        <button class="modal-close" onclick="this.closest('.tips-modal').remove()">
          Got it!
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
  },
  
  // Show shortcuts
  showShortcuts() {
    const shortcuts = [
      { key: 'Enter', action: 'Send message' },
      { key: 'Shift + Enter', action: 'New line' },
      { key: 'Ctrl + K', action: 'Quick channel switch' },
      { key: 'Ctrl + F', action: 'Search messages' },
      { key: 'Esc', action: 'Close modals' },
      { key: 'Up Arrow', action: 'Edit last message' }
    ];
    
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
      <div class="modal-content">
        <h2>Keyboard Shortcuts ⌨️</h2>
        <div class="shortcuts-list">
          ${shortcuts.map(s => `
            <div class="shortcut-item">
              <kbd>${s.key}</kbd>
              <span>${s.action}</span>
            </div>
          `).join('')}
        </div>
        <button class="modal-close" onclick="this.closest('.shortcuts-modal').remove()">
          Close
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
  },
  
  // Track events
  trackEvent(eventName, data = {}) {
    // Analytics tracking
    console.log('Onboarding Event:', eventName, data);
    
    // You can integrate with analytics services here
    if (window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'onboarding',
        ...data
      });
    }
  }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize onboarding only if social feed is active
  if (document.querySelector('.social-section') || document.querySelector('.social-feed-section')) {
    window.OnboardingSystem.initialize();
  }
});