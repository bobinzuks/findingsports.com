const https = require('https');

console.log('🔍 Deployment Verification Tool\n');

const url = process.argv[2];
if (!url) {
    console.error('Usage: node verify-deployment.js <railway-app-url>');
    process.exit(1);
}

const endpoints = [
    '/health',
    '/api/games',
    '/api/play-now',
    '/api/venues',
    '/'
];

async function testEndpoint(endpoint) {
    return new Promise((resolve) => {
        const fullUrl = url + endpoint;
        console.log(`Testing ${fullUrl}...`);
        
        https.get(fullUrl, (res) => {
            if (res.statusCode === 200) {
                console.log(`✅ ${endpoint} - OK (${res.statusCode})`);
                resolve(true);
            } else {
                console.log(`❌ ${endpoint} - Failed (${res.statusCode})`);
                resolve(false);
            }
        }).on('error', (err) => {
            console.log(`❌ ${endpoint} - Error: ${err.message}`);
            resolve(false);
        });
    });
}

async function runTests() {
    let passed = 0;
    for (const endpoint of endpoints) {
        if (await testEndpoint(endpoint)) {
            passed++;
        }
    }
    
    console.log(`\n📊 Results: ${passed}/${endpoints.length} tests passed`);
    
    if (passed === 0) {
        console.log('\n🚨 CRITICAL: Server is not responding!');
        console.log('1. Check Railway logs for errors');
        console.log('2. Ensure JWT_SECRET is set in Railway environment');
        console.log('3. Verify nodejs_20 (not nodejs-20_x) in nixpacks.toml');
    } else if (passed < endpoints.length) {
        console.log('\n⚠️  Some endpoints are failing');
        console.log('Check server logs for specific errors');
    } else {
        console.log('\n✅ All tests passed! Deployment is working correctly.');
    }
}

runTests();
