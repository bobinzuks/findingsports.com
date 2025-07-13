# Railway Deployment Troubleshooting Guide

## 🚨 Critical Deployment Issues and Solutions

### 1. Server Restart Loop
**Symptoms:**
- Server starts and immediately crashes
- Logs show repeated "Starting server" messages
- Health checks fail

**Root Causes & Solutions:**

#### Missing JWT_SECRET
```bash
# In Railway dashboard, add environment variable:
JWT_SECRET=your-secure-secret-key-here
```

#### Port Configuration
```bash
# Ensure PORT is not hardcoded in server.js
# Railway automatically sets PORT environment variable
```

#### Memory Issues
```javascript
// Add to server.js if getting OOM errors:
if (process.env.NODE_ENV === 'production') {
    // Disable development features
    console.log = () => {}; // Reduce logging
}
```

### 2. Build Failures

#### Package Installation Issues
```json
// Ensure package.json has all dependencies:
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "google-auth-library": "^9.2.0",
    "socket.io": "^4.6.2",
    "dotenv": "^16.3.1"
  }
}
```

#### Python Dependencies
```toml
# nixpacks.toml should include Python if needed:
[phases.setup]
nixPkgs = ["nodejs_20", "python311"]
```

### 3. Frontend Not Loading

#### Static File Serving
```javascript
// Verify in server.js:
app.use(express.static(path.join(__dirname, '..'))); // Serves mockup directory
```

#### File Structure
```
mockup/
├── index.html          # Main entry point
├── login.html
├── dashboard.html
├── backend/
│   ├── server.js       # Express server
│   └── package.json
└── assets/
    ├── js/
    └── css/
```

### 4. API Endpoints Returning 404

#### Route Order
```javascript
// Ensure API routes are before catch-all:
app.use('/api', apiRoutes);
// Static files LAST
app.use(express.static(...));
```

### 5. WebSocket Connection Failures

#### CORS Configuration
```javascript
// In websocket service:
const io = socketIo(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    }
});
```

### 6. Database/Memory Issues

#### In-Memory Store Limitations
```javascript
// For production, consider:
// 1. Use Redis for session storage
// 2. Use PostgreSQL for user data
// 3. Implement proper cleanup
```

## 🔧 Step-by-Step Debugging Process

### Step 1: Check Railway Logs
```bash
railway logs --tail

# Look for:
# - "CRITICAL: JWT_SECRET not set"
# - "Cannot find module"
# - "EADDRINUSE" (port conflict)
# - Memory errors
```

### Step 2: Verify Environment Variables
```bash
railway variables

# Required:
# - JWT_SECRET
# - NODE_ENV=production
# - CORS_ORIGIN (if frontend is on different domain)
```

### Step 3: Test Basic Connectivity
```bash
# From your local machine:
curl https://your-app.railway.app/health

# Should return:
# {"status":"ok","timestamp":"2025-01-13T..."}
```

### Step 4: Check Build Process
```bash
# In Railway dashboard:
# 1. Go to Deployments tab
# 2. Click on latest deployment
# 3. Check "Build Logs" for errors
```

### Step 5: Verify File Structure
```bash
# Ensure these files exist:
- Procfile
- railway.json
- nixpacks.toml
- mockup/backend/server.js
- mockup/backend/package.json
- mockup/index.html
```

## 🚀 Quick Fixes

### Emergency Rollback
```bash
# If current deployment is broken:
git revert HEAD
git push origin main
```

### Switch to Minimal Server
```bash
# Create minimal test server:
cat > mockup/backend/server-minimal.js << 'EOF'
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/health', (req, res) => {
    res.json({ status: 'ok', mode: 'minimal' });
});

app.listen(PORT, () => {
    console.log(`Minimal server on port ${PORT}`);
});
EOF

# Update Procfile:
echo "web: cd mockup/backend && node server-minimal.js" > Procfile

# Deploy:
git add .
git commit -m "fix: Switch to minimal server for testing"
git push origin main
```

### Force Rebuild
```bash
# Add a dummy change to force rebuild:
echo "# Deploy $(date)" >> README.md
git add README.md
git commit -m "chore: Force Railway rebuild"
git push origin main
```

## 📊 Monitoring Commands

### Real-time Monitoring
```bash
# Watch logs continuously:
railway logs --tail

# Check deployment status:
railway status

# View resource usage:
railway metrics
```

### Health Check Loop
```bash
# Monitor health endpoint:
while true; do
    curl -s https://your-app.railway.app/health | jq .
    sleep 5
done
```

## 🎯 Common Error Messages

### "Cannot find module 'X'"
```bash
# Solution: Add to package.json dependencies
cd mockup/backend
npm install X --save
git add package.json package-lock.json
git commit -m "fix: Add missing dependency X"
git push origin main
```

### "EADDRINUSE: address already in use"
```javascript
// Solution: Don't hardcode port
const PORT = process.env.PORT || 8080;
```

### "JWT_SECRET not set in production!"
```bash
# Solution: Set in Railway dashboard
# Settings > Variables > Add Variable
# Key: JWT_SECRET
# Value: [generate secure key]
```

### "Invalid authentication credentials"
```bash
# Check CORS settings:
CORS_ORIGIN=https://findingsports.com,https://www.findingsports.com
```

## 🔄 Deployment Workflow

1. **Make Changes Locally**
2. **Test Locally**: `cd mockup/backend && npm start`
3. **Stage Changes**: `git add .`
4. **Commit**: `git commit -m "fix: Description"`
5. **Deploy**: `git push origin main`
6. **Monitor**: `railway logs --tail`
7. **Test**: `./test-deployment.sh`

## 📞 Getting Help

1. **Railway Discord**: https://discord.gg/railway
2. **Railway Docs**: https://docs.railway.app
3. **Check Status**: https://status.railway.app

## 🚨 Emergency Contacts

If deployment is critically broken:
1. Revert to last working commit
2. Use emergency server configuration
3. Contact Railway support if infrastructure issue
4. Check GitHub Actions for CI/CD issues