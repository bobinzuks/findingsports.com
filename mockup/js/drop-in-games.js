// Drop-in Games page component
window.DropInGamesPage = {
  // Initialize the Drop-in Games page
  async initialize() {
    // Initialize map if not already done
    if (!window.map && !window.googleMap) {
      const locationResult = window.locationService?.getLocationInfo();
      const userLocation = locationResult?.userLocation ?
        [locationResult.userLocation.lat, locationResult.userLocation.lng] :
        null;
      window.initializeMap(userLocation);
    }

    // Load games
    await this.loadGames();
  },

  // Render the Drop-in Games page content
  render() {
    const contentWrapper = document.querySelector('.content-wrapper');
    if (!contentWrapper) {
      return;
    }

    contentWrapper.innerHTML = `
            <!-- Games List Section -->
            <section class="games-section">
                <div class="games-header">
                    <h2 class="section-title">Drop-in Games near <span id="locationName">You</span></h2>
                    <div class="games-actions">
                        <a href="/submit-game.html" class="submit-game-link">
                            <span class="plus-icon">+</span>
                            Submit a Drop-in Game
                        </a>
                    </div>
                </div>

                <div class="games-filters">
                    <select class="location-select" id="dropInLocationSelect">
                        <option value="vancouver">Vancouver</option>
                        <option value="burnaby">Burnaby</option>
                        <option value="richmond">Richmond</option>
                        <option value="surrey">Surrey</option>
                    </select>

                    <select class="sport-select" id="dropInSportSelect">
                        <option value="any">Any sport</option>
                        <option value="basketball">Basketball</option>
                        <option value="soccer">Soccer</option>
                        <option value="volleyball">Volleyball</option>
                        <option value="tennis">Tennis</option>
                        <option value="hockey">Hockey</option>
                    </select>

                    <button class="search-btn" onclick="window.DropInGamesPage.searchGames()">
                        Search
                    </button>
                </div>

                <div class="games-list" id="gamesList">
                    <!-- Games will be loaded dynamically -->
                </div>
            </section>

            <!-- Map Section -->
            <section class="map-section">
                <div id="map" class="map-container"></div>
            </section>
        `;

    // Set up location dropdown
    this.setupLocationDropdown();

    // Set up event listeners
    this.setupEventListeners();
  },

  // Set up location dropdown with detected location
  setupLocationDropdown() {
    const locationSelect = document.getElementById('dropInLocationSelect');
    if (!locationSelect) {
      return;
    }

    // Clear and rebuild options
    locationSelect.innerHTML = '';

    // Use the same location dropdown setup as main app
    const locationInfo = window.locationService?.getLocationInfo();

    if (locationInfo && locationInfo.currentCity) {
      // Add current city first
      const currentOption = document.createElement('option');
      currentOption.value = locationInfo.currentCity.key;
      currentOption.textContent = `${locationInfo.currentCity.name} (Current)`;
      currentOption.selected = true;
      locationSelect.appendChild(currentOption);
    }

    // Add nearby cities
    if (locationInfo?.nearbyCities) {
      locationInfo.nearbyCities.forEach(city => {
        if (city.key !== locationInfo.currentCity?.key) {
          const option = document.createElement('option');
          option.value = city.key;
          option.textContent = `${city.name} (${city.distance}km)`;
          locationSelect.appendChild(option);
        }
      });
    }

    // Add separator
    const separator = document.createElement('option');
    separator.disabled = true;
    separator.textContent = '─────────────────';
    locationSelect.appendChild(separator);

    // Add other cities
    const allCities = window.locationService?.getAllCities() || [];
    const addedCities = new Set(locationInfo?.nearbyCities?.map(c => c.key) || []);
    if (locationInfo?.currentCity) {
      addedCities.add(locationInfo.currentCity.key);
    }

    allCities
      .filter(city => !addedCities.has(city.key))
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(city => {
        const option = document.createElement('option');
        option.value = city.key;
        option.textContent = city.name;
        locationSelect.appendChild(option);
      });
  },

  // Set up event listeners
  setupEventListeners() {
    const locationSelect = document.getElementById('dropInLocationSelect');
    if (locationSelect) {
      locationSelect.addEventListener('change', () => this.loadGames());
    }

    const sportSelect = document.getElementById('dropInSportSelect');
    if (sportSelect) {
      sportSelect.addEventListener('change', () => this.loadGames());
    }
  },

  // Load games from API
  async loadGames() {
    const location = document.getElementById('dropInLocationSelect')?.value || 'vancouver';
    const sport = document.getElementById('dropInSportSelect')?.value || 'any';

    try {
      const filters = { location };
      if (sport !== 'any') {
        filters.sport = sport;
      }

      const { games } = await window.api.getGames(filters);
      this.displayGames(games, location);
    } catch (error) {
      console.error('Failed to load games:', error);
      // Fallback to demo data if available
      if (window.gamesData && window.gamesData[location]) {
        this.displayGames(window.gamesData[location], location);
      }
    }
  },

  // Search games with current filters
  async searchGames() {
    const searchBtn = document.querySelector('.search-btn');
    searchBtn.classList.add('loading');
    searchBtn.textContent = 'Searching...';

    await this.loadGames();

    searchBtn.classList.remove('loading');
    searchBtn.textContent = 'Search';
  },

  // Display games in list and on map
  displayGames(games, location) {
    const gamesList = document.getElementById('gamesList');
    const locationName = document.getElementById('locationName');

    // Update location name
    if (locationName) {
      locationName.textContent = location.charAt(0).toUpperCase() + location.slice(1);
    }

    // Clear existing content
    gamesList.innerHTML = '';

    // Clear map markers
    if (window.googleMap && window.clearGoogleMarkers) {
      window.clearGoogleMarkers();
    } else if (window.markers) {
      window.markers.forEach(marker => window.map.removeLayer(marker));
      window.markers = [];
    }

    if (games.length === 0) {
      gamesList.innerHTML = `
                <div class="no-games-message">
                    <p>No drop-in games found in this area.</p>
                    <a href="/submit-game.html" class="submit-game-cta">
                        Be the first to submit a game!
                    </a>
                </div>
            `;
      return;
    }

    // Display games
    games.forEach(game => {
      const gameCard = window.createGameCard(game);
      gamesList.appendChild(gameCard);

      // Add marker to map
      if (game.coords || game.venue?.coordinates) {
        window.addGameMarker(game);
      }
    });

    // Adjust map view
    if (window.googleMap && window.fitMapToMarkers) {
      window.fitMapToMarkers();
    } else if (window.markers && window.markers.length > 0) {
      const group = new L.FeatureGroup(window.markers);
      window.map.fitBounds(group.getBounds().pad(0.1));
    }
  }
};
