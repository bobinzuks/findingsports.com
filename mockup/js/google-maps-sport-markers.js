// Google Maps Sport Markers Extension
// Enhances Google Maps with sport-specific custom markers and clustering

// Sport marker management
const SportMapMarkers = {
  markers: [],
  markerClusterer: null,
  infoWindow: null,
  selectedMarker: null,
  
  // Initialize sport markers
  init: function(map) {
    this.map = map;
    this.infoWindow = new google.maps.InfoWindow();
    
    // Initialize marker clusterer with custom styles
    if (window.MarkerClusterer) {
      this.initClusterer();
    }
    
    // Add map legend
    this.addMapLegend();
  },
  
  // Initialize marker clusterer
  initClusterer: function() {
    const clusterStyles = [
      {
        textColor: 'white',
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
          '<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">' +
          '<circle cx="25" cy="25" r="23" fill="#FF6B35" fill-opacity="0.8" stroke="#FFFFFF" stroke-width="2"/>' +
          '</svg>'
        ),
        height: 50,
        width: 50,
        textSize: 14
      },
      {
        textColor: 'white',
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
          '<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">' +
          '<circle cx="30" cy="30" r="28" fill="#FF5722" fill-opacity="0.8" stroke="#FFFFFF" stroke-width="2"/>' +
          '</svg>'
        ),
        height: 60,
        width: 60,
        textSize: 16
      },
      {
        textColor: 'white',
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
          '<svg width="70" height="70" xmlns="http://www.w3.org/2000/svg">' +
          '<circle cx="35" cy="35" r="33" fill="#E91E63" fill-opacity="0.8" stroke="#FFFFFF" stroke-width="2"/>' +
          '</svg>'
        ),
        height: 70,
        width: 70,
        textSize: 18
      }
    ];
    
    this.markerClusterer = new MarkerClusterer(this.map, [], {
      styles: clusterStyles,
      maxZoom: 15,
      gridSize: 60,
      minimumClusterSize: 2,
      imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
    });
  },
  
  // Add sport game marker
  addGameMarker: function(game) {
    if (!game.coords && !game.venue?.coordinates) return;
    
    const position = game.coords ? 
      { lat: game.coords[0], lng: game.coords[1] } :
      { lat: game.venue.coordinates.lat, lng: game.venue.coordinates.lng };
    
    const sport = game.type || game.sport || 'other';
    const icon = SportIcons.getIcon(sport);
    
    // Create custom marker
    const marker = new google.maps.Marker({
      position: position,
      map: this.map,
      title: game.title || icon.name,
      icon: this.createCustomMarkerIcon(sport),
      animation: google.maps.Animation.DROP,
      game: game // Store game data
    });
    
    // Add sport icon overlay
    this.addSportIconOverlay(marker, sport);
    
    // Add click listener
    marker.addListener('click', () => {
      this.showGameInfo(marker, game);
    });
    
    // Add hover effects
    marker.addListener('mouseover', () => {
      marker.setIcon(this.createCustomMarkerIcon(sport, true, false));
    });
    
    marker.addListener('mouseout', () => {
      const isSelected = this.selectedMarker === marker;
      marker.setIcon(this.createCustomMarkerIcon(sport, false, isSelected));
    });
    
    this.markers.push(marker);
    
    // Add to clusterer if available
    if (this.markerClusterer) {
      this.markerClusterer.addMarker(marker);
    }
    
    return marker;
  },
  
  // Create custom marker icon with sport colors
  createCustomMarkerIcon: function(sport, isHovered = false, isSelected = false) {
    const icon = SportIcons.getIcon(sport);
    const scale = isHovered ? 0.8 : 0.7;
    const opacity = isHovered ? 1 : 0.9;
    const strokeWeight = isSelected ? 4 : 2;
    const strokeColor = isSelected ? '#FFD700' : '#FFFFFF';
    
    return {
      path: 'M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z',
      fillColor: icon.color,
      fillOpacity: opacity,
      strokeColor: strokeColor,
      strokeWeight: strokeWeight,
      scale: scale,
      anchor: new google.maps.Point(12, 24),
      labelOrigin: new google.maps.Point(12, 10)
    };
  },
  
  // Add sport icon overlay on marker
  addSportIconOverlay: function(marker, sport) {
    const icon = SportIcons.getIcon(sport);
    
    // Create a label with emoji
    marker.setLabel({
      text: icon.emoji,
      fontSize: '16px',
      fontWeight: 'bold'
    });
  },
  
  // Show game information popup
  showGameInfo: function(marker, game) {
    // Update selected marker
    if (this.selectedMarker) {
      this.selectedMarker.setIcon(
        this.createCustomMarkerIcon(this.selectedMarker.game.type || 'other')
      );
    }
    
    this.selectedMarker = marker;
    marker.setIcon(
      this.createCustomMarkerIcon(game.type || game.sport || 'other', false, true)
    );
    
    const icon = SportIcons.getIcon(game.type || game.sport);
    const attendeesText = game.attendees !== undefined ?
      `${game.attendees}/${game.maxAttendees || 20} players` :
      'Open game';
    
    const timeStr = game.startTime ?
      new Date(game.startTime).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }) :
      'Time TBD';
    
    const content = `
      <div class="game-info-window" style="min-width: 280px; max-width: 350px;">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          ${SportIcons.createInlineSVG(game.type || game.sport, 32)}
          <h3 style="margin: 0 0 0 12px; color: ${icon.color}; font-size: 18px;">
            ${game.title || icon.name}
          </h3>
        </div>
        
        <div style="color: #333; line-height: 1.6;">
          <div style="margin-bottom: 8px;">
            <strong>📍 Location:</strong> ${game.venue?.name || game.location || 'Unknown venue'}
          </div>
          
          <div style="margin-bottom: 8px;">
            <strong>🕒 Time:</strong> ${timeStr}
          </div>
          
          <div style="margin-bottom: 8px;">
            <strong>👥 Players:</strong> ${attendeesText}
            <div style="margin-top: 4px;">
              <div style="background: #e0e0e0; height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: ${icon.color}; height: 100%; width: ${(game.attendees / (game.maxAttendees || 20)) * 100}%; transition: width 0.3s;"></div>
              </div>
            </div>
          </div>
          
          ${game.skillLevel ? `
            <div style="margin-bottom: 8px;">
              <strong>🎯 Skill Level:</strong> ${game.skillLevel}
            </div>
          ` : ''}
          
          ${game.description ? `
            <div style="margin-bottom: 12px; padding: 8px; background: #f5f5f5; border-radius: 4px;">
              <strong>Description:</strong><br/>
              ${game.description}
            </div>
          ` : ''}
          
          ${game.host ? `
            <div style="margin-bottom: 8px; font-size: 14px; color: #666;">
              <strong>Host:</strong> ${game.host}
            </div>
          ` : ''}
        </div>
        
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button onclick="window.joinGame('${game.id}')" 
                  style="flex: 1; padding: 10px; background: ${icon.color}; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
            Join Game
          </button>
          <button onclick="window.showGameDetails('${game.id}')" 
                  style="flex: 1; padding: 10px; background: white; color: ${icon.color}; border: 2px solid ${icon.color}; border-radius: 4px; cursor: pointer; font-weight: 500;">
            View Details
          </button>
        </div>
      </div>
    `;
    
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, marker);
    
    // Animate marker
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(() => marker.setAnimation(null), 1500);
  },
  
  // Clear all markers
  clearMarkers: function() {
    this.markers.forEach(marker => {
      marker.setMap(null);
    });
    this.markers = [];
    
    if (this.markerClusterer) {
      this.markerClusterer.clearMarkers();
    }
    
    this.selectedMarker = null;
  },
  
  // Filter markers by sport type
  filterBySport: function(sport) {
    this.markers.forEach(marker => {
      const markerSport = marker.game.type || marker.game.sport || 'other';
      const isVisible = !sport || sport === 'all' || markerSport === sport;
      marker.setVisible(isVisible);
    });
    
    if (this.markerClusterer) {
      this.markerClusterer.repaint();
    }
  },
  
  // Add map legend
  addMapLegend: function() {
    const legend = SportIcons.createMapLegend();
    legend.style.position = 'absolute';
    legend.style.bottom = '20px';
    legend.style.right = '20px';
    legend.style.zIndex = '1000';
    
    this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
  },
  
  // Highlight marker for a specific game
  highlightGameMarker: function(gameId) {
    const marker = this.markers.find(m => m.game.id === gameId);
    if (marker) {
      this.map.panTo(marker.getPosition());
      this.map.setZoom(16);
      google.maps.event.trigger(marker, 'click');
    }
  },
  
  // Get bounds of all markers
  getMarkerBounds: function() {
    if (this.markers.length === 0) return null;
    
    const bounds = new google.maps.LatLngBounds();
    this.markers.forEach(marker => {
      if (marker.getVisible()) {
        bounds.extend(marker.getPosition());
      }
    });
    
    return bounds;
  },
  
  // Fit map to show all visible markers
  fitToMarkers: function() {
    const bounds = this.getMarkerBounds();
    if (bounds) {
      this.map.fitBounds(bounds);
      
      // Don't zoom in too much
      const listener = google.maps.event.addListener(this.map, 'idle', () => {
        if (this.map.getZoom() > 16) this.map.setZoom(16);
        google.maps.event.removeListener(listener);
      });
    }
  }
};

// Extend the existing Google Maps module
if (window.googleMapsModule) {
  window.googleMapsModule.sportMarkers = SportMapMarkers;
}

// Export for use
window.SportMapMarkers = SportMapMarkers;

// Auto-initialize when map is ready
if (window.googleMap) {
  SportMapMarkers.init(window.googleMap);
}

console.log('Sport Map Markers module loaded');