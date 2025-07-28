#!/usr/bin/env node

const axios = require('axios');
const { performance } = require('perf_hooks');
const Table = require('cli-table3');
const chalk = require('chalk');

/**
 * Performance comparison between original and optimized API v2
 */
class APIPerformanceTester {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.results = {
      original: [],
      optimized: []
    };
  }

  /**
   * Run all performance tests
   */
  async runAllTests() {
    console.log(chalk.cyan.bold('\n🚀 API v2 Performance Comparison Test\n'));
    console.log(chalk.gray('Comparing original vs optimized implementation...\n'));

    // Test scenarios
    const scenarios = [
      {
        name: 'Basic games query',
        endpoint: '/games',
        params: {}
      },
      {
        name: 'Filtered by sport',
        endpoint: '/games',
        params: { sport: 'basketball' }
      },
      {
        name: 'Location-based search',
        endpoint: '/games',
        params: { lat: 49.2827, lng: -123.1207, radius: 5 }
      },
      {
        name: 'Multi-sport with type',
        endpoint: '/games',
        params: { sport: 'basketball,soccer,volleyball', type: 'drop-in' }
      },
      {
        name: 'Fresh data (no cache)',
        endpoint: '/games',
        params: { fresh: true }
      },
      {
        name: 'Paginated results',
        endpoint: '/games',
        params: { limit: 20, offset: 0 }
      }
    ];

    // Run tests for each scenario
    for (const scenario of scenarios) {
      console.log(chalk.yellow(`\nTesting: ${scenario.name}`));
      await this.testScenario(scenario);
    }

    // Test concurrent requests
    await this.testConcurrentRequests();

    // Test cache performance
    await this.testCachePerformance();

    // Test error handling
    await this.testErrorHandling();

    // Display results
    this.displayResults();
    this.displayRecommendations();
  }

  /**
   * Test a single scenario
   */
  async testScenario(scenario) {
    const iterations = 5;
    
    // Test original API
    const originalTimes = [];
    for (let i = 0; i < iterations; i++) {
      const time = await this.measureRequest(
        `/api/v2${scenario.endpoint}`,
        scenario.params
      );
      originalTimes.push(time);
      await this.delay(100); // Small delay between requests
    }

    // Test optimized API
    const optimizedTimes = [];
    for (let i = 0; i < iterations; i++) {
      const time = await this.measureRequest(
        `/api/v2/optimized${scenario.endpoint}`,
        scenario.params
      );
      optimizedTimes.push(time);
      await this.delay(100);
    }

    // Calculate statistics
    const originalStats = this.calculateStats(originalTimes);
    const optimizedStats = this.calculateStats(optimizedTimes);

    this.results.original.push({
      scenario: scenario.name,
      ...originalStats
    });

    this.results.optimized.push({
      scenario: scenario.name,
      ...optimizedStats
    });

    // Display immediate results
    const improvement = ((originalStats.avg - optimizedStats.avg) / originalStats.avg * 100).toFixed(2);
    const speedup = (originalStats.avg / optimizedStats.avg).toFixed(2);

    console.log(chalk.gray(`  Original:  avg ${originalStats.avg.toFixed(2)}ms, p95 ${originalStats.p95.toFixed(2)}ms`));
    console.log(chalk.gray(`  Optimized: avg ${optimizedStats.avg.toFixed(2)}ms, p95 ${optimizedStats.p95.toFixed(2)}ms`));
    
    if (improvement > 0) {
      console.log(chalk.green(`  ✅ ${improvement}% improvement (${speedup}x faster)`));
    } else {
      console.log(chalk.red(`  ❌ ${Math.abs(improvement)}% slower`));
    }
  }

  /**
   * Test concurrent request handling
   */
  async testConcurrentRequests() {
    console.log(chalk.yellow('\nTesting: Concurrent request handling'));

    const concurrentCounts = [10, 25, 50, 100];
    const results = { original: [], optimized: [] };

    for (const count of concurrentCounts) {
      // Test original
      const originalStart = performance.now();
      const originalPromises = Array(count).fill().map(() => 
        this.measureRequest('/api/v2/games', { limit: 10 })
      );
      await Promise.all(originalPromises);
      const originalTime = performance.now() - originalStart;

      // Test optimized
      const optimizedStart = performance.now();
      const optimizedPromises = Array(count).fill().map(() => 
        this.measureRequest('/api/v2/optimized/games', { limit: 10 })
      );
      await Promise.all(optimizedPromises);
      const optimizedTime = performance.now() - optimizedStart;

      results.original.push({ count, time: originalTime });
      results.optimized.push({ count, time: optimizedTime });

      const improvement = ((originalTime - optimizedTime) / originalTime * 100).toFixed(2);
      console.log(chalk.gray(`  ${count} concurrent: Original ${originalTime.toFixed(2)}ms, Optimized ${optimizedTime.toFixed(2)}ms`));
      console.log(chalk.green(`  ✅ ${improvement}% improvement`));
    }
  }

  /**
   * Test cache performance
   */
  async testCachePerformance() {
    console.log(chalk.yellow('\nTesting: Cache performance'));

    // First request (cache miss)
    const params = { sport: 'basketball', type: 'drop-in' };
    
    console.log(chalk.gray('  Testing cache miss...'));
    const originalMiss = await this.measureRequest('/api/v2/games', params);
    const optimizedMiss = await this.measureRequest('/api/v2/optimized/games', params);
    
    console.log(chalk.gray(`    Original:  ${originalMiss.toFixed(2)}ms`));
    console.log(chalk.gray(`    Optimized: ${optimizedMiss.toFixed(2)}ms`));

    // Wait for cache to be populated
    await this.delay(1000);

    // Second request (cache hit)
    console.log(chalk.gray('  Testing cache hit...'));
    const originalHit = await this.measureRequest('/api/v2/games', params);
    const optimizedHit = await this.measureRequest('/api/v2/optimized/games', params);
    
    console.log(chalk.gray(`    Original:  ${originalHit.toFixed(2)}ms`));
    console.log(chalk.gray(`    Optimized: ${optimizedHit.toFixed(2)}ms`));

    const originalCacheImprovement = ((originalMiss - originalHit) / originalMiss * 100).toFixed(2);
    const optimizedCacheImprovement = ((optimizedMiss - optimizedHit) / optimizedMiss * 100).toFixed(2);

    console.log(chalk.green(`  Original cache improvement:  ${originalCacheImprovement}%`));
    console.log(chalk.green(`  Optimized cache improvement: ${optimizedCacheImprovement}%`));
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    console.log(chalk.yellow('\nTesting: Error handling'));

    // Test invalid parameters
    const invalidParams = [
      { lat: 'invalid', lng: -123 },
      { radius: -5 },
      { limit: 'abc' }
    ];

    for (const params of invalidParams) {
      console.log(chalk.gray(`  Testing invalid params: ${JSON.stringify(params)}`));
      
      const originalError = await this.measureErrorHandling('/api/v2/games', params);
      const optimizedError = await this.measureErrorHandling('/api/v2/optimized/games', params);
      
      console.log(chalk.gray(`    Original:  ${originalError.time.toFixed(2)}ms, status: ${originalError.status}`));
      console.log(chalk.gray(`    Optimized: ${optimizedError.time.toFixed(2)}ms, status: ${optimizedError.status}`));
    }
  }

  /**
   * Measure a single request
   */
  async measureRequest(endpoint, params = {}) {
    const start = performance.now();
    
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params,
        timeout: 30000
      });
      
      const end = performance.now();
      return end - start;
    } catch (error) {
      const end = performance.now();
      console.error(chalk.red(`    Request failed: ${error.message}`));
      return end - start;
    }
  }

  /**
   * Measure error handling
   */
  async measureErrorHandling(endpoint, params) {
    const start = performance.now();
    
    try {
      await axios.get(`${this.baseUrl}${endpoint}`, { params });
      return { time: performance.now() - start, status: 200 };
    } catch (error) {
      return {
        time: performance.now() - start,
        status: error.response?.status || 'error'
      };
    }
  }

  /**
   * Calculate statistics
   */
  calculateStats(times) {
    const sorted = [...times].sort((a, b) => a - b);
    const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || sorted[sorted.length - 1];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    return { avg, p50, p95, p99, min, max };
  }

  /**
   * Display results in a table
   */
  displayResults() {
    console.log(chalk.cyan.bold('\n📊 Performance Comparison Results\n'));

    const table = new Table({
      head: [
        chalk.white.bold('Scenario'),
        chalk.white.bold('Original (ms)'),
        chalk.white.bold('Optimized (ms)'),
        chalk.white.bold('Improvement'),
        chalk.white.bold('Speedup')
      ],
      style: {
        head: [],
        border: []
      }
    });

    for (let i = 0; i < this.results.original.length; i++) {
      const original = this.results.original[i];
      const optimized = this.results.optimized[i];
      
      const improvement = ((original.avg - optimized.avg) / original.avg * 100).toFixed(2);
      const speedup = (original.avg / optimized.avg).toFixed(2);
      
      const improvementColor = improvement > 0 ? chalk.green : chalk.red;
      
      table.push([
        original.scenario,
        `${original.avg.toFixed(2)} (p95: ${original.p95.toFixed(2)})`,
        `${optimized.avg.toFixed(2)} (p95: ${optimized.p95.toFixed(2)})`,
        improvementColor(`${improvement}%`),
        improvementColor(`${speedup}x`)
      ]);
    }

    console.log(table.toString());

    // Calculate overall improvement
    const totalOriginal = this.results.original.reduce((sum, r) => sum + r.avg, 0);
    const totalOptimized = this.results.optimized.reduce((sum, r) => sum + r.avg, 0);
    const overallImprovement = ((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(2);
    const overallSpeedup = (totalOriginal / totalOptimized).toFixed(2);

    console.log(chalk.cyan.bold(`\n🎯 Overall Performance Improvement: ${chalk.green.bold(overallImprovement + '%')} (${chalk.green.bold(overallSpeedup + 'x')} faster)\n`));
  }

  /**
   * Display recommendations
   */
  displayRecommendations() {
    console.log(chalk.cyan.bold('💡 Performance Recommendations\n'));

    const recommendations = [
      {
        title: 'Enable Redis Cache',
        description: 'Connect Redis for distributed caching across multiple server instances',
        impact: 'High',
        difficulty: 'Medium'
      },
      {
        title: 'Implement CDN',
        description: 'Use a CDN like Cloudflare to cache API responses at edge locations',
        impact: 'High',
        difficulty: 'Low'
      },
      {
        title: 'Increase Worker Threads',
        description: 'Scale worker threads based on CPU cores for better parallelization',
        impact: 'Medium',
        difficulty: 'Low'
      },
      {
        title: 'Optimize Source Priorities',
        description: 'Prioritize high-reliability sources and batch similar requests',
        impact: 'Medium',
        difficulty: 'Medium'
      },
      {
        title: 'Enable HTTP/2',
        description: 'Use HTTP/2 for multiplexing and server push capabilities',
        impact: 'Medium',
        difficulty: 'Low'
      },
      {
        title: 'Implement GraphQL',
        description: 'Allow clients to request only needed fields to reduce payload size',
        impact: 'High',
        difficulty: 'High'
      }
    ];

    const table = new Table({
      head: [
        chalk.white.bold('Recommendation'),
        chalk.white.bold('Impact'),
        chalk.white.bold('Difficulty')
      ],
      style: {
        head: [],
        border: []
      },
      colWidths: [50, 10, 12]
    });

    recommendations.forEach(rec => {
      const impactColor = rec.impact === 'High' ? chalk.green : 
                         rec.impact === 'Medium' ? chalk.yellow : chalk.gray;
      const difficultyColor = rec.difficulty === 'Low' ? chalk.green :
                             rec.difficulty === 'Medium' ? chalk.yellow : chalk.red;

      table.push([
        `${chalk.bold(rec.title)}\n${chalk.gray(rec.description)}`,
        impactColor(rec.impact),
        difficultyColor(rec.difficulty)
      ]);
    });

    console.log(table.toString());
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run tests
async function main() {
  const tester = new APIPerformanceTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error.message);
    process.exit(1);
  }
}

// Check if server is running
axios.get('http://localhost:3001/api/v2/health')
  .then(() => main())
  .catch(() => {
    console.error(chalk.red('❌ Server is not running on port 3001'));
    console.log(chalk.yellow('Please start the server first with: npm start'));
    process.exit(1);
  });