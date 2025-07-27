#!/bin/bash

echo "🚀 FINAL DEPLOYMENT MONITORING"
echo "=============================="
echo "Started at: $(date)"
echo ""

success=false
attempt=0

while [ "$success" = false ]; do
    attempt=$((attempt + 1))
    echo -n "[$attempt] $(date +%H:%M:%S) - "
    
    response=$(curl -s -m 10 https://findingsports.com 2>/dev/null)
    
    if [ -z "$response" ]; then
        echo "⏳ No response yet..."
    elif echo "$response" | grep -q "<!DOCTYPE\|<!doctype\|<html"; then
        echo "✅ SUCCESS! HTML DETECTED!"
        success=true
        
        echo ""
        echo "🎉 🎉 🎉 DEPLOYMENT SUCCESSFUL! 🎉 🎉 🎉"
        echo ""
        echo "Completed at: $(date)"
        echo ""
        
        # Quick verification
        echo "📊 Quick Verification:"
        echo -n "  • HTML served at root: ✅"
        echo ""
        
        # Test a few key things
        if echo "$response" | grep -q "language-selector\|fa-globe"; then
            echo "  • Language selector: ❌ Still present"
        else
            echo "  • Language selector: ✅ Removed"
        fi
        
        if echo "$response" | grep -q "maplibre"; then
            echo "  • MapLibre: ✅ Loaded"
        else
            echo "  • MapLibre: ❌ Not found"
        fi
        
        # Screenshot command
        echo ""
        echo "📸 To take a screenshot:"
        echo "gnome-screenshot -w -f deployment-success.png"
        echo ""
        echo "🌐 Site is live at: https://findingsports.com"
        
    elif echo "$response" | grep -q "502\|Application failed"; then
        echo "🔄 Building/deploying..."
    else
        echo "📦 Response received: ${response:0:50}..."
    fi
    
    if [ "$success" = false ]; then
        sleep 10
    fi
    
    if [ $attempt -gt 60 ]; then
        echo ""
        echo "⚠️ Timeout after 10 minutes"
        exit 1
    fi
done