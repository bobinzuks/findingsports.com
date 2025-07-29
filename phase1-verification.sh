#!/bin/bash

echo "🔍 PHASE 1 VERIFICATION - Finding Sports"
echo "========================================"
echo "Testing Date: $(date)"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results array
declare -A results

# Function to test and report
test_item() {
    local test_name="$1"
    local test_cmd="$2"
    local expected="$3"
    
    echo -n "Testing: $test_name... "
    
    if eval "$test_cmd"; then
        echo -e "${GREEN}✅ PASS${NC}"
        results["$test_name"]="PASS"
    else
        echo -e "${RED}❌ FAIL${NC}"
        results["$test_name"]="FAIL"
    fi
}

# Get the page content once
PAGE_CONTENT=$(curl -s https://findingsports.com/)

echo "📋 PHASE 1 TESTS"
echo "=================="

# Test 1: Check deployment version
echo -n "1. Deployment Version: "
VERSION=$(echo "$PAGE_CONTENT" | grep -o 'deployment-version" content="[^"]*"' | sed 's/.*content="\([^"]*\)".*/\1/')
echo "$VERSION"
if [[ "$VERSION" == *"2025-01-29"* ]]; then
    echo -e "   ${GREEN}✅ Latest version deployed${NC}"
    results["Deployment"]="PASS"
else
    echo -e "   ${RED}❌ Old version${NC}"
    results["Deployment"]="FAIL"
fi

# Test 2: Language selector removed
echo -n "2. Language Selector Removed: "
if echo "$PAGE_CONTENT" | grep -q "🌐 English"; then
    echo -e "${RED}❌ FAIL - Still visible${NC}"
    results["Language"]="FAIL"
else
    echo -e "${GREEN}✅ PASS - Removed${NC}"
    results["Language"]="PASS"
fi

# Test 3: Help button removed
echo -n "3. Help Button Removed: "
if echo "$PAGE_CONTENT" | grep -q "? Help"; then
    echo -e "${RED}❌ FAIL - Still visible${NC}"
    results["Help"]="FAIL"
else
    echo -e "${GREEN}✅ PASS - Removed${NC}"
    results["Help"]="PASS"
fi

# Test 4: Login button present
echo -n "4. Login Button Present: "
if echo "$PAGE_CONTENT" | grep -q "login-btn"; then
    echo -e "${GREEN}✅ PASS - Found${NC}"
    results["Login"]="PASS"
else
    echo -e "${RED}❌ FAIL - Not found${NC}"
    results["Login"]="FAIL"
fi

# Test 5: Nuclear fix loaded
echo -n "5. Nuclear Fix Script: "
if echo "$PAGE_CONTENT" | grep -q "ultimate-nuclear-fix"; then
    echo -e "${GREEN}✅ PASS - Loaded${NC}"
    results["Nuclear"]="PASS"
else
    echo -e "${RED}❌ FAIL - Not loaded${NC}"
    results["Nuclear"]="FAIL"
fi

# Test 6: Map container present
echo -n "6. Map Container: "
if echo "$PAGE_CONTENT" | grep -q 'id="map"'; then
    echo -e "${GREEN}✅ PASS - Present${NC}"
    results["Map"]="PASS"
else
    echo -e "${RED}❌ FAIL - Missing${NC}"
    results["Map"]="FAIL"
fi

# Test 7: Play Now button
echo -n "7. Play Now Button: "
if echo "$PAGE_CONTENT" | grep -q "Play Now"; then
    echo -e "${GREEN}✅ PASS - Found${NC}"
    results["PlayNow"]="PASS"
else
    echo -e "${RED}❌ FAIL - Not found${NC}"
    results["PlayNow"]="FAIL"
fi

# Test 8: Games API endpoint
echo -n "8. Games API: "
if echo "$PAGE_CONTENT" | grep -q "/api/v2/games"; then
    echo -e "${GREEN}✅ PASS - v2 API configured${NC}"
    results["API"]="PASS"
else
    echo -e "${RED}❌ FAIL - API not found${NC}"
    results["API"]="FAIL"
fi

# Test 9: Social Feed
echo -n "9. Social Feed: "
if echo "$PAGE_CONTENT" | grep -q "social-feed"; then
    echo -e "${GREEN}✅ PASS - Present${NC}"
    results["Social"]="PASS"
else
    echo -e "${RED}❌ FAIL - Missing${NC}"
    results["Social"]="FAIL"
fi

# Test 10: Community Hub
echo -n "10. Community Hub: "
if echo "$PAGE_CONTENT" | grep -q "Community Hub"; then
    echo -e "${GREEN}✅ PASS - Found${NC}"
    results["Community"]="PASS"
else
    echo -e "${RED}❌ FAIL - Not found${NC}"
    results["Community"]="FAIL"
fi

# Summary
echo ""
echo "📊 SUMMARY"
echo "=========="
pass_count=0
fail_count=0

for test in "${!results[@]}"; do
    if [[ "${results[$test]}" == "PASS" ]]; then
        ((pass_count++))
    else
        ((fail_count++))
    fi
done

echo "Total Tests: $((pass_count + fail_count))"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"

# Decision
echo ""
if [[ $fail_count -eq 0 ]]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED - Proceed to Phase 3${NC}"
    exit 0
else
    echo -e "${RED}❌ TESTS FAILED - Proceed to Phase 2${NC}"
    exit 1
fi