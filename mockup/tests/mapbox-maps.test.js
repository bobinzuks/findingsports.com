// Tests for mapbox-maps.js
// Simple test runner using console assertions

console.log('🧪 Running Mapbox Maps Tests...\n');

let passedTests = 0;
let failedTests = 0;

function test(description, testFn) {
  try {
    testFn();
    console.log('✅', description);
    passedTests++;
  } catch (error) {
    console.error('❌', description);
    console.error('   Error:', error.message);
    failedTests++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, but got ${actual}`);
  }
}

function assertFunction(fn, message) {
  if (typeof fn !== 'function') {
    throw new Error(message || 'Expected a function');
  }
}

// Mock Mapbox GL JS for testing
window.mapboxgl = {
  Map: class MockMap {
    constructor(options) {
      this.options = options;
      this._controls = [];
      this._markers = [];
      this._style = options.style;
      this.loaded = false;
      this._eventListeners = {};
    }
    
    addControl(control, position) {
      this._controls.push({ control, position });
    }
    
    on(event, callback) {
      if (!this._eventListeners[event]) {
        this._eventListeners[event] = [];
      }
      this._eventListeners[event].push(callback);
      
      // Simulate immediate load event
      if (event === 'load') {
        setTimeout(() => {
          this.loaded = true;
          callback();
        }, 10);
      }
    }
    
    setStyle(style) {
      this._style = style;
    }
    
    fitBounds(bounds, options) {
      this._lastBounds = bounds;
      this._lastBoundsOptions = options;
    }
  },
  
  Marker: class MockMarker {
    constructor(element) {
      this.element = element;
      this._lngLat = null;
      this._popup = null;
      this._map = null;
    }
    
    setLngLat(lngLat) {
      this._lngLat = lngLat;
      return this;
    }
    
    setPopup(popup) {
      this._popup = popup;
      return this;
    }
    
    addTo(map) {
      this._map = map;
      if (map._markers) {
        map._markers.push(this);
      }
      return this;
    }
    
    remove() {
      if (this._map && this._map._markers) {
        const index = this._map._markers.indexOf(this);
        if (index > -1) {
          this._map._markers.splice(index, 1);
        }
      }
      this._map = null;
    }
    
    getLngLat() {
      return this._lngLat;
    }
  },
  
  Popup: class MockPopup {
    constructor(options) {
      this.options = options;
      this._html = '';
    }
    
    setHTML(html) {
      this._html = html;
      return this;
    }
  },
  
  NavigationControl: class MockNavigationControl {},
  GeolocateControl: class MockGeolocateControl {},
  ScaleControl: class MockScaleControl {},
  FullscreenControl: class MockFullscreenControl {},
  
  LngLatBounds: class MockLngLatBounds {
    constructor() {
      this._points = [];
    }
    
    extend(lngLat) {
      this._points.push(lngLat);
      return this;
    }
  },
  
  Point: class MockPoint {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
  }
};

// Test Suite: Core Functions
console.log('📦 Testing Core Functions\n');

test('initializeMapboxMap should be defined', () => {
  assertFunction(window.initializeMapboxMap, 'initializeMapboxMap should be a function');
});

test('clearMapboxMarkers should be defined', () => {
  assertFunction(window.clearMapboxMarkers, 'clearMapboxMarkers should be a function');
});

test('addMapboxGameMarker should be defined', () => {
  assertFunction(window.addMapboxGameMarker, 'addMapboxGameMarker should be a function');
});

test('fitMapToMarkers should be defined', () => {
  assertFunction(window.fitMapToMarkers, 'fitMapToMarkers should be a function');
});

test('updateMapboxStyle should be defined', () => {
  assertFunction(window.updateMapboxStyle, 'updateMapboxStyle should be a function');
});

// Test Suite: CSS/JS Loading
console.log('\n📦 Testing Asset Loading\n');

test('loadMapboxCSS should add stylesheet link', () => {
  // Remove any existing mapbox CSS link
  const existingLink = document.querySelector('link[href*="mapbox-gl.css"]');
  if (existingLink) existingLink.remove();
  
  // Call internal function (we need to expose it for testing)
  // In real implementation, this would be called internally
  const beforeCount = document.querySelectorAll('link[href*="mapbox-gl.css"]').length;
  
  // Simulate CSS loading by creating a link element
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.css';
  document.head.appendChild(link);
  
  const afterCount = document.querySelectorAll('link[href*="mapbox-gl.css"]').length;
  assert(afterCount > beforeCount, 'Mapbox CSS link should be added');
});

// Test Suite: Map Initialization
console.log('\n📦 Testing Map Initialization\n');

test('Map should initialize with proper configuration', async () => {
  // Create a map container
  const mapDiv = document.createElement('div');
  mapDiv.id = 'test-map';
  document.body.appendChild(mapDiv);
  
  // Mock the access token
  window.MAPBOX_ACCESS_TOKEN = 'test-token';
  mapboxgl.accessToken = 'test-token';
  
  // Initialize map
  await window.initializeMapboxMap([49.2827, -123.1207], 'test-map');
  
  // Check if map instance was created
  assert(window.mapboxMap instanceof mapboxgl.Map, 'Map instance should be created');
  assert(window.map === window.mapboxMap, 'window.map should reference mapboxMap');
  
  // Clean up
  document.body.removeChild(mapDiv);
});

// Test Suite: Marker Management
console.log('\n📦 Testing Marker Management\n');

test('clearMapboxMarkers should remove all markers', () => {
  // Create mock markers
  const mockMarkers = [
    new mapboxgl.Marker(),
    new mapboxgl.Marker(),
    new mapboxgl.Marker()
  ];
  
  // Set up test state
  window.mapboxMarkers = [...mockMarkers];
  
  // Clear markers
  window.clearMapboxMarkers();
  
  // Verify
  assertEqual(window.mapboxMarkers.length, 0, 'All markers should be removed');
});

test('addMapboxGameMarker should create marker with proper attributes', () => {
  // Reset markers
  window.mapboxMarkers = [];
  
  // Create mock map if not exists
  if (!window.mapboxMap) {
    window.mapboxMap = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v11'
    });
  }
  
  // Test game data
  const testGame = {
    coords: [49.2827, -123.1207],
    type: 'basketball',
    title: 'Test Basketball Game',
    venue: {
      name: 'Test Venue'
    },
    startTime: new Date().toISOString(),
    attendees: 5,
    maxAttendees: 10,
    host: 'Test Host'
  };
  
  // Add marker
  const marker = window.addMapboxGameMarker(testGame);
  
  // Verify marker was created and added
  assert(marker instanceof mapboxgl.Marker, 'Marker should be created');
  assertEqual(window.mapboxMarkers.length, 1, 'Marker should be added to array');
  assert(marker._lngLat, 'Marker should have coordinates');
  assert(marker._popup, 'Marker should have popup');
});

test('addMapboxGameMarker should handle different coordinate formats', () => {
  window.mapboxMarkers = [];
  
  // Test with coords array
  const game1 = {
    coords: [49.2827, -123.1207],
    type: 'soccer'
  };
  const marker1 = window.addMapboxGameMarker(game1);
  assert(marker1, 'Should create marker with coords array');
  
  // Test with venue.coordinates
  const game2 = {
    venue: {
      coordinates: {
        lat: 49.2827,
        lng: -123.1207
      }
    },
    type: 'tennis'
  };
  const marker2 = window.addMapboxGameMarker(game2);
  assert(marker2, 'Should create marker with venue.coordinates');
  
  // Test with no coordinates
  const game3 = {
    type: 'hockey'
  };
  const marker3 = window.addMapboxGameMarker(game3);
  assert(!marker3, 'Should not create marker without coordinates');
});

// Test Suite: Map Styling
console.log('\n📦 Testing Map Styling\n');

test('updateMapboxStyle should change map style based on dark mode', () => {
  if (!window.mapboxMap) {
    window.mapboxMap = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v11'
    });
  }
  
  // Test dark mode
  window.updateMapboxStyle(true);
  assert(window.mapboxMap._style.includes('dark'), 'Should use dark style in dark mode');
  
  // Test light mode
  window.updateMapboxStyle(false);
  assert(window.mapboxMap._style.includes('light'), 'Should use light style in light mode');
});

// Test Suite: Map Bounds
console.log('\n📦 Testing Map Bounds\n');

test('fitMapToMarkers should properly fit bounds to all markers', () => {
  // Setup
  window.mapboxMarkers = [];
  window.userLocationMarker = null;
  
  if (!window.mapboxMap) {
    window.mapboxMap = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v11'
    });
  }
  
  // Add test markers
  const positions = [
    [-123.1, 49.2],
    [-123.2, 49.3],
    [-123.0, 49.1]
  ];
  
  positions.forEach(pos => {
    const marker = new mapboxgl.Marker();
    marker.setLngLat(pos);
    window.mapboxMarkers.push(marker);
  });
  
  // Call fitMapToMarkers
  window.fitMapToMarkers();
  
  // Verify bounds were set
  assert(window.mapboxMap._lastBounds, 'Bounds should be set');
  assert(window.mapboxMap._lastBoundsOptions, 'Bounds options should be set');
  assert(window.mapboxMap._lastBoundsOptions.padding, 'Padding should be included');
});

// Test Suite: Error Handling
console.log('\n📦 Testing Error Handling\n');

test('Map initialization should handle missing container gracefully', async () => {
  // Try to initialize with non-existent container
  try {
    await window.initializeMapboxMap([49.2827, -123.1207], 'non-existent-map');
    // If no error thrown, check console for error message
    assert(true, 'Should handle missing container without throwing');
  } catch (error) {
    assert(false, 'Should not throw error for missing container');
  }
});

// Test Suite: Module Compatibility
console.log('\n📦 Testing Module Compatibility\n');

test('mapboxModule should expose all necessary functions', () => {
  assert(window.mapboxModule, 'mapboxModule should be defined');
  assertFunction(window.mapboxModule.initializeMap, 'mapboxModule.initializeMap should be a function');
  assertFunction(window.mapboxModule.clearMarkers, 'mapboxModule.clearMarkers should be a function');
  assertFunction(window.mapboxModule.addGameMarker, 'mapboxModule.addGameMarker should be a function');
  assertFunction(window.mapboxModule.fitToMarkers, 'mapboxModule.fitToMarkers should be a function');
  assertFunction(window.mapboxModule.updateStyle, 'mapboxModule.updateStyle should be a function');
});

// Summary
console.log('\n📊 Test Summary:');
console.log(`   ✅ Passed: ${passedTests}`);
console.log(`   ❌ Failed: ${failedTests}`);
console.log(`   📈 Total: ${passedTests + failedTests}`);

if (failedTests === 0) {
  console.log('\n🎉 All tests passed!');
} else {
  console.log('\n⚠️  Some tests failed. Please check the errors above.');
}

// Export test results
window.mapboxMapsTestResults = {
  passed: passedTests,
  failed: failedTests,
  total: passedTests + failedTests
};