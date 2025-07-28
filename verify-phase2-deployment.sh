#!/bin/bash

echo "🔍 Verifying Railway deployment of Phase 2 fixes..."
echo "================================================"

# Wait for deployment (Railway typically takes 2-3 minutes)
echo "⏳ Waiting 3 minutes for Railway to deploy..."
sleep 180

# Check if the site is up
echo "🌐 Checking if site is accessible..."
response=$(curl -s -o /dev/null -w "%{http_code}" https://findingsports.com)

if [ "$response" = "200" ]; then
    echo "✅ Site is UP (HTTP 200)"
else
    echo "❌ Site returned HTTP $response"
fi

# Check for the remove-header-elements.js script
echo ""
echo "🔍 Checking for remove-header-elements.js..."
if curl -s https://findingsports.com/js/remove-header-elements.js | grep -q "Aggressive removal"; then
    echo "✅ remove-header-elements.js is deployed"
else
    echo "❌ remove-header-elements.js NOT found"
fi

# Check for map-init-fix.js
echo ""
echo "🔍 Checking for map-init-fix.js..."
if curl -s https://findingsports.com/js/map-init-fix.js | grep -q "Map initialization fix"; then
    echo "✅ map-init-fix.js is deployed"
else
    echo "❌ map-init-fix.js NOT found"
fi

# Check for the updated index.html with game display fix
echo ""
echo "🔍 Checking for games display fix..."
if curl -s https://findingsports.com | grep -q "All Available Games"; then
    echo "✅ Games display fix is deployed"
else
    echo "❌ Games display fix NOT found"
fi

# Check for the map container inline styles
echo ""
echo "🔍 Checking for map container fix..."
if curl -s https://findingsports.com | grep -q 'id="map".*style.*height.*500px'; then
    echo "✅ Map container fix is deployed"
else
    echo "❌ Map container fix NOT found"
fi

echo ""
echo "================================================"
echo "📊 Deployment Verification Complete!"
echo ""
echo "🔗 Live site: https://findingsports.com"
echo "📱 Please verify with screenshot testing for final confirmation"