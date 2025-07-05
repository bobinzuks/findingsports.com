// Initialize map
let map;
let markers = [];

// Auth state
const authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let isGuest = !authToken;

// Load API
if (!window.api) {
    const script = document.createElement('script');
    script.src = 'js/api.js';
    document.head.appendChild(script);
}

// Game data
const gamesData = {
    vancouver: [
        {
            id: 1,
            type: 'basketball',
            title: 'Pick-up Basketball',
            location: 'North Vancouver',
            coords: [49.32, -123.0724],
            attendees: 6,
            host: 'Luke',
            status: 'Signed-up',
            indoor: false
        },
        {
            id: 2,
            type: 'basketball',
            title: 'Basketball League',
            location: 'Kitsilano',
            coords: [49.2684, -123.1683],
            attendees: 7,
            host: 'Kristin',
            status: 'Organizing',
            indoor: true,
            organized: true
        },
        {
            id: 3,
            type: 'basketball',
            title: 'Pick-up Basketball',
            location: 'Downtown',
            coords: [49.2827, -123.1207],
            attendees: 4,
            host: 'Alana',
            status: 'Attending',
            indoor: true
        },
        {
            id: 4,
            type: 'soccer',
            title: 'Drop-in Soccer',
            location: 'UBC',
            coords: [49.2606, -123.246],
            attendees: 12,
            host: 'Carlos',
            status: 'Hosting',
            indoor: false
        }
    ],
    burnaby: [
        {
            id: 5,
            type: 'volleyball',
            title: 'Beach Volleyball',
            location: 'Burnaby Lake',
            coords: [49.2488, -122.9045],
            attendees: 8,
            host: 'Sarah',
            status: 'Organizing',
            indoor: false
        }
    ],
    richmond: [
        {
            id: 6,
            type: 'tennis',
            title: 'Tennis Doubles',
            location: 'Richmond Centre',
            coords: [49.1666, -123.1368],
            attendees: 3,
            host: 'David',
            status: 'Looking for 1 more',
            indoor: true
        }
    ]
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for API to load
    await new Promise(resolve => {
        const checkAPI = setInterval(() => {
            if (window.api) {
                clearInterval(checkAPI);
                resolve();
            }
        }, 100);
    });

    // Initialize WebSocket
    window.initializeWebSocket();
    window.setupConnectionIndicator();

    // Verify authentication if logged in
    if (authToken && window.api) {
        try {
            const { user } = await window.api.getCurrentUser();
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            isGuest = false;

            // Check if onboarding is needed
            if (!user.onboarded) {
                window.location.href = '/onboarding/';
                return;
            }
        } catch (error) {
            // Invalid token - continue as guest
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            currentUser = null;
            isGuest = true;
        }
    }

    // Update UI for guest/logged in state
    window.updateAuthUI();

    window.initializeMap();
    window.loadGamesFromAPI();
});

// Initialize Leaflet map
window.initializeMap = function () {
    map = L.map('map').setView([49.2827, -123.1207], 11);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add custom styles
    const mapContainer = document.getElementById('map');
    mapContainer.style.filter = 'hue-rotate(200deg) saturate(0.5) brightness(0.9)';
};

// Display games based on location
window.displayGames = function (location) {
    const games = gamesData[location] || [];
    const gamesList = document.getElementById('gamesList');
    const locationName = document.getElementById('locationName');

    // Update location name
    locationName.textContent = location.charAt(0).toUpperCase() + location.slice(1);

    // Clear existing games
    gamesList.innerHTML = '';

    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Add games to list and map
    games.forEach(game => {
        // Create game card
        const gameCard = window.createGameCard(game);
        gamesList.appendChild(gameCard);

        // Add marker to map
        const marker = L.marker(game.coords).addTo(map).bindPopup(`
                <strong>${game.title}</strong><br>
                ${game.location}<br>
                ${game.attendees} attendees
            `);

        markers.push(marker);
    });

    // Adjust map view to show all markers
    if (markers.length > 0) {
        const group = new L.FeatureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
};

// Create game card element
window.createGameCard = function (game) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.dataset.gameId = game.id;
    card.onclick = () => window.showGameDetails(game);

    const sportIcon = window.getSportIcon(game.type);

    card.innerHTML = `
        <div class="game-header">
            <span class="game-icon">${sportIcon}</span>
            ${game.organized ? '<span class="game-type">Organized League</span>' : ''}
            <h3 class="game-title">${game.title}</h3>
            ${game.indoor ? '<span class="game-indoor">Indoor</span>' : ''}
        </div>
        <div class="game-location">
            <span class="location-dot">•</span>
            <span>${game.location}</span>
        </div>
        <div class="game-info">
            <span class="attendees">${game.attendees} ${game.attendees === 1 ? 'attendee' : 'attendees'}</span>
            <div class="host-info">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${game.host}" 
                     alt="${game.host}" class="host-avatar">
                <div class="host-details">
                    <span class="host-tag">${game.host}</span>
                    <span class="host-name">${game.host}</span>
                    <span class="host-status">${game.status}</span>
                </div>
            </div>
        </div>
    `;

    return card;
};

