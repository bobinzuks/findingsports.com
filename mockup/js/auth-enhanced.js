// Enhanced Authentication System with Google Sign-In and Admin Support
(function() {
    'use strict';
    
    console.log('Enhanced Authentication System Loading...');
    
    // Global authentication state
    window.authState = {
        isAuthenticated: false,
        user: null,
        token: null,
        isAdmin: false,
        permissions: []
    };
    
    // Initialize authentication
    window.initAuth = function() {
        console.log('Initializing authentication...');
        
        // Check for existing session
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            try {
                const userData = JSON.parse(user);
                window.authState.isAuthenticated = true;
                window.authState.user = userData;
                window.authState.token = token;
                window.authState.isAdmin = userData.role === 'admin' || userData.isAdmin;
                window.authState.permissions = userData.permissions || [];
                
                updateAuthUI();
                console.log('User authenticated:', userData.name || userData.email);
            } catch (error) {
                console.error('Error parsing user data:', error);
                clearAuthState();
            }
        }
        
        // Initialize Google Sign-In if available
        if (window.google && window.google.accounts) {
            initGoogleSignIn();
        } else {
            // Load Google Sign-In script
            loadGoogleSignInScript();
        }
    };
    
    // Load Google Sign-In script
    function loadGoogleSignInScript() {
        if (document.querySelector('script[src*="accounts.google.com"]')) {
            return; // Already loaded
        }
        
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGoogleSignIn;
        document.head.appendChild(script);
    }
    
    // Initialize Google Sign-In
    function initGoogleSignIn() {
        if (!window.google || !window.google.accounts) {
            console.error('Google Sign-In not available');
            return;
        }
        
        const clientId = '386932037035-k8v833noqjk7m4t641js92fvjmm5ri71.apps.googleusercontent.com';
        
        try {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleSignIn,
                auto_select: false,
                cancel_on_tap_outside: false
            });
            
            // Render sign-in button if container exists
            const buttonContainer = document.getElementById('google-signin-button');
            if (buttonContainer) {
                window.google.accounts.id.renderButton(buttonContainer, {
                    theme: 'outline',
                    size: 'large',
                    text: 'signin_with',
                    shape: 'rectangular',
                    logo_alignment: 'left'
                });
            }
            
            console.log('Google Sign-In initialized');
        } catch (error) {
            console.error('Error initializing Google Sign-In:', error);
        }
    }
    
    // Handle Google Sign-In response
    async function handleGoogleSignIn(response) {
        console.log('Google Sign-In response received');
        
        try {
            const result = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    credential: response.credential
                })
            });
            
            const data = await result.json();
            
            if (data.success) {
                // Store auth data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Update auth state
                window.authState.isAuthenticated = true;
                window.authState.user = data.user;
                window.authState.token = data.token;
                window.authState.isAdmin = data.user.role === 'admin' || data.user.isAdmin;
                window.authState.permissions = data.user.permissions || [];
                
                updateAuthUI();
                
                // Show success message
                showAuthMessage('Successfully signed in with Google!', 'success');
                
                // Redirect if needed
                if (window.location.pathname === '/login' || window.location.pathname === '/auth') {
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                }
            } else {
                showAuthMessage(data.message || 'Google Sign-In failed', 'error');
            }
        } catch (error) {
            console.error('Google Sign-In error:', error);
            showAuthMessage('Google Sign-In failed', 'error');
        }
    }
    
    // Regular email/password login
    window.loginWithEmail = async function(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                window.authState.isAuthenticated = true;
                window.authState.user = data.user;
                window.authState.token = data.token;
                window.authState.isAdmin = data.user.role === 'admin' || data.user.isAdmin;
                window.authState.permissions = data.user.permissions || [];
                
                updateAuthUI();
                showAuthMessage('Login successful!', 'success');
                
                return true;
            } else {
                showAuthMessage(data.message || 'Login failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            showAuthMessage('Login failed', 'error');
            return false;
        }
    };
    
    // Register new user
    window.registerUser = async function(email, password, name) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, name })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                window.authState.isAuthenticated = true;
                window.authState.user = data.user;
                window.authState.token = data.token;
                window.authState.isAdmin = data.user.role === 'admin' || data.user.isAdmin;
                window.authState.permissions = data.user.permissions || [];
                
                updateAuthUI();
                showAuthMessage('Registration successful!', 'success');
                
                return true;
            } else {
                showAuthMessage(data.message || 'Registration failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Registration error:', error);
            showAuthMessage('Registration failed', 'error');
            return false;
        }
    };
    
    // Logout
    window.logout = function() {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Clear auth state
        clearAuthState();
        
        // Sign out from Google
        if (window.google && window.google.accounts) {
            window.google.accounts.id.disableAutoSelect();
        }
        
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
    }
    
    // Update authentication UI
    function updateAuthUI() {
        const userMenu = document.querySelector('.user-menu');
        if (!userMenu) return;
        
        if (window.authState.isAuthenticated) {
            const user = window.authState.user;
            const avatar = user.picture || user.avatar || 'https://via.placeholder.com/32x32?text=' + (user.name?.charAt(0) || 'U');
            
            userMenu.innerHTML = `
                <div class="user-profile">
                    <img src="${avatar}" alt="${user.name || user.email}" class="user-avatar">
                    <span class="user-name">${user.name || user.email}</span>
                    ${window.authState.isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
                </div>
                <div class="user-dropdown">
                    <button onclick="showUserProfile()">Profile</button>
                    ${window.authState.isAdmin ? '<button onclick="showAdminPanel()">Admin Panel</button>' : ''}
                    <button onclick="logout()">Logout</button>
                </div>
            `;
        } else {
            userMenu.innerHTML = `
                <div class="auth-buttons">
                    <button onclick="showLoginModal()" class="login-btn">Login</button>
                    <div id="google-signin-button"></div>
                </div>
            `;
            
            // Re-initialize Google Sign-In button
            setTimeout(() => {
                if (window.google && window.google.accounts) {
                    const buttonContainer = document.getElementById('google-signin-button');
                    if (buttonContainer) {
                        window.google.accounts.id.renderButton(buttonContainer, {
                            theme: 'outline',
                            size: 'medium',
                            text: 'signin_with',
                            shape: 'rectangular',
                            logo_alignment: 'left'
                        });
                    }
                }
            }, 100);
        }
    }
    
    // Show authentication message
    function showAuthMessage(message, type) {
        // Create or update message element
        let messageEl = document.getElementById('auth-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'auth-message';
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 10000;
                font-weight: 500;
                animation: slideIn 0.3s ease;
            `;
            document.body.appendChild(messageEl);
        }
        
        messageEl.textContent = message;
        messageEl.className = `auth-message ${type}`;
        
        // Style based on type
        if (type === 'success') {
            messageEl.style.backgroundColor = '#d4edda';
            messageEl.style.color = '#155724';
            messageEl.style.border = '1px solid #c3e6cb';
        } else if (type === 'error') {
            messageEl.style.backgroundColor = '#f8d7da';
            messageEl.style.color = '#721c24';
            messageEl.style.border = '1px solid #f5c6cb';
        }
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (messageEl) {
                messageEl.remove();
            }
        }, 5000);
    }
    
    // Show login modal
    window.showLoginModal = function() {
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
        
        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 400px; width: 90%;">
                <h2 style="margin-bottom: 1rem; text-align: center;">Sign In</h2>
                
                <div id="modal-google-signin" style="margin-bottom: 1rem; text-align: center;"></div>
                
                <div style="text-align: center; margin: 1rem 0; color: #666;">or</div>
                
                <form id="login-form">
                    <input type="email" placeholder="Email" required style="width: 100%; padding: 12px; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box;">
                    <input type="password" placeholder="Password" required style="width: 100%; padding: 12px; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box;">
                    <button type="submit" style="width: 100%; padding: 12px; background: #ff6b35; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Sign In</button>
                </form>
                
                <div style="text-align: center; margin-top: 1rem;">
                    <a href="#" onclick="showRegisterModal()" style="color: #ff6b35; text-decoration: none;">Don't have an account? Register</a>
                </div>
                
                <button onclick="closeLoginModal()" style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Initialize Google Sign-In in modal
        setTimeout(() => {
            if (window.google && window.google.accounts) {
                const buttonContainer = document.getElementById('modal-google-signin');
                if (buttonContainer) {
                    window.google.accounts.id.renderButton(buttonContainer, {
                        theme: 'outline',
                        size: 'large',
                        text: 'signin_with',
                        shape: 'rectangular',
                        logo_alignment: 'left'
                    });
                }
            }
        }, 100);
        
        // Handle form submission
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = e.target.querySelector('input[type="email"]').value;
            const password = e.target.querySelector('input[type="password"]').value;
            
            const success = await window.loginWithEmail(email, password);
            if (success) {
                closeLoginModal();
            }
        });
    };
    
    // Close login modal
    window.closeLoginModal = function() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.remove();
        }
    };
    
    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.initAuth);
    } else {
        window.initAuth();
    }
    
    console.log('Enhanced Authentication System Ready');
})();