/**
 * Modern Login Component
 * Modal-based login UI with social authentication
 */

class LoginComponent {
    constructor() {
        this.isOpen = false;
        this.rememberMe = false;
        this.socialProviders = ['google', 'facebook'];
        this.init();
    }

    init() {
        this.createModal();
        this.attachEventListeners();
        this.loadSavedCredentials();
    }

    createModal() {
        const modalHTML = `
            <div id="login-modal" class="login-modal-overlay" style="display: none;">
                <div class="login-modal">
                    <div class="login-header">
                        <h2 class="login-title">Welcome Back</h2>
                        <button class="close-btn" aria-label="Close login">×</button>
                    </div>
                    
                    <div class="login-content">
                        <!-- Social Login Section -->
                        <div class="social-login-section">
                            <button class="social-btn google-btn" data-provider="google">
                                <svg class="social-icon" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Continue with Google
                            </button>
                            
                            <button class="social-btn facebook-btn" data-provider="facebook">
                                <svg class="social-icon" viewBox="0 0 24 24">
                                    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                Continue with Facebook
                            </button>
                        </div>

                        <div class="divider">
                            <span>or</span>
                        </div>

                        <!-- Email/Password Form -->
                        <form id="login-form" class="login-form">
                            <div class="form-group">
                                <div class="input-container">
                                    <input type="email" id="email" name="email" required>
                                    <label for="email" class="floating-label">Email Address</label>
                                    <span class="input-focus-border"></span>
                                </div>
                            </div>

                            <div class="form-group">
                                <div class="input-container password-container">
                                    <input type="password" id="password" name="password" required>
                                    <label for="password" class="floating-label">Password</label>
                                    <button type="button" class="password-toggle" aria-label="Toggle password visibility">
                                        <svg class="eye-icon show" viewBox="0 0 24 24">
                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                        </svg>
                                        <svg class="eye-icon hide" viewBox="0 0 24 24" style="display: none;">
                                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                                        </svg>
                                    </button>
                                    <span class="input-focus-border"></span>
                                </div>
                            </div>

                            <div class="form-options">
                                <label class="checkbox-container">
                                    <input type="checkbox" id="remember-me">
                                    <span class="checkmark"></span>
                                    Remember me
                                </label>
                                
                                <a href="#" class="forgot-password">Forgot password?</a>
                            </div>

                            <button type="submit" class="login-btn">
                                <span class="btn-text">Sign In</span>
                                <div class="loading-spinner" style="display: none;">
                                    <div></div><div></div><div></div>
                                </div>
                            </button>
                        </form>

                        <div class="signup-link">
                            Don't have an account? <a href="#" class="signup-btn">Sign up</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    attachEventListeners() {
        const modal = document.getElementById('login-modal');
        const closeBtn = modal.querySelector('.close-btn');
        const loginForm = document.getElementById('login-form');
        const socialBtns = modal.querySelectorAll('.social-btn');
        const passwordToggle = modal.querySelector('.password-toggle');
        const rememberMeCheckbox = document.getElementById('remember-me');
        const forgotPasswordLink = modal.querySelector('.forgot-password');
        const signupLink = modal.querySelector('.signup-btn');

        // Close modal events
        closeBtn.addEventListener('click', () => this.close());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });

        // Form submission
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Social login buttons
        socialBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSocialLogin(e));
        });

        // Password visibility toggle
        passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());

        // Remember me checkbox
        rememberMeCheckbox.addEventListener('change', (e) => {
            this.rememberMe = e.target.checked;
        });

        // Forgot password
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });

        // Sign up link
        signupLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSignUp();
        });

        // Input animations
        this.setupInputAnimations();
    }

    setupInputAnimations() {
        const inputs = document.querySelectorAll('.login-modal input[type="email"], .login-modal input[type="password"]');
        
        inputs.forEach(input => {
            const container = input.closest('.input-container');
            const label = container.querySelector('.floating-label');

            // Check if input has value on load
            if (input.value) {
                label.classList.add('active');
            }

            input.addEventListener('focus', () => {
                label.classList.add('active');
                container.classList.add('focused');
            });

            input.addEventListener('blur', () => {
                if (!input.value) {
                    label.classList.remove('active');
                }
                container.classList.remove('focused');
            });

            input.addEventListener('input', () => {
                if (input.value) {
                    label.classList.add('active');
                } else {
                    label.classList.remove('active');
                }
            });
        });
    }

    open() {
        const modal = document.getElementById('login-modal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.isOpen = true;
        
        // Focus first input
        setTimeout(() => {
            const emailInput = document.getElementById('email');
            emailInput.focus();
        }, 300);

        // Add animation class
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }

    close() {
        const modal = document.getElementById('login-modal');
        modal.classList.remove('active');
        
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            this.isOpen = false;
        }, 300);
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        if (!this.validateForm(email, password)) {
            return;
        }

        this.setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    rememberMe: this.rememberMe
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.handleLoginSuccess(data);
            } else {
                this.handleLoginError(data.message || 'Login failed');
            }
        } catch (error) {
            this.handleLoginError('Network error. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    async handleSocialLogin(e) {
        const provider = e.currentTarget.dataset.provider;
        const btn = e.currentTarget;
        
        btn.disabled = true;
        btn.classList.add('loading');

        try {
            // Redirect to social auth endpoint
            window.location.href = `/api/auth/${provider}`;
        } catch (error) {
            console.error('Social login error:', error);
            this.showError('Social login failed. Please try again.');
            btn.disabled = false;
            btn.classList.remove('loading');
        }
    }

    handleForgotPassword() {
        const email = document.getElementById('email').value;
        
        if (email) {
            // Pre-fill email in forgot password flow
            this.showForgotPasswordDialog(email);
        } else {
            this.showForgotPasswordDialog();
        }
    }

    handleSignUp() {
        this.close();
        // Trigger sign up modal or redirect
        if (window.signUpComponent) {
            window.signUpComponent.open();
        } else {
            // Fallback to page redirect
            window.location.href = '/signup';
        }
    }

    validateForm(email, password) {
        let isValid = true;
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        } else {
            this.clearFieldError('email');
        }

        // Password validation
        if (password.length < 6) {
            this.showFieldError('password', 'Password must be at least 6 characters');
            isValid = false;
        } else {
            this.clearFieldError('password');
        }

        return isValid;
    }

    showFieldError(fieldName, message) {
        const field = document.getElementById(fieldName);
        const container = field.closest('.input-container');
        
        // Remove existing error
        const existingError = container.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add error styling
        container.classList.add('error');
        
        // Add error message
        const errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        container.appendChild(errorElement);
    }

    clearFieldError(fieldName) {
        const field = document.getElementById(fieldName);
        const container = field.closest('.input-container');
        const errorMessage = container.querySelector('.error-message');
        
        container.classList.remove('error');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    setLoading(loading) {
        const btn = document.querySelector('.login-btn');
        const btnText = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.loading-spinner');

        if (loading) {
            btn.disabled = true;
            btnText.style.display = 'none';
            spinner.style.display = 'block';
        } else {
            btn.disabled = false;
            btnText.style.display = 'block';
            spinner.style.display = 'none';
        }
    }

    handleLoginSuccess(data) {
        // Store token and user data
        if (this.rememberMe) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        } else {
            sessionStorage.setItem('authToken', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user));
        }

        this.showSuccess('Login successful! Redirecting...');
        
        setTimeout(() => {
            this.close();
            // Trigger login success event
            window.dispatchEvent(new CustomEvent('userLoggedIn', { 
                detail: data.user 
            }));
            
            // Redirect or refresh
            const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
            window.location.href = redirectUrl;
        }, 1500);
    }

    handleLoginError(message) {
        this.showError(message);
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelector('.login-notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `login-notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">×</button>
        `;

        const modal = document.querySelector('.login-modal');
        modal.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const showIcon = document.querySelector('.eye-icon.show');
        const hideIcon = document.querySelector('.eye-icon.hide');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            showIcon.style.display = 'none';
            hideIcon.style.display = 'block';
        } else {
            passwordInput.type = 'password';
            showIcon.style.display = 'block';
            hideIcon.style.display = 'none';
        }
    }

    loadSavedCredentials() {
        const savedEmail = localStorage.getItem('savedEmail');
        if (savedEmail) {
            const emailInput = document.getElementById('email');
            emailInput.value = savedEmail;
            
            // Trigger animation
            const label = emailInput.closest('.input-container').querySelector('.floating-label');
            label.classList.add('active');
        }
    }

    showForgotPasswordDialog(email = '') {
        const dialogHTML = `
            <div class="forgot-password-dialog">
                <h3>Reset Password</h3>
                <p>Enter your email address and we'll send you a link to reset your password.</p>
                <div class="input-container">
                    <input type="email" id="forgot-email" value="${email}" required>
                    <label for="forgot-email" class="floating-label ${email ? 'active' : ''}">Email Address</label>
                </div>
                <div class="dialog-actions">
                    <button class="cancel-btn">Cancel</button>
                    <button class="send-btn">Send Reset Link</button>
                </div>
            </div>
        `;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.innerHTML = dialogHTML;
        document.body.appendChild(overlay);

        // Event listeners
        overlay.querySelector('.cancel-btn').addEventListener('click', () => {
            overlay.remove();
        });

        overlay.querySelector('.send-btn').addEventListener('click', async () => {
            const email = overlay.querySelector('#forgot-email').value;
            if (email) {
                // Send password reset request
                try {
                    await fetch('/api/auth/forgot-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    
                    this.showSuccess('Password reset link sent to your email');
                    overlay.remove();
                } catch (error) {
                    this.showError('Failed to send reset link. Please try again.');
                }
            }
        });
    }
}

// Initialize login component when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.loginComponent = new LoginComponent();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoginComponent;
}