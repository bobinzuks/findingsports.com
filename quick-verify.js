#!/usr/bin/env node

/**
 * Quick verification of key endpoints
 */

const https = require('https');

const SITE = 'https://findingsports.com';

async function quickTest(name, path) {
    return new Promise((resolve) => {
        console.log(`Testing: ${name} (${path})`);
        
        https.get(SITE + path, (res) => {
            const success = res.statusCode >= 200 && res.statusCode < 400;
            console.log(`  ${success ? '✅' : '❌'} ${res.statusCode} ${res.statusMessage}`);
            resolve(success);
        }).on('error', (err) => {
            console.log(`  ❌ Error: ${err.message}`);
            resolve(false);
        });
    });
}

async function testPlayNowPOST() {
    return new Promise((resolve) => {
        console.log('Testing: Play Now POST Search (/api/play-now/search)');
        
        const data = JSON.stringify({
            location: 'Vancouver',
            sports: ['basketball', 'soccer']
        });
        
        const options = {
            hostname: 'findingsports.com',
            path: '/api/play-now/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };
        
        const req = https.request(options, (res) => {
            const success = res.statusCode >= 200 && res.statusCode < 400;
            console.log(`  ${success ? '✅' : '❌'} ${res.statusCode} ${res.statusMessage}`);
            resolve(success);
        });
        
        req.on('error', (err) => {
            console.log(`  ❌ Error: ${err.message}`);
            resolve(false);
        });
        
        req.write(data);
        req.end();
    });
}

async function runQuickTests() {
    console.log('🔍 Quick Verification of Key Endpoints\n');
    
    const tests = [
        // Core working endpoints
        ['Health Check', '/health'],
        ['Play Now GET', '/api/play-now'],
        ['Games API', '/api/games'],
        
        // Recently fixed endpoints
        ['Venues API', '/api/venues'],
        ['Sports API', '/api/sports'],
        ['Dashboard Page', '/dashboard.html']
    ];
    
    let passed = 0;
    for (const [name, path] of tests) {
        const success = await quickTest(name, path);
        if (success) passed++;
        await new Promise(r => setTimeout(r, 500));
    }
    
    // Test POST endpoint
    const postSuccess = await testPlayNowPOST();
    if (postSuccess) passed++;
    
    console.log(`\n📊 Results: ${passed}/${tests.length + 1} tests passed`);
    
    if (passed === tests.length + 1) {
        console.log('🎉 ALL KEY FEATURES ARE WORKING!');
    } else {
        console.log('⚠️  Some features still need fixing');
    }
}

runQuickTests();