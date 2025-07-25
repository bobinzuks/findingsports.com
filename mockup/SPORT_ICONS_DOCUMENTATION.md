# Sport Icons & Map Markers Documentation

## Overview

The Sport Icons system provides a comprehensive set of custom SVG icons and map markers for various sports in the Finding Sports application. This system enhances visual recognition and user experience across the platform.

## Features

### 1. Custom Sport Icons
- 15+ sport-specific SVG icons with optimized paths
- Consistent color scheme for each sport
- Scalable vector graphics for any size
- Emoji fallbacks for accessibility

### 2. Enhanced Map Markers
- Sport-specific custom markers for Google Maps
- Marker clustering for performance
- Interactive info windows with sport details
- Hover and selection animations
- User location indicator with pulse effect

### 3. UI Components
- Sport badges for game cards
- Filter buttons with sport icons
- Sport type selector dropdown
- Icon grid for sport selection

## Files Created

### JavaScript
- `js/sport-icons.js` - Core sport icons module
- `js/google-maps-sport-markers.js` - Enhanced map markers implementation

### CSS
- `css/sport-icons.css` - Styling for sport icons and related components

### Demo Pages
- `sport-icons-demo.html` - Interactive demo of all sport icons and map features
- `sport-game-cards-demo.html` - Game cards with integrated sport icons

## Supported Sports

| Sport | Icon Color | Emoji |
|-------|------------|-------|
| Basketball | #FF6B35 | 🏀 |
| Soccer | #4CAF50 | ⚽ |
| Baseball | #E91E63 | ⚾ |
| Tennis | #9C27B0 | 🎾 |
| Volleyball | #2196F3 | 🏐 |
| Hockey | #00BCD4 | 🏒 |
| Golf | #607D8B | ⛳ |
| Swimming | #00ACC1 | 🏊 |
| Running | #FF5722 | 🏃 |
| Cycling | #795548 | 🚴 |
| Fitness | #FF9800 | 💪 |
| Yoga | #9E9E9E | 🧘 |
| Badminton | #8BC34A | 🏸 |
| Table Tennis | #FFC107 | 🏓 |
| Cricket | #3F51B5 | 🏏 |
| Other | #757575 | 🎯 |

## Usage Examples

### Basic Icon Usage

```javascript
// Get icon SVG element
const basketballIcon = SportIcons.createSVG('basketball', 24);
document.getElementById('container').appendChild(basketballIcon);

// Get inline SVG string
const soccerSVG = SportIcons.createInlineSVG('soccer', 32, '#4CAF50');
element.innerHTML = soccerSVG;

// Get icon information
const tennisIcon = SportIcons.getIcon('tennis');
console.log(tennisIcon.name, tennisIcon.color, tennisIcon.emoji);
```

### Map Integration

```javascript
// Initialize sport markers on existing map
SportMapMarkers.init(googleMap);

// Add game marker
const gameData = {
    id: '123',
    type: 'basketball',
    title: 'Pickup Basketball Game',
    venue: { 
        name: 'Community Center',
        coordinates: { lat: 49.2827, lng: -123.1207 }
    },
    startTime: new Date('2024-01-20T18:00:00'),
    attendees: 8,
    maxAttendees: 12
};

SportMapMarkers.addGameMarker(gameData);

// Filter markers by sport
SportMapMarkers.filterBySport('basketball');

// Highlight specific game
SportMapMarkers.highlightGameMarker('123');
```

### UI Components

```html
<!-- Sport Badge -->
<span class="sport-badge sport-badge-basketball">
    <svg>...</svg> Basketball
</span>

<!-- Filter Button -->
<button class="sport-filter-btn filter-soccer">
    ⚽ Soccer
</button>

<!-- Game Card with Icon -->
<div class="game-card">
    <div class="game-card-sport-icon">
        <!-- Sport icon will be inserted here -->
    </div>
    <!-- Rest of game card content -->
</div>
```

## Integration Steps

1. **Add CSS and JS files to your HTML:**
```html
<!-- In <head> -->
<link rel="stylesheet" href="css/sport-icons.css">

<!-- Before closing </body> -->
<script src="js/sport-icons.js"></script>
<script src="js/google-maps-sport-markers.js"></script>
```

2. **Initialize after Google Maps loads:**
```javascript
// After Google Maps initialization
if (window.SportMapMarkers) {
    SportMapMarkers.init(googleMap);
}
```

3. **Use sport icons in your components:**
```javascript
// In game cards, filters, etc.
const icon = SportIcons.getIcon(game.sport);
const iconSVG = SportIcons.createInlineSVG(game.sport, 24);
```

## Customization

### Adding New Sports

Add new sport to the `SportIcons.icons` object:

```javascript
SportIcons.icons.rugby = {
    name: 'Rugby',
    color: '#006400',
    svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10...',
    viewBox: '0 0 24 24',
    emoji: '🏉'
};
```

### Customizing Colors

Override default colors when creating icons:

```javascript
// Custom color for specific use
const customIcon = SportIcons.createInlineSVG('basketball', 32, '#0000FF');
```

### Map Marker Styles

Customize marker appearance:

```javascript
// In google-maps-sport-markers.js
createCustomMarkerIcon: function(sport, isHovered, isSelected) {
    // Modify scale, colors, strokeWeight, etc.
}
```

## Performance Considerations

1. **Marker Clustering**: Automatically enabled for better performance with many markers
2. **SVG Optimization**: All icons use optimized paths for minimal file size
3. **Lazy Loading**: Sport icons are loaded on demand
4. **CSS Animations**: Hardware-accelerated transitions for smooth interactions

## Browser Support

- Modern browsers with SVG support
- Google Maps JavaScript API v3
- ES6+ JavaScript features (with fallbacks)

## Future Enhancements

- [ ] Animated sport icons
- [ ] 3D map markers
- [ ] Sport-specific sound effects
- [ ] Custom sport icon builder
- [ ] Sport popularity heat maps
- [ ] Real-time marker updates
- [ ] Weather-based icon modifications

## Troubleshooting

### Icons Not Showing
- Ensure `sport-icons.js` is loaded before using
- Check console for errors
- Verify sport name matches supported sports

### Map Markers Not Appearing
- Confirm Google Maps is initialized
- Check that `SportMapMarkers.init()` is called
- Verify game data has valid coordinates

### Performance Issues
- Enable marker clustering for many markers
- Reduce icon size for better performance
- Use `filterBySport()` to show fewer markers

## Credits

Created for Finding Sports by the Visual Design Implementation agent
Icons designed to be accessible, performant, and visually appealing