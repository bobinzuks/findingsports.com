#!/bin/bash

echo "🔍 Verifying deployment and nuclear fixes..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

URL="https://findingsports.com"

echo -e "\n📡 Checking if site is live..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Site is live (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}❌ Site returned HTTP $HTTP_STATUS${NC}"
    exit 1
fi

echo -e "\n🔍 Checking for unwanted elements..."

# Check for language selector
LANG_SELECTOR=$(curl -s "$URL" | grep -c "🌐.*English")
if [ "$LANG_SELECTOR" -gt 0 ]; then
    echo -e "${RED}❌ Language selector still visible in HTML${NC}"
else
    echo -e "${GREEN}✅ Language selector not found in HTML${NC}"
fi

# Check for help button
HELP_BUTTON=$(curl -s "$URL" | grep -c "Help.*button\|help-btn")
if [ "$HELP_BUTTON" -gt 0 ]; then
    echo -e "${RED}❌ Help button still visible in HTML${NC}"
else
    echo -e "${GREEN}✅ Help button not found in HTML${NC}"
fi

# Check if nuclear fix is loaded
NUCLEAR_FIX=$(curl -s "$URL" | grep -c "ultimate-nuclear-fix.js")
if [ "$NUCLEAR_FIX" -gt 0 ]; then
    echo -e "${GREEN}✅ Nuclear fix script is loaded${NC}"
else
    echo -e "${RED}❌ Nuclear fix script NOT loaded${NC}"
fi

# Check if language service is loaded
LANG_SERVICE=$(curl -s "$URL" | grep -c "language-service.js")
if [ "$LANG_SERVICE" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Language service is loaded (this is causing the issue!)${NC}"
else
    echo -e "${GREEN}✅ Language service not loaded${NC}"
fi

echo -e "\n📊 Summary:"
echo "The language selector is being added by language-service.js AFTER the nuclear fix runs."
echo "Solution: We need to either:"
echo "1. Remove language-service.js from being loaded"
echo "2. Create a more aggressive fix that overrides the LanguageService"
echo "3. Make the nuclear fix run continuously with MutationObserver"

echo -e "\n🔧 Creating enhanced nuclear fix..."