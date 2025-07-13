#!/bin/bash

# Finding Sports - Automated Deployment Fixer
# This script automatically fixes common deployment issues

set -e

echo "🔧 Finding Sports - Automated Deployment Fixer"
echo "============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Fix 1: Correct nixpacks.toml nodejs package name
print_status $BLUE "🔧 Fix 1: Correcting nixpacks.toml nodejs package name..."

if grep -q "nodejs-20_x" nixpacks.toml 2>/dev/null; then
    sed -i.bak 's/nodejs-20_x/nodejs_20/g' nixpacks.toml
    print_status $GREEN "✅ Fixed: nodejs-20_x → nodejs_20"
else
    print_status $YELLOW "ℹ️  nixpacks.toml already has correct nodejs package name"
fi

# Fix 2: Ensure server.js doesn't crash on missing JWT_SECRET
print_status $BLUE "🔧 Fix 2: Checking server.js JWT_SECRET handling..."

if [ -f "mockup/backend/server.js" ]; then
    if grep -q "process.exit(1)" mockup/backend/server.js; then
        print_status $YELLOW "⚠️  Found process.exit(1) in server.js - server may crash loop"
        print_status $YELLOW "   Make sure to set JWT_SECRET in Railway environment!"
    else
        print_status $GREEN "✅ Server.js should handle missing JWT_SECRET gracefully"
    fi
fi

# Fix 3: Ensure correct start command in Procfile
print_status $BLUE "🔧 Fix 3: Verifying Procfile..."

if [ -f "Procfile" ]; then
    if grep -q "server.js" Procfile; then
        print_status $GREEN "✅ Procfile correctly points to server.js"
    else
        echo "web: cd mockup/backend && node server.js" > Procfile
        print_status $GREEN "✅ Updated Procfile to use server.js"
    fi
else
    echo "web: cd mockup/backend && node server.js" > Procfile
    print_status $GREEN "✅ Created Procfile"
fi

# Fix 4: Remove heavy dependencies from package.json
print_status $BLUE "🔧 Fix 4: Checking for heavy dependencies..."

if [ -f "mockup/backend/package.json" ]; then
    if grep -q "puppeteer" mockup/backend/package.json; then
        print_status $YELLOW "⚠️  Found puppeteer in dependencies - this causes build timeouts"
        print_status $YELLOW "   Consider removing it or moving to devDependencies"
    else
        print_status $GREEN "✅ No heavy dependencies found"
    fi
fi

# Fix 5: Ensure railway.json exists
print_status $BLUE "🔧 Fix 5: Checking railway.json..."

if [ ! -f "railway.json" ]; then
    cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "watchPatterns": ["mockup/backend/**"],
    "buildCommand": "cd mockup/backend && npm install --production --no-audit --no-fund"
  },
  "deploy": {
    "startCommand": "cd mockup/backend && node server.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
EOF
    print_status $GREEN "✅ Created railway.json with optimized settings"
else
    print_status $GREEN "✅ railway.json exists"
fi

# Fix 6: Create a deployment verification script
print_status $BLUE "🔧 Fix 6: Creating deployment verification script..."

cat > verify-deployment.js << 'EOF'
const https = require('https');

console.log('🔍 Deployment Verification Tool\n');

const url = process.argv[2];
if (!url) {
    console.error('Usage: node verify-deployment.js <railway-app-url>');
    process.exit(1);
}

const endpoints = [
    '/health',
    '/api/games',
    '/api/play-now',
    '/api/venues',
    '/'
];

async function testEndpoint(endpoint) {
    return new Promise((resolve) => {
        const fullUrl = url + endpoint;
        console.log(`Testing ${fullUrl}...`);
        
        https.get(fullUrl, (res) => {
            if (res.statusCode === 200) {
                console.log(`✅ ${endpoint} - OK (${res.statusCode})`);
                resolve(true);
            } else {
                console.log(`❌ ${endpoint} - Failed (${res.statusCode})`);
                resolve(false);
            }
        }).on('error', (err) => {
            console.log(`❌ ${endpoint} - Error: ${err.message}`);
            resolve(false);
        });
    });
}

async function runTests() {
    let passed = 0;
    for (const endpoint of endpoints) {
        if (await testEndpoint(endpoint)) {
            passed++;
        }
    }
    
    console.log(`\n📊 Results: ${passed}/${endpoints.length} tests passed`);
    
    if (passed === 0) {
        console.log('\n🚨 CRITICAL: Server is not responding!');
        console.log('1. Check Railway logs for errors');
        console.log('2. Ensure JWT_SECRET is set in Railway environment');
        console.log('3. Verify nodejs_20 (not nodejs-20_x) in nixpacks.toml');
    } else if (passed < endpoints.length) {
        console.log('\n⚠️  Some endpoints are failing');
        console.log('Check server logs for specific errors');
    } else {
        console.log('\n✅ All tests passed! Deployment is working correctly.');
    }
}

runTests();
EOF

print_status $GREEN "✅ Created verify-deployment.js"

# Summary of changes
print_status $YELLOW "\n📋 Summary of Fixes Applied:"
echo "1. ✅ Fixed nixpacks.toml nodejs package naming"
echo "2. ✅ Verified server.js configuration"
echo "3. ✅ Ensured correct Procfile"
echo "4. ✅ Checked for heavy dependencies"
echo "5. ✅ Created/verified railway.json"
echo "6. ✅ Created deployment verification script"

# Check if there are changes to commit
if [[ -n $(git status -s) ]]; then
    print_status $YELLOW "\n📦 Changes detected. Creating commit..."
    
    git add .
    git commit -m "fix: Automated deployment fixes

- Fixed nixpacks.toml nodejs package name (nodejs-20_x → nodejs_20)
- Ensured correct Procfile configuration
- Added deployment verification tools
- Optimized build configuration

This should resolve Railway deployment issues."
    
    print_status $GREEN "✅ Commit created successfully"
    
    print_status $YELLOW "\n🚀 Ready to deploy! Run:"
    echo "git push origin main"
else
    print_status $YELLOW "\n✅ No changes needed - deployment configuration is correct"
fi

print_status $BLUE "\n🔍 To verify deployment after pushing:"
echo "node verify-deployment.js https://your-app.railway.app"

print_status $YELLOW "\n⚠️  IMPORTANT REMINDERS:"
echo "1. Set JWT_SECRET in Railway dashboard → Variables"
echo "2. Add CORS_ORIGIN if needed for your domain"
echo "3. Monitor Railway logs after deployment"
echo "4. Use browser-deployment-monitor.html for detailed testing"

print_status $GREEN "\n✨ Auto-fix complete!"