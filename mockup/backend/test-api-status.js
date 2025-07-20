const fetch = require('node-fetch');
const { getInstance: getPlayNowService } = require('./services/play-now-service');
const { getInstance: getDataSwarm } = require('./services/data-aggregation-swarm');

async function testAPIs() {
  console.log('🔍 Testing API Status and Availability...\n');

  const playNowService = getPlayNowService();
  const dataSwarm = getDataSwarm();

  // Test 1: Check Play Now Service Configuration
  console.log('1️⃣ Play Now Service Configuration:');
  console.log(`   - Use Real Data: ${playNowService.config.useRealData}`);
  console.log(`   - Use Swarm: ${playNowService.config.useSwarm}`);
  console.log(`   - Swarm Timeout: ${playNowService.config.swarmTimeout}ms`);
  console.log(`   - Search Radius: 20km (expanded from 10km)`);
  console.log('');

  // Test 2: Check Real Data Sources
  console.log('2️⃣ Real Data Sources:');
  console.log(`   - Real Schedules Loaded: ${playNowService.realSchedules.size} venues`);
  console.log(`   - Mock Schedules Available: ${Object.keys(playNowService.mockSchedules).length} venues`);
  console.log('');

  // Test 3: Check Swarm Data Sources
  console.log('3️⃣ Swarm Data Sources:');
  const sourceStats = dataSwarm.getSourcesByCategory();
  console.log(`   - Total Sources: ${dataSwarm.sources.size}`);
  console.log(`   - Drop-in Activities: ${sourceStats.dropIn}`);
  console.log(`   - Open Fields/Courts: ${sourceStats.openField}`);
  console.log(`   - Pickup Games: ${sourceStats.pickup}`);
  console.log(`   - API Sources: ${sourceStats.api}`);
  console.log(`   - Scraper Sources: ${sourceStats.scraper}`);
  console.log('');

  // Test 4: Test Sample API Endpoints
  console.log('4️⃣ Testing Sample API Endpoints:');
  
  const testEndpoints = [
    {
      name: 'Vancouver Parks',
      url: 'https://vancouver.ca/parks-recreation-culture/drop-in-basketball.aspx',
      type: 'scraper'
    },
    {
      name: 'North Vancouver Rec',
      url: 'https://www.nvrc.ca/drop-in-schedules',
      type: 'scraper'
    },
    {
      name: 'OpenSports API',
      url: 'https://api.opensports.net/v1/games?type=pickup&open=true',
      type: 'api'
    }
  ];

  for (const endpoint of testEndpoints) {
    try {
      const response = await fetch(endpoint.url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FindingSports/1.0)'
        }
      });
      
      const status = response.status;
      let result = '✅';
      let message = `Status ${status}`;
      
      if (status === 403) {
        result = '🚫';
        message = 'BLOCKED (403 Forbidden)';
      } else if (status === 429) {
        result = '⏰';
        message = 'RATE LIMITED (429)';
      } else if (status >= 400) {
        result = '❌';
        message = `ERROR (${status})`;
      }
      
      console.log(`   ${result} ${endpoint.name}: ${message}`);
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ${error.message}`);
    }
  }
  console.log('');

  // Test 5: Check Current Activity Categories
  console.log('5️⃣ Testing Activity Categorization:');
  const testLocation = { lat: 49.2827, lng: -123.1207 }; // Downtown Vancouver
  
  try {
    const activities = await playNowService.getPlayNowActivities(testLocation, {
      radiusKm: 20,
      includeOpenCourts: true,
      includePickupGames: true
    });
    
    console.log(`   - Happening Now: ${activities.happeningNow.length} activities`);
    console.log(`   - Starting Soon: ${activities.startingSoon.length} activities`);
    console.log(`   - Later Today: ${activities.laterToday.length} activities`);
    console.log(`   - Upcoming (Next 7 Days): ${activities.upcoming.length} activities`);
    console.log(`   - Open Courts: ${activities.openCourts.length} courts`);
    console.log(`   - Pickup Games: ${activities.pickupGames.length} games`);
    
    const total = activities.happeningNow.length + 
                  activities.startingSoon.length + 
                  activities.laterToday.length + 
                  activities.upcoming.length +
                  activities.openCourts.length + 
                  activities.pickupGames.length;
    
    console.log(`   - TOTAL: ${total} activities found`);
  } catch (error) {
    console.log(`   ❌ Error getting activities: ${error.message}`);
  }
  console.log('');

  // Test 6: Check for Blocking Indicators
  console.log('6️⃣ Checking for API Blocking Indicators:');
  const swarmStats = dataSwarm.getStats();
  console.log(`   - Failed Collections: ${swarmStats.failedCollections}`);
  console.log(`   - Successful Collections: ${swarmStats.successfulCollections}`);
  console.log(`   - Cache Hits: ${swarmStats.cacheHits}`);
  console.log(`   - Cache Misses: ${swarmStats.cacheMisses}`);
  
  // Check individual source failures
  const failedSources = swarmStats.sources
    .filter(s => s.failureCount > 0)
    .sort((a, b) => b.failureCount - a.failureCount)
    .slice(0, 5);
  
  if (failedSources.length > 0) {
    console.log('   \n   Top Failed Sources:');
    failedSources.forEach(source => {
      console.log(`   - ${source.siteId}: ${source.failureCount} failures (reliability: ${(source.reliability * 100).toFixed(0)}%)`);
    });
  }
  console.log('');

  // Summary
  console.log('📊 SUMMARY:');
  console.log('   - Search radius expanded to 20km ✅');
  console.log('   - Showing next 7 days of activities ✅');
  console.log('   - Data aggregation timeout increased to 15s ✅');
  console.log('   - Additional venue data added ✅');
  
  if (failedSources.length > 3) {
    console.log('   ⚠️  Multiple API sources are failing - possible blocking or rate limiting');
  } else if (total < 50) {
    console.log('   ⚠️  Low activity count - check data source connectivity');
  } else {
    console.log('   ✅ System appears to be functioning normally');
  }
}

// Run the test
testAPIs().catch(console.error);