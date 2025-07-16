#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Performance Comparison Report Generator
async function runComparison() {
    console.log('🔥 Performance Optimization Comparison Report');
    console.log('============================================\n');
    
    // Load both test results
    const currentResults = JSON.parse(fs.readFileSync('performance-results-current.json', 'utf8'));
    const optimizedResults = JSON.parse(fs.readFileSync('performance-results-optimized.json', 'utf8'));
    
    console.log('📊 Latency Comparison (milliseconds)');
    console.log('------------------------------------');
    console.log('Metric          | Current    | Optimized  | Improvement');
    console.log('----------------|------------|------------|------------');
    
    // Calculate averages
    const currentAvg = currentResults.metrics.requestLatencies.reduce((a, b) => a + b, 0) / currentResults.metrics.requestLatencies.length;
    const optimizedAvg = optimizedResults.metrics.requestLatencies.reduce((a, b) => a + b, 0) / optimizedResults.metrics.requestLatencies.length;
    
    // Calculate percentiles
    const getPercentile = (arr, p) => {
        const sorted = [...arr].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length * p)];
    };
    
    const currentP50 = getPercentile(currentResults.metrics.requestLatencies, 0.5);
    const currentP95 = getPercentile(currentResults.metrics.requestLatencies, 0.95);
    const currentP99 = getPercentile(currentResults.metrics.requestLatencies, 0.99);
    
    const optimizedP50 = getPercentile(optimizedResults.metrics.requestLatencies, 0.5);
    const optimizedP95 = getPercentile(optimizedResults.metrics.requestLatencies, 0.95);
    const optimizedP99 = getPercentile(optimizedResults.metrics.requestLatencies, 0.99);
    
    console.log(`Average         | ${currentAvg.toFixed(2).padEnd(10)} | ${optimizedAvg.toFixed(2).padEnd(10)} | ${((1 - optimizedAvg/currentAvg) * 100).toFixed(1)}%`);
    console.log(`P50 (Median)    | ${currentP50.toFixed(2).padEnd(10)} | ${optimizedP50.toFixed(2).padEnd(10)} | ${((1 - optimizedP50/currentP50) * 100).toFixed(1)}%`);
    console.log(`P95             | ${currentP95.toFixed(2).padEnd(10)} | ${optimizedP95.toFixed(2).padEnd(10)} | ${((1 - optimizedP95/currentP95) * 100).toFixed(1)}%`);
    console.log(`P99             | ${currentP99.toFixed(2).padEnd(10)} | ${optimizedP99.toFixed(2).padEnd(10)} | ${((1 - optimizedP99/currentP99) * 100).toFixed(1)}%`);
    
    console.log('\n📈 Endpoint Performance Comparison');
    console.log('----------------------------------');
    
    const endpoints = Object.keys(currentResults.metrics.endpointMetrics);
    endpoints.forEach(endpoint => {
        const current = currentResults.metrics.endpointMetrics[endpoint];
        const optimized = optimizedResults.metrics.endpointMetrics[endpoint];
        
        if (current.totalRequests > 0 && optimized.totalRequests > 0) {
            const currentAvg = current.totalTime / current.totalRequests;
            const optimizedAvg = optimized.totalTime / optimized.totalRequests;
            const improvement = ((1 - optimizedAvg/currentAvg) * 100).toFixed(1);
            
            console.log(`\n${endpoint}:`);
            console.log(`  Average: ${currentAvg.toFixed(2)}ms → ${optimizedAvg.toFixed(2)}ms (${improvement}% faster)`);
            console.log(`  Min: ${current.minTime.toFixed(2)}ms → ${optimized.minTime.toFixed(2)}ms`);
            console.log(`  Max: ${current.maxTime.toFixed(2)}ms → ${optimized.maxTime.toFixed(2)}ms`);
        }
    });
    
    console.log('\n💾 Memory Usage Comparison');
    console.log('--------------------------');
    
    const currentMemStart = currentResults.metrics.memoryUsage[0].heapUsed;
    const currentMemEnd = currentResults.metrics.memoryUsage[currentResults.metrics.memoryUsage.length - 1].heapUsed;
    const currentMemGrowth = currentMemEnd - currentMemStart;
    
    const optimizedMemStart = optimizedResults.metrics.memoryUsage[0].heapUsed;
    const optimizedMemEnd = optimizedResults.metrics.memoryUsage[optimizedResults.metrics.memoryUsage.length - 1].heapUsed;
    const optimizedMemGrowth = optimizedMemEnd - optimizedMemStart;
    
    console.log(`Starting Heap: ${(currentMemStart/1024/1024).toFixed(2)}MB → ${(optimizedMemStart/1024/1024).toFixed(2)}MB`);
    console.log(`Ending Heap: ${(currentMemEnd/1024/1024).toFixed(2)}MB → ${(optimizedMemEnd/1024/1024).toFixed(2)}MB`);
    console.log(`Memory Growth: ${(currentMemGrowth/1024/1024).toFixed(2)}MB → ${(optimizedMemGrowth/1024/1024).toFixed(2)}MB`);
    console.log(`Growth Reduction: ${((1 - optimizedMemGrowth/currentMemGrowth) * 100).toFixed(1)}%`);
    
    console.log('\n🚀 Key Performance Wins');
    console.log('----------------------');
    
    const improvements = [];
    
    // Check for caching effectiveness
    if (optimizedAvg < currentAvg * 0.5) {
        improvements.push('✅ Response times improved by over 50%');
    }
    
    if (optimizedP99 < currentP99 * 0.7) {
        improvements.push('✅ Tail latency (P99) significantly reduced');
    }
    
    if (optimizedMemGrowth < currentMemGrowth * 0.8) {
        improvements.push('✅ Memory growth reduced by over 20%');
    }
    
    // Check for consistent performance
    const currentVariance = Math.sqrt(currentResults.metrics.requestLatencies.reduce((sum, val) => {
        return sum + Math.pow(val - currentAvg, 2);
    }, 0) / currentResults.metrics.requestLatencies.length);
    
    const optimizedVariance = Math.sqrt(optimizedResults.metrics.requestLatencies.reduce((sum, val) => {
        return sum + Math.pow(val - optimizedAvg, 2);
    }, 0) / optimizedResults.metrics.requestLatencies.length);
    
    if (optimizedVariance < currentVariance * 0.7) {
        improvements.push('✅ Response time consistency improved');
    }
    
    improvements.forEach(imp => console.log(imp));
    
    console.log('\n📋 Optimization Summary');
    console.log('----------------------');
    console.log(`Total Requests: ${currentResults.metrics.successCount}`);
    console.log(`Average Improvement: ${((1 - optimizedAvg/currentAvg) * 100).toFixed(1)}%`);
    console.log(`P99 Improvement: ${((1 - optimizedP99/currentP99) * 100).toFixed(1)}%`);
    console.log(`Memory Efficiency: ${((1 - optimizedMemGrowth/currentMemGrowth) * 100).toFixed(1)}% better`);
    
    console.log('\n✨ Implemented Optimizations:');
    console.log('  • In-memory file caching with TTL');
    console.log('  • Pre-serialized JSON responses');
    console.log('  • Gzip compression support');
    console.log('  • ETag and conditional requests');
    console.log('  • Keep-alive connections');
    console.log('  • Cache-Control headers');
    console.log('  • Optimized content-type lookup');
    console.log('  • Smart cache eviction');
    console.log('  • Security improvements');
    console.log('  • Memory monitoring');
}

// Check if we have both result files
if (!fs.existsSync('performance-results-current.json') || !fs.existsSync('performance-results-optimized.json')) {
    console.log('⚠️  Missing performance test results!');
    console.log('Please run:');
    console.log('  1. Start ultra-simple-server.js and run performance-test.js');
    console.log('  2. Save results as performance-results-current.json');
    console.log('  3. Start ultra-simple-server-optimized.js and run performance-test.js');
    console.log('  4. Save results as performance-results-optimized.json');
    console.log('  5. Run this comparison script again');
    process.exit(1);
}

runComparison();