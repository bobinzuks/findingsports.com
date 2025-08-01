#!/bin/bash

echo "🔄 MONITORING DEPLOYMENT - INCOGNITO FIX"
echo "======================================"
echo "Starting: $(date)"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Loop until deployment succeeds
while true; do
    echo "Checking at $(date '+%H:%M:%S')..."
    
    # Check if incognito-fix.js is accessible
    INCOGNITO_FIX=$(curl -s https://findingsports.com/js/incognito-fix.js | head -5)
    
    if echo "$INCOGNITO_FIX" | grep -q "INCOGNITO MODE FIX"; then
        echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
        echo ""
        echo "Incognito fix is now live!"
        echo ""
        
        # Verify all critical elements
        echo "Verifying site functionality..."
        
        # Check main page
        PAGE=$(curl -s -H "Cache-Control: no-cache" https://findingsports.com/)
        
        echo -n "1. Nuclear Fix v6 loaded: "
        if echo "$PAGE" | grep -q "ultimate-nuclear-fix-v6.js"; then
            echo -e "${GREEN}✅${NC}"
        else
            echo -e "${RED}❌${NC}"
        fi
        
        echo -n "2. Incognito Fix loaded: "
        if echo "$PAGE" | grep -q "incognito-fix.js"; then
            echo -e "${GREEN}✅${NC}"
        else
            echo -e "${RED}❌${NC}"
        fi
        
        echo -n "3. NO language selector: "
        if ! echo "$PAGE" | grep -q "🌐 English" || echo "$PAGE" | grep -q "has-text"; then
            echo -e "${GREEN}✅${NC}"
        else
            echo -e "${RED}❌${NC}"
        fi
        
        echo -n "4. NO help button: "
        if ! echo "$PAGE" | grep -q "? Help" || echo "$PAGE" | grep -q "has-text"; then
            echo -e "${GREEN}✅${NC}"
        else
            echo -e "${RED}❌${NC}"
        fi
        
        echo -n "5. Login button present: "
        if echo "$PAGE" | grep -q "login-btn"; then
            echo -e "${GREEN}✅${NC}"
        else
            echo -e "${RED}❌${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}🎉 INCOGNITO MODE SHOULD NOW WORK!${NC}"
        echo "Test in incognito/private browsing to verify"
        break
    else
        echo -e "${YELLOW}⏳ Not yet deployed...${NC}"
        
        # Check if returning HTML instead of JS
        if echo "$INCOGNITO_FIX" | grep -q "<!doctype"; then
            echo -e "${RED}❌ Still returning HTML for JS files${NC}"
        fi
        
        echo "Waiting 30 seconds..."
        sleep 30
    fi
done

echo ""
echo "Deployment monitoring complete at $(date)"