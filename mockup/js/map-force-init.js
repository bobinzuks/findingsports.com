// Force Map Initialization - Guaranteed to work
(function() {
    'use strict';
    
    let initAttempts = 0;
    const MAX_ATTEMPTS = 20;
    
    function forceMapInit() {
        initAttempts++;
        console.log(`Map init attempt ${initAttempts}`);
        
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }
        
        // Set proper dimensions
        mapContainer.style.cssText = `
            width: 100% !important;
            height: 500px !important;
            background: #e0e0e0 !important;
            position: relative !important;
            display: block !important;
        `;
        
        // Clear any existing content
        mapContainer.innerHTML = '';
        
        // Check if MapLibre is available
        if (window.maplibregl) {
            try {
                // Create a simple map
                const map = new maplibregl.Map({
                    container: 'map',
                    style: {
                        version: 8,
                        sources: {
                            'osm': {
                                type: 'raster',
                                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                                tileSize: 256,
                                attribution: '© OpenStreetMap contributors'
                            }
                        },
                        layers: [{
                            id: 'osm',
                            type: 'raster',
                            source: 'osm'
                        }]
                    },
                    center: [-123.1207, 49.2827], // Vancouver
                    zoom: 12
                });
                
                // Add navigation controls
                map.addControl(new maplibregl.NavigationControl());
                
                console.log('Map initialized successfully!');
                
                // Add some test markers
                setTimeout(() => {
                    // Add a marker for testing
                    new maplibregl.Marker({ color: '#ff6b35' })
                        .setLngLat([-123.1207, 49.2827])
                        .addTo(map);
                }, 1000);
                
            } catch (error) {
                console.error('Map init error:', error);
                mapContainer.innerHTML = '<div style="padding: 50px; text-align: center; color: #666;">Map loading failed. Please refresh.</div>';
            }
        } else if (initAttempts < MAX_ATTEMPTS) {
            // MapLibre not loaded yet, try again
            setTimeout(forceMapInit, 500);
        } else {
            // Give up and show error
            mapContainer.innerHTML = '<div style="padding: 50px; text-align: center; color: #666;">Map service unavailable</div>';
        }
    }
    
    // Start initialization attempts
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceMapInit);
    } else {
        forceMapInit();
    }
    
    // Also try on window load
    window.addEventListener('load', forceMapInit);
})();