#!/bin/bash

echo "🔍 DIAGNOSING FINDING SPORTS WEBSITE"
echo "===================================="
echo "Time: $(date)"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get page content
PAGE=$(curl -s https://findingsports.com/)

echo "1. HTTP Status Check:"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://findingsports.com/)
if [ "$STATUS" = "200" ]; then
    echo -e "   ${GREEN}✅ HTTP 200 OK${NC}"
else
    echo -e "   ${RED}❌ HTTP $STATUS${NC}"
fi

echo ""
echo "2. Nuclear Fix Status:"
if echo "$PAGE" | grep -q "ultimate-nuclear-fix-v6.js"; then
    echo -e "   ${GREEN}✅ Nuclear Fix v6 loaded${NC}"
elif echo "$PAGE" | grep -q "ultimate-nuclear-fix"; then
    echo -e "   ${YELLOW}⚠️ Older nuclear fix version loaded${NC}"
else
    echo -e "   ${RED}❌ No nuclear fix detected${NC}"
fi

echo ""
echo "3. Critical Elements Check:"
echo -n "   Map container: "
if echo "$PAGE" | grep -q 'id="map"'; then
    echo -e "${GREEN}Present${NC}"
else
    echo -e "${RED}Missing${NC}"
fi

echo -n "   MapLibre script: "
if echo "$PAGE" | grep -q "maplibre-gl.js"; then
    echo -e "${GREEN}Loaded${NC}"
else
    echo -e "${RED}Missing${NC}"
fi

echo -n "   Games API: "
if echo "$PAGE" | grep -q "/api/v2/games"; then
    echo -e "${GREEN}Configured${NC}"
else
    echo -e "${RED}Missing${NC}"
fi

echo -n "   Play Now button: "
if echo "$PAGE" | grep -q "Play Now"; then
    echo -e "${GREEN}Present${NC}"
else
    echo -e "${RED}Missing${NC}"
fi

echo ""
echo "4. Potential Issues:"
# Check for console errors in the code
if echo "$PAGE" | grep -q "console.error"; then
    echo -e "   ${YELLOW}⚠️ Error handling code present (normal)${NC}"
fi

# Check if nuclear fix might be too aggressive
if echo "$PAGE" | grep -q "destroyElement.*map\|destroyElement.*play"; then
    echo -e "   ${RED}❌ Nuclear fix may be destroying critical elements${NC}"
else
    echo -e "   ${GREEN}✅ Nuclear fix not affecting critical elements${NC}"
fi

echo ""
echo "5. API Endpoints Test:"
echo -n "   Games API: "
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://findingsports.com/api/v2/games)
if [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Responding${NC}"
else
    echo -e "${RED}❌ Status: $API_STATUS${NC}"
fi

echo ""
echo "6. Content Analysis:"
CONTENT_LENGTH=$(echo "$PAGE" | wc -c)
echo "   Page size: $CONTENT_LENGTH bytes"

if [ $CONTENT_LENGTH -lt 1000 ]; then
    echo -e "   ${RED}❌ Page seems too small - possible error page${NC}"
elif [ $CONTENT_LENGTH -gt 100000 ]; then
    echo -e "   ${GREEN}✅ Full page loaded${NC}"
else
    echo -e "   ${YELLOW}⚠️ Page size seems normal${NC}"
fi

echo ""
echo "DIAGNOSIS COMPLETE"
echo "=================="