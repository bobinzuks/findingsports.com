#!/bin/bash

# Railway Fix Loop Script
# This script will install Railway CLI and fix the deployment issues

echo "🚂 Railway Fix Loop Script"
echo "========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if Railway CLI is installed
echo -e "${YELLOW}Step 1: Checking Railway CLI...${NC}"
if ! command -v railway &> /dev/null; then
    echo "Railway CLI not found. Installing..."
    
    # Install Railway CLI
    if command -v npm &> /dev/null; then
        echo "Installing via npm..."
        npm install -g @railway/cli
    else
        echo "Installing via curl..."
        curl -fsSL https://railway.app/install.sh | sh
    fi
else
    echo -e "${GREEN}✅ Railway CLI is installed${NC}"
fi

# Step 2: Login to Railway
echo -e "\n${YELLOW}Step 2: Railway Login${NC}"
echo "You need to login to Railway. This will open your browser."
echo "Press Enter to continue..."
read -r
railway login

# Step 3: Link to project
echo -e "\n${YELLOW}Step 3: Linking to project${NC}"
railway link

# Step 4: Set environment variables
echo -e "\n${YELLOW}Step 4: Setting environment variables${NC}"

# Generate a secure JWT secret
JWT_SECRET="jwt-secret-$(openssl rand -hex 32)"

echo "Setting environment variables..."
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set NODE_ENV="production"
railway variables set PORT="8080"
railway variables set CORS_ORIGIN="https://findingsports.com,https://www.findingsports.com"

echo -e "${GREEN}✅ Environment variables set${NC}"

# Step 5: Deploy the app
echo -e "\n${YELLOW}Step 5: Deploying application${NC}"
railway up

# Step 6: Monitor deployment
echo -e "\n${YELLOW}Step 6: Monitoring deployment${NC}"
echo "Watching logs for 30 seconds..."
timeout 30 railway logs || true

# Step 7: Check deployment status
echo -e "\n${YELLOW}Step 7: Checking deployment status${NC}"

# Function to test endpoints
test_endpoint() {
    local url=$1
    local name=$2
    
    echo -n "Testing $name... "
    if curl -s -f -o /dev/null "$url"; then
        echo -e "${GREEN}✅ Working${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed${NC}"
        return 1
    fi
}

# Wait for deployment to be ready
echo "Waiting for deployment to be ready..."
sleep 10

# Get the deployment URL
DEPLOY_URL=$(railway status --json 2>/dev/null | jq -r '.url' || echo "https://findingsports.com")

# Test endpoints
echo -e "\n${YELLOW}Testing endpoints:${NC}"
test_endpoint "$DEPLOY_URL/health" "Health Check"
test_endpoint "$DEPLOY_URL/api/games" "Games API"
test_endpoint "$DEPLOY_URL/api/play-now?lat=49.2827&lng=-123.1207" "Play Now API"

# Step 8: Fix loop - if tests fail, try alternative fixes
if [ $? -ne 0 ]; then
    echo -e "\n${RED}Some tests failed. Attempting fixes...${NC}"
    
    # Fix 1: Restart the service
    echo "Restarting service..."
    railway restart
    sleep 10
    
    # Fix 2: Check logs for errors
    echo -e "\n${YELLOW}Checking recent logs for errors:${NC}"
    railway logs --lines 50 | grep -i "error\|critical\|failed" || echo "No errors found in recent logs"
    
    # Fix 3: Redeploy with minimal server
    echo -e "\n${YELLOW}Attempting redeploy...${NC}"
    railway up --detach
fi

# Step 9: Final status
echo -e "\n${YELLOW}=== Final Status ===${NC}"
railway status
railway variables

echo -e "\n${GREEN}🎉 Railway Fix Loop Complete!${NC}"
echo "Your app should now be deployed at: $DEPLOY_URL"
echo ""
echo "If you still have issues, you can:"
echo "1. Run 'railway logs' to see live logs"
echo "2. Run 'railway variables' to check environment variables"
echo "3. Run 'railway restart' to restart the service"
echo "4. Run this script again to retry the fixes"