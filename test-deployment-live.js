#!/usr/bin/env node

/**
 * Live Deployment Test - Verify Finding Sports is working
 * Tests all critical functionality on the live site
 */

const https = require('https');

const LIVE_SITE = 'https://findingsports.com';
const tests = [];

async function testEndpoint(name, url, method = 'GET', expectedStatus = 200, body = null) {
    return new Promise((resolve) => {
        console.log(`\nTesting: ${name}`);
        console.log(`${method} ${url}`);
        
        const urlObj = new URL(url.startsWith('http') ? url : LIVE_SITE + url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'User-Agent': 'FindingSports-Deployment-Test/1.0',
                'Accept': 'application/json, text/html, */*'
            }
        };
        
        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
        }
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const success = res.statusCode === expectedStatus;
                console.log(`Status: ${res.statusCode} ${success ? '✅' : '❌'}`);
                
                if (res.headers['content-type']?.includes('text/html') && data.includes('<title>')) {
                    const titleMatch = data.match(/<title>(.*?)<\/title>/);
                    if (titleMatch) console.log(`Page Title: ${titleMatch[1]}`);
                }
                
                if (res.headers['content-type']?.includes('application/json')) {
                    try {
                        const json = JSON.parse(data);
                        console.log(`Response: ${JSON.stringify(json).substring(0, 100)}...`);
                    } catch (e) {}
                }
                
                tests.push({
                    name,
                    url: urlObj.pathname,
                    status: res.statusCode,
                    success,
                    expectedStatus
                });
                
                resolve(success);
            });
        });
        
        req.on('error', (err) => {
            console.log(`Status: ERROR - ${err.message} ❌`);
            tests.push({
                name,
                url: urlObj.pathname,
                error: err.message,
                success: false
            });
            resolve(false);
        });
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runAllTests() {
    console.log('🚀 Finding Sports - Live Deployment Test');
    console.log('Site: ' + LIVE_SITE);
    console.log('Time: ' + new Date().toISOString());
    console.log('=' .repeat(60));
    
    // 1. Frontend Pages
    console.log('\n📄 FRONTEND PAGES');
    await testEndpoint('Homepage', '/', 'GET', 200);
    await testEndpoint('Login Page', '/login.html', 'GET', 200);
    await testEndpoint('Submit Game Page', '/submit-game.html', 'GET', 200);
    await testEndpoint('Dashboard', '/dashboard.html', 'GET', 200);
    
    // 2. API Health
    console.log('\n🏥 API HEALTH');
    await testEndpoint('Health Check', '/health', 'GET', 200);
    await testEndpoint('API Health', '/api/health', 'GET', 404); // Expected 404
    
    // 3. Core APIs
    console.log('\n🎮 CORE APIS');
    await testEndpoint('Games List', '/api/games', 'GET', 200);
    await testEndpoint('Play Now API', '/api/play-now', 'GET', 200);
    await testEndpoint('Play Now with Location', '/api/play-now?lat=49.2827&lng=-123.1207&radius=10', 'GET', 200);
    
    // 4. Venue & Sports APIs
    console.log('\n🏟️ VENUE & SPORTS APIS');
    await testEndpoint('Venues List', '/api/venues', 'GET', 200);
    await testEndpoint('Sports List', '/api/sports', 'GET', 200);
    await testEndpoint('Specific Venue', '/api/venues/1', 'GET', 200);
    await testEndpoint('Specific Sport', '/api/sports/basketball', 'GET', 200);
    
    // 5. Location APIs
    console.log('\n📍 LOCATION APIS');
    await testEndpoint('BC Locations', '/api/locations/bc', 'GET', 200);
    await testEndpoint('Location Suggestions', '/api/locations/suggestions?q=vancouver', 'GET', 200);
    
    // 6. User & Game Management
    console.log('\n👤 USER & GAME MANAGEMENT');
    await testEndpoint('User Games', '/api/user-games', 'GET', 200);
    await testEndpoint('Venue Requests', '/api/venue-requests', 'GET', 200);
    
    // 7. Real-time Features
    console.log('\n⚡ REAL-TIME FEATURES');
    await testEndpoint('WebSocket Stats', '/api/ws/stats', 'GET', 200);
    await testEndpoint('Data Stats', '/api/data/stats', 'GET', 200);
    
    // 8. Static Assets
    console.log('\n📦 STATIC ASSETS');
    await testEndpoint('App JavaScript', '/js/app.js', 'GET', 200);
    await testEndpoint('Play Now JavaScript', '/js/play-now.js', 'GET', 200);
    await testEndpoint('Main CSS', '/css/styles.css', 'GET', 200);
    
    // 9. Authentication
    console.log('\n🔐 AUTHENTICATION');
    await testEndpoint('Google OAuth', '/auth/google', 'GET', 301);
    await testEndpoint('Login Endpoint', '/api/auth/login', 'POST', 401, {
        email: 'test@example.com',
        password: 'test'
    });
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    
    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;
    const total = tests.length;
    const successRate = Math.round((passed / total) * 100);
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${successRate}%`);
    
    if (failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        tests.filter(t => !t.success).forEach(t => {
            console.log(`  - ${t.name}: Expected ${t.expectedStatus || 'success'}, got ${t.status || t.error}`);
        });
    }
    
    // Critical checks
    const criticalTests = [
        tests.find(t => t.name === 'Homepage'),
        tests.find(t => t.name === 'Health Check'),
        tests.find(t => t.name === 'Play Now API'),
        tests.find(t => t.name === 'Venues List'),
        tests.find(t => t.name === 'Sports List')
    ];
    
    const allCriticalPassed = criticalTests.every(t => t && t.success);
    
    console.log('\n🎯 DEPLOYMENT STATUS:');
    if (allCriticalPassed) {
        console.log('✅ DEPLOYMENT SUCCESSFUL - All critical features working!');
        console.log('🌐 Site is live at: ' + LIVE_SITE);
        console.log('🏀 Users can find local drop-in sports games');
        console.log('🏟️ Venues and sports APIs are operational');
    } else {
        console.log('❌ DEPLOYMENT INCOMPLETE - Some critical features not working');
        console.log('Please check Railway logs and redeploy if needed');
    }
    
    return allCriticalPassed;
}

// Run tests
console.log('⏳ Waiting 30 seconds for deployment to complete...\n');
setTimeout(() => {
    runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}, 30000);