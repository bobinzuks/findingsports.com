# Deploy Venue Harvester to Railway

Since your main app is already running on Railway, here are your options:

## Option 1: Deploy as Separate Service (Recommended)
This keeps your main app running while adding the harvester as a new service.

### Steps:
1. In Railway Dashboard, click "New" → "Empty Service" 
2. Connect to your GitHub repo
3. In service settings, set **Root Directory** to: `venue-harvester`
4. Railway will auto-detect Python and deploy

### Result:
- Main app continues running at: `findingsports.com`
- Harvester runs at: `[service-name].railway.app`
- Both services work together

## Option 2: Replace Existing Service
Only if you want to completely replace the current Node.js app.

### Steps:
1. In your current service settings
2. Change **Root Directory** to: `venue-harvester`
3. Redeploy

### Result:
- Replaces Node.js app with Python harvester
- Single service running

## What You Get:
- **Lightweight**: ~50MB memory (no AI)
- **Automatic**: Harvests every 6 hours
- **API Endpoints**:
  - `/api/venues` - Get all venues
  - `/api/venues/search?city=vancouver` - Search
  - `/health` - Health check

## The Harvester Includes:
- Vancouver recreation facilities
- Burnaby recreation centers  
- Richmond sports facilities
- UBC recreation facilities
- More can be added easily

All files are ready in the `venue-harvester/` directory!