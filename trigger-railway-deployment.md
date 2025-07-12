# Railway Deployment Guide - Manual Trigger

## Current Status
- Latest commit: `3f1714e fix: Complete Play Now button functionality fixes`
- Repository is up to date with GitHub
- Railway CLI requires authentication

## Deployment Methods

### Method 1: Through Railway Dashboard (Recommended)
Since you're logged into Railway in Firefox:

1. **Go to Railway Dashboard**
   - Open: https://railway.app/dashboard
   - Find your `findingsports-com` project

2. **Check Deployment Status**
   - Click on your project
   - Go to "Deployments" tab
   - Check if the latest deployment matches commit `3f1714e`

3. **Trigger Manual Deployment**
   - If not up to date, click "Deploy" button
   - Or go to Settings → Triggers → "Deploy Now"

4. **Verify GitHub Integration**
   - In Settings → GitHub
   - Ensure it's connected to `bobinzuks/findingsports.com`
   - Enable "Auto Deploy" if not already enabled

### Method 2: Force Redeploy via Empty Commit
If Railway is connected to GitHub but not deploying:

```bash
# Create an empty commit to trigger deployment
git commit --allow-empty -m "chore: Trigger Railway deployment"
git push origin main
```

### Method 3: Railway CLI with Browser Token
1. In Firefox (where you're logged in):
   - Open Developer Tools (F12)
   - Go to Application/Storage → Cookies
   - Find railway.app cookies
   - Look for a token or session cookie

2. If you find a token, try:
```bash
export RAILWAY_TOKEN="your-token-here"
railway up
```

### Method 4: Use Railway's Webhook
Check if your project has a deployment webhook:

1. In Railway Dashboard → Settings → Webhooks
2. If there's a deployment webhook, you can trigger it:
```bash
curl -X POST "https://backboard.railway.app/v1/deploy/YOUR_WEBHOOK_URL"
```

## Deployment Configuration
Your project uses these settings (from railway.json):
- Build: `cd mockup/backend && npm install`
- Start: `cd mockup/backend && node server-static.js`
- Health check: `/health`
- Restart policy: ON_FAILURE (max 10 retries)

## Public URL
Based on your setup, your app should be available at one of:
- https://findingsports-com.up.railway.app
- https://findingsports-com-production.up.railway.app
- https://findingsports-com.railway.app

## Verification Steps
After deployment:
1. Check deployment logs in Railway dashboard
2. Visit your public URL
3. Test the Play Now functionality
4. Verify Google Maps is working
5. Check health endpoint: `https://your-url/health`