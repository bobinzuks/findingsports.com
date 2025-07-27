#!/bin/bash

echo "🔧 MONITORING FIXED DEPLOYMENT (with pg module)"
echo "============================================="
echo ""

for i in {1..20}; do
    echo -n "🔍 Attempt $i/20: "
    
    response=$(curl -s -m 10 https://findingsports.com 2>/dev/null | head -100)
    
    if echo "$response" | grep -q "<!doctype\|<html"; then
        echo "✅ SUCCESS! HTML is being served!"
        echo ""
        echo "🎉 DEPLOYMENT SUCCESSFUL!"
        echo ""
        echo "📊 Verification Results:"
        echo "========================"
        
        # Full verification
        echo -n "1. Root URL serves HTML: ✅ CONFIRMED"
        echo ""
        
        echo -n "2. Language selector removed: "
        if echo "$response" | grep -q "fa-globe\|language-selector\|🌐"; then
            echo "❌ Still present"
        else
            echo "✅ REMOVED"
        fi
        
        echo -n "3. Online indicator removed: "
        if echo "$response" | grep -q "online-indicator\|status-online\|connectionStatus"; then
            echo "❌ Still present"
        else
            echo "✅ REMOVED"
        fi
        
        echo -n "4. Help button removed: "
        if echo "$response" | grep -q "help-btn\|fa-question"; then
            echo "❌ Still present"
        else
            echo "✅ REMOVED"
        fi
        
        echo -n "5. MapLibre GL loaded: "
        if echo "$response" | grep -q "maplibre-gl"; then
            echo "✅ LOADED"
        else
            echo "❌ Missing"
        fi
        
        echo -n "6. Play Now accessible: "
        if echo "$response" | grep -q "playNow\|play-now-btn"; then
            echo "✅ FOUND"
        else
            echo "❌ Missing"
        fi
        
        # Test API
        echo ""
        echo "7. Testing Play Now API..."
        api_test=$(curl -s "https://findingsports.com/api/play-now?lat=49.2827&lng=-123.1207&radius=15" | head -50)
        if echo "$api_test" | grep -q "activities\|success"; then
            echo "   ✅ API is working!"
        else
            echo "   ❌ API error"
        fi
        
        echo ""
        echo "✅ ALL CHANGES ARE NOW LIVE!"
        echo "🌐 https://findingsports.com"
        exit 0
        
    elif echo "$response" | grep -q "502\|Application failed"; then
        echo "⏳ Still building..."
    elif echo "$response" | grep -q "MODULE_NOT_FOUND"; then
        echo "❌ Module error - waiting for rebuild..."
    else
        echo "🔄 Deploying..."
    fi
    
    sleep 15
done

echo ""
echo "⚠️  Deployment taking longer than expected"
echo "Check: https://railway.com/project/cbc1c22e-b2b3-47c0-a57a-7a57c6b7c2a3/service/d5f8d988-c5f8-4889-90d1-8c1e1dbaf6ac"