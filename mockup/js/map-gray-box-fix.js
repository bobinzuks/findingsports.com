// Map Gray Box Fix - Direct Solutions
(function() {
    'use strict';
    
    console.log('🔧 Map Gray Box Fix Loading...');
    
    // Fix 1: Ensure MapLibre CSS is properly loaded
    function ensureMapLibreCSS() {
        const hasCSS = Array.from(document.styleSheets).some(sheet => 
            sheet.href && sheet.href.includes('maplibre-gl.css')
        );
        
        if (!hasCSS) {
            console.log('⚠️ MapLibre CSS missing, injecting...');
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/maplibre-gl@4.0.0/dist/maplibre-gl.css';
            document.head.appendChild(link);
        }
    }
    
    // Fix 2: Add critical MapLibre styles inline
    function injectCriticalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Critical MapLibre styles for gray box fix */
            .maplibregl-map {
                position: relative;
                overflow: hidden;
            }
            
            .maplibregl-canvas-container,
            .maplibregl-canvas {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }
            
            .maplibregl-canvas {
                outline: none;
                cursor: grab;
            }
            
            .maplibregl-canvas:active {
                cursor: grabbing;
            }
            
            /* Fix for gray background */
            #map {
                background: transparent !important;
            }
            
            #map .maplibregl-canvas-container {
                background: transparent !important;
            }
            
            /* Ensure map container has size */
            .map-container,
            #map {
                min-height: 400px !important;
                width: 100% !important;
                display: block !important;
                position: relative !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Fix 3: Force map resize after initialization
    function forceMapResize() {
        // Try all possible map references
        const maps = [
            window.map,
            window.debugMap,
            window.maplibreManager?.getMap?.(),
            // Check for maps stored in container data
            document.getElementById('map')?._maplibregl
        ].filter(Boolean);
        
        maps.forEach((map, index) => {
            if (map && typeof map.resize === 'function') {
                console.log(`📐 Resizing map instance ${index + 1}`);
                map.resize();
                
                // Also try to force a render
                if (map._render) {
                    map._render();
                }
            }
        });
    }
    
    // Fix 4: Reinitialize map with basic style
    function reinitializeMap() {
        console.log('🔄 Attempting map reinitialization...');
        
        if (!window.maplibregl) {
            console.error('MapLibre GL JS not available');
            return;
        }
        
        const container = document.getElementById('map');
        if (!container) {
            console.error('Map container not found');
            return;
        }
        
        // Clear any existing map
        container.innerHTML = '';
        
        // Remove existing map instances
        if (container._maplibregl) {
            container._maplibregl.remove();
            delete container._maplibregl;
        }
        
        try {
            // Create new map with minimal config
            const map = new maplibregl.Map({
                container: 'map',
                style: {
                    version: 8,
                    sources: {
                        'raster-tiles': {
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
                        id: 'base-tiles',
                        type: 'raster',
                        source: 'raster-tiles',
                        minzoom: 0,
                        maxzoom: 19
                    }]
                },
                center: [-123.1207, 49.2827], // Vancouver
                zoom: 12,
                attributionControl: true,
                failIfMajorPerformanceCaveat: false // Allow software rendering
            });
            
            // Store reference
            window.map = map;
            container._maplibregl = map;
            
            // Add navigation control
            map.addControl(new maplibregl.NavigationControl(), 'top-right');
            
            // Handle load event
            map.on('load', () => {
                console.log('✅ Map loaded successfully!');
                
                // Force a resize to ensure proper rendering
                setTimeout(() => {
                    map.resize();
                    console.log('📐 Map resized after load');
                }, 100);
                
                // Add a test marker
                new maplibregl.Marker({ color: '#ff6b35' })
                    .setLngLat([-123.1207, 49.2827])
                    .addTo(map);
            });
            
            // Handle errors
            map.on('error', (e) => {
                console.error('🔴 Map error:', e.error);
                
                // Check for common issues
                if (e.error.message.includes('WebGL')) {
                    console.error('WebGL is not supported or disabled');
                    showFallbackMessage('WebGL is required for the map. Please enable it in your browser settings.');
                } else if (e.error.message.includes('tiles')) {
                    console.error('Tile loading error');
                    showFallbackMessage('Unable to load map tiles. Please check your internet connection.');
                }
            });
            
            // Monitor tile loading
            map.on('dataloading', (e) => {
                if (e.dataType === 'source' && e.isSourceLoaded === false) {
                    console.log('📡 Loading tiles...');
                }
            });
            
            map.on('sourcedata', (e) => {
                if (e.isSourceLoaded) {
                    console.log('✅ Tiles loaded');
                }
            });
            
        } catch (error) {
            console.error('🔴 Map initialization error:', error);
            showFallbackMessage('Unable to initialize map. ' + error.message);
        }
    }
    
    // Fix 5: Show fallback message
    function showFallbackMessage(message) {
        const container = document.getElementById('map');
        if (container) {
            container.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    background: #f5f5f5;
                    color: #666;
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 20px;
                ">
                    <div>
                        <p style="margin: 0 0 10px 0;">⚠️ ${message}</p>
                        <button onclick="window.grayBoxFix.reinitialize()" style="
                            padding: 8px 16px;
                            background: #ff6b35;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                        ">Retry</button>
                    </div>
                </div>
            `;
        }
    }
    
    // Fix 6: Check WebGL support
    function checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                console.error('❌ WebGL is not supported');
                return false;
            }
            console.log('✅ WebGL is supported');
            return true;
        } catch (e) {
            console.error('❌ WebGL check failed:', e);
            return false;
        }
    }
    
    // Main fix function
    function applyGrayBoxFixes() {
        console.log('🚀 Applying gray box fixes...');
        
        // Apply all fixes
        ensureMapLibreCSS();
        injectCriticalStyles();
        
        // Check WebGL first
        if (!checkWebGLSupport()) {
            showFallbackMessage('WebGL is not supported in your browser. Please use a modern browser.');
            return;
        }
        
        // Wait for MapLibre to be available
        if (!window.maplibregl) {
            console.log('⏳ Waiting for MapLibre GL JS...');
            setTimeout(applyGrayBoxFixes, 500);
            return;
        }
        
        // Try to resize existing maps first
        forceMapResize();
        
        // If no map exists or map is gray, reinitialize
        const container = document.getElementById('map');
        if (container) {
            const canvas = container.querySelector('.maplibregl-canvas');
            if (!canvas || canvas.width === 0 || canvas.height === 0) {
                console.log('🔄 Map canvas missing or zero size, reinitializing...');
                reinitializeMap();
            }
        }
    }
    
    // Apply fixes when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(applyGrayBoxFixes, 500);
        });
    } else {
        setTimeout(applyGrayBoxFixes, 500);
    }
    
    // Also apply on window load
    window.addEventListener('load', () => {
        setTimeout(applyGrayBoxFixes, 1000);
    });
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('🔄 Page visible, checking map...');
            forceMapResize();
        }
    });
    
    // Export functions for manual testing
    window.grayBoxFix = {
        applyFixes: applyGrayBoxFixes,
        reinitialize: reinitializeMap,
        resize: forceMapResize,
        checkWebGL: checkWebGLSupport
    };
    
})();