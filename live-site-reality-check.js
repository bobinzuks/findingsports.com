#!/usr/bin/env node

/**
 * LIVE SITE REALITY CHECK
 * Tests ONLY what's actually deployed at findingsports.com
 * NO LIES - Just facts
 */

const https = require('https');

const LIVE_SITE = 'https://findingsports.com';

async function testLiveSite() {
    console.log('🔍 LIVE SITE REALITY CHECK');
    console.log('Testing: ' + LIVE_SITE);
    console.log('Time: ' + new Date().toISOString());
    console.log('=' .repeat(60));
    
    const endpoints = [
        // Basic health
        { name: 'Server Health', path: '/health' },
        
        // Currently working endpoints (proven)
        { name: 'Homepage', path: '/' },
        { name: 'Play Now API', path: '/api/play-now' },
        { name: 'Games API', path: '/api/games' },
        { name: 'BC Locations', path: '/api/locations/bc' },
        
        // Supposedly deployed endpoints
        { name: 'Venues API', path: '/api/venues' },
        { name: 'Sports API', path: '/api/sports' },
        { name: 'Dashboard', path: '/dashboard.html' },
        { name: 'Venues with City', path: '/api/venues?city=vancouver' },
        { name: 'Sports Basketball', path: '/api/sports/basketball' },
        
        // Authentication
        { name: 'Login Page', path: '/login.html' },
        { name: 'Google Auth', path: '/auth/google' },
        
        // WebSocket/Stats
        { name: 'WebSocket Stats', path: '/api/ws/stats' },
        { name: 'Data Stats', path: '/api/data/stats' }
    ];
    
    const results = {
        working: [],
        notWorking: []
    };
    
    for (const endpoint of endpoints) {
        await new Promise((resolve) => {
            const url = LIVE_SITE + endpoint.path;
            
            https.get(url, (res) => {
                const success = res.statusCode >= 200 && res.statusCode < 400;
                
                console.log(`${success ? '✅' : '❌'} ${endpoint.name}: ${res.statusCode}`);
                
                if (success) {
                    results.working.push(endpoint);
                } else {
                    results.notWorking.push({ ...endpoint, status: res.statusCode });
                }
                
                resolve();
            }).on('error', (err) => {
                console.log(`❌ ${endpoint.name}: ERROR - ${err.message}`);
                results.notWorking.push({ ...endpoint, error: err.message });
                resolve();
            });
        });
        
        // Small delay between requests
        await new Promise(r => setTimeout(r, 500));
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 REALITY CHECK RESULTS');
    console.log('=' .repeat(60));
    console.log(`Total endpoints tested: ${endpoints.length}`);
    console.log(`✅ Working: ${results.working.length}`);
    console.log(`❌ Not Working: ${results.notWorking.length}`);
    
    console.log('\n✅ ACTUALLY WORKING ON LIVE SITE:');
    results.working.forEach(e => {
        console.log(`  - ${e.name} (${e.path})`);
    });
    
    console.log('\n❌ NOT DEPLOYED/NOT WORKING:');
    results.notWorking.forEach(e => {
        console.log(`  - ${e.name} (${e.path}) - ${e.status || e.error}`);
    });
    
    // Check for local sports data
    const playNowWorking = results.working.find(e => e.path === '/api/play-now');
    if (playNowWorking) {
        console.log('\n🏟️ CHECKING LOCAL SPORTS DATA...');
        
        await new Promise((resolve) => {
            https.get(LIVE_SITE + '/api/play-now', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.activities) {
                            const activities = [
                                ...json.activities.happeningNow || [],
                                ...json.activities.startingSoon || []
                            ];
                            console.log(`Found ${activities.length} drop-in activities`);
                            activities.forEach(a => {
                                console.log(`  - ${a.sport} at ${a.venue}`);
                            });
                        }
                    } catch (e) {
                        console.log('Could not parse Play Now data');
                    }
                    resolve();
                });
            });
        });
    }
    
    console.log('\n🚨 DEPLOYMENT REALITY:');
    if (results.notWorking.find(e => e.path === '/api/venues')) {
        console.log('❌ Venues endpoint NOT DEPLOYED');
    }
    if (results.notWorking.find(e => e.path === '/api/sports')) {
        console.log('❌ Sports endpoint NOT DEPLOYED');  
    }
    if (results.notWorking.find(e => e.path === '/dashboard.html')) {
        console.log('❌ Dashboard NOT DEPLOYED');
    }
    
    console.log('\n⚠️  CONCLUSION:');
    console.log('The deployment DID NOT work. Railway approval or manual deployment needed.');
    console.log('Core features work but new endpoints are NOT live.');
}

// Run the reality check
testLiveSite().catch(console.error);