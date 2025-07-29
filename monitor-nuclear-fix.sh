#!/bin/bash

echo "🚀 MONITORING NUCLEAR FIX DEPLOYMENT"
echo "===================================="
echo "Starting at: $(date)"
echo ""

# Function to check deployment
check_deployment() {
    echo -e "\n⏰ Check at $(date '+%H:%M:%S')"
    echo "------------------------"
    
    # Check deployment version
    echo -n "✓ Deployment version: "
    VERSION=$(curl -s -m 5 https://findingsports.com/ | grep -o 'deployment-version" content="[^"]*' | cut -d'"' -f4)
    if [[ "$VERSION" == "2025-01-29-cache-busting-fix" ]]; then
        echo "✅ LATEST ($VERSION)"
    else
        echo "❌ OLD ($VERSION)"
    fi
    
    # Check for language selector
    echo -n "✓ Language selector removed: "
    if curl -s -m 5 https://findingsports.com/ | grep -q "🌐 English"; then
        echo "❌ Still visible!"
    else
        echo "✅ Removed!"
    fi
    
    # Check for help button
    echo -n "✓ Help button removed: "
    if curl -s -m 5 https://findingsports.com/ | grep -q "? Help"; then
        echo "❌ Still visible!"
    else
        echo "✅ Removed!"
    fi
    
    # Check nuclear fix is loaded
    echo -n "✓ Nuclear fix script: "
    if curl -s -m 5 https://findingsports.com/ | grep -q "ultimate-nuclear-fix.js"; then
        echo "✅ Loaded!"
    else
        echo "⏳ Not loaded"
    fi
    
    # Check i18n CSS is removed
    echo -n "✓ i18n CSS removed: "
    if curl -s -m 5 https://findingsports.com/ | grep -q '<link.*i18n-rtl.css' | grep -v "<!--"; then
        echo "❌ Still loading!"
    else
        echo "✅ Removed!"
    fi
}

# Run check
check_deployment

echo -e "\n🎯 Visit https://findingsports.com/ to visually verify:"
echo "1. No language selector (🌐 English ▼)"
echo "2. No help button (? Help)"
echo "3. Map is functioning"
echo "4. Games are displaying"