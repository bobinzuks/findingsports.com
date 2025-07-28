#!/bin/bash

# Finding Sports - Cross-Browser Nuclear Fix Test Runner
# This script automates the testing process and generates reports

echo "🚀 Finding Sports - Cross-Browser Nuclear Fix Testing"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}📁 Navigating to cross-browser-test directory...${NC}"
    cd cross-browser-test 2>/dev/null || {
        echo -e "${RED}❌ cross-browser-test directory not found!${NC}"
        exit 1
    }
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install || {
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    }
fi

# Install browsers if needed
if [ ! -d "$HOME/.cache/ms-playwright" ] && [ ! -d "$HOME/Library/Caches/ms-playwright" ]; then
    echo -e "${BLUE}🌐 Installing Playwright browsers...${NC}"
    npm run install-browsers || {
        echo -e "${RED}❌ Failed to install browsers${NC}"
        exit 1
    }
fi

# Parse command line arguments
TEST_URL=""
HEADLESS="true"
BROWSER="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            TEST_URL="$2"
            shift 2
            ;;
        --no-headless)
            HEADLESS="false"
            shift
            ;;
        --browser)
            BROWSER="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: ./run-tests.sh [options]"
            echo ""
            echo "Options:"
            echo "  --url <url>          Test a specific URL (default: local mockup)"
            echo "  --no-headless        Run tests with visible browser"
            echo "  --browser <browser>  Test specific browser (chromium|firefox|webkit|all)"
            echo "  --help, -h           Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Create results directory
mkdir -p screenshots results

# Build test command
TEST_CMD="npm test -- "

if [ -n "$TEST_URL" ]; then
    TEST_CMD+="--url=\"$TEST_URL\" "
    echo -e "${BLUE}🔗 Testing URL: $TEST_URL${NC}"
else
    echo -e "${BLUE}🔗 Testing local mockup file${NC}"
fi

if [ "$HEADLESS" = "false" ]; then
    TEST_CMD+="--no-headless "
    echo -e "${BLUE}👁️  Running with visible browser${NC}"
fi

if [ "$BROWSER" != "all" ]; then
    TEST_CMD+="--browser=$BROWSER "
    echo -e "${BLUE}🌐 Testing browser: $BROWSER${NC}"
else
    TEST_CMD+="--all "
    echo -e "${BLUE}🌐 Testing all browsers${NC}"
fi

echo ""
echo -e "${GREEN}▶️  Starting tests...${NC}"
echo "=================================================="
echo ""

# Run the tests
eval $TEST_CMD
TEST_EXIT_CODE=$?

echo ""
echo "=================================================="

# Generate report if tests completed
if [ -f "test-results.json" ]; then
    echo -e "${BLUE}📊 Generating HTML report...${NC}"
    npm run report
    
    # Show summary
    echo ""
    echo -e "${GREEN}✅ Test completed!${NC}"
    echo ""
    echo "📁 Results saved to:"
    echo "   - test-results.json    (raw data)"
    echo "   - report.html          (visual report)"
    echo "   - report.md            (markdown summary)"
    echo "   - screenshots/         (browser screenshots)"
    echo ""
    
    # Open report in browser if not headless
    if [ "$HEADLESS" = "false" ] && command -v open &> /dev/null; then
        echo -e "${BLUE}🌐 Opening report in browser...${NC}"
        open report.html 2>/dev/null || xdg-open report.html 2>/dev/null || echo "Please open report.html manually"
    fi
else
    echo -e "${RED}❌ No test results found. Tests may have failed to run.${NC}"
    exit 1
fi

# Exit with test status
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the report for details.${NC}"
fi

exit $TEST_EXIT_CODE