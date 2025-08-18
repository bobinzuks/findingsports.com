// Login Fix - Ensures LoginManager is properly initialized and API calls work
(function() {
    'use strict';
    
    console.log('Login Fix: Starting...');
    
    // Wait for LoginManager to be available
    function initializeLogin() {
        if (typeof LoginManager === 'undefined') {
            console.log('Login Fix: Waiting for LoginManager class...');
            setTimeout(initializeLogin, 100);
            return;
        }
        
        // Check if already initialized
        if (window.loginManager && typeof window.loginManager.showLoginModal === 'function') {
            console.log('Login Fix: LoginManager already initialized');
            return;
        }
        
        // Initialize LoginManager
        console.log('Login Fix: Initializing LoginManager...');
        window.loginManager = new LoginManager();
        console.log('Login Fix: LoginManager initialized successfully');
        
        // Override handleLogin to ensure it uses the API
        const originalHandleLogin = window.loginManager.handleLogin;
        window.loginManager.handleLogin = async function(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            
            const email = formData.get('email');
            const password = formData.get('password');
            
            console.log('Login Fix: Attempting login for', email);
            
            try {
                // Show loading state
                const submitBtn = form.querySelector('.login-submit-btn');
                if (submitBtn) {
                    submitBtn.textContent = 'Signing in...';
                    submitBtn.disabled = true;
                }
                
                // Call actual API endpoint
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Login failed');
                }
                
                console.log('Login Fix: Login successful for', data.user.name);
                
                // Store auth data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                this.token = data.token;
                this.currentUser = data.user;
                this.isLoggedIn = true;
                
                // Update UI
                this.createLoginUI();
                
                // Close modal
                const modal = document.querySelector('.login-modal-overlay');
                if (modal) modal.remove();
                
                // Show success message
                this.showNotification('Welcome back, ' + data.user.name + '!', 'success');
                
            } catch (error) {
                console.error('Login Fix: Login error:', error);
                this.showNotification(error.message || 'Login failed. Please try again.', 'error');
                
                // Reset button
                const submitBtn = form.querySelector('.login-submit-btn');
                if (submitBtn) {
                    submitBtn.textContent = 'Sign In';
                    submitBtn.disabled = false;
                }
            }
        }.bind(window.loginManager);
        
        console.log('Login Fix: handleLogin method patched');
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLogin);
    } else {
        initializeLogin();
    }
    
    // Also make sure the login button works
    document.addEventListener('click', function(e) {
        if (e.target.matches('.login-btn') || e.target.closest('.login-btn')) {
            e.preventDefault();
            if (window.loginManager && window.loginManager.showLoginModal) {
                console.log('Login Fix: Opening login modal');
                window.loginManager.showLoginModal();
            } else {
                console.log('Login Fix: LoginManager not available');
            }
        }
    });
    
    console.log('Login Fix: Ready');
})();