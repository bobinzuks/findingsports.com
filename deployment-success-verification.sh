#!/bin/bash

echo "===================="
echo "DEPLOYMENT VERIFICATION SCRIPT"
echo "===================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1. Testing live API endpoints..."
echo ""

# Test API v2 endpoint
echo "Testing /api/v2/games endpoint:"
RESPONSE=$(curl -s "https://findingsports.com/api/v2/games")
GAMES_COUNT=$(echo "$RESPONSE" | grep -o '"sport"' | wc -l)

if [ $GAMES_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ API v2 returns $GAMES_COUNT games${NC}"
else
    echo -e "${RED}✗ API v2 returns no games${NC}"
fi

# Test old API endpoint for comparison
echo ""
echo "Testing /api/games endpoint (old):"
OLD_RESPONSE=$(curl -s "https://findingsports.com/api/games")
OLD_GAMES=$(echo "$OLD_RESPONSE" | grep -o '"games":\[\]' | wc -l)

if [ $OLD_GAMES -gt 0 ]; then
    echo -e "${YELLOW}⚠ Old API returns empty array (expected)${NC}"
else
    echo -e "${GREEN}✓ Old API response received${NC}"
fi

# Check if index.html uses new API
echo ""
echo "2. Checking if frontend uses API v2..."
INDEX_CONTENT=$(curl -s "https://findingsports.com/index.html")
API_V2_COUNT=$(echo "$INDEX_CONTENT" | grep -c "/api/v2/games")

if [ $API_V2_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ Frontend updated to use API v2 ($API_V2_COUNT references found)${NC}"
else
    echo -e "${RED}✗ Frontend still using old API${NC}"
fi

# Summary
echo ""
echo "===================="
echo "SUMMARY:"
echo "===================="

if [ $GAMES_COUNT -gt 0 ] && [ $API_V2_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "${GREEN}✓ Games are now loading from API v2${NC}"
    echo -e "${GREEN}✓ Frontend has been updated${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Deploy to Railway: git add -A && git commit -m '🚀 Fix games loading - use API v2 endpoint' && git push"
    echo "2. Check live site after deployment"
else
    echo -e "${RED}✗ ISSUES DETECTED${NC}"
    echo "Please review the changes and ensure:"
    echo "- index.html is updated to use /api/v2/games"
    echo "- The API v2 endpoint is returning data"
fi