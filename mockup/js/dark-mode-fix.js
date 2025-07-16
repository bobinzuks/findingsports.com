// Dark Mode Fix for Google Maps
(function() {
    'use strict';
    
    console.log('Dark Mode Fix Loading...');
    
    // Dark theme styles
    const darkMapStyles = [
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
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#616161' }]
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
    
    let currentTheme = localStorage.getItem('mapTheme') || 'dark';
    let toggleButton = null;
    
    // Wait for map to be ready
    function waitForMap(callback) {
        const checkInterval = setInterval(() => {
            const map = window.googleMap || window.map;
            if (map && typeof map.setOptions === 'function') {
                clearInterval(checkInterval);
                callback(map);
            }
        }, 100);
        
        // Stop checking after 30 seconds
        setTimeout(() => clearInterval(checkInterval), 30000);
    }
    
    // Apply dark mode to map
    function applyDarkMode(map) {
        console.log('Applying dark mode to map');
        map.setOptions({
            styles: currentTheme === 'dark' ? darkMapStyles : []
        });
    }
    
    // Create toggle button
    function createToggleButton() {
        // Check if button already exists
        if (document.getElementById('darkModeToggleBtn')) {
            return;
        }
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 9999;
        `;
        
        const button = document.createElement('button');
        button.id = 'darkModeToggleBtn';
        button.style.cssText = `
            background: white;
            border: 2px solid rgba(0,0,0,0.2);
            border-radius: 8px;
            padding: 10px 15px;
            cursor: pointer;
            font-size: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;
        button.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';
        button.title = 'Toggle Dark Mode';
        
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('mapTheme', currentTheme);
            button.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';
            
            // Apply to all maps
            const maps = [window.googleMap, window.map].filter(m => m);
            maps.forEach(map => {
                if (map && typeof map.setOptions === 'function') {
                    applyDarkMode(map);
                }
            });
            
            // Toggle body class
            document.body.classList.toggle('dark-map-mode', currentTheme === 'dark');
            
            console.log('Dark mode toggled:', currentTheme);
        });
        
        buttonContainer.appendChild(button);
        document.body.appendChild(buttonContainer);
        toggleButton = button;
        
        console.log('Dark mode toggle button created');
    }
    
    // Initialize dark mode
    function initDarkMode() {
        console.log('Initializing dark mode...');
        
        // Create toggle button immediately
        createToggleButton();
        
        // Apply dark mode class to body
        document.body.classList.toggle('dark-map-mode', currentTheme === 'dark');
        
        // Wait for map and apply dark mode
        waitForMap((map) => {
            applyDarkMode(map);
            console.log('Dark mode applied to map');
        });
        
        // Also check for Play Now map
        const checkPlayNowMap = setInterval(() => {
            const playNowMap = document.getElementById('playNowMap');
            if (playNowMap && playNowMap.querySelector('.gm-style')) {
                clearInterval(checkPlayNowMap);
                waitForMap((map) => {
                    applyDarkMode(map);
                });
            }
        }, 1000);
        
        // Stop checking after 30 seconds
        setTimeout(() => clearInterval(checkPlayNowMap), 30000);
    }
    
    // Override map initialization to apply dark mode
    const originalInitMap = window.initializeGoogleMap;
    window.initializeGoogleMap = function() {
        console.log('Dark mode intercepting map initialization');
        const result = originalInitMap && originalInitMap.apply(this, arguments);
        setTimeout(() => {
            waitForMap(applyDarkMode);
        }, 500);
        return result;
    };
    
    const originalInitPlayNow = window.initializePlayNowMap;
    window.initializePlayNowMap = function() {
        console.log('Dark mode intercepting Play Now map initialization');
        const result = originalInitPlayNow && originalInitPlayNow.apply(this, arguments);
        setTimeout(() => {
            waitForMap(applyDarkMode);
        }, 500);
        return result;
    };
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDarkMode);
    } else {
        initDarkMode();
    }
    
    // Also reinitialize when Play Now is clicked
    const originalPlayNow = window.playNow;
    if (originalPlayNow) {
        window.playNow = function() {
            const result = originalPlayNow.apply(this, arguments);
            setTimeout(() => {
                waitForMap(applyDarkMode);
            }, 2000);
            return result;
        };
    }
    
    console.log('Dark Mode Fix Applied');
})();