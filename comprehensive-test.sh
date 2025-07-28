#!/bin/bash

echo "🧪 Comprehensive Finding Sports Test Suite"
echo "=========================================="
echo ""

BASE_URL="https://findingsports.com"

# Function to check element presence
check_element() {
    local url="$1"
    local element="$2"
    local should_exist="$3"
    
    echo -n "Checking $element... "
    
    if curl -s "$url" | grep -q "$element"; then
        if [ "$should_exist" = "true" ]; then
            echo "✅ Found (as expected)"
            return 0
        else
            echo "❌ Found (should NOT exist)"
            return 1
        fi
    else
        if [ "$should_exist" = "false" ]; then
            echo "✅ Not found (as expected)"
            return 0
        else
            echo "❌ Not found (should exist)"
            return 1
        fi
    fi
}

echo "📋 Test 1: Header Elements Check"
echo "--------------------------------"
check_element "$BASE_URL" "Online" "false"
check_element "$BASE_URL" "🌐" "false"
check_element "$BASE_URL" ">Help<" "false"
check_element "$BASE_URL" "Login" "true"

echo ""
echo "📋 Test 2: Script Inclusion Check"
echo "---------------------------------"
check_element "$BASE_URL" "aggressive-header-cleaner.js" "true"
check_element "$BASE_URL" "map-force-init.js" "true"
check_element "$BASE_URL" "remove-header-elements.js" "true"

echo ""
echo "📋 Test 3: Map Container Check"
echo "------------------------------"
check_element "$BASE_URL" 'id="map"' "true"
check_element "$BASE_URL" "maplibre-gl.js" "true"

echo ""
echo "📋 Test 4: API Response Check"
echo "-----------------------------"
echo -n "Checking games API... "
GAMES_COUNT=$(curl -s "$BASE_URL/api/games" | grep -o '"id"' | wc -l)
if [ "$GAMES_COUNT" -gt 2 ]; then
    echo "✅ Returns $GAMES_COUNT games (>2)"
else
    echo "❌ Returns only $GAMES_COUNT games"
fi

echo ""
echo "📋 Test 5: Play Now Check"
echo "-------------------------"
echo -n "Checking play-now API... "
PLAY_NOW_COUNT=$(curl -s "$BASE_URL/api/play-now?lat=49.2827&lng=-123.1207" | grep -o '"sport"' | wc -l)
if [ "$PLAY_NOW_COUNT" -gt 2 ]; then
    echo "✅ Returns $PLAY_NOW_COUNT games (>2)"
else
    echo "❌ Returns only $PLAY_NOW_COUNT games"
fi

echo ""
echo "=========================================="
echo "📊 Test Summary Complete"
echo ""
echo "⚠️  IMPORTANT: Visual verification with screenshots is still required!"
echo "🔗 Visit: $BASE_URL"