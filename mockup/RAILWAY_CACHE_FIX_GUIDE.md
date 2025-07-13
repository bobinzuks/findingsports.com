# Railway Cache Fix Guide

## Problem: Railway Serving Old Cached Files

Railway is continuing to serve old JavaScript and HTML files even after multiple deployments. Users are seeing:
- Deleted files like `immediate-button-fix.js` (404 errors)
- Commented-out scripts that should not be loading
- Old HTML content despite "Active" deployment status

## Root Cause Analysis

Railway uses a CDN (Content Delivery Network) that aggressively caches static files. Even when your deployment updates, the CDN may continue serving cached versions for:
- **24-48 hours** for static assets
- **Indefinitely** if cache headers aren't properly set
- **Cross-deployment** if ETags or Last-Modified headers match

## Solution Implemented

### 1. Server-Level Cache Control (`backend/middleware/no-cache.js`)

```javascript
// Forces all responses to bypass cache
Cache-Control: no-cache, no-store, must-revalidate, private, max-age=0
Pragma: no-cache
Expires: 0
```

### 2. Asset Versioning (`update-asset-versions.js`)

All CSS, JS, and image files now include version query parameters:
```html
<script src="js/app.js?v=1752417024232"></script>
<link rel="stylesheet" href="css/styles.css?v=1752417024232">
```

### 3. Railway Configuration (`railway.toml`)

```toml
[build]
buildCommand = "cd backend && npm install && cd .. && node update-asset-versions.js"

[variables]
BUILD_VERSION = "$RAILWAY_DEPLOYMENT_ID"
FORCE_NO_CACHE = "true"
```

### 4. Express Static Configuration

```javascript
app.use(express.static(path.join(__dirname, '..'), {
    etag: false,           // Disable ETags
    lastModified: false,   // Disable Last-Modified
    maxAge: 0,            // No caching
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
}));
```

## Deployment Steps

### 1. Apply the Fix

```bash
# Run the cache fix script
chmod +x fix-railway-cache.sh
./fix-railway-cache.sh
```

### 2. Commit and Deploy

```bash
git add -A
git commit -m "🚫 Fix Railway caching issues - force fresh content"
git push
```

### 3. Verify Deployment

```bash
# Check headers
curl -I https://your-app.up.railway.app/

# Should see:
# Cache-Control: no-cache, no-store, must-revalidate
# X-Deployment-Time: [current timestamp]
```

### 4. Test in Browser

1. **Clear browser cache completely**
2. **Open incognito/private window**
3. **Check Network tab** - all requests should return HTTP 200 (not 304)
4. **Verify** no 404 errors for deleted files

## Railway CLI Commands

If issues persist, use Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and restart service
railway login
railway restart

# Force redeploy
railway redeploy

# Check logs
railway logs
```

## Testing Cache Headers

Use curl to verify cache headers are working:

```bash
# Test main page
curl -I https://your-app.up.railway.app/

# Test static assets
curl -I https://your-app.up.railway.app/js/app.js?v=1752417024232

# Expected headers:
# Cache-Control: no-cache, no-store, must-revalidate
# Pragma: no-cache
# Expires: 0
# X-Deployment-Time: [timestamp]
```

## Browser Developer Tools

1. **Open Network tab**
2. **Disable cache** (checkbox in Network tab)
3. **Reload page**
4. **Check Status column** - should see 200, not 304
5. **Check Response Headers** for cache-control directives

## Railway Environment Variables

Set these in Railway dashboard:

```bash
NODE_ENV=production
FORCE_NO_CACHE=true
BUILD_VERSION=auto  # Uses Railway deployment ID
```

## Alternative Domain Testing

If caching persists, test with Railway's auto-generated domains:
- `your-app-production.up.railway.app`
- Direct IP if available

This bypasses any custom domain CDN caching.

## Emergency Workarounds

### 1. Manual Cache Busting

Add random query parameter to URLs:
```javascript
const cacheBuster = Date.now();
window.location.href = `${window.location.href}?cb=${cacheBuster}`;
```

### 2. Service Worker Clearing

```javascript
// Clear service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
});
```

### 3. Force Refresh Header

Add to HTML `<head>`:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

## Monitoring and Debugging

### 1. Check Deployment Status

```bash
railway status
railway logs --tail
```

### 2. Response Headers Debug

```javascript
// Add to your HTML for debugging
fetch(window.location.href)
    .then(response => {
        console.log('Cache-Control:', response.headers.get('cache-control'));
        console.log('ETag:', response.headers.get('etag'));
        console.log('Last-Modified:', response.headers.get('last-modified'));
    });
```

### 3. Network Panel Analysis

Look for:
- **200 OK** responses (not 304 Not Modified)
- **no-cache** directives in Response Headers
- **Versioned URLs** with query parameters

## Prevention

### 1. Always Version Assets

Run `node update-asset-versions.js` before each deployment.

### 2. Monitor Cache Headers

Regularly check that cache-control headers are being sent correctly.

### 3. Test Deployments

Always test in incognito mode after deployments to verify fresh content.

## Contact Railway Support

If the above steps don't work, contact Railway support with:

1. **Project ID**
2. **Deployment ID** of latest deploy
3. **URLs** showing cached content
4. **Headers** from curl requests
5. **Screenshots** of browser Network tab

Include this message:
> "Railway CDN is serving cached static files despite no-cache headers and new deployments. Need immediate cache invalidation for production site."

## Success Indicators

✅ **Fixed when you see:**
- HTTP 200 responses for all assets
- `Cache-Control: no-cache` headers
- No 404 errors for deleted files
- Updated content in incognito mode
- Fresh timestamps in `X-Deployment-Time` header

The fix should take effect within 5-10 minutes of deployment.