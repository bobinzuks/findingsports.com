// MapLibre GL JS Implementation for Finding Sports
// Fresh install replacing all Google Maps and Mapbox code

(function () {
  'use strict';

  // MapLibre instance and state
  let map = null;
  let userMarker = null;
  let gameMarkers = [];
  let gamesData = [];

  // MapLibre configuration
  const MAP_CONFIG = {
    // Using OpenStreetMap tiles for MapLibre
    style: {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [{
        id: 'osm-tiles',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19
      }]
    },
    defaultCenter: [-123.1207, 49.2827], // Vancouver, BC
    defaultZoom: 12,
    minZoom: 10,
    maxZoom: 18
  };

  // Sport colors for markers
  const SPORT_COLORS = {
    basketball: '#FF6B35',
    soccer: '#4CAF50',
    volleyball: '#2196F3',
    tennis: '#9C27B0',
    hockey: '#00BCD4',
    baseball: '#FFC107',
    football: '#795548',
    default: '#757575'
  };

  // Sport icons
  const SPORT_ICONS = {
    basketball: '🏀',
    soccer: '⚽',
    volleyball: '🏐',
    tennis: '🎾',
    hockey: '🏒',
    baseball: '⚾',
    football: '🏈',
    default: '🏃'
  };

  // Initialize MapLibre map
  window.initializeMapLibre = async function (containerId = 'map') {
    try {
      console.log('Initializing MapLibre for container:', containerId);
      
      // Check if MapLibre is loaded
      if (!window.maplibregl) {
        console.error('MapLibre GL JS not loaded, loading now...');
        await loadMapLibreGL();
      }

      const container = document.getElementById(containerId);
      if (!container) {
        console.error('Map container not found:', containerId);
        return;
      }

      // Clear existing content and ensure visibility
      container.innerHTML = '';
      container.style.display = 'block';
      container.style.width = '100%';
      container.style.height = container.style.height || '500px';
      container.style.position = 'relative';

      console.log('Creating MapLibre map instance...');
      
      // Create map instance
      map = new maplibregl.Map({
        container: containerId,
        style: MAP_CONFIG.style,
        center: MAP_CONFIG.defaultCenter,
        zoom: MAP_CONFIG.defaultZoom,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom
      });

      // Add controls
      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

      // Add geolocate control
      const geolocateControl = new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true,
        showAccuracyCircle: true
      });
      map.addControl(geolocateControl, 'top-right');

      // Handle map load
      map.on('load', () => {
        console.log('MapLibre map loaded successfully');

        // Get user location automatically
        geolocateControl.trigger();

        // Load games data
        loadGamesData();
      });

      // Handle geolocation
      geolocateControl.on('geolocate', e => {
        const userLocation = [e.coords.longitude, e.coords.latitude];
        console.log('User location:', userLocation);

        // Update user marker
        updateUserMarker(userLocation);

        // Center map on user
        map.flyTo({
          center: userLocation,
          zoom: 14,
          duration: 1500
        });
      });

      // Handle errors
      map.on('error', e => {
        console.error('MapLibre error:', e);
      });

      return map;
    } catch (error) {
      console.error('Error initializing MapLibre:', error);
      showMapError(error.message);
    }
  };

  // Load MapLibre GL JS library
  async function loadMapLibreGL() {
    // Load CSS
    if (!document.querySelector('link[href*="maplibre-gl.css"]')) {
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/maplibre-gl@4.0.0/dist/maplibre-gl.css';
      document.head.appendChild(cssLink);
    }

    // Load JS
    if (!window.maplibregl) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/maplibre-gl@4.0.0/dist/maplibre-gl.js';
        script.async = true;
        script.onload = () => {
          console.log('MapLibre GL JS loaded');
          resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
  }

  // Update user location marker
  function updateUserMarker(coordinates) {
    // Remove existing user marker
    if (userMarker) {
      userMarker.remove();
    }

    // Create custom user marker
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.innerHTML = `
      <div class="pulse-circle"></div>
      <div class="center-dot"></div>
    `;
    el.style.width = '30px';
    el.style.height = '30px';

    userMarker = new maplibregl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat(coordinates)
      .addTo(map);
  }

  // Load games data
  async function loadGamesData() {
    try {
      // Get games from API or use sample data
      const response = await fetch('/api/games/nearby');
      let games = [];

      if (response.ok) {
        const data = await response.json();
        games = data.games || [];
      } else {
        // Use sample data if API fails
        games = getSampleGames();
      }

      gamesData = games;
      displayGameMarkers(games);
    } catch (error) {
      console.error('Error loading games:', error);
      // Use sample data
      gamesData = getSampleGames();
      displayGameMarkers(gamesData);
    }
  }

  // Display game markers on map
  function displayGameMarkers(games) {
    // Clear existing markers
    clearGameMarkers();

    games.forEach((game, index) => {
      if (game.lat && game.lng) {
        const coordinates = [parseFloat(game.lng), parseFloat(game.lat)];

        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'game-marker';
        el.innerHTML = `
          <div class="marker-icon" style="background-color: ${SPORT_COLORS[game.sport?.toLowerCase()] || SPORT_COLORS.default}">
            <span class="sport-emoji">${SPORT_ICONS[game.sport?.toLowerCase()] || SPORT_ICONS.default}</span>
          </div>
        `;
        el.style.cursor = 'pointer';
        el.style.width = '40px';
        el.style.height = '40px';

        // Create marker
        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat(coordinates)
          .setPopup(createGamePopup(game))
          .addTo(map);

        // Add click handler
        el.addEventListener('click', () => {
          // Fly to marker
          map.flyTo({
            center: coordinates,
            zoom: 16,
            duration: 1000
          });
        });

        gameMarkers.push(marker);
      }
    });

    // Fit map to show all markers
    if (gameMarkers.length > 0) {
      const bounds = new maplibregl.LngLatBounds();

      // Add user location if available
      if (userMarker) {
        bounds.extend(userMarker.getLngLat());
      }

      // Add all game markers
      gameMarkers.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });

      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }

  // Create popup for game marker
  function createGamePopup(game) {
    const isLoggedIn = Boolean(localStorage.getItem('token'));

    const content = `
      <div class="game-popup" style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0; color: ${SPORT_COLORS[game.sport?.toLowerCase()] || SPORT_COLORS.default}">
          ${SPORT_ICONS[game.sport?.toLowerCase()] || SPORT_ICONS.default} ${game.sport || 'Sport'}
        </h3>
        <p style="margin: 5px 0;"><strong>${game.venue || 'Venue'}</strong></p>
        ${game.time ? `<p style="margin: 5px 0;">🕐 ${game.time}</p>` : ''}
        ${game.players ? `<p style="margin: 5px 0;">👥 ${game.players} players</p>` : ''}
        ${game.skillLevel ? `<p style="margin: 5px 0;">🎯 ${game.skillLevel}</p>` : ''}
        <div style="margin-top: 10px;">
          ${isLoggedIn ?
    `<button onclick="joinGame('${game.id}')" style="width: 100%; padding: 8px; background: ${SPORT_COLORS[game.sport?.toLowerCase()] || SPORT_COLORS.default}; color: white; border: none; border-radius: 4px; cursor: pointer;">Join Game</button>` :
    `<button onclick="requireLogin('${game.id}')" style="width: 100%; padding: 8px; background: #ccc; color: white; border: none; border-radius: 4px; cursor: pointer;">Login to Join</button>`
  }
        </div>
      </div>
    `;

    return new maplibregl.Popup({
      offset: 25,
      closeButton: true,
      className: 'game-popup-container'
    }).setHTML(content);
  }

  // Clear all game markers
  function clearGameMarkers() {
    gameMarkers.forEach(marker => marker.remove());
    gameMarkers = [];
  }

  // Show error message
  function showMapError(message) {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5;">
          <div style="text-align: center; padding: 20px;">
            <p style="color: #666; margin: 0;">⚠️ ${message}</p>
            <button onclick="window.initializeMapLibre()" style="margin-top: 10px; padding: 8px 16px; background: #FF6B35; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Retry
            </button>
          </div>
        </div>
      `;
    }
  }

  // Get sample games data
  function getSampleGames() {
    return [
      {
        id: '1',
        sport: 'Basketball',
        venue: 'Kitsilano Beach Courts',
        lat: 49.2747,
        lng: -123.1442,
        time: '6:00 PM',
        players: '5/10',
        skillLevel: 'Intermediate'
      },
      {
        id: '2',
        sport: 'Soccer',
        venue: 'UBC Fields',
        lat: 49.2606,
        lng: -123.2460,
        time: '7:00 PM',
        players: '14/22',
        skillLevel: 'All Levels'
      },
      {
        id: '3',
        sport: 'Volleyball',
        venue: 'English Bay',
        lat: 49.2863,
        lng: -123.1436,
        time: '5:30 PM',
        players: '4/6',
        skillLevel: 'Beginner'
      },
      {
        id: '4',
        sport: 'Tennis',
        venue: 'Queen Elizabeth Park',
        lat: 49.2418,
        lng: -123.1125,
        time: '6:30 PM',
        players: '2/4',
        skillLevel: 'Advanced'
      },
      {
        id: '5',
        sport: 'Hockey',
        venue: 'Hillcrest Centre',
        lat: 49.2447,
        lng: -123.1074,
        time: '8:00 PM',
        players: '10/20',
        skillLevel: 'Intermediate'
      }
    ];
  }

  // Add required CSS
  const style = document.createElement('style');
  style.textContent = `
    /* User location marker */
    .user-location-marker {
      position: relative;
    }
    
    .user-location-marker .pulse-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 30px;
      height: 30px;
      background: rgba(33, 150, 243, 0.3);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    .user-location-marker .center-dot {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 12px;
      height: 12px;
      background: #2196F3;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    @keyframes pulse {
      0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(2);
        opacity: 0;
      }
    }
    
    /* Game markers */
    .game-marker {
      position: relative;
    }
    
    .game-marker .marker-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: transform 0.2s;
    }
    
    .game-marker:hover .marker-icon {
      transform: scale(1.1);
    }
    
    .game-marker .sport-emoji {
      font-size: 20px;
    }
    
    /* Popup styles */
    .maplibregl-popup-content {
      border-radius: 8px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.2);
    }
    
    .game-popup h3 {
      font-family: 'Inter', sans-serif;
    }
    
    .game-popup button:hover {
      opacity: 0.9;
    }
  `;
  document.head.appendChild(style);

  // Export functions
  window.maplibreManager = {
    initialize: window.initializeMapLibre,
    updateUserLocation: updateUserMarker,
    loadGames: loadGamesData,
    clearMarkers: clearGameMarkers,
    getMap: () => map
  };
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM loaded, checking for map containers...');
      // Initialize main map if container exists
      if (document.getElementById('map')) {
        console.log('Found main map container, initializing...');
        window.initializeMapLibre('map');
      }
    });
  } else {
    // DOM already loaded
    console.log('DOM already loaded, checking for map containers...');
    if (document.getElementById('map')) {
      console.log('Found main map container, initializing...');
      window.initializeMapLibre('map');
    }
  }
})();
