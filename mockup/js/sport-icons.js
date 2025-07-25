// Sport Icons Module - Custom SVG icons for each sport type
// This module provides consistent, scalable sport icons for map markers and UI components

const SportIcons = {
  // Sport icon definitions with SVG paths
  icons: {
    basketball: {
      name: 'Basketball',
      color: '#FF6B35',
      svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 2.07v3.93h-3.93C7.71 5.71 9.16 4.26 11 4.07zM7 12H4.07C4.26 9.16 5.71 7.71 8 7.07V10h3v2H7zm1 5.93C5.71 16.29 4.26 14.84 4.07 12H7v3h1v2.93zM11 20h-1v-3H7v-3h4v6zm5.93 0C16.29 18.29 14.84 16.84 13 16.71V13h3v4h.93v3zM20 12h-3v-2h-4V7h3.07c2.29 1.64 3.74 3.09 3.93 5zM13 7.07V4.14c1.84.19 3.29 1.64 3.93 3.93H13z',
      viewBox: '0 0 24 24',
      emoji: '🏀'
    },
    soccer: {
      name: 'Soccer',
      color: '#4CAF50',
      svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c.55 0 1.09.06 1.61.16l-1.12 1.94L10.5 6l-1.12-1.94C9.91 4.06 10.45 4 11 4h1zm-5.84 2.16l2.2.92L9.5 9l-1.93.81-2.2-.92c.64-.82 1.43-1.51 2.34-2.01l.45.28zM4.16 9.61l1.94 1.12-.1 2.49-1.94 1.12C4.06 13.91 4 13.45 4 13v-1c0-.55.06-1.09.16-1.61v.22zm2.73 6.23l.92-2.2 1.93.81.81 1.93-.92 2.2c-.82-.64-1.51-1.43-2.01-2.34l.27-.4zm6.61 3.56l-1.12-1.94 1.5-1.5 1.5 1.5-1.12 1.94c-.53.1-1.07.16-1.61.16h-.15v-.16zm4.34-2.16l-2.2-.92-.81-1.93 1.93-.81 2.2.92c-.64.82-1.43 1.51-2.34 2.01l1.22.73zm2-3.63l-1.94-1.12.1-2.49 1.94-1.12c.1.52.16 1.06.16 1.61v1c0 .55-.06 1.09-.16 1.61l-.1.51z',
      viewBox: '0 0 24 24',
      emoji: '⚽'
    },
    baseball: {
      name: 'Baseball',
      color: '#E91E63',
      svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM5.61 8.39c.48-.84 1.1-1.57 1.82-2.17-.08.35-.17.71-.24 1.08-.16.8-.29 1.63-.36 2.48-.51-.49-.9-1.07-1.17-1.72l-.05.33zm2.17 6.56c.07.85.2 1.68.36 2.48.07.37.16.73.24 1.08-.72-.6-1.34-1.33-1.82-2.17l.05.33c.27-.65.66-1.23 1.17-1.72zm8.61 3.44c-.48.84-1.1 1.57-1.82 2.17.08-.35.17-.71.24-1.08.16-.8.29-1.63.36-2.48.51.49.9 1.07 1.17 1.72l.05-.33zm-2.17-6.56c-.07-.85-.2-1.68-.36-2.48-.07-.37-.16-.73-.24-1.08.72.6 1.34 1.33 1.82 2.17l-.05-.33c-.27.65-.66 1.23-1.17 1.72z',
      viewBox: '0 0 24 24',
      emoji: '⚾'
    },
    tennis: {
      name: 'Tennis',
      color: '#9C27B0',
      svgPath: 'M19.52 2.49c-2.34-2.34-6.13-2.34-8.47 0-1.45 1.45-2.02 3.51-1.7 5.48l-6.86 6.86c-.62.62-.62 1.64 0 2.26l2.42 2.42c.62.62 1.64.62 2.26 0l6.86-6.86c1.97.32 4.03-.25 5.48-1.7 2.35-2.34 2.35-6.12.01-8.46zM7.17 16.58l-2.42-2.42 5.08-5.08c.28.84.69 1.64 1.24 2.36l.16.22.22.16c.72.55 1.52.96 2.36 1.24l-5.08 5.08-1.56-1.56zm10.7-6.19c-.85.85-1.99 1.23-3.11 1.14l-.38-.03-.41-.11c-.69-.18-1.33-.52-1.86-1.05s-.87-1.17-1.05-1.86l-.11-.41-.03-.38c-.09-1.12.29-2.26 1.14-3.11 1.17-1.17 3.07-1.17 4.24 0 1.18 1.17 1.18 3.07.01 4.24l-.44-.43z',
      viewBox: '0 0 24 24',
      emoji: '🎾'
    },
    volleyball: {
      name: 'Volleyball',
      color: '#2196F3',
      svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.19 0 2.32.26 3.34.73l-1.37 2.37c-.61-.21-1.27-.32-1.97-.32s-1.36.11-1.97.32L8.66 4.73C9.68 4.26 10.81 4 12 4zm-6.4 3.2l2.37 1.37c-.44.7-.73 1.5-.84 2.37L4.27 10.1c.36-1.25.94-2.39 1.73-3.4l.6.5zM4 12c0-.41.04-.82.1-1.21l2.87.83c-.02.13-.03.25-.03.38 0 .7.11 1.36.32 1.97L4.89 15.34C4.36 14.26 4 13.17 4 12zm1.73 4.4c-.79-1.01-1.37-2.15-1.73-3.4l2.86-.83c.11.87.4 1.67.84 2.37L5.33 15.9l.4.5zm3.87 2.23L8.24 16.26c.61.44 1.3.73 2.04.84l.83 2.86c-1.25-.36-2.39-.94-3.4-1.73l.89.4zm6.51 1.33l-.83-2.86c.74-.11 1.43-.4 2.04-.84l1.37 2.37c-1.01.79-2.15 1.37-3.4 1.73l.82-.4zm4.16-4.62l-2.37-1.37c.21-.61.32-1.27.32-1.97 0-.13-.01-.25-.03-.38l2.87-.83c.06.39.1.78.1 1.21 0 1.17-.36 2.26-.89 3.34zm-.54-6.24l-2.86.83c-.11-.87-.4-1.67-.84-2.37l2.37-1.37c.79 1.01 1.37 2.15 1.73 3.4l-.4-.49z',
      viewBox: '0 0 24 24',
      emoji: '🏐'
    },
    hockey: {
      name: 'Hockey',
      color: '#00BCD4',
      svgPath: 'M17.68 4.15c-.29-.58-.87-.92-1.49-.92-.36 0-.72.11-1.03.33L6.91 8.51c-.61.44-.78 1.28-.34 1.89l.48.68 7.45-5.35c.19-.14.44-.14.63.01.19.14.23.41.09.6l-6.77 8.93c-.14.19-.14.44.01.63.14.19.41.23.6.09l8.93-6.77c.38-.29.46-.82.17-1.2l-1.48-1.87zM2 17v3c0 .55.45 1 1 1h3.5c.55 0 1.07-.22 1.46-.61l5.58-5.58-2.53-2.53-5.58 5.58c-.18.18-.42.28-.68.28H3.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h1.43l3.01-3.01-1.41-1.41-3.5 3.5c-.39.39-.61.91-.61 1.46V17H2zm19.5 0h-4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1zm-.5 4h-3v-3h3v3z',
      viewBox: '0 0 24 24',
      emoji: '🏒'
    },
    golf: {
      name: 'Golf',
      color: '#607D8B',
      svgPath: 'M12 16c3.87 0 7-1.79 7-4s-3.13-4-7-4-7 1.79-7 4 3.13 4 7 4zm0-6c2.21 0 4 .9 4 2s-1.79 2-4 2-4-.9-4-2 1.79-2 4-2zm0-8c-.28 0-.5.22-.5.5v14.77c-.74-.15-1.5-.27-2.5-.27-2 0-3 .5-3 .5v1s1-.5 3-.5 3 .5 3 .5v1.5c0 .28.22.5.5.5s.5-.22.5-.5V2.5c0-.28-.22-.5-.5-.5z',
      viewBox: '0 0 24 24',
      emoji: '⛳'
    },
    swimming: {
      name: 'Swimming',
      color: '#00ACC1',
      svgPath: 'M13.32 7.32c1.84 1.84 1.84 4.84 0 6.68l-.88-.88c1.36-1.36 1.36-3.56 0-4.92l.88-.88zM7.68 1.68c1.84-1.84 4.84-1.84 6.68 0l-.88.88c-1.36-1.36-3.56-1.36-4.92 0l-.88-.88zM21 12.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm-18 0c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm15 1c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zM6 13.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm6 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm8.5 3c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm-17 0c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm12 1c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-6 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z',
      viewBox: '0 0 24 24',
      emoji: '🏊'
    },
    running: {
      name: 'Running',
      color: '#FF5722',
      svgPath: 'M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z',
      viewBox: '0 0 24 24',
      emoji: '🏃'
    },
    cycling: {
      name: 'Cycling',
      color: '#795548',
      svgPath: 'M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.5 8.9c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 15v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z',
      viewBox: '0 0 24 24',
      emoji: '🚴'
    },
    fitness: {
      name: 'Fitness',
      color: '#FF9800',
      svgPath: 'M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z',
      viewBox: '0 0 24 24',
      emoji: '💪'
    },
    yoga: {
      name: 'Yoga',
      color: '#9E9E9E',
      svgPath: 'M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM9 7c0-.55.45-1 1-1h4c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1s-1-.45-1-1v-3h-2v3c0 .55-.45 1-1 1s-1-.45-1-1V7zm-4 6c.55 0 1 .45 1 1v5c0 .55-.45 1-1 1s-1-.45-1-1v-5c0-.55.45-1 1-1zm14 0c.55 0 1 .45 1 1v5c0 .55-.45 1-1 1s-1-.45-1-1v-5c0-.55.45-1 1-1z',
      viewBox: '0 0 24 24',
      emoji: '🧘'
    },
    badminton: {
      name: 'Badminton',
      color: '#8BC34A',
      svgPath: 'M12.3 2L6.5 11.8l1.7 1.7 5.8-5.8v-.7l-.3-.3-1.4-1.4-.3-.3h-.7zm3.5 1.5l-1.5 1.5 3.2 3.2 1.5-1.5c.4-.4.4-1 0-1.4l-1.8-1.8c-.4-.4-1-.4-1.4 0zM11.3 8L7.8 11.5l3.5 3.5 3.5-3.5L11.3 8zm-4.8 5.2l-1.7 1.7L2 17.7V22h4.3l2.8-2.8-1.7-1.7L5 20h-.5v-.5l2-2.3zm8 1.3l-3 3L14 20l1.5-1.5-1-1z',
      viewBox: '0 0 24 24',
      emoji: '🏸'
    },
    tabletennis: {
      name: 'Table Tennis',
      color: '#FFC107',
      svgPath: 'M18.3 5.7c-.4-.4-1-.4-1.4 0L14 8.6 11.1 5.7c-.2-.2-.5-.3-.7-.3s-.5.1-.7.3L2.3 13c-.4.4-.4 1 0 1.4l5.5 5.5c.2.2.4.3.7.3s.5-.1.7-.3l7.3-7.3c.2-.2.3-.4.3-.7s-.1-.5-.3-.7L13.6 9l2.9-2.9c.4-.4.4-1 0-1.4zM8.5 17.5L4 13l6-6 2.2 2.2L7.7 13.7c-.4.4-.4 1 0 1.4s1 .4 1.4 0l4.5-4.5L15.8 13l-7.3 7.5zm11-7c-1.9 0-3.5 1.6-3.5 3.5s1.6 3.5 3.5 3.5 3.5-1.6 3.5-3.5-1.6-3.5-3.5-3.5zm0 5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z',
      viewBox: '0 0 24 24',
      emoji: '🏓'
    },
    cricket: {
      name: 'Cricket',
      color: '#3F51B5',
      svgPath: 'M14.4 4.3l1.4 1.4-7.1 7.1-1.4-1.4 7.1-7.1zm2.8-2.8c-.4-.4-1-.4-1.4 0l-1.4 1.4 2.8 2.8 1.4-1.4c.4-.4.4-1 0-1.4l-1.4-1.4zM4 15l-2 7 7-2-5-5zm12.7 4.7c-1.8 1.8-4.7 1.8-6.5 0l6.5-6.5c1.8 1.8 1.8 4.7 0 6.5z',
      viewBox: '0 0 24 24',
      emoji: '🏏'
    },
    other: {
      name: 'Other Sport',
      color: '#757575',
      svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
      viewBox: '0 0 24 24',
      emoji: '🎯'
    }
  },

  // Get icon for a specific sport
  getIcon: function(sport) {
    const normalizedSport = sport?.toLowerCase().replace(/\s+/g, '') || 'other';
    return this.icons[normalizedSport] || this.icons.other;
  },

  // Create SVG element for a sport
  createSVG: function(sport, size = 24, className = '') {
    const icon = this.getIcon(sport);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', icon.viewBox);
    svg.setAttribute('fill', icon.color);
    if (className) svg.setAttribute('class', className);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', icon.svgPath);
    svg.appendChild(path);

    return svg;
  },

  // Create inline SVG string for use in HTML
  createInlineSVG: function(sport, size = 24, color = null) {
    const icon = this.getIcon(sport);
    const fillColor = color || icon.color;
    
    return `<svg width="${size}" height="${size}" viewBox="${icon.viewBox}" fill="${fillColor}" xmlns="http://www.w3.org/2000/svg">
      <path d="${icon.svgPath}"/>
    </svg>`;
  },

  // Create Google Maps marker icon
  createMapMarkerIcon: function(sport, isHovered = false, isSelected = false) {
    const icon = this.getIcon(sport);
    const scale = isHovered ? 1.2 : 1;
    const strokeWeight = isSelected ? 3 : 2;
    const strokeColor = isSelected ? '#FFD700' : '#FFFFFF';
    
    // Create custom marker with sport icon
    return {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
      fillColor: icon.color,
      fillOpacity: 0.9,
      strokeColor: strokeColor,
      strokeWeight: strokeWeight,
      scale: scale,
      anchor: new google.maps.Point(12, 24),
      labelOrigin: new google.maps.Point(12, 9)
    };
  },

  // Create marker with sport icon overlay for better visibility
  createAdvancedMapMarker: function(sport, position, map) {
    const icon = this.getIcon(sport);
    
    // Create the base marker
    const marker = new google.maps.Marker({
      position: position,
      map: map,
      icon: this.createMapMarkerIcon(sport),
      title: icon.name,
      animation: google.maps.Animation.DROP
    });

    // Create custom overlay for sport icon
    const SportIconOverlay = function(position, sport, map) {
      this.position = position;
      this.sport = sport;
      this.setMap(map);
    };

    SportIconOverlay.prototype = new google.maps.OverlayView();

    SportIconOverlay.prototype.onAdd = function() {
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.width = '20px';
      div.style.height = '20px';
      div.style.pointerEvents = 'none';
      div.innerHTML = SportIcons.createInlineSVG(this.sport, 20, '#FFFFFF');
      
      this.div = div;
      const panes = this.getPanes();
      panes.overlayMouseTarget.appendChild(div);
    };

    SportIconOverlay.prototype.draw = function() {
      const overlayProjection = this.getProjection();
      const pos = overlayProjection.fromLatLngToDivPixel(this.position);
      const div = this.div;
      div.style.left = (pos.x - 10) + 'px';
      div.style.top = (pos.y - 22) + 'px';
    };

    SportIconOverlay.prototype.onRemove = function() {
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    };

    // Add the overlay
    new SportIconOverlay(position, sport, map);

    return marker;
  },

  // Create marker cluster icon
  createClusterIcon: function(count, sports = []) {
    const size = Math.min(40 + (count / 10) * 10, 80);
    const fontSize = Math.min(14 + (count / 10) * 2, 24);
    
    // Get dominant sport color if sports array provided
    let backgroundColor = '#FF6B35'; // Default color
    if (sports.length > 0) {
      const sportCounts = {};
      sports.forEach(sport => {
        sportCounts[sport] = (sportCounts[sport] || 0) + 1;
      });
      const dominantSport = Object.keys(sportCounts).reduce((a, b) => 
        sportCounts[a] > sportCounts[b] ? a : b
      );
      backgroundColor = this.getIcon(dominantSport).color;
    }

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${backgroundColor}" fill-opacity="0.8" stroke="#FFFFFF" stroke-width="2"/>
          <text x="${size/2}" y="${size/2 + fontSize/3}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${count}</text>
        </svg>`
      ),
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size/2, size/2)
    };
  },

  // Get all sport types
  getAllSports: function() {
    return Object.keys(this.icons).map(key => ({
      id: key,
      ...this.icons[key]
    }));
  },

  // Create legend for map
  createMapLegend: function() {
    const legend = document.createElement('div');
    legend.className = 'map-legend';
    legend.innerHTML = '<div class="map-legend-title">Sport Types</div>';
    
    const sports = this.getAllSports().filter(s => s.id !== 'other');
    sports.forEach(sport => {
      const item = document.createElement('div');
      item.className = 'map-legend-item';
      item.innerHTML = `
        <span class="map-legend-icon">${this.createInlineSVG(sport.id, 16)}</span>
        <span class="map-legend-label">${sport.name}</span>
      `;
      legend.appendChild(item);
    });

    return legend;
  }
};

// Export for use in other modules
window.SportIcons = SportIcons;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Sport Icons module loaded with', Object.keys(SportIcons.icons).length, 'sport types');
});