// Get sport icon
window.getSportIcon = function (sport) {
    const icons = {
        basketball: '🏀',
        soccer: '⚽',
        volleyball: '🏐',
        tennis: '🎾',
        hockey: '🏒',
        baseball: '⚾'
    };
    return icons[sport] || '🏃';
};

// Search games
window.searchGames = async function searchGames() {
    const location = document.getElementById('locationSelect').value;
    const sport = document.getElementById('sportSelect').value;

    // Add search animation
    const searchBtn = document.querySelector('.search-btn');
    searchBtn.classList.add('loading');

    try {
        await window.loadGamesFromAPI(location, sport);
    } catch (error) {
        // Fall back to demo data
        let games = gamesData[location] || [];
        if (sport !== 'any') {
            games = games.filter(game => game.type === sport);
        }
        window.displayFilteredGames(location, games);
    }

    searchBtn.classList.remove('loading');
};

// Display filtered games
window.displayFilteredGames = function (location, games) {
    const gamesList = document.getElementById('gamesList');
    const locationName = document.getElementById('locationName');

    locationName.textContent = location.charAt(0).toUpperCase() + location.slice(1);
    gamesList.innerHTML = '';

    // Clear markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    if (games.length === 0) {
        gamesList.innerHTML =
            '<p style="text-align: center; color: #b8bdd8;">No games found for your search criteria.</p>';
        return;
    }

    games.forEach(game => {
        const gameCard = window.createGameCard(game);
        gamesList.appendChild(gameCard);

        const marker = L.marker(game.coords).addTo(map).bindPopup(`
                <strong>${game.title}</strong><br>
                ${game.location}<br>
                ${game.attendees} attendees
            `);

        markers.push(marker);
    });

    // Adjust map view
    if (markers.length > 0) {
        const group = new L.FeatureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
};

// Switch tabs
window.switchTab = function switchTab(tab) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));

    if (tab === 'social') {
        tabs[0].classList.add('active');
        // Show social feed content
        window.displayGames(document.getElementById('locationSelect').value);
    } else {
        tabs[1].classList.add('active');
        // Show upcoming games
        window.showUpcomingGames();
    }
};

// Show upcoming games
window.showUpcomingGames = function () {
    const gamesList = document.getElementById('gamesList');
    gamesList.innerHTML = '<h3 style="text-align: center; color: #b8bdd8;">Your upcoming games will appear here</h3>';
};

// Show game details
window.showGameDetails = function (game) {
    if (isGuest) {
        const join = confirm(`
${game.title}
Location: ${game.location}
Attendees: ${game.attendees}
Host: ${game.host}
${game.indoor ? 'Indoor facility' : 'Outdoor venue'}

Sign in to join this game?`);

        if (join) {
            // Save game ID to join after login
            sessionStorage.setItem('joinGameAfterLogin', game.id);
            window.location.href = '/login-google.html';
        }
    } else {
        // Logged in user can join
        if (confirm(`Join "${game.title}"?`)) {
            window.joinGame(game.id);
        }
    }
};

// Join a game
window.joinGame = async function (gameId) {
    try {
        await window.api.joinGame(gameId);
        alert('Successfully joined the game!');

        // Join WebSocket room for real-time updates
        if (window.wsClient) {
            window.wsClient.joinGame(gameId);
        }

        // Refresh games list
        window.loadGamesFromAPI();
    } catch (error) {
        alert('Failed to join game. Please try again.');
    }
};

// Update location
document.getElementById('locationSelect').addEventListener('change', async e => {
    const newLocation = e.target.value;

    // Update WebSocket location subscription
    if (window.wsClient && window.wsClient.connected) {
        if (window.wsClient.currentLocation) {
            window.wsClient.unsubscribeFromLocation(window.wsClient.currentLocation);
        }
        window.wsClient.subscribeToLocation(newLocation);
    }

    await window.loadGamesFromAPI(newLocation);
});

