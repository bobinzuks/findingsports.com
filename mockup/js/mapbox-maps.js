// Mapbox GL JS implementation for Finding Sports

// Mapbox instance and markers
let mapboxMap = null;
let mapboxMarkers = [];
let userLocationMarker = null;

// Load Mapbox CSS dynamically
function loadMapboxCSS() {
  if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.css';
    document.head.appendChild(link);
  }
}

// Load Mapbox JS dynamically
function loadMapboxJS() {
  return new Promise((resolve, reject) => {
    if (window.mapboxgl) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Initialize Mapbox Map
window.initializeMapboxMap = async function(userLocation, mapElementId = 'map') {
  try {
    // Load CSS and JS
    loadMapboxCSS();
    await loadMapboxJS();

    // Validate configuration
    if (!await window.validateMapboxConfig()) {
      throw new Error('Invalid Mapbox configuration');
    }

    const mapElement = document.getElementById(mapElementId);
    if (!mapElement) {
      console.error('Map element not found:', mapElementId);
      return;
    }

    // Set access token
    mapboxgl.accessToken = await window.getMapboxAccessToken();

    // Use detected location or default
    const center = userLocation 
      ? [userLocation[1], userLocation[0]] // Mapbox uses [lng, lat]
      : window.MAPBOX_CONFIG.defaultCenter;
    
    const zoom = userLocation 
      ? window.MAPBOX_CONFIG.defaultZoom + 1 
      : window.MAPBOX_CONFIG.defaultZoom;

    // Get style based on dark mode preference
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    const styleUrl = isDarkMode 
      ? window.MAPBOX_CONFIG.styles.dark 
      : window.MAPBOX_CONFIG.styles.light;

    // Initialize map
    mapboxMap = new mapboxgl.Map({
      container: mapElementId,
      style: styleUrl,
      center: center,
      zoom: zoom,
      minZoom: window.MAPBOX_CONFIG.minZoom,
      maxZoom: window.MAPBOX_CONFIG.maxZoom,
      pitch: 0,
      bearing: 0,
      interactive: true
    });

    // Add controls
    if (window.MAPBOX_CONFIG.controls.navigation) {
      mapboxMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    if (window.MAPBOX_CONFIG.controls.geolocate) {
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      });
      mapboxMap.addControl(geolocateControl, 'top-right');
    }

    if (window.MAPBOX_CONFIG.controls.scale) {
      mapboxMap.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
    }

    if (window.MAPBOX_CONFIG.controls.fullscreen) {
      mapboxMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    }

    // Wait for map to load
    mapboxMap.on('load', () => {
      console.log('Mapbox map loaded successfully');
      
      // Add user location marker if available
      if (userLocation && window.locationService?.userLocation) {
        addUserLocationMarker({
          lat: userLocation[0],
          lng: userLocation[1]
        });
      }

      // Dispatch event for compatibility
      window.dispatchEvent(new Event('mapboxmapsloaded'));
    });

    // Store map instance globally
    window.mapboxMap = mapboxMap;
    window.map = mapboxMap; // For compatibility

  } catch (error) {
    console.error('Failed to initialize Mapbox:', error);
    handleMapError(mapElementId);
  }
};

// Add user location marker
function addUserLocationMarker(position) {
  if (userLocationMarker) {
    userLocationMarker.remove();
  }

  // Create a custom marker element
  const el = document.createElement('div');
  el.className = 'user-location-marker';
  el.style.width = '20px';
  el.style.height = '20px';
  el.style.borderRadius = '50%';
  el.style.backgroundColor = window.MAPBOX_CONFIG.markers.userLocation.color;
  el.style.border = '3px solid white';
  el.style.boxShadow = '0 0 10px rgba(33, 150, 243, 0.5)';
  el.style.cursor = 'pointer';

  userLocationMarker = new mapboxgl.Marker(el)
    .setLngLat([position.lng, position.lat])
    .setPopup(new mapboxgl.Popup({ offset: 25 })
      .setHTML('<h4>Your Location</h4>'))
    .addTo(mapboxMap);
}

// Clear all markers
window.clearMapboxMarkers = function() {
  mapboxMarkers.forEach(marker => {
    marker.remove();
  });
  mapboxMarkers = [];
};

// Add game marker
window.addMapboxGameMarker = function(game) {
  let position;

  if (game.coords) {
    position = { lat: game.coords[0], lng: game.coords[1] };
  } else if (game.venue?.coordinates) {
    position = {
      lat: game.venue.coordinates.lat,
      lng: game.venue.coordinates.lng
    };
  } else {
    return; // No coordinates available
  }

  // Get sport color
  const color = window.MAPBOX_CONFIG.markers.sports[game.type || game.sport] || 
                window.MAPBOX_CONFIG.markers.sports.default;

  // Create custom marker element
  const el = document.createElement('div');
  el.className = 'game-marker';
  el.style.width = '30px';
  el.style.height = '30px';
  el.style.borderRadius = '50%';
  el.style.backgroundColor = color;
  el.style.border = '2px solid white';
  el.style.cursor = 'pointer';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.color = 'white';
  el.style.fontWeight = 'bold';
  el.style.fontSize = '14px';
  el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

  // Add sport icon or initial
  const sportIcons = {
    basketball: '🏀',
    soccer: '⚽',
    volleyball: '🏐',
    tennis: '🎾',
    hockey: '🏒'
  };
  el.innerHTML = sportIcons[game.type || game.sport] || 
                 (game.type || game.sport || 'G').charAt(0).toUpperCase();

  // Create popup content
  const attendeesText = game.attendees !== undefined 
    ? `${game.attendees}/${game.maxAttendees || 20} players` 
    : 'Open game';

  const timeStr = game.startTime 
    ? new Date(game.startTime).toLocaleString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit'
      }) 
    : 'Time TBD';

  const popupContent = `
    <div style="padding: 10px; min-width: 200px;">
      <h4 style="margin: 0 0 8px 0; color: ${color};">${game.title || game.type}</h4>
      <p style="margin: 4px 0;">📍 ${game.venue?.name || game.location || 'Unknown venue'}</p>
      <p style="margin: 4px 0;">🕒 ${timeStr}</p>
      <p style="margin: 4px 0;">👥 ${attendeesText}</p>
      ${game.host ? `<p style="margin: 4px 0; color: #666;">Host: ${game.host}</p>` : ''}
      <button onclick="window.showGameDetails(${JSON.stringify(game).replace(/"/g, '&quot;')})" 
              style="margin-top: 8px; padding: 6px 12px; background: ${color}; color: white; border: none; border-radius: 4px; cursor: pointer;">
        View Details
      </button>
    </div>
  `;

  // Create marker with popup
  const marker = new mapboxgl.Marker(el)
    .setLngLat([position.lng, position.lat])
    .setPopup(new mapboxgl.Popup(window.MAPBOX_CONFIG.popup)
      .setHTML(popupContent))
    .addTo(mapboxMap);

  mapboxMarkers.push(marker);
  return marker;
};

