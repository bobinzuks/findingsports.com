// Debug utilities for Finding Sports
window.DebugUtils = {
    // Check scraping status
    async checkScrapingStatus() {
        try {
            const response = await fetch('/api/debug/scraping-status');
            const data = await response.json();

            console.log('🔍 Scraping Status:');
            console.log('Total Games:', data.dataAggregation.totalGames);
            console.log('Total Facilities:', data.dataAggregation.totalFacilities);
            console.log('Sport Breakdown:', data.dataAggregation.sportBreakdown);
            console.log('Sources:', data.dataAggregation.sources);
            console.log('WebSocket Stats:', data.webSocket);
            console.log('Swarm Status:', data.swarmStatus);

            return data;
        } catch (error) {
            console.error('Failed to check scraping status:', error);
        }
    },

    // Manually trigger scraping
    async triggerScraping() {
        try {
            console.log('🚀 Triggering manual scraping...');
            const response = await fetch('/api/debug/trigger-scraping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();

            console.log('✅ Scraping triggered:', data.message);

            // Check status after 5 seconds
            setTimeout(() => {
                console.log('📊 Checking status after scraping...');
                this.checkScrapingStatus();
            }, 5000);

            return data;
        } catch (error) {
            console.error('Failed to trigger scraping:', error);
        }
    },

    // Auto-fix game finding issues
    async autoFixGames() {
        console.log('🔧 Auto-fixing game finding issues...');

        // Step 1: Check current status
        const status = await this.checkScrapingStatus();

        if (status && status.dataAggregation.totalGames === 0) {
            console.log('⚠️ No games found, triggering scraping...');
            await this.triggerScraping();

            // Wait for scraping to complete
            console.log('⏳ Waiting for scraping to complete...');
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Check again
            const newStatus = await this.checkScrapingStatus();
            if (newStatus.dataAggregation.totalGames > 0) {
                console.log('✅ Games found after scraping!');
                // Refresh the page to show new games
                window.location.reload();
            } else {
                console.log('❌ Still no games found. Checking for errors...');
                // Add fallback demo games
                await this.addDemoGames();
            }
        } else {
            console.log('✅ Games already available:', status.dataAggregation.totalGames);
        }
    },

    // Add demo games as fallback
    async addDemoGames() {
        console.log('📝 Adding demo games as fallback...');

        // This would normally be done on the backend
        // For now, we'll just log the issue
        console.warn('Demo games should be added on the backend. Contact support if games are not loading.');

        // Show notification to user
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b35;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            cursor: pointer;
        `;
        notification.innerHTML = `
            <strong>Games Loading Issue</strong><br>
            <span style="font-size: 14px;">Click to manually refresh data</span>
        `;
        notification.onclick = () => {
            notification.remove();
            this.triggerScraping();
        };
        document.body.appendChild(notification);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 10000);
    },

    // Initialize debug panel
    initDebugPanel() {
        // Only show in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const debugBtn = document.createElement('button');
            debugBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #333;
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                border: none;
                cursor: pointer;
                font-size: 12px;
                z-index: 9999;
                opacity: 0.7;
                transition: opacity 0.3s;
            `;
            debugBtn.textContent = '🔧 Debug';
            debugBtn.onmouseover = () => debugBtn.style.opacity = '1';
            debugBtn.onmouseout = () => debugBtn.style.opacity = '0.7';
            debugBtn.onclick = () => this.showDebugMenu();

            document.body.appendChild(debugBtn);
        }
    },

    // Show debug menu
    showDebugMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: fixed;
            bottom: 70px;
            right: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            padding: 20px;
            z-index: 10000;
            min-width: 250px;
        `;
        menu.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #333;">Debug Menu</h3>
            <button onclick="window.DebugUtils.checkScrapingStatus()" style="display: block; width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; background: #f8f8f8; border-radius: 6px; cursor: pointer;">
                📊 Check Scraping Status
            </button>
            <button onclick="window.DebugUtils.triggerScraping()" style="display: block; width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; background: #f8f8f8; border-radius: 6px; cursor: pointer;">
                🚀 Trigger Scraping
            </button>
            <button onclick="window.DebugUtils.autoFixGames()" style="display: block; width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; background: #f8f8f8; border-radius: 6px; cursor: pointer;">
                🔧 Auto-Fix Games
            </button>
            <button onclick="this.parentElement.remove()" style="display: block; width: 100%; padding: 10px; border: 1px solid #ddd; background: #f8f8f8; border-radius: 6px; cursor: pointer;">
                ❌ Close
            </button>
        `;

        // Remove any existing menu
        const existing = document.querySelector('.debug-menu');
        if (existing) { existing.remove(); }

        menu.className = 'debug-menu';
        document.body.appendChild(menu);

        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && !e.target.textContent.includes('Debug')) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }
};

// Auto-initialize debug panel when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.DebugUtils.initDebugPanel();

        // Auto-check for games on load
        setTimeout(() => {
            window.DebugUtils.checkScrapingStatus().then(status => {
                if (status && status.dataAggregation.totalGames === 0) {
                    console.warn('⚠️ No games found on load. Run DebugUtils.autoFixGames() to fix.');
                }
            });
        }, 2000);
    });
} else {
    window.DebugUtils.initDebugPanel();
}
