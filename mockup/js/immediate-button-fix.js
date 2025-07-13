// Immediate Button Fix - Direct and Simple
console.log('Loading immediate button fix...');

// Fix Search button
window.searchGames = function() {
    console.log('Search clicked!');
    // Hide hero
    document.querySelector('.hero-section').style.display = 'none';
    
    // Create results div
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div style="padding: 2rem;">
            <h2>Searching for games...</h2>
            <div style="text-align: center; padding: 3rem;">
                <p>Loading games from API...</p>
            </div>
        </div>
    `;
    
    // Fetch games
    fetch('/api/games')
        .then(r => r.json())
        .then(data => {
            const games = data.games || [];
            container.innerHTML = `
                <div style="padding: 2rem;">
                    <h2>Available Games (${games.length} found)</h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; margin-top: 2rem;">
                        ${games.length ? games.map(g => `
                            <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <h3>${g.sport || g.type || 'Sport'} Game</h3>
                                <p>📍 ${g.venue || g.location || 'Location TBD'}</p>
                                <p>🕐 ${g.time || 'Time TBD'}</p>
                                <p>👥 ${g.players || 0} players</p>
                                <button style="width: 100%; padding: 0.5rem; background: #ff6b35; color: white; border: none; border-radius: 4px; cursor: pointer;">Join</button>
                            </div>
                        `).join('') : '<p>No games found. Try creating one!</p>'}
                    </div>
                    <button onclick="location.reload()" style="margin-top: 2rem; padding: 0.75rem 1.5rem; background: #ff6b35; color: white; border: none; border-radius: 8px;">
                        Back to Home
                    </button>
                </div>
            `;
        })
        .catch(err => {
            console.error('Search error:', err);
            container.innerHTML = '<div style="padding: 2rem;"><h2>Error loading games</h2><p>Please try again later.</p></div>';
        });
};

// Fix Play Now button
window.playNow = function() {
    console.log('Play Now clicked!');
    // Hide hero
    document.querySelector('.hero-section').style.display = 'none';
    
    // Show loading
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <h2>Finding games near you...</h2>
            <p>Please allow location access if prompted</p>
        </div>
    `;
    
    // Try to get location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                // Got location
                fetch(`/api/play-now?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radius=10`)
                    .then(r => r.json())
                    .then(data => {
                        const activities = data.activities || {};
                        const total = (activities.happeningNow?.length || 0) + 
                                    (activities.startingSoon?.length || 0) + 
                                    (activities.laterToday?.length || 0);
                        
                        let html = '<div style="padding: 2rem;"><h2>Games Near You</h2>';
                        
                        if (total === 0) {
                            html += '<p>No games found near you right now.</p>';
                        } else {
                            if (activities.happeningNow?.length) {
                                html += '<h3>🔴 Happening Now</h3>';
                                activities.happeningNow.forEach(a => {
                                    html += `<div style="background: white; padding: 1rem; margin: 1rem 0; border-radius: 8px; border-left: 4px solid red;">
                                        <strong>${a.sport} at ${a.venue}</strong><br>
                                        🕐 ${a.time} | 📍 ${a.distance || 'Nearby'}
                                    </div>`;
                                });
                            }
                            
                            if (activities.startingSoon?.length) {
                                html += '<h3>🟡 Starting Soon</h3>';
                                activities.startingSoon.forEach(a => {
                                    html += `<div style="background: white; padding: 1rem; margin: 1rem 0; border-radius: 8px; border-left: 4px solid orange;">
                                        <strong>${a.sport} at ${a.venue}</strong><br>
                                        🕐 ${a.time} | 📍 ${a.distance || 'Nearby'}
                                    </div>`;
                                });
                            }
                        }
                        
                        html += '<button onclick="location.reload()" style="margin-top: 2rem; padding: 0.75rem 1.5rem; background: #ff6b35; color: white; border: none; border-radius: 8px;">Back</button></div>';
                        container.innerHTML = html;
                    })
                    .catch(err => {
                        console.error('Play now error:', err);
                        container.innerHTML = '<div style="padding: 2rem;"><h2>Error finding games</h2><p>Please try again.</p></div>';
                    });
            },
            (err) => {
                // Location denied - use Vancouver
                console.log('Location denied, using Vancouver');
                fetch('/api/play-now?lat=49.2827&lng=-123.1207&radius=10')
                    .then(r => r.json())
                    .then(data => {
                        const activities = data.activities || {};
                        container.innerHTML = `
                            <div style="padding: 2rem;">
                                <h2>Games in Vancouver</h2>
                                <p style="color: #666;">Location access denied - showing Vancouver games</p>
                                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #ff6b35; color: white; border: none; border-radius: 8px;">
                                    Back
                                </button>
                            </div>
                        `;
                    });
            }
        );
    } else {
        container.innerHTML = '<div style="padding: 2rem;"><h2>Location not supported</h2><p>Your browser does not support location services.</p></div>';
    }
};

// Also ensure onclick handlers work
setTimeout(() => {
    const searchBtn = document.querySelector('.search-btn');
    const playNowBtn = document.querySelector('.play-now-btn');
    
    if (searchBtn) {
        searchBtn.onclick = window.searchGames;
        console.log('Search button onclick set');
    }
    
    if (playNowBtn) {
        playNowBtn.onclick = window.playNow;
        console.log('Play Now button onclick set');
    }
}, 500);

console.log('Immediate button fix loaded!');