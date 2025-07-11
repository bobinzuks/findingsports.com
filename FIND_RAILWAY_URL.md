# How to Find Your Railway Deployment URL

## Method 1: Railway Dashboard (Easiest)
1. Go to https://railway.app
2. Log in to your account
3. Click on your project (should be "finding-sports" or similar)
4. Look for the deployment URL - it will be something like:
   - `https://findingsports-production.up.railway.app`
   - `https://finding-sports.railway.app`
   - Or a random generated name like `https://purple-mountain-123.railway.app`

## Method 2: Railway CLI
```bash
# Install Railway CLI if you don't have it
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project (if not already linked)
railway link

# Open your app in browser
railway open

# Or just show the URL
railway status
```

## Method 3: Check Your Railway Project Settings
1. Go to https://railway.app/dashboard
2. Select your project
3. Click on "Settings" tab
4. Look for "Domains" section
5. Your Railway-provided domain will be listed there

## Method 4: Check Deployment Logs
In Railway dashboard:
1. Click on your project
2. Go to "Deployments" tab
3. Click on the latest deployment
4. The URL should be shown in the deployment details

## Common Railway URL Patterns
- `https://[project-name]-production.up.railway.app`
- `https://[project-name].railway.app`
- `https://[random-words-123].railway.app`

## Once You Find Your URL
Update your Google Maps API key restrictions to include:
```
https://[your-railway-url]/*
https://findingsports.com/*
http://localhost:*
```

This will make Google Maps work on your Railway deployment!