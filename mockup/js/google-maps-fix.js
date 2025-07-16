// Google Maps Zoom Fix and Dark Mode Enhancement
// This fix addresses the zoom instability issue and adds proper dark mode support

(function() {
    'use strict';

    console.log('Google Maps Fix Loading...');

    // Store original map options to prevent conflicts
    let mapOptions = {
        gestureHandling: 'cooperative',
        zoomControl: true,
        scrollwheel: true,
        disableDoubleClickZoom: false,
        minZoom: 10,
        maxZoom: 18
    };

    // Override any existing map initialization to ensure stable zoom
    const originalInitMap = window.initializeGoogleMap || window.initializePlayNowMap;
    
    // Enhanced initialization wrapper
    window.initializeGoogleMap = function(userLocation, mapElementId = 'map') {
        console.log('Enhanced Google Maps initialization');
        
        // Call original if it exists
        if (originalInitMap && typeof originalInitMap === 'function') {
            originalInitMap.apply(this, arguments);
        }
        
        // Apply zoom fixes after a short delay
        setTimeout(() => {
            if (window.googleMap || window.map) {
                const mapInstance = window.googleMap || window.map;
                
                // Apply stable zoom settings
                mapInstance.setOptions({
                    gestureHandling: 'cooperative',
                    scrollwheel: true,
                    disableDoubleClickZoom: false,
                    minZoom: 10,
                    maxZoom: 18
                });
                
                // Add zoom stabilizer
                let isZooming = false;
                let zoomTimeout;
                
                mapInstance.addListener('zoom_changed', () => {
                    if (!isZooming) {
                        isZooming = true;
                        clearTimeout(zoomTimeout);
                        
                        zoomTimeout = setTimeout(() => {
                            isZooming = false;
                        }, 150); // Debounce zoom events
                    }
                });
                
                // Prevent rapid zoom changes
                mapInstance.addListener('wheel', (e) => {
                    if (isZooming) {
                        e.stop();
                    }
                });
                
                console.log('Zoom stabilization applied');
            }
        }, 500);
    };
    
    // Also wrap Play Now map initialization
    const originalPlayNowInit = window.initializePlayNowMap;
    window.initializePlayNowMap = function() {
        console.log('Enhanced Play Now map initialization');
        
        // Call original
        if (originalPlayNowInit && typeof originalPlayNowInit === 'function') {
            originalPlayNowInit.apply(this, arguments);
        }
        
        // Apply zoom fixes
        setTimeout(() => {
            if (window.map) {
                window.map.setOptions(mapOptions);
                
                // Add same zoom stabilizer
                let isZooming = false;
                let zoomTimeout;
                
                window.map.addListener('zoom_changed', () => {
                    if (!isZooming) {
                        isZooming = true;
                        clearTimeout(zoomTimeout);
                        
                        zoomTimeout = setTimeout(() => {
                            isZooming = false;
                        }, 150);
                    }
                });
                
                console.log('Play Now map zoom stabilization applied');
            }
        }, 500);
    };
    
    // Ensure dark mode toggle exists
    window.addEventListener('load', () => {
        // Check if toggle already exists
        if (!document.getElementById('darkModeToggle')) {
            // Add toggle button if using original google-maps.js
            setTimeout(() => {
                const mapContainers = document.querySelectorAll('#map, #playNowMap');
                mapContainers.forEach(container => {
                    if (container && container.querySelector('.gm-style')) {
                        addDarkModeToggleToMap(container);
                    }
                });
            }, 2000);
        }
    });
    
    function addDarkModeToggleToMap(mapContainer) {
        const toggleDiv = document.createElement('div');
        toggleDiv.className = 'dark-mode-toggle';
        toggleDiv.innerHTML = `
            <button id="darkModeToggle" class="map-theme-toggle" title="Toggle Dark Mode">
                <span class="theme-icon">🌙</span>
            </button>
        `;
        
        mapContainer.style.position = 'relative';
        mapContainer.appendChild(toggleDiv);
        
        // Add styles if not present
        if (!document.querySelector('style[data-dark-mode-toggle]')) {
            const style = document.createElement('style');
            style.setAttribute('data-dark-mode-toggle', 'true');
            style.textContent = `
                .dark-mode-toggle {
                    position: absolute;
                    top: 10px;
                    right: 60px;
                    z-index: 1000;
                }
                .map-theme-toggle {
                    background: white;
                    border: 2px solid rgba(0,0,0,0.2);
                    border-radius: 4px;
                    padding: 8px 12px;
                    cursor: pointer;
                    font-size: 18px;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                }
                .map-theme-toggle:hover {
                    background: #f5f5f5;
                    transform: scale(1.05);
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add click handler
        document.getElementById('darkModeToggle').addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-map-mode');
            document.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
            
            // Apply dark styles to map
            const map = window.googleMap || window.map;
            if (map) {
                map.setOptions({
                    styles: isDark ? getDarkMapStyles() : []
                });
            }
        });
    }
    
    function getDarkMapStyles() {
        return [
            { elementType: 'geometry', stylers: [{ color: '#212121' }] },
            { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
            {
                featureType: 'administrative',
                elementType: 'geometry',
                stylers: [{ color: '#757575' }]
            },
            {
                featureType: 'administrative.country',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#9e9e9e' }]
            },
            {
                featureType: 'administrative.locality',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#bdbdbd' }]
            },
            {
                featureType: 'poi',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#757575' }]
            },
            {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{ color: '#181818' }]
            },
            {
                featureType: 'road',
                elementType: 'geometry.fill',
                stylers: [{ color: '#2c2c2c' }]
            },
            {
                featureType: 'road',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#8a8a8a' }]
            },
            {
                featureType: 'road.arterial',
                elementType: 'geometry',
                stylers: [{ color: '#373737' }]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry',
                stylers: [{ color: '#3c3c3c' }]
            },
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#000000' }]
            },
            {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#3d3d3d' }]
            }
        ];
    }
    
    console.log('Google Maps Fix Applied - Zoom should be stable now');
})();