// Security Utilities - Input Sanitization and Validation
(function() {
    'use strict';
    
    // XSS Prevention - HTML Sanitization
    window.SecurityUtils = {
        
        // Sanitize HTML content to prevent XSS attacks
        sanitizeHTML: function(input) {
            if (!input || typeof input !== 'string') return '';
            
            const div = document.createElement('div');
            div.textContent = input;
            return div.innerHTML;
        },
        
        // Sanitize and validate user name
        sanitizeName: function(name) {
            if (!name || typeof name !== 'string') return '';
            
            // Remove HTML tags and limit length
            const sanitized = this.sanitizeHTML(name);
            
            // Only allow alphanumeric characters, spaces, and basic punctuation
            const cleaned = sanitized.replace(/[^a-zA-Z0-9\s\-_.]/g, '');
            
            // Limit length to prevent abuse
            return cleaned.substring(0, 50).trim();
        },
        
        // Sanitize and validate email
        sanitizeEmail: function(email) {
            if (!email || typeof email !== 'string') return '';
            
            const sanitized = this.sanitizeHTML(email);
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            return emailRegex.test(sanitized) ? sanitized : '';
        },
        
        // Sanitize message content
        sanitizeMessage: function(message) {
            if (!message || typeof message !== 'string') return '';
            
            // Remove HTML tags but preserve line breaks
            const sanitized = this.sanitizeHTML(message);
            
            // Limit message length
            const maxLength = 1000;
            const truncated = sanitized.substring(0, maxLength);
            
            // Remove potentially dangerous patterns
            const cleaned = truncated
                .replace(/javascript:/gi, '')
                .replace(/data:/gi, '')
                .replace(/vbscript:/gi, '')
                .replace(/on\w+=/gi, '');
            
            return cleaned.trim();
        },
        
        // Validate and sanitize URLs
        sanitizeURL: function(url) {
            if (!url || typeof url !== 'string') return '';
            
            try {
                const urlObj = new URL(url);
                
                // Only allow HTTP and HTTPS protocols
                if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
                    return '';
                }
                
                return urlObj.toString();
            } catch (error) {
                return '';
            }
        },
        
        // Create safe DOM element with text content
        createSafeElement: function(tagName, textContent, className) {
            const element = document.createElement(tagName);
            if (textContent) {
                element.textContent = this.sanitizeHTML(textContent);
            }
            if (className) {
                element.className = className;
            }
            return element;
        },
        
        // Safe innerHTML replacement
        safeInnerHTML: function(element, content) {
            if (!element || !content) return;
            
            // Clear existing content
            element.innerHTML = '';
            
            // Parse content and create safe elements
            const div = document.createElement('div');
            div.textContent = content;
            element.appendChild(div);
        },
        
        // Validate authentication token format
        validateTokenFormat: function(token) {
            if (!token || typeof token !== 'string') return false;
            
            // Basic JWT format validation (3 parts separated by dots)
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            
            // Check for basic Base64 format
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
            return parts.every(part => base64Regex.test(part));
        },
        
        // Rate limiting for actions
        rateLimiter: function(key, maxAttempts = 5, timeWindow = 60000) {
            if (!window.rateLimitCache) {
                window.rateLimitCache = new Map();
            }
            
            const now = Date.now();
            const userAttempts = window.rateLimitCache.get(key) || [];
            
            // Remove old attempts outside time window
            const recentAttempts = userAttempts.filter(time => now - time < timeWindow);
            
            if (recentAttempts.length >= maxAttempts) {
                return false; // Rate limit exceeded
            }
            
            // Add current attempt
            recentAttempts.push(now);
            window.rateLimitCache.set(key, recentAttempts);
            
            return true; // Action allowed
        },
        
        // Generate CSRF token
        generateCSRFToken: function() {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        },
        
        // Validate CSRF token
        validateCSRFToken: function(token) {
            const stored = sessionStorage.getItem('csrf_token');
            return stored && stored === token;
        },
        
        // Set CSRF token
        setCSRFToken: function() {
            const token = this.generateCSRFToken();
            sessionStorage.setItem('csrf_token', token);
            return token;
        },
        
        // Content Security Policy helper
        setCSPHeaders: function() {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' accounts.google.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.example.com";
            document.head.appendChild(meta);
        }
    };
    
    // Initialize CSRF protection
    window.SecurityUtils.setCSRFToken();
    
    // Set CSP headers if not already set
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        window.SecurityUtils.setCSPHeaders();
    }
    
    console.log('Security utilities loaded and initialized');
})();