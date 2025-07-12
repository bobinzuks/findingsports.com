// Fix Play Now functionality
console.log('=== Applying Play Now fixes ===');

// Ensure API_BASE_URL is properly defined globally
if (typeof API_BASE_URL === 'undefined') {
    window.API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 
        (window.location.hostname === 'localhost' ? 'http://localhost:8080' : window.location.origin);
    console.log('✓ Set global API_BASE_URL:', window.API_BASE_URL);
}

// Fix the Play Now button click handler
const playNowButton = document.querySelector('.play-now-btn');
if (playNowButton) {
    // Remove any existing onclick attribute
    playNowButton.removeAttribute('onclick');
    
    // Add proper event listener
    playNowButton.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log('Play Now button clicked');
        
        if (window.playNow) {
            await window.playNow();
        } else {
            console.error('playNow function not found');
        }
    });
    console.log('✓ Fixed Play Now button event listener');
}

// Ensure Play Now page can access the API
if (window.PlayNowPage) {
    // Override findGames to add debugging
    const originalFindGames = window.PlayNowPage.findGames;
    window.PlayNowPage.findGames = async function() {
        console.log('=== Play Now findGames called ===');
        console.log('API_BASE_URL:', window.API_BASE_URL || API_BASE_URL);
        
        try {
            const result = await originalFindGames.call(this);
            console.log('Play Now findGames completed successfully');
            return result;
        } catch (error) {
            console.error('Play Now findGames error:', error);
            console.error('Stack:', error.stack);
            throw error;
        }
    };
    console.log('✓ Added debugging to PlayNowPage.findGames');
}

// Fix navigation tabs to include Play Now
const tabsContainer = document.querySelector('.tabs');
if (tabsContainer && !tabsContainer.innerHTML.includes('Play Now')) {
    const playNowTab = document.createElement('button');
    playNowTab.className = 'tab';
    playNowTab.textContent = 'Play Now';
    playNowTab.onclick = () => window.switchPage('play-now');
    
    // Insert as first tab
    tabsContainer.insertBefore(playNowTab, tabsContainer.firstChild);
    console.log('✓ Added Play Now tab to navigation');
}

// Test API connectivity
async function testAPIConnection() {
    console.log('\n=== Testing API Connection ===');
    const apiUrl = window.API_BASE_URL || 'http://localhost:8080';
    
    try {
        const response = await fetch(`${apiUrl}/api/play-now?lat=49.2827&lng=-123.1207&radius=10&includeOpenCourts=true`);
        const data = await response.json();
        
        console.log('✓ API Connection successful');
        console.log('Total activities:', 
            (data.activities?.happeningNow?.length || 0) +
            (data.activities?.startingSoon?.length || 0) +
            (data.activities?.laterToday?.length || 0) +
            (data.activities?.openCourts?.length || 0) +
            (data.activities?.pickupGames?.length || 0)
        );
    } catch (error) {
        console.error('✗ API Connection failed:', error);
    }
}

// Run API test after a short delay
setTimeout(testAPIConnection, 1000);

console.log('=== Play Now fixes applied ===');
console.log('Try clicking the "Play Now" button or navigating to the Play Now tab');