#!/bin/bash

# Test Railway Backend Deployment
# Run this script to verify your backend is working properly

echo "🚀 Testing Finding Sports Backend on Railway..."
echo "============================================"

# Your domain
DOMAIN="https://findingsports.com"

# Test health endpoint
echo -e "\n1. Testing Health Check..."
curl -s -o /dev/null -w "Health Check: %{http_code}\n" $DOMAIN/health

# Test API status
echo -e "\n2. Testing API Status..."
response=$(curl -s $DOMAIN/api/status)
echo "API Status Response: $response"

# Test Play Now endpoint (Vancouver coordinates)
echo -e "\n3. Testing Play Now API..."
LAT=49.2827
LNG=-123.1207
play_now_url="$DOMAIN/api/play-now?latitude=$LAT&longitude=$LNG&radius=10&sport=all"
echo "Testing: $play_now_url"
response=$(curl -s "$play_now_url")
echo "Play Now Response (first 200 chars): ${response:0:200}..."

# Test static file serving
echo -e "\n4. Testing Static File Serving..."
curl -s -o /dev/null -w "Homepage: %{http_code}\n" $DOMAIN/
curl -s -o /dev/null -w "CSS: %{http_code}\n" $DOMAIN/css/styles.css
curl -s -o /dev/null -w "JS: %{http_code}\n" $DOMAIN/js/app.js

# Test CORS headers
echo -e "\n5. Testing CORS Headers..."
cors_test=$(curl -s -I -X OPTIONS $DOMAIN/api/status -H "Origin: https://findingsports.com" | grep -i "access-control")
echo "CORS Headers:"
echo "$cors_test"

echo -e "\n============================================"
echo "✅ Backend test complete!"
echo ""
echo "Expected results:"
echo "- Health check: 200"
echo "- API status: 200 with JSON response"
echo "- Play Now: 200 with games data"
echo "- Static files: 200"
echo "- CORS headers: Should include Access-Control-Allow-Origin"
echo ""
echo "If any tests fail, check your Railway logs!"