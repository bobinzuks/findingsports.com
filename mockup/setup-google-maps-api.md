# Google Maps API Setup for Finding Sports

## Your Project Details
- **Project ID**: tranquil-gasket-465519-a3
- **Project Number**: 175763159592

## Step-by-Step Setup

### 1. Enable Maps JavaScript API
1. Click on **"APIs & Services"** in the quick access menu
2. Click **"ENABLE APIS AND SERVICES"** or **"Library"**
3. Search for **"Maps JavaScript API"**
4. Click on it and press **"ENABLE"**

### 2. Create API Key
1. Go back to **"APIs & Services"**
2. Click **"Credentials"** in the left sidebar
3. Click **"+ CREATE CREDENTIALS"** → **"API key"**
4. Copy the generated API key immediately

### 3. Secure Your API Key (Important!)
1. Click on your newly created API key
2. Under **"Application restrictions"**:
   - Select **"HTTP referrers (websites)"**
   - Add these referrers:
     ```
     http://localhost:*
     http://127.0.0.1:*
     https://yourdomain.com/*
     https://*.yourdomain.com/*
     ```
3. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check only **"Maps JavaScript API"**
4. Click **"SAVE"**

### 4. Update Your Code
Replace the API key in `/mockup/js/config.js`:

```javascript
window.APP_CONFIG = {
    // Replace with your new API key
    GOOGLE_MAPS_API_KEY: 'YOUR_NEW_API_KEY_HERE',
    ...
}
```

### 5. Test Your Setup
1. Save the config file
2. Open http://localhost:8080/google-maps-debug.html
3. Click "Test API Key"
4. You should see a green "Valid" status

## Billing Note
- You have $300 in free credits
- Maps JavaScript API costs ~$7 per 1,000 map loads
- Your $300 credit = ~42,000 free map loads
- You won't be charged when credits run out (it just stops working)

## Common Issues
- **InvalidKeyMapError**: Key not copied correctly
- **RefererNotAllowedMapError**: Add your domain to restrictions
- **ApiNotActivatedMapError**: Enable Maps JavaScript API first

## Need Help?
- Check the debug panel: http://localhost:8080/google-maps-debug.html
- View console errors: Press F12 in browser