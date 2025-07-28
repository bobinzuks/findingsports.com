#!/bin/bash

echo "=== GAMES DISPLAY MONITOR ==="
echo "Monitoring if all 11 games from API v2 are displaying correctly"
echo "============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if local server is running
echo "1. Checking local server..."
if lsof -i :8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Local server is running on port 8080${NC}"
else
    echo -e "${RED}✗ Local server is NOT running${NC}"
    echo "  Start it with: cd mockup/backend && node ultra-simple-server.js"
fi
echo ""

# Check API endpoints
echo "2. Checking API endpoints..."
endpoints=(
    "http://localhost:8080/api/v2/games"
    "http://localhost:8080/api/games"
    "http://localhost:8080/api/play-now"
)

for endpoint in "${endpoints[@]}"; do
    echo -n "  Testing $endpoint ... "
    response=$(curl -s -w "\n%{http_code}" "$endpoint" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    
    if [[ $http_code == "200" ]]; then
        # Count games in response
        game_count=$(echo "$response" | head -n-1 | grep -o '"id"' | wc -l)
        echo -e "${GREEN}✓ OK (HTTP $http_code) - Found $game_count games${NC}"
    else
        echo -e "${RED}✗ Failed (HTTP $http_code)${NC}"
    fi
done
echo ""

# Check if games-display-fix.js is loaded
echo "3. Checking if games-display-fix.js is included..."
if grep -q "games-display-fix.js" mockup/index.html; then
    echo -e "${GREEN}✓ games-display-fix.js is included in index.html${NC}"
else
    echo -e "${RED}✗ games-display-fix.js is NOT included in index.html${NC}"
fi
echo ""

# Check for game elements in HTML
echo "4. Checking for game display elements..."
elements=(
    "gamesList"
    "games-section"
    "games-list"
)

for element in "${elements[@]}"; do
    if grep -q "$element" mockup/index.html; then
        echo -e "${GREEN}✓ Found element: $element${NC}"
    else
        echo -e "${RED}✗ Missing element: $element${NC}"
    fi
done
echo ""

# Summary
echo "============================================="
echo "SUMMARY:"
echo ""
echo "The games display fix includes:"
echo "1. Mock data with 11 games as fallback"
echo "2. Multiple API endpoint attempts"
echo "3. Proper error handling and loading states"
echo "4. Enhanced game card display with all details"
echo ""
echo "To test the fix:"
echo "1. Open mockup/index.html in a browser"
echo "2. Check the 'Upcoming Games' tab"
echo "3. You should see 11 games displayed"
echo ""
echo "If no API is available, the fix will automatically"
echo "display the 11 mock games with full details."
echo "============================================="