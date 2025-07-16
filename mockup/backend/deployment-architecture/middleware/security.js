const { Config } = require('../config/server-config');

class SecurityMiddleware {
    constructor() {
        this.config = new Config();
    }
    
    applyHeaders(res) {
        const headers = this.config.getSecurityHeaders();
        
        // Apply security headers
        Object.entries(headers).forEach(([key, value]) => {
            // Skip HSTS in development
            if (key === 'Strict-Transport-Security' && this.config.isDevelopment()) {
                return;
            }
            res.setHeader(key, value);
        });
        
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', this.config.corsOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    
    sanitizePath(urlPath) {
        // Remove null bytes
        let sanitized = urlPath.replace(/\0/g, '');
        
        // Normalize path
        sanitized = sanitized.replace(/\/+/g, '/');
        
        // Remove query string for path validation
        const pathOnly = sanitized.split('?')[0];
        
        // Decode URL encoding
        try {
            sanitized = decodeURIComponent(pathOnly);
        } catch (e) {
            // Invalid encoding, return as-is
            return pathOnly;
        }
        
        // Remove any traversal attempts
        sanitized = sanitized.replace(/\.\./g, '');
        
        return sanitized;
    }
    
    validateFilePath(requestedPath, basePath) {
        const path = require('path');
        
        // Resolve the absolute path
        const resolvedBase = path.resolve(basePath);
        const resolvedPath = path.resolve(basePath, requestedPath);
        
        // Ensure the resolved path is within the base directory
        return resolvedPath.startsWith(resolvedBase);
    }
    
    isAllowedFileType(filePath) {
        const path = require('path');
        const ext = path.extname(filePath).toLowerCase();
        
        const allowedTypes = [
            '.html', '.css', '.js', '.json',
            '.png', '.jpg', '.jpeg', '.gif', '.svg',
            '.woff', '.woff2', '.ttf', '.eot',
            '.txt', '.md'
        ];
        
        return allowedTypes.includes(ext);
    }
    
    sanitizeHeaders(headers) {
        const sanitized = {};
        const allowedHeaders = [
            'accept', 'accept-language', 'content-type',
            'user-agent', 'referer', 'origin'
        ];
        
        Object.entries(headers).forEach(([key, value]) => {
            const lowerKey = key.toLowerCase();
            if (allowedHeaders.includes(lowerKey)) {
                // Limit header value length
                sanitized[lowerKey] = String(value).substring(0, 1024);
            }
        });
        
        return sanitized;
    }
    
    validateContentType(contentType, expectedType) {
        if (!contentType) return false;
        
        const normalized = contentType.toLowerCase().split(';')[0].trim();
        return normalized === expectedType.toLowerCase();
    }
}

module.exports = { SecurityMiddleware };