// Social Feed Debug - Helps diagnose and fix social feed issues
(function() {
    'use strict';
    
    console.log('🔍 Social Feed Debug Tool Loading...');
    
    // Debug function to check social feed status
    window.debugSocialFeed = function() {
        console.log('=== SOCIAL FEED DEBUGGING ===');
        
        // Check if social section exists
        const socialSection = document.getElementById('socialSection');
        console.log('Social section found:', !!socialSection);
        console.log('Social section display:', socialSection ? socialSection.style.display : 'N/A');
        
        // Check if container exists
        const container = document.getElementById('social-feed-container');
        console.log('Feed container found:', !!container);
        console.log('Container content length:', container ? container.innerHTML.length : 0);
        
        // Check if init function exists
        console.log('initSocialFeed function exists:', typeof window.initSocialFeed);
        
        // Check active tab
        const activeTab = document.querySelector('.tab.active');
        console.log('Active tab:', activeTab ? activeTab.textContent : 'None');
        
        // Check for CSS errors
        const stylesheets = document.styleSheets;
        console.log('Number of stylesheets:', stylesheets.length);
        
        return {
            socialSection: !!socialSection,
            container: !!container,
            initFunction: typeof window.initSocialFeed === 'function',
            activeTab: activeTab ? activeTab.textContent : null
        };
    };
    
    // Auto-debug on load
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            console.log('Auto-debugging social feed...');
            window.debugSocialFeed();
        }, 2000);
    });
    
    // Monitor tab clicks
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('tab') && e.target.textContent.includes('Social')) {
            console.log('🎯 Social tab clicked, monitoring...');
            setTimeout(() => {
                window.debugSocialFeed();
            }, 500);
        }
    });
    
    console.log('✅ Social Feed Debug Tool Ready');
})();