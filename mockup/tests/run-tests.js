#!/usr/bin/env node

// Simple test runner for all test files
console.log('🧪 Running all tests...\n');

const fs = require('fs');
const path = require('path');

// Test files to run
const testFiles = [
  'mapbox-config.test.js',
  'mapbox-maps.test.js',
  'sport-icons.test.js',
  'geolocation-service.test.js'
];

let totalPassed = 0;
let totalFailed = 0;
let totalTests = 0;

// Function to run a test file
function runTestFile(filename) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running ${filename}`);
  console.log('='.repeat(60));
  
  try {
    // Clear require cache to ensure fresh test run
    const fullPath = path.join(__dirname, filename);
    delete require.cache[require.resolve(fullPath)];
    
    // Run the test file
    require(fullPath);
    
    // Get test results if available
    const testName = filename.replace('.test.js', '').replace(/-/g, '');
    const resultsKey = `${testName}TestResults`;
    
    if (global.window && global.window[resultsKey]) {
      const results = global.window[resultsKey];
      totalPassed += results.passed;
      totalFailed += results.failed;
      totalTests += results.total;
    }
  } catch (error) {
    console.error(`\n❌ Error running ${filename}:`);
    console.error(error.message);
    totalFailed++;
    totalTests++;
  }
}

// Setup global window object for browser-like environment
global.window = global.window || {};
global.document = global.document || {
  createElement: (tag) => {
    if (tag === 'div') {
      return {
        id: null,
        className: '',
        style: {},
        innerHTML: '',
        querySelector: () => null,
        querySelectorAll: () => [],
        appendChild: () => {}
      };
    }
    if (tag === 'link') {
      return {
        rel: '',
        href: '',
        setAttribute: () => {}
      };
    }
    if (tag === 'script') {
      return {
        src: '',
        async: false,
        onload: null,
        onerror: null
      };
    }
    return {};
  },
  createElementNS: (ns, tag) => {
    return {
      setAttribute: () => {},
      appendChild: () => {},
      tagName: tag.toUpperCase(),
      getAttribute: () => null,
      querySelector: () => null
    };
  },
  body: {
    appendChild: () => {},
    removeChild: () => {}
  },
  head: {
    appendChild: () => {}
  },
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null
};

// Mock SVGElement
global.SVGElement = class SVGElement {
  constructor() {
    this.tagName = 'svg';
  }
};

// Mock navigator
global.navigator = {
  geolocation: {
    getCurrentPosition: () => {},
    watchPosition: () => {},
    clearWatch: () => {}
  },
  permissions: {
    query: async () => ({ state: 'granted', addEventListener: () => {} })
  }
};

// Mock fetch
global.fetch = async () => ({
  ok: true,
  json: async () => ({})
});

// Load required modules for tests
try {
  // Load configuration
  require('../js/mapbox-config.js');
  
  // Load modules (wrapped in try-catch as they might depend on Mapbox)
  try {
    require('../js/mapbox-maps.js');
  } catch (e) {
    console.log('Note: mapbox-maps.js requires Mapbox GL JS library');
  }
  
  require('../js/sport-icons.js');
  require('../js/geolocation-service.js');
} catch (error) {
  console.error('Error loading modules:', error.message);
}

// Run all test files
console.log('\n📦 Starting test suite...\n');

testFiles.forEach(runTestFile);

// Summary
setTimeout(() => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 OVERALL TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Total Passed: ${totalPassed}`);
  console.log(`❌ Total Failed: ${totalFailed}`);
  console.log(`📈 Total Tests: ${totalTests}`);
  console.log(`🎯 Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);
  console.log('='.repeat(60));
  
  if (totalFailed === 0 && totalTests > 0) {
    console.log('\n🎉 All tests passed! Great job!');
    process.exit(0);
  } else if (totalFailed > 0) {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
  } else {
    console.log('\n⚠️  No tests were run.');
    process.exit(2);
  }
}, 100);