class RateLimiter {
    constructor(config) {
        this.windowMs = config.windowMs || 60000; // 1 minute
        this.maxRequests = config.maxRequests || 100;
        this.skipSuccessfulRequests = config.skipSuccessfulRequests || false;
        this.skipFailedRequests = config.skipFailedRequests || false;
        
        // Store request counts by IP
        this.requests = new Map();
        
        // Cleanup old entries periodically
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this.windowMs);
    }
    
    checkLimit(clientIp) {
        const now = Date.now();
        const clientData = this.requests.get(clientIp) || { count: 0, resetTime: now + this.windowMs };
        
        // Reset if window has passed
        if (now > clientData.resetTime) {
            clientData.count = 0;
            clientData.resetTime = now + this.windowMs;
        }
        
        // Check if limit exceeded
        if (clientData.count >= this.maxRequests) {
            return false;
        }
        
        // Increment count
        clientData.count++;
        this.requests.set(clientIp, clientData);
        
        return true;
    }
    
    reset(clientIp) {
        this.requests.delete(clientIp);
    }
    
    cleanup() {
        const now = Date.now();
        const toDelete = [];
        
        // Find expired entries
        this.requests.forEach((data, ip) => {
            if (now > data.resetTime) {
                toDelete.push(ip);
            }
        });
        
        // Delete expired entries
        toDelete.forEach(ip => this.requests.delete(ip));
    }
    
    getStatus(clientIp) {
        const clientData = this.requests.get(clientIp);
        if (!clientData) {
            return {
                limit: this.maxRequests,
                remaining: this.maxRequests,
                reset: Date.now() + this.windowMs
            };
        }
        
        return {
            limit: this.maxRequests,
            remaining: Math.max(0, this.maxRequests - clientData.count),
            reset: clientData.resetTime
        };
    }
    
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.requests.clear();
    }
}

// Advanced rate limiter with sliding window
class SlidingWindowRateLimiter extends RateLimiter {
    constructor(config) {
        super(config);
        // Store timestamps of requests
        this.timestamps = new Map();
    }
    
    checkLimit(clientIp) {
        const now = Date.now();
        const clientTimestamps = this.timestamps.get(clientIp) || [];
        
        // Remove old timestamps outside the window
        const validTimestamps = clientTimestamps.filter(ts => now - ts < this.windowMs);
        
        // Check if limit exceeded
        if (validTimestamps.length >= this.maxRequests) {
            this.timestamps.set(clientIp, validTimestamps);
            return false;
        }
        
        // Add current timestamp
        validTimestamps.push(now);
        this.timestamps.set(clientIp, validTimestamps);
        
        return true;
    }
    
    cleanup() {
        const now = Date.now();
        
        this.timestamps.forEach((timestamps, ip) => {
            const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
            if (validTimestamps.length === 0) {
                this.timestamps.delete(ip);
            } else {
                this.timestamps.set(ip, validTimestamps);
            }
        });
    }
}

module.exports = { RateLimiter, SlidingWindowRateLimiter };