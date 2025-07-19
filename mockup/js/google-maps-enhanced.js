// Enhanced Google Maps implementation with stable zoom and dark mode toggle

// Map themes
const mapThemes = {
  dark: [
    { elementType: 'geometry', stylers: [{ color: '#212121' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
    {
      featureType: 'administrative',
      elementType: 'geometry',
      stylers: [{ color: '#757575' }]
    },
    {
      featureType: 'administrative.country',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9e9e9e' }]
    },
    {
      featureType: 'administrative.land_parcel',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#bdbdbd' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#757575' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#181818' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#616161' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#1b1b1b' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry.fill',
      stylers: [{ color: '#2c2c2c' }]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#8a8a8a' }]
    },
    {
      featureType: 'road.arterial',
      elementType: 'geometry',
      stylers: [{ color: '#373737' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#3c3c3c' }]
    },
    {
      featureType: 'road.highway.controlled_access',
      elementType: 'geometry',
      stylers: [{ color: '#4e4e4e' }]
    },
    {
      featureType: 'road.local',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#616161' }]
    },
    {
      featureType: 'transit',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#757575' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#000000' }]
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#3d3d3d' }]
    }
  ],
  light: [] // Default Google Maps theme
};

// Google Maps instance and markers
let googleMap = null;
let googleMarkers = [];
let infoWindow = null;
let userLocationMarker = null;
let currentTheme = 'dark';
let mapInitialized = false;
let zoomChangedTimer = null;

// Store map state to prevent zoom issues
let mapState = {
  center: null,
  zoom: 13,
  bounds: null,
  isUserInteracting: false
};

// Initialize Google Maps with enhanced stability
window.initializeGoogleMap = function (userLocation, mapElementId = 'map') {
  // Check if Google Maps API is loaded
  if (typeof google === 'undefined' || !google.maps) {
    console.log('Google Maps API not loaded yet, waiting...');
    showMapLoading(mapElementId);

    // Wait for Google Maps to load and retry
    window.addEventListener('googlemapsloaded', () => {
      window.initializeGoogleMap(userLocation, mapElementId);
    });
    return;
  }

  try {
    const mapElement = document.getElementById(mapElementId);
    if (!mapElement) {
      console.error('Map element not found:', mapElementId);
      return;
    }

    // Use detected location or default to Vancouver
    const defaultCenter = userLocation ?
      { lat: userLocation[0], lng: userLocation[1] } :
      { lat: 49.2827, lng: -123.1207 };

    mapState.center = defaultCenter;
    mapState.zoom = userLocation ? 13 : 12;

    // Initialize map with enhanced options
    googleMap = new google.maps.Map(mapElement, {
      center: defaultCenter,
      zoom: mapState.zoom,
      styles: mapThemes[currentTheme],
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true,
      // Enhanced gesture handling to prevent zoom issues
      gestureHandling: 'greedy',
      // Disable double click zoom to prevent accidental zooming
      disableDoubleClickZoom: false,
      // Smooth zoom animation
      scrollwheel: true,
      // Minimum and maximum zoom levels
      minZoom: 10,
      maxZoom: 18,
      // Restrict bounds to Vancouver area (optional)
      restriction: {
        latLngBounds: {
          north: 49.5,
          south: 49.0,
          east: -122.5,
          west: -123.5
        },
        strictBounds: false
      }
    });

    // Add event listeners to track user interaction
    googleMap.addListener('dragstart', () => {
      mapState.isUserInteracting = true;
    });

    googleMap.addListener('dragend', () => {
      mapState.isUserInteracting = false;
      mapState.center = googleMap.getCenter();
    });

    googleMap.addListener('zoom_changed', () => {
      // Debounce zoom changes to prevent rapid zooming
      clearTimeout(zoomChangedTimer);
      zoomChangedTimer = setTimeout(() => {
        const newZoom = googleMap.getZoom();
        if (Math.abs(newZoom - mapState.zoom) > 0.5) {
          mapState.zoom = newZoom;
        }
      }, 100);
    });

    // Initialize info window
    infoWindow = new google.maps.InfoWindow();

    // Add user location marker if available
    if (userLocation && window.locationService?.userLocation) {
      addUserLocationMarker({
        lat: userLocation[0],
        lng: userLocation[1]
      });
    }

    // Add dark mode toggle button
    addDarkModeToggle();

    // Store map instance globally
    window.googleMap = googleMap;
    window.map = googleMap; // For compatibility
    mapInitialized = true;

    console.log('Google Maps initialized successfully with enhanced stability');
  } catch (error) {
    console.error('Failed to initialize Google Maps:', error);
    handleMapError(mapElementId);
  }
};

// Add dark mode toggle button to map
function addDarkModeToggle() {
  const toggleDiv = document.createElement('div');
  toggleDiv.className = 'dark-mode-toggle';
  toggleDiv.innerHTML = `
        <button id="darkModeToggle" class="map-theme-toggle" title="Toggle Dark Mode">
            <span class="theme-icon">${currentTheme === 'dark' ? '☀️' : '🌙'}</span>
        </button>
    `;

  // Add CSS for the toggle button
  const style = document.createElement('style');
  style.textContent = `
        .dark-mode-toggle {
            position: absolute;
            top: 10px;
            right: 60px;
            z-index: 1000;
        }
        .map-theme-toggle {
            background: white;
            border: 2px solid rgba(0,0,0,0.2);
            border-radius: 4px;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 18px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .map-theme-toggle:hover {
            background: #f5f5f5;
            transform: scale(1.05);
        }
        .map-theme-toggle:active {
            transform: scale(0.95);
        }
        .theme-icon {
            display: inline-block;
            transition: transform 0.3s ease;
        }
        .theme-rotating {
            transform: rotate(360deg);
        }
    `;
  document.head.appendChild(style);

  // Add toggle to map container
  const mapContainer = googleMap.getDiv();
  mapContainer.style.position = 'relative';
  mapContainer.appendChild(toggleDiv);

  // Add click handler
  document.getElementById('darkModeToggle').addEventListener('click', toggleMapTheme);
}

// Toggle between dark and light themes
function toggleMapTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';

  // Update map styles
  googleMap.setOptions({
    styles: mapThemes[currentTheme]
  });

  // Update toggle button with animation
  const toggleBtn = document.getElementById('darkModeToggle');
  const icon = toggleBtn.querySelector('.theme-icon');

  icon.classList.add('theme-rotating');
  setTimeout(() => {
    icon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    icon.classList.remove('theme-rotating');
  }, 150);

  // Save theme preference
  localStorage.setItem('mapTheme', currentTheme);

  // Update body class for coordinated theming
  document.body.classList.toggle('dark-map-mode', currentTheme === 'dark');
}

// Show loading state
function showMapLoading(mapElementId) {
  const mapElement = document.getElementById(mapElementId);
  if (mapElement) {
    mapElement.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #1a1a1a; color: #757575;">
                <div style="text-align: center;">
                    <p>Loading map...</p>
                    <div style="margin-top: 10px;">
                        <div style="width: 40px; height: 40px; border: 3px solid #757575; border-top-color: #ff6b35; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block;"></div>
                    </div>
                </div>
            </div>
        `;

    // Add spinning animation
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }
}

// Add user location marker with pulsing effect
function addUserLocationMarker(position) {
  if (userLocationMarker) {
    userLocationMarker.setMap(null);
  }

  userLocationMarker = new google.maps.Marker({
    position,
    map: googleMap,
    title: 'Your Location',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#2196F3',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3
    },
    zIndex: 1000,
    animation: google.maps.Animation.DROP
  });

  // Add pulsing effect
  addPulsingEffect(position);
}

// Add pulsing effect for user location
function addPulsingEffect(position) {
  const pulsingDiv = document.createElement('div');
  pulsingDiv.className = 'user-location-pulse';

  // Add CSS for pulsing effect
  const style = document.createElement('style');
  style.textContent = `
        .user-location-pulse {
            position: absolute;
            width: 40px;
            height: 40px;
            border: 2px solid #2196F3;
            border-radius: 50%;
            animation: pulse-ring 1.5s infinite;
            pointer-events: none;
        }
        @keyframes pulse-ring {
            0% {
                transform: scale(0.5);
                opacity: 1;
            }
            100% {
                transform: scale(1.5);
                opacity: 0;
            }
        }
    `;
  document.head.appendChild(style);

  const overlay = new google.maps.OverlayView();
  overlay.onAdd = function () {
    const panes = this.getPanes();
    panes.overlayLayer.appendChild(pulsingDiv);
  };

  overlay.draw = function () {
    const projection = this.getProjection();
    const pos = projection.fromLatLngToDivPixel(position);
    pulsingDiv.style.left = `${pos.x - 20}px`;
    pulsingDiv.style.top = `${pos.y - 20}px`;
  };

  overlay.setMap(googleMap);
}

// Clear all markers
window.clearGoogleMarkers = function () {
  googleMarkers.forEach(marker => {
    marker.setMap(null);
  });
  googleMarkers = [];
};

// Add game marker with enhanced interaction
window.addGoogleGameMarker = function (game) {
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

  // Sport-specific colors
  const sportColors = {
    basketball: '#FF6B35',
    soccer: '#4CAF50',
    volleyball: '#2196F3',
    tennis: '#9C27B0',
    hockey: '#00BCD4',
    default: '#757575'
  };

  const color = sportColors[game.type || game.sport] || sportColors.default;

  const marker = new google.maps.Marker({
    position,
    map: googleMap,
    title: game.title || game.type || 'Game',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: color,
      fillOpacity: 0.9,
      strokeColor: '#ffffff',
      strokeWeight: 2
    },
    animation: google.maps.Animation.DROP
  });

  // Create info window content
  const attendeesText = game.attendees !== undefined ?
    `${game.attendees}/${game.maxAttendees || 20} players` :
    'Open game';

  const timeStr = game.startTime ?
    new Date(game.startTime).toLocaleString('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit'
    }) :
    'Time TBD';

  const content = `
        <div style="padding: 10px; min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: ${color};">${game.title || game.type}</h4>
            <p style="margin: 4px 0; color: #333;">📍 ${game.venue?.name || game.location || 'Unknown venue'}</p>
            <p style="margin: 4px 0; color: #333;">🕒 ${timeStr}</p>
            <p style="margin: 4px 0; color: #333;">👥 ${attendeesText}</p>
            ${game.host ? `<p style="margin: 4px 0; color: #666;">Host: ${game.host}</p>` : ''}
            <button onclick="window.showGameDetails(${JSON.stringify(game).replace(/"/g, '&quot;')})" 
                    style="margin-top: 8px; padding: 6px 12px; background: ${color}; color: white; border: none; border-radius: 4px; cursor: pointer;">
                View Details
            </button>
        </div>
    `;

  marker.addListener('click', () => {
    infoWindow.setContent(content);
    infoWindow.open(googleMap, marker);

    // Smooth pan to marker
    googleMap.panTo(marker.getPosition());
  });

  // Add hover effect
  marker.addListener('mouseover', () => {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(() => {
      marker.setAnimation(null);
    }, 1000);
  });

  googleMarkers.push(marker);
  return marker;
};

// Fit map to show all markers with stable zoom
window.fitMapToMarkers = function () {
  if (!googleMap || googleMarkers.length === 0) return;

  // Don't adjust if user is interacting
  if (mapState.isUserInteracting) return;

  const bounds = new google.maps.LatLngBounds();

  // Include game markers
  googleMarkers.forEach(marker => {
    bounds.extend(marker.getPosition());
  });

  // Include user location if available
  if (userLocationMarker) {
    bounds.extend(userLocationMarker.getPosition());
  }

  // Fit bounds with padding
  googleMap.fitBounds(bounds, {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
  });

  // Limit zoom to prevent too much zoom
  setTimeout(() => {
    const zoom = googleMap.getZoom();
    if (zoom > 15) {
      googleMap.setZoom(15);
    } else if (zoom < 11) {
      googleMap.setZoom(11);
    }
    mapState.zoom = googleMap.getZoom();
  }, 300);
};

// Handle map errors
function handleMapError(mapElementId) {
  const mapElement = document.getElementById(mapElementId);
  if (mapElement) {
    mapElement.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #1a1a1a; color: #757575;">
                <div style="text-align: center;">
                    <p style="font-size: 1.2em; margin-bottom: 10px;">Unable to load map</p>
                    <p style="font-size: 0.9em;">Please check your internet connection and try again.</p>
                    <button onclick="location.reload()" 
                            style="margin-top: 15px; padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
  }
}

// Initialize theme from localStorage
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('mapTheme');
  if (savedTheme) {
    currentTheme = savedTheme;
    document.body.classList.toggle('dark-map-mode', currentTheme === 'dark');
  }
});

// Export enhanced module
window.googleMapsModule = {
  initializeMap: window.initializeGoogleMap,
  clearMarkers: window.clearGoogleMarkers,
  addGameMarker: window.addGoogleGameMarker,
  fitToMarkers: window.fitMapToMarkers,
  toggleTheme: toggleMapTheme,
  getCurrentTheme: () => currentTheme
};
