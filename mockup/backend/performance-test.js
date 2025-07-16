#!/usr/bin/env node

const http = require('http');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Test configuration
const SERVER_URL = 'http://localhost:8080';
const CONCURRENT_REQUESTS = 100;
const TOTAL_REQUESTS = 1000;
const ENDPOINTS = [
    '/api/health',
    '/api/play-now',
    '/',
    '/css/main.css',
    '/js/script.js',
    '/images/test.png'
];

// Performance metrics storage
const metrics = {
    startupTime: 0,
    requestLatencies: [],
    errorCount: 0,
    successCount: 0,
    endpointMetrics: {},
    memoryUsage: [],
    cpuUsage: []
};

// Initialize endpoint metrics
ENDPOINTS.forEach(endpoint => {
    metrics.endpointMetrics[endpoint] = {
        totalRequests: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errors: 0,
        statusCodes: {}
    };
});

// Make a single request and measure time
async function makeRequest(endpoint) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        
        const req = http.get(SERVER_URL + endpoint, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                // Update metrics
                const endpointMetric = metrics.endpointMetrics[endpoint];
                endpointMetric.totalRequests++;
                endpointMetric.totalTime += duration;
                endpointMetric.minTime = Math.min(endpointMetric.minTime, duration);
                endpointMetric.maxTime = Math.max(endpointMetric.maxTime, duration);
                endpointMetric.statusCodes[res.statusCode] = (endpointMetric.statusCodes[res.statusCode] || 0) + 1;
                
                metrics.requestLatencies.push(duration);
                metrics.successCount++;
                
                resolve({ duration, statusCode: res.statusCode, endpoint });
            });
        });
        
        req.on('error', (error) => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            metrics.endpointMetrics[endpoint].errors++;
            metrics.errorCount++;
            
            resolve({ duration, error: error.message, endpoint });
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            metrics.endpointMetrics[endpoint].errors++;
            metrics.errorCount++;
            resolve({ duration: 5000, error: 'Timeout', endpoint });
        });
    });
}

// Test concurrent request handling
async function testConcurrentRequests(concurrency, endpoint) {
    const startTime = performance.now();
    const promises = [];
    
    for (let i = 0; i < concurrency; i++) {
        promises.push(makeRequest(endpoint));
    }
    
    const results = await Promise.all(promises);
    const endTime = performance.now();
    
    return {
        totalTime: endTime - startTime,
        averageTime: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
        results
    };
}

