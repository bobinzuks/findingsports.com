// Map Cleanup Script - Removes all Google Maps and old Mapbox references
(function() {
  'use strict';

  // List of scripts to remove
  const scriptsToRemove = [
    'maps.googleapis.com',
    'google.com/maps',
    'gstatic.com',
    'mapbox-gl.js',
    'mapbox.com',
    'map-init.js',
    'map-init-fix.js',
    'map-resize-fix.js',
    'map-resize-ultimate-fix.js',
    'map-debug.js',
    'dark-mode-fix.js',
    'play-now-maps.js',
    'mapbox-maps.js',
    'mapbox-config.js',
    'google-maps-loader.js'
  ];

  // List of CSS to remove
  const cssToRemove = [
    'mapbox-gl.css',
    'map-container-fix.css',
    'map-stable.css',
    'dark-mode-maps.css',
    'play-now-maps.css'
  ];

  // Remove scripts
  scriptsToRemove.forEach(scriptSrc => {
    const scripts = document.querySelectorAll(`script[src*="${scriptSrc}"]`);
    scripts.forEach(script => {
      console.log(`Removing script: ${script.src}`);
      script.remove();
    });
  });

  // Remove CSS
  cssToRemove.forEach(cssSrc => {
    const links = document.querySelectorAll(`link[href*="${cssSrc}"]`);
    links.forEach(link => {
      console.log(`Removing CSS: ${link.href}`);
      link.remove();
    });
  });

  // Clean up global variables
  const globalVarsToDelete = [
    'google',
    'gapi',
    'mapboxgl',
    'mapboxMap',
    'initializePlayNowMap',
    'initializeMapboxMap',
    'updatePlayNowMarkers',
    'MAPBOX_ACCESS_TOKEN',
    'MAPBOX_CONFIG'
  ];

  globalVarsToDelete.forEach(varName => {
    if (window.hasOwnProperty(varName)) {
      console.log(`Deleting global variable: ${varName}`);
      delete window[varName];
    }
  });

  // Remove any inline scripts with Google Maps references
  const inlineScripts = document.querySelectorAll('script:not([src])');
  inlineScripts.forEach(script => {
    if (script.textContent.includes('google.maps') || 
        script.textContent.includes('mapbox') ||
        script.textContent.includes('initMap')) {
      console.log('Removing inline script with map references');
      script.remove();
    }
  });

  console.log('Map cleanup completed - all Google Maps and Mapbox code removed');
})();