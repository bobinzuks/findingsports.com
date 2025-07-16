const fetch = require('node-fetch');

// Test the real data API endpoint
async function testRealDataAPI() {
    console.log('Testing Play Now API with real data...\n');
    
    const testLocation = {
        lat: 49.3234,  // North Vancouver
        lng: -123.0831
    };
    
    try {
        // Test local API
        const localUrl = `http://localhost:8080/api/play-now?lat=${testLocation.lat}&lng=${testLocation.lng}&radius=10`;
        console.log('Testing local API:', localUrl);
        
        const response = await fetch(localUrl);
        const data = await response.json();
        
        console.log('\n📊 API Response Summary:');
        console.log('Total Activities:', data.summary?.totalActivities || 0);
        console.log('Happening Now:', data.summary?.happeningNow || 0);
        console.log('Starting Soon:', data.summary?.startingSoon || 0);
        console.log('Later Today:', data.summary?.laterToday || 0);
        
        // Check for real data
        const hasRealData = data.activities?.happeningNow?.some(a => a.isRealData) ||
                           data.activities?.startingSoon?.some(a => a.isRealData) ||
                           data.activities?.laterToday?.some(a => a.isRealData);
        
        console.log('\n✅ Real Data Present:', hasRealData);
        
        // Show some real activities
        if (data.activities?.happeningNow?.length > 0) {
            console.log('\n🏃 Happening Now:');
            data.activities.happeningNow.slice(0, 3).forEach(activity => {
                console.log(`  - ${activity.sport} at ${activity.venue} (${activity.distance})`);
                console.log(`    ${activity.isRealData ? '✅ REAL DATA' : '📋 Mock data'}`);
            });
        }
        
        if (data.activities?.startingSoon?.length > 0) {
            console.log('\n⏰ Starting Soon:');
            data.activities.startingSoon.slice(0, 3).forEach(activity => {
                console.log(`  - ${activity.sport} at ${activity.venue} (${activity.distance})`);
                console.log(`    ${activity.isRealData ? '✅ REAL DATA' : '📋 Mock data'}`);
            });
        }
        
    } catch (error) {
        console.error('Error testing API:', error.message);
    }
}

// Run test
testRealDataAPI();