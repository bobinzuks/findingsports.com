// Google OAuth Configuration
// Using a test client ID for development - replace with your own in production
const GOOGLE_CLIENT_ID = '386932037035-k8v833noqjk7m4t641js92fvjmm5ri71.apps.googleusercontent.com';
const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;

// Initialize Google Sign-In
window.initializeGoogleAuth = function () {
    // Load the Google API client library
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
        google.accounts.id.initialize({
            clientId: GOOGLE_CLIENT_ID,
            callback: window.handleCredentialResponse,
            autoSelect: false,
            cancelOnTapOutside: true
        });

        // Render the Google Sign-In button
        google.accounts.id.renderButton(document.getElementById('googleSignInButton'), {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'rectangular',
            logoAlignment: 'left'
        });
    };
};

// Handle the credential response from Google
window.handleCredentialResponse = async function (response) {
    const { credential } = response;

    try {
        // Load API if needed
        if (!window.api) {
            const script = document.createElement('script');
            script.src = '/js/api.js';
            document.head.appendChild(script);
            await new Promise(resolve => {
                script.onload = resolve;
            });
        }

        // Use API to authenticate
        const data = await window.api.googleLogin(credential);

        // Check if this is a new user or needs onboarding
        if (data.isNewUser || !data.user.onboarded) {
            // Redirect to onboarding
            window.location.href = '/onboarding/';
        } else {
            // Redirect to main app
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Google authentication error:', error);
        window.showError(`Failed to sign in with Google: ${error.message}`);
    }
};

// Alternative OAuth flow for more control
window.signInWithGoogleOAuth = function () {
    const authUrl =
        'https://accounts.google.com/o/oauth2/v2/auth?' +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        'response_type=code&' +
        `scope=${encodeURIComponent('openid email profile https://www.googleapis.com/auth/calendar.events')}&` +
        'access_type=offline&' +
        'prompt=consent';

    window.location.href = authUrl;
};

// Handle OAuth callback
window.handleOAuthCallback = async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
        console.error('OAuth error:', error);
        window.showError(`Authentication failed: ${error}`);
        window.setTimeout(() => {
            window.location.href = '/login-google.html';
        }, 3000);
        return;
    }

    if (code) {
        try {
            // Exchange code for tokens
            const response = await fetch('/api/auth/google/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code, redirectUri: REDIRECT_URI })
            });

            if (response.ok) {
                const data = await response.json();

                // Store authentication data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                localStorage.setItem('googleTokens', JSON.stringify(data.googleTokens));

                // Redirect based on user status
                if (data.isNewUser) {
                    window.location.href = '/onboarding';
                } else {
                    window.location.href = '/';
                }
            } else {
                throw new Error('Failed to exchange authorization code');
            }
        } catch (oauthError) {
            console.error('OAuth callback error:', oauthError);
            window.showError(`Failed to complete authentication: ${oauthError.message}`);
            window.setTimeout(() => {
                window.location.href = '/login-google.html';
            }, 3000);
        }
    }
};

// Check if we're on the callback page
if (window.location.pathname === '/auth/google/callback') {
    window.handleOAuthCallback();
}

// Utility function to show errors
window.showError = function (message) {
    const errorDiv = document.getElementById('authError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        alert(message);
    }
};

// Export functions for use in other modules
window.GoogleAuth = {
    initialize: window.initializeGoogleAuth,
    signIn: window.signInWithGoogleOAuth,
    handleCallback: window.handleOAuthCallback
};
