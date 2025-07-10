const fetch = require('node-fetch');

/**
 * Test the Play Now API endpoint
 */

const API_BASE = 'http://localhost:8080';

// Test locations in Vancouver
const testLocations = [
    { name: 'Downtown Vancouver', lat: 49.2827, lng: -123.1207 },
    { name: 'UBC Campus', lat: 49.2606, lng: -123.2460 },
    { name: 'East Vancouver', lat: 49.2488, lng: -123.0599 },
    { name: 'North Vancouver', lat: 49.3208, lng: -123.0726 }
];

async function testPlayNowAPI(location) {
    console.log(`\n🏃 Testing Play Now for ${location.name}`);
    console.log('=' .repeat(60));
    
    try {
        const response = await fetch(
            `${API_BASE}/api/play-now?lat=${location.lat}&lng=${location.lng}&radius=5`
        );
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // Display summary
        console.log('\n📊 SUMMARY:');
        console.log(`Total activities found: ${data.summary.totalActivities}`);
        console.log(`Search radius: ${data.summary.searchRadius}`);
        console.log(`Current time: ${new Date(data.summary.currentTime).toLocaleString()}`);
        
        // Display happening now
        if (data.activities.happeningNow.length > 0) {
            console.log('\n🟢 HAPPENING NOW:');
            data.activities.happeningNow.forEach((activity, i) => {
                console.log(`\n${i + 1}. ${getSportEmoji(activity.sport)} ${activity.sport.toUpperCase()}`);
                console.log(`   📍 ${activity.venue} (${activity.distance})`);
                console.log(`   ⏰ ${activity.timeString}`);
                console.log(`   ⏱️ Started ${activity.startedAgo}`);
                console.log(`   💰 $${activity.cost}${activity.ageGroup ? ` - ${activity.ageGroup}` : ''}`);
                if (activity.courts) console.log(`   🏟️ ${activity.courts} courts`);
                if (activity.note) console.log(`   ℹ️ ${activity.note}`);
            });
        }
        
        // Display starting soon
        if (data.activities.startingSoon.length > 0) {
            console.log('\n🟡 STARTING SOON:');
            data.activities.startingSoon.forEach((activity, i) => {
                console.log(`\n${i + 1}. ${getSportEmoji(activity.sport)} ${activity.sport.toUpperCase()}`);
                console.log(`   📍 ${activity.venue} (${activity.distance})`);
                console.log(`   ⏰ ${activity.timeString}`);
                console.log(`   ⏱️ Starts in ${activity.startsIn}`);
                console.log(`   💰 $${activity.cost}${activity.ageGroup ? ` - ${activity.ageGroup}` : ''}`);
            });
        }
        
        // Display open courts
        if (data.activities.openCourts.length > 0) {
            console.log('\n🏞️ OPEN COURTS/FIELDS:');
            data.activities.openCourts.forEach((court, i) => {
                console.log(`\n${i + 1}. ${getSportEmoji(court.type)} ${court.type.toUpperCase()} - ${court.venue}`);
                console.log(`   📍 ${court.distance} away`);
                console.log(`   ${court.status === 'open' ? '✅' : '⚠️'} ${court.status.toUpperCase()}`);
                if (court.courts) console.log(`   🏟️ ${court.courts} courts`);
                if (court.lights) console.log(`   💡 Lights: ${court.lights}`);
                if (court.busyTimes) console.log(`   ⏰ ${court.busyTimes}`);
            });
        }
        
        // Display pickup games
        if (data.activities.pickupGames.length > 0) {
            console.log('\n👥 PICKUP GAMES:');
            data.activities.pickupGames.forEach((game, i) => {
                console.log(`\n${i + 1}. ${getSportEmoji(game.sport)} ${game.sport.toUpperCase()}`);
                console.log(`   📍 ${game.venue} (${game.distance})`);
                console.log(`   👥 ${game.organizer} via ${game.platform}`);
                console.log(`   ⏰ ${game.time}`);
                if (game.playersNeeded) console.log(`   🔍 Need ${game.playersNeeded} more players`);
                if (game.spotsLeft) console.log(`   🎫 ${game.spotsLeft} spots left`);
                console.log(`   🎯 ${game.skillLevel}`);
                console.log(`   📱 ${game.joinMethod}`);
            });
        }
        
        return data;
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        return null;
    }
}

function getSportEmoji(sport) {
    const emojis = {
        basketball: '🏀',
        volleyball: '🏐',
        soccer: '⚽',
        badminton: '🏸',
        hockey: '🏒',
        skating: '⛸️',
        tennis: '🎾',
        swimming: '🏊'
    };
    return emojis[sport] || '🏃';
}

// Simulate different times of day
async function testDifferentTimes() {
    console.log('\n\n🕐 TESTING DIFFERENT TIMES OF DAY');
    console.log('=' .repeat(60));
    
    const times = [
        { name: 'Morning (10 AM)', hour: 10 },
        { name: 'Evening (6:30 PM)', hour: 18.5 },
        { name: 'Night (9 PM)', hour: 21 }
    ];
    
    // Mock time changes by showing what would be available
    times.forEach(time => {
        console.log(`\n⏰ ${time.name}:`);
        if (time.hour === 10) {
            console.log('   • 🏸 Badminton drop-in @ Kerrisdale');
            console.log('   • 🏊 Lane swim @ Multiple pools');
        } else if (time.hour === 18.5) {
            console.log('   • 🏀 Basketball @ Hillcrest (in progress)');
            console.log('   • 🏐 Volleyball @ UBC (in progress)');
            console.log('   • ⚽ Pickup soccer organizing now');
        } else if (time.hour === 21) {
            console.log('   • 🏀 Late night basketball @ Britannia');
            console.log('   • 🏒 Shinny hockey @ Killarney');
        }
    });
}

// Main test function
async function runTests() {
    console.log('🚀 Testing Play Now API');
    console.log('=' .repeat(60));
    console.log('Note: Make sure the backend server is running on port 8080\n');
    
    // Test from different locations
    for (const location of testLocations) {
        await testPlayNowAPI(location);
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Show time-based variations
    await testDifferentTimes();
    
    console.log('\n\n✅ Play Now API tests completed!');
}

// Check if server is running
async function checkServer() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        if (!response.ok) {
            throw new Error('Server not responding');
        }
        console.log('✅ Server is running\n');
        return true;
    } catch (error) {
        console.error('❌ Server is not running. Please start the backend server first.');
        console.log('Run: cd mockup/backend && npm start\n');
        return false;
    }
}

// Run tests
(async () => {
    const serverRunning = await checkServer();
    if (serverRunning) {
        await runTests();
    }
})();