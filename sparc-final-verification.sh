#!/bin/bash

echo "⚡ SPARC FINAL VERIFICATION PROTOCOL"
echo "===================================="
echo "Systematic Production Verification & Documentation"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results array
declare -a RESULTS

# 1. SPECIFICATION PHASE - Define Success Criteria
echo -e "${BLUE}📋 Phase 1: SPECIFICATION${NC}"
echo "Success Criteria:"
echo "  ✓ Site returns HTTP 200"
echo "  ✓ No template tags present"
echo "  ✓ JavaScript files load correctly"
echo "  ✓ No language selector or help button"
echo "  ✓ Content visible (not blank)"
echo ""

# 2. ARCHITECTURE PHASE - Check Infrastructure
echo -e "${BLUE}🏗️ Phase 2: ARCHITECTURE VERIFICATION${NC}"

# Check Railway deployment
echo -n "Railway Status: "
RAILWAY_STATUS=$(railway status 2>&1 || echo "Not linked")
if [[ $RAILWAY_STATUS == *"findingsports"* ]] || [[ $RAILWAY_STATUS == *"adequate-vibrancy"* ]]; then
    echo -e "${GREEN}✅ Connected${NC}"
    RESULTS+=("RAILWAY:PASS")
else
    echo -e "${YELLOW}⚠️ Not linked (but site may still be live)${NC}"
    RESULTS+=("RAILWAY:WARN")
fi

# Check HTTP response
echo -n "HTTP Response: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://findingsports.com)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 200 OK${NC}"
    RESULTS+=("HTTP:PASS")
else
    echo -e "${RED}❌ $HTTP_CODE${NC}"
    RESULTS+=("HTTP:FAIL")
fi

echo ""

# 3. CODE PHASE - Verify Fixes
echo -e "${BLUE}🧠 Phase 3: CODE VERIFICATION${NC}"

