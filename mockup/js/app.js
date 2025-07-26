// Initialize map
let map;
let markers = [];

// Auth state
const authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let isGuest = !authToken;

// Load API and page components
const scriptsToLoad = ['js/api.js', 'js/play-now.js', 'js/drop-in-games.js', 'js/social-feed.js', 'js/leagues.js'];

scriptsToLoad.forEach(src => {
  if (!document.querySelector(`script[src="${src}"]`)) {
    const script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
  }
});

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

// Current page state
window.currentPage = 'play-now';

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, initializing app...');
  // Wait for all scripts to load
  await new Promise(resolve => {
    const checkScripts = setInterval(() => {
      if (
        window.api &&
                window.PlayNowPage &&
                window.DropInGamesPage &&
                window.SocialFeedPage &&
                window.LeaguesPage
      ) {
        clearInterval(checkScripts);
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

  // Initialize location detection
  const locationResult = await window.initializeLocationDetection();

  // Update navigation
  window.updateNavigation();

  // Initialize with Upcoming Games tab by default
  window.switchTab('upcoming');

  // Log map status for debugging
  if (window.mapDebug) {
    setTimeout(() => window.mapDebug.checkStatus(), 1000);
  }
});

// Initialize map (Leaflet/OpenStreetMap only)
window.initializeMap = function (userLocation) {
  // Always use Leaflet - Google Maps has been removed
  initializeLeafletMap(userLocation);
};

// Fallback Leaflet map implementation
function initializeLeafletMap(userLocation) {
  try {
    // Check if map element exists
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.error('Map element not found');
      return;
    }

    // Use detected location or default to Vancouver
    const defaultCenter = userLocation || [49.2827, -123.1207];
    const defaultZoom = userLocation ? 12 : 11;

    // Initialize map centered on user's location
    map = L.map('map', {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Add tile layer with better contrast
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Add user location marker if available
    if (userLocation && window.locationService?.userLocation) {
      const userMarker = L.marker(userLocation, {
        icon: L.divIcon({
          className: 'user-location-marker',
          html: '<div style="background-color: #2196F3; color: white; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 0 10px rgba(33, 150, 243, 0.5); border: 3px solid white; font-size: 10px;">•</div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        })
      }).addTo(map);

      userMarker.bindPopup(`
                <div style="padding: 0.5rem; text-align: center;">
                    <strong>Your Location</strong><br>
                    ${window.locationService.userLocation.city || 'Current position'}
                </div>
            `);
    }

    // Force a resize after a short delay to ensure proper rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    console.log('Map initialized successfully');
  } catch (error) {
    console.error('Error initializing map:', error);
  }
}

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
  if (map && markers) {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
  }

  // Add games to list and map
  games.forEach(game => {
    // Create game card
    const gameCard = window.createGameCard(game);
    gamesList.appendChild(gameCard);

    // Add marker to map
    if (map) {
      const marker = L.marker(game.coords).addTo(map).bindPopup(`
                    <strong>${game.title}</strong><br>
                    ${game.location}<br>
                    ${game.attendees} attendees
                `);
      markers.push(marker);
    }
  });

  // Adjust map view to show all markers
  if (map && markers && markers.length > 0) {
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

  const sportIcon = window.getSportIcon(game.type || game.sport);
  const venueName = game.venue?.name || game.venue || game.location || 'Unknown venue';
  const hostName = game.host?.name || game.organizer?.name || 'Community';
  const attendees = game.attendees || game.capacity?.current || 0;
  const maxAttendees = game.maxAttendees || game.capacity?.max;

  // Format time
  let timeStr = '';
  if (game.startTime) {
    const date = new Date(game.startTime);
    timeStr = date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } else if (game.date) {
    timeStr = new Date(game.date).toLocaleDateString();
  }

  card.innerHTML = `
        <div class="game-header">
            <span class="game-icon">${sportIcon}</span>
            <h3 class="game-title">${game.title}</h3>
            ${game.isIndoor ? '<span class="game-indoor">Indoor</span>' : ''}
        </div>
        <div class="game-location">
            <span class="location-dot">•</span>
            <span>${venueName}</span>
        </div>
        ${timeStr ? `<div class="game-time" style="color: #8892b0; font-size: 0.875rem; margin: 0.5rem 0;">${timeStr}</div>` : ''}
        <div class="game-info">
            <span class="attendees">${attendees}${maxAttendees ? `/${maxAttendees}` : ''} players</span>
            <div class="host-info">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${hostName}" 
                     alt="${hostName}" class="host-avatar">
                <div class="host-details">
                    <span class="host-name">${hostName}</span>
                    ${game.source?.name ? `<span class="host-status" style="font-size: 0.75rem; opacity: 0.8;">${game.source.name}</span>` : ''}
                </div>
            </div>
        </div>
    `;

  return card;
};

// Get sport icon
window.getSportIcon = function (sport) {
  const icons = {
    basketball: 'B',
    soccer: 'S',
    volleyball: 'V',
    tennis: 'T',
    hockey: 'H',
    baseball: 'BB'
  };
  return icons[sport] || 'SP';
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
  if (false) { // Google Maps removed
    window.clearGoogleMarkers();
  } else if (map && markers) {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
  }

  if (games.length === 0) {
    gamesList.innerHTML =
            '<p style="text-align: center; color: #b8bdd8;">No games found for your search criteria.</p>';
    return;
  }

  games.forEach(game => {
    const gameCard = window.createGameCard(game);
    gamesList.appendChild(gameCard);

    if (false) { // Google Maps removed
      window.addGoogleGameMarker(game);
    } else if (map) {
      const marker = L.marker(game.coords).addTo(map).bindPopup(`
                    <strong>${game.title}</strong><br>
                    ${game.location}<br>
                    ${game.attendees} attendees
                `);
      markers.push(marker);
    }
  });

  // Adjust map view
  if (false) { // Google Maps removed
    window.fitMapToMarkers();
  } else if (map && markers && markers.length > 0) {
    const group = new L.FeatureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.1));
  }
};

// Update navigation
window.updateNavigation = function () {
  const navElement = document.querySelector('.tabs');
  if (!navElement) {
    return;
  }

  navElement.innerHTML = `
        <button class="tab" onclick="window.switchPage('play-now')">Play Now</button>
        <button class="tab" onclick="window.switchPage('drop-in')">Drop-in Games</button>
        <button class="tab" onclick="window.switchPage('social')">Social Feed</button>
        <button class="tab" onclick="window.switchPage('leagues')">Leagues</button>
    `;
};

// Switch between pages
window.switchPage = async function (page) {
  // Update current page
  window.currentPage = page;

  // Update active tab
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab, index) => {
    tab.classList.remove('active');
    if (
      (page === 'play-now' && index === 0) ||
            (page === 'drop-in' && index === 1) ||
            (page === 'social' && index === 2) ||
            (page === 'leagues' && index === 3)
    ) {
      tab.classList.add('active');
    }
  });

  // Hide search section for non-map pages
  const searchSection = document.querySelector('.search-section');
  if (searchSection) {
    searchSection.style.display = page === 'social' || page === 'leagues' ? 'none' : 'block';
  }

  // Switch page content
  switch (page) {
  case 'play-now':
    window.PlayNowPage.render();
    await window.PlayNowPage.initialize();
    break;
  case 'drop-in':
    window.DropInGamesPage.render();
    await window.DropInGamesPage.initialize();
    break;
  case 'social':
    window.SocialFeedPage.render();
    await window.SocialFeedPage.initialize();
    break;
  case 'leagues':
    window.LeaguesPage.render();
    await window.LeaguesPage.initialize();
    break;
  }
};

// Switch between main tabs (Social Feed, Upcoming Games, Sport Rules)
window.switchTab = function (tab) {
  // Update active tab
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(t => t.classList.remove('active'));

  // Get sections
  const socialSection = document.getElementById('socialSection');
  const gamesSection = document.querySelector('.games-section');

  // Find and activate the correct tab
  if (tab === 'social') {
    tabs[0]?.classList.add('active');
    // Show social section, hide games section
    if (socialSection) socialSection.style.display = 'block';
    if (gamesSection) gamesSection.style.display = 'none';
    window.switchPage('social');
  } else if (tab === 'upcoming') {
    tabs[1]?.classList.add('active');
    // Hide social section, show games section
    if (socialSection) socialSection.style.display = 'none';
    if (gamesSection) gamesSection.style.display = 'block';
    window.showUpcomingGames();
  }
};

// Show upcoming games
window.showUpcomingGames = async function () {
  const gamesList = document.getElementById('gamesList');
  
  // Show loading state
  gamesList.innerHTML = '<div class="loading-state"><div class="spinner"></div>Loading games...</div>';
  
  try {
    // Fetch games from API
    const games = await window.api.getGames();
    
    if (games && games.length > 0) {
      // Clear loading state
      gamesList.innerHTML = '';
      
      // Display games
      games.forEach(game => {
        const gameCard = window.createGameCard(game);
        gamesList.appendChild(gameCard);
      });
    } else {
      // No games found
      gamesList.innerHTML = '<h3 style="text-align: center; color: #b8bdd8;">No games available at the moment. Check back later!</h3>';
    }
  } catch (error) {
    console.error('Error loading games:', error);
    gamesList.innerHTML = '<h3 style="text-align: center; color: #ff6b35;">Unable to load games. Please try again later.</h3>';
  }
};

// Show/hide sport rules page
window.showRulesPage = function () {
  // Update active tab
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(t => t.classList.remove('active'));
  tabs[2]?.classList.add('active'); // Sport Rules tab

  // Show rules page, hide main app
  if (typeof window.showRulesPage !== 'undefined') {
    document.querySelector('.app-container').style.display = 'none';

    // Create or show the sport rules container
    let rulesContainer = document.getElementById('sport-rules-container');
    if (!rulesContainer) {
      // The sport-rules.js will handle creating the container
      // We just need to trigger its initialization
      if (window.sportRulesManager) {
        window.sportRulesManager.createRulesInterface();
      }
    }

    rulesContainer = document.getElementById('sport-rules-container');
    if (rulesContainer) {
      rulesContainer.style.display = 'block';
    }
  }
};

window.hideRulesPage = function () {
  const rulesContainer = document.getElementById('sport-rules-container');
  if (rulesContainer) {
    rulesContainer.style.display = 'none';
  }
  document.querySelector('.app-container').style.display = 'block';

  // Reset main tabs
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(t => t.classList.remove('active'));
  tabs[0]?.classList.add('active'); // Social Feed tab
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
      alert('Please sign in to join games');
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

// Show activity details (for Play Now drop-in activities)
window.showActivityDetails = function (activity) {
  const message = `
${activity.sport.toUpperCase()} at ${activity.venue}
Time: ${activity.timeString}
Cost: $${activity.cost}
${activity.ageGroup ? `Age Group: ${activity.ageGroup}` : ''}
${activity.skillLevel ? `Skill Level: ${activity.skillLevel}` : ''}
Distance: ${activity.distance}
${activity.note ? `\nNote: ${activity.note}` : ''}

Get directions to this location?`;

  if (confirm(message)) {
    window.getDirections(activity.coordinates.lat, activity.coordinates.lng);
  }
};

// Show court details
window.showCourtDetails = function (court) {
  const message = `
${court.type.toUpperCase()} - ${court.venue}
Status: ${court.status.toUpperCase()}
${court.courts ? `Courts: ${court.courts}` : ''}
${court.lights ? `Lights: ${court.lights}` : ''}
${court.busyTimes ? `Busy Times: ${court.busyTimes}` : ''}
Distance: ${court.distance}

Get directions to this location?`;

  if (confirm(message)) {
    window.getDirections(court.coordinates.lat, court.coordinates.lng);
  }
};

// Show pickup game details
window.showPickupGameDetails = function (game) {
  const message = `
${game.sport.toUpperCase()} Pickup Game
Location: ${game.venue}
Organizer: ${game.organizer} via ${game.platform}
Time: ${game.time}
Skill Level: ${game.skillLevel}
${game.playersNeeded ? `Players Needed: ${game.playersNeeded}` : ''}
${game.spotsLeft ? `Spots Left: ${game.spotsLeft}` : ''}
How to Join: ${game.joinMethod}
Distance: ${game.distance}

Get directions to this location?`;

  if (confirm(message)) {
    window.getDirections(game.coordinates.lat, game.coordinates.lng);
  }
};

// Get directions to a location
window.getDirections = function (lat, lng) {
  const userLocation = JSON.parse(localStorage.getItem('userLocation') || '{}');
  const url = `https://www.openstreetmap.org/directions?route=${userLocation.lat || 49.2827},${userLocation.lng || -123.1207};${lat},${lng}`;
  window.open(url, '_blank');
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

// Initialize location detection
window.initializeLocationDetection = async function () {
  // Wait for location service to load
  await new Promise(resolve => {
    const checkLocationService = setInterval(() => {
      if (window.locationService) {
        clearInterval(checkLocationService);
        resolve();
      }
    }, 100);
  });

  // Wait for play now service to load
  await new Promise(resolve => {
    const checkPlayNowService = setInterval(() => {
      if (window.playNowService) {
        clearInterval(checkPlayNowService);
        resolve();
      }
    }, 100);
  });

  try {
    // Initialize location detection
    const locationResult = await window.locationService.initializeLocation();

    // Set user location for play now service
    if (locationResult.userLocation) {
      window.playNowService.setUserLocation(locationResult.userLocation.lat, locationResult.userLocation.lng);
    }

    // Update location dropdown with nearby cities
    window.updateLocationDropdown(locationResult);

    // Don't show location detection feedback on page load
    // It will be shown when "Find Games Now" is clicked

    console.log('Location detection initialized:', locationResult);
    return locationResult;
  } catch (error) {
    console.error('Failed to initialize location detection:', error);
    return null;
  }
};

// Update location dropdown based on user location
window.updateLocationDropdown = function (locationResult) {
  const locationSelect = document.getElementById('locationSelect');
  if (!locationSelect) {
    return;
  }

  // Clear existing options
  locationSelect.innerHTML = '';

  // Add current city first
  if (locationResult.currentCity) {
    const currentOption = document.createElement('option');
    currentOption.value = locationResult.currentCity.key;
    currentOption.textContent = `${locationResult.currentCity.name} (Current)`;
    currentOption.selected = true;
    locationSelect.appendChild(currentOption);
  }

  // Add nearby cities
  if (locationResult.nearbyCities && locationResult.nearbyCities.length > 0) {
    locationResult.nearbyCities.forEach(city => {
      // Skip if it's the same as current city
      if (city.key === locationResult.currentCity?.key) {
        return;
      }

      const option = document.createElement('option');
      option.value = city.key;
      option.textContent = `${city.name} (${city.distance}km)`;
      locationSelect.appendChild(option);
    });
  }

  // Add separator and other BC cities
  const separator = document.createElement('option');
  separator.disabled = true;
  separator.textContent = '─────────────────';
  locationSelect.appendChild(separator);

  // Add other BC cities not in nearby list
  const nearbyKeys = new Set(locationResult.nearbyCities?.map(c => c.key) || []);
  nearbyKeys.add(locationResult.currentCity?.key);

  const otherCities = window.locationService
    .getAllCities()
    .filter(city => !nearbyKeys.has(city.key))
    .sort((a, b) => a.name.localeCompare(b.name));

  otherCities.forEach(city => {
    const option = document.createElement('option');
    option.value = city.key;
    option.textContent = city.name;
    locationSelect.appendChild(option);
  });
};

// Show location detection feedback
window.showLocationFeedback = function (currentCity, isFallback, detectedLocationInfo) {
  const feedbackDiv = document.createElement('div');
  feedbackDiv.className = 'location-feedback';
  feedbackDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${isFallback ? '#ff6b35' : '#4CAF50'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        opacity: 0;
        transition: opacity 0.3s ease;
        max-width: 300px;
    `;

  let message;
  if (isFallback) {
    message = `Location detection failed - showing ${currentCity.name}, BC`;
  } else {
    message = `Location detected: ${currentCity.name}, BC`;

    // Add detected city info if available and different
    if (detectedLocationInfo && detectedLocationInfo.detectedCity) {
      const { detectedCity } = detectedLocationInfo;
      if (detectedCity.toLowerCase() !== currentCity.name.toLowerCase()) {
        message += `\nYour location: ${detectedCity}`;
        if (detectedLocationInfo.detectedRegion) {
          message += `, ${detectedLocationInfo.detectedRegion}`;
        }
        message += `\nNearest sports hub: ${currentCity.name}`;
      }
    }
  }

  feedbackDiv.style.whiteSpace = 'pre-line';
  feedbackDiv.textContent = message;
  document.body.appendChild(feedbackDiv);

  // Animate in
  setTimeout(() => {
    feedbackDiv.style.opacity = '1';
  }, 100);

  // Remove after 6 seconds (longer for more detailed info)
  setTimeout(() => {
    feedbackDiv.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(feedbackDiv)) {
        document.body.removeChild(feedbackDiv);
      }
    }, 300);
  }, 6000);
};

// Play Now functionality
window.playNow = async function () {
  // Switch to the Play Now page
  window.switchPage('play-now');

  // Optionally trigger the search immediately
  setTimeout(() => {
    if (window.PlayNowPage && window.PlayNowPage.findGames) {
      window.PlayNowPage.findGames();
    }
  }, 500);
};

// Show Play Now results
window.showPlayNowResults = function (playNowGames, errorMessage, allRecommendations) {
  const gamesList = document.getElementById('gamesList');
  const locationName = document.getElementById('locationName');

  // Clear existing games
  gamesList.innerHTML = '';

  // Clear map markers
  if (map && markers) {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
  }

  if (errorMessage) {
    gamesList.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #b8bdd8;">
                <h3 style="margin-bottom: 1rem;">No Immediate Games</h3>
                <p>${errorMessage}</p>
                <button onclick="searchGames()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    View All Games
                </button>
            </div>
        `;
    return;
  }

  // Update section title
  locationName.textContent = 'Ready to Play';

  // Create Play Now header
  const playNowHeader = document.createElement('div');
  playNowHeader.style.cssText = `
        background: linear-gradient(135deg, #ff6b35, #ff8a65);
        color: white;
        padding: 1.5rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        text-align: center;
    `;
  playNowHeader.innerHTML = `
        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem;">Best Games Right Now</h3>
        <p style="margin: 0; opacity: 0.9;">Games ranked by proximity and start time</p>
    `;
  gamesList.appendChild(playNowHeader);

  // Add Play Now games
  playNowGames.forEach((game, index) => {
    const gameCard = window.createPlayNowCard(game, index + 1);
    gamesList.appendChild(gameCard);

    // Add marker to map
    window.addGameMarker(game, 'P');
  });

  // Add recommendations section if available
  if (allRecommendations) {
    window.addRecommendationsSections(allRecommendations, gamesList);
  }

  // Adjust map view for Play Now games
  if (markers.length > 0) {
    const group = new L.FeatureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.1));
  }
};

// Create Play Now game card
window.createPlayNowCard = function (game, rank) {
  const card = document.createElement('div');
  card.className = 'game-card play-now-card';
  card.style.cssText = `
        position: relative;
        border-left: 4px solid #ff6b35;
        background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 138, 101, 0.05));
    `;

  const sportIcon = window.getSportIcon(game.type || game.sport);
  const venueName = game.venue?.name || game.venue || game.location || 'Unknown venue';
  const timeText = window.playNowService.formatTimeUntilStart(game.timeUntilStart);
  const distanceText = window.playNowService.formatDistance(game.distance);
  const urgency = window.playNowService.getUrgencyLevel(game.timeUntilStart);

  // Format time with better display
  let startTimeText = '';
  if (game.startTime) {
    const date = new Date(game.startTime);
    startTimeText = date.toLocaleString('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  card.innerHTML = `
        <div style="position: absolute; top: 1rem; right: 1rem; background: #ff6b35; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">
            #${rank}
        </div>
        
        <div class="game-header">
            <span class="game-icon" style="font-size: 1.5rem;">${sportIcon}</span>
            <div>
                <h3 class="game-title">${game.title}</h3>
                <div style="color: #ff6b35; font-weight: 600; font-size: 0.9rem;">
                    ${startTimeText} • ${timeText} away • ${distanceText}
                </div>
            </div>
        </div>
        
        <div class="game-location">
            <span class="location-dot">•</span>
            <span>${venueName}</span>
        </div>
        
        <div class="game-info" style="margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="attendees">${game.attendees || game.capacity?.current || 0}/${game.maxAttendees || game.capacity?.max || 20} players</span>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <span style="background: ${window.getUrgencyColor(urgency)}; color: white; padding: 0.25rem 0.5rem; border-radius: 8px; font-size: 0.8rem;">
                        ${window.getUrgencyText(urgency)}
                    </span>
                    <button onclick="window.showGameDetails(${JSON.stringify(game).replace(/"/g, '&quot;')})" 
                            style="background: #ff6b35; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        ${isGuest ? 'View Details' : 'Join Game'}
                    </button>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(255, 107, 53, 0.1); border-radius: 8px; font-size: 0.8rem; color: #666;">
            Score: ${Math.round(game.playNowScore)}/100 • 
            ${window.playNowService.generateRecommendation(game)}
        </div>
    `;

  return card;
};

// Add game marker to map
window.addGameMarker = function (game, iconOverride) {
  // Use Leaflet only - Google Maps removed

  // Leaflet fallback
  let coords = null;

  if (game.coords && Array.isArray(game.coords)) {
    coords = game.coords;
  } else if (game.venue?.coordinates) {
    coords = [game.venue.coordinates.lat, game.venue.coordinates.lng];
  }

  if (!coords || !map) {
    return;
  }

  const icon = iconOverride || window.getSportIcon(game.type || game.sport);

  const markerIcon = L.divIcon({
    className: 'game-marker',
    html: `<div style="background-color: #ff6b35; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 3px 8px rgba(0,0,0,0.3); font-size: 1.1rem;">${icon}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  const marker = L.marker(coords, { icon: markerIcon }).addTo(map);

  const timeText = game.timeUntilStart ? window.playNowService.formatTimeUntilStart(game.timeUntilStart) : '';
  const distanceText = game.distance ? window.playNowService.formatDistance(game.distance) : '';

  const popupContent = `
        <div style="padding: 0.5rem; min-width: 200px;">
            <strong>${game.title}</strong><br>
            ${game.venue?.name || game.venue || game.location}<br>
            ${game.attendees || 0}${game.maxAttendees ? `/${game.maxAttendees}` : ''} players<br>
            ${timeText ? `${timeText}` : ''}
            ${distanceText ? ` • ${distanceText}` : ''}
        </div>
    `;

  marker.bindPopup(popupContent);
  markers.push(marker);
};

// Add recommendations sections
window.addRecommendationsSections = function (recommendations, gamesList) {
  // Add separator
  const separator = document.createElement('div');
  separator.style.cssText = 'height: 2rem;';
  gamesList.appendChild(separator);

  // Other recommendations
  if (recommendations.soonestGames.length > 0) {
    window.addRecommendationSection(gamesList, 'Soonest Games', recommendations.soonestGames.slice(0, 3), '');
  }

  if (recommendations.nearestGames.length > 0) {
    window.addRecommendationSection(gamesList, 'Nearest Games', recommendations.nearestGames.slice(0, 3), '');
  }

  if (recommendations.todayGames.length > 0) {
    window.addRecommendationSection(gamesList, 'Today\'s Games', recommendations.todayGames.slice(0, 3), '');
  }
};

// Add recommendation section
window.addRecommendationSection = function (gamesList, title, games, icon) {
  const sectionHeader = document.createElement('div');
  sectionHeader.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0 0.5rem 0;
        border-left: 3px solid #ff6b35;
    `;
  sectionHeader.innerHTML = `<h4 style="margin: 0; color: #ff6b35;">${title}</h4>`;
  gamesList.appendChild(sectionHeader);

  games.forEach(game => {
    const gameCard = window.createGameCard(game);
    gameCard.style.marginLeft = '1rem';
    gameCard.style.background = 'rgba(255, 255, 255, 0.05)';
    gamesList.appendChild(gameCard);
  });
};

// Display user info
window.updateAuthUI = function () {
  const userMenu = document.querySelector('.user-menu');

  if (!userMenu) {
    return;
  }

  // Clear existing content
  userMenu.innerHTML = '';

  if (isGuest) {
    // Guest UI
    const guestSpan = document.createElement('span');
    guestSpan.className = 'user-name';
    guestSpan.textContent = 'Guest';
    userMenu.appendChild(guestSpan);

    const loginBtn = document.createElement('button');
    loginBtn.className = 'guest-login-btn';
    loginBtn.textContent = 'Sign In';
    loginBtn.onclick = () => alert('Login functionality coming soon');
    userMenu.appendChild(loginBtn);
  } else if (currentUser) {
    // Logged in user UI
    const userInfo = document.createElement('div');
    userInfo.className = 'user-name';

    // Create avatar with initials
    const avatar = document.createElement('div');
    avatar.className = 'user-avatar';
    const name = currentUser.name || currentUser.username || currentUser.email;
    const initials = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    avatar.textContent = initials;

    // If user has picture, use it
    if (currentUser.picture) {
      const img = document.createElement('img');
      img.src = currentUser.picture;
      img.className = 'user-avatar';
      img.style.objectFit = 'cover';
      userInfo.appendChild(img);
    } else {
      userInfo.appendChild(avatar);
    }

    // Add name
    const nameSpan = document.createElement('span');
    nameSpan.textContent = name.split(' ')[0]; // First name only
    userInfo.appendChild(nameSpan);

    userMenu.appendChild(userInfo);

    // Add logout button
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'auth-button';
    logoutBtn.textContent = 'Sign Out';
    logoutBtn.onclick = window.logout;
    userMenu.appendChild(logoutBtn);
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
  // Reload the page instead of redirecting to login
  window.location.reload();
};

// Load games from API
window.loadGamesFromAPI = async function (location = 'vancouver', sport = null) {
  try {
    console.log('Loading games from API...', { location, sport });

    const filters = { location };
    if (sport && sport !== 'any') {
      filters.sport = sport;
    }

    const response = await window.api.getGames(filters);
    console.log('API Response:', response);

    const games = response.games || [];

    if (games.length === 0) {
      console.warn('No games returned from API');

      // Check if scraping needs to be triggered
      if (window.DebugUtils) {
        console.log('Checking scraping status...');
        const status = await window.DebugUtils.checkScrapingStatus();
        if (status && status.dataAggregation.totalGames === 0) {
          console.log('No games in database, triggering auto-fix...');
          // Don't auto-trigger in production
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.DebugUtils.autoFixGames();
          }
        }
      }
    }

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
  if (map && markers) {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
  }

  if (games.length === 0) {
    gamesList.innerHTML =
            '<p style="text-align: center; color: #b8bdd8; padding: 2rem;">No games found. Check back later or try a different search.</p>';
    return;
  }

  // Add games
  games.forEach(game => {
    // Ensure game has proper coordinates
    let coords = null;
    if (game.coords && Array.isArray(game.coords)) {
      coords = game.coords;
    } else if (game.venue?.coordinates) {
      coords = [game.venue.coordinates.lat, game.venue.coordinates.lng];
    }

    // Create game card
    const gameCard = window.createGameCard(game);
    gamesList.appendChild(gameCard);

    // Add marker to map if coordinates exist
    if (coords) {
      if (map) {
        try {
          const markerIcon = L.divIcon({
            className: 'game-marker',
            html: `<div style="background-color: #ff6b35; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">${window.getSportIcon(game.type || game.sport)}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          const marker = L.marker(coords, { icon: markerIcon }).addTo(map);

          const popupContent = `
                        <div style="padding: 0.5rem;">
                            <strong>${game.title}</strong><br>
                            ${game.venue?.name || game.venue || game.location}<br>
                            ${game.attendees || 0}${game.maxAttendees ? `/${game.maxAttendees}` : ''} players<br>
                            ${
  game.startTime ?
    new Date(game.startTime).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }) :
    ''
}
                        </div>
                    `;

          marker.bindPopup(popupContent);
          markers.push(marker);
        } catch (error) {
          console.error('Error adding marker for game:', game, error);
        }
      }
    }
  });

  // Adjust map view
  if (markers && markers.length > 0 && map) {
    try {
      const group = new L.FeatureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    } catch (error) {
      console.error('Error adjusting map bounds:', error);
    }
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

// Helper functions for urgency display
window.getUrgencyColor = function (urgency) {
  if (urgency === 'urgent') {
    return '#ff4444';
  }
  if (urgency === 'soon') {
    return '#ff6b35';
  }
  return '#4CAF50';
};

window.getUrgencyText = function (urgency) {
  if (urgency === 'urgent') {
    return 'Urgent';
  }
  if (urgency === 'soon') {
    return 'Soon';
  }
  return 'Good timing';
};
