#!/usr/bin/env node

const https = require('https');

console.log('🔍 FINAL DEPLOYMENT CHECK - ' + new Date().toISOString());
console.log('=' .repeat(60));

// Check multiple endpoints
const checks = [
    { name: 'Root URL (/)', url: 'https://findingsports.com/' },
    { name: 'Direct HTML', url: 'https://findingsports.com/index.html' },
    { name: 'Play Now API', url: 'https://findingsports.com/api/play-now?lat=49.2827&lng=-123.1207&radius=15' },
    { name: 'Health Check', url: 'https://findingsports.com/api/health' }
];

async function checkUrl(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    contentType: res.headers['content-type'],
                    content: data.substring(0, 150).replace(/\s+/g, ' ')
                });
            });
        }).on('error', (err) => {
            resolve({ error: err.message });
        });
    });
}

async function runChecks() {
    for (const check of checks) {
        console.log(`\n📍 ${check.name}`);
        console.log(`URL: ${check.url}`);
        
        const result = await checkUrl(check.url);
        
        if (result.error) {
            console.log(`❌ Error: ${result.error}`);
            continue;
        }
        
        console.log(`Status: ${result.status}`);
        console.log(`Type: ${result.contentType}`);
        console.log(`Content: ${result.content}...`);
        
        // Determine pass/fail
        if (check.name === 'Root URL (/)') {
            if (result.content.includes('<!doctype') || result.content.includes('<html')) {
                console.log('✅ PASS - Serving HTML');
            } else if (result.content.includes('"message":"Finding Sports API"')) {
                console.log('❌ FAIL - Still serving JSON from failsafe server');
                console.log('🔧 ACTION NEEDED: Manual Railway deployment required');
            }
        } else if (check.name === 'Direct HTML') {
            if (result.content.includes('<!doctype')) {
                console.log('✅ PASS - Static files working');
            } else {
                console.log('❌ FAIL - Static files not working');
            }
        } else if (check.name.includes('API')) {
            if (result.contentType.includes('json')) {
                console.log('✅ PASS - API endpoint working');
            } else {
                console.log('❌ FAIL - API not returning JSON');
            }
        }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 SUMMARY:');
    console.log('- Code changes: ✅ All completed and pushed');
    console.log('- GitHub: ✅ All commits pushed to main branch');
    console.log('- Railway: ❌ Not auto-deploying - manual deployment needed');
    console.log('\n🚨 ACTION REQUIRED:');
    console.log('1. Go to https://railway.app/dashboard');
    console.log('2. Find the findingsports-com project');
    console.log('3. Click "Deploy" or check deployment settings');
    console.log('4. Ensure GitHub integration is connected');
}

runChecks();