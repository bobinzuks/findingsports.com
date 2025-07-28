// MapLibre Unified Fix - Comprehensive solution for gray box issue
// This replaces all other map initialization attempts with a single, reliable approach

(function() {
    'use strict';
    
    console.log('🗺️ MapLibre Unified Fix Loading...');
    
    // Global state to prevent multiple initializations
    window._mapLibreState = window._mapLibreState || {
        initialized: false,
        initializing: false,
        map: null,
        retryCount: 0,
        maxRetries: 5
    };
    
    // Ensure MapLibre GL JS and CSS are loaded
    async function ensureMapLibreResources() {
        // Check if MapLibre GL JS is already loaded
        if (!window.maplibregl) {
            console.log('📦 Loading MapLibre GL JS...');
            
            // Load CSS first
            if (!document.querySelector('link[href*="maplibre-gl.css"]')) {
                const cssLink = document.createElement('link');
                cssLink.rel = 'stylesheet';
                cssLink.href = 'https://unpkg.com/maplibre-gl@4.0.0/dist/maplibre-gl.css';
                document.head.appendChild(cssLink);
                
                // Wait for CSS to load
                await new Promise(resolve => {
                    cssLink.onload = resolve;
                    cssLink.onerror = () => {
                        console.error('Failed to load MapLibre CSS');
                        resolve();
                    };
                });
            }
            
            // Load JS
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/maplibre-gl@4.0.0/dist/maplibre-gl.js';
                script.async = true;
                script.onload = () => {
                    console.log('✅ MapLibre GL JS loaded');
                    resolve();
                };
                script.onerror = () => {
                    console.error('Failed to load MapLibre GL JS');
                    reject(new Error('Failed to load MapLibre GL JS'));
                };
                document.head.appendChild(script);
            });
        }
        
        return true;
    }
    
    // Add critical styles to ensure map visibility
    function addCriticalStyles() {
        if (document.getElementById('maplibre-critical-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'maplibre-critical-styles';
        style.textContent = `
            /* Critical MapLibre styles */
            .maplibregl-map {
                position: relative !important;
                overflow: hidden !important;
                width: 100% !important;
                height: 100% !important;
            }
            
            .maplibregl-canvas-container {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
            }
            
            .maplibregl-canvas {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
            }
            
            /* Ensure map container has proper dimensions */
            #map, #playNowMap {
                width: 100% !important;
                height: 500px !important;
                position: relative !important;
                display: block !important;
                background-color: #f0f0f0 !important;
            }
            
            /* Loading state */
            #map.loading::after,
            #playNowMap.loading::after {
                content: 'Loading map...';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-family: Arial, sans-serif;
                font-size: 16px;
                color: #666;
                z-index: 1;
            }
            
            /* Hide gray background once map loads */
            #map.maplibregl-initialized,
            #playNowMap.maplibregl-initialized {
                background-color: transparent !important;
            }
            
            /* Marker styles */
            .game-marker {
                cursor: pointer;
            }
            
            .game-marker .marker-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                transition: transform 0.2s;
                background: white;
            }
            
            .game-marker:hover .marker-icon {
                transform: scale(1.1);
            }
            
            .user-location-marker .pulse-circle {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 30px;
                height: 30px;
                background: rgba(33, 150, 243, 0.3);
                border-radius: 50%;
                animation: pulse 2s infinite;
            }
            
            .user-location-marker .center-dot {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 12px;
                height: 12px;
                background: #2196F3;
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            @keyframes pulse {
                0% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Prepare map container
    function prepareContainer(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container #${containerId} not found`);
            return null;
        }
        
        // Clear any existing content
        container.innerHTML = '';
        
        // Add loading class
        container.classList.add('loading');
        
        // Ensure container is visible and has dimensions
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.warn(`Container #${containerId} has zero dimensions, setting defaults`);
            container.style.width = '100%';
            container.style.height = '500px';
        }
        
        return container;
    }
    
    // Initialize MapLibre map
    async function initializeMap(containerId = 'map') {
        // Prevent multiple simultaneous initializations
        if (window._mapLibreState.initializing) {
            console.log('⏳ Map initialization already in progress...');
            return window._mapLibreState.map;
        }
        
        // Check if already initialized
        if (window._mapLibreState.initialized && window._mapLibreState.map) {
            console.log('✅ Map already initialized');
            return window._mapLibreState.map;
        }
        
        window._mapLibreState.initializing = true;
        
        try {
            // Ensure resources are loaded
            await ensureMapLibreResources();
            
            // Add critical styles
            addCriticalStyles();
            
            // Prepare container
            const container = prepareContainer(containerId);
            if (!container) {
                throw new Error(`Container ${containerId} not found or invalid`);
            }
            
            console.log(`🗺️ Creating MapLibre map for #${containerId}...`);
            
            // Create map instance
            const map = new maplibregl.Map({
                container: containerId,
                style: {
                    version: 8,
                    sources: {
                        'osm': {
                            type: 'raster',
                            tiles: [
                                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                            ],
                            tileSize: 256,
                            attribution: '© OpenStreetMap contributors'
                        }
                    },
                    layers: [{
                        id: 'osm-tiles',
                        type: 'raster',
                        source: 'osm',
                        minzoom: 0,
                        maxzoom: 19
                    }]
                },
                center: [-123.1207, 49.2827], // Vancouver
                zoom: 12,
                maxZoom: 18,
                minZoom: 10,
                attributionControl: true,
                failIfMajorPerformanceCaveat: false
            });
            
            // Store map reference
            window._mapLibreState.map = map;
            
            // Add navigation controls
            map.addControl(new maplibregl.NavigationControl(), 'top-right');
            
            // Add geolocation control
            const geolocateControl = new maplibregl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true,
                showUserLocation: true,
                showAccuracyCircle: true
            });
            map.addControl(geolocateControl, 'top-right');
            
            // Handle map load event
            map.on('load', () => {
                console.log('✅ Map loaded successfully!');
                
                // Remove loading class and add initialized class
                container.classList.remove('loading');
                container.classList.add('maplibregl-initialized');
                
                // Mark as initialized
                window._mapLibreState.initialized = true;
                window._mapLibreState.initializing = false;
                window._mapLibreState.retryCount = 0;
                
                // Force a resize to ensure proper rendering
                setTimeout(() => {
                    map.resize();
                    console.log('📐 Map resized after load');
                }, 100);
                
                // Add sample markers
                addSampleMarkers(map);
                
                // Trigger geolocation
                if (containerId === 'map') {
                    geolocateControl.trigger();
                }
            });
            
            // Handle errors
            map.on('error', (e) => {
                console.error('🔴 Map error:', e);
                window._mapLibreState.initializing = false;
                
                // Retry if under limit
                if (window._mapLibreState.retryCount < window._mapLibreState.maxRetries) {
                    window._mapLibreState.retryCount++;
                    console.log(`🔄 Retrying initialization (${window._mapLibreState.retryCount}/${window._mapLibreState.maxRetries})...`);
                    setTimeout(() => initializeMap(containerId), 1000);
                }
            });
            
            // Monitor tile loading
            let tileLoadTimeout;
            map.on('dataloading', () => {
                clearTimeout(tileLoadTimeout);
                tileLoadTimeout = setTimeout(() => {
                    console.log('⚠️ Tile loading taking too long');
                }, 5000);
            });
            
            map.on('data', () => {
                clearTimeout(tileLoadTimeout);
            });
            
            return map;
            
        } catch (error) {
            console.error('🔴 Failed to initialize map:', error);
            window._mapLibreState.initializing = false;
            
            // Show error message
            const container = document.getElementById(containerId);
            if (container) {
                container.classList.remove('loading');
                container.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5;">
                        <div style="text-align: center; padding: 20px;">
                            <p style="color: #666; margin: 0 0 10px 0;">⚠️ Unable to load map</p>
                            <p style="color: #999; font-size: 14px; margin: 0 0 15px 0;">${error.message}</p>
                            <button onclick="window.mapLibreUnified.retry('${containerId}')" style="padding: 8px 16px; background: #ff6b35; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Retry
                            </button>
                        </div>
                    </div>
                `;
            }
            
            throw error;
        }
    }
    
    // Add sample markers
    function addSampleMarkers(map) {
        const games = [
            { sport: 'Basketball', venue: 'Kitsilano Beach', lat: 49.2747, lng: -123.1442, color: '#FF6B35' },
            { sport: 'Soccer', venue: 'UBC Fields', lat: 49.2606, lng: -123.2460, color: '#4CAF50' },
            { sport: 'Volleyball', venue: 'English Bay', lat: 49.2863, lng: -123.1436, color: '#2196F3' },
            { sport: 'Tennis', venue: 'Queen Elizabeth Park', lat: 49.2418, lng: -123.1125, color: '#9C27B0' }
        ];
        
        games.forEach(game => {
            // Create custom marker element
            const el = document.createElement('div');
            el.className = 'game-marker';
            el.innerHTML = `<div class="marker-icon" style="background-color: ${game.color};">
                <span style="font-size: 20px;">${game.sport === 'Basketball' ? '🏀' : game.sport === 'Soccer' ? '⚽' : game.sport === 'Volleyball' ? '🏐' : '🎾'}</span>
            </div>`;
            
            // Create marker
            new maplibregl.Marker({ element: el })
                .setLngLat([game.lng, game.lat])
                .setPopup(new maplibregl.Popup({ offset: 25 })
                    .setHTML(`<h3>${game.sport}</h3><p>${game.venue}</p>`))
                .addTo(map);
        });
    }
    
    // Retry initialization
    function retryInitialization(containerId) {
        window._mapLibreState.initialized = false;
        window._mapLibreState.map = null;
        window._mapLibreState.retryCount = 0;
        initializeMap(containerId);
    }
    
    // Check and fix existing maps
    function checkExistingMaps() {
        ['map', 'playNowMap'].forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container && !container.querySelector('.maplibregl-canvas')) {
                console.log(`🔍 Found empty map container: #${containerId}`);
                initializeMap(containerId).catch(err => {
                    console.error(`Failed to initialize ${containerId}:`, err);
                });
            }
        });
    }
    
    // Export functions
    window.mapLibreUnified = {
        initialize: initializeMap,
        retry: retryInitialization,
        checkMaps: checkExistingMaps,
        getMap: () => window._mapLibreState.map
    };
    
    // Override existing initialization function
    window.initializeMapLibre = initializeMap;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOM loaded, checking for map containers...');
            setTimeout(checkExistingMaps, 100);
        });
    } else {
        console.log('📄 DOM already loaded, checking for map containers...');
        setTimeout(checkExistingMaps, 100);
    }
    
    // Also check on window load
    window.addEventListener('load', () => {
        console.log('🪟 Window loaded, final map check...');
        setTimeout(checkExistingMaps, 500);
    });
    
    console.log('✅ MapLibre Unified Fix Ready');
    
})();