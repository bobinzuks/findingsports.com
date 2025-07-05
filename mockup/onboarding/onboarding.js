// Onboarding flow controller
let currentStep = 1;
const totalSteps = 4;
const onboardingData = {
    location: null,
    sports: [],
    mcpServers: [],
    timePreferences: []
};

// Get current user from localStorage
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

// Step content templates
const stepTemplates = {
    1: () => `
        <h2 class="step-title">Where do you play?</h2>
        <p class="step-description">Select your primary location. You can add more locations later.</p>
        
        <div class="location-options" id="locationOptions">
            ${['Vancouver', 'Burnaby', 'Richmond', 'Surrey', 'North Van', 'Coquitlam']
        .map(
            city => `
                <div class="location-card" data-city="${city.toLowerCase().replace(' ', '')}">
                    <div class="city-name">${city}</div>
                    <div class="city-info">${Math.floor((Math.random() * 40) + 15)}+ venues</div>
                </div>
            `
        )
        .join('')}
        </div>
    `,

    2: () => `
        <h2 class="step-title">What sports do you play?</h2>
        <p class="step-description">Select all the sports you're interested in.</p>
        
        <div class="sports-grid" id="sportsGrid">
            ${[
        { name: 'Basketball', icon: '🏀' },
        { name: 'Soccer', icon: '⚽' },
        { name: 'Volleyball', icon: '🏐' },
        { name: 'Tennis', icon: '🎾' },
        { name: 'Hockey', icon: '🏒' },
        { name: 'Baseball', icon: '⚾' },
        { name: 'Badminton', icon: '🏸' },
        { name: 'Table Tennis', icon: '🏓' }
    ]
        .map(
            sport => `
                <div class="sport-card" data-sport="${sport.name.toLowerCase()}">
                    <div class="sport-icon">${sport.icon}</div>
                    <div class="sport-name">${sport.name}</div>
                </div>
            `
        )
        .join('')}
        </div>
    `,

    3: () => `
        <h2 class="step-title">Where should we look for games?</h2>
        <p class="step-description">Enable data sources for ${onboardingData.location || 'your area'}. These MCP servers collect game information from various sources.</p>
        
        <div class="mcp-servers" id="mcpServers">
            ${getMCPServersForLocation()
        .map(
            server => `
                <div class="mcp-server-card" data-server="${server.id}">
                    <div class="mcp-server-header">
                        <div class="mcp-server-name">${server.name}</div>
                        <div class="mcp-server-stats">
                            <span>⭐ ${server.stars}</span>
                            <span>📥 ${server.installs}</span>
                        </div>
                    </div>
                    <div class="mcp-server-description">${server.description}</div>
                    <div class="mcp-server-tags">
                        ${server.tags.map(tag => `<span class="mcp-tag">${tag}</span>`).join('')}
                    </div>
                </div>
            `
        )
        .join('')}
        </div>
    `,

    4: () => `
        <h2 class="step-title">When do you like to play?</h2>
        <p class="step-description">Select your preferred playing times. We'll prioritize games during these times.</p>
        
        <div class="time-preferences" id="timePreferences">
            ${[
        { id: 'weekday-morning', title: 'Weekday Mornings', desc: '6 AM - 12 PM' },
        { id: 'weekday-afternoon', title: 'Weekday Afternoons', desc: '12 PM - 5 PM' },
        { id: 'weekday-evening', title: 'Weekday Evenings', desc: '5 PM - 10 PM' },
        { id: 'weekend-morning', title: 'Weekend Mornings', desc: '7 AM - 12 PM' },
        { id: 'weekend-afternoon', title: 'Weekend Afternoons', desc: '12 PM - 6 PM' },
        { id: 'weekend-evening', title: 'Weekend Evenings', desc: '6 PM - 11 PM' }
    ]
        .map(
            time => `
                <div class="time-slot" data-time="${time.id}">
                    <div class="time-slot-title">${time.title}</div>
                    <div class="time-slot-desc">${time.desc}</div>
                </div>
            `
        )
        .join('')}
        </div>
    `
};

// Get MCP servers based on location
function getMCPServersForLocation() {
    const servers = [
        {
            id: 'mcp-vancouver-rec',
            name: 'Vancouver Recreation Centers',
            description: 'Official schedules from Vancouver Park Board facilities',
            stars: 124,
            installs: '1.2k',
            tags: ['official', 'real-time', 'drop-in']
        },
        {
            id: 'mcp-facebook-sports',
            name: 'Facebook Sports Events',
            description: 'Discover community games from Facebook groups and events',
            stars: 89,
            installs: '876',
            tags: ['social', 'community', 'pickup']
        },
        {
            id: 'mcp-basketball-bc',
            name: 'Basketball BC League',
            description: 'League games and tournaments from Basketball BC',
            stars: 67,
            installs: '423',
            tags: ['leagues', 'tournaments', 'official']
        },
        {
            id: 'mcp-weather-sports',
            name: 'Weather Impact Analyzer',
            description: 'Get alerts when outdoor games might be affected by weather',
            stars: 156,
            installs: '2.1k',
            tags: ['weather', 'alerts', 'outdoor']
        },
        {
            id: 'mcp-perfectmind',
            name: 'PerfectMind Integration',
            description: 'Real-time availability from facilities using PerfectMind',
            stars: 201,
            installs: '3.4k',
            tags: ['booking', 'real-time', 'official']
        }
    ];

    // Add location-specific servers
    if (onboardingData.location && onboardingData.location.includes('burnaby')) {
        servers.push({
            id: 'mcp-burnaby-rec',
            name: 'Burnaby Rec Centers',
            description: 'Schedules from Burnaby recreation facilities',
            stars: 45,
            installs: '234',
            tags: ['official', 'drop-in', 'burnaby']
        });
    }

    return servers;
}

