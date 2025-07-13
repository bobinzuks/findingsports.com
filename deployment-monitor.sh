#!/bin/bash

# Finding Sports - Railway Deployment Monitor
# This script pushes code and monitors deployment

set -e

echo "🚀 Finding Sports Railway Deployment Monitor"
echo "=========================================="

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

# Function to check if Railway CLI is installed
check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        print_status $RED "❌ Railway CLI not found. Install it with: npm install -g @railway/cli"
        exit 1
    fi
}

# Function to create deployment report
create_deployment_report() {
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    cat > DEPLOYMENT_STATUS.md << EOF
# Railway Deployment Status Report

**Generated**: $timestamp

## Deployment Configuration

### Procfile
\`\`\`
$(cat Procfile)
\`\`\`

### Railway.json
\`\`\`json
$(cat railway.json)
\`\`\`

### Nixpacks.toml
\`\`\`toml
$(cat nixpacks.toml)
\`\`\`

## Backend Server Status

### Main server.js
- **Location**: mockup/backend/server.js
- **Port**: 8080 (configurable via PORT env)
- **Features**:
  - Express server with CORS support
  - JWT authentication
  - Google OAuth integration
  - WebSocket support for real-time updates
  - Data aggregation pipeline
  - Play Now API endpoint
  - User games and venue requests

### Environment Variables Required
- \`PORT\`: Server port (default: 8080)
- \`JWT_SECRET\`: JWT signing secret (REQUIRED in production)
- \`GOOGLE_CLIENT_ID\`: Google OAuth client ID
- \`CORS_ORIGIN\`: Allowed CORS origins
- \`NODE_ENV\`: Environment (production/development)

## Testing Checklist

### 1. Basic Server Health
\`\`\`bash
curl https://your-app.railway.app/health
\`\`\`

### 2. Frontend Access
- Navigate to: https://your-app.railway.app
- Check if the page loads without errors
- Verify static files are served correctly

### 3. API Endpoints
\`\`\`bash
# Get games (public endpoint)
curl https://your-app.railway.app/api/games

# Get BC locations
curl https://your-app.railway.app/api/locations/bc

# Check WebSocket stats
curl https://your-app.railway.app/api/ws/stats

# Check data aggregation stats
curl https://your-app.railway.app/api/data/stats
\`\`\`

### 4. Authentication Flow
- Test Google Sign-In button
- Verify JWT tokens are generated
- Check user session persistence

### 5. Play Now Feature
\`\`\`bash
# Test Play Now API
curl -X POST https://your-app.railway.app/api/play-now/search \
  -H "Content-Type: application/json" \
  -d '{"location": "Vancouver", "sports": ["basketball"]}'
\`\`\`

## Common Issues and Solutions

### Issue 1: Server Restart Loop
**Symptoms**: Server keeps restarting every few seconds
**Cause**: Missing environment variables or startup errors
**Solution**: 
1. Check Railway logs for specific error
2. Ensure JWT_SECRET is set in Railway environment
3. Verify all dependencies are installed

### Issue 2: Cannot Access Frontend
**Symptoms**: API works but frontend doesn't load
**Cause**: Static file serving misconfigured
**Solution**:
1. Check that Procfile uses correct path
2. Verify express.static middleware is configured
3. Ensure mockup directory structure is correct

### Issue 3: Authentication Failures
**Symptoms**: Login/signup not working
**Cause**: JWT_SECRET not set or CORS issues
**Solution**:
1. Set JWT_SECRET in Railway environment
2. Configure CORS_ORIGIN to include frontend URL
3. Check Google OAuth client configuration

### Issue 4: WebSocket Connection Failed
**Symptoms**: Real-time updates not working
**Cause**: WebSocket upgrade not supported
**Solution**:
1. Ensure Railway supports WebSocket connections
2. Check that server creates http.Server instance
3. Verify WebSocket initialization code

## Deployment Commands

### Push to GitHub (triggers Railway deployment)
\`\`\`bash
git add .
git commit -m "fix: Railway deployment configuration"
git push origin main
\`\`\`

### Monitor Railway Logs (requires Railway CLI)
\`\`\`bash
railway logs --tail
\`\`\`

### Check Deployment Status
\`\`\`bash
railway status
\`\`\`

### Environment Variables
\`\`\`bash
railway variables
\`\`\`

## Next Steps

1. **Monitor Deployment**: Watch Railway dashboard for build progress
2. **Check Logs**: Look for any startup errors
3. **Test Endpoints**: Use the curl commands above
4. **Verify Frontend**: Open the app in a browser
5. **Test Features**: Try login, search, and Play Now

## Emergency Rollback

If deployment fails:
\`\`\`bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or switch to emergency server
git checkout Procfile
# Edit to use server-emergency.js
git add Procfile
git commit -m "fix: Rollback to emergency server"
git push origin main
\`\`\`

EOF
}

# Main deployment process
print_status $BLUE "🔍 Checking prerequisites..."
check_railway_cli

print_status $YELLOW "📝 Creating deployment report..."
create_deployment_report

print_status $GREEN "✅ Deployment report created: DEPLOYMENT_STATUS.md"

# Git operations
print_status $BLUE "📦 Preparing deployment commit..."

# Check if there are changes to commit
if [[ -n $(git status -s) ]]; then
    print_status $YELLOW "📝 Creating comprehensive commit..."
    
    git add .
    
    # Create detailed commit message
    COMMIT_MSG="🚀 Deploy: Production-ready server with full features

This deployment includes:
- ✅ Full backend server (server.js) with all features
- ✅ JWT authentication and Google OAuth
- ✅ WebSocket support for real-time updates
- ✅ Data aggregation pipeline
- ✅ Play Now API functionality
- ✅ User games and venue requests
- ✅ BC location services
- ✅ Static file serving for frontend

Configuration:
- Procfile: Points to mockup/backend/server.js
- Railway.json: Production build and health checks
- Nixpacks.toml: Node.js 20 with Python support

Environment requirements:
- JWT_SECRET (required in production)
- GOOGLE_CLIENT_ID
- CORS_ORIGIN
- NODE_ENV=production

Deployment ID: $(date +%s)"

    git commit -m "$COMMIT_MSG"
    
    print_status $GREEN "✅ Commit created successfully"
else
    print_status $YELLOW "⚠️  No changes to commit"
fi

print_status $BLUE "🚀 Pushing to GitHub (this will trigger Railway deployment)..."
git push origin main

print_status $GREEN "✅ Code pushed to GitHub!"

# Post-deployment instructions
print_status $YELLOW "
📋 NEXT STEPS:
1. Open Railway Dashboard: https://railway.app/dashboard
2. Monitor the deployment build process
3. Once deployed, check the logs for any errors
4. Test the endpoints listed in DEPLOYMENT_STATUS.md

🔍 TO MONITOR DEPLOYMENT:
railway logs --tail

📊 TO CHECK STATUS:
railway status

🌐 TO TEST DEPLOYED APP:
curl https://your-app.railway.app/health

⚠️  IMPORTANT:
- Ensure JWT_SECRET is set in Railway environment
- Monitor for restart loops in the first 5 minutes
- Check that all API endpoints respond correctly
"

# Optional: Monitor deployment (requires Railway CLI to be logged in)
if command -v railway &> /dev/null; then
    print_status $BLUE "
🔄 To start monitoring deployment logs, run:
./deployment-monitor.sh --watch
"
fi

# Handle watch mode
if [[ "$1" == "--watch" ]]; then
    print_status $BLUE "👀 Starting deployment log monitor..."
    railway logs --tail
fi