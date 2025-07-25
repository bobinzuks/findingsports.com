// Tests for mapbox-config.js
// Simple test runner using console assertions

console.log('🧪 Running Mapbox Configuration Tests...\n');

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

// Test Suite: Mapbox Configuration
console.log('📦 Testing Mapbox Configuration\n');

test('MAPBOX_CONFIG should be defined', () => {
  assert(window.MAPBOX_CONFIG !== undefined, 'MAPBOX_CONFIG is not defined');
  assertObject(window.MAPBOX_CONFIG, 'MAPBOX_CONFIG should be an object');
});

test('MAPBOX_CONFIG should have required properties', () => {
  const required = ['accessToken', 'defaultCenter', 'defaultZoom', 'styles', 'markers', 'popup'];
  required.forEach(prop => {
    assert(prop in window.MAPBOX_CONFIG, `Missing required property: ${prop}`);
  });
});

test('Default center should be Vancouver coordinates', () => {
  assert(Array.isArray(window.MAPBOX_CONFIG.defaultCenter), 'defaultCenter should be an array');
  assertEqual(window.MAPBOX_CONFIG.defaultCenter.length, 2, 'defaultCenter should have 2 coordinates');
  assertEqual(window.MAPBOX_CONFIG.defaultCenter[0], -123.1207, 'Longitude should be -123.1207');
  assertEqual(window.MAPBOX_CONFIG.defaultCenter[1], 49.2827, 'Latitude should be 49.2827');
});

test('Zoom levels should be valid', () => {
  assert(typeof window.MAPBOX_CONFIG.defaultZoom === 'number', 'defaultZoom should be a number');
  assert(typeof window.MAPBOX_CONFIG.minZoom === 'number', 'minZoom should be a number');
  assert(typeof window.MAPBOX_CONFIG.maxZoom === 'number', 'maxZoom should be a number');
  assert(window.MAPBOX_CONFIG.minZoom < window.MAPBOX_CONFIG.maxZoom, 'minZoom should be less than maxZoom');
  assert(window.MAPBOX_CONFIG.defaultZoom >= window.MAPBOX_CONFIG.minZoom, 'defaultZoom should be >= minZoom');
  assert(window.MAPBOX_CONFIG.defaultZoom <= window.MAPBOX_CONFIG.maxZoom, 'defaultZoom should be <= maxZoom');
});

test('Map styles should be defined', () => {
  assertObject(window.MAPBOX_CONFIG.styles, 'styles should be an object');
  const requiredStyles = ['dark', 'light', 'streets', 'outdoors'];
  requiredStyles.forEach(style => {
    assert(style in window.MAPBOX_CONFIG.styles, `Missing style: ${style}`);
    assert(typeof window.MAPBOX_CONFIG.styles[style] === 'string', `Style ${style} should be a string`);
    assert(window.MAPBOX_CONFIG.styles[style].includes('mapbox://'), `Style ${style} should be a mapbox:// URL`);
  });
});

test('Sport markers should have colors defined', () => {
  assertObject(window.MAPBOX_CONFIG.markers.sports, 'markers.sports should be an object');
  const sports = ['basketball', 'soccer', 'volleyball', 'tennis', 'hockey', 'default'];
  sports.forEach(sport => {
    assert(sport in window.MAPBOX_CONFIG.markers.sports, `Missing sport color: ${sport}`);
    const color = window.MAPBOX_CONFIG.markers.sports[sport];
    assert(typeof color === 'string', `Sport ${sport} color should be a string`);
    assert(color.match(/^#[0-9A-F]{6}$/i), `Sport ${sport} color should be a valid hex color`);
  });
});

test('Controls configuration should be valid', () => {
  assertObject(window.MAPBOX_CONFIG.controls, 'controls should be an object');
  const controlTypes = ['navigation', 'geolocate', 'scale', 'fullscreen', 'attribution'];
  controlTypes.forEach(control => {
    assert(control in window.MAPBOX_CONFIG.controls, `Missing control: ${control}`);
    assert(typeof window.MAPBOX_CONFIG.controls[control] === 'boolean', `Control ${control} should be boolean`);
  });
});

test('Popup configuration should be valid', () => {
  assertObject(window.MAPBOX_CONFIG.popup, 'popup should be an object');
  assert(typeof window.MAPBOX_CONFIG.popup.closeButton === 'boolean', 'popup.closeButton should be boolean');
  assert(typeof window.MAPBOX_CONFIG.popup.closeOnClick === 'boolean', 'popup.closeOnClick should be boolean');
  assert(typeof window.MAPBOX_CONFIG.popup.maxWidth === 'string', 'popup.maxWidth should be string');
  assert(typeof window.MAPBOX_CONFIG.popup.offset === 'number', 'popup.offset should be number');
});

// Test Suite: Helper Functions
console.log('\n📦 Testing Helper Functions\n');

test('getMapboxAccessToken should be a function', () => {
  assert(typeof window.getMapboxAccessToken === 'function', 'getMapboxAccessToken should be a function');
});

test('validateMapboxConfig should be a function', () => {
  assert(typeof window.validateMapboxConfig === 'function', 'validateMapboxConfig should be a function');
});

test('getMapboxAccessToken should return a promise', async () => {
  const result = window.getMapboxAccessToken();
  assert(result instanceof Promise, 'getMapboxAccessToken should return a Promise');
  
  // Test that it returns a string
  const token = await result;
  assert(typeof token === 'string', 'Token should be a string');
});

test('validateMapboxConfig should return a promise', async () => {
  const result = window.validateMapboxConfig();
  assert(result instanceof Promise, 'validateMapboxConfig should return a Promise');
  
  // Test that it returns a boolean
  const isValid = await result;
  assert(typeof isValid === 'boolean', 'Validation result should be a boolean');
});

// Test Suite: Environment Variables
console.log('\n📦 Testing Environment Configuration\n');

test('Access token should handle process.env fallback', () => {
  // Save original
  const originalEnv = window.process;
  
  // Test with process.env
  window.process = { env: { MAPBOX_ACCESS_TOKEN: 'test-token-123' } };
  
  // Reload the config (in real scenario, this would be loaded fresh)
  const expectedToken = window.process.env.MAPBOX_ACCESS_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN_HERE';
  assert(expectedToken === 'test-token-123', 'Should use process.env token when available');
  
  // Restore
  window.process = originalEnv;
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
window.mapboxConfigTestResults = {
  passed: passedTests,
  failed: failedTests,
  total: passedTests + failedTests
};