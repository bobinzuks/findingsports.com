// Tests for geolocation-service.js
// Simple test runner using console assertions

console.log('🧪 Running Geolocation Service Tests...\n');

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

function assertObject(obj, message) {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error(message || 'Expected an object');
  }
}

function assertFunction(fn, message) {
  if (typeof fn !== 'function') {
    throw new Error(message || 'Expected a function');
  }
}

function assertInstanceOf(obj, constructor, message) {
  if (!(obj instanceof constructor)) {
    throw new Error(message || `Expected instance of ${constructor.name}`);
  }
}

// Mock navigator.geolocation
const mockPosition = {
  coords: {
    latitude: 49.2827,
    longitude: -123.1207,
    accuracy: 10
  },
  timestamp: Date.now()
};

navigator.geolocation = {
  getCurrentPosition: (success, error, options) => {
    setTimeout(() => success(mockPosition), 10);
  },
  watchPosition: (success, error, options) => {
    setTimeout(() => success(mockPosition), 10);
    return 123; // Mock watch ID
  },
  clearWatch: (id) => {}
};

// Mock navigator.permissions
navigator.permissions = {
  query: async (desc) => {
    return {
      state: 'granted',
      addEventListener: () => {}
    };
  }
};

// Mock fetch for API calls
const originalFetch = window.fetch;
window.fetch = async (url, options) => {
  // Mock reverse geocoding
  if (url.includes('api.mapbox.com/geocoding/v5/mapbox.places')) {
    return {
      ok: true,
      json: async () => ({
        features: [{
          place_name: 'Vancouver, BC, Canada',
          text: 'Vancouver',
          context: [
            { id: 'place.123', text: 'Vancouver' },
            { id: 'region.456', text: 'British Columbia' },
            { id: 'postcode.789', text: 'V6B' }
          ],
          center: [-123.1207, 49.2827]
        }]
      })
    };
  }
  
  // Mock nearby games API
  if (url.includes('/api/v2/games/nearby')) {
    return {
      ok: true,
      statusText: 'OK',
      json: async () => ({
        games: [
          {
            id: 1,
            sport: 'basketball',
            venue: {
              name: 'Community Center',
              coordinates: { lat: 49.28, lng: -123.12 }
            },
            startTime: new Date(Date.now() + 3600000).toISOString(),
            endTime: new Date(Date.now() + 7200000).toISOString()
          },
          {
            id: 2,
            sport: 'soccer',
            venue: {
              name: 'Park Field',
              coordinates: { lat: 49.29, lng: -123.13 }
            },
            startTime: new Date(Date.now() + 86400000).toISOString(),
            endTime: new Date(Date.now() + 90000000).toISOString()
          }
        ]
      })
    };
  }
  
  // Mock IP geolocation
  if (url.includes('ipapi.co/json')) {
    return {
      ok: true,
      json: async () => ({
        latitude: 49.2827,
        longitude: -123.1207,
        city: 'Vancouver',
        region: 'British Columbia'
      })
    };
  }
  
  // Fallback to original fetch
  return originalFetch(url, options);
};

// Test Suite: GeolocationService Class
console.log('📦 Testing GeolocationService Class\n');

test('GeolocationService should be instantiated', () => {
  assertInstanceOf(window.geolocationService, GeolocationService, 'geolocationService should be instance of GeolocationService');
});

test('GeolocationService should have required properties', () => {
  const service = window.geolocationService;
  
  assert('userLocation' in service, 'Should have userLocation property');
  assert('locationPermission' in service, 'Should have locationPermission property');
  assert('watchId' in service, 'Should have watchId property');
  assert('locationListeners' in service, 'Should have locationListeners property');
  assert('nearbyGames' in service, 'Should have nearbyGames property');
  assert('searchRadius' in service, 'Should have searchRadius property');
  
  assertEqual(service.searchRadius, 10, 'Default search radius should be 10km');
});

test('GeolocationService should have required methods', () => {
  const methods = [
    'initialize', 'getCurrentLocation', 'watchLocation', 'stopWatching',
    'reverseGeocode', 'geocodeAddress', 'fetchNearbyGames', 'getFallbackLocation',
    'calculateDistance', 'filterGames', 'addEventListener', 'removeEventListener',
    'setSearchRadius', 'getGamesByDistance', 'getGamesBySport', 'clearCache'
  ];
  
  methods.forEach(method => {
    assertFunction(window.geolocationService[method], `Should have ${method} method`);
  });
});

