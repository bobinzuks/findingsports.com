#!/bin/bash

echo "🕐 TESTING ELEMENT PERSISTENCE - Nuclear Fix v6"
echo "=============================================="
echo "This test will monitor the site for 2 minutes"
echo "Checking every 15 seconds for reappearing elements"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test duration (2 minutes = 120 seconds)
DURATION=120
INTERVAL=15
ITERATIONS=$((DURATION / INTERVAL))

# Results tracking
declare -a results
all_pass=true

echo "Starting test at: $(date)"
echo "Will perform $ITERATIONS checks over $DURATION seconds"
echo ""

for i in $(seq 1 $ITERATIONS); do
    echo "Check #$i at $(date '+%H:%M:%S')"
    
    # Get page content
    PAGE=$(curl -s https://findingsports.com/)
    
    # Check for language selector
    if echo "$PAGE" | grep -q "🌐 English"; then
        echo -e "  ${RED}❌ Language selector found!${NC}"
        results[$i]="FAIL"
        all_pass=false
    else
        echo -e "  ${GREEN}✅ Language selector removed${NC}"
    fi
    
    # Check for help button
    if echo "$PAGE" | grep -q "? Help"; then
        echo -e "  ${RED}❌ Help button found!${NC}"
        results[$i]="FAIL"
        all_pass=false
    else
        echo -e "  ${GREEN}✅ Help button removed${NC}"
    fi
    
    # Check nuclear fix is still active
    if echo "$PAGE" | grep -q "ultimate-nuclear-fix"; then
        echo -e "  ${GREEN}✅ Nuclear fix active${NC}"
    else
        echo -e "  ${RED}❌ Nuclear fix missing!${NC}"
        results[$i]="FAIL"
        all_pass=false
    fi
    
    echo ""
    
    # Wait before next check (except on last iteration)
    if [ $i -lt $ITERATIONS ]; then
        echo "Waiting $INTERVAL seconds..."
        sleep $INTERVAL
    fi
done

echo "========================================"
echo "PERSISTENCE TEST COMPLETE"
echo ""

if [ "$all_pass" = true ]; then
    echo -e "${GREEN}✅ SUCCESS: Elements remained removed for entire $DURATION seconds${NC}"
    echo "Nuclear Fix v6 is working persistently!"
    exit 0
else
    echo -e "${RED}❌ FAILURE: Elements reappeared during testing${NC}"
    echo "Nuclear Fix v6 needs further enhancement"
    exit 1
fi