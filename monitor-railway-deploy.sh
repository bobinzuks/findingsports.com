#!/bin/bash

echo "🔄 MONITORING RAILWAY DEPLOYMENT"
echo "================================"
echo ""

START_TIME=$(date +%s)

while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    
    echo "$(date '+%H:%M:%S') - Checking (${ELAPSED}s elapsed)..."
    
    # Check deployment status
    STATUS=$(railway status 2>&1 | grep -c "No deployments found")
    
    if [ $STATUS -eq 0 ]; then
        echo "   ✅ Deployment found!"
        
        # Wait for it to be ready
        sleep 20
        
        # Test the site
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k https://findingsports.com)
        echo "   HTTP Code: $HTTP_CODE"
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo ""
            echo "🎉 SITE IS LIVE!"
            
            # Check content
            CONTENT=$(curl -s -k https://findingsports.com)
            
            # Check for key indicators
            if echo "$CONTENT" | grep -q "Finding Sports"; then
                echo "✅ Content loading correctly"
                
                # Check for unwanted elements
                if echo "$CONTENT" | grep -q "🌐 English"; then
                    echo "❌ Language selector still visible"
                else
                    echo "✅ Language selector removed"
                fi
                
                if echo "$CONTENT" | grep -q "? Help"; then
                    echo "❌ Help button still visible"
                else
                    echo "✅ Help button removed"
                fi
                
                # Take final screenshots
                echo ""
                echo "Taking screenshots..."
                google-chrome --headless --disable-gpu --ignore-certificate-errors --screenshot=live-regular.png --window-size=1280,800 https://findingsports.com
                google-chrome --headless --disable-gpu --ignore-certificate-errors --incognito --screenshot=live-incognito.png --window-size=1280,800 https://findingsports.com
                
                echo ""
                echo "✅ Screenshots saved:"
                echo "   - live-regular.png"
                echo "   - live-incognito.png"
                
                break
            else
                echo "⚠️  Content not loading properly"
            fi
        elif [ "$HTTP_CODE" = "404" ]; then
            echo "   ❌ Still showing Not Found"
        fi
    else
        echo "   ⏳ No deployment yet..."
    fi
    
    if [ $ELAPSED -gt 600 ]; then
        echo ""
        echo "❌ Timeout after 10 minutes"
        echo "Manual intervention required!"
        break
    fi
    
    sleep 15
done