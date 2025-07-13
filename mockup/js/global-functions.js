// Global Functions for Finding Sports
// This file ensures all button onclick handlers work properly

(function() {
    'use strict';
    
    // Initialize global functions immediately
    console.log('Initializing global functions...');
    
    // Search Games function
    window.searchGames = function() {
        console.log('Search games triggered');
        
        // Get search value
        const searchInput = document.getElementById('searchInput');
        const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
        
        // Switch to drop-in games page
        const dropInSection = document.getElementById('drop-in');
        const allSections = document.querySelectorAll('.page-content');
        
        allSections.forEach(section => {
            section.style.display = 'none';
        });
        
        if (dropInSection) {
            dropInSection.style.display = 'block';
        }
        
        // Filter games if search value exists
        if (searchValue) {
            const gameCards = document.querySelectorAll('.game-card');
            gameCards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(searchValue) ? 'block' : 'none';
            });
        }
        
        // Update active tab
        updateActiveTab('drop-in');
    };
    
    // Play Now function
    window.playNow = function() {
        console.log('Play Now triggered');
        
        // Hide all sections
        const allSections = document.querySelectorAll('.page-content, .hero-section');
        allSections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Show play now section
        const playNowSection = document.getElementById('play-now');
        if (playNowSection) {
            playNowSection.style.display = 'block';
        }
        
        // Update active tab
        updateActiveTab('play-now');
        
        // Trigger location-based search
        if (window.findGamesNearMe) {
            window.findGamesNearMe();
        }
    };
    
    // Switch Tab function
    window.switchTab = function(tabName) {
        console.log('Switch tab:', tabName);
        
        // Hide all tab contents
        const allContents = document.querySelectorAll('.tab-content, .page-content');
        allContents.forEach(content => {
            content.style.display = 'none';
        });
        
        // Show selected tab
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.style.display = 'block';
        }
        
        // Update active tab button
        updateActiveTab(tabName);
    };
    
    // Show Rules Page
    window.showRulesPage = function() {
        console.log('Show rules page');
        
        // Hide everything
        const allElements = document.querySelectorAll('.page-content, .hero-section, .search-filters, .tabs-container');
        allElements.forEach(el => {
            if (el.id !== 'sport-rules') {
                el.style.display = 'none';
            }
        });
        
        // Create or show rules section
        let rulesSection = document.getElementById('sport-rules');
        if (!rulesSection) {
            rulesSection = createRulesSection();
            document.querySelector('.container').appendChild(rulesSection);
        }
        rulesSection.style.display = 'block';
        
        // Update active tab
        updateActiveTab('rules');
    };
    
    // Helper function to update active tab
    function updateActiveTab(tabName) {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.classList.remove('active');
            const tabText = tab.textContent.toLowerCase();
            if (tabText.includes(tabName) || 
                (tabName === 'rules' && tabText.includes('sport rules')) ||
                (tabName === 'play-now' && tabText.includes('play now')) ||
                (tabName === 'drop-in' && tabText.includes('drop-in'))) {
                tab.classList.add('active');
            }
        });
    }
    
    // Create rules section
    function createRulesSection() {
        const section = document.createElement('div');
        section.id = 'sport-rules';
        section.className = 'page-content';
        section.innerHTML = `
            <div class="rules-container" style="max-width: 900px; margin: 0 auto; padding: 2rem;">
                <h1 style="text-align: center; margin-bottom: 2rem;">Drop-in Sports Rules & Etiquette</h1>
                
                <div class="rules-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                    ${getSportRules()}
                </div>
                
                <div style="text-align: center; margin-top: 3rem;">
                    <button onclick="window.location.href='/'" style="padding: 0.75rem 2rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1.1rem;">
                        Back to Find Games
                    </button>
                </div>
            </div>
        `;
        return section;
    }
    
    // Get sport rules HTML
    function getSportRules() {
        const sports = [
            {
                emoji: '🏀',
                name: 'Basketball',
                rules: [
                    'Games typically 3v3 or 5v5',
                    'Play to 21 (win by 2) or timed games',
                    'Call your own fouls honestly',
                    'Winners stay on, losers rotate',
                    'Respect all skill levels'
                ]
            },
            {
                emoji: '⚽',
                name: 'Soccer',
                rules: [
                    'Small-sided games (5v5 to 7v7)',
                    'No slide tackles in drop-in',
                    'Rotate keepers every 10-15 min',
                    'Keep it friendly, no rough play',
                    'Bring pinnies/bibs if possible'
                ]
            },
            {
                emoji: '🏐',
                name: 'Volleyball',
                rules: [
                    'Recreational rules (3 hits)',
                    'Rotate after each game',
                    'Call the lines honestly',
                    'Net serves allowed',
                    'Mix skill levels on teams'
                ]
            },
            {
                emoji: '🏒',
                name: 'Ball/Street Hockey',
                rules: [
                    'No body contact',
                    'Slap shots only when clear',
                    'Proper footwear required',
                    'Goalies get right of way',
                    'Keep sticks below waist'
                ]
            },
            {
                emoji: '🏸',
                name: 'Badminton',
                rules: [
                    'Games to 21 points',
                    'Serve from correct court',
                    'Clear shuttle for others',
                    'Bring your own racquet',
                    'Share court time fairly'
                ]
            },
            {
                emoji: '⛸️',
                name: 'Ice Skating',
                rules: [
                    'Skate counter-clockwise',
                    'Faster skaters outside lane',
                    'No racing or weaving',
                    'Help others who fall',
                    'Follow rink safety rules'
                ]
            }
        ];
        
        return sports.map(sport => `
            <div class="sport-rule-card" style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                    <span style="font-size: 1.5rem;">${sport.emoji}</span>
                    ${sport.name}
                </h3>
                <ul style="list-style: none; padding: 0;">
                    ${sport.rules.map(rule => `<li style="padding: 0.25rem 0;">• ${rule}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    }
    
    // Also expose other commonly needed functions
    window.goBack = function() {
        window.location.href = '/';
    };
    
    window.goToLogin = function() {
        window.location.href = '/login.html';
    };
    
    window.goToSubmitGame = function() {
        window.location.href = '/submit-game.html';
    };
    
    console.log('Global functions initialized:', {
        searchGames: typeof window.searchGames,
        playNow: typeof window.playNow,
        switchTab: typeof window.switchTab,
        showRulesPage: typeof window.showRulesPage
    });
})();