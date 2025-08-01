#!/bin/bash

echo "🔍 REAL-TIME SITE VERIFICATION"
echo "=============================="
echo "Time: $(date)"
echo ""

# Force fresh request with no cache
echo "1. Checking Regular Browser View..."
REGULAR=$(curl -s -H "Cache-Control: no-cache, no-store, must-revalidate" -H "Pragma: no-cache" -H "Expires: 0" https://findingsports.com/)

echo "   Checking for unwanted elements..."
if echo "$REGULAR" | grep -q "🌐 English"; then
    echo "   ❌ LANGUAGE SELECTOR STILL VISIBLE!"
else
    echo "   ✅ Language selector removed"
fi

if echo "$REGULAR" | grep -q "? Help"; then
    echo "   ❌ HELP BUTTON STILL VISIBLE!"
else
    echo "   ✅ Help button removed"
fi

echo ""
echo "2. Checking JavaScript Files..."
JS_CHECK=$(curl -s -I https://findingsports.com/js/ultimate-nuclear-fix-v6.js | grep "Content-Type")
if echo "$JS_CHECK" | grep -q "javascript"; then
    echo "   ✅ Nuclear Fix v6 serves as JavaScript"
else
    echo "   ❌ Nuclear Fix v6 returns wrong content type"
fi

INCOG_CHECK=$(curl -s -I https://findingsports.com/js/incognito-fix.js | grep "Content-Type")
if echo "$INCOG_CHECK" | grep -q "javascript"; then
    echo "   ✅ Incognito Fix serves as JavaScript"
else
    echo "   ❌ Incognito Fix returns wrong content type"
fi

echo ""
echo "3. Checking actual page content..."
echo "   First 20 lines of visible text:"
echo "   --------------------------------"
echo "$REGULAR" | sed 's/<[^>]*>//g' | grep -v "^[[:space:]]*$" | head -20

echo ""
echo "4. Checking for Nuclear Fix in HTML..."
if echo "$REGULAR" | grep -q "ultimate-nuclear-fix-v6.js"; then
    echo "   ✅ Nuclear Fix v6 referenced in HTML"
    echo "$REGULAR" | grep "ultimate-nuclear-fix" | head -1
else
    echo "   ❌ Nuclear Fix v6 NOT in HTML!"
fi

echo ""
echo "5. Checking deployment timestamp..."
TIMESTAMP=$(echo "$REGULAR" | grep -o "v=[0-9]*" | head -1)
echo "   Current version: $TIMESTAMP"

echo ""
echo "6. Testing incognito mode simulation..."
INCOGNITO=$(curl -s -H "Cache-Control: no-cache" -H "Cookie: " -H "User-Agent: Mozilla/5.0 (Private)" https://findingsports.com/)
INCOG_LENGTH=${#INCOGNITO}
echo "   Page size: $INCOG_LENGTH bytes"

if [ $INCOG_LENGTH -lt 1000 ]; then
    echo "   ❌ INCOGNITO MODE SHOWS BLANK PAGE!"
else
    echo "   ✅ Incognito mode has content"
fi

echo ""
echo "=============================="
echo "SUMMARY:"
echo ""

# Create a simple visual representation
echo "WHAT YOU SEE IN BROWSER:"
echo "------------------------"
if echo "$REGULAR" | grep -q "🌐 English"; then
    echo "Header: Finding Sports     [🌐 English ▼] [? Help] [Login]"
    echo "        ^^^^ PROBLEM - Old version still showing!"
else
    echo "Header: Finding Sports                              [Login]"
    echo "        ^^^^ Good - Clean header!"
fi

echo ""
echo "Raw HTML check for language selector:"
curl -s https://findingsports.com/ | grep -C2 "🌐" | head -10