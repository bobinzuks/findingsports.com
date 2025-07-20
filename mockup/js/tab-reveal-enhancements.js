// Tab Reveal UX Enhancements - Progressive Disclosure & Interaction Logic

(function() {
    'use strict';
    
    console.log('Tab Reveal Enhancements Loading...');
    
    // Tab state management
    const tabState = {
        activeTab: 'upcoming',
        notifications: {
            social: 0,
            upcoming: 0,
            rules: 0
        },
        lastVisited: {
            social: null,
            upcoming: null,
            rules: null
        },
        contentLoaded: {
            social: false,
            upcoming: true,
            rules: false
        }
    };
    
    // Enhanced tab switching with smooth transitions
    window.enhancedSwitchTab = function(tab) {
        console.log('Enhanced tab switch:', tab);
        
        // Prevent switching to already active tab
        if (tabState.activeTab === tab) return;
        
        // Find tab elements
        const tabs = document.querySelectorAll('.tab');
        const previousTab = tabState.activeTab;
        
        // Update tab visual states
        tabs.forEach(t => {
            t.classList.remove('active');
            
            // Match tab by content
            const tabText = t.textContent.toLowerCase();
            if (tabText.includes(tab.toLowerCase().replace('-', ' '))) {
                t.classList.add('active');
                
                // Clear notifications for this tab
                clearTabNotifications(tab);
                
                // Add ARIA attributes for accessibility
                t.setAttribute('aria-selected', 'true');
            } else {
                t.setAttribute('aria-selected', 'false');
            }
        });
        
        // Smooth content transition
        transitionContent(previousTab, tab);
        
        // Update state
        tabState.activeTab = tab;
        tabState.lastVisited[tab] = Date.now();
        
        // Save state to localStorage
        saveTabState();
        
        // Fire custom event for analytics
        window.dispatchEvent(new CustomEvent('tabChanged', {
            detail: { from: previousTab, to: tab }
        }));
    };
    
    // Smooth content transition with loading states
    function transitionContent(fromTab, toTab) {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;
        
        // Get content sections
        const sections = {
            social: document.getElementById('socialSection'),
            upcoming: document.querySelector('.games-section'),
            map: document.querySelector('.map-section')
        };
        
        // Add transition wrapper if not exists
        ensureTransitionWrapper(mainContent);
        
        // Fade out current content
        fadeOutContent(fromTab, sections);
        
        // Show loading state for new content
        if (!tabState.contentLoaded[toTab]) {
            showLoadingSkeleton(toTab);
        }
        
        // Fade in new content after delay
        setTimeout(() => {
            fadeInContent(toTab, sections);
        }, 200);
    }
    
    // Ensure transition wrapper exists
    function ensureTransitionWrapper(container) {
        if (!container.querySelector('.tab-content-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'tab-content-wrapper';
            
            // Move existing content into wrapper
            while (container.firstChild) {
                wrapper.appendChild(container.firstChild);
            }
            
            container.appendChild(wrapper);
        }
    }
    
    // Fade out content
    function fadeOutContent(tab, sections) {
        switch(tab) {
            case 'social':
                if (sections.social) {
                    sections.social.classList.remove('reveal');
                    sections.social.style.display = 'none';
                }
                break;
            case 'upcoming':
                if (sections.upcoming) sections.upcoming.style.opacity = '0';
                if (sections.map) sections.map.style.opacity = '0';
                setTimeout(() => {
                    if (sections.upcoming) sections.upcoming.style.display = 'none';
                    if (sections.map) sections.map.style.display = 'none';
                }, 200);
                break;
        }
    }
    
    // Fade in content
    function fadeInContent(tab, sections) {
        switch(tab) {
            case 'social':
                if (sections.social) {
                    sections.social.style.display = 'block';
                    // Force reflow
                    sections.social.offsetHeight;
                    sections.social.classList.add('reveal');
                    
                    // Initialize social feed if needed
                    if (!tabState.contentLoaded.social) {
                        initializeSocialFeed();
                    }
                }
                if (sections.upcoming) sections.upcoming.style.display = 'none';
                if (sections.map) sections.map.style.display = 'none';
                break;
                
            case 'upcoming':
                if (sections.social) {
                    sections.social.classList.remove('reveal');
                    sections.social.style.display = 'none';
                }
                if (sections.upcoming) {
                    sections.upcoming.style.display = 'block';
                    setTimeout(() => {
                        sections.upcoming.style.opacity = '1';
                    }, 50);
                }
                if (sections.map) {
                    sections.map.style.display = 'block';
                    setTimeout(() => {
                        sections.map.style.opacity = '1';
                    }, 50);
                }
                break;
        }
    }
    
    // Show loading skeleton
    function showLoadingSkeleton(tab) {
        if (tab !== 'social') return;
        
        const socialSection = document.getElementById('socialSection');
        if (!socialSection) return;
        
        const skeleton = createSocialFeedSkeleton();
        socialSection.innerHTML = '';
        socialSection.appendChild(skeleton);
    }
    
    // Create social feed skeleton
    function createSocialFeedSkeleton() {
        const skeleton = document.createElement('div');
        skeleton.className = 'social-feed-skeleton';
        
        // Create 3 skeleton posts
        for (let i = 0; i < 3; i++) {
            const post = document.createElement('div');
            post.className = 'skeleton-post';
            
            post.innerHTML = `
                <div class="skeleton-header">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-text">
                        <div class="skeleton-line short"></div>
                        <div class="skeleton-line short"></div>
                    </div>
                </div>
                <div class="skeleton-line long"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line long"></div>
            `;
            
            skeleton.appendChild(post);
        }
        
        return skeleton;
    }
    
    // Initialize social feed with proper loading
    function initializeSocialFeed() {
        console.log('Initializing social feed with enhancements...');
        
        // Simulate loading delay
        setTimeout(() => {
            // Call existing social feed initialization
            if (window.initSecureSocialFeed) {
                window.initSecureSocialFeed();
            } else if (window.initSocialFeed) {
                window.initSocialFeed();
            }
            
            tabState.contentLoaded.social = true;
            
            // Check for new posts periodically
            startSocialFeedMonitoring();
        }, 800);
    }
    
    // Monitor social feed for new content
    function startSocialFeedMonitoring() {
        // Check for new posts every 30 seconds
        setInterval(() => {
            if (tabState.activeTab !== 'social') {
                // Simulate new posts arriving
                const hasNewPosts = Math.random() > 0.7;
                if (hasNewPosts) {
                    addTabNotification('social', Math.floor(Math.random() * 3) + 1);
                }
            }
        }, 30000);
    }
    
    // Add notification to tab
    function addTabNotification(tabName, count) {
        tabState.notifications[tabName] += count;
        updateTabBadge(tabName);
        
        // Set new content indicator
        const tab = findTabElement(tabName);
        if (tab) {
            tab.setAttribute('data-new-content', 'true');
        }
    }
    
    // Clear notifications for a tab
    function clearTabNotifications(tabName) {
        tabState.notifications[tabName] = 0;
        updateTabBadge(tabName);
        
        // Remove new content indicator
        const tab = findTabElement(tabName);
        if (tab) {
            tab.removeAttribute('data-new-content');
        }
    }
    
    // Update tab badge
    function updateTabBadge(tabName) {
        const tab = findTabElement(tabName);
        if (!tab) return;
        
        const count = tabState.notifications[tabName];
        let badge = tab.querySelector('.tab-badge');
        
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'tab-badge';
                tab.appendChild(badge);
            }
            badge.textContent = count > 99 ? '99+' : count;
        } else if (badge) {
            badge.remove();
        }
    }
    
    // Find tab element by name
    function findTabElement(tabName) {
        const tabs = document.querySelectorAll('.tab');
        for (const tab of tabs) {
            if (tab.textContent.toLowerCase().includes(tabName.toLowerCase())) {
                return tab;
            }
        }
        return null;
    }
    
    // Save tab state to localStorage
    function saveTabState() {
        try {
            localStorage.setItem('tabState', JSON.stringify(tabState));
        } catch (e) {
            console.error('Failed to save tab state:', e);
        }
    }
    
    // Load tab state from localStorage
    function loadTabState() {
        try {
            const saved = localStorage.getItem('tabState');
            if (saved) {
                Object.assign(tabState, JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load tab state:', e);
        }
    }
    
    // Initialize enhancements
    function initializeTabEnhancements() {
        console.log('Initializing tab enhancements...');
        
        // Load saved state
        loadTabState();
        
        // Override existing switchTab function
        if (window.switchTab) {
            window.originalSwitchTab = window.switchTab;
            window.switchTab = window.enhancedSwitchTab;
        }
        
        // Add ARIA attributes to tabs
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach((tab, index) => {
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', tab.classList.contains('active') ? 'true' : 'false');
            tab.setAttribute('tabindex', '0');
            tab.setAttribute('id', `tab-${index}`);
            
            // Add keyboard navigation
            tab.addEventListener('keydown', handleTabKeyboard);
        });
        
        // Restore notification badges
        Object.keys(tabState.notifications).forEach(tabName => {
            if (tabState.notifications[tabName] > 0) {
                updateTabBadge(tabName);
            }
        });
        
        // Add smooth transitions to content sections
        addContentTransitions();
    }
    
    // Handle keyboard navigation for tabs
    function handleTabKeyboard(e) {
        const tabs = Array.from(document.querySelectorAll('.tab'));
        const currentIndex = tabs.indexOf(e.target);
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                tabs[prevIndex].focus();
                tabs[prevIndex].click();
                break;
                
            case 'ArrowRight':
                e.preventDefault();
                const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                tabs[nextIndex].focus();
                tabs[nextIndex].click();
                break;
                
            case 'Home':
                e.preventDefault();
                tabs[0].focus();
                tabs[0].click();
                break;
                
            case 'End':
                e.preventDefault();
                tabs[tabs.length - 1].focus();
                tabs[tabs.length - 1].click();
                break;
        }
    }
    
    // Add smooth transitions to content sections
    function addContentTransitions() {
        const style = document.createElement('style');
        style.textContent = `
            .games-section, .map-section {
                transition: opacity 0.3s ease-in-out;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTabEnhancements);
    } else {
        initializeTabEnhancements();
    }
    
    // Export for debugging
    window.tabState = tabState;
    window.addTabNotification = addTabNotification;
    
})();