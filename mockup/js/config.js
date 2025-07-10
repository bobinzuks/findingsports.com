// Configuration for Finding Sports app

// Google Maps API Configuration
// IMPORTANT: Replace with your own API key in production
// To get an API key:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select existing
// 3. Enable "Maps JavaScript API"
// 4. Create credentials (API Key)
// 5. Restrict the key to your domain(s) for security

window.APP_CONFIG = {
    // Google Maps API Key
    GOOGLE_MAPS_API_KEY: 'AIzaSyBqVDmKw7sY5lqqOJlk1b5cMYjCXf-xlG4',

    // Enable/disable map providers
    ENABLE_GOOGLE_MAPS: true,
    ENABLE_LEAFLET_FALLBACK: true,

    // Default map settings
    DEFAULT_MAP_CENTER: [49.2827, -123.1207], // Vancouver
    DEFAULT_MAP_ZOOM: 12,

    // API endpoints
    API_BASE_URL: window.location.hostname === 'localhost' ?
        'http://localhost:3000' :
        window.location.origin,
        
    // Additional settings
    API_URL: window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api',
    WS_URL: window.location.hostname === 'localhost' ? 'ws://localhost:3000' : `wss://${window.location.host}`,
    ENABLE_MOCK_DATA: false,
    DEBUG_MODE: window.location.hostname === 'localhost'
};

// Override Google Maps API key if set in window
if (window.GOOGLE_MAPS_API_KEY) {
    window.APP_CONFIG.GOOGLE_MAPS_API_KEY = window.GOOGLE_MAPS_API_KEY;
}
