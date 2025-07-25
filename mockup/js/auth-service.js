/**
 * Authentication Service
 * Handles JWT tokens, user sessions, and API integration
 */

class AuthService {
    constructor() {
        this.baseURL = '/api/auth';
        this.tokenKey = 'authToken';
        this.userKey = 'user';
        this.refreshTokenKey = 'refreshToken';
        this.tokenRefreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry
        this.refreshTimer = null;
        this.eventListeners = new Set();
        
        this.init();
    }

    init() {
        this.setupAxiosInterceptors();
        this.setupTokenRefresh();
        this.checkAuthStatus();
        
        // Listen for storage changes (multi-tab support)
        window.addEventListener('storage', (e) => {
            if (e.key === this.tokenKey) {
                this.handleStorageChange(e);
            }
        });
    }

    /**
     * Authentication Methods
     */
    
    async login(credentials) {
        try {
            const response = await this.makeRequest('/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password,
                    rememberMe: credentials.rememberMe || false
                })
            });

            if (response.success) {
                await this.handleAuthSuccess(response.data, credentials.rememberMe);
                return { success: true, user: response.data.user };
            } else {
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                error: error.message || 'Login failed. Please try again.' 
            };
        }
    }

    async socialLogin(provider, code = null) {
        try {
            const endpoint = code ? `/callback/${provider}` : `/${provider}`;
            const body = code ? JSON.stringify({ code }) : null;
            
            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body
            });

            if (response.success) {
                if (response.data.redirectUrl) {
                    // Redirect to social provider
                    window.location.href = response.data.redirectUrl;
                    return { success: true, redirect: true };
                } else {
                    // Handle auth callback
                    await this.handleAuthSuccess(response.data, true);
                    return { success: true, user: response.data.user };
                }
            } else {
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Social login error:', error);
            return { 
                success: false, 
                error: error.message || 'Social login failed. Please try again.' 
            };
        }
    }

    async signup(userData) {
        try {
            const response = await this.makeRequest('/signup', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            if (response.success) {
                await this.handleAuthSuccess(response.data, userData.rememberMe);
                return { success: true, user: response.data.user };
            } else {
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Signup error:', error);
            return { 
                success: false, 
                error: error.message || 'Signup failed. Please try again.' 
            };
        }
    }

    async logout() {
        try {
            // Call logout endpoint if user is authenticated
            if (this.isAuthenticated()) {
                await this.makeRequest('/logout', {
                    method: 'POST'
                });
            }
        } catch (error) {
            console.warn('Logout endpoint error:', error);
        } finally {
            // Always clear local session
            await this.clearSession();
        }
    }

    async forgotPassword(email) {
        try {
            const response = await this.makeRequest('/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email })
            });

            return { 
                success: response.success, 
                message: response.message 
            };
        } catch (error) {
            console.error('Forgot password error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to send reset email.' 
            };
        }
    }

    async resetPassword(token, newPassword) {
        try {
            const response = await this.makeRequest('/reset-password', {
                method: 'POST',
                body: JSON.stringify({ 
                    token, 
                    password: newPassword 
                })
            });

            return { 
                success: response.success, 
                message: response.message 
            };
        } catch (error) {
            console.error('Reset password error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to reset password.' 
            };
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            const response = await this.makeRequest('/change-password', {
                method: 'POST',
                body: JSON.stringify({ 
                    currentPassword, 
                    newPassword 
                })
            });

            return { 
                success: response.success, 
                message: response.message 
            };
        } catch (error) {
            console.error('Change password error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to change password.' 
            };
        }
    }

    /**
     * Token Management
     */

    getToken() {
        return localStorage.getItem(this.tokenKey) || 
               sessionStorage.getItem(this.tokenKey);
    }

    getRefreshToken() {
        return localStorage.getItem(this.refreshTokenKey) || 
               sessionStorage.getItem(this.refreshTokenKey);
    }

    setTokens(accessToken, refreshToken, persistent = false) {
        const storage = persistent ? localStorage : sessionStorage;
        
        storage.setItem(this.tokenKey, accessToken);
        if (refreshToken) {
            storage.setItem(this.refreshTokenKey, refreshToken);
        }

        // Clear from other storage
        const otherStorage = persistent ? sessionStorage : localStorage;
        otherStorage.removeItem(this.tokenKey);
        otherStorage.removeItem(this.refreshTokenKey);
    }

    clearTokens() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        sessionStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.refreshTokenKey);
    }

    isTokenValid(token = null) {
        const tokenToCheck = token || this.getToken();
        if (!tokenToCheck) return false;

        try {
            const payload = this.decodeJWT(tokenToCheck);
            const now = Date.now() / 1000;
            return payload.exp > now;
        } catch (error) {
            return false;
        }
    }

    getTokenExpiryTime(token = null) {
        const tokenToCheck = token || this.getToken();
        if (!tokenToCheck) return null;

        try {
            const payload = this.decodeJWT(tokenToCheck);
            return payload.exp * 1000; // Convert to milliseconds
        } catch (error) {
            return null;
        }
    }

    decodeJWT(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    }

    async refreshToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await this.makeRequest('/refresh', {
                method: 'POST',
                body: JSON.stringify({ refreshToken })
            });

            if (response.success) {
                const { accessToken, refreshToken: newRefreshToken } = response.data;
                const isPersistent = !!localStorage.getItem(this.tokenKey);
                
                this.setTokens(accessToken, newRefreshToken, isPersistent);
                return accessToken;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            await this.clearSession();
            throw error;
        }
    }

    setupTokenRefresh() {
        const checkAndRefresh = async () => {
            const token = this.getToken();
            if (!token) return;

            const expiryTime = this.getTokenExpiryTime(token);
            if (!expiryTime) return;

            const timeUntilExpiry = expiryTime - Date.now();
            
            if (timeUntilExpiry <= this.tokenRefreshThreshold) {
                try {
                    await this.refreshToken();
                } catch (error) {
                    console.warn('Auto token refresh failed:', error);
                }
            }
        };

        // Check every minute
        this.refreshTimer = setInterval(checkAndRefresh, 60000);
        
        // Check immediately
        checkAndRefresh();
    }

    /**
     * User Session Management
     */

    isAuthenticated() {
        const token = this.getToken();
        return token && this.isTokenValid(token);
    }

    getCurrentUser() {
        if (!this.isAuthenticated()) return null;

        const userStr = localStorage.getItem(this.userKey) || 
                       sessionStorage.getItem(this.userKey);
        
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    async updateUserProfile(updates) {
        try {
            const response = await this.makeRequest('/profile', {
                method: 'PUT',
                body: JSON.stringify(updates)
            });

            if (response.success) {
                const updatedUser = response.data.user;
                this.setUser(updatedUser);
                this.notifyListeners('userUpdated', updatedUser);
                return { success: true, user: updatedUser };
            } else {
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Profile update error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to update profile.' 
            };
        }
    }

    setUser(user, persistent = false) {
        const storage = persistent ? localStorage : sessionStorage;
        storage.setItem(this.userKey, JSON.stringify(user));
        
        // Clear from other storage
        const otherStorage = persistent ? sessionStorage : localStorage;
        otherStorage.removeItem(this.userKey);
    }

    async handleAuthSuccess(data, rememberMe = false) {
        const { user, accessToken, refreshToken } = data;
        
        this.setTokens(accessToken, refreshToken, rememberMe);
        this.setUser(user, rememberMe);
        
        this.notifyListeners('authSuccess', user);
        this.setupTokenRefresh();
    }

    async clearSession() {
        this.clearTokens();
        localStorage.removeItem(this.userKey);
        sessionStorage.removeItem(this.userKey);
        
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
        
        this.notifyListeners('authCleared');
    }

    checkAuthStatus() {
        const user = this.getCurrentUser();
        if (user && this.isAuthenticated()) {
            this.notifyListeners('authRestored', user);
        }
    }

    handleStorageChange(event) {
        if (event.key === this.tokenKey) {
            if (event.newValue) {
                // Token was set in another tab
                const user = this.getCurrentUser();
                if (user) {
                    this.notifyListeners('authRestored', user);
                }
            } else {
                // Token was removed in another tab
                this.clearSession();
            }
        }
    }

    /**
     * HTTP Request Helper
     */

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();
        
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (token && !endpoint.includes('/refresh')) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, config);
        
        if (response.status === 401 && endpoint !== '/refresh') {
            // Try to refresh token
            try {
                await this.refreshToken();
                // Retry original request
                config.headers.Authorization = `Bearer ${this.getToken()}`;
                const retryResponse = await fetch(url, config);
                return await retryResponse.json();
            } catch (refreshError) {
                await this.clearSession();
                throw new Error('Authentication expired. Please log in again.');
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    setupAxiosInterceptors() {
        // If axios is available, set up interceptors
        if (typeof axios !== 'undefined') {
            axios.interceptors.request.use(
                (config) => {
                    const token = this.getToken();
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                    return config;
                },
                (error) => Promise.reject(error)
            );

            axios.interceptors.response.use(
                (response) => response,
                async (error) => {
                    if (error.response?.status === 401) {
                        try {
                            await this.refreshToken();
                            // Retry the original request
                            const originalRequest = error.config;
                            originalRequest.headers.Authorization = `Bearer ${this.getToken()}`;
                            return axios.request(originalRequest);
                        } catch (refreshError) {
                            await this.clearSession();
                            window.location.href = '/login';
                        }
                    }
                    return Promise.reject(error);
                }
            );
        }
    }

    /**
     * Event System
     */

    addEventListener(event, callback) {
        const listener = { event, callback };
        this.eventListeners.add(listener);
        
        return () => {
            this.eventListeners.delete(listener);
        };
    }

    removeEventListener(event, callback) {
        for (const listener of this.eventListeners) {
            if (listener.event === event && listener.callback === callback) {
                this.eventListeners.delete(listener);
                break;
            }
        }
    }

    notifyListeners(event, data = null) {
        for (const listener of this.eventListeners) {
            if (listener.event === event) {
                try {
                    listener.callback(data);
                } catch (error) {
                    console.error('Auth event listener error:', error);
                }
            }
        }
    }

    /**
     * Utility Methods
     */

    hasPermission(permission) {
        const user = this.getCurrentUser();
        return user?.permissions?.includes(permission) || 
               user?.roles?.some(role => role.permissions?.includes(permission));
    }

    hasRole(roleName) {
        const user = this.getCurrentUser();
        return user?.roles?.some(role => role.name === roleName);
    }

    getUserMetadata(key) {
        const user = this.getCurrentUser();
        return user?.metadata?.[key];
    }

    async validateEmail(email) {
        try {
            const response = await this.makeRequest('/validate-email', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            return response.isValid;
        } catch (error) {
            console.error('Email validation error:', error);
            return false;
        }
    }

    async checkUsernameAvailability(username) {
        try {
            const response = await this.makeRequest('/check-username', {
                method: 'POST',
                body: JSON.stringify({ username })
            });
            return response.isAvailable;
        } catch (error) {
            console.error('Username check error:', error);
            return false;
        }
    }

    /**
     * Cleanup
     */

    destroy() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        this.eventListeners.clear();
        window.removeEventListener('storage', this.handleStorageChange);
    }
}

// Create global instance
const authService = new AuthService();

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
} else if (typeof define === 'function' && define.amd) {
    define(() => AuthService);
} else {
    window.AuthService = AuthService;
    window.authService = authService;
}

// Auto-setup for common scenarios
document.addEventListener('DOMContentLoaded', () => {
    // Auto-redirect on auth state changes
    authService.addEventListener('authCleared', () => {
        if (window.location.pathname.startsWith('/dashboard') || 
            window.location.pathname.startsWith('/profile')) {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        }
    });

    // Auto-setup auth UI
    const loginTriggers = document.querySelectorAll('[data-login-trigger]');
    loginTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.loginComponent) {
                window.loginComponent.open();
            }
        });
    });

    // Auto-setup logout triggers
    const logoutTriggers = document.querySelectorAll('[data-logout-trigger]');
    logoutTriggers.forEach(trigger => {
        trigger.addEventListener('click', async (e) => {
            e.preventDefault();
            await authService.logout();
            window.location.href = '/';
        });
    });
});

// Auth state debugging (development only)
if (process.env.NODE_ENV === 'development') {
    window.authDebug = {
        getToken: () => authService.getToken(),
        getUser: () => authService.getCurrentUser(),
        isAuthenticated: () => authService.isAuthenticated(),
        clearSession: () => authService.clearSession()
    };
}