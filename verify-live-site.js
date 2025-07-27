#!/usr/bin/env node

const https = require('https');

console.log('🔍 LIVE SITE VERIFICATION\n');

function checkSite() {
    https.get('https://findingsports.com', (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            const isHTML = data.includes('<!doctype') || data.includes('<html');
            const isJSON = data.trim().startsWith('{');
            
            console.log(`Status: ${res.statusCode}`);
            console.log(`Content-Type: ${res.headers['content-type']}`);
            console.log(`Response Type: ${isHTML ? 'HTML ✅' : isJSON ? 'JSON ❌' : 'UNKNOWN'}`);
            console.log(`First 200 chars: ${data.substring(0, 200).replace(/\n/g, ' ')}`);
            
            if (isHTML) {
                console.log('\n✅ SUCCESS: Site is serving HTML!');
                
                // Check for removed elements
                console.log('\n🔍 Checking for removed UI elements:');
                console.log(`Language selector: ${data.includes('fa-globe') || data.includes('language-selector') ? '❌ FOUND' : '✅ REMOVED'}`);
                console.log(`Online indicator: ${data.includes('online-indicator') || data.includes('connectionStatus') ? '❌ FOUND' : '✅ REMOVED'}`);
                console.log(`Help button: ${data.includes('help-btn') || data.includes('fa-question') ? '❌ FOUND' : '✅ REMOVED'}`);
                
                // Check for MapLibre
                console.log('\n🗺️ Checking map implementation:');
                console.log(`MapLibre CSS: ${data.includes('maplibre-gl') && data.includes('.css') ? '✅ FOUND' : '❌ MISSING'}`);
                console.log(`MapLibre JS: ${data.includes('maplibre-gl') && data.includes('.js') ? '✅ FOUND' : '❌ MISSING'}`);
                console.log(`Map container: ${data.includes('id="map"') ? '✅ FOUND' : '❌ MISSING'}`);
                
                // Test Play Now functionality
                console.log('\n🎮 Testing Play Now API:');
                https.get('https://findingsports.com/api/play-now?lat=49.2827&lng=-123.1207&radius=15', (apiRes) => {
                    let apiData = '';
                    apiRes.on('data', (chunk) => { apiData += chunk; });
                    apiRes.on('end', () => {
                        try {
                            const response = JSON.parse(apiData);
                            if (response.activities || response.success) {
                                console.log('✅ Play Now API is working');
                                console.log(`Response has: ${Object.keys(response).join(', ')}`);
                            } else {
                                console.log('❌ Play Now API returned unexpected format');
                            }
                        } catch (e) {
                            console.log('❌ Play Now API error:', e.message);
                        }
                    });
                });
            } else {
                console.log('\n❌ FAIL: Site is still serving JSON');
                console.log('Waiting for deployment to complete...');
            }
        });
    }).on('error', (err) => {
        console.error('❌ Error:', err.message);
    });
}

// Check immediately
checkSite();

// Then check every 30 seconds
console.log('\n⏱️ Will check again every 30 seconds...');
setInterval(checkSite, 30000);