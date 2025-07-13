#!/bin/bash

# Finding Sports - Automated Deployment Testing Script
# This script tests the deployed application endpoints

set -e

echo "🧪 Finding Sports Deployment Testing"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Get the Railway app URL from user or use default
if [ -z "$RAILWAY_APP_URL" ]; then
    print_status $YELLOW "Enter your Railway app URL (e.g., https://findingsports-production.up.railway.app):"
    read -r RAILWAY_APP_URL
fi

# Remove trailing slash if present
RAILWAY_APP_URL=${RAILWAY_APP_URL%/}

print_status $BLUE "🌐 Testing deployment at: $RAILWAY_APP_URL"
echo ""

# Test results storage
PASSED_TESTS=0
FAILED_TESTS=0
TOTAL_TESTS=0

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    print_status $BLUE "Testing: $description"
    print_status $BLUE "Endpoint: $method $endpoint"
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$RAILWAY_APP_URL$endpoint" || echo "CURL_ERROR")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$RAILWAY_APP_URL$endpoint" || echo "CURL_ERROR")
    fi
    
    if [ "$response" == "CURL_ERROR" ]; then
        print_status $RED "❌ FAILED: Could not connect to server"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n 1)
    # Extract response body (everything except last line)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" == "$expected_status" ]; then
        print_status $GREEN "✅ PASSED: Status $status_code"
        if [ -n "$body" ]; then
            echo "Response preview: ${body:0:100}..."
        fi
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_status $RED "❌ FAILED: Expected $expected_status, got $status_code"
        if [ -n "$body" ]; then
            echo "Error: $body"
        fi
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# Start testing
print_status $YELLOW "🚀 Starting deployment tests..."
echo ""

# 1. Health Check
test_endpoint "GET" "/health" "200" "Health Check"

# 2. Frontend Access
test_endpoint "GET" "/" "200" "Frontend Homepage"

# 3. API Endpoints
test_endpoint "GET" "/api/games" "200" "Get Games (Public)"
test_endpoint "GET" "/api/locations/bc" "200" "Get BC Locations"
test_endpoint "GET" "/api/ws/stats" "200" "WebSocket Stats"
test_endpoint "GET" "/api/data/stats" "200" "Data Aggregation Stats"
test_endpoint "GET" "/api/facilities" "200" "Get Facilities"

# 4. Play Now API
test_endpoint "POST" "/api/play-now/search" "200" "Play Now Search" \
    '{"location": "Vancouver", "sports": ["basketball"]}'

# 5. Location Suggestions
test_endpoint "GET" "/api/locations/suggestions?q=van" "200" "Location Suggestions"

# 6. Authentication Endpoints (should work without auth)
test_endpoint "POST" "/api/auth/login" "401" "Login (Invalid Credentials)" \
    '{"email": "test@example.com", "password": "wrongpass"}'

# 7. Protected Endpoints (should return 401 without auth)
test_endpoint "GET" "/api/auth/me" "401" "Get Current User (No Auth)"
test_endpoint "POST" "/api/games" "401" "Create Game (No Auth)" \
    '{"sport": "basketball", "location": "Vancouver"}'

# Summary
echo ""
print_status $YELLOW "📊 Test Summary"
print_status $YELLOW "==============="
print_status $BLUE "Total Tests: $TOTAL_TESTS"
print_status $GREEN "Passed: $PASSED_TESTS"
print_status $RED "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    print_status $GREEN "
🎉 All tests passed! Your deployment appears to be working correctly.
"
else
    print_status $RED "
⚠️  Some tests failed. Please check the Railway logs for more details.

To view logs:
railway logs --tail

Common fixes:
1. Ensure JWT_SECRET is set in Railway environment
2. Check that all dependencies are installed
3. Verify the server started without errors
"
fi

# Performance test
print_status $YELLOW "⚡ Running performance test..."
print_status $BLUE "Testing response time for health endpoint..."

start_time=$(date +%s%N)
curl -s "$RAILWAY_APP_URL/health" > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

print_status $BLUE "Response time: ${response_time}ms"

if [ $response_time -lt 500 ]; then
    print_status $GREEN "✅ Excellent performance (<500ms)"
elif [ $response_time -lt 1000 ]; then
    print_status $YELLOW "⚠️  Good performance (<1s)"
else
    print_status $RED "❌ Slow response (>1s) - Check server performance"
fi

# Additional recommendations
print_status $YELLOW "
📝 Additional Manual Tests:
1. Open $RAILWAY_APP_URL in a browser
2. Try the 'Play Now' button
3. Test Google Sign-In
4. Check if real-time updates work (WebSocket)
5. Search for games in different locations

🔍 Monitoring Commands:
- View logs: railway logs --tail
- Check status: railway status
- View metrics: railway metrics

📚 Documentation:
- See DEPLOYMENT_STATUS.md for troubleshooting
- Check deployment-monitor.sh for deployment tools
"