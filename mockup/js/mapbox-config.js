// Mapbox GL JS Configuration for Finding Sports

// Mapbox configuration
window.MAPBOX_CONFIG = {
  // Access token should be set from environment or server-side
  accessToken: 'pk.eyJ1IjoiZmluZGluZ3Nwb3J0cyIsImEiOiJjbTU5enI5ZHQwMDN4MmxwdzVoNnQzOWFwIn0.0-60Cv6Y-CepNS0R-fkD5w',
  
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

// Optimized helper function to get Mapbox access token with caching
window.getMapboxAccessToken = (function() {
  let cachedToken = null;
  let tokenPromise = null;
  
  return async function() {
    // Return cached token if available
    if (cachedToken && cachedToken !== 'YOUR_MAPBOX_ACCESS_TOKEN_HERE') {
      return cachedToken;
    }
    
    // Return existing promise if already fetching
    if (tokenPromise) {
      return tokenPromise;
    }
    
    // Create new fetch promise
    tokenPromise = (async () => {
      try {
        // Try localStorage cache first (valid for 1 hour)
        const cached = localStorage.getItem('mapbox_token_cache');
        if (cached) {
          const { token, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 3600000) { // 1 hour
            cachedToken = token;
            return token;
          }
        }
        
        // Fetch from server with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('/api/config', {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const config = await response.json();
          if (config.mapboxAccessToken) {
            cachedToken = config.mapboxAccessToken;
            // Cache for 1 hour
            localStorage.setItem('mapbox_token_cache', JSON.stringify({
              token: cachedToken,
              timestamp: Date.now()
            }));
            return cachedToken;
          }
        }
      } catch (error) {
        console.warn('Failed to fetch Mapbox configuration, using fallback:', error.message);
      } finally {
        tokenPromise = null;
      }
      
      // Fallback with working token
      cachedToken = window.MAPBOX_CONFIG.accessToken || 'pk.eyJ1IjoiZmluZGluZ3Nwb3J0cyIsImEiOiJjbTU5enI5ZHQwMDN4MmxwdzVoNnQzOWFwIn0.0-60Cv6Y-CepNS0R-fkD5w';
      return cachedToken;
    })();
    
    return tokenPromise;
  };
})();

// Optimized Mapbox configuration validation with performance tracking
window.validateMapboxConfig = (function() {
  let validationResult = null;
  let lastValidation = 0;
  
  return async function() {
    // Cache validation for 5 minutes
    if (validationResult !== null && Date.now() - lastValidation < 300000) {
      return validationResult;
    }
    
    const startTime = performance.now();
    const token = await window.getMapboxAccessToken();
    
    validationResult = !(!token || token === 'YOUR_MAPBOX_ACCESS_TOKEN_HERE' || token.length < 20);
    lastValidation = Date.now();
    
    if (!validationResult) {
      console.warn('Mapbox access token not configured. Please set MAPBOX_ACCESS_TOKEN.');
    }
    
    // Performance tracking
    const duration = performance.now() - startTime;
    if (duration > 100) {
      console.warn(`Slow Mapbox validation: ${duration.toFixed(2)}ms`);
    }
    
    return validationResult;
  };
})();

// Preload and cache token on page load
if (typeof window !== 'undefined' && document.readyState !== 'loading') {
  window.getMapboxAccessToken().catch(() => {}); // Silent preload
} else if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.getMapboxAccessToken().catch(() => {}); // Silent preload
  });
}