// Google Maps integration for Play Now feature
(function() {
  'use strict';

  let map = null;
  let userMarker = null;
  let gameMarkers = [];
  let infoWindows = [];

  // Sports icons for different activities
  const sportIcons = {
    basketball: '🏀',
    soccer: '⚽',
    volleyball: '🏐',
    tennis: '🎾',
    hockey: '🏒',
    default: '🏃'
  };

  // Custom marker icons
  const markerIcons = {
    user: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3
    },
    happeningNow: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: '#e74c3c',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3
    },
    startingSoon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#f39c12',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3
    },
    laterToday: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#27ae60',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2
    },
    openCourt: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#9b59b6',
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2
    }
  };

  // Initialize map for Play Now
  window.initializePlayNowMap = function(userLat, userLng, activities, allGames) {
    console.log('Initializing Play Now map with Google Maps', { userLat, userLng });

    // Check if Google Maps is loaded
    if (!window.google || !window.google.maps) {
      console.error('Google Maps not loaded yet');
      // Try again in a moment
      setTimeout(() => initializePlayNowMap(userLat, userLng, activities, allGames), 500);
      return;
    }

    const mapDiv = document.getElementById('playNowMap');
    if (!mapDiv) {
      console.error('Map container not found');
      return;
    }

    // Clear any existing map
    mapDiv.innerHTML = '';

    // Create map centered on user location
    map = new google.maps.Map(mapDiv, {
      center: { lat: userLat, lng: userLng },
      zoom: 13,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      styles: [
        {
          featureType: 'poi.business',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi.park',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    });

    // Add user location marker with pulsing animation
    const userLocation = { lat: userLat, lng: userLng };

    // Create pulsing circle for user location
    const pulsingCircle = new google.maps.Circle({
      center: userLocation,
      radius: 100,
      strokeColor: '#4285F4',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#4285F4',
      fillOpacity: 0.3,
      map: map
    });

    // Disable pulsing animation to prevent resize issues
    // Static circle instead of animated one
    // Animation was causing continuous map resizing
    console.log('Pulsing animation disabled for stability');

    // Add user marker
    userMarker = new google.maps.Marker({
      position: userLocation,
      map: map,
      title: 'Your Location',
      icon: markerIcons.user,
      zIndex: 1000
    });

    // Add info window for user location
    const userInfoWindow = new google.maps.InfoWindow({
      content: `
                <div style="padding: 10px; text-align: center;">
                    <h4 style="margin: 0 0 5px 0; color: #4285F4;">📍 You are here</h4>
                    <p style="margin: 0; font-size: 0.9em; color: #666;">Click on game markers to see details</p>
                </div>
            `
    });

    userMarker.addListener('click', () => {
      closeAllInfoWindows();
      userInfoWindow.open(map, userMarker);
    });

    // Clear existing game markers
    clearGameMarkers();

    // Collect all games from activities
    const allActivities = [];

    if (activities.happeningNow) {
      activities.happeningNow.forEach(game => {
        allActivities.push({ ...game, category: 'happeningNow' });
      });
    }

    if (activities.startingSoon) {
      activities.startingSoon.forEach(game => {
        allActivities.push({ ...game, category: 'startingSoon' });
      });
    }

    if (activities.laterToday) {
      activities.laterToday.forEach(game => {
        allActivities.push({ ...game, category: 'laterToday' });
      });
    }

    if (activities.openCourts) {
      activities.openCourts.forEach(court => {
        allActivities.push({ ...court, category: 'openCourt' });
      });
    }

    if (activities.pickupGames) {
      activities.pickupGames.forEach(game => {
        allActivities.push({ ...game, category: 'pickupGame' });
      });
    }

    // Add markers for each game/activity
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(userLocation);

    allActivities.forEach((activity, index) => {
      if (activity.lat && activity.lng) {
        const position = {
          lat: parseFloat(activity.lat),
          lng: parseFloat(activity.lng)
        };

        // Create marker
        const marker = new google.maps.Marker({
          position: position,
          map: map,
          title: `${activity.sport || 'Sport'} at ${activity.venue || 'Location'}`,
          icon: markerIcons[activity.category] || markerIcons.default,
          animation: activity.category === 'happeningNow' ? google.maps.Animation.BOUNCE : null
        });

        // Stop bouncing after 3 seconds
        if (activity.category === 'happeningNow') {
          setTimeout(() => {
            marker.setAnimation(null);
          }, 3000);
        }

        // Create custom label overlay
        const sportIcon = sportIcons[activity.sport?.toLowerCase()] || sportIcons.default;
        const labelDiv = document.createElement('div');
        labelDiv.innerHTML = sportIcon;
        labelDiv.style.fontSize = '20px';
        labelDiv.style.position = 'absolute';
        labelDiv.style.transform = 'translate(-50%, -50%)';

        const label = new google.maps.OverlayView();
        label.onAdd = function() {
          const panes = this.getPanes();
          panes.overlayMouseTarget.appendChild(labelDiv);
        };
        label.draw = function() {
          const projection = this.getProjection();
          const position = projection.fromLatLngToDivPixel(marker.getPosition());
          labelDiv.style.left = position.x + 'px';
          labelDiv.style.top = position.y + 'px';
        };
        label.setMap(map);

        // Create info window content
        const infoContent = createInfoWindowContent(activity);
        const infoWindow = new google.maps.InfoWindow({
          content: infoContent,
          maxWidth: 300
        });

        // Add click listener
        marker.addListener('click', () => {
          closeAllInfoWindows();
          infoWindow.open(map, marker);

          // Smooth pan to marker
          map.panTo(position);

          // Highlight the corresponding game card if visible
          highlightGameCard(activity.id);
        });

        gameMarkers.push(marker);
        infoWindows.push(infoWindow);
        bounds.extend(position);
      }
    });

    // Fit map to show all markers
    if (gameMarkers.length > 0) {
      map.fitBounds(bounds);

      // Don't zoom in too much
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 15) {
          map.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }

    // Add map controls
    addMapControls();

    // Add legend
    addMapLegend();
  };

  // Create info window content
  function createInfoWindowContent(activity) {
    const isLoggedIn = !!localStorage.getItem('token');
    const categoryColors = {
      happeningNow: '#e74c3c',
      startingSoon: '#f39c12',
      laterToday: '#27ae60',
      openCourt: '#9b59b6',
      pickupGame: '#3498db'
    };

    const categoryLabels = {
      happeningNow: '🔴 Happening Now',
      startingSoon: '🟡 Starting Soon',
      laterToday: '📅 Later Today',
      openCourt: '🏸 Open Court',
      pickupGame: '🏀 Pickup Game'
    };

    return `
            <div style="padding: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: ${categoryColors[activity.category] || '#333'};">
                        ${sportIcons[activity.sport?.toLowerCase()] || sportIcons.default} ${activity.sport || 'Sport'}
                    </h3>
                    <span style="font-size: 0.8em; color: ${categoryColors[activity.category] || '#666'};">
                        ${categoryLabels[activity.category] || 'Game'}
                    </span>
                </div>
                
                <div style="margin: 10px 0;">
                    <p style="margin: 5px 0;"><strong>📍 ${activity.venue || 'Location'}</strong></p>
                    ${activity.time ? `<p style="margin: 5px 0;">🕐 ${activity.time}</p>` : ''}
                    ${activity.startTime ? `<p style="margin: 5px 0;">🕐 ${new Date(activity.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>` : ''}
                    ${activity.distance ? `<p style="margin: 5px 0;">🚗 ${activity.distance} away</p>` : ''}
                    ${activity.currentPlayers !== undefined ? `<p style="margin: 5px 0;">👥 ${activity.currentPlayers}${activity.maxPlayers ? `/${activity.maxPlayers}` : ''} players</p>` : ''}
                    ${activity.skillLevel ? `<p style="margin: 5px 0;">🎯 ${activity.skillLevel}</p>` : ''}
                </div>
                
                <div style="margin-top: 15px;">
                    ${isLoggedIn ? `
                        <button onclick="joinGameFromMap('${activity.id}')" style="
                            width: 100%;
                            padding: 10px;
                            background: ${categoryColors[activity.category] || '#ff6b35'};
                            color: white;
                            border: none;
                            border-radius: 5px;
                            font-weight: 600;
                            cursor: pointer;
                            font-size: 14px;
                        ">
                            ${activity.category === 'openCourt' ? 'Get Directions' : 'Join Game'}
                        </button>
                    ` : `
                        <button onclick="requireLogin('${activity.id}')" style="
                            width: 100%;
                            padding: 10px;
                            background: #95a5a6;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            font-weight: 600;
                            cursor: pointer;
                            font-size: 14px;
                        ">
                            Login to Join
                        </button>
                    `}
                </div>
            </div>
        `;
  }

  // Clear all game markers
  function clearGameMarkers() {
    gameMarkers.forEach(marker => marker.setMap(null));
    gameMarkers = [];
    infoWindows = [];
  }

  // Close all info windows
  function closeAllInfoWindows() {
    infoWindows.forEach(infoWindow => infoWindow.close());
  }

  // Highlight corresponding game card
  function highlightGameCard(gameId) {
    // Remove previous highlights
    document.querySelectorAll('.game-card-highlighted').forEach(card => {
      card.classList.remove('game-card-highlighted');
    });

    // Find and highlight the card
    const card = document.querySelector(`[data-game-id="${gameId}"]`);
    if (card) {
      card.classList.add('game-card-highlighted');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Join game from map
  window.joinGameFromMap = function(gameId) {
    // Close info window and trigger join
    closeAllInfoWindows();
    if (window.joinGame) {
      window.joinGame(gameId);
    }
  };

  // Add map controls
  function addMapControls() {
    // Create recenter button
    const recenterButton = document.createElement('button');
    recenterButton.innerHTML = '📍 My Location';
    recenterButton.style.cssText = `
            background: white;
            border: 2px solid #fff;
            border-radius: 3px;
            box-shadow: 0 2px 6px rgba(0,0,0,.3);
            cursor: pointer;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px;
            margin: 10px;
            padding: 8px 12px;
            text-align: center;
        `;

    recenterButton.addEventListener('click', () => {
      if (userMarker) {
        map.panTo(userMarker.getPosition());
        map.setZoom(14);
      }
    });

    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(recenterButton);
  }

  // Add map legend
  function addMapLegend() {
    const legend = document.createElement('div');
    legend.style.cssText = `
            background: white;
            border: 2px solid #fff;
            border-radius: 3px;
            box-shadow: 0 2px 6px rgba(0,0,0,.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 12px;
            margin: 10px;
            padding: 10px;
        `;

    legend.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 5px;">Game Status</div>
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <div style="width: 12px; height: 12px; background: #e74c3c; border-radius: 50%; margin-right: 8px;"></div>
                <span>Happening Now</span>
            </div>
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <div style="width: 10px; height: 10px; background: #f39c12; border-radius: 50%; margin-right: 8px;"></div>
                <span>Starting Soon</span>
            </div>
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <div style="width: 8px; height: 8px; background: #27ae60; border-radius: 50%; margin-right: 8px;"></div>
                <span>Later Today</span>
            </div>
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <div style="width: 8px; height: 8px; background: #9b59b6; border-radius: 50%; margin-right: 8px;"></div>
                <span>Open Courts</span>
            </div>
        `;

    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);
  }

  // Update markers when games change
  window.updatePlayNowMarkers = function(activities) {
    if (!map) return;

    clearGameMarkers();

    // Re-add markers with new data
    const allActivities = [];
    Object.keys(activities).forEach(category => {
      if (Array.isArray(activities[category])) {
        activities[category].forEach(activity => {
          allActivities.push({ ...activity, category });
        });
      }
    });

    allActivities.forEach(activity => {
      if (activity.lat && activity.lng) {
        const position = {
          lat: parseFloat(activity.lat),
          lng: parseFloat(activity.lng)
        };

        const marker = new google.maps.Marker({
          position: position,
          map: map,
          title: `${activity.sport || 'Sport'} at ${activity.venue || 'Location'}`,
          icon: markerIcons[activity.category] || markerIcons.default
        });

        const infoWindow = new google.maps.InfoWindow({
          content: createInfoWindowContent(activity),
          maxWidth: 300
        });

        marker.addListener('click', () => {
          closeAllInfoWindows();
          infoWindow.open(map, marker);
          map.panTo(position);
        });

        gameMarkers.push(marker);
        infoWindows.push(infoWindow);
      }
    });
  };

  // Get user location and update map
  window.updateUserLocation = function() {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        if (userMarker) {
          userMarker.setPosition({ lat: userLat, lng: userLng });
        }

        if (map) {
          map.panTo({ lat: userLat, lng: userLng });
        }
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  };

  // Add CSS for highlighted game cards
  const style = document.createElement('style');
  style.textContent = `
        .game-card-highlighted {
            box-shadow: 0 0 0 3px #4285F4 !important;
            transform: scale(1.02);
            transition: all 0.3s ease;
        }
        
        #playNowMap {
            border: 2px solid #e0e0e0;
            border-radius: 8px;
        }
        
        .gm-style-iw-d {
            overflow: auto !important;
        }
        
        .gm-style .gm-style-iw-c {
            padding: 0 !important;
        }
        
        .gm-style .gm-style-iw-t::after {
            top: -1px !important;
        }
    `;
  document.head.appendChild(style);

})();
