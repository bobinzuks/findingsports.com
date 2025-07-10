// Google Maps implementation with dark theme for Finding Sports

// Dark theme styles for Google Maps
const darkMapStyles = [
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
];

// Google Maps instance and markers
let googleMap = null;
let googleMarkers = [];
let infoWindow = null;
let userLocationMarker = null;

// Initialize Google Maps
window.initializeGoogleMap = function (userLocation, mapElementId = 'map') {
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || !google.maps) {
        console.error('Google Maps API not loaded');
        // Show fallback message
        const mapElement = document.getElementById(mapElementId);
        if (mapElement) {
            mapElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #1a1a1a; color: #757575;">
                    <div style="text-align: center;">
                        <p>Map loading...</p>
                        <p style="font-size: 0.9em; margin-top: 10px;">If the map doesn't load, please check your internet connection.</p>
                    </div>
                </div>
            `;
        }
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
        const defaultZoom = userLocation ? 13 : 12;

        // Initialize map
        googleMap = new google.maps.Map(mapElement, {
            center: defaultCenter,
            zoom: defaultZoom,
            styles: darkMapStyles,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true,
            gestureHandling: 'cooperative'
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

        // Store map instance globally
        window.googleMap = googleMap;
        window.map = googleMap; // For compatibility

        console.log('Google Maps initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
        handleMapError(mapElementId);
    }
};

// Add user location marker
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
        zIndex: 1000
    });

    // Add pulsing effect using CSS
    const pulsingDiv = document.createElement('div');
    pulsingDiv.className = 'user-location-pulse';

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

// Add game marker
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
        }
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
    });

    googleMarkers.push(marker);
    return marker;
};

// Fit map to show all markers
window.fitMapToMarkers = function () {
    if (!googleMap || googleMarkers.length === 0) { return; }

    const bounds = new google.maps.LatLngBounds();

    // Include game markers
    googleMarkers.forEach(marker => {
        bounds.extend(marker.getPosition());
    });

    // Include user location if available
    if (userLocationMarker) {
        bounds.extend(userLocationMarker.getPosition());
    }

    googleMap.fitBounds(bounds);

    // Don't zoom in too much for single markers
    const zoom = googleMap.getZoom();
    if (zoom > 15) {
        googleMap.setZoom(15);
    }
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

// Load Google Maps API
window.loadGoogleMapsAPI = function (apiKey) {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (typeof google !== 'undefined' && google.maps) {
            resolve();
            return;
        }

        // Create script element
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=onGoogleMapsReady`;
        script.async = true;
        script.defer = true;

        // Handle load error
        script.onerror = () => {
            console.error('Failed to load Google Maps API');
            reject(new Error('Failed to load Google Maps API'));
        };

        // Define callback
        window.onGoogleMapsReady = () => {
            console.log('Google Maps API loaded');
            resolve();
        };

        document.head.appendChild(script);
    });
};

// Export for use in other modules
window.googleMapsModule = {
    initializeMap: window.initializeGoogleMap,
    clearMarkers: window.clearGoogleMarkers,
    addGameMarker: window.addGoogleGameMarker,
    fitToMarkers: window.fitMapToMarkers,
    loadAPI: window.loadGoogleMapsAPI
};
