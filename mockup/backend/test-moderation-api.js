const axios = require('axios');

// Test configuration
const BASE_URL = process.env.API_URL || 'http://localhost:8080';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''; // Set this after creating an admin user

// Axios instance with auth
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

async function testModerationAPI() {
    console.log('Testing Moderation API endpoints...\n');

    try {
        // Test 1: List moderators
        console.log('1. Testing GET /api/moderators');
        const moderatorsResponse = await api.get('/api/moderators');
        console.log('✓ Moderators:', moderatorsResponse.data);
        console.log('');

        // Test 2: Create a report (as regular user)
        console.log('2. Testing POST /api/reports');
        const reportResponse = await api.post('/api/reports', {
            reported_user_id: 'user_123',
            report_type: 'harassment',
            description: 'Test report for inappropriate behavior'
        });
        console.log('✓ Report created:', reportResponse.data);
        console.log('');

        // Test 3: Get reports (as moderator)
        console.log('3. Testing GET /api/moderation/reports');
        const reportsResponse = await api.get('/api/moderation/reports');
        console.log('✓ Reports:', reportsResponse.data);
        console.log('');

        // Test 4: Perform moderation action
        console.log('4. Testing POST /api/moderation/actions');
        const actionResponse = await api.post('/api/moderation/actions', {
            action_type: 'warn',
            target_user_id: 'user_123',
            reason: 'Violation of community guidelines'
        });
        console.log('✓ Action performed:', actionResponse.data);
        console.log('');

        // Test 5: Get moderation logs
        console.log('5. Testing GET /api/moderation/logs');
        const logsResponse = await api.get('/api/moderation/logs');
        console.log('✓ Moderation logs:', logsResponse.data);
        console.log('');

        console.log('All tests passed! ✓');

    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
        
        if (!ADMIN_TOKEN) {
            console.log('\nNote: ADMIN_TOKEN is not set. Please:');
            console.log('1. Create an admin user');
            console.log('2. Login to get a token');
            console.log('3. Set ADMIN_TOKEN environment variable');
            console.log('\nExample:');
            console.log('ADMIN_TOKEN=your_token_here node test-moderation-api.js');
        }
    }
}

// Run tests
testModerationAPI();