# Google OAuth Setup Guide for Finding Sports

## Steps to Enable Google Sign-In

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" or select an existing project
3. Name it "Finding Sports" (or similar)

### 2. Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in the required fields:
     - App name: Finding Sports
     - User support email: your email
     - Developer contact: your email
   - Add scopes: email, profile, openid
   - Add test users if in development

### 4. Configure OAuth Client

1. Application type: "Web application"
2. Name: "Finding Sports Web Client"
3. Authorized JavaScript origins:
   - `http://localhost:8080` (for development)
   - `http://localhost:3000` (if using different port)
   - `https://findingsports.com` (for production)
   - `https://www.findingsports.com` (if using www)

4. Authorized redirect URIs:
   - `http://localhost:8080/auth/google/callback`
   - `https://findingsports.com/auth/google/callback`

5. Click "Create"

### 5. Copy Your Client ID

You'll receive a Client ID that looks like:
`123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`

### 6. Update Your Code

1. Update `/mockup/auth/google-oauth.js`:
```javascript
const GOOGLE_CLIENT_ID = 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com';
```

2. Create a `.env` file in `/mockup/backend/`:
```
GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:8080
```

### 7. Environment Variables for Production

For production deployment, set these environment variables:
- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `JWT_SECRET` - A secure random string
- `CORS_ORIGIN` - Your production domain

## Testing Google Sign-In

1. Start your backend server: `npm run dev`
2. Open your browser to `http://localhost:8080`
3. Click "Sign In" 
4. Click "Continue with Google"
5. You should see Google's sign-in page

## Common Issues

### Error: "Invalid Client"
- Check that your Client ID is correct
- Verify the authorized origins include your current URL

### Error: "Redirect URI Mismatch"
- Add your exact redirect URI to the OAuth client settings
- Make sure it matches exactly (http vs https, trailing slashes)

### Error: "Access Blocked"
- Your app might be in testing mode
- Add test users in the OAuth consent screen settings

## Security Notes

- Never commit your actual Client ID to public repositories
- Use environment variables for sensitive data
- Keep your Client Secret secure (for server-side auth)
- Regularly rotate your JWT secret

## Next Steps

After setting up Google OAuth:
1. Test the sign-in flow
2. Verify user data is stored correctly
3. Test the onboarding flow for new users
4. Ensure logout functionality works