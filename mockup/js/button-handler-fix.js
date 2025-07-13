// Unified Button Handler Fix for Finding Sports
// This replaces all other button fixes with a single, working solution

(function() {
    'use strict';
    
    console.log('[Button Handler] Initializing unified button handlers...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeButtonHandlers);
    } else {
        // DOM already loaded
        initializeButtonHandlers();
    }
    
    function initializeButtonHandlers() {
        console.log('[Button Handler] DOM ready, setting up handlers...');
        
        // Define all button handlers in global scope
        
        // SEARCH BUTTON HANDLER
        window.searchGames = function() {
            console.log('[Button Handler] Search button clicked');
            
            try {
                // Get current values from dropdowns if they exist
                const locationSelect = document.getElementById('locationSelect');
                const sportSelect = document.getElementById('sportSelect');
                const searchInput = document.getElementById('searchInput');
                
                const location = locationSelect ? locationSelect.value : 'vancouver';
                const sport = sportSelect ? sportSelect.value : 'any';
                const searchTerm = searchInput ? searchInput.value : '';
                
                console.log('[Button Handler] Search params:', { location, sport, searchTerm });
                
                // Hide hero section
                const heroSection = document.querySelector('.hero-section');
                if (heroSection) {
                    heroSection.style.display = 'none';
                }
                
                // Show loading state
                showSearchLoading();
                
                // Make API call
                const params = new URLSearchParams();
                if (location && location !== 'any') params.append('location', location);
                if (sport && sport !== 'any') params.append('sport', sport);
                if (searchTerm) params.append('search', searchTerm);
                
                fetch(`/api/games?${params.toString()}`)
                    .then(response => response.json())
                    .then(data => {
                        console.log('[Button Handler] Games data received:', data);
                        hideSearchLoading();
                        displaySearchResults(data.games || []);
                    })
                    .catch(error => {
                        console.error('[Button Handler] Search error:', error);
                        hideSearchLoading();
                        showSearchError();
                    });
                    
            } catch (error) {
                console.error('[Button Handler] Search button error:', error);
                alert('Error searching for games. Please try again.');
            }
        };
        
        // PLAY NOW BUTTON HANDLER
        window.playNow = function() {
            console.log('[Button Handler] Play Now button clicked');
            
            try {
                // Hide hero section
                const heroSection = document.querySelector('.hero-section');
                if (heroSection) {
                    heroSection.style.display = 'none';
                }
                
                // Show loading overlay
                showPlayNowLoading();
                
                // Check if geolocation is available
                if ('geolocation' in navigator) {
                    console.log('[Button Handler] Requesting user location...');
                    
                    navigator.geolocation.getCurrentPosition(
                        // Success callback
                        function(position) {
                            console.log('[Button Handler] Got location:', position.coords);
                            findGamesNearLocation(position.coords.latitude, position.coords.longitude);
                        },
                        // Error callback
                        function(error) {
                            console.log('[Button Handler] Location error:', error);
                            hidePlayNowLoading();
                            
                            // Ask user if they want to use default location
                            if (confirm('Unable to get your location. Would you like to search in Vancouver instead?')) {
                                findGamesNearLocation(49.2827, -123.1207); // Vancouver coordinates
                            }
                        },
                        // Options
                        {
                            enableHighAccuracy: false,
                            timeout: 10000,
                            maximumAge: 300000 // 5 minutes
                        }
                    );
                } else {
                    console.log('[Button Handler] Geolocation not supported');
                    hidePlayNowLoading();
                    
                    if (confirm('Location services not available. Would you like to search in Vancouver instead?')) {
                        findGamesNearLocation(49.2827, -123.1207);
                    }
                }
                
            } catch (error) {
                console.error('[Button Handler] Play Now button error:', error);
                hidePlayNowLoading();
                alert('Error finding games near you. Please try again.');
            }
        };
        
        // SWITCH TAB HANDLER
        window.switchTab = function(tabName) {
            console.log('[Button Handler] Switch tab:', tabName);
            
            try {
                // Hide all tab contents
                const allContents = document.querySelectorAll('.tab-content');
                allContents.forEach(content => {
                    content.style.display = 'none';
                });
                
                // Show selected tab
                const selectedTab = document.getElementById(tabName);
                if (selectedTab) {
                    selectedTab.style.display = 'block';
                }
                
                // Update active tab styling
                const tabs = document.querySelectorAll('.tab');
                tabs.forEach(tab => {
                    tab.classList.remove('active');
                    if (tab.textContent.toLowerCase().includes(tabName.toLowerCase())) {
                        tab.classList.add('active');
                    }
                });
                
            } catch (error) {
                console.error('[Button Handler] Switch tab error:', error);
            }
        };
        
        // SHOW RULES PAGE HANDLER
        window.showRulesPage = function() {
            console.log('[Button Handler] Show rules page');
            
            try {
                // Use existing switchPage function if available
                if (window.switchPage) {
                    window.switchPage('rules');
                } else {
                    // Direct navigation as fallback
                    window.location.href = '/sport-rules.html';
                }
            } catch (error) {
                console.error('[Button Handler] Show rules error:', error);
                window.location.href = '/sport-rules.html';
            }
        };
        
        // Helper function to find games near location
        function findGamesNearLocation(lat, lng) {
            console.log('[Button Handler] Finding games near:', lat, lng);
            
            fetch(`/api/play-now?lat=${lat}&lng=${lng}&radius=10`)
                .then(response => response.json())
                .then(data => {
                    console.log('[Button Handler] Play Now data received:', data);
                    hidePlayNowLoading();
                    displayPlayNowResults(data);
                })
                .catch(error => {
                    console.error('[Button Handler] Play Now API error:', error);
                    hidePlayNowLoading();
                    showPlayNowError();
                });
        }
        
        // Show search loading state
        function showSearchLoading() {
            hideAllSections();
            
            const container = document.querySelector('.container') || document.body;
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'searchLoading';
            loadingDiv.innerHTML = `
                <div style="text-align: center; padding: 4rem;">
                    <div class="spinner" style="margin: 0 auto 2rem;"></div>
                    <h2>Searching for games...</h2>
                    <p>Finding the best drop-in sports games for you</p>
                </div>
            `;
            container.appendChild(loadingDiv);
        }
        
        // Hide search loading state
        function hideSearchLoading() {
            const loadingDiv = document.getElementById('searchLoading');
            if (loadingDiv) {
                loadingDiv.remove();
            }
        }
        
        // Show Play Now loading overlay
        function showPlayNowLoading() {
            const overlay = document.createElement('div');
            overlay.id = 'playNowLoading';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            `;
            overlay.innerHTML = `
                <div style="background: white; padding: 3rem; border-radius: 12px; text-align: center;">
                    <div class="spinner" style="margin: 0 auto 2rem;"></div>
                    <h2>Finding games near you...</h2>
                    <p>Please allow location access when prompted</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        
        // Hide Play Now loading overlay
        function hidePlayNowLoading() {
            const overlay = document.getElementById('playNowLoading');
            if (overlay) {
                overlay.remove();
            }
        }
        
        // Display search results
        function displaySearchResults(games) {
            hideAllSections();
            
            const container = document.querySelector('.container') || document.body;
            const resultsDiv = document.createElement('div');
            resultsDiv.id = 'searchResults';
            resultsDiv.innerHTML = `
                <div style="padding: 2rem;">
                    <h2>Search Results (${games.length} games found)</h2>
                    <div id="gamesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
                        ${games.length > 0 ? games.map(game => createGameCard(game)).join('') : '<p>No games found. Try adjusting your search criteria.</p>'}
                    </div>
                    <button onclick="location.reload()" style="margin-top: 2rem; padding: 0.75rem 1.5rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        New Search
                    </button>
                </div>
            `;
            container.appendChild(resultsDiv);
        }
        
        // Display Play Now results
        function displayPlayNowResults(data) {
            hideAllSections();
            
            const activities = data.activities || {};
            const { happeningNow = [], startingSoon = [], laterToday = [], openCourts = [] } = activities;
            
            const container = document.querySelector('.container') || document.body;
            const resultsDiv = document.createElement('div');
            resultsDiv.id = 'playNowResults';
            resultsDiv.innerHTML = `
                <div style="padding: 2rem;">
                    <h2>Games Near You</h2>
                    ${createPlayNowSections(happeningNow, startingSoon, laterToday, openCourts)}
                    <button onclick="location.reload()" style="margin-top: 2rem; padding: 0.75rem 1.5rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Back to Home
                    </button>
                </div>
            `;
            container.appendChild(resultsDiv);
        }
        
        // Create game card HTML
        function createGameCard(game) {
            const sport = game.sport || game.type || 'Sport';
            const venue = game.venue || game.location || 'TBD';
            const time = game.time || 'Time TBD';
            const players = game.players || game.attendees || 0;
            
            return `
                <div class="game-card" style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3>${sport} Game</h3>
                    <p>📍 ${venue}</p>
                    <p>🕐 ${time}</p>
                    <p>👥 ${players} players</p>
                    <button onclick="alert('Join game feature coming soon!')" style="width: 100%; margin-top: 1rem; padding: 0.75rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Join Game
                    </button>
                </div>
            `;
        }
        
        // Create Play Now sections HTML
        function createPlayNowSections(happeningNow, startingSoon, laterToday, openCourts) {
            let html = '';
            
            if (happeningNow.length > 0) {
                html += `
                    <div style="margin-top: 2rem;">
                        <h3>🔴 Happening Now</h3>
                        <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                            ${happeningNow.map(activity => createActivityCard(activity, 'urgent')).join('')}
                        </div>
                    </div>
                `;
            }
            
            if (startingSoon.length > 0) {
                html += `
                    <div style="margin-top: 2rem;">
                        <h3>🟡 Starting Soon</h3>
                        <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                            ${startingSoon.map(activity => createActivityCard(activity, 'soon')).join('')}
                        </div>
                    </div>
                `;
            }
            
            if (laterToday.length > 0) {
                html += `
                    <div style="margin-top: 2rem;">
                        <h3>🟢 Later Today</h3>
                        <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                            ${laterToday.map(activity => createActivityCard(activity, 'later')).join('')}
                        </div>
                    </div>
                `;
            }
            
            if (openCourts.length > 0) {
                html += `
                    <div style="margin-top: 2rem;">
                        <h3>🏟️ Open Courts/Fields</h3>
                        <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                            ${openCourts.map(court => createCourtCard(court)).join('')}
                        </div>
                    </div>
                `;
            }
            
            if (html === '') {
                html = '<p style="text-align: center; padding: 2rem;">No games found near your location. Try expanding your search radius.</p>';
            }
            
            return html;
        }
        
        // Create activity card HTML
        function createActivityCard(activity, urgency) {
            const urgencyColors = {
                urgent: '#ff4444',
                soon: '#ff9944',
                later: '#44aa44'
            };
            
            return `
                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 4px solid ${urgencyColors[urgency]};">
                    <h4>${activity.sport} at ${activity.venue}</h4>
                    <p>🕐 ${activity.time}</p>
                    <p>📍 ${activity.distance || 'Nearby'}</p>
                    <p>👥 ${activity.players || 0} players</p>
                    <button onclick="alert('Joining game...')" style="margin-top: 0.75rem; padding: 0.5rem 1rem; background: ${urgencyColors[urgency]}; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Join Now
                    </button>
                </div>
            `;
        }
        
        // Create court card HTML
        function createCourtCard(court) {
            return `
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 12px; border: 1px solid #dee2e6;">
                    <h4>🏟️ ${court.name}</h4>
                    <p>📍 ${court.address}</p>
                    <p>⏰ ${court.hours}</p>
                    <p>🎯 ${court.sports ? court.sports.join(', ') : 'Various sports'}</p>
                </div>
            `;
        }
        
        // Show search error
        function showSearchError() {
            hideAllSections();
            
            const container = document.querySelector('.container') || document.body;
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = `
                <div style="text-align: center; padding: 4rem;">
                    <h2>Unable to search for games</h2>
                    <p>Please check your connection and try again</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `;
            container.appendChild(errorDiv);
        }
        
        // Show Play Now error
        function showPlayNowError() {
            hideAllSections();
            
            const container = document.querySelector('.container') || document.body;
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = `
                <div style="text-align: center; padding: 4rem;">
                    <h2>Unable to find games near you</h2>
                    <p>Please check your connection and try again</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `;
            container.appendChild(errorDiv);
        }
        
        // Hide all sections
        function hideAllSections() {
            // Hide existing sections
            const sections = document.querySelectorAll('.hero-section, .page-content, .tab-content, #searchResults, #playNowResults, #searchLoading');
            sections.forEach(section => {
                if (section) {
                    section.style.display = 'none';
                }
            });
        }
        
        // Add CSS for spinner if not already present
        if (!document.querySelector('style[data-button-handler-css]')) {
            const style = document.createElement('style');
            style.setAttribute('data-button-handler-css', 'true');
            style.textContent = `
                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #ff6b35;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Log successful initialization
        console.log('[Button Handler] All button handlers initialized successfully:', {
            searchGames: typeof window.searchGames,
            playNow: typeof window.playNow,
            switchTab: typeof window.switchTab,
            showRulesPage: typeof window.showRulesPage
        });
        
        // Also add click event listeners as backup
        setTimeout(() => {
            const searchBtn = document.querySelector('.search-btn');
            const playNowBtn = document.querySelector('.play-now-btn');
            
            if (searchBtn && !searchBtn.onclick) {
                console.log('[Button Handler] Adding click listener to search button');
                searchBtn.addEventListener('click', window.searchGames);
            }
            
            if (playNowBtn && !playNowBtn.onclick) {
                console.log('[Button Handler] Adding click listener to play now button');
                playNowBtn.addEventListener('click', window.playNow);
            }
        }, 100);
    }
})();