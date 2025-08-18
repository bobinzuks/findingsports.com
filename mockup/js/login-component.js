// Modern Login Component System
// Replaces removed elements: English selector, Trip button, Online indicator

class LoginManager {
    constructor() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.token = localStorage.getItem('authToken');
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.createLoginUI();
        this.setupEventListeners();
    }

    checkAuthStatus() {
        if (this.token) {
            try {
                // Validate token
                const userData = localStorage.getItem('userData');
                if (userData) {
                    this.currentUser = JSON.parse(userData);
                    this.isLoggedIn = true;
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                this.logout();
            }
        }
    }

    createLoginUI() {
        // Remove old elements that were X'd out
        this.removeDeprecatedElements();
        
        // Create new login section in header
        const headerRight = document.querySelector('.header-right') || 
                           document.querySelector('.user-menu');
        
        if (headerRight) {
            headerRight.innerHTML = this.isLoggedIn ? 
                this.getUserMenu() : this.getLoginButton();
        }
    }

    removeDeprecatedElements() {
        // Remove elements marked with red X in the image
        const elementsToRemove = [
            // English language selector (red X'd)
            'select[name="language"]',
            '.language-selector',
            '[data-language="english"]',
            '.lang-english',
            
            // Trip button (red X'd)
            '.trip-btn',
            'button[data-action="trip"]',
            '.trip-button',
            '[onclick*="trip"]',
            
            // Online indicator (red X'd)
            '.online-indicator',
            '.status-online',
            '.online-status',
            '[data-status="online"]'
        ];

        elementsToRemove.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                console.log(`Removing deprecated element: ${selector}`);
                el.remove();
            });
        });

        // Also remove from any dynamically created content
        this.removeFromDynamicContent();
    }

    removeFromDynamicContent() {
        // Optimized text-based removal with performance throttling
        if (this._dynamicContentProcessed) return;
        
        const startTime = performance.now();
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Performance optimization: skip non-UI text nodes
                    const parent = node.parentElement;
                    if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        const textNodesToRemove = [];
        const targetTexts = new Set(['english', 'trip', 'online']);
        let node;
        let processedNodes = 0;
        const maxNodes = 1000; // Prevent excessive processing

        while ((node = walker.nextNode()) && processedNodes < maxNodes) {
            processedNodes++;
            const text = node.textContent.trim().toLowerCase();
            
            // Quick check using Set for better performance
            if (targetTexts.has(text) || 
                (text.length < 20 && Array.from(targetTexts).some(target => text.includes(target)))) {
                
                const parent = node.parentElement;
                if (parent && (
                    parent.classList.contains('nav-item') ||
                    parent.classList.contains('button') ||
                    parent.classList.contains('selector') ||
                    parent.tagName === 'BUTTON' ||
                    parent.tagName === 'SELECT'
                )) {
                    textNodesToRemove.push(parent);
                }
            }
        }

        // Batch remove for better performance
        if (textNodesToRemove.length > 0) {
            const fragment = document.createDocumentFragment();
            textNodesToRemove.forEach(el => {
                el.parentNode && el.parentNode.removeChild(el);
            });
        }
        
        const duration = performance.now() - startTime;
        if (duration > 50) {
            console.warn(`Slow dynamic content removal: ${duration.toFixed(2)}ms, ${processedNodes} nodes`);
        }
        
        this._dynamicContentProcessed = true;
    }

    getLoginButton() {
        return `
            <div class="auth-section">
                <button class="login-btn primary" onclick="loginManager.showLoginModal()">
                    <i class="fas fa-user"></i> Sign In
                </button>
                <button class="signup-btn secondary" onclick="loginManager.showSignupModal()">
                    Join Now
                </button>
            </div>
        `;
    }

    getUserMenu() {
        const user = this.currentUser;
        const displayName = user.name || user.email || 'User';
        const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
        
        return `
            <div class="user-menu-container">
                <div class="user-profile" onclick="loginManager.toggleUserMenu()">
                    <div class="user-avatar">
                        ${user.avatar ? 
                            `<img src="${user.avatar}" alt="${displayName}">` :
                            `<span class="initials">${initials}</span>`
                        }
                    </div>
                    <span class="user-name">${displayName.split(' ')[0]}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="user-dropdown" id="userDropdown" style="display: none;">
                    <a href="#" onclick="loginManager.showProfile()">
                        <i class="fas fa-user"></i> Profile
                    </a>
                    <a href="#" onclick="loginManager.showSettings()">
                        <i class="fas fa-cog"></i> Settings
                    </a>
                    <a href="#" onclick="loginManager.showMyGames()">
                        <i class="fas fa-gamepad"></i> My Games
                    </a>
                    <hr>
                    <a href="#" onclick="loginManager.logout()" class="logout-link">
                        <i class="fas fa-sign-out-alt"></i> Sign Out
                    </a>
                </div>
            </div>
        `;
    }

    showLoginModal() {
        // Prevent multiple modals
        if (document.querySelector('.login-modal-overlay')) {
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'login-modal-overlay';
        modal.innerHTML = `
            <div class="login-modal">
                <div class="modal-header">
                    <h2>Welcome Back!</h2>
                    <button class="close-btn" onclick="this.closest('.login-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form class="login-form" onsubmit="loginManager.handleLogin(event)">
                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input type="email" id="email" name="email" required 
                                   placeholder="Enter your email">
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" name="password" required 
                                   placeholder="Enter your password">
                        </div>
                        <div class="form-options">
                            <label class="checkbox-label">
                                <input type="checkbox" name="remember"> Remember me
                            </label>
                            <a href="#" onclick="loginManager.showForgotPassword()">Forgot password?</a>
                        </div>
                        <button type="submit" class="login-submit-btn">
                            Sign In
                        </button>
                    </form>
                    <div class="divider">
                        <span>or</span>
                    </div>
                    <div class="social-login">
                        <button class="google-login-btn" onclick="loginManager.loginWithGoogle()">
                            <i class="fab fa-google"></i> Continue with Google
                        </button>
                        <button class="facebook-login-btn" onclick="loginManager.loginWithFacebook()">
                            <i class="fab fa-facebook"></i> Continue with Facebook
                        </button>
                    </div>
                    <div class="signup-prompt">
                        Don't have an account? 
                        <a href="#" onclick="loginManager.showSignupModal()">Sign up here</a>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showSignupModal() {
        // Prevent multiple modals
        if (document.querySelector('.login-modal-overlay')) {
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'login-modal-overlay';
        modal.innerHTML = `
            <div class="login-modal">
                <div class="modal-header">
                    <h2>Join Finding Sports!</h2>
                    <button class="close-btn" onclick="this.closest('.login-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form class="signup-form" onsubmit="loginManager.handleSignup(event)">
                        <div class="form-group">
                            <label for="fullName">Full Name</label>
                            <input type="text" id="fullName" name="fullName" required 
                                   placeholder="Enter your full name">
                        </div>
                        <div class="form-group">
                            <label for="signupEmail">Email Address</label>
                            <input type="email" id="signupEmail" name="email" required 
                                   placeholder="Enter your email">
                        </div>
                        <div class="form-group">
                            <label for="signupPassword">Password</label>
                            <input type="password" id="signupPassword" name="password" required 
                                   placeholder="Create a password">
                        </div>
                        <div class="form-group">
                            <label for="confirmPassword">Confirm Password</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" required 
                                   placeholder="Confirm your password">
                        </div>
                        <div class="form-options">
                            <label class="checkbox-label">
                                <input type="checkbox" name="terms" required> 
                                I agree to the <a href="#" target="_blank">Terms of Service</a>
                            </label>
                        </div>
                        <button type="submit" class="signup-submit-btn">
                            Create Account
                        </button>
                    </form>
                    <div class="divider">
                        <span>or</span>
                    </div>
                    <div class="social-login">
                        <button class="google-login-btn" onclick="loginManager.loginWithGoogle()">
                            <i class="fab fa-google"></i> Sign up with Google
                        </button>
                        <button class="facebook-login-btn" onclick="loginManager.loginWithFacebook()">
                            <i class="fab fa-facebook"></i> Sign up with Facebook
                        </button>
                    </div>
                    <div class="login-prompt">
                        Already have an account? 
                        <a href="#" onclick="loginManager.showLoginModal()">Sign in here</a>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async handleLogin(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        const email = formData.get('email');
        const password = formData.get('password');
        const remember = formData.get('remember');

        try {
            // Show loading state
            const submitBtn = form.querySelector('.login-submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Signing in...';
            submitBtn.disabled = true;

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
            
            const user = data.user;
            const token = data.token;

            // Store auth data
            localStorage.setItem('authToken', token);
            localStorage.setItem('userData', JSON.stringify(user));
            
            this.token = token;
            this.currentUser = user;
            this.isLoggedIn = true;

            // Update UI
            this.createLoginUI();
            
            // Close modal
            document.querySelector('.login-modal-overlay').remove();
            
            // Show success message
            this.showNotification('Welcome back!', 'success');

        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(error.message || 'Login failed. Please try again.', 'error');
        } finally {
            // Reset button
            const submitBtn = form.querySelector('.login-submit-btn');
            if (submitBtn) {
                submitBtn.textContent = 'Sign In';
                submitBtn.disabled = false;
            }
        }
    }

    async handleSignup(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        const fullName = formData.get('fullName');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        // Validate passwords match
        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        try {
            // Show loading state
            const submitBtn = form.querySelector('.signup-submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating account...';
            submitBtn.disabled = true;

            // Simulate API call for demo
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // For demo purposes, create mock user data
            const mockUser = {
                id: 1,
                name: fullName,
                email: email,
                avatar: null
            };
            
            const mockToken = 'demo_token_' + Date.now();

            // Store auth data
            localStorage.setItem('authToken', token);
            localStorage.setItem('userData', JSON.stringify(user));
            
            this.token = token;
            this.currentUser = user;
            this.isLoggedIn = true;

            // Update UI
            this.createLoginUI();
            
            // Close modal
            document.querySelector('.login-modal-overlay').remove();
            
            // Show success message
            this.showNotification('Welcome to Finding Sports!', 'success');

        } catch (error) {
            console.error('Signup error:', error);
            this.showNotification(error.message || 'Signup failed. Please try again.', 'error');
        } finally {
            // Reset button
            const submitBtn = form.querySelector('.signup-submit-btn');
            if (submitBtn) {
                submitBtn.textContent = 'Create Account';
                submitBtn.disabled = false;
            }
        }
    }

    async loginWithGoogle() {
        try {
            // Remove any existing loading animations first
            const loadingElements = document.querySelectorAll('.onboarding-highlight');
            loadingElements.forEach(el => el.classList.remove('onboarding-highlight'));
            
            // Check if Google Sign-In is available
            if (window.google && window.google.accounts) {
                // Trigger Google Sign-In
                window.google.accounts.id.prompt();
            } else {
                // Load Google Sign-In script
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.onload = () => {
                    window.google.accounts.id.initialize({
                        client_id: '386932037035-k8v833noqjk7m4t641js92fvjmm5ri71.apps.googleusercontent.com',
                        callback: this.handleGoogleResponse.bind(this)
                    });
                    window.google.accounts.id.prompt();
                };
                document.head.appendChild(script);
            }
        } catch (error) {
            this.showNotification('Google login failed', 'error');
        }
    }

    async loginWithFacebook() {
        try {
            // Implement Facebook OAuth
            this.showNotification('Facebook login coming soon!', 'info');
        } catch (error) {
            this.showNotification('Facebook login failed', 'error');
        }
    }

    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    }

    showProfile() {
        this.showNotification('Profile page coming soon!', 'info');
    }

    showSettings() {
        this.showNotification('Settings page coming soon!', 'info');
    }

    showMyGames() {
        this.showNotification('My Games page coming soon!', 'info');
    }

    logout() {
        // Clear auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        this.token = null;
        this.currentUser = null;
        this.isLoggedIn = false;
        
        // Update UI
        this.createLoginUI();
        
        // Show message
        this.showNotification('Signed out successfully', 'success');
    }

    showNotification(message, type = 'info') {
        // Throttle notifications to prevent spam
        const now = Date.now();
        if (this._lastNotification && now - this._lastNotification < 1000) {
            return;
        }
        this._lastNotification = now;
        
        // Remove old notifications to prevent accumulation
        const existingNotifications = document.querySelectorAll('.notification');
        if (existingNotifications.length >= 3) {
            existingNotifications[0].remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${this.escapeHtml(message)}</span>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove with cleanup
        const timeoutId = setTimeout(() => {
            if (notification.parentElement) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 200);
            }
        }, 5000);
        
        // Store timeout for potential cleanup
        notification._timeoutId = timeoutId;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    setupEventListeners() {
        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            const userMenu = event.target.closest('.user-menu-container');
            if (!userMenu) {
                const dropdown = document.getElementById('userDropdown');
                if (dropdown) {
                    dropdown.style.display = 'none';
                }
            }
        });

        // Close modal when clicking overlay
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('login-modal-overlay')) {
                event.target.remove();
            }
        });
    }
    
    async handleGoogleResponse(response) {
        try {
            // Call backend to verify Google token
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ credential: response.credential })
            });

            const data = await res.json();
            
            if (data.success) {
                // Store auth data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                this.token = data.token;
                this.currentUser = data.user;
                this.isLoggedIn = true;
                
                // Update UI
                this.createLoginUI();
                
                // Close modal if open
                const modal = document.querySelector('.login-modal-overlay');
                if (modal) modal.remove();
                
                this.showNotification('Successfully signed in with Google!', 'success');
            } else {
                this.showNotification(data.error || 'Google login failed', 'error');
            }
        } catch (error) {
            console.error('Google login error:', error);
            this.showNotification('Google login failed', 'error');
        }
    }
}

// Initialize login manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.loginManager = new LoginManager();
        console.log('LoginManager initialized on DOMContentLoaded');
    });
} else {
    // DOM is already loaded, initialize immediately
    window.loginManager = new LoginManager();
    console.log('LoginManager initialized immediately (DOM already loaded)');
}

// Export for global access
window.LoginManager = LoginManager;