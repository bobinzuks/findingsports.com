#!/bin/bash

echo "🔍 WHITE SCREEN ROOT CAUSE ANALYSIS"
echo "==================================="
echo ""

# 1. Get the full page
echo "1. Downloading page content..."
curl -s -H "User-Agent: Mozilla/5.0" https://findingsports.com > live-page.html 2>/dev/null

# 2. Check if page is actually empty
PAGE_SIZE=$(wc -c < live-page.html)
echo "   Page size: $PAGE_SIZE bytes"

if [ $PAGE_SIZE -lt 1000 ]; then
    echo "   ❌ PAGE IS NEARLY EMPTY!"
    echo "   Content:"
    cat live-page.html
    exit 1
fi

# 3. Extract visible body content
echo ""
echo "2. Extracting body content..."
BODY_CONTENT=$(sed -n '/<body/,/<\/body>/p' live-page.html | sed 's/<[^>]*>//g' | grep -v "^[[:space:]]*$" | head -20)

if [ -z "$BODY_CONTENT" ]; then
    echo "   ❌ NO VISIBLE BODY CONTENT!"
else
    echo "   Body text preview:"
    echo "$BODY_CONTENT" | head -10
fi

# 4. Check for display:none on critical elements
echo ""
echo "3. Checking for hidden elements..."
if grep -q "body.*{.*display:\s*none" live-page.html; then
    echo "   ❌ BODY IS SET TO DISPLAY:NONE!"
fi

if grep -q "\.app-container.*{.*display:\s*none" live-page.html; then
    echo "   ❌ APP-CONTAINER IS HIDDEN!"
fi

# 5. Look for the Nuclear Fix
echo ""
echo "4. Nuclear Fix Analysis..."
NUCLEAR_SCRIPT=$(grep -o 'src="[^"]*nuclear-fix[^"]*"' live-page.html)
if [ -n "$NUCLEAR_SCRIPT" ]; then
    echo "   ✅ Nuclear Fix is loaded: $NUCLEAR_SCRIPT"
    
    # Get the nuclear fix content
    NUCLEAR_URL="https://findingsports.com/$(echo $NUCLEAR_SCRIPT | sed 's/src="//' | sed 's/"//')"
    echo "   Checking Nuclear Fix content..."
    curl -s "$NUCLEAR_URL" > nuclear-fix-live.js 2>/dev/null
    
    # Check if it's hiding too much
    if grep -q "\*.*display.*none" nuclear-fix-live.js; then
        echo "   ⚠️  Nuclear Fix has wildcard hiding rules!"
    fi
else
    echo "   ❌ Nuclear Fix NOT loaded!"
fi

# 6. Check inline styles
echo ""
echo "5. Checking inline CSS..."
INLINE_HIDING=$(grep -o "style=\"[^\"]*display:\s*none[^\"]*\"" live-page.html | head -5)
if [ -n "$INLINE_HIDING" ]; then
    echo "   ❌ Found inline display:none styles:"
    echo "$INLINE_HIDING"
fi

# 7. Create a clean test version
echo ""
echo "6. Creating clean test version..."
# Remove all potential hiding CSS and scripts
sed 's/display:\s*none//g' live-page.html | \
sed 's/visibility:\s*hidden//g' | \
sed 's/opacity:\s*0//g' | \
sed '/<script.*nuclear-fix/,/<\/script>/d' > test-no-hiding.html

echo "   ✅ Created test-no-hiding.html"
echo "   Open this file to see if content appears!"

# 8. Final diagnosis
echo ""
echo "==================================="
echo "DIAGNOSIS:"
echo ""

if [ $PAGE_SIZE -lt 1000 ]; then
    echo "❌ The server is returning an empty or error page"
elif [ -z "$BODY_CONTENT" ]; then
    echo "❌ The page loads but all content is hidden by CSS"
else
    echo "✅ The page has content that should be visible"
fi

echo ""
echo "TO FIX:"
echo "1. Open test-no-hiding.html in your browser"
echo "2. If you see content, the Nuclear Fix CSS is too aggressive"
echo "3. If still blank, there's a JavaScript error preventing render"
echo ""
echo "Files created:"
echo "  - live-page.html (current page source)"
echo "  - nuclear-fix-live.js (nuclear fix script)"
echo "  - test-no-hiding.html (page without hiding CSS)"