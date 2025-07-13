# Railway Deployment Checklist

## 1. Check Deployment Logs

In your Railway dashboard:
1. Click on the **findingsports-com** service
2. Click on the **Deployments** tab
3. Click on the most recent deployment (from 12 hours ago)
4. Check the logs for any errors

Common issues to look for:
- Missing environment variables
- Port binding errors
- Module not found errors
- Database connection errors

## 2. Add Required Environment Variables

Your backend needs these environment variables. In Railway:

1. Click on your **findingsports-com** service
2. Go to the **Variables** tab
3. Add these variables:

```
# Server Configuration
NODE_ENV=production
PORT=8080
CORS_ORIGIN=https://findingsports.com

# JWT Secret (generate a secure random string)
JWT_SECRET=your-secure-random-string-here

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Maps API (from Google Cloud Console)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Database (if using one)
DATABASE_URL=your-database-url-here

# Optional: OpenAI API (for AI features)
OPENAI_API_KEY=your-openai-api-key
```

### How to get these values:

1. **JWT_SECRET**: Generate a secure random string (32+ characters)
   ```bash
   openssl rand -base64 32
   ```

2. **Google OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create or select your project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `https://findingsports.com/auth/google/callback`
     - `https://findingsports.com/api/auth/callback.html`

3. **Google Maps API Key**:
   - In Google Cloud Console
   - Enable Maps JavaScript API
   - Create an API key
   - Restrict it to your domain: `findingsports.com`

## 3. Test Your Backend

Once deployed, test these endpoints:

```bash
# Health check
curl https://findingsports.com/health

# API status
curl https://findingsports.com/api/status

# Play Now endpoint (should return nearby games)
curl "https://findingsports.com/api/play-now?latitude=49.2827&longitude=-123.1207&radius=10&sport=all"
```

## 4. Check Frontend Connection

Your frontend at https://findingsports.com should:
1. Load without errors
2. Show the Google Maps properly
3. Play Now button should work
4. Login with Google should redirect properly

## 5. Monitor Deployment

After adding environment variables:
1. Railway will automatically redeploy
2. Watch the deployment logs
3. Check that the health check passes
4. Visit https://findingsports.com to verify

## Troubleshooting

### If deployment keeps failing:
1. Check build logs for missing dependencies
2. Ensure all npm packages are in package.json
3. Check for syntax errors in server.js

### If site loads but API doesn't work:
1. Check browser console for CORS errors
2. Verify CORS_ORIGIN environment variable
3. Check that backend is actually running on Railway

### If Google Auth doesn't work:
1. Verify redirect URIs in Google Console match exactly
2. Check that client ID and secret are correct
3. Ensure cookies are enabled for your domain

## Current Status

Based on your dashboard:
- ✅ Domain is connected properly
- ✅ Multiple deployment attempts (12 hours ago)
- ⚠️ Need to check deployment logs
- ⚠️ Need to add environment variables
- ⚠️ Need to verify backend is running

## Next Steps

1. **Immediate**: Check the deployment logs for the most recent deployment
2. **Required**: Add all environment variables listed above
3. **Test**: Use the curl commands to verify API endpoints
4. **Monitor**: Watch the new deployment after adding variables