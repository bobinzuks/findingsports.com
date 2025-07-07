// Play Now page component
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

        if (!window.map) {
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

        resultsDiv.innerHTML = '<div class="loading-message">Searching for available fields...</div>';

        try {
            // Get current location
            const locationInfo = window.locationService?.getLocationInfo();
            const currentLocation = locationInfo?.currentCity?.key || 'vancouver';

            // Fetch games/fields
            const filters = { location: currentLocation };
            if (sport !== 'any') {
                filters.sport = sport;
            }

            const { games } = await window.api.getGames(filters);

            // Display results
            this.displayResults(games, sport);

            // Update map markers
            this.updateMapMarkers(games);
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

    // Update map markers
    updateMapMarkers(games) {
        if (!window.map) {
            return;
        }

        // Clear existing markers
        if (window.markers) {
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
        if (window.markers && window.markers.length > 0) {
            const group = new L.FeatureGroup(window.markers);
            window.map.fitBounds(group.getBounds().pad(0.1));
        }
    }
};
