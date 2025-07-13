// Emergency Button Fix - Works with actual DOM structure
console.log('Emergency button fix loading...');

// Fix Search button
window.searchGames = function() {
    console.log('Search clicked - emergency fix!');
    
    // Hide whatever is currently visible
    const heroElements = document.querySelectorAll('.hero, .hero-section, [class*="hero"]');
    heroElements.forEach(el => el.style.display = 'none');
    
    // Also hide the main content area
    const mainContent = document.querySelector('.container');
    if (mainContent) {
        // Store original content
        const originalHTML = mainContent.innerHTML;
        
        // Show loading
        mainContent.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <h2>🔍 Searching for drop-in games...</h2>
                <p>Loading available games near you</p>
            </div>
        `;
        
        // Fetch games
        fetch('/api/games')
            .then(r => r.json())
            .then(data => {
                console.log('Games data:', data);
                const games = data.games || [];
                
                mainContent.innerHTML = `
                    <div style="padding: 2rem;">
                        <h2>Available Drop-in Games</h2>
                        <p>${games.length} games found</p>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 2rem;">
                            ${games.length > 0 ? games.map(game => `
                                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border: 2px solid #ff6b35;">
                                    <h3 style="margin: 0 0 1rem 0; color: #333;">${game.sport || game.type || 'Sport'}</h3>
                                    <p style="margin: 0.5rem 0;">📍 <strong>${game.venue || game.location || 'Location TBD'}</strong></p>
                                    <p style="margin: 0.5rem 0;">🕐 ${game.time || 'Time TBD'}</p>
                                    <p style="margin: 0.5rem 0;">👥 ${game.players || game.attendees || 0} players</p>
                                    <button onclick="alert('Join game feature coming soon!')" style="width: 100%; margin-top: 1rem; padding: 0.75rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                                        Join Game
                                    </button>
                                </div>
                            `).join('') : `
                                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                                    <h3>No games found</h3>
                                    <p>Be the first to create a game in your area!</p>
                                    <button onclick="window.location.href='/submit-game.html'" style="margin-top: 1rem; padding: 0.75rem 2rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                                        Create a Game
                                    </button>
                                </div>
                            `}
                        </div>
                        
                        <div style="text-align: center; margin-top: 3rem;">
                            <button onclick="window.location.reload()" style="padding: 0.75rem 2rem; background: #333; color: white; border: none; border-radius: 8px; cursor: pointer;">
                                ← Back to Home
                            </button>
                        </div>
                    </div>
                `;
            })
            .catch(err => {
                console.error('Search error:', err);
                mainContent.innerHTML = `
                    <div style="padding: 2rem; text-align: center;">
                        <h2>❌ Unable to search games</h2>
                        <p>Please check your connection and try again</p>
                        <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.75rem 2rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Try Again
                        </button>
                    </div>
                `;
            });
    }
};

// Fix Play Now button
window.playNow = function() {
    console.log('Play Now clicked - emergency fix!');
    
    // Hide hero elements
    const heroElements = document.querySelectorAll('.hero, .hero-section, [class*="hero"]');
    heroElements.forEach(el => el.style.display = 'none');
    
    const mainContent = document.querySelector('.container');
    if (mainContent) {
        // Show loading overlay
        mainContent.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <h2>🎯 Finding games near you...</h2>
                <p>Please allow location access when prompted</p>
                <div style="margin-top: 2rem;">
                    <div style="display: inline-block; width: 50px; height: 50px; border: 3px solid #f3f3f3; border-top: 3px solid #ff6b35; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        // Try geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                // Success
                (position) => {
                    console.log('Got location:', position.coords);
                    fetchNearbyGames(position.coords.latitude, position.coords.longitude);
                },
                // Error
                (error) => {
                    console.log('Location error:', error);
                    // Use Vancouver as default
                    mainContent.innerHTML = `
                        <div style="padding: 2rem; text-align: center;">
                            <h2>📍 Using default location: Vancouver</h2>
                            <p>Location access was denied or unavailable</p>
                        </div>
                    `;
                    setTimeout(() => {
                        fetchNearbyGames(49.2827, -123.1207);
                    }, 1000);
                },
                { enableHighAccuracy: false, timeout: 10000 }
            );
        } else {
            // No geolocation support
            fetchNearbyGames(49.2827, -123.1207);
        }
    }
    
    function fetchNearbyGames(lat, lng) {
        fetch(`/api/play-now?lat=${lat}&lng=${lng}&radius=10`)
            .then(r => r.json())
            .then(data => {
                console.log('Play Now data:', data);
                const activities = data.activities || {};
                const mainContent = document.querySelector('.container');
                
                let html = '<div style="padding: 2rem;"><h2>🎯 Games Near You</h2>';
                
                // Happening Now
                if (activities.happeningNow && activities.happeningNow.length > 0) {
                    html += '<div style="margin-top: 2rem;"><h3 style="color: #ff4444;">🔴 Happening Now</h3>';
                    activities.happeningNow.forEach(game => {
                        html += `
                            <div style="background: white; padding: 1rem; margin: 1rem 0; border-radius: 8px; border-left: 5px solid #ff4444; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                <strong>${game.sport} at ${game.venue}</strong><br>
                                🕐 ${game.time} | 📍 ${game.distance || 'Nearby'} | 👥 ${game.players || 0} players
                                <button onclick="alert('Joining game...')" style="float: right; padding: 0.5rem 1rem; background: #ff4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    Join Now
                                </button>
                            </div>
                        `;
                    });
                    html += '</div>';
                }
                
                // Starting Soon
                if (activities.startingSoon && activities.startingSoon.length > 0) {
                    html += '<div style="margin-top: 2rem;"><h3 style="color: #ff9944;">🟡 Starting Soon</h3>';
                    activities.startingSoon.forEach(game => {
                        html += `
                            <div style="background: white; padding: 1rem; margin: 1rem 0; border-radius: 8px; border-left: 5px solid #ff9944; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                <strong>${game.sport} at ${game.venue}</strong><br>
                                🕐 ${game.time} | 📍 ${game.distance || 'Nearby'} | 👥 ${game.players || 0} players
                                <button onclick="alert('Joining game...')" style="float: right; padding: 0.5rem 1rem; background: #ff9944; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    Join Soon
                                </button>
                            </div>
                        `;
                    });
                    html += '</div>';
                }
                
                // Later Today
                if (activities.laterToday && activities.laterToday.length > 0) {
                    html += '<div style="margin-top: 2rem;"><h3 style="color: #44aa44;">🟢 Later Today</h3>';
                    activities.laterToday.forEach(game => {
                        html += `
                            <div style="background: white; padding: 1rem; margin: 1rem 0; border-radius: 8px; border-left: 5px solid #44aa44; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                <strong>${game.sport} at ${game.venue}</strong><br>
                                🕐 ${game.time} | 📍 ${game.distance || 'Nearby'} | 👥 ${game.players || 0} players
                            </div>
                        `;
                    });
                    html += '</div>';
                }
                
                // Open Courts
                if (activities.openCourts && activities.openCourts.length > 0) {
                    html += '<div style="margin-top: 2rem;"><h3>🏟️ Open Courts/Fields</h3>';
                    activities.openCourts.forEach(court => {
                        html += `
                            <div style="background: #f8f9fa; padding: 1rem; margin: 1rem 0; border-radius: 8px; border: 1px solid #dee2e6;">
                                <strong>${court.name}</strong><br>
                                📍 ${court.address}<br>
                                ⏰ ${court.hours}<br>
                                🎯 ${court.sports ? court.sports.join(', ') : 'Various sports'}
                            </div>
                        `;
                    });
                    html += '</div>';
                }
                
                // No games found
                const totalGames = (activities.happeningNow?.length || 0) + 
                                 (activities.startingSoon?.length || 0) + 
                                 (activities.laterToday?.length || 0);
                                 
                if (totalGames === 0) {
                    html += `
                        <div style="text-align: center; padding: 3rem;">
                            <h3>No games found near you</h3>
                            <p>Try expanding your search or check back later</p>
                            <button onclick="window.searchGames()" style="margin-top: 1rem; padding: 0.75rem 2rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                                Browse All Games
                            </button>
                        </div>
                    `;
                }
                
                html += `
                    <div style="text-align: center; margin-top: 3rem;">
                        <button onclick="window.location.reload()" style="padding: 0.75rem 2rem; background: #333; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            ← Back to Home
                        </button>
                    </div>
                </div>`;
                
                mainContent.innerHTML = html;
            })
            .catch(err => {
                console.error('Play Now error:', err);
                const mainContent = document.querySelector('.container');
                mainContent.innerHTML = `
                    <div style="padding: 2rem; text-align: center;">
                        <h2>❌ Unable to find games</h2>
                        <p>Please check your connection and try again</p>
                        <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.75rem 2rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            Try Again
                        </button>
                    </div>
                `;
            });
    }
};

// Fix switchTab function that's missing
window.switchTab = function(tabName) {
    console.log('Switch tab:', tabName);
    // Simple implementation - just alert for now
    alert(`Switching to ${tabName} tab - feature coming soon!`);
};

// Force set onclick handlers after a delay
setTimeout(() => {
    console.log('Setting button handlers...');
    
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.onclick = window.searchGames;
        searchBtn.style.cursor = 'pointer';
        console.log('✅ Search button handler set');
    }
    
    const playNowBtn = document.querySelector('.play-now-btn');
    if (playNowBtn) {
        playNowBtn.onclick = window.playNow;
        playNowBtn.style.cursor = 'pointer';
        console.log('✅ Play Now button handler set');
    }
    
    // Fix tab buttons
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        if (tab.onclick && tab.onclick.toString().includes('switchTab')) {
            const tabName = tab.textContent.toLowerCase().replace(' ', '-');
            tab.onclick = () => window.switchTab(tabName);
        }
    });
    
}, 1000);

console.log('Emergency button fix loaded!');