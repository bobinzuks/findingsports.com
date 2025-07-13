#!/bin/bash

# Railway Deployment Verification Script
# Verifies that cache fixes are working after deployment

echo "🔍 Railway Deployment Verification"
echo "=================================="

# Get the URL from user or use default
read -p "Enter your Railway app URL (or press Enter for localhost:8080): " RAILWAY_URL
RAILWAY_URL=${RAILWAY_URL:-"http://localhost:8080"}

echo "🌐 Testing URL: $RAILWAY_URL"
echo ""

# Test 1: Health check endpoint
echo "🏥 Test 1: Health Check"
echo "----------------------"
HEALTH_RESPONSE=$(curl -s -I "$RAILWAY_URL/api/health" 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ Health endpoint accessible"
    if echo "$HEALTH_RESPONSE" | grep -q "no-cache"; then
        echo "✅ No-cache headers present"
    else
        echo "❌ No-cache headers missing"
    fi
else
    echo "❌ Health endpoint failed"
fi
echo ""

# Test 2: Cache test endpoint
echo "🧪 Test 2: Cache Test Endpoint"
echo "------------------------------"
CACHE_TEST=$(curl -s "$RAILWAY_URL/api/cache-test" 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ Cache test endpoint accessible"
    echo "Response sample: $(echo "$CACHE_TEST" | head -c 100)..."
else
    echo "❌ Cache test endpoint failed"
fi
echo ""

# Test 3: Main page headers
echo "🏠 Test 3: Main Page Headers"
echo "----------------------------"
MAIN_HEADERS=$(curl -s -I "$RAILWAY_URL/" 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ Main page accessible"
    
    if echo "$MAIN_HEADERS" | grep -q "no-cache"; then
        echo "✅ No-cache headers on main page"
    else
        echo "❌ No-cache headers missing on main page"
    fi
    
    if echo "$MAIN_HEADERS" | grep -q "X-Deployment-Time"; then
        echo "✅ Deployment timestamp header present"
    else
        echo "❌ Deployment timestamp header missing"
    fi
else
    echo "❌ Main page failed"
fi
echo ""

# Test 4: Static asset with version
echo "📦 Test 4: Versioned Static Asset"
echo "---------------------------------"
ASSET_HEADERS=$(curl -s -I "$RAILWAY_URL/js/config.js" 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ Static asset accessible"
    
    if echo "$ASSET_HEADERS" | grep -q "no-cache"; then
        echo "✅ No-cache headers on static assets"
    else
        echo "❌ No-cache headers missing on static assets"
    fi
else
    echo "❌ Static asset failed"
fi
echo ""

# Test 5: Deleted file (should 404)
echo "🗑️ Test 5: Deleted File Check"
echo "-----------------------------"
DELETED_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/js/immediate-button-fix.js" 2>/dev/null)
if [[ "$DELETED_RESPONSE" == "404" ]]; then
    echo "✅ Deleted file correctly returns 404"
else
    echo "❌ Deleted file still accessible (cache issue): HTTP $DELETED_RESPONSE"
fi
echo ""

# Test 6: Browser simulation
echo "🌐 Test 6: Browser Simulation"
echo "-----------------------------"
USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
BROWSER_RESPONSE=$(curl -s -H "User-Agent: $USER_AGENT" -I "$RAILWAY_URL/" 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "✅ Browser simulation successful"
    
    if echo "$BROWSER_RESPONSE" | grep -q "200 OK"; then
        echo "✅ Returns HTTP 200 OK"
    else
        echo "❌ Does not return HTTP 200 OK"
    fi
else
    echo "❌ Browser simulation failed"
fi
echo ""

# Summary
echo "📋 Verification Summary"
echo "======================"
echo ""
echo "🔗 Test your site manually:"
echo "1. Open incognito/private window"
echo "2. Visit: $RAILWAY_URL"
echo "3. Open Developer Tools → Network tab"
echo "4. Refresh page"
echo "5. Check that all requests return HTTP 200 (not 304)"
echo "6. Verify no 404 errors for deleted files"
echo ""
echo "🛠️ If issues persist:"
echo "• Run: railway restart"
echo "• Clear browser cache completely"
echo "• Contact Railway support"
echo "• Check Railway environment variables"
echo ""
echo "✅ Success indicators:"
echo "• No 404 errors"
echo "• Cache-Control: no-cache headers present"
echo "• Updated content visible in incognito mode"
echo "• All assets have version query parameters"