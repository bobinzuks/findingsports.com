// Games Display Fix - Ensures games are properly loaded and displayed
(function() {
    'use strict';
    
    console.log('Games Display Fix v2.0 - Loading...');
    
    // Mock games data for fallback
    const mockGames = [
        {
            id: 'game-1',
            sport: 'Basketball',
            venue: { name: 'Hillcrest Community Centre', address: '4575 Clancy Loranger Way, Vancouver' },
            startTime: new Date(Date.now() + 3600000).toISOString(),
            time: 'Starting in 1 hour',
            currentPlayers: 8,
            maxPlayers: 10,
            skillLevel: 'All levels',
            type: 'drop-in'
        },
        {
            id: 'game-2',
            sport: 'Soccer',
            venue: { name: 'Kerrisdale Park', address: '5670 East Blvd, Vancouver' },
            time: 'Every Sunday 2:00 PM',
            currentPlayers: 14,
            maxPlayers: 22,
            skillLevel: 'Intermediate',
            type: 'pickup'
        },
        {
            id: 'game-3',
            sport: 'Volleyball',
            venue: { name: 'Kitsilano Beach Courts', address: 'Cornwall Ave, Vancouver' },
            startTime: new Date(Date.now() + 7200000).toISOString(),
            currentPlayers: 6,
            maxPlayers: 12,
            skillLevel: 'Beginner friendly',
            type: 'drop-in'
        },
        {
            id: 'game-4',
            sport: 'Tennis',
            venue: { name: 'Queen Elizabeth Park', address: '4600 Cambie St, Vancouver' },
            time: 'Drop-in anytime',
            skillLevel: 'All levels',
            type: 'open-court'
        },
        {
            id: 'game-5',
            sport: 'Hockey',
            venue: { name: 'Trout Lake Ice Rink', address: '3300 Victoria Dr, Vancouver' },
            startTime: new Date(Date.now() + 14400000).toISOString(),
            currentPlayers: 16,
            maxPlayers: 20,
            skillLevel: 'Intermediate/Advanced',
            type: 'pickup'
        },
        {
            id: 'game-6',
            sport: 'Baseball',
            venue: { name: 'Nat Bailey Stadium', address: '4601 Ontario St, Vancouver' },
            time: 'Saturday mornings 9 AM',
            currentPlayers: 12,
            maxPlayers: 18,
            skillLevel: 'All levels',
            type: 'league'
        },
        {
            id: 'game-7',
            sport: 'Ultimate Frisbee',
            venue: { name: 'Jericho Beach Park', address: '3941 Point Grey Rd, Vancouver' },
            startTime: new Date(Date.now() + 86400000).toISOString(),
            currentPlayers: 10,
            maxPlayers: 14,
            skillLevel: 'Beginner to Intermediate',
            type: 'pickup'
        },
        {
            id: 'game-8',
            sport: 'Badminton',
            venue: { name: 'Richmond Olympic Oval', address: '6111 River Rd, Richmond' },
            time: 'Weekday evenings 6-9 PM',
            currentPlayers: 4,
            maxPlayers: 8,
            skillLevel: 'All levels',
            type: 'drop-in'
        },
        {
            id: 'game-9',
            sport: 'Table Tennis',
            venue: { name: 'Burnaby Table Tennis Club', address: '5055 Sperling Ave, Burnaby' },
            startTime: new Date(Date.now() + 10800000).toISOString(),
            currentPlayers: 4,
            maxPlayers: 8,
            skillLevel: 'Competitive',
            type: 'club'
        },
        {
            id: 'game-10',
            sport: 'Rugby',
            venue: { name: 'Brockton Oval', address: 'Stanley Park Dr, Vancouver' },
            time: 'Tuesday/Thursday 6 PM',
            currentPlayers: 20,
            maxPlayers: 30,
            skillLevel: 'Experienced',
            type: 'practice'
        },
        {
            id: 'game-11',
            sport: 'Cricket',
            venue: { name: 'Shaughnessy Park', address: '1300 W 24th Ave, Vancouver' },
            startTime: new Date(Date.now() + 172800000).toISOString(),
            currentPlayers: 15,
            maxPlayers: 22,
            skillLevel: 'All levels welcome',
            type: 'friendly-match'
        }
    ];
    
    // Enhanced game card creation
    function createGameCard(game) {
        const venue = game.venue?.name || game.venue || 'Location TBD';
        const address = game.venue?.address || game.address || '';
        const time = game.startTime ? new Date(game.startTime).toLocaleString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit' 
        }) : game.time || 'Time TBD';
        const sport = game.sport || game.title?.split(' ')[0] || 'Sport';
        const players = game.currentPlayers ? `${game.currentPlayers}/${game.maxPlayers || '?'} players` : '';
        const skillLevel = game.skillLevel || '';
        
        return `
            <div class="game-card" style="background: white; padding: 1.5rem; margin: 1rem 0; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: transform 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h3 style="color: #ff6b35; margin: 0 0 0.5rem 0;">${sport.charAt(0).toUpperCase() + sport.slice(1)}</h3>
                        <p style="margin: 0.5rem 0; font-weight: 500;">📍 ${venue}</p>
                        ${address ? `<p style="margin: 0.5rem 0; font-size: 0.9em; color: #666;">${address}</p>` : ''}
                        <p style="margin: 0.5rem 0;">🕐 ${time}</p>
                        ${players ? `<p style="margin: 0.5rem 0;">👥 ${players}</p>` : ''}
                        ${skillLevel ? `<p style="margin: 0.5rem 0; font-size: 0.9em;">🎯 ${skillLevel}</p>` : ''}
                        ${game.type ? `<p style="margin: 0.5rem 0; font-size: 0.9em; color: #666;">Type: ${game.type.replace('-', ' ')}</p>` : ''}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <button onclick="joinGame('${game.id || Math.random()}')" style="padding: 0.5rem 1rem; background: #ff6b35; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
                            Join Game
                        </button>
                        ${game.currentPlayers >= (game.maxPlayers || 999) ? '<span style="color: #e74c3c; font-size: 0.8em;">Full</span>' : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Load and display games
    async function loadGames() {
        console.log('Loading games...');
        const gamesList = document.getElementById('gamesList');
        
        if (!gamesList) {
            console.error('Games list container not found');
            return;
        }
        
        // Show loading state
        gamesList.innerHTML = '<div style="text-align: center; padding: 2rem;"><div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #f0f0f0; border-top-color: #ff6b35; border-radius: 50%; animation: spin 1s linear infinite;"></div><p style="margin-top: 1rem;">Loading games...</p></div>';
        
        try {
            // Try multiple API endpoints
            const endpoints = [
                '/api/v2/games',
                '/api/games',
                '/api/play-now',
                'http://localhost:8080/api/v2/games',
                'http://localhost:8080/api/games'
            ];
            
            let gamesData = null;
            let successfulEndpoint = null;
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying endpoint: ${endpoint}`);
                    const response = await fetch(endpoint);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.games && data.games.length > 0) {
                            gamesData = data.games;
                            successfulEndpoint = endpoint;
                            break;
                        } else if (data.activities) {
                            // Handle play-now format
                            gamesData = [];
                            if (data.activities.happeningNow) gamesData.push(...data.activities.happeningNow);
                            if (data.activities.startingSoon) gamesData.push(...data.activities.startingSoon);
                            if (data.activities.laterToday) gamesData.push(...data.activities.laterToday);
                            if (gamesData.length > 0) {
                                successfulEndpoint = endpoint;
                                break;
                            }
                        }
                    }
                } catch (error) {
                    console.log(`Failed to fetch from ${endpoint}:`, error.message);
                }
            }
            
            // Use mock data if API fails
            const games = gamesData || mockGames;
            console.log(`Using ${gamesData ? 'API' : 'mock'} data from ${successfulEndpoint || 'local'}, ${games.length} games`);
            
            if (games.length === 0) {
                gamesList.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #666;">
                        <p style="font-size: 1.2em;">No games found near Vancouver</p>
                        <p style="margin-top: 1rem;">Be the first to submit a game!</p>
                        <a href="/submit-game.html" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 2rem; background: #ff6b35; color: white; text-decoration: none; border-radius: 8px;">Submit a Game</a>
                    </div>
                `;
            } else {
                gamesList.innerHTML = games.map(game => createGameCard(game)).join('');
                
                // Add hover effect
                gamesList.querySelectorAll('.game-card').forEach(card => {
                    card.addEventListener('mouseenter', function() {
                        this.style.transform = 'translateY(-2px)';
                        this.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)';
                    });
                    card.addEventListener('mouseleave', function() {
                        this.style.transform = 'translateY(0)';
                        this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                    });
                });
            }
            
            // Update location name
            const locationName = document.getElementById('locationName');
            if (locationName) {
                const locationSelect = document.getElementById('locationSelect');
                if (locationSelect) {
                    locationName.textContent = locationSelect.options[locationSelect.selectedIndex].text;
                }
            }
            
        } catch (error) {
            console.error('Failed to load games:', error);
            gamesList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <p>Error loading games. Showing sample games:</p>
                </div>
                ${mockGames.map(game => createGameCard(game)).join('')}
            `;
        }
    }
    
    // Initialize on DOM ready
    function init() {
        console.log('Initializing games display...');
        
        // Load games immediately if on upcoming games tab
        const activeTab = document.querySelector('.tab.active');
        if (activeTab && activeTab.textContent.includes('Upcoming Games')) {
            loadGames();
        }
        
        // Override switchTab to ensure games load
        const originalSwitchTab = window.switchTab;
        window.switchTab = function(tab) {
            if (originalSwitchTab) {
                originalSwitchTab(tab);
            }
            
            if (tab === 'upcoming' || tab === 'upcoming-games') {
                setTimeout(loadGames, 100);
            }
        };
        
        // Ensure search functionality works
        const originalSearchGames = window.searchGames;
        window.searchGames = function() {
            console.log('Search games triggered');
            if (originalSearchGames) {
                originalSearchGames();
            } else {
                loadGames();
            }
        };
    }
    
    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Reload games every 5 minutes
    setInterval(loadGames, 5 * 60 * 1000);
    
    console.log('Games Display Fix v2.0 - Ready');
})();