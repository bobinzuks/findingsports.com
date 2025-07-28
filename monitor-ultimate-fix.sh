#!/bin/bash

echo "🚀 MONITORING ULTIMATE NUCLEAR FIX v3.0 DEPLOYMENT"
echo "================================================"
echo "Starting at: $(date)"
echo ""

# Function to check deployment
check_deployment() {
    echo -e "\n⏰ Check at $(date '+%H:%M:%S')"
    echo "------------------------"
    
    # Check if ultimate-nuclear-fix.js is loaded
    echo -n "✓ ultimate-nuclear-fix.js: "
    if curl -s -m 5 https://findingsports.com/ | grep -q "ultimate-nuclear-fix.js"; then
        echo "✅ DEPLOYED!"
    else
        echo "⏳ Not yet..."
    fi
    
    # Check if old enhanced version is gone
    echo -n "✓ enhanced-nuclear-fix removed: "
    if curl -s -m 5 https://findingsports.com/ | grep -q "enhanced-nuclear-fix.js"; then
        echo "❌ Still present"
    else
        echo "✅ Removed!"
    fi
    
    # Check if language scripts are gone
    echo -n "✓ language-service.js removed: "
    if curl -s -m 5 https://findingsports.com/ | grep -q "<script.*language-service.js"; then
        echo "❌ Still loading!"
    else
        echo "✅ Not loading!"
    fi
    
    echo -n "✓ i18n-service.js removed: "
    if curl -s -m 5 https://findingsports.com/ | grep -q "<script.*i18n-service.js"; then
        echo "❌ Still loading!"
    else
        echo "✅ Not loading!"
    fi
}

# Monitor for 5 minutes
end_time=$(($(date +%s) + 300))

while [ $(date +%s) -lt $end_time ]; do
    check_deployment
    
    # Check if fully deployed
    if curl -s -m 5 https://findingsports.com/ | grep -q "ultimate-nuclear-fix.js" && \
       ! curl -s -m 5 https://findingsports.com/ | grep -q "enhanced-nuclear-fix.js" && \
       ! curl -s -m 5 https://findingsports.com/ | grep -q "<script.*language-service.js"; then
        echo -e "\n🎉 ULTIMATE FIX FULLY DEPLOYED!"
        echo "Visit https://findingsports.com/ to verify visually"
        break
    fi
    
    sleep 20
done

echo -e "\n📊 Final Status at $(date)"
check_deployment