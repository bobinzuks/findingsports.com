// Global Play Now functionality - works anywhere in the world
(function() {
    'use strict';
    
    console.log('Global Play Now functionality loading...');
    
    // Override the inline playNow function to use auto-detected location
    window.playNow = function() {
        console.log('Play Now clicked - using global location detection');
        
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;
        
        // Show loading state
        mainContent.innerHTML = `
            <div style="padding: 3rem; text-align: center;">
                <h2 style="color: #ff6b35;">🌍 Detecting your location...</h2>
                <div style="margin-top: 2rem;">
                    <div style="width: 60px; height: 60px; border: 4px solid #f0f0f0; border-top-color: #ff6b35; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>
                <p style="margin-top: 2rem; color: #666;">Getting your GPS coordinates to find nearby games...</p>
                <button onclick="window.globalLocationService.showLocationPrompt('Click Enable GPS to share your location')" style="
                    margin-top: 2rem;
                    padding: 12px 24px;
                    background: #ff6b35;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">📍 Enable Location Access</button>
            </div>
        `;
        
        // Function to fetch and display games
        const fetchGamesAtLocation = (lat, lng, locationName) => {
            console.log(`Fetching games near ${locationName} (${lat}, ${lng})`);
            
            // Show searching state
            mainContent.innerHTML = `
                <div style="padding: 3rem; text-align: center;">
                    <h2 style="color: #ff6b35;">🔍 Finding games near ${locationName}...</h2>
                    <div style="margin-top: 2rem;">
                        <div style="width: 60px; height: 60px; border: 4px solid #f0f0f0; border-top-color: #ff6b35; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                    </div>
                </div>
            `;
            
            // API call with detected coordinates
            const apiUrl = `/api/play-now?lat=${lat}&lng=${lng}&radius=50`;
            console.log('API URL:', apiUrl);
            
            fetch(apiUrl)
                .then(response => response.json())
                .then(data => {
                    console.log('API Response:', data);
                    
                    // Use the global displayPlayNowResults function
                    if (window.displayPlayNowResults) {
                        window.displayPlayNowResults(data, lat, lng, locationName);
                    } else {
                        // Fallback display
                        displayBasicResults(data, lat, lng, locationName);
                    }
                })
                .catch(error => {
                    console.error('Error fetching games:', error);
                    mainContent.innerHTML = `
                        <div style="padding: 3rem; text-align: center;">
                            <h2 style="color: #e74c3c;">Unable to load games</h2>
                            <p style="margin-top: 1rem;">There was an error loading games in your area.</p>
                            <button onclick="window.playNow()" style="
                                margin-top: 2rem;
                                padding: 10px 20px;
                                background: #ff6b35;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                cursor: pointer;
                            ">Try Again</button>
                        </div>
                    `;
                });
        };
        
        // Fallback display function
        const displayBasicResults = (data, lat, lng, locationName) => {
            const activities = data.activities || {};
            const games = data.games || [];
            
            let html = `
                <div class="play-now-results" style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
                    <h2 style="color: #ff6b35; margin-bottom: 2rem;">
                        🎯 Games Near ${locationName}
                    </h2>
                    
                    <div style="background: #f0f0f0; padding: 1rem; border-radius: 8px; margin-bottom: 2rem;">
                        <p style="margin: 0;">📍 Your Location: ${locationName}</p>
                        <p style="margin: 0;">🌐 Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
                    </div>
            `;
            
            // Display games or no games message
            const allGames = [
                ...(activities.happeningNow || []),
                ...(activities.startingSoon || []),
                ...(activities.laterToday || []),
                ...games
            ];
            
            if (allGames.length === 0) {
                html += `
                    <div style="text-align: center; padding: 3rem;">
                        <h3 style="color: #666;">No games found in your area</h3>
                        <p>Try expanding your search radius or check back later!</p>
                        <button onclick="window.openCustomLocationModal()" style="
                            margin-top: 1rem;
                            padding: 10px 20px;
                            background: #ff6b35;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                        ">Search Different Location</button>
                    </div>
                `;
            } else {
                html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">`;
                
                allGames.forEach(game => {
                    html += `
                        <div style="background: white; border: 2px solid #ff6b35; border-radius: 8px; padding: 1.5rem;">
                            <h4 style="color: #ff6b35; margin: 0 0 0.5rem 0;">${game.sport || 'Sport'}</h4>
                            <p style="margin: 0.5rem 0;">📍 ${game.venue || 'Location'}</p>
                            <p style="margin: 0.5rem 0;">🕐 ${game.time || 'Time TBD'}</p>
                            <p style="margin: 0.5rem 0;">📏 ${game.distance || 'Distance unknown'}</p>
                        </div>
                    `;
                });
                
                html += `</div>`;
            }
            
            html += `</div>`;
            mainContent.innerHTML = html;
        };
        
        // Check if we already have location
        if (window.globalLocationService && window.globalLocationService.userLocation) {
            const [lat, lng] = window.globalLocationService.userLocation;
            const locationName = window.globalLocationService.locationName || 'Your Location';
            fetchGamesAtLocation(lat, lng, locationName);
        } else {
            // Detect location first
            window.globalLocationService.detectUserLocation().then((success) => {
                if (success) {
                    const [lat, lng] = window.globalLocationService.userLocation;
                    const locationName = window.globalLocationService.locationName || 'Your Location';
                    fetchGamesAtLocation(lat, lng, locationName);
                } else {
                    // Show manual location selection
                    mainContent.innerHTML = `
                        <div style="padding: 3rem; text-align: center;">
                            <h2 style="color: #ff6b35;">📍 Location Required</h2>
                            <p style="margin: 1rem 0;">Please enable location services to find games near you.</p>
                            <button onclick="window.globalLocationService.detectUserLocation().then(() => window.playNow())" style="
                                margin: 1rem;
                                padding: 12px 24px;
                                background: #ff6b35;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                cursor: pointer;
                                font-weight: 600;
                            ">Enable GPS</button>
                            <button onclick="window.openCustomLocationModal()" style="
                                margin: 1rem;
                                padding: 12px 24px;
                                background: #666;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                cursor: pointer;
                            ">Enter Location Manually</button>
                        </div>
                    `;
                }
            });
        }
    };
    
    console.log('Global Play Now ready - will work with your detected location anywhere!');
})();