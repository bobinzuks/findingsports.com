// Play Now page component
const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8080' : window.location.origin);

window.PlayNowPage = {
    // Initialize the Play Now page
    async initialize() {
        // Initialize location detection if not already done
        if (!window.locationService) {
            await window.initializeLocationDetection();
        }

        // Initialize map with user location
        const locationResult = window.locationService?.getLocationInfo();
        const userLocation = locationResult?.userLocation ?
            [locationResult.userLocation.lat, locationResult.userLocation.lng] :
            null;

        if (!window.googleMap && !window.map) {
            window.initializeMap(userLocation);
        }

        // Set up event listeners
        this.setupEventListeners();
    },

    // Render the Play Now page content
    render() {
        const contentWrapper = document.querySelector('.content-wrapper');
        if (!contentWrapper) {
            return;
        }

        contentWrapper.innerHTML = `
            <!-- Play Now Section -->
            <section class="play-now-section">
                <div class="play-now-header">
                    <h2 class="section-title">Find Your Game</h2>
                    <p class="section-subtitle">Select a sport and we'll show you available fields nearby</p>
                </div>

                <div class="play-now-controls">
                    <div class="sport-selector">
                        <label for="playNowSportSelect">Choose your sport:</label>
                        <select id="playNowSportSelect" class="sport-select large">
                            <option value="any">Any sport</option>
                            <option value="soccer">Soccer</option>
                            <option value="basketball">Basketball</option>
                            <option value="tennis">Tennis</option>
                            <option value="badminton">Badminton</option>
                            <option value="volleyball">Volleyball</option>
                            <option value="hockey">Hockey</option>
                            <option value="football">Football</option>
                            <option value="ping-pong">Ping pong</option>
                            <option value="frisbee">Frisbee</option>
                            <option value="rugby">Rugby</option>
                            <option value="tag">Tag</option>
                            <option value="baseball">Baseball</option>
                            <option value="kabaddi">Kabaddi</option>
                            <option value="softball">Softball</option>
                        </select>
                    </div>

                    <div class="location-info">
                        <span class="location-label">Your location:</span>
                        <span id="userLocationDisplay" class="location-value">Detecting...</span>
                    </div>

                    <button class="play-now-action-btn" onclick="window.PlayNowPage.findGames()">
                        <span class="btn-text">Play Now</span>
                        <span class="btn-icon">→</span>
                    </button>
                </div>

                <div id="playNowResults" class="play-now-results">
                    <!-- Results will be displayed here -->
                </div>
            </section>

            <!-- Map Section -->
            <section class="map-section play-now-map">
                <div id="map" class="map-container"></div>
            </section>
        `;

        // Update location display
        this.updateLocationDisplay();
    },

    // Set up event listeners
    setupEventListeners() {
        const sportSelect = document.getElementById('playNowSportSelect');
        if (sportSelect) {
            sportSelect.addEventListener('change', () => this.onSportChange());
        }
    },

    // Update location display
    updateLocationDisplay() {
        const locationDisplay = document.getElementById('userLocationDisplay');
        if (!locationDisplay) {
            return;
        }

        const locationInfo = window.locationService?.getLocationInfo();
        if (locationInfo && locationInfo.currentCity) {
            locationDisplay.textContent = `${locationInfo.currentCity.name}, BC`;
            if (locationInfo.detectedLocationInfo?.detectedCity) {
                locationDisplay.title = `Detected: ${locationInfo.detectedLocationInfo.detectedCity}`;
            }
        } else {
            locationDisplay.textContent = 'Location not detected';
        }
    },

    // Handle sport selection change
    onSportChange() {
        const sport = document.getElementById('playNowSportSelect').value;
        console.log('Sport selected:', sport);
        // Optionally update map markers based on sport
    },

    // Find games based on selected sport
    async findGames() {
        const sport = document.getElementById('playNowSportSelect').value;
        const resultsDiv = document.getElementById('playNowResults');
        const actionBtn = document.querySelector('.play-now-action-btn');

        // Show loading state
        actionBtn.classList.add('loading');
        actionBtn.querySelector('.btn-text').textContent = 'Finding games...';

        resultsDiv.innerHTML = '<div class="loading-message">Searching for available games happening now...</div>';

        try {
            // Get user's current location
            const locationInfo = window.locationService?.getLocationInfo();
            const userLocation = locationInfo?.userLocation || { lat: 49.2827, lng: -123.1207 }; // Default to downtown Vancouver
            
            // Call the Play Now API
            const params = new URLSearchParams({
                lat: userLocation.lat,
                lng: userLocation.lng,
                radius: 10, // 10km radius
                includeOpenCourts: true
            });

            const response = await fetch(`${API_BASE_URL}/api/play-now?${params}`);
            const data = await response.json();

            // Display results
            this.displayPlayNowResults(data, sport);

            // Update map markers with all activities
            if (window.googleMap || window.map) {
                this.updateMapMarkersForPlayNow(data.activities);
            }
        } catch (error) {
            console.error('Failed to find games:', error);
            resultsDiv.innerHTML = `
                <div class="error-message">
                    <p>Failed to find games. Please try again.</p>
                </div>
            `;
        } finally {
            // Reset button state
            actionBtn.classList.remove('loading');
            actionBtn.querySelector('.btn-text').textContent = 'Play Now';
        }
    },

    // Display Play Now results
    displayPlayNowResults(data, sportFilter) {
        const resultsDiv = document.getElementById('playNowResults');
        const { activities, summary } = data;
        
        // Filter activities by sport if needed
        let filteredActivities = {
            happeningNow: activities.happeningNow,
            startingSoon: activities.startingSoon,
            openCourts: activities.openCourts,
            pickupGames: activities.pickupGames
        };
        
        if (sportFilter !== 'any') {
            filteredActivities = {
                happeningNow: activities.happeningNow.filter(a => a.sport === sportFilter),
                startingSoon: activities.startingSoon.filter(a => a.sport === sportFilter),
                openCourts: activities.openCourts.filter(a => a.type === sportFilter),
                pickupGames: activities.pickupGames.filter(a => a.sport === sportFilter)
            };
        }
        
        const totalFiltered = 
            filteredActivities.happeningNow.length + 
            filteredActivities.startingSoon.length + 
            filteredActivities.openCourts.length + 
            filteredActivities.pickupGames.length;
        
        if (totalFiltered === 0) {
            resultsDiv.innerHTML = `
                <div class="no-results">
                    <h3>No ${sportFilter === 'any' ? '' : sportFilter} activities available right now</h3>
                    <p>Try selecting a different sport or check back later.</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="play-now-results-container">';
        
        // Happening Now
        if (filteredActivities.happeningNow.length > 0) {
            html += `
                <div class="activity-section happening-now">
                    <h3 class="section-header">
                        <span class="status-icon">🟢</span>
                        Happening Now (${filteredActivities.happeningNow.length})
                    </h3>
                    <div class="activity-list">
            `;
            
            filteredActivities.happeningNow.forEach(activity => {
                html += this.createActivityCard(activity, 'happening-now');
            });
            
            html += '</div></div>';
        }
        
        // Starting Soon
        if (filteredActivities.startingSoon.length > 0) {
            html += `
                <div class="activity-section starting-soon">
                    <h3 class="section-header">
                        <span class="status-icon">🟡</span>
                        Starting Soon (${filteredActivities.startingSoon.length})
                    </h3>
                    <div class="activity-list">
            `;
            
            filteredActivities.startingSoon.forEach(activity => {
                html += this.createActivityCard(activity, 'starting-soon');
            });
            
            html += '</div></div>';
        }
        
        // Open Courts
        if (filteredActivities.openCourts.length > 0) {
            html += `
                <div class="activity-section open-courts">
                    <h3 class="section-header">
                        <span class="status-icon">🏞️</span>
                        Open Courts/Fields (${filteredActivities.openCourts.length})
                    </h3>
                    <div class="activity-list">
            `;
            
            filteredActivities.openCourts.forEach(court => {
                html += this.createCourtCard(court);
            });
            
            html += '</div></div>';
        }
        
        // Pickup Games
        if (filteredActivities.pickupGames.length > 0) {
            html += `
                <div class="activity-section pickup-games">
                    <h3 class="section-header">
                        <span class="status-icon">👥</span>
                        Pickup Games (${filteredActivities.pickupGames.length})
                    </h3>
                    <div class="activity-list">
            `;
            
            filteredActivities.pickupGames.forEach(game => {
                html += this.createPickupGameCard(game);
            });
            
            html += '</div></div>';
        }
        
        html += '</div>';
        resultsDiv.innerHTML = html;
    },
    
    // Create activity card for drop-in activities
    createActivityCard(activity, type) {
        const sportEmoji = this.getSportEmoji(activity.sport);
        const timeInfo = type === 'happening-now' ? 
            `Started ${activity.startedAgo}` : 
            `Starts in ${activity.startsIn}`;
        
        return `
            <div class="activity-card ${type}" onclick="window.showActivityDetails(${JSON.stringify(activity).replace(/"/g, '&quot;')})">
                <div class="activity-header">
                    <span class="sport-icon">${sportEmoji}</span>
                    <span class="sport-name">${activity.sport.toUpperCase()}</span>
                    <span class="distance">${activity.distance}</span>
                </div>
                <div class="activity-venue">${activity.venue}</div>
                <div class="activity-details">
                    <span class="time-info">${activity.timeString}</span>
                    <span class="status">${timeInfo}</span>
                </div>
                <div class="activity-footer">
                    <span class="cost">$${activity.cost}</span>
                    ${activity.ageGroup ? `<span class="age-group">${activity.ageGroup}</span>` : ''}
                    ${activity.skillLevel ? `<span class="skill-level">${activity.skillLevel}</span>` : ''}
                </div>
            </div>
        `;
    },
    
    // Create card for open courts
    createCourtCard(court) {
        const typeEmoji = this.getSportEmoji(court.type);
        const statusClass = court.status === 'open' ? 'status-open' : 'status-partial';
        
        return `
            <div class="court-card" onclick="window.showCourtDetails(${JSON.stringify(court).replace(/"/g, '&quot;')})">
                <div class="court-header">
                    <span class="court-icon">${typeEmoji}</span>
                    <span class="court-type">${court.type.toUpperCase()}</span>
                    <span class="distance">${court.distance}</span>
                </div>
                <div class="court-venue">${court.venue}</div>
                <div class="court-status ${statusClass}">${court.status.toUpperCase()}</div>
                ${court.courts ? `<div class="court-count">${court.courts} courts</div>` : ''}
                ${court.busyTimes ? `<div class="busy-times">${court.busyTimes}</div>` : ''}
            </div>
        `;
    },
    
    // Create card for pickup games
    createPickupGameCard(game) {
        const sportEmoji = this.getSportEmoji(game.sport);
        
        return `
            <div class="pickup-game-card" onclick="window.showPickupGameDetails(${JSON.stringify(game).replace(/"/g, '&quot;')})">
                <div class="game-header">
                    <span class="sport-icon">${sportEmoji}</span>
                    <span class="sport-name">${game.sport.toUpperCase()}</span>
                    <span class="distance">${game.distance}</span>
                </div>
                <div class="game-venue">${game.venue}</div>
                <div class="game-organizer">${game.organizer} via ${game.platform}</div>
                <div class="game-details">
                    <span class="time">${game.time}</span>
                    <span class="skill-level">${game.skillLevel}</span>
                </div>
                <div class="game-footer">
                    ${game.playersNeeded ? `<span class="players-needed">Need ${game.playersNeeded} players</span>` : ''}
                    ${game.spotsLeft ? `<span class="spots-left">${game.spotsLeft} spots left</span>` : ''}
                    <span class="join-method">${game.joinMethod}</span>
                </div>
            </div>
        `;
    },
    
    // Get sport emoji
    getSportEmoji(sport) {
        const emojis = {
            basketball: '🏀',
            volleyball: '🏐',
            soccer: '⚽',
            badminton: '🏸',
            hockey: '🏒',
            skating: '⛸️',
            tennis: '🎾',
            swimming: '🏊',
            football: '🏈',
            'ping-pong': '🏓',
            frisbee: '🥏',
            rugby: '🏉',
            baseball: '⚾',
            softball: '🥎'
        };
        return emojis[sport] || '🏃';
    },

    // Display search results
    displayResults(games, sport) {
        const resultsDiv = document.getElementById('playNowResults');

        if (games.length === 0) {
            resultsDiv.innerHTML = `
                <div class="no-results">
                    <h3>No ${sport === 'any' ? '' : sport} games available right now</h3>
                    <p>Try selecting a different sport or check back later.</p>
                </div>
            `;
            return;
        }

        // Group games by venue/field
        const venueGames = this.groupGamesByVenue(games);

        let html = `
            <div class="results-header">
                <h3>${games.length} ${sport === 'any' ? '' : sport} games available</h3>
            </div>
            <div class="venue-list">
        `;

        Object.entries(venueGames).forEach(([venueName, venueData]) => {
            html += `
                <div class="venue-card">
                    <div class="venue-header">
                        <h4 class="venue-name">${venueName}</h4>
                        <span class="game-count">${venueData.games.length} games</span>
                    </div>
                    <div class="venue-games">
            `;

            venueData.games.slice(0, 3).forEach(game => {
                const timeStr = game.startTime ?
                    new Date(game.startTime).toLocaleString('en-US', {
                        weekday: 'short',
                        hour: 'numeric',
                        minute: '2-digit'
                    }) :
                    'Time TBD';

                html += `
                    <div class="venue-game-item" onclick="window.showGameDetails(${JSON.stringify(game).replace(/"/g, '&quot;')})">
                        <span class="game-time">${timeStr}</span>
                        <span class="game-sport">${game.type || game.sport}</span>
                        <span class="game-players">${game.attendees || 0}/${game.maxAttendees || 20}</span>
                    </div>
                `;
            });

            if (venueData.games.length > 3) {
                html += `<div class="more-games">+${venueData.games.length - 3} more games</div>`;
            }

            html += `
                    </div>
                </div>
            `;
        });

        html += '</div>';
        resultsDiv.innerHTML = html;
    },

    // Group games by venue
    groupGamesByVenue(games) {
        const venues = {};

        games.forEach(game => {
            const venueName = game.venue?.name || game.location || 'Unknown venue';
            if (!venues[venueName]) {
                venues[venueName] = {
                    games: [],
                    coords:
                        game.coords ||
                        (game.venue?.coordinates ? [game.venue.coordinates.lat, game.venue.coordinates.lng] : null)
                };
            }
            venues[venueName].games.push(game);
        });

        return venues;
    },

    // Update map markers for Play Now activities
    updateMapMarkersForPlayNow(activities) {
        if (!window.map && !window.googleMap) {
            return;
        }

        // Clear existing markers
        if (window.googleMap && window.clearGoogleMarkers) {
            window.clearGoogleMarkers();
        } else if (window.markers) {
            window.markers.forEach(marker => window.map.removeLayer(marker));
            window.markers = [];
        }

        // Add markers for all activity types
        const allActivities = [
            ...activities.happeningNow,
            ...activities.startingSoon,
            ...activities.openCourts,
            ...activities.pickupGames
        ];

        allActivities.forEach(activity => {
            if (activity.coordinates) {
                const markerData = {
                    id: activity.id,
                    sport: activity.sport || activity.type,
                    venue: { 
                        name: activity.venue,
                        coordinates: activity.coordinates
                    },
                    coords: [activity.coordinates.lat, activity.coordinates.lng],
                    type: activity.type || 'drop-in',
                    status: activity.status,
                    time: activity.timeString || activity.time
                };
                window.addGameMarker(markerData);
            }
        });

        // Fit map to show all markers
        if (window.googleMap && window.fitMapToMarkers) {
            window.fitMapToMarkers();
        } else if (window.markers && window.markers.length > 0) {
            const group = new L.FeatureGroup(window.markers);
            window.map.fitBounds(group.getBounds().pad(0.1));
        }
    },

    // Update map markers
    updateMapMarkers(games) {
        if (!window.map && !window.googleMap) {
            return;
        }

        // Clear existing markers
        if (window.googleMap && window.clearGoogleMarkers) {
            window.clearGoogleMarkers();
        } else if (window.markers) {
            window.markers.forEach(marker => window.map.removeLayer(marker));
            window.markers = [];
        }

        // Add new markers
        games.forEach(game => {
            if (game.coords || game.venue?.coordinates) {
                window.addGameMarker(game);
            }
        });

        // Fit map to show all markers
        if (window.googleMap && window.fitMapToMarkers) {
            window.fitMapToMarkers();
        } else if (window.markers && window.markers.length > 0) {
            const group = new L.FeatureGroup(window.markers);
            window.map.fitBounds(group.getBounds().pad(0.1));
        }
    }
};
