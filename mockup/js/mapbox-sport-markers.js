// Mapbox Sport Markers Integration
// This module integrates SportIcons with Mapbox GL JS for enhanced map visualization

class MapboxSportMarkers {
  constructor(map) {
    this.map = map;
    this.markers = [];
    this.clusters = null;
    this.activeFilters = new Set();
    this.markerClickHandlers = new Map();
    this.popupTemplate = null;
    this.isInitialized = false;
    
    // Sport icon configuration
    this.iconConfig = {
      size: 40,
      borderWidth: 3,
      shadowBlur: 10,
      clusterSize: 50
    };
  }

  // Initialize the sport markers system
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Ensure SportIcons is loaded
      if (!window.SportIcons) {
        throw new Error('SportIcons module not loaded');
      }
      
      // Load marker clustering library
      await this.loadMarkerClustering();
      
      // Add map style layers for sports
      this.setupMapLayers();
      
      // Setup sport filter controls
      this.setupFilterControls();
      
      this.isInitialized = true;
      console.log('MapboxSportMarkers initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize MapboxSportMarkers:', error);
      throw error;
    }
  }

  // Load Mapbox marker clustering library
  async loadMarkerClustering() {
    return new Promise((resolve, reject) => {
      if (window.MarkerClusterer) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/supercluster@8.0.0/dist/supercluster.min.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Setup map layers for sports visualization
  setupMapLayers() {
    // Add a source for clustered points
    this.map.addSource('sport-games', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Add layer for clusters
    this.map.addLayer({
      id: 'sport-clusters',
      type: 'circle',
      source: 'sport-games',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6', // Blue for small clusters
          10,
          '#f1f075', // Yellow for medium clusters
          30,
          '#f28cb1'  // Pink for large clusters
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          10,
          30,
          30,
          40
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add cluster count labels
    this.map.addLayer({
      id: 'sport-cluster-count',
      type: 'symbol',
      source: 'sport-games',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    // Handle cluster clicks
    this.map.on('click', 'sport-clusters', (e) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: ['sport-clusters']
      });
      const clusterId = features[0].properties.cluster_id;
      
      this.map.getSource('sport-games').getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;
          this.map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
    });

    // Change cursor on hover
    this.map.on('mouseenter', 'sport-clusters', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    
    this.map.on('mouseleave', 'sport-clusters', () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  // Create a custom HTML marker for a sport
  createSportMarker(game) {
    const sport = game.sport || game.type || 'other';
    const sportIcon = SportIcons.getIcon(sport);
    
    // Create marker container
    const el = document.createElement('div');
    el.className = 'mapbox-sport-marker';
    el.dataset.sport = sport;
    el.dataset.gameId = game.id;
    
    // Apply styles
    el.style.cssText = `
      width: ${this.iconConfig.size}px;
      height: ${this.iconConfig.size}px;
      cursor: pointer;
      position: relative;
      transition: transform 0.2s ease;
    `;

    // Create the pin shape with sport icon
    el.innerHTML = `
      <svg width="${this.iconConfig.size}" height="${this.iconConfig.size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <!-- Drop shadow -->
        <defs>
          <filter id="shadow-${game.id}">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feFlood flood-color="#000000" flood-opacity="0.3"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <clipPath id="pin-clip-${game.id}">
            <path d="M20 2C13.4 2 8 7.4 8 14c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"/>
          </clipPath>
        </defs>
        
        <!-- Pin shape -->
        <path d="M20 2C13.4 2 8 7.4 8 14c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"
              fill="${sportIcon.color}"
              filter="url(#shadow-${game.id})"
              stroke="#ffffff"
              stroke-width="${this.iconConfig.borderWidth}"/>
        
        <!-- Sport icon -->
        <g transform="translate(20, 14)">
          <svg width="18" height="18" viewBox="${sportIcon.viewBox}" x="-9" y="-9">
            <path d="${sportIcon.svgPath}" fill="#ffffff"/>
          </svg>
        </g>
        
        ${game.isLive ? `
          <!-- Live indicator -->
          <circle cx="32" cy="8" r="5" fill="#ff0000" stroke="#ffffff" stroke-width="1">
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
          </circle>
        ` : ''}
      </svg>
    `;

    // Add hover effect
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.1) translateY(-2px)';
      el.style.zIndex = '1000';
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1) translateY(0)';
      el.style.zIndex = 'auto';
    });

    return el;
  }

  // Add a single game marker to the map
  addGameMarker(game) {
    // Get coordinates
    let coordinates;
    if (game.coords) {
      coordinates = [game.coords[1], game.coords[0]]; // [lng, lat]
    } else if (game.venue?.coordinates) {
      coordinates = [game.venue.coordinates.lng, game.venue.coordinates.lat];
    } else {
      console.warn('No coordinates for game:', game);
      return null;
    }

    // Create custom marker element
    const markerElement = this.createSportMarker(game);
    
    // Create popup content
    const popupContent = this.createPopupContent(game);
    
    // Create Mapbox marker
    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat(coordinates)
      .setPopup(new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        className: 'sport-popup'
      }).setHTML(popupContent));

    // Store marker reference
    this.markers.push({
      marker: marker,
      game: game,
      sport: game.sport || game.type || 'other'
    });

    // Add click handler
    markerElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleMarkerClick(game);
    });

    // Add to map if no filters or sport matches filter
    if (this.activeFilters.size === 0 || this.activeFilters.has(game.sport || game.type)) {
      marker.addTo(this.map);
    }

    return marker;
  }

  // Create popup content for a game
  createPopupContent(game) {
    const sportIcon = SportIcons.getIcon(game.sport || game.type);
    const attendeesText = game.attendees !== undefined 
      ? `${game.attendees}/${game.maxAttendees || 20} players` 
      : 'Open game';
      
    const timeStr = game.startTime 
      ? new Date(game.startTime).toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        }) 
      : 'Time TBD';

    return `
      <div class="sport-popup-content">
        <div class="popup-header" style="background-color: ${sportIcon.color};">
          <span class="popup-icon">${SportIcons.createInlineSVG(game.sport || game.type, 24, '#ffffff')}</span>
          <h3>${game.title || game.sport || game.type}</h3>
          ${game.isLive ? '<span class="live-badge">LIVE</span>' : ''}
        </div>
        
        <div class="popup-body">
          <div class="popup-info">
            <span class="info-icon">📍</span>
            <span>${game.venue?.name || game.location || 'Unknown venue'}</span>
          </div>
          
          <div class="popup-info">
            <span class="info-icon">🕒</span>
            <span>${timeStr}</span>
          </div>
          
          <div class="popup-info">
            <span class="info-icon">👥</span>
            <span>${attendeesText}</span>
          </div>
          
          ${game.distance ? `
            <div class="popup-info">
              <span class="info-icon">📏</span>
              <span>${game.distance.toFixed(1)} km away</span>
            </div>
          ` : ''}
          
          ${game.skillLevel ? `
            <div class="popup-info">
              <span class="info-icon">⭐</span>
              <span>${game.skillLevel} level</span>
            </div>
          ` : ''}
          
          ${game.price !== undefined ? `
            <div class="popup-info">
              <span class="info-icon">💵</span>
              <span>${game.price === 0 ? 'FREE' : `$${game.price}`}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="popup-actions">
          <button class="popup-btn primary" onclick="window.handleJoinGame('${game.id}')">
            Join Game
          </button>
          <button class="popup-btn secondary" onclick="window.handleGameDetails('${game.id}')">
            View Details
          </button>
        </div>
      </div>
    `;
  }

  // Add multiple game markers
  addGameMarkers(games) {
    // Clear existing markers first
    this.clearMarkers();
    
    // Add each game marker
    games.forEach(game => {
      this.addGameMarker(game);
    });

    // Update cluster source with game data
    this.updateClusterSource(games);
    
    // Fit map to show all markers
    if (games.length > 0) {
      this.fitMapToGames(games);
    }
  }

  // Update cluster source with game data
  updateClusterSource(games) {
    const features = games.map(game => {
      let coordinates;
      if (game.coords) {
        coordinates = [game.coords[1], game.coords[0]];
      } else if (game.venue?.coordinates) {
        coordinates = [game.venue.coordinates.lng, game.venue.coordinates.lat];
      } else {
        return null;
      }

      return {
        type: 'Feature',
        properties: {
          id: game.id,
          sport: game.sport || game.type || 'other',
          title: game.title || game.sport,
          isLive: game.isLive || false
        },
        geometry: {
          type: 'Point',
          coordinates: coordinates
        }
      };
    }).filter(f => f !== null);

    this.map.getSource('sport-games').setData({
      type: 'FeatureCollection',
      features: features
    });
  }

  // Clear all markers from the map
  clearMarkers() {
    this.markers.forEach(({ marker }) => {
      marker.remove();
    });
    this.markers = [];
  }

  // Filter markers by sport
  filterBySport(sports) {
    // Update active filters
    this.activeFilters = new Set(sports);
    
    // Show/hide markers based on filter
    this.markers.forEach(({ marker, sport }) => {
      if (this.activeFilters.size === 0 || this.activeFilters.has(sport)) {
        marker.addTo(this.map);
      } else {
        marker.remove();
      }
    });

    // Update cluster filter
    if (this.activeFilters.size > 0) {
      this.map.setFilter('sport-clusters', [
        'all',
        ['has', 'point_count'],
        ['in', ['get', 'sport'], ['literal', Array.from(this.activeFilters)]]
      ]);
    } else {
      this.map.setFilter('sport-clusters', ['has', 'point_count']);
    }
  }

  // Setup filter controls UI
  setupFilterControls() {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'mapbox-sport-filter';
    filterContainer.innerHTML = `
      <div class="sport-filter-header">
        <h4>Filter by Sport</h4>
        <button class="filter-clear" onclick="window.mapboxSportMarkers.clearFilters()">Clear All</button>
      </div>
      <div class="sport-filter-list"></div>
    `;
    
    // Get all available sports
    const sports = SportIcons.getAllSports().filter(s => s.id !== 'other');
    const filterList = filterContainer.querySelector('.sport-filter-list');
    
    sports.forEach(sport => {
      const filterItem = document.createElement('label');
      filterItem.className = 'sport-filter-item';
      filterItem.innerHTML = `
        <input type="checkbox" value="${sport.id}" checked>
        <span class="filter-icon">${SportIcons.createInlineSVG(sport.id, 20)}</span>
        <span class="filter-label">${sport.name}</span>
      `;
      
      filterItem.querySelector('input').addEventListener('change', (e) => {
        this.handleFilterChange();
      });
      
      filterList.appendChild(filterItem);
    });
    
    // Add to map as custom control
    this.map.addControl({
      onAdd: () => filterContainer,
      onRemove: () => {}
    }, 'top-left');
  }

  // Handle filter changes
  handleFilterChange() {
    const checkedSports = Array.from(
      document.querySelectorAll('.sport-filter-item input:checked')
    ).map(input => input.value);
    
    this.filterBySport(checkedSports);
  }

  // Clear all filters
  clearFilters() {
    document.querySelectorAll('.sport-filter-item input').forEach(input => {
      input.checked = true;
    });
    this.filterBySport([]);
  }

  // Fit map to show all games
  fitMapToGames(games) {
    const bounds = new mapboxgl.LngLatBounds();
    
    games.forEach(game => {
      if (game.coords) {
        bounds.extend([game.coords[1], game.coords[0]]);
      } else if (game.venue?.coordinates) {
        bounds.extend([game.venue.coordinates.lng, game.venue.coordinates.lat]);
      }
    });
    
    this.map.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      maxZoom: 15
    });
  }

  // Handle marker click
  handleMarkerClick(game) {
    if (this.markerClickHandlers.has(game.id)) {
      const handler = this.markerClickHandlers.get(game.id);
      handler(game);
    }
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('sportMarkerClick', { 
      detail: { game } 
    }));
  }

  // Register click handler for a game
  onMarkerClick(gameId, handler) {
    this.markerClickHandlers.set(gameId, handler);
  }

  // Get marker by game ID
  getMarkerByGameId(gameId) {
    const markerData = this.markers.find(m => m.game.id === gameId);
    return markerData ? markerData.marker : null;
  }

  // Highlight a specific game marker
  highlightMarker(gameId) {
    const marker = this.getMarkerByGameId(gameId);
    if (marker) {
      // Center map on marker
      this.map.flyTo({
        center: marker.getLngLat(),
        zoom: 15,
        duration: 1000
      });
      
      // Open popup
      marker.togglePopup();
      
      // Add highlight class
      const element = marker.getElement();
      element.classList.add('highlighted');
      
      // Remove highlight after delay
      setTimeout(() => {
        element.classList.remove('highlighted');
      }, 3000);
    }
  }

  // Add marker animation
  animateMarkerDrop(marker, delay = 0) {
    const element = marker.getElement();
    element.style.opacity = '0';
    element.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
      element.style.transition = 'all 0.5s ease';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, delay);
  }

  // Create a legend for the map
  createLegend() {
    const legend = document.createElement('div');
    legend.className = 'mapbox-sport-legend';
    legend.innerHTML = '<h4>Sports</h4>';
    
    const sports = SportIcons.getAllSports().filter(s => s.id !== 'other');
    sports.forEach(sport => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `
        <span class="legend-icon">${SportIcons.createInlineSVG(sport.id, 16)}</span>
        <span class="legend-label">${sport.name}</span>
      `;
      legend.appendChild(item);
    });
    
    return legend;
  }
}

// Add styles for the sport markers and UI
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  /* Sport marker styles */
  .mapbox-sport-marker {
    will-change: transform;
  }
  
  .mapbox-sport-marker.highlighted {
    animation: bounce 0.5s ease infinite alternate;
  }
  
  @keyframes bounce {
    from { transform: translateY(0); }
    to { transform: translateY(-5px); }
  }
  
  /* Popup styles */
  .sport-popup .mapboxgl-popup-content {
    padding: 0;
    border-radius: 8px;
    overflow: hidden;
    min-width: 280px;
  }
  
  .sport-popup-content {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .popup-header {
    padding: 12px 16px;
    color: white;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .popup-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    flex: 1;
  }
  
  .popup-icon {
    display: flex;
    align-items: center;
  }
  
  .live-badge {
    background: #ff0000;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: bold;
    animation: pulse 2s infinite;
  }
  
  .popup-body {
    padding: 16px;
  }
  
  .popup-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 14px;
    color: #333;
  }
  
  .info-icon {
    font-size: 16px;
    width: 20px;
    text-align: center;
  }
  
  .popup-actions {
    padding: 12px 16px;
    border-top: 1px solid #e0e0e0;
    display: flex;
    gap: 8px;
  }
  
  .popup-btn {
    flex: 1;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .popup-btn.primary {
    background: #007bff;
    color: white;
  }
  
  .popup-btn.primary:hover {
    background: #0056b3;
  }
  
  .popup-btn.secondary {
    background: #f8f9fa;
    color: #333;
    border: 1px solid #ddd;
  }
  
  .popup-btn.secondary:hover {
    background: #e9ecef;
  }
  
  /* Filter controls */
  .mapbox-sport-filter {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    padding: 16px;
    margin: 10px;
    max-width: 200px;
  }
  
  .sport-filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .sport-filter-header h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }
  
  .filter-clear {
    background: none;
    border: none;
    color: #007bff;
    cursor: pointer;
    font-size: 12px;
    padding: 0;
  }
  
  .filter-clear:hover {
    text-decoration: underline;
  }
  
  .sport-filter-list {
    max-height: 300px;
    overflow-y: auto;
  }
  
  .sport-filter-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    cursor: pointer;
  }
  
  .sport-filter-item:hover {
    background: #f8f9fa;
    margin: 0 -8px;
    padding: 6px 8px;
  }
  
  .sport-filter-item input {
    cursor: pointer;
  }
  
  .filter-icon {
    display: flex;
    align-items: center;
  }
  
  .filter-label {
    font-size: 13px;
    color: #333;
  }
  
  /* Legend styles */
  .mapbox-sport-legend {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    padding: 16px;
    margin: 10px;
  }
  
  .mapbox-sport-legend h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  
  .legend-icon {
    display: flex;
    align-items: center;
  }
  
  .legend-label {
    font-size: 12px;
    color: #666;
  }
`;
document.head.appendChild(styleSheet);

// Create global instance and helper functions
window.MapboxSportMarkers = MapboxSportMarkers;

// Helper function to initialize sport markers on existing map
window.initializeMapboxSportMarkers = async function(map) {
  const sportMarkers = new MapboxSportMarkers(map);
  await sportMarkers.initialize();
  window.mapboxSportMarkers = sportMarkers;
  return sportMarkers;
};

// Global handlers for popup buttons
window.handleJoinGame = function(gameId) {
  window.dispatchEvent(new CustomEvent('joinGame', { detail: { gameId } }));
};

window.handleGameDetails = function(gameId) {
  window.dispatchEvent(new CustomEvent('showGameDetails', { detail: { gameId } }));
};

console.log('MapboxSportMarkers module loaded');