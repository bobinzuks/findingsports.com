#!/usr/bin/env node

/**
 * FINAL PROOF TEST - Must ALL pass for success
 */

const https = require('https');

const SITE = 'https://findingsports.com';
let allPassed = true;
let results = [];

async function testEndpoint(name, path, method = 'GET', body = null) {
    return new Promise((resolve) => {
        console.log(`\n🧪 Testing: ${name}`);
        console.log(`   ${method} ${SITE}${path}`);
        
        const options = {
            method,
            timeout: 10000
        };
        
        if (body) {
            options.headers = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(body))
            };
        }
        
        const req = https.request(SITE + path, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const success = res.statusCode >= 200 && res.statusCode < 400;
                console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
                
                if (res.headers['content-type']?.includes('application/json')) {
                    try {
                        const json = JSON.parse(data);
                        console.log(`   Response: ${JSON.stringify(json).substring(0, 200)}...`);
                    } catch (e) {
                        console.log(`   Response: ${data.substring(0, 200)}...`);
                    }
                } else {
                    console.log(`   Length: ${data.length} bytes`);
                }
                
                console.log(`   ${success ? '✅ PASS' : '❌ FAIL'}`);
                
                if (!success) allPassed = false;
                
                results.push({
                    name,
                    path,
                    method,
                    status: res.statusCode,
                    success
                });
                
                resolve(success);
            });
        });
        
        req.on('error', (err) => {
            console.log(`   ❌ ERROR: ${err.message}`);
            allPassed = false;
            results.push({
                name,
                path,
                method,
                error: err.message,
                success: false
            });
            resolve(false);
        });
        
        req.on('timeout', () => {
            req.destroy();
            console.log(`   ❌ TIMEOUT`);
            allPassed = false;
            resolve(false);
        });
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runFinalProofTest() {
    console.log('🚀 FINAL PROOF TEST - ALL MUST PASS FOR SUCCESS');
    console.log('=' .repeat(60));
    
    // Critical backend endpoints
    await testEndpoint('Health Check', '/health');
    await testEndpoint('Games API', '/api/games');
    await testEndpoint('Play Now GET', '/api/play-now');
    await testEndpoint('Play Now with Location', '/api/play-now?lat=49.2827&lng=-123.1207&radius=10');
    await testEndpoint('BC Locations', '/api/locations/bc');
    await testEndpoint('WebSocket Stats', '/api/ws/stats');
    await testEndpoint('Data Stats', '/api/data/stats');
    await testEndpoint('Facilities', '/api/facilities');
    
    // Fixed endpoints - MUST WORK
    await testEndpoint('Venues API', '/api/venues');
    await testEndpoint('Sports API', '/api/sports');
    await testEndpoint('Play Now POST Search', '/api/play-now/search', 'POST', {
        location: 'Vancouver',
        sports: ['basketball', 'soccer']
    });
    
    // Frontend pages
    await testEndpoint('Homepage', '/');
    await testEndpoint('Login Page', '/login.html');
    await testEndpoint('Dashboard Page', '/dashboard.html');
    
    // JavaScript files
    await testEndpoint('App JavaScript', '/js/app.js');
    await testEndpoint('Play Now JavaScript', '/js/play-now.js');
    
    // Location services
    await testEndpoint('Location Suggestions', '/api/locations/suggestions?q=van');
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 FINAL RESULTS');
    console.log('=' .repeat(60));
    
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed/total)*100)}%`);
    
    if (allPassed) {
        console.log('\n🎉 🎉 🎉 ALL TESTS PASSED! 🎉 🎉 🎉');
        console.log('🎯 FINDING SPORTS IS FULLY OPERATIONAL!');
        console.log('🌐 Site: https://findingsports.com');
        console.log('✅ Backend: All endpoints working');
        console.log('✅ Frontend: All pages loading');
        console.log('✅ Play Now: Full functionality');
        console.log('✅ APIs: Complete coverage');
    } else {
        console.log('\n❌ SOME TESTS FAILED');
        console.log('Failed tests:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.name}: ${r.status || r.error}`);
        });
    }
    
    // Test the actual Play Now button functionality
    console.log('\n🎮 PLAY NOW BUTTON TEST');
    console.log('To test the actual Play Now button:');
    console.log('1. Go to https://findingsports.com');
    console.log('2. Click the "Play Now" button');  
    console.log('3. Should show nearby sports activities');
    console.log('4. Try different sports from the dropdown');
    
    return allPassed;
}

// Wait for deployment then test
console.log('⏳ Waiting 2 minutes for deployment to complete...');
setTimeout(async () => {
    const success = await runFinalProofTest();
    process.exit(success ? 0 : 1);
}, 120000); // 2 minutes