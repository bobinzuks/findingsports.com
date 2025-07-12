// Debug script to test Play Now functionality
console.log('=== Play Now Debug Started ===');

// Check if API_BASE_URL is defined
console.log('API_BASE_URL:', typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'UNDEFINED');
console.log('window.APP_CONFIG:', window.APP_CONFIG);

// Override fetch to log requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
    console.log('Fetch called with:', args[0]);
    return originalFetch.apply(this, args)
        .then(response => {
            console.log('Response status:', response.status);
            return response;
        })
        .catch(error => {
            console.error('Fetch error:', error);
            throw error;
        });
};

// Test the Play Now function directly
async function debugPlayNow() {
    console.log('\n=== Testing Play Now Function ===');
    
    // Ensure PlayNowPage exists
    if (!window.PlayNowPage) {
        console.error('PlayNowPage not loaded!');
        return;
    }
    
    // Create mock elements if they don't exist
    if (!document.getElementById('playNowSportSelect')) {
        const select = document.createElement('select');
        select.id = 'playNowSportSelect';
        select.value = 'any';
        document.body.appendChild(select);
        console.log('Created mock sport select');
    }
    
    if (!document.getElementById('playNowResults')) {
        const results = document.createElement('div');
        results.id = 'playNowResults';
        document.body.appendChild(results);
        console.log('Created mock results div');
    }
    
    if (!document.querySelector('.play-now-action-btn')) {
        const btn = document.createElement('button');
        btn.className = 'play-now-action-btn';
        btn.innerHTML = '<span class="btn-text">Play Now</span>';
        document.body.appendChild(btn);
        console.log('Created mock button');
    }
    
    // Mock location service if needed
    if (!window.locationService) {
        window.locationService = {
            getLocationInfo: () => ({
                userLocation: { lat: 49.2827, lng: -123.1207 }
            })
        };
        console.log('Created mock location service');
    }
    
    try {
        console.log('Calling PlayNowPage.findGames()...');
        await window.PlayNowPage.findGames();
        console.log('Play Now function completed');
        
        const results = document.getElementById('playNowResults').innerHTML;
        console.log('Results HTML length:', results.length);
        console.log('Results preview:', results.substring(0, 200));
    } catch (error) {
        console.error('Play Now error:', error);
        console.error('Error stack:', error.stack);
    }
}

// Wait for page to load then test
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(debugPlayNow, 1000);
    });
} else {
    setTimeout(debugPlayNow, 1000);
}

console.log('=== Debug script loaded ===');