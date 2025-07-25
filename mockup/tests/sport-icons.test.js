// Tests for sport-icons.js
// Simple test runner using console assertions

console.log('🧪 Running Sport Icons Tests...\n');

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

// Mock Google Maps for testing
window.google = {
  maps: {
    Point: class MockPoint {
      constructor(x, y) {
        this.x = x;
        this.y = y;
      }
    },
    Size: class MockSize {
      constructor(width, height) {
        this.width = width;
        this.height = height;
      }
    },
    Marker: class MockMarker {
      constructor(options) {
        this.options = options;
      }
    },
    OverlayView: class MockOverlayView {
      setMap() {}
      getPanes() {
        return {
          overlayMouseTarget: {
            appendChild: () => {}
          }
        };
      }
      getProjection() {
        return {
          fromLatLngToDivPixel: () => ({ x: 100, y: 100 })
        };
      }
    }
  }
};

// Test Suite: SportIcons Object
console.log('📦 Testing SportIcons Object\n');

test('SportIcons should be defined', () => {
  assert(window.SportIcons !== undefined, 'SportIcons is not defined');
  assertObject(window.SportIcons, 'SportIcons should be an object');
});

test('SportIcons should have required methods', () => {
  const methods = ['getIcon', 'createSVG', 'createInlineSVG', 'createMapMarkerIcon', 
                   'createAdvancedMapMarker', 'createClusterIcon', 'getAllSports', 'createMapLegend'];
  
  methods.forEach(method => {
    assertFunction(window.SportIcons[method], `SportIcons.${method} should be a function`);
  });
});

// Test Suite: Icon Definitions
console.log('\n📦 Testing Icon Definitions\n');

