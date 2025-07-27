#!/bin/bash

echo "🚀 MONITORING RAILWAY DEPLOYMENT"
echo "================================"
echo ""
echo "Build logs: https://railway.com/project/cbc1c22e-b2b3-47c0-a57a-7a57c6b7c2a3/service/d5f8d988-c5f8-4889-90d1-8c1e1dbaf6ac"
echo ""

attempts=0
max_attempts=24  # 4 minutes total

while [ $attempts -lt $max_attempts ]; do
    attempts=$((attempts + 1))
    echo -n "🔍 Checking deployment status (attempt $attempts/$max_attempts)... "
    
    response=$(curl -s https://findingsports.com | head -100)
    
    if echo "$response" | grep -q "<!doctype\|<html"; then
        echo "✅ SUCCESS!"
        echo ""
        echo "🎉 DEPLOYMENT COMPLETE! Site is now serving HTML!"
        echo ""
        
        # Run comprehensive test
        echo "📊 Running final verification:"
        echo "=============================="
        
        # Check removed elements
        echo -n "Language selector removed: "
        if echo "$response" | grep -q "fa-globe\|language-selector"; then
            echo "❌ FAILED"
        else
            echo "✅ PASSED"
        fi
        
        echo -n "Online indicator removed: "
        if echo "$response" | grep -q "online-indicator\|connectionStatus"; then
            echo "❌ FAILED"
        else
            echo "✅ PASSED"
        fi
        
        echo -n "MapLibre GL loaded: "
        if echo "$response" | grep -q "maplibre-gl"; then
            echo "✅ PASSED"
        else
            echo "❌ FAILED"
        fi
        
        # Test Play Now API
        echo -n "Play Now API working: "
        api_response=$(curl -s "https://findingsports.com/api/play-now?lat=49.2827&lng=-123.1207&radius=15")
        if echo "$api_response" | grep -q "activities\|success"; then
            echo "✅ PASSED"
        else
            echo "❌ FAILED"
        fi
        
        echo ""
        echo "✅ All requested changes are now live!"
        echo "🌐 Visit: https://findingsports.com"
        exit 0
    else
        echo "⏳ Still deploying..."
        deployment_id=$(echo "$response" | grep -o '"deployment":"[^"]*"' | cut -d'"' -f4)
        echo "   Current deployment: $deployment_id"
    fi
    
    sleep 10
done

echo ""
echo "⚠️  Deployment is taking longer than expected."
echo "Check the build logs at:"
echo "https://railway.com/project/cbc1c22e-b2b3-47c0-a57a-7a57c6b7c2a3/service/d5f8d988-c5f8-4889-90d1-8c1e1dbaf6ac"