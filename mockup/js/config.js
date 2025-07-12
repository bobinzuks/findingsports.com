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
    // NOTE: Replace YOUR_API_KEY_HERE with your actual Google Maps API key
    // To update: Change 'YOUR_API_KEY_HERE' to your key (e.g., 'AIzaSy...')
    GOOGLE_MAPS_API_KEY: 'AIzaSyD2ux0PIekUQLAqVDNhy0tHwhBht6vcXqA',
    
    // Alternative: Disable Google Maps and use Leaflet
    // GOOGLE_MAPS_API_KEY: '',

    // Enable/disable map providers
    // Set ENABLE_GOOGLE_MAPS to false if you don't have a valid API key
    ENABLE_GOOGLE_MAPS: true,
    ENABLE_LEAFLET_FALLBACK: true,

    // Default map settings
    DEFAULT_MAP_CENTER: [49.2827, -123.1207], // Vancouver
    DEFAULT_MAP_ZOOM: 12,

    // API endpoints
    API_BASE_URL: window.location.hostname === 'localhost' ?
        'http://localhost:8080' :
        window.location.origin,
        
    // Additional settings
    API_URL: window.location.hostname === 'localhost' ? 'http://localhost:8080/api' : '/api',
    WS_URL: window.location.hostname === 'localhost' ? 'ws://localhost:8080' : `wss://${window.location.host}`,
    ENABLE_MOCK_DATA: false,
    DEBUG_MODE: window.location.hostname === 'localhost'
};

// Override Google Maps API key if set in window
if (window.GOOGLE_MAPS_API_KEY) {
    window.APP_CONFIG.GOOGLE_MAPS_API_KEY = window.GOOGLE_MAPS_API_KEY;
}
