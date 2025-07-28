#!/bin/bash

echo "🔍 Verifying Language/Help Button Removal from FindingSports.com"
echo "==============================================================="

# Function to check for problematic elements
check_elements() {
    echo -e "\n📡 Checking HTML content..."
    
    # Check if language-service.js is loaded
    echo -n "❓ language-service.js script tag: "
    if curl -s https://findingsports.com/ | grep -q "language-service.js"; then
        echo "❌ STILL PRESENT!"
    else
        echo "✅ Removed"
    fi
    
    # Check if i18n-service.js is loaded
    echo -n "❓ i18n-service.js script tag: "
    if curl -s https://findingsports.com/ | grep -q "i18n-service.js"; then
        echo "❌ STILL PRESENT!"
    else
        echo "✅ Removed"
    fi
    
    # Check if enhanced-nuclear-fix.js is loaded
    echo -n "❓ enhanced-nuclear-fix.js: "
    if curl -s https://findingsports.com/ | grep -q "enhanced-nuclear-fix.js"; then
        echo "✅ Present (good!)"
    else
        echo "❌ MISSING!"
    fi
    
    # Check for problematic text in HTML
    echo -e "\n🔍 Checking for problematic UI elements..."
    
    echo -n "❓ '🌐 English' text: "
    if curl -s https://findingsports.com/ | grep -q "🌐.*English"; then
        echo "❌ FOUND in HTML!"
    else
        echo "✅ Not in HTML"
    fi
    
    echo -n "❓ '? Help' text: "
    if curl -s https://findingsports.com/ | grep -q "\\?.*Help"; then
        echo "❌ FOUND in HTML!"
    else
        echo "✅ Not in HTML"
    fi
    
    echo -n "❓ 'language-selector' class: "
    if curl -s https://findingsports.com/ | grep -q "language-selector"; then
        echo "❌ FOUND in HTML!"
    else
        echo "✅ Not in HTML"
    fi
    
    echo -n "❓ 'help-button' class: "
    if curl -s https://findingsports.com/ | grep -q "help-button"; then
        echo "❌ FOUND in HTML!"
    else
        echo "✅ Not in HTML"
    fi
}

# Initial check
echo -e "\n⏰ Initial check at $(date)"
check_elements

# Wait and check again
echo -e "\n⏳ Waiting 30 seconds for deployment..."
sleep 30

echo -e "\n⏰ Second check at $(date)"
check_elements

# Wait and final check
echo -e "\n⏳ Waiting another 30 seconds..."
sleep 30

echo -e "\n⏰ Final check at $(date)"
check_elements

echo -e "\n📊 Summary:"
echo "==========="
echo "If all checks show ✅, the fix is successfully deployed!"
echo "If any show ❌, there may still be issues to address."
echo -e "\n🌐 Visit https://findingsports.com/ to visually verify"