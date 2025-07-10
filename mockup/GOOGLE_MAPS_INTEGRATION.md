# Google Maps Integration Guide for Finding Sports

## Overview
This document describes the Google Maps integration with dark theme styling for the Finding Sports application.

## Features
- ✅ Google Maps JavaScript API integration
- ✅ Dark theme styling matching the website aesthetic
- ✅ Custom sport-colored markers
- ✅ User location tracking with pulse animation
- ✅ Info windows with game details
- ✅ Automatic fallback to Leaflet maps if Google Maps fails
- ✅ Responsive map controls

## Implementation Files

### Core Files
1. **`js/google-maps.js`** - Main Google Maps implementation
   - Dark theme styles configuration
   - Map initialization
   - Marker management
   - Info window handling

2. **`js/config.js`** - Configuration settings
   - API key management
   - Enable/disable map providers
   - Default map settings

3. **`css/styles.css`** - Map styling
   - Container styles
   - Control customization
   - Animation definitions

### Integration Points
- **`js/app.js`** - Map initialization logic with fallback
- **`js/play-now.js`** - Play Now page map integration
- **`js/drop-in-games.js`** - Drop-in games map integration

## Configuration

### API Key Setup
1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Maps JavaScript API"
3. Update the API key in one of these ways:
   ```javascript
   // Option 1: In js/config.js
   GOOGLE_MAPS_API_KEY: 'your-api-key-here'
   
   // Option 2: In index.html
   window.GOOGLE_MAPS_API_KEY = 'your-api-key-here';
   
   // Option 3: Environment variable (production)
   process.env.GOOGLE_MAPS_API_KEY
   ```

### Enable/Disable Maps
In `js/config.js`:
```javascript
window.APP_CONFIG = {
    ENABLE_GOOGLE_MAPS: true,        // Enable Google Maps
    ENABLE_LEAFLET_FALLBACK: true,   // Enable Leaflet as fallback
};
```

## Dark Theme Styles
The map uses a comprehensive dark theme that matches the Finding Sports aesthetic:
- Dark background colors (#212121, #000000)
- Muted text colors (#757575, #8a8a8a)
- Hidden unnecessary UI elements
- Custom styled controls with website colors

## Marker System

### Sport-Specific Colors
```javascript
const sportColors = {
    basketball: '#FF6B35',
    soccer: '#4CAF50',
    volleyball: '#2196F3',
    tennis: '#9C27B0',
    hockey: '#00BCD4',
    default: '#757575'
};
```

### Adding Markers
```javascript
// Add a game marker
window.addGoogleGameMarker({
    title: 'Basketball Game',
    type: 'basketball',
    coords: [49.2827, -123.1207],
    venue: { name: 'Community Center' },
    attendees: 8,
    maxAttendees: 10
});

// Clear all markers
window.clearGoogleMarkers();

// Fit map to show all markers
window.fitMapToMarkers();
```

## Testing
1. Open `test-google-maps.html` in a browser
2. Verify map loads with dark theme
3. Test marker addition/removal
4. Check info window styling
5. Verify user location marker

## Troubleshooting

### Map Not Loading
1. Check browser console for errors
2. Verify API key is valid
3. Ensure Maps JavaScript API is enabled
4. Check domain restrictions on API key

### Fallback to Leaflet
If Google Maps fails to load, the system automatically falls back to Leaflet maps with similar dark styling.

### Performance
- Map loads asynchronously to prevent blocking
- Markers are batched for better performance
- Only visible markers are rendered

## Security Notes
- **Never commit API keys to version control**
- Use environment variables in production
- Restrict API keys to specific domains
- Monitor usage in Google Cloud Console

## Browser Support
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Android)

## Future Enhancements
- [ ] Clustering for many markers
- [ ] Custom marker icons for different sports
- [ ] Route planning to venues
- [ ] Street View integration
- [ ] Heat maps for popular game locations