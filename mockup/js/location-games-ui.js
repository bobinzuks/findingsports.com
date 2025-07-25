// Location and Games UI Component
class LocationGamesUI {
  constructor() {
    this.container = null;
    this.mapContainer = null;
    this.listContainer = null;
    this.map = null;
    this.markers = [];
    this.userMarker = null;
    this.selectedGame = null;
    
    // UI state
    this.viewMode = 'list'; // 'list' or 'map'
    this.filterSport = 'all';
    this.filterDistance = 10;
    this.sortBy = 'distance'; // 'distance', 'time', 'price'
  }

  initialize(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }

    this.render();
    this.attachEventListeners();
    this.initializeServices();
  }

  render() {
    this.container.innerHTML = `
      <div class="location-games-container">
        <!-- Header with location info -->
        <div class="location-header">
          <div class="location-info">
            <i class="fas fa-map-marker-alt"></i>
            <span class="location-text">Detecting location...</span>
            <button class="btn-sm btn-refresh" id="refresh-location">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
          <div class="location-actions">
            <button class="btn-toggle-view" id="toggle-view">
              <i class="fas fa-map"></i> Map View
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-container">
          <div class="filter-group">
            <label>Sport:</label>
            <select id="filter-sport" class="filter-select">
              <option value="all">All Sports</option>
              <option value="basketball">Basketball</option>
              <option value="soccer">Soccer</option>
              <option value="hockey">Hockey</option>
              <option value="volleyball">Volleyball</option>
              <option value="tennis">Tennis</option>
              <option value="pickleball">Pickleball</option>
              <option value="badminton">Badminton</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>Distance:</label>
            <select id="filter-distance" class="filter-select">
              <option value="2">2 km</option>
              <option value="5">5 km</option>
              <option value="10" selected>10 km</option>
              <option value="20">20 km</option>
              <option value="50">50 km</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>Sort by:</label>
            <select id="sort-by" class="filter-select">
              <option value="distance">Distance</option>
              <option value="time">Start Time</option>
              <option value="price">Price</option>
            </select>
          </div>

          <button class="btn-filter" id="apply-filters">
            <i class="fas fa-filter"></i> Apply
          </button>
        </div>

        <!-- Stats -->
        <div class="games-stats">
          <span class="stat-item">
            <i class="fas fa-gamepad"></i>
            <span id="total-games">0</span> games found
          </span>
          <span class="stat-item">
            <i class="fas fa-calendar-day"></i>
            <span id="today-games">0</span> today
          </span>
          <span class="stat-item">
            <i class="fas fa-fire"></i>
            <span id="live-games">0</span> live now
          </span>
        </div>

        <!-- Main content area -->
        <div class="content-area">
          <!-- List View -->
          <div id="list-view" class="games-list active">
            <div class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Finding games near you...</p>
            </div>
          </div>

          <!-- Map View -->
          <div id="map-view" class="games-map">
            <div id="map-container"></div>
          </div>
        </div>

        <!-- Game Details Modal -->
        <div id="game-modal" class="game-modal">
          <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div id="game-details"></div>
          </div>
        </div>
      </div>

      <style>
        .location-games-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .location-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .location-info {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
        }

        .location-info i {
          color: #007bff;
        }

        .btn-sm {
          padding: 5px 10px;
          border: none;
          background: #007bff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-refresh {
          background: #6c757d;
        }

        .filters-container {
          display: flex;
          gap: 15px;
          align-items: end;
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .filter-select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
        }

        .btn-filter {
          padding: 8px 16px;
          border: none;
          background: #28a745;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .games-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .stat-item i {
          color: #6c757d;
        }

        .content-area {
          position: relative;
          min-height: 500px;
        }

        .games-list {
          display: none;
        }

        .games-list.active {
          display: block;
        }

        .games-map {
          display: none;
          height: 600px;
          border-radius: 8px;
          overflow: hidden;
        }

        .games-map.active {
          display: block;
        }

        #map-container {
          width: 100%;
          height: 100%;
        }

        .loading-spinner {
          text-align: center;
          padding: 50px;
          color: #6c757d;
        }

        .loading-spinner i {
          font-size: 48px;
          margin-bottom: 20px;
        }

        .game-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .game-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .game-card.live {
          border-left: 4px solid #dc3545;
        }

        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 15px;
        }

        .game-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 5px;
        }

        .game-sport {
          display: inline-block;
          padding: 4px 12px;
          background: #007bff;
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .game-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-bottom: 10px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          font-size: 14px;
        }

        .info-item i {
          color: #999;
          width: 16px;
        }

        .game-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }

        .game-distance {
          font-weight: 600;
          color: #28a745;
        }

        .game-price {
          font-weight: 600;
          color: #333;
        }

        .game-price.free {
          color: #28a745;
        }

        .game-modal {
          display: none;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
        }

        .modal-content {
          background-color: white;
          margin: 5% auto;
          padding: 20px;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .close-modal {
          color: #aaa;
          float: right;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
        }

        .close-modal:hover {
          color: #000;
        }

        .live-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #dc3545;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .filters-container {
            flex-direction: column;
            gap: 10px;
          }

          .filter-group {
            width: 100%;
          }

          .games-stats {
            flex-wrap: wrap;
          }
        }
      </style>
    `;
  }

  attachEventListeners() {
    // Location refresh
    document.getElementById('refresh-location').addEventListener('click', () => {
      this.refreshLocation();
    });

    // View toggle
    document.getElementById('toggle-view').addEventListener('click', () => {
      this.toggleView();
    });

    // Filters
    document.getElementById('apply-filters').addEventListener('click', () => {
      this.applyFilters();
    });

    // Modal close
    document.querySelector('.close-modal').addEventListener('click', () => {
      this.closeModal();
    });
  }

  async initializeServices() {
    try {
      // Initialize geolocation service
      await window.geolocationService.initialize();
      
      // Add event listeners for location updates
      window.geolocationService.addEventListener('locationUpdate', (location) => {
        this.updateLocationDisplay(location);
      });

      window.geolocationService.addEventListener('gamesUpdate', (games) => {
        this.updateGamesDisplay(games);
      });

      // Load sample data for testing
      window.gameDataService.loadSampleData();

      // Get initial location
      await this.refreshLocation();
      
    } catch (error) {
      console.error('Failed to initialize services:', error);
      this.showError('Failed to initialize location services');
    }
  }

  async refreshLocation() {
    this.showLoading();
    
    try {
      const location = await window.geolocationService.getCurrentLocation();
      this.updateLocationDisplay(location);
      
      // Fetch games at this location
      const games = await window.geolocationService.fetchNearbyGames(location);
      this.updateGamesDisplay(games);
      
      // Initialize map if in map view
      if (this.viewMode === 'map' && !this.map) {
        this.initializeMap(location);
      }
      
    } catch (error) {
      console.error('Location error:', error);
      this.showError('Unable to get your location. Using default location.');
    }
  }

  updateLocationDisplay(location) {
    const locationText = document.querySelector('.location-text');
    
    if (location.city) {
      locationText.textContent = `${location.city}, ${location.region || 'BC'}`;
    } else {
      locationText.textContent = `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`;
    }

    // Add accuracy indicator
    const accuracyClass = location.accuracy < 100 ? 'high' : location.accuracy < 1000 ? 'medium' : 'low';
    locationText.className = `location-text accuracy-${accuracyClass}`;
  }

  updateGamesDisplay(games) {
    const listView = document.getElementById('list-view');
    const stats = this.calculateStats(games);
    
    // Update stats
    document.getElementById('total-games').textContent = stats.total;
    document.getElementById('today-games').textContent = stats.today;
    document.getElementById('live-games').textContent = stats.live;

    // Clear loading spinner
    listView.innerHTML = '';

    if (games.length === 0) {
      listView.innerHTML = `
        <div class="no-games">
          <i class="fas fa-search"></i>
          <p>No games found in your area.</p>
          <p>Try expanding your search radius or check back later.</p>
        </div>
      `;
      return;
    }

    // Group games by distance
    const grouped = window.geolocationService.getGamesByDistance();
    
    // Render games by group
    Object.entries(grouped).forEach(([group, groupGames]) => {
      if (groupGames.length === 0) return;
      
      const groupTitle = {
        nearby: 'Nearby (< 2 km)',
        close: 'Close (2-5 km)',
        moderate: 'Moderate (5-10 km)',
        far: 'Far (> 10 km)'
      }[group];

      const groupHtml = `
        <div class="distance-group">
          <h3 class="group-title">${groupTitle}</h3>
          <div class="group-games">
            ${groupGames.map(game => this.renderGameCard(game)).join('')}
          </div>
        </div>
      `;
      
      listView.innerHTML += groupHtml;
    });

    // Update map markers if in map view
    if (this.viewMode === 'map' && this.map) {
      this.updateMapMarkers(games);
    }
  }

  renderGameCard(game) {
    const isLive = game.isLive;
    const isFree = game.price === 0;
    
    return `
      <div class="game-card ${isLive ? 'live' : ''}" data-game-id="${game.id}">
        ${isLive ? '<div class="live-indicator">LIVE NOW</div>' : ''}
        
        <div class="game-header">
          <div>
            <h3 class="game-title">${game.venue.name}</h3>
            <span class="game-sport">${game.sport}</span>
          </div>
        </div>

        <div class="game-info">
          <div class="info-item">
            <i class="fas fa-clock"></i>
            <span>${game.formattedTime}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>${game.venue.address}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-users"></i>
            <span>${game.currentPlayers}/${game.capacity || '∞'} players</span>
          </div>
          <div class="info-item">
            <i class="fas fa-layer-group"></i>
            <span>${game.skillLevel} level</span>
          </div>
        </div>

        <div class="game-footer">
          <span class="game-distance">
            <i class="fas fa-route"></i>
            ${game.distance.toFixed(1)} km away
          </span>
          <span class="game-price ${isFree ? 'free' : ''}">
            ${isFree ? 'FREE' : `$${game.price}`}
          </span>
        </div>
      </div>
    `;
  }

  calculateStats(games) {
    const now = new Date();
    const stats = {
      total: games.length,
      today: 0,
      live: 0
    };

    games.forEach(game => {
      if (game.isToday) stats.today++;
      if (game.isLive) stats.live++;
    });

    return stats;
  }

  toggleView() {
    const button = document.getElementById('toggle-view');
    const listView = document.getElementById('list-view');
    const mapView = document.getElementById('map-view');

    if (this.viewMode === 'list') {
      this.viewMode = 'map';
      button.innerHTML = '<i class="fas fa-list"></i> List View';
      listView.classList.remove('active');
      mapView.classList.add('active');
      
      // Initialize map if not already done
      if (!this.map && window.geolocationService.userLocation) {
        this.initializeMap(window.geolocationService.userLocation);
      }
    } else {
      this.viewMode = 'list';
      button.innerHTML = '<i class="fas fa-map"></i> Map View';
      mapView.classList.remove('active');
      listView.classList.add('active');
    }
  }

  async initializeMap(userLocation) {
    try {
      // Initialize Mapbox map
      if (!window.mapboxgl || !window.CONFIG?.MAPBOX_API_KEY) {
        console.error('Mapbox not configured');
        return;
      }

      mapboxgl.accessToken = window.CONFIG.MAPBOX_API_KEY;
      
      this.map = new mapboxgl.Map({
        container: 'map-container',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [userLocation.lng, userLocation.lat],
        zoom: 12
      });

      // Add navigation controls
      this.map.addControl(new mapboxgl.NavigationControl());

      // Wait for map to load
      this.map.on('load', async () => {
        // Initialize sport markers system
        if (window.initializeMapboxSportMarkers) {
          this.sportMarkers = await window.initializeMapboxSportMarkers(this.map);
          
          // Setup event handlers
          this.setupMapEventHandlers();
        }

        // Add user location marker with custom styling
        const userEl = document.createElement('div');
        userEl.className = 'user-location-marker';
        userEl.style.cssText = `
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #007bff;
          border: 3px solid white;
          box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
        `;

        this.userMarker = new mapboxgl.Marker(userEl)
          .setLngLat([userLocation.lng, userLocation.lat])
          .setPopup(new mapboxgl.Popup().setHTML('<p>Your Location</p>'))
          .addTo(this.map);

        // Add game markers using sport markers system
        if (this.sportMarkers && window.geolocationService.nearbyGames) {
          this.sportMarkers.addGameMarkers(window.geolocationService.nearbyGames);
        }
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }

  updateMapMarkers(games) {
    if (!this.map) return;

    // If sport markers system is available, use it
    if (this.sportMarkers) {
      this.sportMarkers.addGameMarkers(games);
      return;
    }

    // Fallback to basic markers
    // Clear existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    // Add game markers
    games.forEach(game => {
      const el = document.createElement('div');
      el.className = 'game-marker';
      el.innerHTML = `<i class="fas fa-${this.getSportIcon(game.sport)}"></i>`;
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat([game.venue.coordinates.lng, game.venue.coordinates.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <h4>${game.venue.name}</h4>
          <p>${game.sport} - ${game.formattedTime}</p>
          <p>${game.distance.toFixed(1)} km away</p>
        `))
        .addTo(this.map);

      marker.getElement().addEventListener('click', () => {
        this.showGameDetails(game);
      });

      this.markers.push(marker);
    });
  }

  setupMapEventHandlers() {
    // Handle sport marker clicks
    window.addEventListener('sportMarkerClick', (e) => {
      this.showGameDetails(e.detail.game);
    });

    // Handle join game events
    window.addEventListener('joinGame', (e) => {
      if (window.geolocationService) {
        window.geolocationService.updateGameAttendance(e.detail.gameId, 'join');
      }
    });

    // Handle show details events
    window.addEventListener('showGameDetails', (e) => {
      const game = window.geolocationService.nearbyGames.find(g => g.id === e.detail.gameId);
      if (game) {
        this.showGameDetails(game);
      }
    });
  }

  getSportIcon(sport) {
    const icons = {
      basketball: 'basketball-ball',
      soccer: 'futbol',
      hockey: 'hockey-puck',
      volleyball: 'volleyball-ball',
      tennis: 'table-tennis',
      baseball: 'baseball-ball',
      football: 'football-ball'
    };
    return icons[sport] || 'running';
  }

  applyFilters() {
    const sport = document.getElementById('filter-sport').value;
    const distance = parseFloat(document.getElementById('filter-distance').value);
    const sortBy = document.getElementById('sort-by').value;

    this.filterSport = sport;
    this.filterDistance = distance;
    this.sortBy = sortBy;

    // Update search radius
    window.geolocationService.setSearchRadius(distance);

    // Apply filters and re-fetch
    this.refreshLocation();
  }

  showGameDetails(game) {
    const modal = document.getElementById('game-modal');
    const details = document.getElementById('game-details');
    
    details.innerHTML = `
      <h2>${game.venue.name}</h2>
      <div class="game-sport">${game.sport}</div>
      
      <div class="detail-section">
        <h3>When</h3>
        <p><i class="fas fa-calendar"></i> ${new Date(game.startTime).toLocaleDateString()}</p>
        <p><i class="fas fa-clock"></i> ${new Date(game.startTime).toLocaleTimeString()} - ${new Date(game.endTime).toLocaleTimeString()}</p>
        ${game.recurring.enabled ? '<p><i class="fas fa-redo"></i> Recurring weekly</p>' : ''}
      </div>

      <div class="detail-section">
        <h3>Where</h3>
        <p><i class="fas fa-map-marker-alt"></i> ${game.venue.address}</p>
        <p><i class="fas fa-route"></i> ${game.distance.toFixed(1)} km from your location</p>
      </div>

      <div class="detail-section">
        <h3>Details</h3>
        <p><i class="fas fa-users"></i> ${game.currentPlayers}/${game.capacity || '∞'} players</p>
        <p><i class="fas fa-layer-group"></i> ${game.skillLevel} skill level</p>
        <p><i class="fas fa-dollar-sign"></i> ${game.price === 0 ? 'FREE' : `$${game.price}`}</p>
      </div>

      ${game.description ? `
        <div class="detail-section">
          <h3>Description</h3>
          <p>${game.description}</p>
        </div>
      ` : ''}

      <div class="detail-actions">
        <button class="btn-primary" onclick="window.geolocationService.updateGameAttendance('${game.id}', 'join')">
          <i class="fas fa-plus"></i> Join Game
        </button>
        <button class="btn-secondary" onclick="window.open('https://maps.google.com/?q=${game.venue.coordinates.lat},${game.venue.coordinates.lng}', '_blank')">
          <i class="fas fa-directions"></i> Get Directions
        </button>
      </div>
    `;
    
    modal.style.display = 'block';
  }

  closeModal() {
    document.getElementById('game-modal').style.display = 'none';
  }

  showLoading() {
    const listView = document.getElementById('list-view');
    listView.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Finding games near you...</p>
      </div>
    `;
  }

  showError(message) {
    const listView = document.getElementById('list-view');
    listView.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>${message}</p>
      </div>
    `;
  }
}

// Create and export global instance
window.locationGamesUI = new LocationGamesUI();