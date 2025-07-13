#!/bin/bash

# Railway Emergency Deployment Script
# Use this if the normal deployment fails

echo "🚨 Railway Emergency Deployment Mode"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Option 1: Try minimal server
echo "1️⃣ Testing emergency server..."
if [ -f "emergency-server.js" ]; then
    echo "✅ Emergency server found"
    echo "To use: Set Railway start command to: node emergency-server.js"
fi

# Option 2: Direct backend start
echo ""
echo "2️⃣ Direct backend start command:"
echo "cd mockup/backend && npm install --production && node server.js"

# Option 3: Environment variables check
echo ""
echo "3️⃣ Required Railway environment variables:"
echo "PORT=<auto-assigned by Railway>"
echo "JWT_SECRET=your-secret-here"
echo "NODE_ENV=production"
echo "NODE_OPTIONS=--max-old-space-size=512"

# Option 4: Nixpacks override
echo ""
echo "4️⃣ Nixpacks configuration override:"
echo "NIXPACKS_NODE_VERSION=18"
echo "NIXPACKS_BUILD_CMD=cd mockup/backend && npm ci --production"
echo "NIXPACKS_START_CMD=cd mockup/backend && node server.js"

# Option 5: Create minimal package.json
echo ""
echo "5️⃣ Creating minimal root package.json for Railway..."
cat > railway-package.json << 'EOF'
{
  "name": "finding-sports-emergency",
  "version": "1.0.0",
  "scripts": {
    "start": "node emergency-server.js",
    "start:backend": "cd mockup/backend && node server.js",
    "build": "echo 'No build required'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

echo "✅ Created railway-package.json"
echo "To use: Rename to package.json before deploying"

# Test commands
echo ""
echo "6️⃣ Test your deployment locally:"
echo "node emergency-server.js"
echo "# OR"
echo "cd mockup/backend && node server.js"

echo ""
echo "🔧 Railway Dashboard Quick Actions:"
echo "1. Go to Settings > Environment"
echo "2. Add the environment variables from option 3"
echo "3. Go to Settings > Build"
echo "4. Set custom start command from option 2"
echo "5. Clear build cache and redeploy"

echo ""
echo "📱 After deployment, test these URLs:"
echo "https://your-app.railway.app/health"
echo "https://your-app.railway.app/api/games"
echo "https://your-app.railway.app/"

echo ""
echo "✅ Emergency deployment guide complete!"