const fetch = require('node-fetch');

async function testServer() {
    const baseUrl = 'http://localhost:8080';

    console.log('Testing Finding Sports Backend...\n');

    try {
        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const healthRes = await fetch(`${baseUrl}/health`);
        const health = await healthRes.json();
        console.log('✓ Health check:', health);

        // Test games endpoint
        console.log('\n2. Testing games endpoint...');
        const gamesRes = await fetch(`${baseUrl}/api/games?location=vancouver`);
        const gamesData = await gamesRes.json();
        console.log('✓ Games found:', gamesData.games.length);
        console.log('✓ Source:', gamesData.source);

        if (gamesData.games.length > 0) {
            console.log('\nSample game:');
            console.log(JSON.stringify(gamesData.games[0], null, 2));
        }

        // Test data stats endpoint
        console.log('\n3. Testing data stats endpoint...');
        const statsRes = await fetch(`${baseUrl}/api/data/stats`);
        const stats = await statsRes.json();
        console.log('✓ Data pipeline stats:', stats);

        // Test facilities endpoint
        console.log('\n4. Testing facilities endpoint...');
        const facilitiesRes = await fetch(`${baseUrl}/api/facilities`);
        const facilitiesData = await facilitiesRes.json();
        console.log('✓ Facilities found:', facilitiesData.facilities ? facilitiesData.facilities.length : 0);

        console.log('\n✅ All tests passed!');
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

// Wait a bit for server to start up
setTimeout(testServer, 2000);