// Display user info
window.updateAuthUI = function () {
    const userNameEl = document.getElementById('userName');
    const authSection = document.querySelector('.user-section') || document.querySelector('.header-right');

    if (isGuest) {
        userNameEl.textContent = 'Welcome, Guest!';

        // Add login button for guests
        if (!document.getElementById('guestLoginBtn')) {
            const loginBtn = document.createElement('button');
            loginBtn.id = 'guestLoginBtn';
            loginBtn.className = 'guest-login-btn';
            loginBtn.textContent = 'Sign In';
            loginBtn.onclick = () => (window.location.href = '/login-google.html');

            if (authSection) {
                authSection.appendChild(loginBtn);
            }
        }

        // Hide logout button for guests
        const logoutBtn = document.querySelector('button[onclick*="logout"]');
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
    } else if (currentUser) {
        userNameEl.textContent = `Welcome, ${currentUser.name || currentUser.username || currentUser.email}!`;

        // Show logout button
        const logoutBtn = document.querySelector('button[onclick*="logout"]');
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
        }

        // Remove guest login button if exists
        const guestLoginBtn = document.getElementById('guestLoginBtn');
        if (guestLoginBtn) {
            guestLoginBtn.remove();
        }
    }
};

// Logout function
window.logout = async function logout() {
    if (window.api) {
        try {
            await window.api.logout();
        } catch (error) {
            // Ignore errors
        }
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = '/login.html';
};

// Load games from API
window.loadGamesFromAPI = async function (location = 'vancouver', sport = null) {
    try {
        const filters = { location };
        if (sport && sport !== 'any') {
            filters.sport = sport;
        }

        const { games } = await window.api.getGames(filters);
        window.displayGamesOnMap(games);
    } catch (error) {
        console.error('Failed to load games:', error);
        // Fall back to demo data
        window.displayGames(location);
    }
};

// Display games from API on map and list
window.displayGamesOnMap = function (games) {
    const gamesList = document.getElementById('gamesList');
    const locationName = document.getElementById('locationName');

    // Clear existing
    gamesList.innerHTML = '';
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Add games
    games.forEach(game => {
        // Create game card
        const gameCard = window.createGameCard(game);
        gamesList.appendChild(gameCard);

        // Add marker to map
        const marker = L.marker(game.coords).addTo(map).bindPopup(`
            <strong>${game.title}</strong><br>
            ${game.venue}<br>
            ${game.attendees}/${game.maxAttendees} players
        `);

        markers.push(marker);
    });

    // Adjust map view
    if (markers.length > 0) {
        const group = new L.FeatureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
};

// Initialize WebSocket connection
window.initializeWebSocket = function () {
    if (window.wsClient) {
        window.wsClient.connect();

        // Set up event handlers
        window.wsClient.on('connected', () => {
            console.log('WebSocket connected');
            window.updateConnectionStatus(true);

            // Subscribe to current location
            const currentLocation = document.getElementById('locationSelect').value;
            if (currentLocation) {
                window.wsClient.subscribeToLocation(currentLocation);
            }
        });

        window.wsClient.on('disconnected', () => {
            console.log('WebSocket disconnected');
            window.updateConnectionStatus(false);
        });

        window.wsClient.on('new-game', data => {
            // Reload games to show new game
            window.loadGamesFromAPI();
        });

        window.wsClient.on('game-updated', data => {
            // Game UI is updated automatically by websocket.js
        });
    }
};

// Set up connection status indicator
window.setupConnectionIndicator = function () {
    const indicator = document.createElement('div');
    indicator.className = 'connection-status disconnected';
    indicator.innerHTML = `
        <span class="dot"></span>
        <span class="text">Disconnected</span>
    `;
    indicator.style.display = 'none'; // Hidden by default
    document.body.appendChild(indicator);
};

// Update connection status
window.updateConnectionStatus = function (connected) {
    const indicator = document.querySelector('.connection-status');
    if (indicator) {
        if (connected) {
            indicator.classList.remove('disconnected');
            indicator.querySelector('.text').textContent = 'Connected';
            // Hide after 3 seconds when connected
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 3000);
        } else {
            indicator.classList.add('disconnected');
            indicator.querySelector('.text').textContent = 'Disconnected';
            indicator.style.display = 'flex';
        }
    }
};
