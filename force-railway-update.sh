#!/bin/bash

echo "🚀 AGGRESSIVE RAILWAY DEPLOYMENT SCRIPT"
echo "======================================"
echo "Based on 2025 Railway issues research"
echo ""

# 1. First, let's check current status
echo "1. Checking current deployment..."
CURRENT=$(curl -s https://findingsports.com | grep -c "<%=Date.now()%>")
if [ $CURRENT -gt 0 ]; then
    echo "   ❌ Old version with template tag"
else
    echo "   ✅ Template tag already removed!"
    exit 0
fi

# 2. Create multiple force files
echo ""
echo "2. Creating force deploy triggers..."
for i in {1..3}; do
    echo "Deploy attempt $i at $(date)" > "FORCE_$i.txt"
    git add "FORCE_$i.txt"
done

git commit -m "🔥 MULTIPLE FORCE DEPLOYS - Railway cache bypass attempt" 2>/dev/null
git push

# 3. Try multiple deploys
echo ""
echo "3. Attempting multiple deploys (research shows 3-5 needed)..."

for attempt in {1..5}; do
    echo ""
    echo "Deployment attempt #$attempt..."
    
    # Cancel any existing
    railway down -y 2>/dev/null
    sleep 2
    
    # Deploy
    railway up --detach 2>&1 | head -20
    
    # Wait and check
    sleep 30
    
    # Check if it worked
    NEW_CHECK=$(curl -s https://findingsports.com 2>/dev/null | grep -c "<%=Date.now()%>")
    if [ $NEW_CHECK -eq 0 ]; then
        echo "   ✅ SUCCESS! Template tag removed!"
        break
    else
        echo "   ❌ Still old version, trying again..."
    fi
done

# 4. Final check and screenshot
echo ""
echo "4. Final verification..."
sleep 10

FINAL_CHECK=$(curl -s https://findingsports.com 2>/dev/null | grep -c "<%=Date.now()%>")
if [ $FINAL_CHECK -eq 0 ]; then
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "Taking victory screenshots..."
    
    google-chrome --headless --disable-gpu --screenshot=railway-fixed-regular.png --window-size=1280,800 https://findingsports.com 2>/dev/null
    google-chrome --headless --disable-gpu --incognito --screenshot=railway-fixed-incognito.png --window-size=1280,800 https://findingsports.com 2>/dev/null
    
    echo "Screenshots saved:"
    echo "  - railway-fixed-regular.png"
    echo "  - railway-fixed-incognito.png"
else
    echo "❌ DEPLOYMENT STILL STUCK"
    echo ""
    echo "Manual intervention needed:"
    echo "1. Go to Railway dashboard"
    echo "2. Cancel current deployment"
    echo "3. Disconnect and reconnect GitHub"
    echo "4. Trigger manual deploy"
fi