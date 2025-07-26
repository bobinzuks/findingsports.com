// Configuration for Finding Sports app

window.APP_CONFIG = {
  // Map Configuration - Using OpenStreetMap/Leaflet only
  // Google Maps has been removed from this project
  ENABLE_GOOGLE_MAPS: false,
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