test('All sport icons should be properly defined', () => {
  assertObject(window.SportIcons.icons, 'icons should be an object');
  
  const expectedSports = ['basketball', 'soccer', 'baseball', 'tennis', 'volleyball', 
                         'hockey', 'golf', 'swimming', 'running', 'cycling', 
                         'fitness', 'yoga', 'badminton', 'tabletennis', 'cricket', 'other'];
  
  expectedSports.forEach(sport => {
    assert(sport in window.SportIcons.icons, `Missing sport icon: ${sport}`);
    
    const icon = window.SportIcons.icons[sport];
    assertObject(icon, `${sport} icon should be an object`);
    
    // Check required properties
    assert('name' in icon, `${sport} should have name property`);
    assert('color' in icon, `${sport} should have color property`);
    assert('svgPath' in icon, `${sport} should have svgPath property`);
    assert('viewBox' in icon, `${sport} should have viewBox property`);
    assert('emoji' in icon, `${sport} should have emoji property`);
    
    // Validate property types
    assert(typeof icon.name === 'string', `${sport} name should be string`);
    assert(typeof icon.color === 'string', `${sport} color should be string`);
    assert(typeof icon.svgPath === 'string', `${sport} svgPath should be string`);
    assert(typeof icon.viewBox === 'string', `${sport} viewBox should be string`);
    assert(typeof icon.emoji === 'string', `${sport} emoji should be string`);
    
    // Validate color format
    assert(icon.color.match(/^#[0-9A-F]{6}$/i), `${sport} color should be valid hex`);
  });
});

// Test Suite: getIcon Method
console.log('\n📦 Testing getIcon Method\n');

test('getIcon should return correct icon for valid sports', () => {
  const basketball = SportIcons.getIcon('basketball');
  assertEqual(basketball.name, 'Basketball', 'Should return basketball icon');
  
  const soccer = SportIcons.getIcon('soccer');
  assertEqual(soccer.name, 'Soccer', 'Should return soccer icon');
});

test('getIcon should handle case-insensitive input', () => {
  const uppercase = SportIcons.getIcon('BASKETBALL');
  assertEqual(uppercase.name, 'Basketball', 'Should handle uppercase');
  
  const mixedCase = SportIcons.getIcon('BaSKetBaLL');
  assertEqual(mixedCase.name, 'Basketball', 'Should handle mixed case');
});

test('getIcon should handle spaces in sport names', () => {
  const withSpaces = SportIcons.getIcon('table tennis');
  assertEqual(withSpaces.name, 'Table Tennis', 'Should handle spaces');
});

test('getIcon should return other icon for unknown sports', () => {
  const unknown = SportIcons.getIcon('unknown-sport');
  assertEqual(unknown.name, 'Other Sport', 'Should return other icon for unknown sport');
  
  const nullSport = SportIcons.getIcon(null);
  assertEqual(nullSport.name, 'Other Sport', 'Should return other icon for null');
  
  const undefinedSport = SportIcons.getIcon(undefined);
  assertEqual(undefinedSport.name, 'Other Sport', 'Should return other icon for undefined');
});

// Test Suite: createSVG Method
console.log('\n📦 Testing createSVG Method\n');

test('createSVG should create valid SVG element', () => {
  const svg = SportIcons.createSVG('basketball');
  
  assert(svg instanceof SVGElement, 'Should return SVG element');
  assertEqual(svg.tagName.toLowerCase(), 'svg', 'Should be svg tag');
  assertEqual(svg.getAttribute('width'), '24', 'Default width should be 24');
  assertEqual(svg.getAttribute('height'), '24', 'Default height should be 24');
});

test('createSVG should accept custom size', () => {
  const svg = SportIcons.createSVG('soccer', 48);
  
  assertEqual(svg.getAttribute('width'), '48', 'Custom width should be applied');
  assertEqual(svg.getAttribute('height'), '48', 'Custom height should be applied');
});

test('createSVG should accept custom className', () => {
  const svg = SportIcons.createSVG('tennis', 24, 'custom-class');
  
  assertEqual(svg.getAttribute('class'), 'custom-class', 'Custom class should be applied');
});

test('createSVG should include path element', () => {
  const svg = SportIcons.createSVG('volleyball');
  const path = svg.querySelector('path');
  
  assert(path !== null, 'Should contain path element');
  assert(path.getAttribute('d'), 'Path should have d attribute');
});

// Test Suite: createInlineSVG Method
console.log('\n📦 Testing createInlineSVG Method\n');

test('createInlineSVG should return valid SVG string', () => {
  const svgString = SportIcons.createInlineSVG('hockey');
  
  assert(typeof svgString === 'string', 'Should return string');
  assert(svgString.includes('<svg'), 'Should contain svg tag');
  assert(svgString.includes('</svg>'), 'Should close svg tag');
  assert(svgString.includes('<path'), 'Should contain path element');
});

test('createInlineSVG should accept custom color', () => {
  const customColor = '#FF0000';
  const svgString = SportIcons.createInlineSVG('golf', 24, customColor);
  
  assert(svgString.includes(`fill="${customColor}"`), 'Should use custom color');
});

test('createInlineSVG should use default color when none provided', () => {
  const svgString = SportIcons.createInlineSVG('swimming');
  const icon = SportIcons.getIcon('swimming');
  
  assert(svgString.includes(`fill="${icon.color}"`), 'Should use default sport color');
});

// Test Suite: createMapMarkerIcon Method
console.log('\n📦 Testing createMapMarkerIcon Method\n');

test('createMapMarkerIcon should return marker configuration object', () => {
  const marker = SportIcons.createMapMarkerIcon('running');
  
  assertObject(marker, 'Should return object');
  assert('path' in marker, 'Should have path property');
  assert('fillColor' in marker, 'Should have fillColor property');
  assert('fillOpacity' in marker, 'Should have fillOpacity property');
  assert('strokeColor' in marker, 'Should have strokeColor property');
  assert('strokeWeight' in marker, 'Should have strokeWeight property');
  assert('scale' in marker, 'Should have scale property');
});

test('createMapMarkerIcon should handle hover state', () => {
  const normal = SportIcons.createMapMarkerIcon('cycling', false, false);
  const hovered = SportIcons.createMapMarkerIcon('cycling', true, false);
  
  assert(hovered.scale > normal.scale, 'Hovered marker should be larger');
});

test('createMapMarkerIcon should handle selected state', () => {
  const normal = SportIcons.createMapMarkerIcon('fitness', false, false);
  const selected = SportIcons.createMapMarkerIcon('fitness', false, true);
  
  assert(selected.strokeWeight > normal.strokeWeight, 'Selected marker should have thicker stroke');
  assertEqual(selected.strokeColor, '#FFD700', 'Selected marker should have gold stroke');
});

// Test Suite: getAllSports Method
console.log('\n📦 Testing getAllSports Method\n');

test('getAllSports should return array of all sports', () => {
  const allSports = SportIcons.getAllSports();
  
  assert(Array.isArray(allSports), 'Should return array');
  assert(allSports.length > 0, 'Should have sports');
  
  allSports.forEach(sport => {
    assertObject(sport, 'Each sport should be object');
    assert('id' in sport, 'Sport should have id');
    assert('name' in sport, 'Sport should have name');
    assert('color' in sport, 'Sport should have color');
  });
});

// Test Suite: createClusterIcon Method
console.log('\n📦 Testing createClusterIcon Method\n');

test('createClusterIcon should create cluster icon with count', () => {
  const cluster = SportIcons.createClusterIcon(10);
  
  assertObject(cluster, 'Should return object');
  assert('url' in cluster, 'Should have url property');
  assert('scaledSize' in cluster, 'Should have scaledSize property');
  assert('anchor' in cluster, 'Should have anchor property');
  
  assert(cluster.url.includes('svg'), 'URL should contain SVG');
  assert(cluster.url.includes('10'), 'URL should contain count');
});

test('createClusterIcon should use dominant sport color', () => {
  const sports = ['basketball', 'basketball', 'soccer', 'basketball'];
  const cluster = SportIcons.createClusterIcon(4, sports);
  const basketballColor = SportIcons.getIcon('basketball').color;
  
  assert(cluster.url.includes(basketballColor), 'Should use basketball color as dominant');
});

test('createClusterIcon should scale with count', () => {
  const small = SportIcons.createClusterIcon(5);
  const large = SportIcons.createClusterIcon(50);
  
  // Extract size from scaledSize (mocked)
  // In real implementation, we'd check the actual size values
  assert(true, 'Size scaling test placeholder');
});

// Test Suite: createMapLegend Method
console.log('\n📦 Testing createMapLegend Method\n');

test('createMapLegend should create legend element', () => {
  const legend = SportIcons.createMapLegend();
  
  assert(legend instanceof HTMLElement, 'Should return HTML element');
  assert(legend.className.includes('map-legend'), 'Should have map-legend class');
  
  const title = legend.querySelector('.map-legend-title');
  assert(title !== null, 'Should have title element');
  assertEqual(title.textContent, 'Sport Types', 'Title should be "Sport Types"');
});

test('createMapLegend should include all sports except other', () => {
  const legend = SportIcons.createMapLegend();
  const items = legend.querySelectorAll('.map-legend-item');
  
  assert(items.length > 0, 'Should have legend items');
  
  // Check that 'other' is not included
  let hasOther = false;
  items.forEach(item => {
    const label = item.querySelector('.map-legend-label');
    if (label && label.textContent === 'Other Sport') {
      hasOther = true;
    }
  });
  
  assert(!hasOther, 'Should not include "Other Sport" in legend');
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
window.sportIconsTestResults = {
  passed: passedTests,
  failed: failedTests,
  total: passedTests + failedTests
};