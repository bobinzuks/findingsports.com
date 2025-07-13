/**
 * Play Now Swarm Demo
 * Shows how the multi-agent system finds real-time sports activities
 */

const { getInstance: getPlayNowService } = require('../services/play-now-service');

async function demoPlayNow() {
    const playNowService = getPlayNowService();
    
    // Downtown Vancouver location
    const userLocation = { lat: 49.2827, lng: -123.1207 };
    
    console.log('🏀 Finding Sports - Play Now Demo\n');
    console.log(`📍 Location: Downtown Vancouver (${userLocation.lat}, ${userLocation.lng})`);
    console.log(`⭕ Search radius: 5 km\n`);
    
    // Get activities using the swarm
    console.log('🐝 Activating Play Now Swarm...\n');
    
    const activities = await playNowService.getPlayNowActivities(userLocation, {
        radiusKm: 5,
        sports: ['basketball', 'volleyball', 'soccer'],
        includeOpenCourts: true,
        includePickupGames: true
    });
    
    // Display results
    console.log('🎯 HAPPENING NOW:');
    if (activities.happeningNow.length > 0) {
        activities.happeningNow.slice(0, 3).forEach(activity => {
            console.log(`\n  📍 ${activity.venue} (${activity.distance})`);
            console.log(`  🏀 ${activity.sport.toUpperCase()}`);
            console.log(`  ⏰ ${activity.timeString}`);
            console.log(`  👥 ${activity.availability || 'Drop-in available'}`);
            console.log(`  💵 Cost: $${activity.cost || 'Free'}`);
            if (activity.endsIn) {
                console.log(`  ⏱️  Ends in ${activity.endsIn}`);
            }
        });
    } else {
        console.log('  No activities happening right now');
    }
    
    console.log('\n\n⏰ STARTING SOON:');
    if (activities.startingSoon.length > 0) {
        activities.startingSoon.slice(0, 3).forEach(activity => {
            console.log(`\n  📍 ${activity.venue} (${activity.distance})`);
            console.log(`  🏀 ${activity.sport.toUpperCase()}`);
            console.log(`  ⏰ ${activity.timeString}`);
            console.log(`  ⏱️  Starts in ${activity.startsIn}`);
            console.log(`  💵 Cost: $${activity.cost || 'Free'}`);
        });
    } else {
        console.log('  No activities starting soon');
    }
    
    console.log('\n\n🏀 OPEN COURTS:');
    if (activities.openCourts.length > 0) {
        activities.openCourts.slice(0, 3).forEach(court => {
            console.log(`\n  📍 ${court.venue} (${court.distance})`);
            console.log(`  🏀 ${court.type}`);
            console.log(`  ✅ ${court.status === 'open' ? 'Available now' : court.status}`);
            console.log(`  👥 ${court.availability}`);
            if (court.currentPlayers) {
                console.log(`  🏃 ${court.currentPlayers} players currently`);
            }
            if (court.condition) {
                console.log(`  🌤️  ${court.condition}`);
            }
        });
    }
    
    console.log('\n\n👥 PICKUP GAMES:');
    if (activities.pickupGames.length > 0) {
        activities.pickupGames.forEach(game => {
            console.log(`\n  📍 ${game.venue} (${game.distance})`);
            console.log(`  🏀 ${game.sport.toUpperCase()}`);
            console.log(`  ⏰ ${game.time}`);
            console.log(`  👥 ${game.playersNeeded ? `${game.playersNeeded} spots left` : `${game.spotsLeft} spots`}`);
            console.log(`  📱 Join via: ${game.platform}`);
            console.log(`  🎯 Level: ${game.skillLevel}`);
        });
    }
    
    // Show swarm status
    const status = playNowService.getSwarmStatus();
    console.log('\n\n📊 SWARM PERFORMANCE:');
    console.log(`  ✅ Data source: ${status.enabled ? 'Real-time swarm' : 'Mock data'}`);
    console.log(`  🐝 Active agents: ${status.swarmDetails.agents.length}`);
    console.log(`  ⚡ Cache utilization: ${status.swarmDetails.metrics.cacheHits}/${status.swarmDetails.metrics.cacheHits + status.swarmDetails.metrics.cacheMisses} hits`);
    console.log(`  ⏱️  Response time: ${Math.round(status.swarmDetails.metrics.avgResponseTime)}ms`);
    
    console.log('\n✨ Demo complete!\n');
}

// Run the demo
demoPlayNow().catch(console.error);