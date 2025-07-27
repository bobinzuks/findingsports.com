#!/bin/bash

echo "🚨 MONITORING HOTFIX DEPLOYMENT"
echo "==============================="
echo ""

start_time=$(date +%s)

while true; do
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    echo -n "[$(date +%H:%M:%S)] Checking (${elapsed}s elapsed)... "
    
    response=$(curl -s -m 5 https://findingsports.com 2>/dev/null)
    
    if echo "$response" | grep -q "<!doctype\|<!DOCTYPE\|<html"; then
        echo "✅ SUCCESS! HTML IS BEING SERVED!"
        echo ""
        echo "🎉 🎉 🎉 DEPLOYMENT SUCCESSFUL! 🎉 🎉 🎉"
        echo ""
        echo "📊 FINAL VERIFICATION:"
        echo "===================="
        
        # Save response for analysis
        echo "$response" > /tmp/site-response.html
        
        # Check all requirements
        echo "✅ 1. Root URL serves HTML (not JSON)"
        
        if grep -q "fa-globe\|language-selector\|🌐" /tmp/site-response.html; then
            echo "❌ 2. Language selector: STILL PRESENT"
        else
            echo "✅ 2. Language selector: REMOVED"
        fi
        
        if grep -q "online-indicator\|status-online\|connectionStatus" /tmp/site-response.html; then
            echo "❌ 3. Online indicator: STILL PRESENT"
        else
            echo "✅ 3. Online indicator: REMOVED"
        fi
        
        if grep -q "help-btn\|fa-question-circle\|help.*button" /tmp/site-response.html; then
            echo "❌ 4. Help button: STILL PRESENT"
        else
            echo "✅ 4. Help button: REMOVED"
        fi
        
        if grep -q "maplibre-gl" /tmp/site-response.html; then
            echo "✅ 5. MapLibre GL: LOADED"
        else
            echo "❌ 5. MapLibre GL: NOT FOUND"
        fi
        
        if grep -q "playNow\|play-now" /tmp/site-response.html; then
            echo "✅ 6. Play Now button: FOUND"
        else
            echo "❌ 6. Play Now button: NOT FOUND"
        fi
        
        # Test API
        echo ""
        echo "Testing Play Now API..."
        api_response=$(curl -s "https://findingsports.com/api/play-now?lat=49.2827&lng=-123.1207&radius=15")
        if echo "$api_response" | grep -q "activities\|success"; then
            echo "✅ 7. Play Now API: WORKING"
        else
            echo "❌ 7. Play Now API: FAILED"
            echo "   Response: ${api_response:0:100}..."
        fi
        
        echo ""
        echo "🌐 Site is live at: https://findingsports.com"
        echo "✅ Deployment completed in ${elapsed} seconds"
        
        rm -f /tmp/site-response.html
        exit 0
        
    elif echo "$response" | grep -q "502\|Application failed"; then
        echo "⏳ Building..."
    elif echo "$response" | grep -q "MODULE_NOT_FOUND"; then
        echo "❌ Module error"
    elif [ -z "$response" ]; then
        echo "🔄 No response"
    else
        echo "📦 Deploying..."
    fi
    
    if [ $elapsed -gt 300 ]; then
        echo ""
        echo "⚠️ Deployment taking too long (>5 minutes)"
        echo "Check: https://railway.com/project/cbc1c22e-b2b3-47c0-a57a-7a57c6b7c2a3"
        exit 1
    fi
    
    sleep 5
done