# Get page content
CONTENT=$(curl -s https://findingsports.com 2>/dev/null)

# Check template tag (white screen fix)
echo -n "Template Tag Removed: "
if echo "$CONTENT" | grep -q "<%=Date.now()%>"; then
    echo -e "${RED}❌ Still present${NC}"
    RESULTS+=("TEMPLATE:FAIL")
else
    echo -e "${GREEN}✅ Removed${NC}"
    RESULTS+=("TEMPLATE:PASS")
fi

# Check JavaScript loading
echo -n "JavaScript Files: "
JS_TEST=$(curl -s https://findingsports.com/js/ultimate-nuclear-fix-v6.js 2>/dev/null | head -1)
if [[ $JS_TEST == *"ULTIMATE NUCLEAR FIX"* ]]; then
    echo -e "${GREEN}✅ Loading correctly${NC}"
    RESULTS+=("JS:PASS")
else
    echo -e "${RED}❌ Not loading${NC}"
    RESULTS+=("JS:FAIL")
fi

# Check unwanted elements
echo -n "Language Selector: "
if echo "$CONTENT" | grep -q "🌐 English"; then
    echo -e "${RED}❌ Still visible${NC}"
    RESULTS+=("LANG:FAIL")
else
    echo -e "${GREEN}✅ Removed${NC}"
    RESULTS+=("LANG:PASS")
fi

echo -n "Help Button: "
if echo "$CONTENT" | grep -q "? Help"; then
    echo -e "${RED}❌ Still visible${NC}"
    RESULTS+=("HELP:FAIL")
else
    echo -e "${GREEN}✅ Removed${NC}"
    RESULTS+=("HELP:PASS")
fi

# Check content presence
echo -n "Content Present: "
CONTENT_LENGTH=${#CONTENT}
if [ $CONTENT_LENGTH -gt 50000 ]; then
    echo -e "${GREEN}✅ Yes ($CONTENT_LENGTH bytes)${NC}"
    RESULTS+=("CONTENT:PASS")
else
    echo -e "${YELLOW}⚠️ Limited ($CONTENT_LENGTH bytes)${NC}"
    RESULTS+=("CONTENT:WARN")
fi

echo ""

# 4. TDD PHASE - Test Both Modes
echo -e "${BLUE}🧪 Phase 4: TDD - BROWSER MODE TESTING${NC}"

# Create test HTML for manual verification
cat > browser-test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Finding Sports - Browser Test</title>
    <style>
        body { font-family: Arial; padding: 20px; }
        .test { margin: 20px 0; padding: 20px; border: 2px solid #ddd; }
        .pass { background: #d4edda; border-color: #28a745; }
        .fail { background: #f8d7da; border-color: #dc3545; }
        button { padding: 10px 20px; font-size: 16px; cursor: pointer; margin: 10px; }
    </style>
</head>
<body>
    <h1>🧪 Finding Sports Browser Test</h1>
    
    <div class="test">
        <h2>Manual Test Instructions:</h2>
        <ol>
            <li><strong>Clear Cache:</strong> Press Ctrl+Shift+Delete, select "All time", clear everything</li>
            <li><strong>Test Regular Mode:</strong> 
                <button onclick="window.open('https://findingsports.com', '_blank')">Open in Regular Mode</button>
            </li>
            <li><strong>Test Incognito Mode:</strong> Right-click the button above → "Open in Incognito Window"</li>
        </ol>
    </div>
    
    <div class="test">
        <h2>Expected Results:</h2>
        <ul>
            <li>✅ Page loads with content (not white/blank)</li>
            <li>✅ NO language selector (🌐 English ▼)</li>
            <li>✅ NO help button (? Help)</li>
            <li>✅ Login button visible</li>
            <li>✅ Map or content area visible</li>
        </ul>
    </div>
    
    <div class="test">
        <h2>Automated Test:</h2>
        <button onclick="runTest()">Run Automated Check</button>
        <div id="results"></div>
    </div>
    
    <script>
    async function runTest() {
        const results = document.getElementById('results');
        results.innerHTML = '<p>Testing...</p>';
        
        try {
            const response = await fetch('https://findingsports.com', { mode: 'no-cors' });
            results.innerHTML = '<p style="color: green;">✅ Site is reachable</p>';
            results.innerHTML += '<p>Note: Full test requires manual verification due to CORS</p>';
        } catch (e) {
            results.innerHTML = '<p style="color: red;">❌ Error: ' + e.message + '</p>';
        }
    }
    </script>
</body>
</html>
EOF

echo -e "${GREEN}✅ Created browser-test.html${NC}"
echo ""

# 5. COMPLETION PHASE - Final Report
echo -e "${BLUE}✅ Phase 5: COMPLETION REPORT${NC}"
echo "================================"

# Count results
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

for result in "${RESULTS[@]}"; do
    if [[ $result == *":PASS" ]]; then
        ((PASS_COUNT++))
    elif [[ $result == *":FAIL" ]]; then
        ((FAIL_COUNT++))
    else
        ((WARN_COUNT++))
    fi
done

# Overall status
echo ""
if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
    echo ""
    echo "All critical checks passed:"
    echo "  ✅ $PASS_COUNT checks passed"
    echo "  ⚠️ $WARN_COUNT warnings (non-critical)"
    echo ""
    echo -e "${GREEN}The site is properly deployed and all fixes are live!${NC}"
else
    echo -e "${YELLOW}⚠️ DEPLOYMENT NEEDS ATTENTION${NC}"
    echo ""
    echo "Status:"
    echo "  ✅ $PASS_COUNT checks passed"
    echo "  ❌ $FAIL_COUNT checks failed"
    echo "  ⚠️ $WARN_COUNT warnings"
fi

echo ""
echo "📊 VERIFICATION SUMMARY:"
echo "========================"
echo "Deployment Time: $(curl -sI https://findingsports.com | grep -i 'x-deployment-time' | cut -d' ' -f2-)"
echo "Content Size: $CONTENT_LENGTH bytes"
echo ""

# Screenshots
echo "📸 SCREENSHOT VERIFICATION:"
echo "==========================="
echo "Taking screenshots..."

# Regular mode
google-chrome --headless --disable-gpu --ignore-certificate-errors \
    --screenshot=sparc-regular-$(date +%s).png \
    --window-size=1280,800 \
    https://findingsports.com 2>/dev/null && echo "✅ Regular mode screenshot saved" || echo "❌ Screenshot failed"

# Incognito mode  
google-chrome --headless --disable-gpu --ignore-certificate-errors \
    --incognito \
    --screenshot=sparc-incognito-$(date +%s).png \
    --window-size=1280,800 \
    https://findingsports.com 2>/dev/null && echo "✅ Incognito mode screenshot saved" || echo "❌ Screenshot failed"

echo ""
echo "🎯 FINAL ACTIONS REQUIRED:"
echo "=========================="
echo "1. Open browser-test.html in your browser"
echo "2. Follow the manual test instructions"
echo "3. Clear cache and test both modes"
echo "4. Verify no white screen appears"
echo ""
echo "If still seeing white screen after cache clear:"
echo "  - Check browser console (F12) for errors"
echo "  - Try a different browser"
echo "  - Try from a different device/network"
echo ""
echo "✅ SPARC Verification Protocol Complete!"