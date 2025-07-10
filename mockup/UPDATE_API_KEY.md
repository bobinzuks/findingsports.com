# How to Add Your Google Maps API Key

## Quick Steps:

### 1. Open the config file:
**File location:** `/mockup/js/config.js`

### 2. Find this line (around line 14):
```javascript
GOOGLE_MAPS_API_KEY: 'YOUR_API_KEY_HERE',
```

### 3. Replace with your API key:
```javascript
GOOGLE_MAPS_API_KEY: 'AIzaSy_YOUR_ACTUAL_KEY_HERE',
```

## Example:
If your API key is `AIzaSyBxyz123abc456def789`, change it to:
```javascript
GOOGLE_MAPS_API_KEY: 'AIzaSyBxyz123abc456def789',
```

## Important Notes:
- Keep the single quotes around your key
- Don't add spaces before or after the key
- Make sure the comma at the end stays

## Files to Update:
1. **Main config:** `/mockup/js/config.js` (line 14)
2. **Also update:** `/mockup/index.html` (line 18) - Same key

## Test Your Changes:
1. Save the file
2. Refresh your browser (Ctrl+F5 or Cmd+Shift+R)
3. Open http://localhost:8080
4. The map should now load!

## Troubleshooting:
- Check browser console (F12) for errors
- Make sure you enabled "Maps JavaScript API" in Google Cloud
- Verify your domain restrictions include `http://localhost:*`