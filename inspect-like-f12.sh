#!/bin/bash

echo "🔍 F12 DEVELOPER TOOLS SIMULATION"
echo "================================="
echo ""

# 1. Check what's in the page HTML
echo "1. Checking page structure..."
PAGE_HTML=$(curl -s https://findingsports.com)

# Check if body has content
if echo "$PAGE_HTML" | grep -q '<div class="app-container">'; then
    echo "   ✅ Page has app-container div"
else
    echo "   ❌ No app-container found!"
fi

# 2. Check computed styles
echo ""
echo "2. Checking for hiding CSS..."
HIDING_CSS=$(echo "$PAGE_HTML" | grep -E "(body\s*{[^}]*display:\s*none|\.app-container\s*{[^}]*display:\s*none)" | head -5)
if [ -n "$HIDING_CSS" ]; then
    echo "   ❌ Found CSS hiding content:"
    echo "$HIDING_CSS"
else
    echo "   ✅ No CSS hiding body or app-container"
fi

# 3. Check JavaScript errors by looking at script content
echo ""
echo "3. Checking for problematic JavaScript..."

# Check if Nuclear Fix might be too aggressive
echo ""
echo "4. Checking Nuclear Fix behavior..."
NUCLEAR_FIX=$(curl -s https://findingsports.com/js/ultimate-nuclear-fix-v6.js 2>/dev/null)

# Look for selectors that might hide everything
if echo "$NUCLEAR_FIX" | grep -q "body.*display.*none"; then
    echo "   ❌ Nuclear Fix might be hiding body!"
else
    echo "   ✅ Nuclear Fix not hiding body"
fi

# Check for overly broad selectors
echo ""
echo "5. Looking for overly broad CSS selectors..."
BROAD_SELECTORS=$(echo "$PAGE_HTML" | grep -E "(\*\s*{[^}]*display:\s*none|\*\s*{[^}]*visibility:\s*hidden)" | head -5)
if [ -n "$BROAD_SELECTORS" ]; then
    echo "   ❌ Found broad selectors hiding everything:"
    echo "$BROAD_SELECTORS"
fi

# 6. Check what text should be visible
echo ""
echo "6. Extracting visible text from HTML..."
# Remove script and style tags, then get text
VISIBLE_TEXT=$(echo "$PAGE_HTML" | sed 's/<script[^>]*>.*<\/script>//g' | sed 's/<style[^>]*>.*<\/style>//g' | sed 's/<[^>]*>//g' | grep -v "^[[:space:]]*$" | head -20)

if [ -n "$VISIBLE_TEXT" ]; then
    echo "   Text that SHOULD be visible:"
    echo "$VISIBLE_TEXT" | head -10
else
    echo "   ❌ No text content found!"
fi

# 7. The smoking gun - check for specific issues
echo ""
echo "7. ROOT CAUSE ANALYSIS..."

# Check if the Nuclear Fix CSS is too aggressive
NUCLEAR_CSS=$(echo "$PAGE_HTML" | grep -A20 "NUCLEAR CSS" | grep -E "(display:\s*none|visibility:\s*hidden|opacity:\s*0)" | head -10)
if [ -n "$NUCLEAR_CSS" ]; then
    echo "   🔴 FOUND PROBLEMATIC CSS:"
    echo "$NUCLEAR_CSS"
fi

# Create a test HTML file without the nuclear fix
echo ""
echo "8. Creating test page WITHOUT Nuclear Fix..."
echo "$PAGE_HTML" | sed 's/<script src="js\/ultimate-nuclear-fix-v6.js[^"]*"><\/script>//g' > test-without-nuclear.html
echo "   Saved to: test-without-nuclear.html"
echo "   Open this file in your browser to see if Nuclear Fix is the problem"

echo ""
echo "========================================="
echo "DIAGNOSIS COMPLETE"
echo ""
echo "To view the test page without Nuclear Fix:"
echo "  firefox test-without-nuclear.html"
echo "  (or open in any browser)"
echo ""