// Map debugging utilities
window.mapDebug = {
    checkStatus: function() {
        console.log('=== Map Debug Status ===');
        console.log('Google Maps API loaded:', typeof google !== 'undefined' && google.maps);
        console.log('Google Map instance:', !!window.googleMap);
        console.log('Leaflet loaded:', typeof L !== 'undefined');
        console.log('Leaflet map instance:', !!window.map);
        console.log('Map element exists:', !!document.getElementById('map'));
        
        const mapEl = document.getElementById('map');
        if (mapEl) {
            const rect = mapEl.getBoundingClientRect();
            console.log('Map element dimensions:', {
                width: rect.width,
                height: rect.height,
                visible: rect.width > 0 && rect.height > 0
            });
        }
        
        console.log('======================');
    },
    
    testGoogleMaps: function() {
        if (typeof google === 'undefined' || !google.maps) {
            console.error('Google Maps not loaded');
            return;
        }
        
        const mapEl = document.getElementById('map');
        if (!mapEl) {
            console.error('Map element not found');
            return;
        }
        
        console.log('Creating test Google Map...');
        const testMap = new google.maps.Map(mapEl, {
            center: { lat: 49.2827, lng: -123.1207 },
            zoom: 12
        });
        
        window.testMap = testMap;
        console.log('Test map created:', testMap);
    }
};

// Auto-check on load
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.mapDebug.checkStatus();
    }, 2000);
});

// Check when Google Maps loads
window.addEventListener('googlemapsloaded', () => {
    console.log('Google Maps loaded event fired');
    window.mapDebug.checkStatus();
});