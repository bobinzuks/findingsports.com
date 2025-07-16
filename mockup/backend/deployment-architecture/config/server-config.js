class Config {
    constructor() {
        // Server configuration
        this.port = parseInt(process.env.PORT) || 8080;
        this.host = process.env.HOST || '0.0.0.0';
        this.environment = process.env.NODE_ENV || 'development';
        
        // Security configuration
        this.corsOrigin = process.env.CORS_ORIGIN || '*';
        this.trustProxy = process.env.TRUST_PROXY === 'true';
        
        // Rate limiting configuration
        this.rateLimitConfig = {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
            skipSuccessfulRequests: false,
            skipFailedRequests: false
        };
        
        // Logging configuration
        this.logLevel = process.env.LOG_LEVEL || 'info';
        
        // File serving configuration
        this.staticFilesRoot = process.env.STATIC_FILES_ROOT || '../..';
        this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
        
        // Health check configuration
        this.healthCheckInterval = parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000;
        
        // Request configuration
        this.maxRequestSize = process.env.MAX_REQUEST_SIZE || '10mb';
        this.requestTimeout = parseInt(process.env.REQUEST_TIMEOUT) || 30000;
        
        // Validate configuration
        this.validate();
    }
    
    validate() {
        if (this.port < 1 || this.port > 65535) {
            throw new Error('Invalid port number');
        }
        
        if (this.rateLimitConfig.windowMs < 1000) {
            throw new Error('Rate limit window must be at least 1000ms');
        }
        
        if (this.rateLimitConfig.maxRequests < 1) {
            throw new Error('Rate limit max requests must be at least 1');
        }
        
        const validLogLevels = ['error', 'warn', 'info', 'debug'];
        if (!validLogLevels.includes(this.logLevel)) {
            throw new Error('Invalid log level');
        }
    }
    
    isDevelopment() {
        return this.environment === 'development';
    }
    
    isProduction() {
        return this.environment === 'production';
    }
    
    getSecurityHeaders() {
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        };
    }
}

module.exports = { Config };