#!/bin/bash

echo "🚀 RAILWAY DEPLOYMENT SCRIPT FOR FINDING SPORTS"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if logged in
echo "1. Checking Railway login status..."
LOGGED_IN=$(railway whoami 2>&1)
if [[ $LOGGED_IN == *"bobinzuks@gmail.com"* ]]; then
    echo -e "${GREEN}✅ Logged in as bobinzuks@gmail.com${NC}"
else
    echo -e "${YELLOW}⚠️  Not logged in as bobinzuks${NC}"
    echo "Current status: $LOGGED_IN"
    echo ""
    echo "Please login first:"
    echo "  railway login"
    exit 1
fi

# Check if we're in the right directory
echo ""
echo "2. Checking project directory..."
if [ -f "mockup/index.html" ] && [ -f "Dockerfile" ]; then
    echo -e "${GREEN}✅ In correct project directory${NC}"
else
    echo -e "${RED}❌ Not in Finding Sports directory${NC}"
    echo "Please run from: ~/Desktop/finding-sports"
    exit 1
fi

# Check if project is linked
echo ""
echo "3. Checking Railway project link..."
RAILWAY_STATUS=$(railway status 2>&1)
if [[ $RAILWAY_STATUS == *"No project linked"* ]]; then
    echo -e "${YELLOW}⚠️  No project linked${NC}"
    echo ""
    echo "Attempting to link project..."
    echo "Please select the findingsports project when prompted:"
    railway link
    
    # Check again
    RAILWAY_STATUS=$(railway status 2>&1)
    if [[ $RAILWAY_STATUS == *"No project linked"* ]]; then
        echo -e "${RED}❌ Failed to link project${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Project linked${NC}"
echo "$RAILWAY_STATUS"

# Show current deployment status
echo ""
echo "4. Current deployment status..."
echo "================================"
railway status

# Commit any pending changes
echo ""
echo "5. Checking for uncommitted changes..."
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  Uncommitted changes found${NC}"
    echo ""
    echo "Committing all changes..."
    git add -A
    git commit -m "🚀 Deploy to Railway - $(date '+%Y-%m-%d %H:%M:%S')

Auto-commit before Railway deployment
All fixes included:
- White screen fix
- Template tag removal
- JavaScript serving fix
- Incognito mode compatibility

🤖 Generated with deployment script

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    echo ""
    echo "Pushing to GitHub..."
    git push
    echo -e "${GREEN}✅ Changes committed and pushed${NC}"
else
    echo -e "${GREEN}✅ No uncommitted changes${NC}"
fi

# Deploy to Railway
echo ""
echo "6. Deploying to Railway..."
echo "=========================="
echo -e "${YELLOW}Starting deployment...${NC}"

# Run deployment
railway up --detach

# Check deployment status
echo ""
echo "7. Checking deployment status..."
echo "================================"

# Wait a bit for deployment to start
sleep 5

# Show recent logs
echo ""
echo "Recent deployment logs:"
railway logs --tail 20 2>/dev/null || echo "Logs not available yet"

# Monitor deployment
echo ""
echo "8. Monitoring deployment..."
echo "==========================="
echo "Waiting for deployment to complete..."

MAX_ATTEMPTS=20
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "Attempt $ATTEMPT/$MAX_ATTEMPTS: "
    
    # Check if site is responding
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://findingsports.com 2>/dev/null)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}Site responding (HTTP $HTTP_CODE)${NC}"
        
        # Check if template tag is gone (white screen fix)
        if curl -s https://findingsports.com | grep -q "<%=Date.now()%>"; then
            echo -e "${YELLOW}⚠️  Old version still deployed (template tag present)${NC}"
        else
            echo -e "${GREEN}✅ New version deployed (template tag removed)${NC}"
            break
        fi
    elif [ "$HTTP_CODE" = "404" ]; then
        echo -e "${RED}Site showing 404 - Railway deployment issue${NC}"
    else
        echo -e "${YELLOW}Site not responding yet (HTTP $HTTP_CODE)${NC}"
    fi
    
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        echo "Waiting 15 seconds before next check..."
        sleep 15
    fi
done

# Final status
echo ""
echo "=============================================="
echo "DEPLOYMENT COMPLETE"
echo "=============================================="

# Test the site
echo ""
echo "9. Final verification..."
FINAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://findingsports.com 2>/dev/null)

if [ "$FINAL_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Site is live at: https://findingsports.com${NC}"
    
    # Check for key issues
    CONTENT=$(curl -s https://findingsports.com 2>/dev/null)
    
    if echo "$CONTENT" | grep -q "Finding Sports"; then
        echo -e "${GREEN}✅ Site content loading${NC}"
    else
        echo -e "${YELLOW}⚠️  Site might be showing blank page${NC}"
    fi
    
    if echo "$CONTENT" | grep -q "🌐 English"; then
        echo -e "${YELLOW}⚠️  Language selector still visible${NC}"
    else
        echo -e "${GREEN}✅ Language selector removed${NC}"
    fi
    
    if echo "$CONTENT" | grep -q "? Help"; then
        echo -e "${YELLOW}⚠️  Help button still visible${NC}"
    else
        echo -e "${GREEN}✅ Help button removed${NC}"
    fi
    
    echo ""
    echo "📋 Next steps:"
    echo "1. Open https://findingsports.com in your browser"
    echo "2. Clear browser cache (Ctrl+Shift+Delete)"
    echo "3. Check both regular and incognito modes"
    echo "4. Press F12 to check for JavaScript errors"
    
elif [ "$FINAL_CODE" = "404" ]; then
    echo -e "${RED}❌ Site showing 404 - Railway deployment failed${NC}"
    echo ""
    echo "Try these fixes:"
    echo "1. Go to Railway dashboard: https://railway.app"
    echo "2. Check deployment logs"
    echo "3. Manually trigger redeploy"
    echo "4. Reconnect GitHub integration"
else
    echo -e "${RED}❌ Site not responding (HTTP $FINAL_CODE)${NC}"
    echo ""
    echo "Check Railway dashboard for deployment status"
fi

echo ""
echo "=============================================="
echo "Script complete!"