// A/B Test Framework for Social Feed Engagement Optimization
// Version: 1.0.0

(function() {
  'use strict';

  // A/B Test Configuration
  window.ABTestSocialFeed = {
    // Test configurations
    tests: {
      tabIndicators: {
        name: 'Tab Visual Indicators Test',
        variants: ['badges', 'dots', 'text', 'glow'],
        allocation: [0.25, 0.25, 0.25, 0.25],
        metrics: ['tab_clicks', 'time_to_discover', 'engagement_rate']
      },
      socialPromptTiming: {
        name: 'Social Feed Prompt Timing Test',
        variants: ['immediate', 'after_5min', 'after_first_game', 'on_idle'],
        allocation: [0.25, 0.25, 0.25, 0.25],
        metrics: ['prompt_clicks', 'dismissal_rate', 'conversion_rate']
      },
      emptyStateMessages: {
        name: 'Empty State Messaging Test',
        variants: ['friendly', 'actionable', 'social_proof', 'gamified'],
        allocation: [0.25, 0.25, 0.25, 0.25],
        metrics: ['message_sent', 'channel_joined', 'bounce_rate']
      },
      featureReveal: {
        name: 'Feature Reveal Strategy Test',
        variants: ['progressive', 'immediate', 'guided', 'contextual'],
        allocation: [0.25, 0.25, 0.25, 0.25],
        metrics: ['feature_discovered', 'feature_used', 'retention_7d']
      },
      notificationStrategy: {
        name: 'Notification Strategy Test',
        variants: ['subtle', 'prominent', 'animated', 'sound_enabled'],
        allocation: [0.25, 0.25, 0.25, 0.25],
        metrics: ['notification_clicked', 'notification_dismissed', 'engagement_after']
      }
    },

    // Active user tests
    activeTests: new Map(),

    // Metrics storage
    metrics: new Map(),

    // Initialize A/B testing
    initialize() {
      console.log('Initializing A/B Testing for Social Feed');
      
      // Load user's test assignments
      this.loadUserAssignments();
      
      // Apply active tests
      this.applyActiveTests();
      
      // Start metrics collection
      this.startMetricsCollection();
      
      // Set up event listeners
      this.setupEventListeners();
    },

    // Load or assign user to test variants
    loadUserAssignments() {
      const stored = localStorage.getItem('ab_test_assignments');
      const assignments = stored ? JSON.parse(stored) : {};
      
      // Assign to new tests if not already assigned
      Object.keys(this.tests).forEach(testId => {
        if (!assignments[testId]) {
          assignments[testId] = this.assignVariant(testId);
        }
        this.activeTests.set(testId, assignments[testId]);
      });
      
      // Save assignments
      localStorage.setItem('ab_test_assignments', JSON.stringify(assignments));
      
      // Initialize metrics for user
      this.initializeUserMetrics();
    },

    // Assign user to a variant based on allocation
    assignVariant(testId) {
      const test = this.tests[testId];
      const random = Math.random();
      let cumulative = 0;
      
      for (let i = 0; i < test.variants.length; i++) {
        cumulative += test.allocation[i];
        if (random < cumulative) {
          return {
            variant: test.variants[i],
            assignedAt: Date.now()
          };
        }
      }
      
      // Fallback to last variant
      return {
        variant: test.variants[test.variants.length - 1],
        assignedAt: Date.now()
      };
    },

    // Initialize user metrics storage
    initializeUserMetrics() {
      const userId = localStorage.getItem('userId') || `anon_${Date.now()}`;
      
      this.activeTests.forEach((assignment, testId) => {
        const key = `${testId}_${assignment.variant}`;
        if (!this.metrics.has(key)) {
          this.metrics.set(key, {
            userId,
            testId,
            variant: assignment.variant,
            events: [],
            aggregates: {}
          });
        }
      });
    },

    // Apply active test variants
    applyActiveTests() {
      this.activeTests.forEach((assignment, testId) => {
        switch (testId) {
          case 'tabIndicators':
            this.applyTabIndicatorVariant(assignment.variant);
            break;
          case 'socialPromptTiming':
            this.applySocialPromptTiming(assignment.variant);
            break;
          case 'emptyStateMessages':
            this.applyEmptyStateMessage(assignment.variant);
            break;
          case 'featureReveal':
            this.applyFeatureRevealStrategy(assignment.variant);
            break;
          case 'notificationStrategy':
            this.applyNotificationStrategy(assignment.variant);
            break;
        }
      });
    },

    // Test 1: Tab Visual Indicators
    applyTabIndicatorVariant(variant) {
      const style = document.createElement('style');
      style.id = 'ab-test-tab-indicators';
      
      switch (variant) {
        case 'badges':
          style.textContent = `
            .nav-item[data-tab="social"]:not(.active)::after {
              content: "NEW";
              position: absolute;
              top: -8px;
              right: -8px;
              background: #ff6b35;
              color: white;
              font-size: 10px;
              font-weight: bold;
              padding: 2px 6px;
              border-radius: 10px;
              animation: pulse 2s infinite;
            }
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
          `;
          break;
          
        case 'dots':
          style.textContent = `
            .nav-item[data-tab="social"]:not(.active)::after {
              content: "";
              position: absolute;
              top: 5px;
              right: 5px;
              width: 8px;
              height: 8px;
              background: #ff6b35;
              border-radius: 50%;
              animation: blink 1.5s infinite;
            }
            @keyframes blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.3; }
            }
          `;
          break;
          
        case 'text':
          style.textContent = `
            .nav-item[data-tab="social"]:not(.active) .nav-link::after {
              content: " (Try it!)";
              color: #ff6b35;
              font-weight: bold;
              font-size: 0.9em;
            }
          `;
          break;
          
        case 'glow':
          style.textContent = `
            .nav-item[data-tab="social"]:not(.active) {
              animation: glow 2s ease-in-out infinite;
            }
            @keyframes glow {
              0%, 100% { 
                box-shadow: 0 0 0 0 rgba(255, 107, 53, 0);
              }
              50% { 
                box-shadow: 0 0 20px 5px rgba(255, 107, 53, 0.5);
              }
            }
          `;
          break;
      }
      
      document.head.appendChild(style);
      
      // Track variant application
      this.trackEvent('tabIndicators', 'variant_applied', { variant });
    },

    // Test 2: Social Feed Prompt Timing
    applySocialPromptTiming(variant) {
      const showPrompt = () => {
        // Skip if already shown or user is logged in
        if (localStorage.getItem('social_prompt_shown') === 'true' || !window.isGuest) {
          return;
        }
        
        const prompt = document.createElement('div');
        prompt.className = 'social-feed-prompt';
        prompt.innerHTML = `
          <div class="prompt-overlay">
            <div class="prompt-content">
              <button class="prompt-close" onclick="this.parentElement.parentElement.remove()">×</button>
              <h3>🎉 Join the Community!</h3>
              <p>Connect with local players, find teammates, and never miss a game!</p>
              <div class="prompt-actions">
                <button class="prompt-action-primary" onclick="window.ABTestSocialFeed.handlePromptAction('explore')">
                  Explore Social Feed
                </button>
                <button class="prompt-action-secondary" onclick="window.ABTestSocialFeed.handlePromptAction('later')">
                  Maybe Later
                </button>
              </div>
              <div class="prompt-social-proof">
                <span>👥 Join 2,341 active players in your area</span>
              </div>
            </div>
          </div>
        `;
        
        // Apply styles
        const style = document.createElement('style');
        style.textContent = `
          .social-feed-prompt {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
            animation: fadeIn 0.3s ease-out;
          }
          .prompt-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .prompt-content {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            max-width: 400px;
            width: 90%;
            position: relative;
            animation: slideUp 0.3s ease-out;
          }
          .prompt-close {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
          }
          .prompt-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
          }
          .prompt-action-primary {
            flex: 1;
            padding: 12px;
            background: #ff6b35;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
          }
          .prompt-action-secondary {
            flex: 1;
            padding: 12px;
            background: #f0f0f0;
            color: #666;
            border: none;
            border-radius: 8px;
            cursor: pointer;
          }
          .prompt-social-proof {
            margin-top: 1rem;
            text-align: center;
            color: #666;
            font-size: 0.9em;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
        document.body.appendChild(prompt);
        
        // Track prompt shown
        this.trackEvent('socialPromptTiming', 'prompt_shown', { variant, timing: Date.now() });
        localStorage.setItem('social_prompt_shown', 'true');
      };
      
      switch (variant) {
        case 'immediate':
          setTimeout(showPrompt, 2000);
          break;
          
        case 'after_5min':
          setTimeout(showPrompt, 5 * 60 * 1000);
          break;
          
        case 'after_first_game':
          // Listen for first game view
          window.addEventListener('game_viewed', function handler() {
            showPrompt();
            window.removeEventListener('game_viewed', handler);
          });
          break;
          
        case 'on_idle':
          let idleTimer;
          const resetIdleTimer = () => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(showPrompt, 30000); // 30 seconds of idle
          };
          
          document.addEventListener('mousemove', resetIdleTimer);
          document.addEventListener('keypress', resetIdleTimer);
          resetIdleTimer();
          break;
      }
    },

    // Test 3: Empty State Messages
    applyEmptyStateMessage(variant) {
      // Store variant for when empty state is shown
      window.ABTestEmptyStateVariant = variant;
      
      // Override the empty state rendering
      const originalRender = window.SocialFeedPage ? window.SocialFeedPage.render : null;
      if (originalRender) {
        window.SocialFeedPage.render = function() {
          originalRender.call(this);
          
          // Check if empty state is shown
          const emptyFeed = document.querySelector('.empty-feed');
          if (emptyFeed) {
            window.ABTestSocialFeed.renderEmptyStateVariant(variant, emptyFeed);
          }
        };
      }
    },

    // Render empty state variant
    renderEmptyStateVariant(variant, container) {
      let content;
      
      switch (variant) {
        case 'friendly':
          content = `
            <h3>👋 Welcome to the Community!</h3>
            <p>No messages yet, but that's about to change!</p>
            <p>Be the first to say hello and start connecting with local players.</p>
            <button class="start-chat-btn" onclick="window.ABTestSocialFeed.handleEmptyStateAction('start_chat')">
              Start a Conversation
            </button>
          `;
          break;
          
        case 'actionable':
          content = `
            <h3>🚀 Ready to Connect?</h3>
            <div class="action-list">
              <div class="action-item">
                <span class="action-icon">💬</span>
                <span>Introduce yourself to the community</span>
              </div>
              <div class="action-item">
                <span class="action-icon">🏀</span>
                <span>Share your favorite sport</span>
              </div>
              <div class="action-item">
                <span class="action-icon">📍</span>
                <span>Ask about games in your area</span>
              </div>
            </div>
            <button class="start-chat-btn" onclick="window.ABTestSocialFeed.handleEmptyStateAction('start_chat')">
              Get Started
            </button>
          `;
          break;
          
        case 'social_proof':
          content = `
            <h3>🌟 Join the Conversation!</h3>
            <p>Yesterday, 47 players connected through this chat</p>
            <div class="recent-activity">
              <div class="activity-item">
                <strong>Alex:</strong> "Found an amazing basketball group here!"
              </div>
              <div class="activity-item">
                <strong>Sarah:</strong> "Thanks for the tennis partner recommendations!"
              </div>
            </div>
            <button class="start-chat-btn" onclick="window.ABTestSocialFeed.handleEmptyStateAction('start_chat')">
              Join the Community
            </button>
          `;
          break;
          
        case 'gamified':
          content = `
            <h3>🏆 Be the First!</h3>
            <p>Start the conversation and earn the <strong>Conversation Starter</strong> badge!</p>
            <div class="achievement-preview">
              <span class="achievement-icon">💫</span>
              <div class="achievement-details">
                <strong>Conversation Starter</strong>
                <p>+50 points • Exclusive badge</p>
              </div>
            </div>
            <button class="start-chat-btn" onclick="window.ABTestSocialFeed.handleEmptyStateAction('start_chat')">
              Claim Your Badge
            </button>
          `;
          break;
      }
      
      container.innerHTML = content;
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .empty-feed {
          text-align: center;
          padding: 3rem;
          background: #f8f9fa;
          border-radius: 12px;
          margin: 2rem auto;
          max-width: 500px;
        }
        .start-chat-btn {
          margin-top: 1.5rem;
          padding: 12px 24px;
          background: #ff6b35;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .start-chat-btn:hover {
          background: #e55a2b;
          transform: translateY(-2px);
        }
        .action-list {
          margin: 1.5rem 0;
          text-align: left;
        }
        .action-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 10px 0;
          padding: 10px;
          background: white;
          border-radius: 8px;
        }
        .action-icon {
          font-size: 1.5em;
        }
        .recent-activity {
          margin: 1.5rem 0;
          text-align: left;
        }
        .activity-item {
          padding: 10px;
          background: white;
          border-radius: 8px;
          margin: 8px 0;
          font-style: italic;
        }
        .achievement-preview {
          display: flex;
          align-items: center;
          gap: 15px;
          background: white;
          padding: 1rem;
          border-radius: 8px;
          margin: 1.5rem auto;
          max-width: 300px;
        }
        .achievement-icon {
          font-size: 2.5em;
        }
        .achievement-details {
          text-align: left;
        }
        .achievement-details p {
          margin: 0;
          color: #666;
          font-size: 0.9em;
        }
      `;
      document.head.appendChild(style);
      
      // Track empty state shown
      this.trackEvent('emptyStateMessages', 'empty_state_shown', { variant });
    },

    // Test 4: Feature Reveal Strategy
    applyFeatureRevealStrategy(variant) {
      switch (variant) {
        case 'progressive':
          this.setupProgressiveReveal();
          break;
          
        case 'immediate':
          // All features visible immediately
          this.revealAllFeatures();
          break;
          
        case 'guided':
          this.setupGuidedTour();
          break;
          
        case 'contextual':
          this.setupContextualReveal();
          break;
      }
    },

    // Progressive feature reveal
    setupProgressiveReveal() {
      const features = [
        { id: 'chat', threshold: 0, selector: '.discord-main' },
        { id: 'marketplace', threshold: 3, selector: '.channel-section:has(.channel-item[onclick*="Marketplace"])' },
        { id: 'gamification', threshold: 5, selector: '.channel-section:has(.channel-item[onclick*="Gamification"])' },
        { id: 'preferences', threshold: 10, selector: '.channel-section:has(.channel-item[onclick*="Preferences"])' }
      ];
      
      // Check message count and reveal features
      const messageCount = parseInt(localStorage.getItem('messageCount') || '0');
      
      features.forEach(feature => {
        const element = document.querySelector(feature.selector);
        if (element) {
          if (messageCount < feature.threshold) {
            element.style.opacity = '0.3';
            element.style.pointerEvents = 'none';
            element.setAttribute('title', `Send ${feature.threshold - messageCount} more messages to unlock!`);
          } else {
            // Reveal with animation
            element.style.transition = 'all 0.5s ease';
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
            
            // Show unlock notification
            if (!localStorage.getItem(`feature_${feature.id}_unlocked`)) {
              this.showFeatureUnlockNotification(feature.id);
              localStorage.setItem(`feature_${feature.id}_unlocked`, 'true');
            }
          }
        }
      });
      
      // Track strategy applied
      this.trackEvent('featureReveal', 'strategy_applied', { variant: 'progressive', messageCount });
    },

    // Reveal all features immediately
    revealAllFeatures() {
      // Ensure all sections are visible
      document.querySelectorAll('.channel-section').forEach(section => {
        section.style.opacity = '1';
        section.style.pointerEvents = 'auto';
      });
      
      // Track strategy applied
      this.trackEvent('featureReveal', 'strategy_applied', { variant: 'immediate' });
    },

    // Setup guided tour
    setupGuidedTour() {
      // Check if tour has been completed
      if (localStorage.getItem('guided_tour_completed') === 'true') {
        return;
      }
      
      const tourSteps = [
        {
          target: '.discord-main',
          title: 'Welcome to Chat!',
          content: 'This is where you can connect with other players in your area.',
          position: 'right'
        },
        {
          target: '.channel-item[onclick*="marketplace"]',
          title: 'Marketplace',
          content: 'Buy, sell, or trade sports equipment with the community.',
          position: 'right'
        },
        {
          target: '.online-users-list',
          title: 'Online Players',
          content: 'See who\'s currently active and ready to play.',
          position: 'left'
        }
      ];
      
      let currentStep = 0;
      
      const showTourStep = (step) => {
        // Remove previous tooltip
        const existingTooltip = document.querySelector('.tour-tooltip');
        if (existingTooltip) {
          existingTooltip.remove();
        }
        
        if (currentStep >= tourSteps.length) {
          localStorage.setItem('guided_tour_completed', 'true');
          this.trackEvent('featureReveal', 'tour_completed', { steps: tourSteps.length });
          return;
        }
        
        const stepData = tourSteps[currentStep];
        const target = document.querySelector(stepData.target);
        
        if (!target) {
          currentStep++;
          showTourStep(currentStep);
          return;
        }
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tour-tooltip';
        tooltip.innerHTML = `
          <div class="tour-tooltip-content">
            <h4>${stepData.title}</h4>
            <p>${stepData.content}</p>
            <div class="tour-actions">
              <button onclick="window.ABTestSocialFeed.skipTour()">Skip</button>
              <button onclick="window.ABTestSocialFeed.nextTourStep()" class="tour-next">Next</button>
            </div>
          </div>
          <div class="tour-tooltip-arrow"></div>
        `;
        
        // Position tooltip
        const rect = target.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        
        if (stepData.position === 'right') {
          tooltip.style.left = `${rect.right + 10}px`;
          tooltip.style.top = `${rect.top + rect.height / 2}px`;
          tooltip.style.transform = 'translateY(-50%)';
        } else {
          tooltip.style.right = `${window.innerWidth - rect.left + 10}px`;
          tooltip.style.top = `${rect.top + rect.height / 2}px`;
          tooltip.style.transform = 'translateY(-50%)';
        }
        
        document.body.appendChild(tooltip);
        
        // Highlight target
        target.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.5)';
        target.style.transition = 'box-shadow 0.3s ease';
      };
      
      // Start tour after a delay
      setTimeout(() => showTourStep(0), 2000);
      
      // Track tour started
      this.trackEvent('featureReveal', 'tour_started', { variant: 'guided' });
    },

    // Setup contextual reveal
    setupContextualReveal() {
      // Reveal features based on user actions
      const contextualFeatures = {
        'first_message': '.channel-item[onclick*="marketplace"]',
        'profile_view': '.channel-item[onclick*="Gamification"]',
        'game_joined': '.channel-section:has(.channel-item[onclick*="Preferences"])'
      };
      
      // Listen for contextual triggers
      window.addEventListener('user_action', (e) => {
        const action = e.detail.action;
        const selector = contextualFeatures[action];
        
        if (selector && !localStorage.getItem(`contextual_${action}_revealed`)) {
          const element = document.querySelector(selector);
          if (element) {
            // Reveal with highlight
            element.style.animation = 'contextualReveal 1s ease';
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
            
            // Show contextual tooltip
            this.showContextualTooltip(element, action);
            
            localStorage.setItem(`contextual_${action}_revealed`, 'true');
            this.trackEvent('featureReveal', 'contextual_reveal', { action, variant: 'contextual' });
          }
        }
      });
      
      // Add reveal animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes contextualReveal {
          0% { 
            opacity: 0.3;
            transform: scale(0.95);
          }
          50% {
            transform: scale(1.05);
          }
          100% { 
            opacity: 1;
            transform: scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    },

    // Test 5: Notification Strategy
    applyNotificationStrategy(variant) {
      window.ABTestNotificationVariant = variant;
      
      // Override notification display
      const originalShowNotification = window.showNotification || function() {};
      
      window.showNotification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `ab-test-notification notification-${variant}`;
        
        switch (variant) {
          case 'subtle':
            notification.innerHTML = `
              <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✓' : 'ℹ'}</span>
                <span class="notification-message">${message}</span>
              </div>
            `;
            notification.style.cssText = `
              position: fixed;
              bottom: 20px;
              right: 20px;
              background: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 12px 20px;
              border-radius: 4px;
              font-size: 14px;
              opacity: 0;
              transform: translateY(20px);
              transition: all 0.3s ease;
              z-index: 10000;
            `;
            break;
            
          case 'prominent':
            notification.innerHTML = `
              <div class="notification-header">
                <span class="notification-title">${type === 'success' ? 'Success!' : 'Notification'}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
              </div>
              <div class="notification-body">${message}</div>
              <div class="notification-action">
                <button onclick="window.ABTestSocialFeed.handleNotificationAction('view')">View</button>
              </div>
            `;
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: white;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
              border-radius: 8px;
              padding: 1rem;
              min-width: 300px;
              opacity: 0;
              transform: translateX(320px);
              transition: all 0.3s ease;
              z-index: 10000;
            `;
            break;
            
          case 'animated':
            notification.innerHTML = `
              <div class="notification-animated">
                <div class="notification-icon-animated">${type === 'success' ? '🎉' : '💬'}</div>
                <div class="notification-text">${message}</div>
              </div>
            `;
            notification.style.cssText = `
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0);
              background: linear-gradient(135deg, #ff6b35, #ff8f65);
              color: white;
              padding: 20px 30px;
              border-radius: 50px;
              font-weight: bold;
              z-index: 10000;
              animation: notificationPop 0.5s ease forwards;
            `;
            
            // Add animation
            const animStyle = document.createElement('style');
            animStyle.textContent = `
              @keyframes notificationPop {
                0% { transform: translate(-50%, -50%) scale(0); }
                50% { transform: translate(-50%, -50%) scale(1.1); }
                100% { transform: translate(-50%, -50%) scale(1); }
              }
              .notification-icon-animated {
                font-size: 2em;
                margin-bottom: 10px;
                animation: iconBounce 0.5s ease 0.3s;
              }
              @keyframes iconBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
            `;
            document.head.appendChild(animStyle);
            break;
            
          case 'sound_enabled':
            notification.innerHTML = `
              <div class="notification-sound">
                <span class="notification-icon">${type === 'success' ? '🔔' : '📢'}</span>
                <span class="notification-message">${message}</span>
              </div>
            `;
            notification.style.cssText = `
              position: fixed;
              top: 80px;
              right: 20px;
              background: #ff6b35;
              color: white;
              padding: 15px 25px;
              border-radius: 30px;
              font-weight: 500;
              opacity: 0;
              transform: translateY(-20px);
              transition: all 0.3s ease;
              z-index: 10000;
            `;
            
            // Play notification sound
            this.playNotificationSound(type);
            break;
        }
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
          notification.style.opacity = '1';
          if (variant === 'subtle') {
            notification.style.transform = 'translateY(0)';
          } else if (variant === 'prominent') {
            notification.style.transform = 'translateX(0)';
          } else if (variant === 'sound_enabled') {
            notification.style.transform = 'translateY(0)';
          }
        }, 10);
        
        // Auto-remove after delay
        const duration = variant === 'prominent' ? 5000 : 3000;
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => notification.remove(), 300);
        }, duration);
        
        // Track notification shown
        this.trackEvent('notificationStrategy', 'notification_shown', { variant, type, message });
      };
    },

    // Play notification sound
    playNotificationSound(type) {
      const audio = new Audio();
      audio.volume = 0.3;
      
      // Use data URI for simple notification sounds
      if (type === 'success') {
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE';
      } else {
        audio.src = 'data:audio/wav;base64,UklGRvwFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YdgFAACBhYmFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUREMVqzn7qtZFAg';
      }
      
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    },

    // Handle prompt action
    handlePromptAction(action) {
      const variant = this.activeTests.get('socialPromptTiming').variant;
      
      this.trackEvent('socialPromptTiming', 'prompt_action', { variant, action });
      
      if (action === 'explore') {
        // Navigate to social feed
        const socialTab = document.querySelector('[data-tab="social"]');
        if (socialTab) {
          socialTab.click();
        }
        
        // Remove prompt
        const prompt = document.querySelector('.social-feed-prompt');
        if (prompt) {
          prompt.remove();
        }
      } else if (action === 'later') {
        // Just close the prompt
        const prompt = document.querySelector('.social-feed-prompt');
        if (prompt) {
          prompt.remove();
        }
      }
    },

    // Handle empty state action
    handleEmptyStateAction(action) {
      const variant = this.activeTests.get('emptyStateMessages').variant;
      
      this.trackEvent('emptyStateMessages', 'empty_state_action', { variant, action });
      
      if (action === 'start_chat') {
        // Focus on message input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
          messageInput.focus();
          
          // Add helper text based on variant
          if (variant === 'actionable') {
            messageInput.placeholder = "Try: 'Hi everyone! Looking for basketball players in downtown'";
          } else if (variant === 'gamified') {
            messageInput.placeholder = "Send your first message to earn the badge!";
          }
        }
      }
    },

    // Handle notification action
    handleNotificationAction(action) {
      const variant = this.activeTests.get('notificationStrategy').variant;
      
      this.trackEvent('notificationStrategy', 'notification_action', { variant, action });
      
      // Close notification
      const notification = document.querySelector('.ab-test-notification');
      if (notification) {
        notification.remove();
      }
    },

    // Tour navigation
    nextTourStep() {
      const tourTooltip = document.querySelector('.tour-tooltip');
      if (tourTooltip) {
        // Remove highlight from current target
        const tourSteps = [
          { target: '.discord-main' },
          { target: '.channel-item[onclick*="marketplace"]' },
          { target: '.online-users-list' }
        ];
        
        tourSteps.forEach(step => {
          const target = document.querySelector(step.target);
          if (target) {
            target.style.boxShadow = '';
          }
        });
        
        tourTooltip.remove();
      }
      
      // Move to next step
      if (window.currentTourStep !== undefined) {
        window.currentTourStep++;
        this.setupGuidedTour();
      }
    },

    skipTour() {
      const tourTooltip = document.querySelector('.tour-tooltip');
      if (tourTooltip) {
        tourTooltip.remove();
      }
      
      localStorage.setItem('guided_tour_completed', 'true');
      this.trackEvent('featureReveal', 'tour_skipped', { step: window.currentTourStep || 0 });
    },

    // Show feature unlock notification
    showFeatureUnlockNotification(featureId) {
      const notification = document.createElement('div');
      notification.className = 'feature-unlock-notification';
      notification.innerHTML = `
        <div class="unlock-content">
          <span class="unlock-icon">🎉</span>
          <div class="unlock-text">
            <strong>New Feature Unlocked!</strong>
            <p>${this.getFeatureName(featureId)} is now available</p>
          </div>
        </div>
      `;
      
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: linear-gradient(135deg, #ff6b35, #ff8f65);
        color: white;
        padding: 15px 25px;
        border-radius: 50px;
        box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);
        z-index: 10000;
        animation: unlockDrop 0.5s ease forwards;
      `;
      
      // Add animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes unlockDrop {
          to {
            transform: translateX(-50%) translateY(0);
          }
        }
        .unlock-content {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .unlock-icon {
          font-size: 2em;
        }
        .unlock-text p {
          margin: 0;
          opacity: 0.9;
        }
      `;
      document.head.appendChild(style);
      
      document.body.appendChild(notification);
      
      // Remove after delay
      setTimeout(() => {
        notification.style.animation = 'unlockDrop 0.5s ease reverse';
        setTimeout(() => notification.remove(), 500);
      }, 3000);
      
      this.trackEvent('featureReveal', 'feature_unlocked', { featureId });
    },

    // Show contextual tooltip
    showContextualTooltip(element, action) {
      const tooltip = document.createElement('div');
      tooltip.className = 'contextual-tooltip';
      
      const messages = {
        'first_message': 'Great job! Check out the Marketplace to find equipment.',
        'profile_view': 'Track your progress and earn rewards!',
        'game_joined': 'Customize your preferences for better game recommendations.'
      };
      
      tooltip.innerHTML = `
        <div class="tooltip-arrow"></div>
        <div class="tooltip-content">
          ${messages[action] || 'New feature available!'}
        </div>
      `;
      
      const rect = element.getBoundingClientRect();
      tooltip.style.cssText = `
        position: fixed;
        left: ${rect.right + 10}px;
        top: ${rect.top + rect.height / 2}px;
        transform: translateY(-50%);
        background: #333;
        color: white;
        padding: 10px 15px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 10001;
        animation: tooltipFade 0.3s ease;
      `;
      
      document.body.appendChild(tooltip);
      
      // Remove after delay
      setTimeout(() => {
        tooltip.style.opacity = '0';
        setTimeout(() => tooltip.remove(), 300);
      }, 5000);
    },

    // Get feature name
    getFeatureName(featureId) {
      const names = {
        'chat': 'Community Chat',
        'marketplace': 'Sports Marketplace',
        'gamification': 'Rewards & Progress',
        'preferences': 'Preferences Settings'
      };
      return names[featureId] || 'New Feature';
    },

    // Event tracking
    trackEvent(testId, eventName, data = {}) {
      const assignment = this.activeTests.get(testId);
      if (!assignment) return;
      
      const event = {
        testId,
        variant: assignment.variant,
        eventName,
        data,
        timestamp: Date.now(),
        sessionId: localStorage.getItem('sessionId') || 'no-session',
        userId: localStorage.getItem('userId') || 'anonymous'
      };
      
      // Store in metrics
      const key = `${testId}_${assignment.variant}`;
      const metrics = this.metrics.get(key);
      if (metrics) {
        metrics.events.push(event);
        
        // Update aggregates
        if (!metrics.aggregates[eventName]) {
          metrics.aggregates[eventName] = 0;
        }
        metrics.aggregates[eventName]++;
      }
      
      // Send to analytics (in production)
      this.sendToAnalytics(event);
      
      console.log('A/B Test Event:', event);
    },

    // Send to analytics backend
    async sendToAnalytics(event) {
      // In production, this would send to your analytics service
      try {
        await fetch('/api/analytics/ab-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        });
      } catch (error) {
        console.error('Failed to send analytics:', error);
        // Store locally for retry
        const failedEvents = JSON.parse(localStorage.getItem('ab_test_failed_events') || '[]');
        failedEvents.push(event);
        localStorage.setItem('ab_test_failed_events', JSON.stringify(failedEvents));
      }
    },

    // Start metrics collection
    startMetricsCollection() {
      // Track page views
      this.trackEvent('general', 'page_view', { page: 'social_feed' });
      
      // Track tab clicks
      document.addEventListener('click', (e) => {
        const tab = e.target.closest('[data-tab]');
        if (tab && tab.dataset.tab === 'social') {
          const tabTest = this.activeTests.get('tabIndicators');
          if (tabTest) {
            this.trackEvent('tabIndicators', 'tab_clicked', { 
              variant: tabTest.variant,
              timeToClick: Date.now() - tabTest.assignedAt
            });
          }
        }
      });
      
      // Track engagement
      setInterval(() => {
        if (document.querySelector('[data-tab="social"].active')) {
          this.trackEvent('general', 'time_on_page', { duration: 30 });
        }
      }, 30000); // Every 30 seconds
      
      // Track message sending
      const originalSendMessage = window.SocialFeedPage ? window.SocialFeedPage.sendMessage : null;
      if (originalSendMessage) {
        window.SocialFeedPage.sendMessage = async function() {
          const result = await originalSendMessage.call(this);
          window.ABTestSocialFeed.trackEvent('general', 'message_sent', {});
          return result;
        };
      }
    },

    // Get test results
    getTestResults(testId) {
      const results = {};
      
      this.tests[testId].variants.forEach(variant => {
        const key = `${testId}_${variant}`;
        const metrics = this.metrics.get(key);
        
        if (metrics) {
          results[variant] = {
            events: metrics.events.length,
            aggregates: metrics.aggregates,
            conversionRate: this.calculateConversionRate(metrics),
            engagementScore: this.calculateEngagementScore(metrics)
          };
        }
      });
      
      return results;
    },

    // Calculate conversion rate
    calculateConversionRate(metrics) {
      const views = metrics.aggregates.variant_applied || 0;
      const conversions = metrics.aggregates.message_sent || metrics.aggregates.tab_clicked || 0;
      
      return views > 0 ? (conversions / views * 100).toFixed(2) : 0;
    },

    // Calculate engagement score
    calculateEngagementScore(metrics) {
      const weights = {
        tab_clicked: 1,
        message_sent: 3,
        prompt_action: 2,
        feature_unlocked: 2,
        time_on_page: 0.1
      };
      
      let score = 0;
      Object.entries(metrics.aggregates).forEach(([event, count]) => {
        score += (weights[event] || 0.5) * count;
      });
      
      return score.toFixed(2);
    },

    // Export test data
    exportTestData() {
      const data = {
        tests: Object.fromEntries(this.activeTests),
        metrics: Object.fromEntries(this.metrics),
        results: {}
      };
      
      Object.keys(this.tests).forEach(testId => {
        data.results[testId] = this.getTestResults(testId);
      });
      
      return data;
    },

    // Setup event listeners
    setupEventListeners() {
      // Listen for custom events
      window.addEventListener('social_feed_loaded', () => {
        this.trackEvent('general', 'feed_loaded', {});
      });
      
      window.addEventListener('game_viewed', () => {
        this.trackEvent('general', 'game_viewed', {});
      });
      
      // Export function for debugging
      window.getABTestResults = () => this.exportTestData();
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ABTestSocialFeed.initialize();
    });
  } else {
    window.ABTestSocialFeed.initialize();
  }

})();