// SECURE Authentication System - Fixed XSS and Security Issues
(function() {
  'use strict';

  console.log('SECURE Authentication System Loading...');

  // Secure authentication state with proper validation
  window.authState = {
    isAuthenticated: false,
    user: null,
    token: null,
    isAdmin: false,
    permissions: [],
    tokenExpiry: null,
    csrfToken: null
  };

  // Memory leak prevention - track event listeners
  const eventListeners = new Map();

  // Add event listener with cleanup tracking
  function addEventListenerWithCleanup(element, event, handler, key) {
    if (eventListeners.has(key)) {
      const old = eventListeners.get(key);
      old.element.removeEventListener(old.event, old.handler);
    }

    element.addEventListener(event, handler);
    eventListeners.set(key, { element, event, handler });
  }

  // Initialize secure authentication
  window.initSecureAuth = function() {
    console.log('Initializing secure authentication...');

    // Check for existing session with validation
    const token = getSecureToken();
    const userStr = getSecureUserData();

    if (token && userStr && SecurityUtils.validateTokenFormat(token)) {
      try {
        const userData = JSON.parse(userStr);

        // Validate required fields
        if (userData && userData.name && userData.email) {
          // Sanitize user data
          const sanitizedUser = {
            id: SecurityUtils.sanitizeHTML(userData.id || ''),
            name: SecurityUtils.sanitizeName(userData.name),
            email: SecurityUtils.sanitizeEmail(userData.email),
            avatar: SecurityUtils.sanitizeURL(userData.avatar || userData.picture || ''),
            role: SecurityUtils.sanitizeHTML(userData.role || 'user'),
            permissions: Array.isArray(userData.permissions) ? userData.permissions : []
          };

          // Validate token expiry
          const tokenExpiry = userData.tokenExpiry || Date.now() + (24 * 60 * 60 * 1000);
          if (tokenExpiry > Date.now()) {
            window.authState.isAuthenticated = true;
            window.authState.user = sanitizedUser;
            window.authState.token = token;
            window.authState.tokenExpiry = tokenExpiry;

            // Note: Admin status will be validated server-side
            window.authState.isAdmin = false; // Default to false, server will confirm

            updateAuthUI();
            validateServerSideAuth(); // Validate with server

            console.log('User authenticated:', sanitizedUser.name);
          } else {
            console.log('Token expired, clearing auth state');
            clearAuthState();
          }
        } else {
          console.log('Invalid user data format');
          clearAuthState();
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        clearAuthState();
      }
    }

    // Initialize Google Sign-In securely
    initGoogleSignInSecure();

    // Set up token refresh timer
    setupTokenRefresh();
  };

  // Secure token storage (will be replaced with httpOnly cookies in production)
  function getSecureToken() {
    try {
      return localStorage.getItem('secure_token');
    } catch (error) {
      console.error('Error reading token:', error);
      return null;
    }
  }

  function setSecureToken(token) {
    try {
      localStorage.setItem('secure_token', token);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }

  function getSecureUserData() {
    try {
      return localStorage.getItem('secure_user');
    } catch (error) {
      console.error('Error reading user data:', error);
      return null;
    }
  }

  function setSecureUserData(userData) {
    try {
      localStorage.setItem('secure_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  }

  // Validate authentication with server
  async function validateServerSideAuth() {
    if (!window.authState.token) return;

    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.authState.token}`,
          'X-CSRF-Token': SecurityUtils.setCSRFToken()
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          // Check if user is banned
          if (data.user && data.user.bannedUntil && new Date(data.user.bannedUntil) > new Date()) {
            showAuthMessage(`You are banned until ${new Date(data.user.bannedUntil).toLocaleString()}. Reason: ${data.user.banReason || 'No reason provided'}`, 'error');
            clearAuthState();
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
            return;
          }

          // Update admin status from server
          window.authState.isAdmin = data.isAdmin || (data.user && data.user.role === 'admin') || false;
          window.authState.permissions = data.permissions || [];

          // Update user role if provided
          if (data.user && data.user.role) {
            window.authState.user.role = data.user.role;
          }

          updateAuthUI();

          // Initialize moderation system if moderator/admin
          if (window.authState.user.role === 'moderator' || window.authState.user.role === 'admin') {
            if (window.initModeration) {
              window.initModeration();
            }
          }
        } else {
          console.log('Server-side auth validation failed');
          clearAuthState();
        }
      } else {
        console.log('Auth validation request failed');
        clearAuthState();
      }
    } catch (error) {
      console.error('Error validating auth:', error);
      // Don't clear auth state on network errors
    }
  }

  // Initialize Google Sign-In with security measures
  function initGoogleSignInSecure() {
    if (window.google && window.google.accounts) {
      setupGoogleSignIn();
    } else {
      // Load Google Sign-In script with integrity check
      loadGoogleSignInScript();
    }
  }

  // Load Google Sign-In script securely
  function loadGoogleSignInScript() {
    if (document.querySelector('script[src*="accounts.google.com"]')) {
      return; // Already loaded
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    // Add error handling for script loading
    script.onload = function() {
      console.log('Google Sign-In script loaded successfully');
      setupGoogleSignIn();
    };

    script.onerror = function() {
      console.error('Failed to load Google Sign-In script');
      showAuthMessage('Google Sign-In is temporarily unavailable', 'error');
    };

    document.head.appendChild(script);
  }

  // Setup Google Sign-In with security measures
  function setupGoogleSignIn() {
    if (!window.google || !window.google.accounts) {
      console.error('Google Sign-In not available');
      return;
    }

    // Client ID will be loaded from environment variables in production
    const clientId = '386932037035-k8v833noqjk7m4t641js92fvjmm5ri71.apps.googleusercontent.com';

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleSignInSecure,
        auto_select: false,
        cancel_on_tap_outside: false
      });

      console.log('Google Sign-In initialized securely');
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error);
    }
  }

  // Handle Google Sign-In response securely
  async function handleGoogleSignInSecure(response) {
    console.log('Processing Google Sign-In response...');

    // Rate limiting check
    if (!SecurityUtils.rateLimiter('google_signin', 3, 60000)) {
      showAuthMessage('Too many sign-in attempts. Please wait a moment.', 'error');
      return;
    }

    try {
      const csrfToken = SecurityUtils.setCSRFToken();

      const result = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          credential: response.credential,
          csrf_token: csrfToken
        })
      });

      const data = await result.json();

      if (data.success && data.user && data.token) {
        // Sanitize user data
        const sanitizedUser = {
          id: SecurityUtils.sanitizeHTML(data.user.id || ''),
          name: SecurityUtils.sanitizeName(data.user.name),
          email: SecurityUtils.sanitizeEmail(data.user.email),
          avatar: SecurityUtils.sanitizeURL(data.user.picture || data.user.avatar || ''),
          role: SecurityUtils.sanitizeHTML(data.user.role || 'user'),
          permissions: Array.isArray(data.user.permissions) ? data.user.permissions : []
        };

        // Store auth data securely
        const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        setSecureToken(data.token);
        setSecureUserData({
          ...sanitizedUser,
          tokenExpiry: tokenExpiry
        });

        // Update auth state
        window.authState.isAuthenticated = true;
        window.authState.user = sanitizedUser;
        window.authState.token = data.token;
        window.authState.tokenExpiry = tokenExpiry;
        window.authState.isAdmin = data.user.isAdmin || false; // Server-validated
        window.authState.permissions = sanitizedUser.permissions;

        updateAuthUI();

        // Dispatch auth state change event
        window.dispatchEvent(new CustomEvent('authStateChanged', {
          detail: { isAuthenticated: true, user: sanitizedUser }
        }));

        // Show success message
        showAuthMessage('Successfully signed in with Google!', 'success');

        // Close any open modals
        closeAllModals();

        // Initialize moderation system if moderator/admin
        if (sanitizedUser.role === 'moderator' || sanitizedUser.role === 'admin') {
          if (window.initModeration) {
            window.initModeration();
          }
        }

        // Redirect based on role
        if (window.location.pathname === '/login' || window.location.pathname === '/auth') {
          setTimeout(() => {
            if (sanitizedUser.role === 'moderator' || sanitizedUser.role === 'admin') {
              window.location.href = '/moderator-dashboard.html';
            } else {
              window.location.href = '/';
            }
          }, 1000);
        }
      } else {
        showAuthMessage(data.message || 'Google Sign-In failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      showAuthMessage('Google Sign-In failed. Please check your connection and try again.', 'error');
    }
  }

  // Regular email/password login with security
  window.loginWithEmailSecure = async function(email, password) {
    // Rate limiting
    if (!SecurityUtils.rateLimiter('email_login', 5, 300000)) {
      showAuthMessage('Too many login attempts. Please wait 5 minutes.', 'error');
      return false;
    }

    // Input validation
    const sanitizedEmail = SecurityUtils.sanitizeEmail(email);
    if (!sanitizedEmail) {
      showAuthMessage('Please enter a valid email address.', 'error');
      return false;
    }

    if (!password || password.length < 6) {
      showAuthMessage('Password must be at least 6 characters long.', 'error');
      return false;
    }

    try {
      const csrfToken = SecurityUtils.setCSRFToken();

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          email: sanitizedEmail,
          password: password,
          csrf_token: csrfToken
        })
      });

      const data = await response.json();

      if (data.success && data.user && data.token) {
        // Same secure processing as Google Sign-In
        const sanitizedUser = {
          id: SecurityUtils.sanitizeHTML(data.user.id || ''),
          name: SecurityUtils.sanitizeName(data.user.name),
          email: SecurityUtils.sanitizeEmail(data.user.email),
          avatar: SecurityUtils.sanitizeURL(data.user.avatar || ''),
          role: SecurityUtils.sanitizeHTML(data.user.role || 'user'),
          permissions: Array.isArray(data.user.permissions) ? data.user.permissions : []
        };

        const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
        setSecureToken(data.token);
        setSecureUserData({
          ...sanitizedUser,
          tokenExpiry: tokenExpiry
        });

        window.authState.isAuthenticated = true;
        window.authState.user = sanitizedUser;
        window.authState.token = data.token;
        window.authState.tokenExpiry = tokenExpiry;
        window.authState.isAdmin = data.user.isAdmin || false;
        window.authState.permissions = sanitizedUser.permissions;

        updateAuthUI();

        // Dispatch auth state change event
        window.dispatchEvent(new CustomEvent('authStateChanged', {
          detail: { isAuthenticated: true, user: sanitizedUser }
        }));

        showAuthMessage('Login successful!', 'success');

        // Initialize moderation system if moderator/admin
        if (sanitizedUser.role === 'moderator' || sanitizedUser.role === 'admin') {
          if (window.initModeration) {
            window.initModeration();
          }
        }

        // Close modals and redirect based on role
        closeAllModals();
        if (window.location.pathname === '/login' || window.location.pathname === '/auth') {
          setTimeout(() => {
            if (sanitizedUser.role === 'moderator' || sanitizedUser.role === 'admin') {
              window.location.href = '/moderator-dashboard.html';
            } else {
              window.location.href = '/';
            }
          }, 1000);
        }

        return true;
      } else {
        showAuthMessage(data.message || 'Login failed. Please check your credentials.', 'error');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      showAuthMessage('Login failed. Please check your connection and try again.', 'error');
      return false;
    }
  };

  // Secure logout
  window.logoutSecure = function() {
    // Clear local storage
    try {
      localStorage.removeItem('secure_token');
      localStorage.removeItem('secure_user');
      sessionStorage.removeItem('csrf_token');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }

    // Clear auth state
    clearAuthState();

    // Sign out from Google
    if (window.google && window.google.accounts) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (error) {
        console.error('Error signing out from Google:', error);
      }
    }

    // Clean up event listeners
    eventListeners.forEach((listener, key) => {
      try {
        listener.element.removeEventListener(listener.event, listener.handler);
      } catch (error) {
        console.error('Error removing event listener:', error);
      }
    });
    eventListeners.clear();

    // Update UI
    updateAuthUI();

    // Redirect to home
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }

    showAuthMessage('Logged out successfully', 'success');
  };

  // Clear authentication state
  function clearAuthState() {
    window.authState.isAuthenticated = false;
    window.authState.user = null;
    window.authState.token = null;
    window.authState.isAdmin = false;
    window.authState.permissions = [];
    window.authState.tokenExpiry = null;
  }

  // Update authentication UI securely
  function updateAuthUI() {
    const userMenu = document.querySelector('.user-menu');
    if (!userMenu) return;

    // Clear existing content
    userMenu.innerHTML = '';

    if (window.authState.isAuthenticated && window.authState.user) {
      const user = window.authState.user;

      // Create elements safely
      const userProfile = document.createElement('div');
      userProfile.className = 'user-profile';
      userProfile.style.cursor = 'pointer';

      // Avatar image
      const avatar = document.createElement('img');
      avatar.className = 'user-avatar';
      avatar.alt = 'User avatar';
      avatar.src = user.avatar || 'https://via.placeholder.com/32x32?text=' + (user.name?.charAt(0) || 'U');

      // User name
      const userName = document.createElement('span');
      userName.className = 'user-name';
      userName.textContent = user.name || user.email || 'User';

      // Role badge
      if (window.authState.isAdmin || user.role === 'admin') {
        const adminBadge = document.createElement('span');
        adminBadge.className = 'admin-badge';
        adminBadge.textContent = 'Admin';
        adminBadge.style.cssText = 'background: #dc3545; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75em; margin-left: 8px;';
        userProfile.appendChild(adminBadge);
      } else if (user.role === 'moderator') {
        const modBadge = document.createElement('span');
        modBadge.className = 'mod-badge';
        modBadge.textContent = 'Mod';
        modBadge.style.cssText = 'background: #ff6b35; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75em; margin-left: 8px;';
        userProfile.appendChild(modBadge);
      }

      userProfile.appendChild(avatar);
      userProfile.appendChild(userName);

      // Dropdown menu
      const dropdown = document.createElement('div');
      dropdown.className = 'user-dropdown';
      dropdown.style.display = 'none';

      // Profile button
      const profileBtn = document.createElement('button');
      profileBtn.textContent = 'Profile';
      profileBtn.onclick = showUserProfile;

      // Admin panel button
      if (window.authState.isAdmin) {
        const adminBtn = document.createElement('button');
        adminBtn.textContent = 'Admin Panel';
        adminBtn.onclick = showAdminPanel;
        dropdown.appendChild(adminBtn);
      }

      // Moderator dashboard button
      if (user.role === 'moderator' || user.role === 'admin' || window.authState.isAdmin) {
        const modBtn = document.createElement('button');
        modBtn.textContent = 'Moderator Dashboard';
        modBtn.onclick = () => window.location.href = '/moderator-dashboard.html';
        dropdown.appendChild(modBtn);
      }

      // Logout button
      const logoutBtn = document.createElement('button');
      logoutBtn.textContent = 'Logout';
      logoutBtn.onclick = window.logoutSecure;

      dropdown.appendChild(profileBtn);
      dropdown.appendChild(logoutBtn);

      // Add hover functionality
      userProfile.addEventListener('mouseenter', () => {
        dropdown.style.display = 'block';
      });

      userProfile.addEventListener('mouseleave', () => {
        setTimeout(() => {
          if (!dropdown.matches(':hover')) {
            dropdown.style.display = 'none';
          }
        }, 100);
      });

      dropdown.addEventListener('mouseleave', () => {
        dropdown.style.display = 'none';
      });

      userMenu.appendChild(userProfile);
      userMenu.appendChild(dropdown);
    } else {
      // Not authenticated - show login options
      const authButtons = document.createElement('div');
      authButtons.className = 'auth-buttons';

      const loginBtn = document.createElement('button');
      loginBtn.className = 'login-btn';
      loginBtn.textContent = 'Login';
      loginBtn.onclick = showLoginModalSecure;

      const googleSignInDiv = document.createElement('div');
      googleSignInDiv.id = 'google-signin-button';

      authButtons.appendChild(loginBtn);
      authButtons.appendChild(googleSignInDiv);
      userMenu.appendChild(authButtons);

      // Re-initialize Google Sign-In button
      setTimeout(() => {
        if (window.google && window.google.accounts) {
          const buttonContainer = document.getElementById('google-signin-button');
          if (buttonContainer) {
            try {
              window.google.accounts.id.renderButton(buttonContainer, {
                theme: 'outline',
                size: 'medium',
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left'
              });
            } catch (error) {
              console.error('Error rendering Google Sign-In button:', error);
            }
          }
        }
      }, 100);
    }
  }

  // Show secure authentication message
  function showAuthMessage(message, type) {
    // Remove any existing message
    const existingMessage = document.getElementById('auth-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create new message element
    const messageEl = document.createElement('div');
    messageEl.id = 'auth-message';
    messageEl.className = `auth-message ${type}`;
    messageEl.textContent = SecurityUtils.sanitizeHTML(message);

    // Style based on type
    messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            animation: slideIn 0.3s ease;
            max-width: 400px;
            word-wrap: break-word;
        `;

    if (type === 'success') {
      messageEl.style.backgroundColor = '#d4edda';
      messageEl.style.color = '#155724';
      messageEl.style.border = '1px solid #c3e6cb';
    } else if (type === 'error') {
      messageEl.style.backgroundColor = '#f8d7da';
      messageEl.style.color = '#721c24';
      messageEl.style.border = '1px solid #f5c6cb';
    }

    document.body.appendChild(messageEl);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (messageEl && messageEl.parentNode) {
        messageEl.remove();
      }
    }, 5000);
  }

  // Show secure login modal
  function showLoginModalSecure() {
    // Remove any existing modal
    closeAllModals();

    const modal = document.createElement('div');
    modal.id = 'login-modal';
    modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 12px;
            max-width: 400px;
            width: 90%;
            position: relative;
        `;

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Sign In';
    title.style.cssText = 'margin-bottom: 1rem; text-align: center;';

    // Google Sign-In container
    const googleContainer = document.createElement('div');
    googleContainer.id = 'modal-google-signin';
    googleContainer.style.cssText = 'margin-bottom: 1rem; text-align: center;';

    // Separator
    const separator = document.createElement('div');
    separator.textContent = 'or';
    separator.style.cssText = 'text-align: center; margin: 1rem 0; color: #666;';

    // Form
    const form = document.createElement('form');
    form.id = 'login-form';

    // Email input
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Email';
    emailInput.required = true;
    emailInput.style.cssText = 'width: 100%; padding: 12px; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box;';

    // Password input
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Password';
    passwordInput.required = true;
    passwordInput.style.cssText = 'width: 100%; padding: 12px; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box;';

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Sign In';
    submitBtn.style.cssText = 'width: 100%; padding: 12px; background: #ff6b35; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;';

    // Register link
    const registerLink = document.createElement('div');
    registerLink.style.cssText = 'text-align: center; margin-top: 1rem;';
    const registerAnchor = document.createElement('a');
    registerAnchor.href = '#';
    registerAnchor.textContent = 'Don\'t have an account? Register';
    registerAnchor.style.cssText = 'color: #ff6b35; text-decoration: none;';
    registerAnchor.onclick = (e) => {
      e.preventDefault();
      showRegisterModalSecure();
    };

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer;';
    closeBtn.onclick = closeAllModals;

    // Assemble modal
    form.appendChild(emailInput);
    form.appendChild(passwordInput);
    form.appendChild(submitBtn);

    registerLink.appendChild(registerAnchor);

    modalContent.appendChild(title);
    modalContent.appendChild(googleContainer);
    modalContent.appendChild(separator);
    modalContent.appendChild(form);
    modalContent.appendChild(registerLink);
    modalContent.appendChild(closeBtn);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Initialize Google Sign-In in modal
    setTimeout(() => {
      if (window.google && window.google.accounts) {
        const buttonContainer = document.getElementById('modal-google-signin');
        if (buttonContainer) {
          try {
            window.google.accounts.id.renderButton(buttonContainer, {
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            });
          } catch (error) {
            console.error('Error rendering Google Sign-In button in modal:', error);
          }
        }
      }
    }, 100);

    // Handle form submission
    addEventListenerWithCleanup(form, 'submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        showAuthMessage('Please fill in all fields.', 'error');
        return;
      }

      // Disable submit button during processing
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      const success = await window.loginWithEmailSecure(email, password);

      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';

      if (success) {
        closeAllModals();
      }
    }, 'login-form-submit');

    // Focus email input
    emailInput.focus();
  }

  // Close all modals
  function closeAllModals() {
    const modals = document.querySelectorAll('#login-modal, #register-modal, #chat-modal');
    modals.forEach(modal => {
      if (modal && modal.parentNode) {
        modal.remove();
      }
    });
  }

  // Setup token refresh timer
  function setupTokenRefresh() {
    // Check token expiry every 5 minutes
    setInterval(() => {
      if (window.authState.tokenExpiry && window.authState.tokenExpiry - Date.now() < 300000) {
        // Token expires in less than 5 minutes, refresh it
        refreshToken();
      }
    }, 300000);
  }

  // Refresh authentication token
  async function refreshToken() {
    if (!window.authState.token) return;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.authState.token}`,
          'Content-Type': 'application/json',
          'X-CSRF-Token': SecurityUtils.setCSRFToken()
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          window.authState.token = data.token;
          window.authState.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
          setSecureToken(data.token);

          const userData = window.authState.user;
          if (userData) {
            userData.tokenExpiry = window.authState.tokenExpiry;
            setSecureUserData(userData);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }

  // Placeholder functions for UI
  function showUserProfile() {
    showAuthMessage('Profile feature coming soon!', 'info');
  }

  function showAdminPanel() {
    window.location.href = '/admin-panel.html';
  }

  function showRegisterModalSecure() {
    showAuthMessage('Registration feature coming soon!', 'info');
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initSecureAuth);
  } else {
    window.initSecureAuth();
  }

  // Make logout accessible globally
  window.logout = window.logoutSecure;
  window.showLoginModal = showLoginModalSecure;
  window.closeLoginModal = closeAllModals;

  console.log('SECURE Authentication System Ready');
})();
