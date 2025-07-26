# Railway Deployment Guide for Finding Sports Venue Harvester

## ✅ Pre-Deployment Checklist

### Files Ready for Deployment:
- ✅ `railway-optimized-harvester.py` - Lightweight harvester (NO AI)
- ✅ `railway-integration.py` - Flask API with scheduling
- ✅ `railway-requirements.txt` - Minimal dependencies (6 packages, ~15MB)
- ✅ `Procfile` - Railway process configuration
- ✅ `railway.json` - Railway-specific settings
- ✅ `.env.example` - Environment variables template

### Key Features:
- **No AI Required** - Simple web scraping only
- **Lightweight** - ~50MB memory usage (vs 2GB+ for AI version)
- **Auto-scheduling** - Harvests every 6 hours automatically
- **REST API** - Easy integration with your app
- **SQLite Database** - No external database needed

## 🚀 Deployment Steps

### 1. Push to GitHub
```bash
git add railway-*.py railway-requirements.txt Procfile railway.json .env.example
git commit -m "Add Railway-optimized venue harvester (no AI required)"
git push origin main
```

### 2. Deploy to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect the Procfile and deploy

### 3. Monitor Deployment

Railway will:
- Install dependencies from `railway-requirements.txt`
- Start the Flask app with Gunicorn
- Begin automatic harvesting after 30 seconds
- Schedule harvests every 6 hours

## 📊 Resource Usage

### Memory: ~50MB
- Flask app: 20MB
- BeautifulSoup parsing: 15MB
- SQLite operations: 10MB
- Overhead: 5MB

### Perfect for Railway's $5 plan (512MB RAM)

## 🔌 API Endpoints

Once deployed, your app will have:

### Home Page
```
GET https://your-app.railway.app/
```

### Get All Venues
```
GET https://your-app.railway.app/api/venues
```

### Search Venues
```
GET https://your-app.railway.app/api/venues/search?city=vancouver
GET https://your-app.railway.app/api/venues/search?sport=hockey
```

### Trigger Manual Harvest
```
POST https://your-app.railway.app/api/harvest
```

### Check Status
```
GET https://your-app.railway.app/api/status
```

### Health Check
```
GET https://your-app.railway.app/health
```

## 🔧 Configuration

No configuration needed! The harvester will:
- Start automatically on deployment
- Run initial harvest after 30 seconds
- Schedule harvests every 6 hours
- Store data in SQLite at `/tmp/venues.db`

## 📈 What Gets Harvested

### Priority Targets (No AI needed):
1. **Vancouver.ca** - Recreation facilities
2. **Burnaby.ca** - Recreation centers
3. **Richmond.ca** - Sports facilities
4. **UBC Recreation** - University facilities

### Data Collected:
- Venue name
- Address
- City
- Sports/activities available
- Phone numbers
- Website URLs
- Confidence scores

## 🚨 Monitoring

Check logs in Railway dashboard:
```
INFO - Starting Finding Sports Venue Harvester on port 8080
INFO - Running initial harvest on startup
INFO - Extracted 25 venues from vancouver.ca
INFO - Harvesting completed: 89 venues stored in 45.2s
```

## ❓ FAQ

**Q: Will this work on Railway's small server?**
A: Yes! Designed specifically for Railway's constraints.

**Q: Does it need any AI services?**
A: No! Uses simple pattern matching, no AI required.

**Q: How often does it update?**
A: Every 6 hours automatically, or manually via API.

**Q: What if a site changes structure?**
A: The harvester uses flexible selectors that adapt to minor changes.

**Q: Can I add more sites?**
A: Yes! Edit the `priority_targets` in `railway-optimized-harvester.py`.

## 🎯 Next Steps

After deployment:
1. Check `/api/venues` to see harvested data
2. Integrate with your Finding Sports app
3. Monitor logs for any issues
4. Optionally add more target sites

## 💡 Tips

- Start with the 4 included sites
- Monitor memory usage in Railway metrics
- Add new sites gradually
- Use the search API for efficient queries
- Check `/api/status` for harvest progress

The harvester is optimized for Railway and ready to deploy!