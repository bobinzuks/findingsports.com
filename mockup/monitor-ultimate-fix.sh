#!/bin/bash

echo "🔍 Monitoring MapLibre Ultimate Fix..."
echo "======================================="
echo ""

# Check if the server is running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Server is running on port 3001"
else
    echo "❌ Server is NOT running on port 3001"
    echo "   Start it with: cd mockup && npm start"
fi

echo ""
echo "📝 Recent changes:"
echo "-----------------"
echo "1. Created maplibre-unified-fix.js - Single source of truth for map initialization"
echo "2. Removed conflicting map scripts from index.html"
echo "3. Added proper CSS loading and WebGL detection"
echo "4. Implemented retry logic with visual feedback"
echo "5. Added loading states and error handling"

echo ""
echo "🎯 Key features of the fix:"
echo "-------------------------"
echo "✓ Ensures MapLibre CSS is loaded before initialization"
echo "✓ Adds critical inline styles for proper rendering"
echo "✓ Checks WebGL support before attempting to create map"
echo "✓ Prevents multiple simultaneous initialization attempts"
echo "✓ Provides clear error messages and retry buttons"
echo "✓ Automatically initializes both main map and Play Now map"
echo "✓ Adds sample markers to verify map is working"

echo ""
echo "🧪 Testing steps:"
echo "----------------"
echo "1. Open http://localhost:3001 in your browser"
echo "2. Check if the main map loads with OpenStreetMap tiles"
echo "3. Click 'Play Now' button and verify the Play Now map loads"
echo "4. Look for game markers on both maps"
echo "5. Check browser console for any errors"

echo ""
echo "🔧 Debugging commands:"
echo "--------------------"
echo "In browser console:"
echo "  window.mapLibreUnified.checkMaps()     // Check and fix all maps"
echo "  window.mapLibreUnified.retry('map')    // Retry main map"
echo "  window.mapLibreUnified.getMap()        // Get map instance"
echo "  window._mapLibreState                  // Check initialization state"

echo ""
echo "📊 Files modified:"
echo "-----------------"
ls -la mockup/js/maplibre-unified-fix.js 2>/dev/null && echo "✓ maplibre-unified-fix.js created"
echo ""

echo "🚀 The map should now:"
echo "--------------------"
echo "1. Show OpenStreetMap tiles instead of gray background"
echo "2. Display navigation controls in top-right"
echo "3. Show sample game markers with popups"
echo "4. Have geolocation button that centers on user"
echo "5. Load reliably on both main page and Play Now view"

echo ""
echo "If the map is still gray, check:"
echo "-------------------------------"
echo "1. Browser console for errors (F12)"
echo "2. Network tab to ensure tiles are loading"
echo "3. That WebGL is enabled in your browser"
echo "4. Try hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"

echo ""
echo "✨ Done! The unified fix should resolve the gray box issue."