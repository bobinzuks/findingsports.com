# Production Fixes for Finding Sports

## Critical Issues Fixed and Configuration Needed

### 1. ✅ Removed Hardcoded Demo User Account
**Fixed in**: `mockup/backend/server.js`
- Removed demo user with email `demo@example.com` and password `demo123`
- Added JWT_SECRET validation to ensure it's set in production

### 2. ⚠️ Google Maps API Key Configuration Required

**Current Issue**: The Google Maps API key `AIzaSyD2ux0PIekUQLAqVDNhy0tHwhBht6vcXqA` needs proper domain configuration.

**To Fix**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to APIs & Services → Credentials
4. Find the API key `AIzaSyD2ux0PIekUQLAqVDNhy0tHwhBht6vcXqA`
5. Click on it to edit
6. Under "Application restrictions", add these domains:
   - `https://findingsports.com`
   - `https://www.findingsports.com`
   - `https://*.up.railway.app` (for Railway deployments)
7. Under "API restrictions", ensure "Maps JavaScript API" is enabled
8. Save changes

**Alternative**: Create a new API key specifically for production:
1. Create new credentials → API Key
2. Restrict it to your production domains
3. Update the key in these files:
   - `/mockup/index.html` (line 19)
   - `/mockup/js/config.js` (line 16)

### 3. ⚠️ Google OAuth Configuration Required

**Current Issue**: Using test OAuth client ID that may not work in production.

**To Fix**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to APIs & Services → OAuth consent screen
3. Ensure your app is configured properly
4. Go to Credentials → OAuth 2.0 Client IDs
5. Add these authorized redirect URIs:
   - `https://findingsports.com/auth/google/callback`
   - `https://www.findingsports.com/auth/google/callback`
   - `https://findingsports.com/api/auth/google/callback`
6. Update the client ID in `/mockup/auth/google-oauth.js` if needed

### 4. ✅ Play Now API Endpoint is Working
- The API endpoint `/api/play-now` is properly configured
- Frontend should call this endpoint when Play Now button is clicked

### 5. ⚠️ Environment Variables Required for Railway

Add these environment variables in Railway dashboard:

```bash
# Required
JWT_SECRET=<generate-a-secure-random-string>
NODE_ENV=production
PORT=8080

# Google OAuth (if using your own)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# CORS Configuration
CORS_ORIGIN=https://findingsports.com,https://www.findingsports.com

# Optional but recommended
DATABASE_URL=<if-using-database>
REDIS_URL=<if-using-redis>
```

### 6. ⚠️ SSL Certificate Issue for www subdomain

**Issue**: `https://www.findingsports.com` has SSL certificate error

**To Fix**:
1. In Railway dashboard, go to your service settings
2. Under "Domains", add `www.findingsports.com`
3. Railway will provide DNS settings
4. Update Namecheap DNS records as instructed

### 7. Production Deployment Checklist

Before deploying to production:

- [ ] Set JWT_SECRET environment variable
- [ ] Configure Google Maps API key domain restrictions
- [ ] Configure Google OAuth redirect URIs
- [ ] Remove any other hardcoded credentials
- [ ] Set NODE_ENV=production
- [ ] Configure CORS_ORIGIN properly
- [ ] Test all authentication flows
- [ ] Verify Play Now functionality
- [ ] Check all API endpoints

### 8. Testing Production Site

Test these features on https://findingsports.com:

1. **Authentication**:
   - Register new account
   - Login with email/password
   - Google OAuth login
   - Logout functionality

2. **Core Features**:
   - Play Now button functionality
   - Game search
   - Location detection
   - Map display
   - Submit drop-in game
   - Sport rules guide

3. **API Endpoints**:
   - `/api/play-now` - Should return activity data
   - `/api/games` - Should return game listings
   - `/api/auth/me` - Should return current user (when logged in)

## Security Recommendations

1. **API Keys**: Never commit API keys to git. Use environment variables.
2. **Secrets**: Generate strong random secrets for JWT_SECRET
3. **HTTPS**: Always use HTTPS in production
4. **CORS**: Restrict CORS to your specific domains
5. **Rate Limiting**: Consider adding rate limiting to prevent abuse

## Next Steps

1. Apply the environment variable configurations in Railway
2. Update Google Cloud Console settings
3. Test all functionality on production
4. Monitor logs for any errors