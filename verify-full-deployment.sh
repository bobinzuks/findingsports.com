#!/bin/bash

# Full Backend Deployment Verification Script
# This script verifies that all backend services are properly deployed

echo "🔍 Finding Sports - Full Backend Deployment Verification"
echo "========================================================"

# Get the Railway URL from environment or use default
BACKEND_URL=${BACKEND_URL:-"https://finding-sports-production.up.railway.app"}

echo "🌐 Testing backend at: $BACKEND_URL"
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $description ($endpoint)... "
    
    response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL$endpoint")
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ OK${NC} (Status: $status_code)"
    else
        echo -e "${RED}✗ FAILED${NC} (Status: $status_code, Expected: $expected_status)"
        echo "Response: $body" | head -n 3
    fi
}

# Function to test WebSocket connection
test_websocket() {
    echo -n "Testing WebSocket connection... "
    
    # Use Node.js to test WebSocket
    node -e "
    const WebSocket = require('ws');
    const ws = new WebSocket('${BACKEND_URL}'.replace('https', 'wss'));
    
    ws.on('open', () => {
        console.log('${GREEN}✓ OK${NC} - WebSocket connected');
        ws.close();
        process.exit(0);
    });
    
    ws.on('error', (err) => {
        console.log('${RED}✗ FAILED${NC} - ' + err.message);
        process.exit(1);
    });
    
    setTimeout(() => {
        console.log('${YELLOW}⚠ TIMEOUT${NC} - Connection took too long');
        ws.close();
        process.exit(1);
    }, 5000);
    " 2>/dev/null || echo -e "${YELLOW}⚠ WebSocket test requires 'ws' package${NC}"
}

echo "🏥 Health Check Endpoints"
echo "========================"
test_endpoint "/health" "Basic Health Check"
test_endpoint "/api/health" "API Health Check"
test_endpoint "/api/v2/health" "API v2 Health Check"

echo ""
echo "🎮 Core Game Endpoints"
echo "====================="
test_endpoint "/api/games" "List Games"
test_endpoint "/api/sports" "List Sports"
test_endpoint "/api/venues" "List Venues"

echo ""
echo "🆕 Enhanced Endpoints"
echo "===================="
test_endpoint "/api/play-now" "Play Now Service"
test_endpoint "/api/locations/search?query=vancouver" "Location Search"
test_endpoint "/api/discovery/nearby?lat=49.2827&lng=-123.1207" "AI Discovery"
test_endpoint "/api/v2/games/nearby?lat=49.2827&lng=-123.1207" "Nearby Games v2"

echo ""
echo "🐝 Swarm System Endpoints"
echo "========================"
test_endpoint "/api/swarm/status" "Swarm Status"
test_endpoint "/api/aggregation/status" "Aggregation Status"
test_endpoint "/api/sources" "Data Sources"

echo ""
echo "🔌 WebSocket Services"
echo "===================="
test_websocket

echo ""
echo "📊 Performance Metrics"
echo "====================="
# Test response time
echo -n "Average response time... "
total_time=0
count=5
for i in $(seq 1 $count); do
    time=$(curl -s -o /dev/null -w "%{time_total}" "$BACKEND_URL/api/games")
    total_time=$(echo "$total_time + $time" | bc)
done
avg_time=$(echo "scale=3; $total_time / $count" | bc)
echo -e "${GREEN}$avg_time seconds${NC}"

echo ""
echo "🎯 Summary"
echo "=========="
echo "Backend URL: $BACKEND_URL"
echo "All core services should be running with the full server.js"
echo ""

# Check if running emergency server
echo -n "Checking server type... "
server_info=$(curl -s "$BACKEND_URL/api/server-info" 2>/dev/null)
if echo "$server_info" | grep -q "emergency"; then
    echo -e "${RED}⚠️  WARNING: Running emergency server!${NC}"
    echo "The deployment is using server-emergency.js instead of the full server.js"
    echo "This means many features are disabled!"
else
    echo -e "${GREEN}✓ Running full server${NC}"
fi

echo ""
echo "📝 Notes:"
echo "- Ensure railway.json uses 'node server.js' not 'node server-emergency.js'"
echo "- Ensure nixpacks.toml uses the full package.json not package-minimal.json"
echo "- Check Procfile also uses 'node server.js'"
echo ""
echo "✅ Verification complete!"