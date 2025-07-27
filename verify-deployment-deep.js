#!/usr/bin/env node

const https = require('https');

console.log('🔍 DEEP DEPLOYMENT VERIFICATION\n');

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function verifyDeployment() {
    try {
        console.log('📥 Fetching https://findingsports.com ...\n');
        const html = await fetchPage('https://findingsports.com');
        
        // Check for specific elements
        const checks = [
            { name: 'MapLibre GL CSS', pattern: /maplibre-gl.*\.css/i, expected: true },
            { name: 'MapLibre GL JS', pattern: /maplibre-gl.*\.js/i, expected: true },
            { name: 'Language Service JS', pattern: /language-service\.js/i, expected: true },
            { name: 'Language Selector', pattern: /fa-globe|language-selector|🌐/i, expected: false },
            { name: 'Online Status', pattern: /online-indicator|status-online|connectionStatus/i, expected: false },
            { name: 'Help Button', pattern: /help-btn|fa-question|help.*button/i, expected: false },
            { name: 'Map Container', pattern: /id="map"|class="map-container"/i, expected: true },
            { name: 'Play Now Button', pattern: /play-now-btn|onclick="playNow/i, expected: true },
            { name: 'Deployment Version', pattern: /deployment-version|DEPLOYMENT_VERSION/i, expected: true }
        ];
        
        console.log('📊 VERIFICATION RESULTS:\n');
        
        let allPassed = true;
        
        for (const check of checks) {
            const found = check.pattern.test(html);
            const passed = found === check.expected;
            allPassed = allPassed && passed;
            
            const status = passed ? '✅' : '❌';
            const foundText = found ? 'FOUND' : 'NOT FOUND';
            const expectedText = check.expected ? 'Should exist' : 'Should NOT exist';
            
            console.log(`${status} ${check.name}: ${foundText} (${expectedText})`);
            
            if (!passed && found) {
                // Show where it was found
                const match = html.match(check.pattern);
                if (match) {
                    const context = html.substring(html.indexOf(match[0]) - 50, html.indexOf(match[0]) + 50);
                    console.log(`   Found at: ...${context.replace(/\n/g, ' ')}...`);
                }
            }
        }
        
        // Check what version is deployed
        const versionMatch = html.match(/deployment-version[^>]*content="([^"]+)"/i);
        if (versionMatch) {
            console.log(`\n📌 Deployed Version: ${versionMatch[1]}`);
        }
        
        // Check server headers
        console.log('\n📡 Checking server response headers...');
        https.get('https://findingsports.com', (res) => {
            console.log(`Status: ${res.statusCode}`);
            console.log(`Server: ${res.headers.server}`);
            console.log(`Date: ${res.headers.date}`);
            console.log(`Cache-Control: ${res.headers['cache-control'] || 'not set'}`);
        });
        
        if (!allPassed) {
            console.log('\n❌ DEPLOYMENT VERIFICATION FAILED!');
            console.log('The site is not serving the latest code.');
            console.log('\n🔧 Possible issues:');
            console.log('1. Railway deployment is still in progress');
            console.log('2. CDN/Cache is serving old content');
            console.log('3. Wrong branch is deployed');
            console.log('4. Build failed on Railway');
        } else {
            console.log('\n✅ ALL CHECKS PASSED!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verifyDeployment();