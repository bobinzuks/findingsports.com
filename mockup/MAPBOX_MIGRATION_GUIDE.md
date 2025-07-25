# Mapbox Migration Guide

## Overview
This guide documents the migration from Google Maps to Mapbox GL JS for the Finding Sports application.

## Migration Status
- ✅ Mapbox GL JS installed
- ✅ Mapbox configuration created
- ✅ Mapbox implementation created
- ✅ Server endpoint updated to serve Mapbox token
- ✅ Map initialization wrapper created
- ⚠️ Google Maps references still exist (for backwards compatibility)

## Configuration

### 1. Set Mapbox Access Token
Add your Mapbox access token to the environment variables:

```bash
# In .env file (copy from .env.example)
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

### 2. Switch Map Provider
In `/mockup/js/map-init.js`, change the provider:

```javascript
window.MAP_PROVIDER = 'mapbox'; // Change from 'google' to 'mapbox'
```

## File Changes

### New Files Created
- `/mockup/js/mapbox-config.js` - Mapbox configuration
- `/mockup/js/mapbox-maps.js` - Mapbox implementation
- `/mockup/js/map-init.js` - Unified map initialization
- `/mockup/.env.example` - Environment variables template
- `/mockup/MAPBOX_MIGRATION_GUIDE.md` - This guide

### Modified Files
- `/mockup/index.html` - Removed Google Maps script, added Mapbox scripts
- `/mockup/backend/server.js` - Updated /api/config endpoint to serve Mapbox token
- `/mockup/backend/package.json` - Added mapbox-gl and @types/mapbox-gl

### Files to Remove (after full migration)
- `/mockup/js/google-maps.js`
- `/mockup/js/google-maps-enhanced.js`
- `/mockup/js/google-maps-fix.js`
- `/mockup/js/play-now-maps.js` (Google Maps specific)
- All other Google Maps related files

## Features Comparison

### Google Maps Features → Mapbox Equivalents
- **Dark mode styling** → Mapbox dark-v11 style
- **Custom markers** → Mapbox custom HTML markers
- **Info windows** → Mapbox popups
- **User location** → Mapbox GeolocateControl
- **Map controls** → Mapbox NavigationControl, ScaleControl, FullscreenControl
- **Marker clustering** → Can be added with mapbox-gl-js-marker-cluster plugin

## API Differences

### Coordinates
- Google Maps: `{lat: 49.2827, lng: -123.1207}`
- Mapbox: `[-123.1207, 49.2827]` (lng, lat order)

### Map Initialization
```javascript
// Google Maps
new google.maps.Map(element, {
  center: {lat: 49.2827, lng: -123.1207},
  zoom: 12
});

// Mapbox
new mapboxgl.Map({
  container: element,
  center: [-123.1207, 49.2827],
  zoom: 12
});
```

### Markers
```javascript
// Google Maps
new google.maps.Marker({
  position: {lat: 49.2827, lng: -123.1207},
  map: map,
  title: 'Title'
});

// Mapbox
new mapboxgl.Marker()
  .setLngLat([-123.1207, 49.2827])
  .setPopup(new mapboxgl.Popup().setHTML('<h3>Title</h3>'))
  .addTo(map);
```

## Testing Checklist
- [ ] Map loads correctly
- [ ] User location detection works
- [ ] Game markers display properly
- [ ] Popups show game information
- [ ] Map controls function correctly
- [ ] Dark mode switching works
- [ ] Play Now feature works with new maps
- [ ] Mobile responsive behavior

## Rollback Plan
If issues occur, you can quickly rollback:
1. Change `window.MAP_PROVIDER = 'google';` in map-init.js
2. Ensure Google Maps API key is still set in environment

## Benefits of Mapbox
1. **No API key restrictions** - More flexible usage limits
2. **Better performance** - Vector tiles are faster
3. **More customization** - Full control over map styles
4. **Open source friendly** - Based on open standards
5. **Better mobile support** - Optimized for touch devices
6. **Cost effective** - More generous free tier

## Next Steps
1. Get Mapbox access token from https://account.mapbox.com/
2. Set token in environment variables
3. Test all map features
4. Remove Google Maps code after successful testing
5. Update documentation

## Support
- Mapbox Documentation: https://docs.mapbox.com/mapbox-gl-js/
- Mapbox Examples: https://docs.mapbox.com/mapbox-gl-js/examples/
- Migration Guide: https://docs.mapbox.com/help/tutorials/google-to-mapbox/