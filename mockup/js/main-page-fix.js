// Main Page Button Fix
// Ensures Search and Play Now buttons work on the homepage

(function() {
    'use strict';
    
    console.log('Main page fix loading...');
    
    // Override searchGames to work without select elements
    window.searchGames = function() {
        console.log('Search games clicked - switching to drop-in games view');
        
        // Hide hero section and show games section
        const heroSection = document.querySelector('.hero-section');
        const searchFilters = document.querySelector('.search-filters');
        const tabsContainer = document.querySelector('.tabs-container');
        
        if (heroSection) heroSection.style.display = 'none';
        if (searchFilters) searchFilters.style.display = 'none';
        
        // Show the drop-in games section
        const allSections = document.querySelectorAll('.page-content');
        allSections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Try to show drop-in games
        let dropInSection = document.getElementById('drop-in');
        if (!dropInSection) {
            // Create a temporary games display
            dropInSection = createGamesSection();
            document.querySelector('.container').appendChild(dropInSection);
        }
        dropInSection.style.display = 'block';
        
        // Show tabs if hidden
        if (tabsContainer) {
            tabsContainer.style.display = 'block';
        }
        
        // Load games from API
        loadGamesForSearch();
        
        // Update active tab
        updateActiveTab('drop-in');
    };
    
    // Override playNow to work immediately
    window.playNow = function() {
        console.log('Play Now clicked - finding games near you');
        
        // Hide hero section
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) heroSection.style.display = 'none';
        
        // Show loading state
        showLoadingState();
        
        // Get user location and find games
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('Got location:', position.coords);
                    findNearbyGames(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.log('Location error:', error);
                    // Fall back to default location (Vancouver)
                    findNearbyGames(49.2827, -123.1207);
                }
            );
        } else {
            // No geolocation, use Vancouver
            findNearbyGames(49.2827, -123.1207);
        }
    };
    
    // Helper function to load games for search
    function loadGamesForSearch() {
        console.log('Loading games for search...');
        
        // Get search input value if it exists
        const searchInput = document.getElementById('searchInput');
        const searchQuery = searchInput ? searchInput.value : '';
        
        // Call the API
        fetch('/api/games')
            .then(response => response.json())
            .then(data => {
                console.log('Games loaded:', data);
                displayGamesInSection(data.games || []);
            })
            .catch(error => {
                console.error('Error loading games:', error);
                // Show demo games as fallback
                displayDemoGames();
            });
    }
    
    // Helper function to find nearby games
    function findNearbyGames(lat, lng) {
        console.log('Finding games near:', lat, lng);
        
        // Hide all sections
        const allSections = document.querySelectorAll('.page-content');
        allSections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Show play now section
        let playNowSection = document.getElementById('play-now');
        if (!playNowSection) {
            playNowSection = createPlayNowSection();
            document.querySelector('.container').appendChild(playNowSection);
        }
        playNowSection.style.display = 'block';
        
        // Call Play Now API with location
        fetch(`/api/play-now?lat=${lat}&lng=${lng}&radius=10`)
            .then(response => response.json())
            .then(data => {
                console.log('Play Now data:', data);
                hideLoadingState();
                displayPlayNowResults(data.activities || {});
            })
            .catch(error => {
                console.error('Error loading play now data:', error);
                hideLoadingState();
                displayPlayNowError();
            });
        
        // Update active tab
        updateActiveTab('play-now');
    }
    
    // Create games section if it doesn't exist
    function createGamesSection() {
        const section = document.createElement('div');
        section.id = 'drop-in';
        section.className = 'page-content';
        section.style.display = 'none';
        section.innerHTML = `
            <div class="games-header" style="margin-bottom: 2rem;">
                <h2>Drop-in Games Near You</h2>
                <div class="filter-bar" style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <select id="tempLocationSelect" style="padding: 0.5rem; border-radius: 8px; border: 1px solid #ddd;">
                        <option value="vancouver">Vancouver</option>
                        <option value="surrey">Surrey</option>
                        <option value="burnaby">Burnaby</option>
                        <option value="richmond">Richmond</option>
                    </select>
                    <select id="tempSportSelect" style="padding: 0.5rem; border-radius: 8px; border: 1px solid #ddd;">
                        <option value="any">All Sports</option>
                        <option value="basketball">Basketball</option>
                        <option value="soccer">Soccer</option>
                        <option value="volleyball">Volleyball</option>
                        <option value="hockey">Hockey</option>
                    </select>
                </div>
            </div>
            <div id="tempGamesList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                <div style="text-align: center; grid-column: 1/-1; padding: 2rem;">
                    <p>Loading games...</p>
                </div>
            </div>
        `;
        return section;
    }
    
    // Create play now section if it doesn't exist
    function createPlayNowSection() {
        const section = document.createElement('div');
        section.id = 'play-now';
        section.className = 'page-content';
        section.style.display = 'none';
        section.innerHTML = `
            <div class="play-now-header" style="margin-bottom: 2rem;">
                <h2>Games Happening Now</h2>
                <p>Finding games near your location...</p>
            </div>
            <div id="playNowResults">
                <div class="loading" style="text-align: center; padding: 3rem;">
                    <div class="spinner"></div>
                    <p>Searching for nearby games...</p>
                </div>
            </div>
        `;
        return section;
    }
    
    // Display games in the section
    function displayGamesInSection(games) {
        const gamesList = document.getElementById('tempGamesList') || document.getElementById('gamesList');
        if (!gamesList) return;
        
        gamesList.innerHTML = '';
        
        if (games.length === 0) {
            gamesList.innerHTML = `
                <div style="text-align: center; grid-column: 1/-1; padding: 3rem;">
                    <h3>No games found</h3>
                    <p>Try searching in a different location or sport</p>
                    <button onclick="window.location.href='/submit-game.html'" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Create a Game
                    </button>
                </div>
            `;
            return;
        }
        
        games.forEach(game => {
            const gameCard = createGameCard(game);
            gamesList.appendChild(gameCard);
        });
    }
    
    // Create a game card
    function createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.cssText = 'background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); cursor: pointer;';
        
        const sportEmoji = getSportEmoji(game.sport || game.type);
        const time = game.time || 'Time TBD';
        const venue = game.venue || game.location || 'Location TBD';
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <h3 style="margin: 0; font-size: 1.2rem;">${game.title || `${game.sport || game.type} Game`}</h3>
                <span style="font-size: 2rem;">${sportEmoji}</span>
            </div>
            <p style="color: #666; margin: 0.5rem 0;">📍 ${venue}</p>
            <p style="color: #666; margin: 0.5rem 0;">🕐 ${time}</p>
            <p style="color: #666; margin: 0.5rem 0;">👥 ${game.players || game.attendees || 0} players</p>
            <button style="width: 100%; margin-top: 1rem; padding: 0.75rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                View Details
            </button>
        `;
        
        card.onclick = () => {
            if (window.showGameDetails) {
                window.showGameDetails(game);
            } else {
                alert('Game details coming soon!');
            }
        };
        
        return card;
    }
    
    // Display Play Now results
    function displayPlayNowResults(activities) {
        const resultsDiv = document.getElementById('playNowResults');
        if (!resultsDiv) return;
        
        const { happeningNow = [], startingSoon = [], laterToday = [], openCourts = [] } = activities;
        const totalActivities = happeningNow.length + startingSoon.length + laterToday.length + openCourts.length;
        
        if (totalActivities === 0) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <h3>No games found near you</h3>
                    <p>Try expanding your search radius or check back later</p>
                    <button onclick="window.searchGames()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Browse All Games
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '<div style="display: grid; gap: 2rem;">';
        
        if (happeningNow.length > 0) {
            html += '<div><h3>🔴 Happening Now</h3><div style="display: grid; gap: 1rem;">';
            happeningNow.forEach(activity => {
                html += createActivityCard(activity, 'now');
            });
            html += '</div></div>';
        }
        
        if (startingSoon.length > 0) {
            html += '<div><h3>🟡 Starting Soon</h3><div style="display: grid; gap: 1rem;">';
            startingSoon.forEach(activity => {
                html += createActivityCard(activity, 'soon');
            });
            html += '</div></div>';
        }
        
        if (laterToday.length > 0) {
            html += '<div><h3>🟢 Later Today</h3><div style="display: grid; gap: 1rem;">';
            laterToday.forEach(activity => {
                html += createActivityCard(activity, 'later');
            });
            html += '</div></div>';
        }
        
        if (openCourts.length > 0) {
            html += '<div><h3>🏟️ Open Courts/Fields</h3><div style="display: grid; gap: 1rem;">';
            openCourts.forEach(court => {
                html += createCourtCard(court);
            });
            html += '</div></div>';
        }
        
        html += '</div>';
        resultsDiv.innerHTML = html;
    }
    
    // Create activity card
    function createActivityCard(activity, urgency) {
        const urgencyColors = {
            now: '#ff4444',
            soon: '#ff9944',
            later: '#44aa44'
        };
        
        return `
            <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 4px solid ${urgencyColors[urgency]};">
                <h4 style="margin: 0 0 0.5rem 0;">${activity.sport} at ${activity.venue}</h4>
                <p style="color: #666; margin: 0.25rem 0;">🕐 ${activity.time}</p>
                <p style="color: #666; margin: 0.25rem 0;">📍 ${activity.distance || 'Nearby'}</p>
                <p style="color: #666; margin: 0.25rem 0;">👥 ${activity.players || 0} players</p>
                <button onclick="alert('Joining game...')" style="margin-top: 0.75rem; padding: 0.5rem 1rem; background: ${urgencyColors[urgency]}; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    Join Now
                </button>
            </div>
        `;
    }
    
    // Create court card
    function createCourtCard(court) {
        return `
            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 12px; border: 1px solid #dee2e6;">
                <h4 style="margin: 0 0 0.5rem 0;">🏟️ ${court.name}</h4>
                <p style="color: #666; margin: 0.25rem 0;">📍 ${court.address}</p>
                <p style="color: #666; margin: 0.25rem 0;">⏰ ${court.hours}</p>
                <p style="color: #666; margin: 0.25rem 0;">🎯 Good for: ${court.sports.join(', ')}</p>
            </div>
        `;
    }
    
    // Get sport emoji
    function getSportEmoji(sport) {
        const emojis = {
            basketball: '🏀',
            soccer: '⚽',
            volleyball: '🏐',
            hockey: '🏒',
            tennis: '🎾',
            badminton: '🏸',
            skating: '⛸️',
            various: '🎯'
        };
        return emojis[sport?.toLowerCase()] || '🏃';
    }
    
    // Show loading state
    function showLoadingState() {
        // Hide all content
        const allSections = document.querySelectorAll('.page-content, .hero-section');
        allSections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Show loading div
        let loadingDiv = document.getElementById('globalLoading');
        if (!loadingDiv) {
            loadingDiv = document.createElement('div');
            loadingDiv.id = 'globalLoading';
            loadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 1000;';
            loadingDiv.innerHTML = `
                <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <div class="spinner" style="width: 50px; height: 50px; border: 3px solid #f3f3f3; border-top: 3px solid #ff6b35; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                    <p>Finding games near you...</p>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(loadingDiv);
        }
        loadingDiv.style.display = 'block';
    }
    
    // Hide loading state
    function hideLoadingState() {
        const loadingDiv = document.getElementById('globalLoading');
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    }
    
    // Display demo games
    function displayDemoGames() {
        const demoGames = [
            {
                id: 1,
                title: 'Basketball at Sunset Community Centre',
                sport: 'basketball',
                venue: 'Sunset Community Centre',
                time: 'Today 7:00 PM',
                players: 8,
                location: { lat: 49.2184, lng: -123.1036 }
            },
            {
                id: 2,
                title: 'Soccer at Killarney Park',
                sport: 'soccer',
                venue: 'Killarney Park',
                time: 'Today 6:30 PM',
                players: 12,
                location: { lat: 49.2265, lng: -123.0423 }
            },
            {
                id: 3,
                title: 'Volleyball at Kits Beach',
                sport: 'volleyball',
                venue: 'Kitsilano Beach',
                time: 'Today 5:00 PM',
                players: 6,
                location: { lat: 49.2744, lng: -123.1555 }
            }
        ];
        
        displayGamesInSection(demoGames);
    }
    
    // Display error for play now
    function displayPlayNowError() {
        const resultsDiv = document.getElementById('playNowResults');
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <h3>Unable to load games</h3>
                    <p>Please check your connection and try again</p>
                    <button onclick="window.playNow()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
    
    // Update active tab helper
    function updateActiveTab(tabName) {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.classList.remove('active');
            const tabText = tab.textContent.toLowerCase();
            if ((tabName === 'play-now' && tabText.includes('play now')) ||
                (tabName === 'drop-in' && tabText.includes('drop-in')) ||
                (tabName === 'rules' && tabText.includes('rules'))) {
                tab.classList.add('active');
            }
        });
    }
    
    console.log('Main page fix loaded - Search and Play Now buttons ready');
})();