// Fit map to show all markers
window.fitMapToMarkers = function() {
  if (!mapboxMap || mapboxMarkers.length === 0) return;

  const bounds = new mapboxgl.LngLatBounds();

  // Include game markers
  mapboxMarkers.forEach(marker => {
    bounds.extend(marker.getLngLat());
  });

  // Include user location if available
  if (userLocationMarker) {
    bounds.extend(userLocationMarker.getLngLat());
  }

  mapboxMap.fitBounds(bounds, {
    padding: { top: 50, bottom: 50, left: 50, right: 50 },
    maxZoom: 15
  });
};

// Handle map errors
function handleMapError(mapElementId) {
  const mapElement = document.getElementById(mapElementId);
  if (mapElement) {
    mapElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #1a1a1a; color: #757575;">
        <div style="text-align: center;">
          <p style="font-size: 1.2em; margin-bottom: 10px;">Unable to load map</p>
          <p style="font-size: 0.9em;">Please check your configuration and try again.</p>
          <button onclick="location.reload()" 
                  style="margin-top: 15px; padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
}

// Update map style based on dark mode
window.updateMapboxStyle = function(isDarkMode) {
  if (!mapboxMap) return;
  
  const styleUrl = isDarkMode 
    ? window.MAPBOX_CONFIG.styles.dark 
    : window.MAPBOX_CONFIG.styles.light;
  
  mapboxMap.setStyle(styleUrl);
};

// Export for compatibility with existing code
window.mapboxModule = {
  initializeMap: window.initializeMapboxMap,
  clearMarkers: window.clearMapboxMarkers,
  addGameMarker: window.addMapboxGameMarker,
  fitToMarkers: window.fitMapToMarkers,
  updateStyle: window.updateMapboxStyle
};