// Initialize step
function initializeStep() {
    const stepContent = document.getElementById('stepContent');
    stepContent.innerHTML = stepTemplates[currentStep]();

    // Add event listeners based on step
    switch (currentStep) {
    case 1:
        document.querySelectorAll('.location-card').forEach(card => {
            card.addEventListener('click', () => selectLocation(card));
        });
        break;
    case 2:
        document.querySelectorAll('.sport-card').forEach(card => {
            card.addEventListener('click', () => toggleSport(card));
        });
        break;
    case 3:
        document.querySelectorAll('.mcp-server-card').forEach(card => {
            card.addEventListener('click', () => toggleMCPServer(card));
        });
        // Pre-select recommended servers
        document.querySelectorAll('.mcp-server-card').forEach((card, index) => {
            if (index < 3) {
                card.classList.add('selected');
            }
        });
        updateNextButton();
        break;
    case 4:
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.addEventListener('click', () => toggleTimeSlot(slot));
        });
        break;
    }

    // Update progress bar
    const progress = (currentStep / totalSteps) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;

    // Update navigation buttons
    document.getElementById('backBtn').disabled = currentStep === 1;
    document.getElementById('nextBtn').textContent =
        currentStep === totalSteps ? 'Complete' : 'Next';

    // Add welcome message on first step
    if (currentStep === 1 && currentUser.name) {
        const stepDiv = document.querySelector('.step');
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-user';
        welcomeDiv.innerHTML = `
            <img src="${currentUser.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`}" 
                 alt="${currentUser.name}" class="user-avatar">
            <div class="user-info">
                <h3>Welcome, ${currentUser.name}!</h3>
                <p>Let's personalize Finding Sports for you</p>
            </div>
        `;
        stepDiv.insertBefore(welcomeDiv, stepDiv.firstChild);
    }
}

// Selection handlers
function selectLocation(card) {
    document.querySelectorAll('.location-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    onboardingData.location = card.querySelector('.city-name').textContent;
    updateNextButton();
}

function toggleSport(card) {
    card.classList.toggle('selected');
    const { sport } = card.dataset;
    if (card.classList.contains('selected')) {
        onboardingData.sports.push(sport);
    } else {
        onboardingData.sports = onboardingData.sports.filter(s => s !== sport);
    }
    updateNextButton();
}

function toggleMCPServer(card) {
    card.classList.toggle('selected');
    const serverId = card.dataset.server;
    if (card.classList.contains('selected')) {
        onboardingData.mcpServers.push(serverId);
    } else {
        onboardingData.mcpServers = onboardingData.mcpServers.filter(s => s !== serverId);
    }
    updateNextButton();
}

function toggleTimeSlot(slot) {
    slot.classList.toggle('selected');
    const timeId = slot.dataset.time;
    if (slot.classList.contains('selected')) {
        onboardingData.timePreferences.push(timeId);
    } else {
        onboardingData.timePreferences = onboardingData.timePreferences.filter(t => t !== timeId);
    }
    updateNextButton();
}

// Update next button state
function updateNextButton() {
    const nextBtn = document.getElementById('nextBtn');
    let canProceed = false;

    switch (currentStep) {
    case 1:
        canProceed = onboardingData.location !== null;
        break;
    case 2:
        canProceed = onboardingData.sports.length > 0;
        break;
    case 3:
        canProceed = onboardingData.mcpServers.length > 0;
        break;
    case 4:
        canProceed = onboardingData.timePreferences.length > 0;
        break;
    }

    nextBtn.disabled = !canProceed;
}

// Navigation
window.nextStep = function nextStep() {
    if (currentStep < totalSteps) {
        currentStep++;
        initializeStep();
    } else {
        completeOnboarding();
    }
};

window.previousStep = function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        initializeStep();
    }
};

// Complete onboarding
async function completeOnboarding() {
    try {
        // Save preferences
        const preferences = {
            ...onboardingData,
            userId: currentUser.id,
            completedAt: new Date().toISOString()
        };

        // In a real app, this would be sent to the backend
        localStorage.setItem('userPreferences', JSON.stringify(preferences));

        // Update user as onboarded
        currentUser.onboarded = true;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Show success message
        const stepContent = document.getElementById('stepContent');
        stepContent.innerHTML = `
            <div style="text-align: center;">
                <h2 class="step-title">🎉 All set!</h2>
                <p class="step-description">
                    Finding Sports is now personalized for you. 
                    We'll show you ${onboardingData.sports.join(', ')} games 
                    in ${onboardingData.location} from your selected data sources.
                </p>
                <div style="margin-top: 40px;">
                    <button class="nav-btn next" onclick="window.location.href='/'">
                        Start Finding Games
                    </button>
                </div>
            </div>
        `;

        // Hide navigation buttons
        document.querySelector('.nav-buttons').style.display = 'none';
    } catch (error) {
        // console.error('Failed to complete onboarding:', error);
        alert('Failed to save preferences. Please try again.');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initializeStep();
});

