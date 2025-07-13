#!/usr/bin/env node

/**
 * Test the actual live site at findingsports.com
 */

const https = require('https');

const LIVE_SITE = 'https://findingsports.com';

async function testEndpoint(path, method = 'GET') {
    return new Promise((resolve) => {
        const url = LIVE_SITE + path;
        console.log(`\nTesting ${method} ${url}`);
        
        const options = {
            method: method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; FindingSportsTest/1.0)',
                'Accept': 'application/json, text/html'
            },
            timeout: 10000
        };
        
        const req = https.request(url, options, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Content-Type: ${res.headers['content-type']}`);
                console.log(`Server: ${res.headers['server']}`);
                
                if (res.statusCode === 200) {
                    console.log('✅ Success!');
                    if (data.length < 500 && res.headers['content-type']?.includes('json')) {
                        console.log('Response:', data);
                    } else {
                        console.log(`Response length: ${data.length} bytes`);
                    }
                } else {
                    console.log('❌ Failed');
                    if (data.length < 500) {
                        console.log('Response:', data);
                    }
                }
                
                resolve({
                    path,
                    status: res.statusCode,
                    success: res.statusCode === 200,
                    contentType: res.headers['content-type'],
                    data: data
                });
            });
        });
        
        req.on('error', (err) => {
            console.log(`❌ Error: ${err.message}`);
            resolve({
                path,
                success: false,
                error: err.message
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            console.log('❌ Timeout');
            resolve({
                path,
                success: false,
                error: 'Timeout'
            });
        });
        
        req.end();
    });
}

async function runTests() {
    console.log('🔍 Testing Live Site: ' + LIVE_SITE);
    console.log('=' .repeat(50));
    
    const endpoints = [
        '/',
        '/health',
        '/api/games',
        '/api/play-now',
        '/api/play-now?lat=49.2827&lng=-123.1207&radius=10',
        '/api/venues',
        '/api/sports',
        '/api/locations/bc',
        '/api/ws/stats',
        '/api/data/stats',
        '/api/facilities',
        '/mockup/',
        '/mockup/index.html'
    ];
    
    const results = [];
    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`Total tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    // Analysis
    console.log('\n📋 ANALYSIS:');
    
    const htmlPages = results.filter(r => r.contentType?.includes('text/html'));
    const apiEndpoints = results.filter(r => r.path.startsWith('/api'));
    const apiWorking = apiEndpoints.filter(r => r.success);
    
    if (htmlPages.some(r => r.success)) {
        console.log('✅ Frontend is being served');
    } else {
        console.log('❌ Frontend is not accessible');
    }
    
    if (apiWorking.length > 0) {
        console.log(`✅ ${apiWorking.length}/${apiEndpoints.length} API endpoints are working`);
    } else {
        console.log('❌ No API endpoints are working');
    }
    
    // Specific checks
    const healthCheck = results.find(r => r.path === '/health');
    const playNowCheck = results.find(r => r.path === '/api/play-now');
    
    console.log('\n🔍 SPECIFIC CHECKS:');
    console.log(`Health endpoint: ${healthCheck?.success ? '✅ Working' : '❌ Not working'}`);
    console.log(`Play Now API: ${playNowCheck?.success ? '✅ Working' : '❌ Not working'}`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (!healthCheck?.success) {
        console.log('1. The /health endpoint is not working - server may not be running');
        console.log('   - Check if JWT_SECRET is set in Railway environment');
        console.log('   - Verify server.js is being executed');
    }
    
    if (!apiWorking.length) {
        console.log('2. No API endpoints are working');
        console.log('   - Check if backend server is running');
        console.log('   - Verify API routes are properly configured');
        console.log('   - Check Railway logs for errors');
    }
    
    if (htmlPages.some(r => r.success) && !apiWorking.length) {
        console.log('3. Frontend works but API doesn\'t');
        console.log('   - This suggests static files are served but Node.js backend isn\'t running');
        console.log('   - Check Procfile and server startup');
    }
}

// Run the tests
runTests().catch(console.error);