// Test Suite: Initialization
console.log('\n📦 Testing Initialization\n');

test('initialize should check for geolocation support', async () => {
  const result = await window.geolocationService.initialize();
  assert(result === true, 'Initialize should return true when geolocation is supported');
});

test('initialize should check permission status', async () => {
  await window.geolocationService.initialize();
  assertEqual(window.geolocationService.locationPermission, 'granted', 'Should set permission status');
});

// Test Suite: Location Retrieval
console.log('\n📦 Testing Location Retrieval\n');

test('getCurrentLocation should return location object', async () => {
  const location = await window.geolocationService.getCurrentLocation();
  
  assertObject(location, 'Should return location object');
  assert('lat' in location, 'Location should have lat');
  assert('lng' in location, 'Location should have lng');
  assert('accuracy' in location, 'Location should have accuracy');
  assert('timestamp' in location, 'Location should have timestamp');
  assert('source' in location, 'Location should have source');
  
  assertEqual(location.source, 'gps', 'Source should be gps');
});

test('getCurrentLocation should update userLocation', async () => {
  await window.geolocationService.getCurrentLocation();
  
  assert(window.geolocationService.userLocation !== null, 'userLocation should be set');
  assertEqual(window.geolocationService.userLocation.lat, 49.2827, 'Latitude should match');
  assertEqual(window.geolocationService.userLocation.lng, -123.1207, 'Longitude should match');
});

// Test Suite: Location Watching
console.log('\n📦 Testing Location Watching\n');

test('watchLocation should return watch ID', () => {
  const watchId = window.geolocationService.watchLocation();
  
  assert(typeof watchId === 'number', 'Watch ID should be a number');
  assertEqual(window.geolocationService.watchId, watchId, 'Watch ID should be stored');
});

test('stopWatching should clear watch ID', () => {
  window.geolocationService.watchLocation();
  window.geolocationService.stopWatching();
  
  assertEqual(window.geolocationService.watchId, null, 'Watch ID should be cleared');
});

// Test Suite: Geocoding
console.log('\n📦 Testing Geocoding\n');

test('reverseGeocode should return address information', async () => {
  window.geolocationService.mapboxToken = 'test-token';
  
  const result = await window.geolocationService.reverseGeocode(49.2827, -123.1207);
  
  assertObject(result, 'Should return object');
  assert('address' in result, 'Should have address');
  assert('city' in result, 'Should have city');
  assert('region' in result, 'Should have region');
  
  assertEqual(result.city, 'Vancouver', 'City should be Vancouver');
});

test('geocodeAddress should return coordinates', async () => {
  window.geolocationService.mapboxToken = 'test-token';
  
  const result = await window.geolocationService.geocodeAddress('Vancouver, BC');
  
  assertObject(result, 'Should return object');
  assert('lat' in result, 'Should have lat');
  assert('lng' in result, 'Should have lng');
  assert('address' in result, 'Should have address');
  assert('confidence' in result, 'Should have confidence');
});

// Test Suite: Game Fetching
console.log('\n📦 Testing Game Fetching\n');

test('fetchNearbyGames should return array of games', async () => {
  const location = { lat: 49.2827, lng: -123.1207 };
  const games = await window.geolocationService.fetchNearbyGames(location);
  
  assert(Array.isArray(games), 'Should return array');
  assert(games.length > 0, 'Should have games');
  
  const game = games[0];
  assert('distance' in game, 'Game should have distance');
  assert('isToday' in game, 'Game should have isToday flag');
  assert('isLive' in game, 'Game should have isLive flag');
  assert('formattedTime' in game, 'Game should have formattedTime');
});

test('fetchNearbyGames should cache results', async () => {
  const location = { lat: 49.2827, lng: -123.1207 };
  
  // Clear cache first
  window.geolocationService.clearCache();
  
  // First call
  await window.geolocationService.fetchNearbyGames(location);
  const cacheSize1 = window.geolocationService.gamesCache.size;
  
  // Second call (should use cache)
  await window.geolocationService.fetchNearbyGames(location);
  const cacheSize2 = window.geolocationService.gamesCache.size;
  
  assertEqual(cacheSize1, cacheSize2, 'Cache size should remain the same');
});

// Test Suite: Distance Calculations
console.log('\n📦 Testing Distance Calculations\n');

