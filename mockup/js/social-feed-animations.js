// Social Feed Animation Controller
(function() {
    'use strict';

    console.log('Social Feed Animation Controller Loading...');

    // Animation state
    const animationState = {
        isAnimating: false,
        currentTab: 'games',
        observerInstances: []
    };

    // Initialize animations
    function initializeSocialAnimations() {
        console.log('Initializing social feed animations...');

        // Setup tab system
        setupTabSystem();

        // Setup intersection observer for scroll animations
        setupScrollAnimations();

        // Setup skeleton screens
        setupSkeletonScreens();

        // Setup notification animations
        setupNotificationAnimations();

        // Prevent transitions on page load
        preventInitialTransitions();
    }

    // Setup tab system with animations
    function setupTabSystem() {
        // Create tab buttons if they don't exist
        createTabButtons();

        // Add click handlers
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', handleTabClick);
        });
    }

    // Create tab buttons
    function createTabButtons() {
        const searchSection = document.querySelector('.search-section');
        if (!searchSection) return;

        // Check if tabs already exist
        let tabContainer = document.querySelector('.tab-container');
        if (!tabContainer) {
            tabContainer = document.createElement('div');
            tabContainer.className = 'tab-container';
            tabContainer.innerHTML = `
                <button class="tab-button active" data-tab="games">
                    <span>🎮 Find Games</span>
                </button>
                <button class="tab-button" data-tab="social">
                    <span>💬 Social Feed</span>
                    <span class="notification-badge" style="display: none;">0</span>
                </button>
            `;
            
            // Insert after search section
            searchSection.parentNode.insertBefore(tabContainer, searchSection.nextSibling);
        }

        // Style the tab container
        const style = document.createElement('style');
        style.textContent = `
            .tab-container {
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin: 2rem 0;
                padding: 0 1rem;
            }
            
            .tab-button {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                position: relative;
            }
            
            .tab-button .notification-badge {
                position: static;
                margin-left: 0.5rem;
            }
        `;
        document.head.appendChild(style);
    }

    // Handle tab click with animations
    function handleTabClick(event) {
        if (animationState.isAnimating) return;

        const button = event.currentTarget;
        const targetTab = button.dataset.tab;

        if (targetTab === animationState.currentTab) return;

        animationState.isAnimating = true;

        // Update active states
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // Perform tab switch animation
        animateTabSwitch(animationState.currentTab, targetTab);

        animationState.currentTab = targetTab;
    }

    // Animate tab switch
    function animateTabSwitch(fromTab, toTab) {
        const gamesSection = document.querySelector('.games-section');
        const socialSection = document.querySelector('.social-section');

        if (toTab === 'social') {
            // Hide games section with fade out
            if (gamesSection) {
                gamesSection.style.transition = 'all 0.3s ease-out';
                gamesSection.style.opacity = '0';
                gamesSection.style.transform = 'translateY(-20px)';
            }

            setTimeout(() => {
                if (gamesSection) {
                    gamesSection.style.display = 'none';
                }

                // Show social section with reveal animation
                if (socialSection) {
                    socialSection.style.display = 'block';
                    socialSection.classList.add('revealed');
                    
                    // Trigger post animations
                    animatePosts();
                }

                animationState.isAnimating = false;
            }, 300);
        } else {
            // Hide social section with fade out
            if (socialSection) {
                socialSection.classList.remove('revealed');
            }

            setTimeout(() => {
                if (socialSection) {
                    socialSection.style.display = 'none';
                }

                // Show games section with fade in
                if (gamesSection) {
                    gamesSection.style.display = 'block';
                    gamesSection.style.transition = 'all 0.3s ease-out';
                    gamesSection.style.opacity = '1';
                    gamesSection.style.transform = 'translateY(0)';
                }

                animationState.isAnimating = false;
            }, 300);
        }
    }

    // Animate posts with stagger
    function animatePosts() {
        const posts = document.querySelectorAll('.social-post');
        posts.forEach((post, index) => {
            post.style.animationDelay = `${index * 0.1}s`;
            post.classList.add('animated');
        });
    }

    // Setup scroll-triggered animations
    function setupScrollAnimations() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, options);

        // Observe elements with fade-in-scroll class
        document.querySelectorAll('.fade-in-scroll').forEach(el => {
            observer.observe(el);
        });

        animationState.observerInstances.push(observer);
    }

    // Setup skeleton screens for loading states
    function setupSkeletonScreens() {
        window.showSocialSkeleton = function() {
            const container = document.querySelector('.social-feed-container');
            if (!container) return;

            const skeletonHTML = `
                <div class="skeleton-post">
                    <div class="skeleton-header">
                        <div class="skeleton skeleton-avatar"></div>
                        <div class="skeleton-author">
                            <div class="skeleton skeleton-name"></div>
                            <div class="skeleton skeleton-time"></div>
                        </div>
                    </div>
                    <div class="skeleton skeleton-content"></div>
                    <div class="skeleton-actions">
                        <div class="skeleton skeleton-button"></div>
                        <div class="skeleton skeleton-button"></div>
                        <div class="skeleton skeleton-button"></div>
                    </div>
                </div>
            `.repeat(3);

            container.innerHTML = skeletonHTML;
        };

        window.hideSocialSkeleton = function() {
            const skeletons = document.querySelectorAll('.skeleton-post');
            skeletons.forEach(skeleton => {
                skeleton.style.transition = 'opacity 0.3s ease-out';
                skeleton.style.opacity = '0';
                setTimeout(() => skeleton.remove(), 300);
            });
        };
    }

    // Setup notification badge animations
    function setupNotificationAnimations() {
        window.updateNotificationBadge = function(count) {
            const badge = document.querySelector('.tab-button[data-tab="social"] .notification-badge');
            if (!badge) return;

            if (count > 0) {
                badge.style.display = 'inline-block';
                badge.textContent = count > 99 ? '99+' : count;
                badge.classList.add('new');
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    badge.classList.remove('new');
                }, 500);
            } else {
                badge.style.display = 'none';
            }
        };

        // Simulate notification updates
        let notificationCount = 0;
        setInterval(() => {
            if (Math.random() > 0.8 && animationState.currentTab !== 'social') {
                notificationCount++;
                window.updateNotificationBadge(notificationCount);
            }
        }, 10000);

        // Clear notifications when social tab is opened
        document.addEventListener('click', (e) => {
            if (e.target.closest('.tab-button[data-tab="social"]')) {
                notificationCount = 0;
                setTimeout(() => {
                    window.updateNotificationBadge(0);
                }, 1000);
            }
        });
    }

    // Prevent transitions on page load
    function preventInitialTransitions() {
        document.body.classList.add('no-transition');
        
        setTimeout(() => {
            document.body.classList.remove('no-transition');
        }, 100);
    }

    // Enhanced animation utilities
    window.socialAnimations = {
        // Animate like button
        animateLike: function(button) {
            button.classList.add('liked');
            
            // Create particle effect
            createParticleEffect(button, '❤️');
        },

        // Animate new post
        animateNewPost: function(postElement) {
            postElement.classList.add('new-post-animation');
            
            // Scroll to post
            setTimeout(() => {
                postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        },

        // Show typing indicator
        showTypingIndicator: function(container) {
            const indicator = document.createElement('div');
            indicator.className = 'typing-indicator';
            indicator.innerHTML = `
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            `;
            container.appendChild(indicator);
            return indicator;
        },

        // Create success animation
        showSuccess: function(element, message) {
            const success = document.createElement('div');
            success.className = 'success-animation';
            success.textContent = message;
            success.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #4caf50;
                color: white;
                padding: 1rem 2rem;
                border-radius: 8px;
                z-index: 1000;
            `;
            element.appendChild(success);

            setTimeout(() => {
                success.style.transition = 'opacity 0.3s ease-out';
                success.style.opacity = '0';
                setTimeout(() => success.remove(), 300);
            }, 2000);
        },

        // Create error animation
        showError: function(element) {
            element.classList.add('error-shake');
            setTimeout(() => {
                element.classList.remove('error-shake');
            }, 500);
        }
    };

    // Create particle effect
    function createParticleEffect(element, emoji) {
        const particle = document.createElement('div');
        particle.textContent = emoji;
        particle.style.cssText = `
            position: absolute;
            font-size: 1.5rem;
            pointer-events: none;
            animation: particleFloat 1s ease-out forwards;
            z-index: 1000;
        `;

        // Add keyframe animation if not exists
        if (!document.querySelector('#particle-animation')) {
            const style = document.createElement('style');
            style.id = 'particle-animation';
            style.textContent = `
                @keyframes particleFloat {
                    0% {
                        opacity: 1;
                        transform: translateY(0) scale(0);
                    }
                    50% {
                        opacity: 1;
                        transform: translateY(-30px) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-50px) scale(0.5);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        const rect = element.getBoundingClientRect();
        particle.style.left = `${rect.left + rect.width / 2}px`;
        particle.style.top = `${rect.top + rect.height / 2}px`;
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1000);
    }

    // Performance optimization: Debounce scroll events
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSocialAnimations);
    } else {
        initializeSocialAnimations();
    }

    // Export for global access
    window.initializeSocialAnimations = initializeSocialAnimations;

})();