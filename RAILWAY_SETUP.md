# 🚂 Railway Deployment Setup for Finding Sports

## Prerequisites
- Railway CLI installed ✅
- GitHub repository ready ✅
- Railway account (create at https://railway.app)

## Step 1: Login to Railway

Since Railway login requires a browser, you have two options:

### Option A: Browser Login
1. Open terminal in your project directory
2. Run: `railway login`
3. Browser will open automatically
4. Login with GitHub/Email
5. Return to terminal once authenticated

### Option B: Use Railway Dashboard
1. Visit https://railway.app
2. Login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose `bobinzuks/findingsports.com`

## Step 2: Initialize Railway Project

```bash
# After login, in your project directory:
railway init

# Or link existing project:
railway link [project-id]
```

## Step 3: Configure Services

### Add PostgreSQL Database:
```bash
railway add postgresql
```

### Add Redis:
```bash
railway add redis
```

## Step 4: Set Environment Variables

Create a `.env` file for Railway:
```env
# Database
DATABASE_URL=${{POSTGRES_URL}}
REDIS_URL=${{REDIS_URL}}

# App Config
PORT=8080
RUST_LOG=info

# Auth
JWT_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# API Keys (if needed)
STRIPE_API_KEY=your-stripe-key
SENDGRID_API_KEY=your-sendgrid-key
```

## Step 5: Configure Build

Create `railway.json` in project root:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd mockup && npm install"
  },
  "deploy": {
    "startCommand": "cd mockup && npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Step 6: Deploy

### First Deployment:
```bash
# Deploy current directory
railway up

# Or deploy specific service
railway up --service web
```

### View Deployment:
```bash
# Open Railway dashboard
railway open

# View logs
railway logs

# Check status
railway status
```

## Step 7: Configure Domain

### Add Railway Domain:
```bash
railway domain
```

### Add Custom Domain:
1. Go to Railway dashboard
2. Select your service
3. Settings → Domains
4. Add `findingsports.com` or subdomain
5. Update DNS records as shown

## Step 8: Database Setup

### Connect to PostgreSQL:
```bash
railway connect postgresql
```

### Run migrations:
```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Run your schema
\i mockup/finding-sports-backend/migrations/init.sql
```

## Deployment Commands Reference

```bash
# Deploy
railway up

# View logs
railway logs --tail

# Open dashboard
railway open

# Environment variables
railway variables

# Restart service
railway restart

# Scale service
railway scale --replicas 2

# Remove deployment
railway down
```

## Frontend-Only Deployment (Quick Start)

Since your backend is in Rust and might need more setup, you can start with just the frontend:

1. **Create Static Site Service**:
```bash
railway add
# Choose "Empty Service"
# Name it "finding-sports-frontend"
```

2. **Configure for Static Files**:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npx serve mockup -p $PORT",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100
  }
}
```

3. **Add serve dependency**:
```bash
cd mockup
npm install --save serve
```

4. **Deploy**:
```bash
railway up
```

## Monitoring & Logs

### View real-time logs:
```bash
railway logs -f
```

### Check metrics:
- Visit Railway dashboard
- Select your project
- View "Metrics" tab

## Troubleshooting

### If deployment fails:
1. Check logs: `railway logs`
2. Verify environment variables: `railway variables`
3. Ensure build command is correct
4. Check Railway dashboard for error details

### Common issues:
- **Port binding**: Ensure app uses `$PORT` environment variable
- **Build failures**: Check `package.json` scripts
- **Database connection**: Verify `DATABASE_URL` is set

## Next Steps

After deployment:
1. ✅ Test the live site
2. ✅ Configure custom domain
3. ✅ Set up monitoring
4. ✅ Enable auto-deployments from GitHub
5. ✅ Configure production environment variables

## Resources
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Status Page: https://status.railway.app

Your Finding Sports app is ready for Railway deployment! 🚀