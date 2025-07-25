// Mapbox GL JS Configuration for Finding Sports

// Mapbox configuration
window.MAPBOX_CONFIG = {
  // Access token should be set from environment or server-side
  accessToken: process.env.MAPBOX_ACCESS_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN_HERE',
  
  // Default map settings
  defaultCenter: [-123.1207, 49.2827], // Vancouver, BC
  defaultZoom: 12,
  minZoom: 10,
  maxZoom: 18,
  
  // Map styles
  styles: {
    dark: 'mapbox://styles/mapbox/dark-v11',
    light: 'mapbox://styles/mapbox/light-v11',
    streets: 'mapbox://styles/mapbox/streets-v12',
    outdoors: 'mapbox://styles/mapbox/outdoors-v12',
    custom: 'mapbox://styles/YOUR_USERNAME/YOUR_CUSTOM_STYLE_ID' // Replace with your custom style
  },
  
  // Default style
  defaultStyle: 'dark',
  
  // Map controls
  controls: {
    navigation: true,
    geolocate: true,
    scale: true,
    fullscreen: true,
    attribution: false // Mapbox attribution is required but can be styled
  },
  
  // Marker settings
  markers: {
    userLocation: {
      color: '#2196F3',
      scale: 1.2
    },
    sports: {
      basketball: '#FF6B35',
      soccer: '#4CAF50',
      volleyball: '#2196F3',
      tennis: '#9C27B0',
      hockey: '#00BCD4',
      default: '#757575'
    }
  },
  
  // Popup settings
  popup: {
    closeButton: true,
    closeOnClick: true,
    maxWidth: '300px',
    offset: 25
  }
};

// Helper function to get Mapbox access token securely
window.getMapboxAccessToken = async function() {
  // Try to get from window first (if already fetched)
  if (window.MAPBOX_ACCESS_TOKEN && window.MAPBOX_ACCESS_TOKEN !== 'YOUR_MAPBOX_ACCESS_TOKEN_HERE') {
    return window.MAPBOX_ACCESS_TOKEN;
  }
  
  // Fetch from server
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    
    if (config.mapboxAccessToken) {
      window.MAPBOX_ACCESS_TOKEN = config.mapboxAccessToken;
      return config.mapboxAccessToken;
    }
  } catch (error) {
    console.error('Failed to fetch Mapbox configuration:', error);
  }
  
  // Fallback (should not be used in production)
  return window.MAPBOX_CONFIG.accessToken || 'YOUR_MAPBOX_ACCESS_TOKEN_HERE';
};

// Validate Mapbox configuration
window.validateMapboxConfig = async function() {
  const token = await window.getMapboxAccessToken();
  if (!token || token === 'YOUR_MAPBOX_ACCESS_TOKEN_HERE') {
    console.warn('Mapbox access token not configured. Please set MAPBOX_ACCESS_TOKEN.');
    return false;
  }
  return true;
};