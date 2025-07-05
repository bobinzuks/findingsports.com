# 🔐 Google OAuth Setup Guide for Finding Sports

## Prerequisites

1. **Google Account**: You need a Google account to access Google Cloud Console
2. **Domain/URL**: For production, you'll need your actual domain. For development, use `http://localhost`

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Name it: `finding-sports`
4. Click "Create"

### 2. Enable Google+ API

1. In the Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - User Type: External
   - App name: Finding Sports
   - User support email: Your email
   - App logo: Upload your logo
   - Application home page: `https://findingsports.com`
   - Authorized domains: `findingsports.com`
   - Developer contact: Your email

### 4. Configure OAuth Client

1. Application type: "Web application"
2. Name: "Finding Sports Web Client"
3. Authorized JavaScript origins:
   ```
   http://localhost:3000
   http://localhost:8080
   https://findingsports.com
   ```
4. Authorized redirect URIs:
   ```
   http://localhost:3000/auth/google/callback
   http://localhost:8080/auth/google/callback
   https://findingsports.com/auth/google/callback
   ```
5. Click "Create"

### 5. Save Your Credentials

You'll receive:
- **Client ID**: `YOUR_CLIENT_ID.apps.googleusercontent.com`
- **Client Secret**: `YOUR_CLIENT_SECRET`

## Implementation Steps

### 1. Update Frontend Code

Edit `/mockup/auth/google-oauth.js`:
```javascript
const GOOGLE_CLIENT_ID = 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com';
```

### 2. Update Backend Environment

Create `.env` file in your backend:
```env
GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
```

### 3. Backend OAuth Handler

Create `/mockup/api/auth/google.js`:
```javascript
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Handle Google Sign-In
app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;
    
    try {
        // Verify the Google token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        
        // Create or update user in database
        const user = await createOrUpdateUser({
            googleId: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            emailVerified: payload.email_verified
        });
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture
            },
            isNewUser: user.isNew
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
});
```

## Testing OAuth Flow

### 1. Start Local Server
```bash
./start-quick.sh
```

### 2. Access Login Page
Navigate to: `http://localhost:PORT/login-google.html`

### 3. Test Sign-In Flow
1. Click "Continue with Google"
2. Select your Google account
3. Grant permissions
4. You should be redirected to onboarding (new users) or main app

## Security Best Practices

### 1. Environment Variables
Never commit credentials to git:
```bash
# .gitignore
.env
.env.local
.env.production
```

### 2. HTTPS in Production
Always use HTTPS for OAuth in production:
- Update redirect URIs in Google Console
- Use SSL certificates (Let's Encrypt)

### 3. Token Storage
- Store tokens securely (httpOnly cookies preferred)
- Implement token refresh mechanism
- Set appropriate expiration times

### 4. Scope Management
Only request necessary scopes:
```javascript
scope: [
    'openid',           // Basic OpenID
    'email',            // Email address
    'profile',          // Basic profile info
    'calendar.events'   // Only if needed for game scheduling
]
```

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" Error**
   - Ensure redirect URI matches exactly in Google Console
   - Check for trailing slashes
   - Verify protocol (http vs https)

2. **"invalid_client" Error**
   - Double-check Client ID and Secret
   - Ensure they're from the same project

3. **"Access blocked" Error**
   - Complete OAuth consent screen configuration
   - For development, add test users

### Debug Mode

Enable debug logging:
```javascript
// In google-oauth.js
const DEBUG = true;

if (DEBUG) {
    console.log('OAuth Response:', response);
    console.log('Decoded token:', payload);
}
```

## Production Deployment

### 1. Update OAuth Settings
- Add production domain to authorized origins
- Add production callback URLs
- Update privacy policy URL
- Submit for Google verification (if needed)

### 2. Environment Configuration
```env
# Production .env
GOOGLE_CLIENT_ID=production_client_id
GOOGLE_CLIENT_SECRET=production_secret
GOOGLE_REDIRECT_URI=https://findingsports.com/auth/google/callback
NODE_ENV=production
```

### 3. Security Headers
Add security headers for production:
```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://accounts.google.com"],
            frameSrc: ["https://accounts.google.com"]
        }
    }
}));
```

## Quick Implementation Checklist

- [ ] Create Google Cloud Project
- [ ] Enable Google+ API
- [ ] Create OAuth credentials
- [ ] Update frontend with Client ID
- [ ] Implement backend OAuth handler
- [ ] Test login flow locally
- [ ] Set up environment variables
- [ ] Add error handling
- [ ] Test new user onboarding
- [ ] Test returning user flow
- [ ] Deploy to staging
- [ ] Update production credentials
- [ ] Submit for Google verification

## Support Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In JavaScript Guide](https://developers.google.com/identity/gsi/web/guides/overview)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

Remember to keep your Client Secret secure and never expose it in frontend code!