// Map initialization fix
(function() {
  // Ensure map initializes when page switches to map view
  const originalSwitchPage = window.switchPage;
  window.switchPage = async function(page) {
    // Call original function
    if (originalSwitchPage) {
      await originalSwitchPage.call(this, page);
    }

    // Check if map needs initialization
    setTimeout(() => {
      const mapEl = document.getElementById('map');
      if (mapEl && !window.googleMap && !window.map) {
        console.log('Map element found but no map instance, initializing...');

        // Get user location if available
        const locationInfo = window.locationService?.getLocationInfo();
        const userLocation = locationInfo?.userLocation ?
          [locationInfo.userLocation.lat, locationInfo.userLocation.lng] :
          null;

        window.initializeMap(userLocation);
      }
    }, 100);
  };

  // Also check after Google Maps loads
  window.addEventListener('googlemapsloaded', () => {
    setTimeout(() => {
      const mapEl = document.getElementById('map');
      if (mapEl && !window.googleMap) {
        console.log('Google Maps loaded but map not initialized, initializing...');

        const locationInfo = window.locationService?.getLocationInfo();
        const userLocation = locationInfo?.userLocation ?
          [locationInfo.userLocation.lat, locationInfo.userLocation.lng] :
          null;

        window.initializeGoogleMap(userLocation);
      }
    }, 500);
  });

  // Ensure map resizes properly
  window.addEventListener('resize', () => {
    if (window.googleMap) {
      google.maps.event.trigger(window.googleMap, 'resize');
    } else if (window.map) {
      window.map.invalidateSize();
    }
  });
})();
