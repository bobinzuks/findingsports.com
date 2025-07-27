#!/usr/bin/env node

const https = require('https');

console.log('🔍 COMPREHENSIVE DEPLOYMENT TEST\n');

const tests = [
    { url: 'https://findingsports.com/', expected: 'HTML' },
    { url: 'https://findingsports.com/index.html', expected: 'HTML' },
    { url: 'https://findingsports.com/api/health', expected: 'JSON' },
    { url: 'https://findingsports.com/css/styles.css', expected: 'CSS' },
    { url: 'https://findingsports.com/js/app.js', expected: 'JS' }
];

async function testUrl(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    contentType: res.headers['content-type'],
                    firstChars: data.substring(0, 100).replace(/\n/g, ' '),
                    isHTML: data.includes('<!doctype') || data.includes('<html'),
                    isJSON: data.trim().startsWith('{') || data.trim().startsWith('['),
                    isCSS: data.includes('{') && data.includes('}') && (data.includes('color') || data.includes('margin')),
                    isJS: data.includes('function') || data.includes('var ') || data.includes('const ')
                });
            });
        }).on('error', (err) => {
            resolve({ error: err.message });
        });
    });
}

async function runTests() {
    for (const test of tests) {
        console.log(`\nTesting: ${test.url}`);
        console.log(`Expected: ${test.expected}`);
        
        const result = await testUrl(test.url);
        
        if (result.error) {
            console.log(`❌ Error: ${result.error}`);
            continue;
        }
        
        console.log(`Status: ${result.statusCode}`);
        console.log(`Content-Type: ${result.contentType}`);
        console.log(`Content: ${result.firstChars}...`);
        
        let passed = false;
        switch (test.expected) {
            case 'HTML':
                passed = result.isHTML;
                break;
            case 'JSON':
                passed = result.isJSON;
                break;
            case 'CSS':
                passed = result.isCSS;
                break;
            case 'JS':
                passed = result.isJS;
                break;
        }
        
        console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    }
    
    // Test API endpoints
    console.log('\n\n📡 API ENDPOINTS TEST:');
    const apiTests = [
        '/api/play-now?lat=49.2827&lng=-123.1207',
        '/api/venues',
        '/api/sports'
    ];
    
    for (const endpoint of apiTests) {
        const url = `https://findingsports.com${endpoint}`;
        console.log(`\nTesting: ${url}`);
        const result = await testUrl(url);
        console.log(`Status: ${result.statusCode}`);
        console.log(`Response: ${result.firstChars}...`);
    }
}

runTests();