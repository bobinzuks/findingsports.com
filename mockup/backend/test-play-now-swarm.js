#!/usr/bin/env node

/**
 * Test script for Play Now Swarm
 * Demonstrates the multi-agent system finding real-time sports activities
 */

const { getInstance: getPlayNowService } = require('./services/play-now-service');
const { getInstance: getPlayNowSwarm } = require('./services/play-now-swarm');

async function testPlayNowSwarm() {
    console.log('\n🏀 Finding Sports - Play Now Swarm Test\n');
    console.log('=' .repeat(60));
    
    const playNowService = getPlayNowService();
    const playNowSwarm = getPlayNowSwarm();
    
    // Test locations in Vancouver
    const testLocations = [
        { name: 'Downtown Vancouver', lat: 49.2827, lng: -123.1207 },
        { name: 'UBC Campus', lat: 49.2606, lng: -123.2460 },
        { name: 'Commercial Drive', lat: 49.2692, lng: -123.0700 },
        { name: 'Kitsilano', lat: 49.2684, lng: -123.1681 }
    ];
    
    // Test 1: Get swarm status
    console.log('\n📊 Test 1: Swarm Status\n');
    const status = playNowService.getSwarmStatus();
    console.log('Swarm enabled:', status.enabled);
    console.log('Timeout:', status.timeout + 'ms');
    console.log('Agents:', status.swarmDetails.agents.length);
    status.swarmDetails.agents.forEach(agent => {
        console.log(`  - ${agent.name}: ${agent.role}`);
    });
    
    // Test 2: Find games for each location
    console.log('\n🔍 Test 2: Finding Games by Location\n');
    
    for (const location of testLocations) {
        console.log(`\n📍 ${location.name} (${location.lat}, ${location.lng})`);
        console.log('-'.repeat(50));
        
        try {
            const activities = await playNowService.getPlayNowActivities(location, {
                radiusKm: 5,
                sports: ['basketball', 'volleyball', 'soccer'],
                includeOpenCourts: true,
                includePickupGames: true
            });
            
            // Summary
            console.log(`\n  🎯 Happening Now: ${activities.happeningNow.length} activities`);
            activities.happeningNow.slice(0, 3).forEach(activity => {
                console.log(`     • ${activity.sport} at ${activity.venue} (${activity.distance})`);
                console.log(`       ${activity.timeString} - ${activity.endsIn || 'ongoing'}`);
            });
            
            console.log(`\n  ⏰ Starting Soon: ${activities.startingSoon.length} activities`);
            activities.startingSoon.slice(0, 3).forEach(activity => {
                console.log(`     • ${activity.sport} at ${activity.venue} (${activity.distance})`);
                console.log(`       Starts in ${activity.startsIn}`);
            });
            
            console.log(`\n  🏀 Open Courts: ${activities.openCourts.length} available`);
            activities.openCourts.slice(0, 3).forEach(court => {
                console.log(`     • ${court.venue} - ${court.type} (${court.distance})`);
                console.log(`       ${court.availability}`);
            });
            
            console.log(`\n  👥 Pickup Games: ${activities.pickupGames.length} games`);
            activities.pickupGames.forEach(game => {
                console.log(`     • ${game.sport} at ${game.venue} (${game.distance})`);
                console.log(`       ${game.time} - ${game.platform}`);
            });
            
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
        }
    }
    
    // Test 3: Swarm performance metrics
    console.log('\n\n📈 Test 3: Swarm Performance Metrics\n');
    const metrics = playNowSwarm.metrics;
    console.log('Total requests:', metrics.totalRequests);
    console.log('Average response time:', Math.round(metrics.avgResponseTime) + 'ms');
    console.log('Cache hit rate:', playNowSwarm.getCacheUtilization());
    console.log('\nAgent executions:');
    Object.entries(metrics.agentExecutions).forEach(([agent, count]) => {
        console.log(`  - ${agent}: ${count} executions`);
    });
    
    // Test 4: Data sources info
    console.log('\n\n📚 Test 4: Data Sources\n');
    const sources = playNowService.getDataSourcesInfo();
    console.log('Total data sources:', sources.totalSources);
    console.log('Categories:');
    Object.entries(sources.categories).forEach(([category, count]) => {
        console.log(`  - ${category}: ${count} sources`);
    });
    
    // Test 5: Test with swarm disabled (mock data only)
    console.log('\n\n🔄 Test 5: Compare with Mock Data\n');
    playNowService.setSwarmEnabled(false);
    
    const mockActivities = await playNowService.getPlayNowActivities(testLocations[0], {
        radiusKm: 5
    });
    
    console.log('Mock data results:');
    console.log(`  - Happening Now: ${mockActivities.happeningNow.length}`);
    console.log(`  - Starting Soon: ${mockActivities.startingSoon.length}`);
    console.log(`  - Open Courts: ${mockActivities.openCourts.length}`);
    
    // Re-enable swarm
    playNowService.setSwarmEnabled(true);
    
    console.log('\n\n✅ Play Now Swarm test completed!\n');
}

// Run the test
testPlayNowSwarm().catch(console.error);