test('calculateDistance should return correct distance', () => {
  const distance = window.geolocationService.calculateDistance(
    49.2827, -123.1207,  // Vancouver
    49.2608, -123.1139   // Downtown Vancouver
  );
  
  assert(typeof distance === 'number', 'Distance should be a number');
  assert(distance > 0, 'Distance should be positive');
  assert(distance < 5, 'Distance should be less than 5km for nearby points');
});

test('hasLocationChangedSignificantly should detect significant changes', () => {
  window.geolocationService.userLocation = { lat: 49.2827, lng: -123.1207 };
  
  // Small change (< 100m)
  const smallChange = window.geolocationService.hasLocationChangedSignificantly({
    lat: 49.2828, lng: -123.1207
  });
  assert(!smallChange, 'Should not detect small change as significant');
  
  // Large change (> 100m)
  const largeChange = window.geolocationService.hasLocationChangedSignificantly({
    lat: 49.2900, lng: -123.1300
  });
  assert(largeChange, 'Should detect large change as significant');
});

// Test Suite: Game Filtering
console.log('\n📦 Testing Game Filtering\n');

test('filterGames should filter by sport', async () => {
  const location = { lat: 49.2827, lng: -123.1207 };
  await window.geolocationService.fetchNearbyGames(location);
  
  const basketballGames = window.geolocationService.filterGames({ sport: 'basketball' });
  
  assert(Array.isArray(basketballGames), 'Should return array');
  basketballGames.forEach(game => {
    assertEqual(game.sport, 'basketball', 'All games should be basketball');
  });
});

test('filterGames should filter by distance', async () => {
  const location = { lat: 49.2827, lng: -123.1207 };
  await window.geolocationService.fetchNearbyGames(location);
  
  const nearGames = window.geolocationService.filterGames({ maxDistance: 5 });
  
  nearGames.forEach(game => {
    assert(game.distance <= 5, 'All games should be within 5km');
  });
});

// Test Suite: Event Management
console.log('\n📦 Testing Event Management\n');

test('addEventListener should add listener', () => {
  const callback = () => {};
  const initialCount = window.geolocationService.locationListeners.length;
  
  window.geolocationService.addEventListener('locationUpdate', callback);
  
  const newCount = window.geolocationService.locationListeners.length;
  assertEqual(newCount, initialCount + 1, 'Should add one listener');
});

test('removeEventListener should remove listener', () => {
  const callback = () => {};
  
  window.geolocationService.addEventListener('locationUpdate', callback);
  const countAfterAdd = window.geolocationService.locationListeners.length;
  
  window.geolocationService.removeEventListener('locationUpdate', callback);
  const countAfterRemove = window.geolocationService.locationListeners.length;
  
  assertEqual(countAfterRemove, countAfterAdd - 1, 'Should remove one listener');
});

// Test Suite: Fallback Location
console.log('\n📦 Testing Fallback Location\n');

test('getFallbackLocation should return location from IP', async () => {
  const location = await window.geolocationService.getFallbackLocation();
  
  assertObject(location, 'Should return location object');
  assertEqual(location.source, 'ip', 'Source should be ip');
  assertEqual(location.city, 'Vancouver', 'City should be Vancouver');
});

// Test Suite: Game Grouping
console.log('\n📦 Testing Game Grouping\n');

test('getGamesByDistance should group games correctly', async () => {
  const location = { lat: 49.2827, lng: -123.1207 };
  await window.geolocationService.fetchNearbyGames(location);
  
  const groups = window.geolocationService.getGamesByDistance();
  
  assertObject(groups, 'Should return object');
  assert('nearby' in groups, 'Should have nearby group');
  assert('close' in groups, 'Should have close group');
  assert('moderate' in groups, 'Should have moderate group');
  assert('far' in groups, 'Should have far group');
  
  assert(Array.isArray(groups.nearby), 'Each group should be array');
});

test('getGamesBySport should group games by sport', async () => {
  const location = { lat: 49.2827, lng: -123.1207 };
  await window.geolocationService.fetchNearbyGames(location);
  
  const groups = window.geolocationService.getGamesBySport();
  
  assertObject(groups, 'Should return object');
  Object.keys(groups).forEach(sport => {
    assert(Array.isArray(groups[sport]), `${sport} should be array`);
    groups[sport].forEach(game => {
      assertEqual(game.sport, sport, `All games in ${sport} group should be ${sport}`);
    });
  });
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

// Restore original fetch
window.fetch = originalFetch;

// Export test results
window.geolocationServiceTestResults = {
  passed: passedTests,
  failed: failedTests,
  total: passedTests + failedTests
};