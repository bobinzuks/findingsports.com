#!/bin/bash

# Finding Sports Screenshot Testing Script
# Takes screenshots of the live site for Phase 1 testing

echo "🧪 Finding Sports - Firefox Screenshot Testing"
echo "=============================================="

# Base URL
BASE_URL="https://findingsports.com"
DOWNLOADS_DIR="$HOME/Downloads"

# Function to take screenshot
take_screenshot() {
    local test_name="$1"
    local url="$2"
    local wait_time="${3:-5}"
    
    echo ""
    echo "📸 Test: $test_name"
    echo "🌐 Opening: $url"
    
    # Open Firefox with the URL
    firefox "$url" &
    
    # Wait for page to load
    echo "⏳ Waiting $wait_time seconds for page load..."
    sleep $wait_time
    
    # Take screenshot with gnome-screenshot
    timestamp=$(date +"%Y-%m-%d at %H-%M-%S")
    filename="Screenshot $timestamp Finding Sports - $test_name.png"
    
    echo "📸 Taking screenshot..."
    gnome-screenshot -w -f "$DOWNLOADS_DIR/$filename"
    
    if [ $? -eq 0 ]; then
        echo "✅ Saved: $filename"
    else
        echo "❌ Screenshot failed for $test_name"
    fi
    
    # Small pause between tests
    sleep 2
}

# Phase 1 Tests
echo ""
echo "🔍 PHASE 1 TESTING - Taking Screenshots"
echo "======================================="

# Test 1: Homepage - Check header elements
take_screenshot "Test1-Header-Elements" "$BASE_URL" 7

# Test 2: Homepage - Check map
take_screenshot "Test2-Map-Check" "$BASE_URL" 5

# Test 3: Play Now functionality
echo ""
echo "📋 For Test 3: Please click the Play Now button manually"
echo "⏳ Waiting 10 seconds for you to click Play Now..."
sleep 10
take_screenshot "Test3-Play-Now-Results" "$BASE_URL" 5

# Test 4: Login button check
take_screenshot "Test4-Login-Button" "$BASE_URL" 5

# Test 5: Login page
take_screenshot "Test5-Login-Page" "$BASE_URL/login.html" 5

# Test 6: (Requires login first)
echo ""
echo "📋 For Test 6: Please login first with demo@example.com / demo123"
echo "⏳ Waiting 15 seconds for login..."
sleep 15
take_screenshot "Test6-Logged-In-PlayNow" "$BASE_URL" 5

# Test 7: Social Feed
echo ""
echo "📋 For Test 7: Please navigate to Social Feed"
echo "⏳ Waiting 10 seconds..."
sleep 10
take_screenshot "Test7-Social-Feed" "$BASE_URL" 5

# Test 8: Upcoming Games
take_screenshot "Test8-Upcoming-Games" "$BASE_URL/upcoming-games.html" 5

# Test 9: Sport Rules  
take_screenshot "Test9-Sport-Rules" "$BASE_URL/sport-rules.html" 5

# Test 10: Community Hub
take_screenshot "Test10-Community-Hub" "$BASE_URL/community.html" 5

echo ""
echo "=============================================="
echo "📊 Screenshot Testing Complete!"
echo "📁 All screenshots saved to: $DOWNLOADS_DIR"
echo ""
echo "🔍 Please review each screenshot to verify:"
echo "1. ❌ Language selector, online indicator, help button removed"
echo "2. ✅ Map renders properly (not gray)"
echo "3. ✅ Play Now shows >2 games"
echo "4. ✅ Login button present in header"
echo "5. ✅ Login/admin functionality works"
echo "6. ✅ Search and Play Now work when logged in"
echo "7. ✅ Social Feed allows posting"
echo "8. ✅ Upcoming Games loads"
echo "9. ✅ Sport Rules loads"
echo "10. ✅ Community Hub loads"