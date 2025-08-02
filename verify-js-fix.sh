#!/bin/bash

echo "🔍 VERIFYING JAVASCRIPT FIX"
echo "=========================="
echo ""

while true; do
    echo "Checking at $(date '+%H:%M:%S')..."
    
    # Test if JS files return JavaScript (not HTML)
    JS_CONTENT=$(curl -s https://findingsports.com/js/ultimate-nuclear-fix-v6.js | head -1)
    
    if [[ "$JS_CONTENT" == *"ULTIMATE NUCLEAR FIX"* ]]; then
        echo "✅ JavaScript files loading correctly!"
        
        # Test incognito fix
        INCOG_CONTENT=$(curl -s https://findingsports.com/js/incognito-fix.js | head -1)
        if [[ "$INCOG_CONTENT" == *"INCOGNITO MODE FIX"* ]]; then
            echo "✅ Incognito fix loading correctly!"
            echo ""
            echo "🎉 DEPLOYMENT SUCCESSFUL!"
            echo "The white screen issue should be FIXED!"
            echo ""
            echo "Please test:"
            echo "1. Clear browser cache completely"
            echo "2. Open https://findingsports.com in incognito mode"
            echo "3. Site should load fully (not white screen)"
            break
        fi
    elif [[ "$JS_CONTENT" == *"File not found"* ]]; then
        echo "✅ Server returning 404 for missing JS (correct behavior)"
        echo "⏳ Waiting for Nuclear Fix deployment..."
    else
        echo "❌ Still returning HTML for JS files"
    fi
    
    echo "Waiting 10 seconds..."
    sleep 10
done