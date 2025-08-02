#!/bin/bash

echo "🔍 ULTIMATE WHITE SCREEN DIAGNOSTIC"
echo "==================================="
echo ""

# Get the page
curl -s https://findingsports.com > current-page.html 2>/dev/null

# 1. Check if map container is hidden
echo "1. Checking map container..."
if grep -q 'id="map"' current-page.html; then
    echo "   ✅ Map container exists"
    # Check if maplibre CSS is loaded
    if grep -q 'maplibre-gl.css' current-page.html; then
        echo "   ✅ MapLibre CSS is referenced"
    else
        echo "   ❌ MapLibre CSS NOT loaded - this could cause white screen!"
    fi
else
    echo "   ❌ No map container found!"
fi

# 2. Check if critical CSS files are loading
echo ""
echo "2. Checking CSS files..."
CSS_FILES=$(grep -o 'href="[^"]*\.css[^"]*"' current-page.html | sed 's/href="//' | sed 's/"//')
for css in $CSS_FILES; do
    echo "   Checking: $css"
    # Test if CSS file loads
    if [[ $css == /* ]]; then
        CSS_URL="https://findingsports.com$css"
    else
        CSS_URL="https://findingsports.com/$css"
    fi
    
    CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CSS_URL")
    if [ "$CSS_STATUS" = "200" ]; then
        echo "   ✅ Loads successfully"
    else
        echo "   ❌ FAILED TO LOAD (Status: $CSS_STATUS)"
    fi
done

# 3. Check JavaScript loading order
echo ""
echo "3. Checking JavaScript loading order..."
grep -o 'src="[^"]*\.js[^"]*"' current-page.html | while read -r script; do
    SCRIPT_FILE=$(echo $script | sed 's/src="//' | sed 's/"//')
    echo "   $SCRIPT_FILE"
done

# 4. Look for the specific white screen cause
echo ""
echo "4. Finding root cause..."

# Check if body has content
BODY_CONTENT=$(sed -n '/<body/,/<\/body>/p' current-page.html)
if echo "$BODY_CONTENT" | grep -q "app-container"; then
    echo "   ✅ App container present"
else
    echo "   ❌ No app container!"
fi

# Check for loading state
if echo "$BODY_CONTENT" | grep -q "loading"; then
    echo "   ⚠️  Page might be stuck in loading state"
fi

# 5. Create fixed version
echo ""
echo "5. Creating fixed test page..."

# Create a version that definitely shows content
cat > fixed-test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Finding Sports - Fixed Test</title>
    <meta charset="UTF-8">
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: white !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        .header {
            background: #333;
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .content {
            padding: 20px;
            text-align: center;
        }
        * {
            display: revert !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏃 Finding Sports</h1>
        <button style="background: orange; color: white; padding: 10px 20px; border: none; cursor: pointer;">Login</button>
    </div>
    <div class="content">
        <h2>✅ If you can see this, the Nuclear Fix CSS was hiding everything!</h2>
        <p>The site content exists but was being hidden by overly aggressive CSS rules.</p>
        
        <h3>Original Content that was hidden:</h3>
        <div style="background: #f0f0f0; padding: 20px; margin: 20px 0;">
EOF

# Extract visible text from original
sed -n '/<body/,/<\/body>/p' current-page.html | sed 's/<[^>]*>//g' | grep -v "^[[:space:]]*$" | head -20 >> fixed-test.html

cat >> fixed-test.html << 'EOF'
        </div>
        
        <h3>To Fix:</h3>
        <ol>
            <li>The Nuclear Fix CSS is too aggressive</li>
            <li>Or MapLibre CSS is not loading</li>
            <li>Or there's a JavaScript error preventing render</li>
        </ol>
    </div>
</body>
</html>
EOF

echo "   ✅ Created fixed-test.html"

# 6. The real issue
echo ""
echo "==================================="
echo "🎯 MOST LIKELY CAUSE:"
echo ""

# Check for the smoking gun
if ! grep -q 'maplibre-gl.css' current-page.html; then
    echo "❌ MapLibre CSS is missing! This will cause a white screen."
    echo "   The map component is trying to render without its styles."
elif grep -q 'display:\s*none.*!important' current-page.html | grep -v "language\|help"; then
    echo "❌ Overly aggressive CSS is hiding content!"
    echo "   Some CSS rule is hiding more than just language/help elements."
else
    echo "❌ JavaScript error is preventing page render."
    echo "   Check browser console for errors."
fi

echo ""
echo "TO TEST:"
echo "1. Open fixed-test.html in your browser"
echo "2. If you see content, we know the issue is CSS"
echo "3. If still blank, it's a deeper JavaScript issue"
echo ""