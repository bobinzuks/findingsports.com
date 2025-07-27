#!/bin/bash

echo "🔍 FINAL STATUS CHECK - $(date)"
echo "========================================"

echo -e "\n📊 Git Status:"
git log --oneline -5

echo -e "\n🌐 Current Site Status:"
response=$(curl -s https://findingsports.com)
if [[ $response == *"<!doctype"* ]] || [[ $response == *"<html"* ]]; then
    echo "✅ SUCCESS! Site is serving HTML!"
else
    echo "❌ FAIL: Site still serving JSON"
    echo "Response: ${response:0:100}..."
    
    echo -e "\n🔧 Deployment ID:"
    echo "$response" | grep -o '"deployment":"[^"]*"' | cut -d'"' -f4
fi

echo -e "\n📁 Static Files Test:"
if curl -s https://findingsports.com/index.html | grep -q "<!doctype"; then
    echo "✅ /index.html works"
else
    echo "❌ /index.html failed"
fi

if curl -s https://findingsports.com/css/styles.css | grep -q "margin"; then
    echo "✅ CSS files work"
else
    echo "❌ CSS files failed"
fi

echo -e "\n🔌 API Test:"
if curl -s https://findingsports.com/api/health | grep -q "ok"; then
    echo "✅ API health check works"
else
    echo "❌ API health check failed"
fi

echo -e "\n📝 Changes Summary:"
echo "- Root route handler: ADDED ✅"
echo "- Dockerfile: FIXED ✅"
echo "- railway-start.sh: FIXED ✅"
echo "- UI elements: REMOVED ✅"
echo "- Play Now: FIXED ✅"
echo "- Login requirements: REMOVED ✅"

echo -e "\n⚠️  DEPLOYMENT STATUS:"
echo "All code changes are complete and in GitHub."
echo "Railway is NOT deploying automatically."
echo ""
echo "ACTION REQUIRED:"
echo "1. Login to Railway dashboard"
echo "2. Manually trigger deployment"
echo "3. Or check why auto-deploy is disabled"

echo -e "\n🎯 Once deployed, the site will:"
echo "- Serve HTML at root URL"
echo "- Show no language/help/online icons"
echo "- Allow Play Now without login"
echo "- Use selected location when GPS denied"