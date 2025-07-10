# Google OAuth Setup Guide

## Current Configuration

The application is configured with a test Google OAuth client ID that works for development. However, for production use, you should create your own Google OAuth credentials.

### Test Credentials (Development Only)
- **Client ID**: `386932037035-k8v833noqjk7m4t641js92fvjmm5ri71.apps.googleusercontent.com`
- **Status**: Active and working for localhost testing

## How to Test Google Authentication

1. **Start the Backend Server**:
   ```bash
   cd mockup/backend
   npm install  # If not already done
   npm start
   ```

2. **Access the Application**:
   - Open your browser to: `http://localhost:8080/login-google.html`
   - Or use the test page: `http://localhost:8080/test-google-auth.html`

3. **Test Sign-In**:
   - Click the "Continue with Google" button
   - Sign in with any Google account
   - The system will create a new user account automatically

## Setting Up Your Own Google OAuth Credentials

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (required for OAuth)

### Step 2: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure the OAuth consent screen first:
   - Application name: "Finding Sports"
   - User support email: Your email
   - Authorized domains: Your production domain
4. Create OAuth client ID:
   - Application type: "Web application"
   - Name: "Finding Sports Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:8080` (for development)
     - `https://your-domain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:8080/auth/google/callback`
     - `https://your-domain.com/auth/google/callback`

### Step 3: Update the Application
1. Copy your new Client ID
2. Update the following files:
   - `/mockup/auth/google-oauth.js` - Replace `GOOGLE_CLIENT_ID`
   - `/mockup/backend/.env` - Set `GOOGLE_CLIENT_ID`

## Common Issues and Solutions

### Issue 1: "Authentication failed" Error
**Cause**: Invalid or missing Google Client ID
**Solution**: 
- Verify the Client ID is correct in both frontend and backend
- Check that the Client ID matches the authorized origins

### Issue 2: Popup Blocked
**Cause**: Browser blocking popups
**Solution**: 
- Allow popups for localhost
- Use the Google Sign-In button instead of custom button

### Issue 3: "idpiframe_initialization_failed"
**Cause**: Third-party cookies blocked or domain not authorized
**Solution**:
- Enable third-party cookies in browser settings
- Add your domain to authorized JavaScript origins

### Issue 4: User Not Created in Database
**Cause**: Backend not properly handling the credential
**Solution**:
- Check server logs for errors
- Verify JWT_SECRET is set in environment
- Ensure google-auth-library is installed

## Security Considerations

1. **Never commit real credentials to Git**
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **Use HTTPS in production**
   - Google OAuth requires HTTPS for non-localhost domains

3. **Validate tokens on backend**
   - Always verify Google tokens server-side
   - Don't trust client-side authentication alone

## Testing Checklist

- [ ] Backend server starts without errors
- [ ] Google Sign-In button renders
- [ ] Clicking button opens Google sign-in popup
- [ ] After sign-in, user is redirected properly
- [ ] User data is stored in backend
- [ ] Auth token is saved to localStorage
- [ ] Protected endpoints require valid token
- [ ] New users are marked for onboarding
- [ ] Existing users skip onboarding

## Environment Variables

Create `/mockup/backend/.env` with:

```env
# Server
PORT=8080
NODE_ENV=development

# Authentication
JWT_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret  # Not used for implicit flow

# CORS
CORS_ORIGIN=http://localhost:8080
```

## Support Resources

- [Google Identity Platform Docs](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [Google Cloud Console](https://console.cloud.google.com/)