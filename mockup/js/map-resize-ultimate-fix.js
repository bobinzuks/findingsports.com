// Ultimate Map Resize Fix - Addresses all causes of continuous resizing
(function() {
    'use strict';
    
    console.log('Ultimate Map Resize Fix Loading...');
    
    // Flag to prevent multiple fixes
    if (window._mapResizeFixed) {
        console.log('Map resize fix already applied');
        return;
    }
    window._mapResizeFixed = true;
    
    // 1. Disable ALL pulse animations on the page
    function disablePulseAnimations() {
        const style = document.createElement('style');
        style.id = 'disable-pulse-animations';
        style.textContent = `
            /* Disable all pulse animations */
            @keyframes pulse { }
            @keyframes pulse-ring { }
            @keyframes spin { }
            
            /* Override any infinite animations */
            .pulse,
            .pulsing,
            .animated,
            .user-location-pulse,
            [class*="pulse"] {
                animation: none !important;
                animation-duration: 0s !important;
            }
            
            /* Specifically target map elements */
            #map *,
            #playNowMap *,
            .map-container *,
            .gm-style * {
                animation: none !important;
                transition: none !important;
            }
            
            /* Lock map container dimensions */
            #map,
            #playNowMap,
            .map-container {
                height: 400px !important;
                min-height: 400px !important;
                max-height: 400px !important;
                resize: none !important;
                overflow: hidden !important;
            }
            
            @media (max-width: 768px) {
                #map,
                #playNowMap,
                .map-container {
                    height: 300px !important;
                    min-height: 300px !important;
                    max-height: 300px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 2. Override the pulsing circle animation in play-now-maps.js
    function fixPulsingCircle() {
        // Override setInterval to catch and disable pulsing animations
        const originalSetInterval = window.setInterval;
        window.setInterval = function(callback, delay) {
            // Check if this is the pulsing circle animation
            const callbackStr = callback.toString();
            if (callbackStr.includes('pulsingCircle') || 
                callbackStr.includes('setRadius') || 
                (callbackStr.includes('radius') && callbackStr.includes('expanding'))) {
                console.log('Blocked pulsing circle animation');
                return -1; // Return fake interval ID
            }
            return originalSetInterval.apply(this, arguments);
        };
    }
    
    // 3. Disable the problematic resize monitoring
    function disableResizeMonitoring() {
        // Clear any existing monitoring intervals
        for (let i = 1; i < 99999; i++) {
            if (window.clearInterval) {
                window.clearInterval(i);
            }
        }
        
        // Override the monitor function if it exists
        if (window.monitorMapDimensions) {
            window.monitorMapDimensions = function() {
                console.log('Resize monitoring disabled');
            };
        }
    }
    
    // 4. Fix Google Maps resize behavior
    function stabilizeGoogleMaps() {
        // Wait for maps to be available
        const checkMaps = setInterval(() => {
            const maps = document.querySelectorAll('#map, #playNowMap');
            
            maps.forEach(mapElement => {
                if (mapElement && mapElement.querySelector('.gm-style')) {
                    clearInterval(checkMaps);
                    
                    // Get the Google Maps instance
                    const mapInstance = window.googleMap || window.map;
                    if (!mapInstance) return;
                    
                    // Disable map resizing
                    if (mapInstance.setOptions) {
                        mapInstance.setOptions({
                            disableDoubleClickZoom: true,
                            scrollwheel: false,
                            draggable: true,
                            gestureHandling: 'cooperative'
                        });
                    }
                    
                    // Lock the container size
                    mapElement.style.cssText = `
                        height: 400px !important;
                        min-height: 400px !important;
                        max-height: 400px !important;
                        width: 100% !important;
                        position: relative !important;
                        overflow: hidden !important;
                    `;
                    
                    // Lock all child elements
                    const gmStyle = mapElement.querySelector('.gm-style');
                    if (gmStyle) {
                        gmStyle.style.cssText = `
                            height: 100% !important;
                            width: 100% !important;
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                        `;
                    }
                    
                    console.log('Google Maps stabilized');
                }
            });
        }, 100);
        
        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkMaps), 10000);
    }
    
    // 5. Prevent ResizeObserver loops
    function fixResizeObserver() {
        // Don't override ResizeObserver, just prevent it from affecting maps
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.id === 'map' || 
                    mutation.target.id === 'playNowMap' ||
                    mutation.target.classList.contains('gm-style')) {
                    
                    // If height was changed, restore it
                    if (mutation.attributeName === 'style') {
                        const target = mutation.target;
                        const currentHeight = target.style.height;
                        if (currentHeight !== '400px' && currentHeight !== '300px') {
                            target.style.height = '400px';
                            console.log('Prevented map resize');
                        }
                    }
                }
            });
        });
        
        // Observe maps for attribute changes
        setTimeout(() => {
            const maps = document.querySelectorAll('#map, #playNowMap');
            maps.forEach(map => {
                observer.observe(map, {
                    attributes: true,
                    attributeFilter: ['style']
                });
            });
        }, 1000);
    }
    
    // 6. Apply all fixes
    function applyAllFixes() {
        console.log('Applying ultimate map resize fixes...');
        
        // Apply CSS fixes immediately
        disablePulseAnimations();
        
        // Fix JavaScript issues
        fixPulsingCircle();
        disableResizeMonitoring();
        
        // Stabilize maps after they load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                stabilizeGoogleMaps();
                fixResizeObserver();
            });
        } else {
            stabilizeGoogleMaps();
            fixResizeObserver();
        }
        
        // Also apply when Play Now is clicked
        const originalPlayNow = window.playNow;
        if (originalPlayNow) {
            window.playNow = function() {
                const result = originalPlayNow.apply(this, arguments);
                setTimeout(() => {
                    stabilizeGoogleMaps();
                }, 1000);
                return result;
            };
        }
    }
    
    // Apply fixes immediately
    applyAllFixes();
    
    // Reapply fixes if maps are reinitialized
    const originalInitMap = window.initializeGoogleMap;
    window.initializeGoogleMap = function() {
        const result = originalInitMap && originalInitMap.apply(this, arguments);
        setTimeout(stabilizeGoogleMaps, 500);
        return result;
    };
    
    const originalInitPlayNow = window.initializePlayNowMap;
    window.initializePlayNowMap = function() {
        const result = originalInitPlayNow && originalInitPlayNow.apply(this, arguments);
        setTimeout(stabilizeGoogleMaps, 500);
        return result;
    };
    
    console.log('Ultimate Map Resize Fix Applied - All animations disabled, monitoring stopped');
})();