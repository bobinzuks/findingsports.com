// Live Map Debugging Script - Finding the Gray Box Issue
(function() {
    'use strict';
    
    console.log('🔍 Map Debug Script Starting...');
    
    // Check 1: MapLibre GL JS Library
    function checkMapLibreLoaded() {
        console.log('\n📚 LIBRARY CHECK:');
        console.log('window.maplibregl:', typeof window.maplibregl);
        if (window.maplibregl) {
            console.log('✅ MapLibre GL JS is loaded');
            console.log('Version:', maplibregl.version || 'Unknown');
            console.log('Supported:', maplibregl.supported());
        } else {
            console.error('❌ MapLibre GL JS is NOT loaded!');
        }
    }
    
    // Check 2: Map Container
    function checkMapContainer() {
        console.log('\n📦 CONTAINER CHECK:');
        const container = document.getElementById('map');
        if (container) {
            console.log('✅ Map container found');
            const rect = container.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(container);
            console.log('Dimensions:', {
                width: rect.width + 'px',
                height: rect.height + 'px',
                display: computedStyle.display,
                visibility: computedStyle.visibility,
                backgroundColor: computedStyle.backgroundColor,
                position: computedStyle.position
            });
            
            // Check if container has content
            console.log('Container HTML:', container.innerHTML.substring(0, 100) + '...');
            console.log('Child elements:', container.children.length);
        } else {
            console.error('❌ Map container NOT found!');
        }
    }
    
    // Check 3: Map Instance
    function checkMapInstance() {
        console.log('\n🗺️ MAP INSTANCE CHECK:');
        
        // Check global map references
        if (window.map) {
            console.log('✅ window.map exists');
            console.log('Map loaded:', window.map.loaded());
            console.log('Map style:', window.map.getStyle() ? 'Loaded' : 'Not loaded');
        } else {
            console.log('❌ window.map does not exist');
        }
        
        // Check maplibreManager
        if (window.maplibreManager) {
            console.log('✅ maplibreManager exists');
            const managerMap = window.maplibreManager.getMap();
            if (managerMap) {
                console.log('Manager map loaded:', managerMap.loaded());
            } else {
                console.log('❌ Manager map is null');
            }
        } else {
            console.log('❌ maplibreManager does not exist');
        }
    }
    
    // Check 4: Network Requests
    function checkNetworkRequests() {
        console.log('\n🌐 NETWORK CHECK:');
        
        // Monitor tile requests
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.name.includes('tile') || entry.name.includes('.png')) {
                    console.log('Tile request:', {
                        url: entry.name,
                        duration: entry.duration + 'ms',
                        status: entry.responseStatus || 'unknown'
                    });
                }
            });
        });
        
        try {
            observer.observe({ entryTypes: ['resource'] });
            console.log('✅ Network monitoring started');
        } catch (e) {
            console.log('❌ Could not start network monitoring:', e.message);
        }
    }
    
    // Check 5: Console Errors
    function checkConsoleErrors() {
        console.log('\n⚠️ ERROR CHECK:');
        
        // Override console.error temporarily
        const originalError = console.error;
        let errorCount = 0;
        
        console.error = function(...args) {
            errorCount++;
            console.log('🔴 Console Error #' + errorCount + ':', ...args);
            originalError.apply(console, args);
        };
        
        // Restore after 5 seconds
        setTimeout(() => {
            console.error = originalError;
            console.log('Total errors captured:', errorCount);
        }, 5000);
    }
    
    // Check 6: Map Initialization Functions
    function checkInitFunctions() {
        console.log('\n🚀 INITIALIZATION FUNCTIONS CHECK:');
        console.log('window.initializeMapLibre:', typeof window.initializeMapLibre);
        console.log('window.forceMapInit:', typeof window.forceMapInit);
        console.log('window.initMapWithRetry:', typeof window.initMapWithRetry);
    }
    
    // Check 7: Try to get map center and zoom
    function checkMapState() {
        console.log('\n📍 MAP STATE CHECK:');
        
        const container = document.getElementById('map');
        if (!container) return;
        
        // Look for MapLibre elements
        const canvas = container.querySelector('.maplibregl-canvas');
        if (canvas) {
            console.log('✅ MapLibre canvas found');
            console.log('Canvas size:', canvas.width + 'x' + canvas.height);
        } else {
            console.log('❌ No MapLibre canvas found');
        }
        
        // Check for map controls
        const controls = container.querySelectorAll('.maplibregl-ctrl');
        console.log('Map controls found:', controls.length);
    }
    
    // Check 8: CSS Issues
    function checkCSS() {
        console.log('\n🎨 CSS CHECK:');
        
        // Check if MapLibre CSS is loaded
        const stylesheets = Array.from(document.styleSheets);
        const maplibreCSS = stylesheets.find(sheet => 
            sheet.href && sheet.href.includes('maplibre-gl.css')
        );
        
        if (maplibreCSS) {
            console.log('✅ MapLibre CSS loaded from:', maplibreCSS.href);
        } else {
            console.log('❌ MapLibre CSS not found!');
        }
        
        // Check for conflicting styles
        const container = document.getElementById('map');
        if (container) {
            const canvas = container.querySelector('.maplibregl-canvas');
            if (canvas) {
                const canvasStyle = window.getComputedStyle(canvas);
                console.log('Canvas styles:', {
                    position: canvasStyle.position,
                    width: canvasStyle.width,
                    height: canvasStyle.height,
                    opacity: canvasStyle.opacity,
                    visibility: canvasStyle.visibility
                });
            }
        }
    }
    
    // Main debug function
    function runDebugChecks() {
        console.log('='.repeat(60));
        console.log('🐛 MAPLIBRE DEBUG REPORT - ' + new Date().toLocaleTimeString());
        console.log('='.repeat(60));
        
        checkMapLibreLoaded();
        checkMapContainer();
        checkInitFunctions();
        checkMapInstance();
        checkMapState();
        checkCSS();
        checkNetworkRequests();
        checkConsoleErrors();
        
        console.log('\n' + '='.repeat(60));
        console.log('📋 RECOMMENDATIONS:');
        
        // Provide recommendations based on findings
        if (!window.maplibregl) {
            console.log('1. MapLibre GL JS is not loaded. Check script tag and CDN availability.');
        }
        
        const container = document.getElementById('map');
        if (container && container.children.length === 0) {
            console.log('2. Map container is empty. Map initialization may have failed.');
        }
        
        if (window.maplibregl && container) {
            console.log('3. Try manual initialization in console:');
            console.log(`   new maplibregl.Map({
       container: 'map',
       style: 'https://demotiles.maplibre.org/style.json',
       center: [-123.1207, 49.2827],
       zoom: 12
   });`);
        }
        
        console.log('='.repeat(60));
    }
    
    // Run checks when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runDebugChecks);
    } else {
        // Also run after a delay to catch async issues
        setTimeout(runDebugChecks, 1000);
    }
    
    // Run checks on window load as well
    window.addEventListener('load', () => {
        setTimeout(runDebugChecks, 2000);
    });
    
    // Export debug function for manual testing
    window.mapDebug = {
        runChecks: runDebugChecks,
        checkLibrary: checkMapLibreLoaded,
        checkContainer: checkMapContainer,
        checkInstance: checkMapInstance,
        checkNetwork: checkNetworkRequests,
        checkCSS: checkCSS,
        // Manual fix attempt
        tryManualInit: function() {
            console.log('🔧 Attempting manual map initialization...');
            
            if (!window.maplibregl) {
                console.error('MapLibre GL JS not available!');
                return;
            }
            
            const container = document.getElementById('map');
            if (!container) {
                console.error('Map container not found!');
                return;
            }
            
            // Clear container
            container.innerHTML = '';
            
            try {
                const map = new maplibregl.Map({
                    container: 'map',
                    style: {
                        version: 8,
                        sources: {
                            'osm': {
                                type: 'raster',
                                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                                tileSize: 256
                            }
                        },
                        layers: [{
                            id: 'osm',
                            type: 'raster',
                            source: 'osm'
                        }]
                    },
                    center: [-123.1207, 49.2827],
                    zoom: 12
                });
                
                map.on('load', () => {
                    console.log('✅ Manual map initialization successful!');
                });
                
                map.on('error', (e) => {
                    console.error('❌ Map error:', e);
                });
                
                window.debugMap = map;
                console.log('Map instance saved to window.debugMap');
                
            } catch (e) {
                console.error('❌ Manual initialization failed:', e);
            }
        }
    };
    
})();