// Test server startup time
async function testStartupTime() {
    console.log('\n📊 Testing server startup time...');
    
    const startTime = performance.now();
    
    // Try to connect repeatedly until successful
    let connected = false;
    let attempts = 0;
    
    while (!connected && attempts < 50) {
        try {
            await makeRequest('/api/health');
            connected = true;
        } catch (e) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    const endTime = performance.now();
    metrics.startupTime = endTime - startTime;
    
    console.log(`✅ Server startup time: ${metrics.startupTime.toFixed(2)}ms`);
}

// Test file reading performance
async function testFileReading() {
    console.log('\n📁 Testing file reading performance...');
    
    const fileEndpoints = ['/', '/css/main.css', '/js/script.js'];
    
    for (const endpoint of fileEndpoints) {
        const results = [];
        
        // Test multiple reads
        for (let i = 0; i < 10; i++) {
            const result = await makeRequest(endpoint);
            results.push(result.duration);
        }
        
        const avg = results.reduce((sum, r) => sum + r, 0) / results.length;
        console.log(`  ${endpoint}: avg ${avg.toFixed(2)}ms`);
    }
}

// Test endpoint performance
async function testEndpointPerformance() {
    console.log('\n🚀 Testing endpoint performance...');
    
    for (const endpoint of ENDPOINTS) {
        console.log(`\n  Testing ${endpoint}...`);
        
        // Warm up
        await makeRequest(endpoint);
        
        // Test single request
        const singleResult = await makeRequest(endpoint);
        console.log(`    Single request: ${singleResult.duration.toFixed(2)}ms`);
        
        // Test concurrent requests
        const concurrentResult = await testConcurrentRequests(10, endpoint);
        console.log(`    10 concurrent: avg ${concurrentResult.averageTime.toFixed(2)}ms, total ${concurrentResult.totalTime.toFixed(2)}ms`);
    }
}

// Test sustained load
async function testSustainedLoad() {
    console.log('\n⚡ Testing sustained load...');
    
    const batchSize = 50;
    const batches = TOTAL_REQUESTS / batchSize;
    
    for (let batch = 0; batch < batches; batch++) {
        const startTime = performance.now();
        const promises = [];
        
        for (let i = 0; i < batchSize; i++) {
            const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
            promises.push(makeRequest(endpoint));
        }
        
        await Promise.all(promises);
        const batchTime = performance.now() - startTime;
        
        console.log(`  Batch ${batch + 1}/${batches}: ${batchTime.toFixed(2)}ms (${(batchSize / (batchTime / 1000)).toFixed(2)} req/s)`);
        
        // Collect memory usage
        const memUsage = process.memoryUsage();
        metrics.memoryUsage.push({
            time: performance.now(),
            heapUsed: memUsage.heapUsed,
            external: memUsage.external
        });
    }
}

// Analyze blocking operations
async function testBlockingOperations() {
    console.log('\n🔍 Testing for blocking operations...');
    
    const results = [];
    
    // Test if file operations block
    console.log('  Testing file read blocking...');
    const filePromises = [];
    const startTime = performance.now();
    
    for (let i = 0; i < 20; i++) {
        filePromises.push(makeRequest('/'));
    }
    
    await Promise.all(filePromises);
    const totalTime = performance.now() - startTime;
    
    console.log(`    20 concurrent file reads: ${totalTime.toFixed(2)}ms`);
    
    // Test JSON operations
    console.log('  Testing JSON serialization blocking...');
    const jsonPromises = [];
    const jsonStart = performance.now();
    
    for (let i = 0; i < 20; i++) {
        jsonPromises.push(makeRequest('/api/play-now'));
    }
    
    await Promise.all(jsonPromises);
    const jsonTime = performance.now() - jsonStart;
    
    console.log(`    20 concurrent JSON responses: ${jsonTime.toFixed(2)}ms`);
}

// Generate performance report
function generateReport() {
    console.log('\n📈 Performance Analysis Report\n');
    console.log('=' .repeat(60));
    
    // Overall statistics
    console.log('\n🎯 Overall Statistics:');
    console.log(`  Total requests: ${metrics.successCount + metrics.errorCount}`);
    console.log(`  Successful: ${metrics.successCount} (${((metrics.successCount / (metrics.successCount + metrics.errorCount)) * 100).toFixed(2)}%)`);
    console.log(`  Errors: ${metrics.errorCount}`);
    
    // Latency analysis
    if (metrics.requestLatencies.length > 0) {
        metrics.requestLatencies.sort((a, b) => a - b);
        const p50 = metrics.requestLatencies[Math.floor(metrics.requestLatencies.length * 0.5)];
        const p95 = metrics.requestLatencies[Math.floor(metrics.requestLatencies.length * 0.95)];
        const p99 = metrics.requestLatencies[Math.floor(metrics.requestLatencies.length * 0.99)];
        const avg = metrics.requestLatencies.reduce((sum, l) => sum + l, 0) / metrics.requestLatencies.length;
        
        console.log('\n📊 Latency Percentiles:');
        console.log(`  Average: ${avg.toFixed(2)}ms`);
        console.log(`  P50: ${p50.toFixed(2)}ms`);
        console.log(`  P95: ${p95.toFixed(2)}ms`);
        console.log(`  P99: ${p99.toFixed(2)}ms`);
    }
    
    // Endpoint performance
    console.log('\n🔗 Endpoint Performance:');
    for (const [endpoint, metric] of Object.entries(metrics.endpointMetrics)) {
        if (metric.totalRequests > 0) {
            const avg = metric.totalTime / metric.totalRequests;
            console.log(`\n  ${endpoint}:`);
            console.log(`    Requests: ${metric.totalRequests}`);
            console.log(`    Average: ${avg.toFixed(2)}ms`);
            console.log(`    Min: ${metric.minTime.toFixed(2)}ms`);
            console.log(`    Max: ${metric.maxTime.toFixed(2)}ms`);
            console.log(`    Errors: ${metric.errors}`);
        }
    }
    
    // Memory usage
    if (metrics.memoryUsage.length > 0) {
        const maxHeap = Math.max(...metrics.memoryUsage.map(m => m.heapUsed));
        const minHeap = Math.min(...metrics.memoryUsage.map(m => m.heapUsed));
        
        console.log('\n💾 Memory Usage:');
        console.log(`  Min heap: ${(minHeap / 1024 / 1024).toFixed(2)}MB`);
        console.log(`  Max heap: ${(maxHeap / 1024 / 1024).toFixed(2)}MB`);
        console.log(`  Growth: ${((maxHeap - minHeap) / 1024 / 1024).toFixed(2)}MB`);
    }
    
    console.log('\n' + '='.repeat(60));
}

// Generate optimization recommendations
function generateRecommendations() {
    console.log('\n🚀 Performance Optimization Recommendations:\n');
    
    const recommendations = [];
    
    // Check for slow file operations
    const fileEndpoints = ['/', '/css/main.css', '/js/script.js'];
    fileEndpoints.forEach(endpoint => {
        const metric = metrics.endpointMetrics[endpoint];
        if (metric.totalRequests > 0) {
            const avg = metric.totalTime / metric.totalRequests;
            if (avg > 10) {
                recommendations.push({
                    priority: 'HIGH',
                    category: 'File I/O',
                    issue: `Slow file reading for ${endpoint} (avg ${avg.toFixed(2)}ms)`,
                    solution: 'Implement file caching to avoid repeated disk reads'
                });
            }
        }
    });
    
    // Check for JSON serialization performance
    const apiMetric = metrics.endpointMetrics['/api/play-now'];
    if (apiMetric.totalRequests > 0) {
        const avg = apiMetric.totalTime / apiMetric.totalRequests;
        if (avg > 5) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'JSON',
                issue: `JSON serialization taking ${avg.toFixed(2)}ms on average`,
                solution: 'Pre-serialize static JSON responses and cache them'
            });
        }
    }
    
    // Check for memory growth
    if (metrics.memoryUsage.length > 1) {
        const firstHeap = metrics.memoryUsage[0].heapUsed;
        const lastHeap = metrics.memoryUsage[metrics.memoryUsage.length - 1].heapUsed;
        const growth = lastHeap - firstHeap;
        
        if (growth > 10 * 1024 * 1024) { // 10MB growth
            recommendations.push({
                priority: 'HIGH',
                category: 'Memory',
                issue: `Memory grew by ${(growth / 1024 / 1024).toFixed(2)}MB during testing`,
                solution: 'Investigate potential memory leaks in request handling'
            });
        }
    }
    
    // Check for high latency variance
    if (metrics.requestLatencies.length > 0) {
        const sorted = [...metrics.requestLatencies].sort((a, b) => a - b);
        const p50 = sorted[Math.floor(sorted.length * 0.5)];
        const p99 = sorted[Math.floor(sorted.length * 0.99)];
        
        if (p99 > p50 * 10) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Latency',
                issue: `High latency variance: P99 (${p99.toFixed(2)}ms) is ${(p99/p50).toFixed(1)}x P50`,
                solution: 'Add request queuing and connection pooling'
            });
        }
    }
    
    // General recommendations
    recommendations.push({
        priority: 'HIGH',
        category: 'Architecture',
        issue: 'No caching layer for static assets',
        solution: 'Implement in-memory cache for frequently accessed files'
    });
    
    recommendations.push({
        priority: 'MEDIUM',
        category: 'Headers',
        issue: 'Missing cache control headers',
        solution: 'Add Cache-Control headers for static assets'
    });
    
    recommendations.push({
        priority: 'MEDIUM',
        category: 'Compression',
        issue: 'No response compression',
        solution: 'Add gzip compression for text responses'
    });
    
    recommendations.push({
        priority: 'LOW',
        category: 'Monitoring',
        issue: 'No performance monitoring',
        solution: 'Add basic metrics collection (response times, error rates)'
    });
    
    // Sort by priority
    const priorityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    // Display recommendations
    recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.category}`);
        console.log(`   Issue: ${rec.issue}`);
        console.log(`   Solution: ${rec.solution}\n`);
    });
}

// Main test runner
async function runPerformanceTests() {
    console.log('🔥 Ultra-Simple Server Performance Test Suite');
    console.log('=' .repeat(60));
    
    try {
        // Test if server is running
        console.log('\n🔌 Checking server connection...');
        try {
            await makeRequest('/api/health');
            console.log('✅ Server is running');
        } catch (e) {
            console.error('❌ Server is not running. Please start the server first.');
            process.exit(1);
        }
        
        // Run all tests
        await testStartupTime();
        await testFileReading();
        await testEndpointPerformance();
        await testBlockingOperations();
        await testSustainedLoad();
        
        // Generate reports
        generateReport();
        generateRecommendations();
        
        // Save results to file
        const results = {
            timestamp: new Date().toISOString(),
            metrics,
            recommendations: 'See console output'
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'performance-results.json'),
            JSON.stringify(results, null, 2)
        );
        
        console.log('\n✅ Performance test complete. Results saved to performance-results.json');
        
    } catch (error) {
        console.error('\n❌ Error during performance testing:', error.message);
        process.exit(1);
    }
}

// Run the tests
runPerformanceTests();