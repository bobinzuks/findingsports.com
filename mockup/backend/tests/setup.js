// Test setup file - runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.PORT = 0; // Use random port for tests

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Add custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  toContainObject(received, expected) {
    const pass = received.some(item => 
      Object.keys(expected).every(key => item[key] === expected[key])
    );
    if (pass) {
      return {
        message: () => `expected array not to contain object ${JSON.stringify(expected)}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected array to contain object ${JSON.stringify(expected)}`,
        pass: false,
      };
    }
  }
});

// Global test utilities
global.testUtils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  waitFor: async (condition, timeout = 5000, interval = 100) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) return true;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('Timeout waiting for condition');
  },
  
  mockDate: (date) => {
    const RealDate = Date;
    global.Date = class extends RealDate {
      constructor(...args) {
        if (args.length === 0) {
          return new RealDate(date);
        }
        return new RealDate(...args);
      }
      static now() {
        return new RealDate(date).getTime();
      }
    };
  },
  
  restoreDate: () => {
    global.Date = Date;
  }
};

// Clean up after tests
afterEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
});

// Increase timeout for integration tests
if (process.env.TEST_TYPE === 'integration') {
  jest.setTimeout(60000);
}