// Unified map initialization that can use either Google Maps or Mapbox
(function() {
  'use strict';

  // Configuration - set this to switch between map providers
  window.MAP_PROVIDER = 'mapbox'; // 'google' or 'mapbox'

  // Initialize the appropriate map based on configuration
  window.initializeMap = async function(userLocation) {
    console.log(`Initializing map with provider: ${window.MAP_PROVIDER}`);

    if (window.MAP_PROVIDER === 'mapbox') {
      // Use Mapbox
      if (window.initializeMapboxMap) {
        await window.initializeMapboxMap(userLocation);
      } else {
        console.error('Mapbox module not loaded');
      }
    } else {
      // Use Google Maps (fallback)
      if (window.initializeGoogleMap) {
        window.initializeGoogleMap(userLocation);
      } else {
        console.error('Google Maps module not loaded');
      }
    }
  };

  // Clear markers wrapper
  window.clearMarkers = function() {
    if (window.MAP_PROVIDER === 'mapbox' && window.clearMapboxMarkers) {
      window.clearMapboxMarkers();
    } else if (window.clearGoogleMarkers) {
      window.clearGoogleMarkers();
    }
  };

  // Add game marker wrapper
  window.addGameMarker = function(game) {
    if (window.MAP_PROVIDER === 'mapbox' && window.addMapboxGameMarker) {
      return window.addMapboxGameMarker(game);
    } else if (window.addGoogleGameMarker) {
      return window.addGoogleGameMarker(game);
    }
  };

  // Fit map to markers wrapper
  window.fitMapToMarkers = function() {
    if (window.MAP_PROVIDER === 'mapbox' && window.mapboxModule?.fitToMarkers) {
      window.mapboxModule.fitToMarkers();
    } else if (window.googleMapsModule?.fitToMarkers) {
      window.googleMapsModule.fitToMarkers();
    }
  };

  // Update map style for dark mode
  window.updateMapStyle = function(isDarkMode) {
    if (window.MAP_PROVIDER === 'mapbox' && window.updateMapboxStyle) {
      window.updateMapboxStyle(isDarkMode);
    }
    // Google Maps dark style is set during initialization
  };

  // Get the current map instance
  window.getMapInstance = function() {
    if (window.MAP_PROVIDER === 'mapbox') {
      return window.mapboxMap;
    } else {
      return window.googleMap || window.map;
    }
  };

  // Check if map is loaded
  window.isMapLoaded = function() {
    const mapInstance = window.getMapInstance();
    return !!mapInstance;
  };

  // Initialize Play Now map wrapper
  window.initializePlayNowMap = function(userLat, userLng, activities, allGames) {
    if (window.MAP_PROVIDER === 'mapbox') {
      // Convert Play Now data format for Mapbox
      const games = [];
      
      if (activities.happeningNow) {
        activities.happeningNow.forEach(game => {
          games.push({
            ...game,
            coords: [game.lat, game.lng],
            type: game.sport,
            title: `${game.sport} - Happening Now`,
            location: game.venue,
            attendees: game.currentPlayers,
            maxAttendees: game.maxPlayers
          });
        });
      }

      if (activities.startingSoon) {
        activities.startingSoon.forEach(game => {
          games.push({
            ...game,
            coords: [game.lat, game.lng],
            type: game.sport,
            title: `${game.sport} - Starting Soon`,
            location: game.venue,
            attendees: game.currentPlayers,
            maxAttendees: game.maxPlayers
          });
        });
      }

      if (activities.laterToday) {
        activities.laterToday.forEach(game => {
          games.push({
            ...game,
            coords: [game.lat, game.lng],
            type: game.sport,
            title: `${game.sport} - Later Today`,
            location: game.venue,
            attendees: game.currentPlayers,
            maxAttendees: game.maxPlayers
          });
        });
      }

      // Initialize Mapbox with user location
      window.initializeMapboxMap([userLat, userLng], 'playNowMap').then(() => {
        // Add markers for all games
        games.forEach(game => {
          window.addMapboxGameMarker(game);
        });
        
        // Fit map to show all markers
        window.fitMapToMarkers();
      });
    } else {
      // Use existing Google Maps Play Now implementation
      if (window.initializePlayNowMapGoogle) {
        window.initializePlayNowMapGoogle(userLat, userLng, activities, allGames);
      }
    }
  };

})();