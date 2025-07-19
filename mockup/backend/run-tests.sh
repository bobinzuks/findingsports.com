#!/bin/bash

# Finding Sports Social Features Test Runner
# This script runs the comprehensive test suite with proper error handling

echo "🧪 Finding Sports Social Features Test Suite"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Function to run a test suite
run_test_suite() {
    local suite_name=$1
    local npm_command=$2
    
    echo -e "${BLUE}Running ${suite_name}...${NC}"
    
    if npm run ${npm_command} 2>&1 | tee test-output.tmp; then
        echo -e "${GREEN}✅ ${suite_name} passed${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ ${suite_name} failed${NC}"
        echo ""
        return 1
    fi
}

# Track failures
FAILED_SUITES=()

# Run each test suite
echo "🔍 Running Unit Tests"
echo "--------------------"

if ! run_test_suite "Moderation Permissions" "test:moderation"; then
    FAILED_SUITES+=("Moderation Permissions")
fi

if ! run_test_suite "Chat Room Lifecycle" "test:chat"; then
    FAILED_SUITES+=("Chat Room Lifecycle")
fi

if ! run_test_suite "Report Handling" "test:reports"; then
    FAILED_SUITES+=("Report Handling")
fi

if ! run_test_suite "WebSocket Events" "test:websocket"; then
    FAILED_SUITES+=("WebSocket Events")
fi

echo ""
echo "🔐 Running Security Tests"
echo "------------------------"

if ! run_test_suite "Security Integration" "test:security"; then
    FAILED_SUITES+=("Security Integration")
fi

echo ""
echo "📊 Running Full Test Suite with Coverage"
echo "---------------------------------------"

# Run full test suite with coverage
npm test

# Clean up
rm -f test-output.tmp

echo ""
echo "==========================================="
echo "📋 Test Summary"
echo "==========================================="

if [ ${#FAILED_SUITES[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All test suites passed!${NC}"
    echo ""
    echo "Key coverage areas verified:"
    echo "  • Role-based permissions (user/moderator/admin)"
    echo "  • Chat room lifecycle (creation/expiration/locking)"
    echo "  • Message moderation (filtering/deletion/editing)"
    echo "  • Report workflow (creation/review/resolution)"
    echo "  • WebSocket security (auth/rate-limiting/muting)"
    echo "  • API endpoint protection"
    echo "  • Input validation and sanitization"
    echo ""
    echo -e "${GREEN}The social features are ready for deployment!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some test suites failed:${NC}"
    for suite in "${FAILED_SUITES[@]}"; do
        echo -e "  ${RED}• ${suite}${NC}"
    done
    echo ""
    echo "Please fix the failing tests before deployment."
    exit 1
fi