#!/bin/bash

echo "🔍 MONITORING WHITE SCREEN FIX DEPLOYMENT"
echo "========================================"
echo ""

while true; do
    echo "Checking at $(date '+%H:%M:%S')..."
    
    # Get the page and check for template tag
    PAGE=$(curl -s https://findingsports.com 2>/dev/null)
    
    # Check if template tag is gone
    if echo "$PAGE" | grep -q "<%=Date.now()%>"; then
        echo "   ❌ Template tag still present - old version"
    else
        echo "   ✅ Template tag removed!"
        
        # Check if page has visible content
        BODY_TEXT=$(echo "$PAGE" | sed 's/<[^>]*>//g' | grep -v "^[[:space:]]*$" | wc -w)
        echo "   📄 Page has $BODY_TEXT words of content"
        
        if [ $BODY_TEXT -gt 50 ]; then
            echo "   ✅ Page has substantial content"
            
            # Take a final screenshot to verify
            echo ""
            echo "🎉 WHITE SCREEN SHOULD BE FIXED!"
            echo ""
            echo "Taking verification screenshot..."
            
            google-chrome --headless --disable-gpu --screenshot=fixed-screenshot.png --window-size=1280,800 https://findingsports.com 2>/dev/null
            
            if [ -f "fixed-screenshot.png" ]; then
                echo "   ✅ Screenshot saved: fixed-screenshot.png"
                echo "   File size: $(ls -lh fixed-screenshot.png | awk '{print $5}')"
                
                # If screenshot is tiny, it's still white
                SIZE=$(stat -c%s fixed-screenshot.png)
                if [ $SIZE -lt 10000 ]; then
                    echo "   ⚠️  Screenshot is small - might still be white"
                else
                    echo "   ✅ Screenshot has content!"
                fi
            fi
            
            break
        else
            echo "   ⚠️  Page might still be loading..."
        fi
    fi
    
    echo "   Waiting 15 seconds..."
    sleep 15
done

echo ""
echo "Deployment complete!"
echo "Please check https://findingsports.com in both regular and incognito modes."