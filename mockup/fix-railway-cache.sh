#!/bin/bash

# Railway Cache Fix Script
# Solves persistent caching issues on Railway deployments

set -e

echo "🚂 Railway Cache Fix Script"
echo "=========================="

# Generate new build version
BUILD_VERSION=$(date +%s)
echo "📦 Build Version: $BUILD_VERSION"

# 1. Update asset versions to force cache invalidation
echo "🔄 Step 1: Updating asset versions..."
node update-asset-versions.js

# 2. Remove any old cached files that might be causing issues
echo "🗑️  Step 2: Cleaning up old files..."
find . -name "immediate-button-fix.js" -delete 2>/dev/null || true
find . -name "google-auth-fix.js" -delete 2>/dev/null || true

# 3. Update index.html deployment timestamp
echo "⏰ Step 3: Updating deployment timestamp..."
sed -i "s/Deployment timestamp: [^-]*/Deployment timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)/" index.html 2>/dev/null || true

# 4. Ensure no-cache headers are properly set
echo "🚫 Step 4: Verifying no-cache configuration..."
if grep -q "no-cache" backend/server.js; then
    echo "✅ No-cache middleware is configured"
else
    echo "❌ No-cache middleware missing - this should be fixed manually"
fi

# 5. Create a unique deployment marker
echo "🏷️  Step 5: Creating deployment marker..."
echo "{\"deployment_id\": \"$BUILD_VERSION\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\", \"fixed_caching\": true}" > deployment.json

# 6. Test server configuration
echo "🧪 Step 6: Testing server configuration..."
cd backend
if npm test 2>/dev/null; then
    echo "✅ Server tests passed"
else
    echo "⚠️  Server tests failed or not configured"
fi
cd ..

echo ""
echo "🎉 Cache fix complete!"
echo ""
echo "📋 Next steps:"
echo "1. Commit changes: git add -A && git commit -m \"🚫 Fix Railway caching issues - v$BUILD_VERSION\""
echo "2. Push to Railway: git push"
echo "3. Wait for deployment to complete"
echo "4. Test in incognito mode: curl -I https://your-railway-app.up.railway.app/"
echo "5. Look for these headers:"
echo "   - Cache-Control: no-cache, no-store, must-revalidate"
echo "   - X-Deployment-Time: [current timestamp]"
echo ""
echo "🔧 If caching issues persist:"
echo "- Use Railway CLI: railway restart"
echo "- Check Railway environment variables"
echo "- Contact Railway support about CDN caching"
echo ""
echo "🚀 Your deployment should now serve fresh files!"