// Map initialization fix - ensures proper rendering
(function() {
    'use strict';

    // Ensure map container has proper dimensions
    function fixMapContainer() {
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            // Set explicit dimensions if not already set
            const computedStyle = window.getComputedStyle(mapContainer);
            if (!computedStyle.height || computedStyle.height === '0px' || computedStyle.height === 'auto') {
                mapContainer.style.height = '500px';
            }
            if (!computedStyle.width || computedStyle.width === '0px' || computedStyle.width === 'auto') {
                mapContainer.style.width = '100%';
            }
            
            // Ensure container is visible
            mapContainer.style.display = 'block';
            mapContainer.style.position = 'relative';
            mapContainer.style.overflow = 'hidden';
            
            // Remove any background that might show as gray
            mapContainer.style.backgroundColor = 'transparent';
            
            console.log('Map container fixed:', {
                width: mapContainer.style.width,
                height: mapContainer.style.height,
                display: mapContainer.style.display
            });
        }
    }

    // Initialize map with retry logic
    function initMapWithRetry(retries = 3) {
        fixMapContainer();
        
        if (window.initializeMapLibre && window.maplibregl) {
            console.log('Initializing MapLibre map...');
            window.initializeMapLibre('map').then(() => {
                console.log('Map initialized successfully');
                
                // Trigger resize event to ensure proper rendering
                setTimeout(() => {
                    if (window.maplibreManager && window.maplibreManager.getMap()) {
                        const map = window.maplibreManager.getMap();
                        map.resize();
                        console.log('Map resized');
                    }
                }, 100);
            }).catch(err => {
                console.error('Map initialization failed:', err);
                if (retries > 0) {
                    console.log(`Retrying in 1 second... (${retries} retries left)`);
                    setTimeout(() => initMapWithRetry(retries - 1), 1000);
                }
            });
        } else if (retries > 0) {
            console.log(`MapLibre not ready, retrying in 500ms... (${retries} retries left)`);
            setTimeout(() => initMapWithRetry(retries - 1), 500);
        } else {
            console.error('Failed to initialize map after all retries');
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait a bit for all scripts to load
            setTimeout(initMapWithRetry, 100);
        });
    } else {
        // DOM already loaded
        setTimeout(initMapWithRetry, 100);
    }
})();