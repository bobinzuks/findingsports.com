# Railway Deployment Info

## Latest Deployment: 2025-01-13

### Changes in this deployment:
1. ✅ Fixed tab switching functionality (Social Feed, Upcoming Games)
2. ✅ Added Google Maps API error handling with setup instructions
3. ✅ Added deployment version tracking
4. ✅ Complete cache bypass implementation

### Google Maps API Configuration
The Maps JavaScript API needs to be enabled in Google Cloud Console.

**Required domains to add to API key restrictions:**
- findingsports.com
- www.findingsports.com  
- *.railway.app (for Railway preview deployments)
- localhost (for development)

### Testing the deployment:
1. Check buttons work: Search, Play Now, and tab switching
2. Verify Maps API loads or shows helpful error message
3. Confirm no 404 errors for deleted files
4. Test in incognito mode to bypass local cache

### Environment Variables Required:
- JWT_SECRET
- GOOGLE_MAPS_API_KEY
- GOOGLE_CLIENT_ID
- NODE_ENV=production
- RAILWAY_CDN_DISABLED=true

### Cache verification:
Run `./verify-deployment.sh` with your Railway URL to test cache headers.

---
Deployment triggered: ${new Date().toISOString()}