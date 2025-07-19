const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const hpp = require('hpp');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const crypto = require('crypto');

// Security configuration
const SECURITY_CONFIG = {
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Maximum requests per windowMs
    authMax: 20, // Maximum auth requests per windowMs
    sensitiveMax: 5, // Maximum sensitive operations per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: 900
    }
  },
  bruteForce: {
    freeRetries: 3,
    minWait: 5 * 60 * 1000, // 5 minutes
    maxWait: 30 * 60 * 1000, // 30 minutes
    lifetime: 60 * 60 * 1000 // 1 hour
  },
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Google OAuth
        'https://accounts.google.com',
        'https://maps.googleapis.com',
        'https://cdn.jsdelivr.net',
        "'nonce-[NONCE]'"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net'
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https:',
        'blob:',
        'https://*.googleusercontent.com',
        'https://maps.googleapis.com',
        'https://maps.gstatic.com'
      ],
      connectSrc: [
        "'self'",
        'https://api.openweathermap.org',
        'wss:',
        'ws:'
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: [
        "'self'",
        'https://accounts.google.com'
      ],
      manifestSrc: ["'self'"]
    }
  }
};

// Rate limiting middleware factory
function createRateLimit(max, windowMs = SECURITY_CONFIG.rateLimiting.windowMs, message = SECURITY_CONFIG.rateLimiting.message) {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`);
      res.status(429).json({
        error: message.error,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks in production
      return req.path === '/api/health' && process.env.NODE_ENV === 'production';
    }
  });
}

// General rate limiting
const generalRateLimit = createRateLimit(SECURITY_CONFIG.rateLimiting.max);

// Stricter rate limiting for authentication endpoints
const authRateLimit = createRateLimit(
  SECURITY_CONFIG.rateLimiting.authMax,
  15 * 60 * 1000, // 15 minutes
  {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900
  }
);

// Very strict rate limiting for sensitive operations
const sensitiveRateLimit = createRateLimit(
  SECURITY_CONFIG.rateLimiting.sensitiveMax,
  5 * 60 * 1000, // 5 minutes
  {
    error: 'Too many sensitive operations, please try again later.',
    retryAfter: 300
  }
);

// Slow down middleware for gradual response delay
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  skip: (req) => req.path === '/api/health'
});

// Security headers middleware
function securityHeaders(req, res, next) {
  // Generate unique nonce for each request
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;
  
  // Set comprehensive security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen'
  });

  // Add request ID for tracking
  req.id = crypto.randomUUID();
  res.set('X-Request-ID', req.id);

  next();
}

// Input sanitization middleware
function sanitizeInput(req, res, next) {
  // Sanitize against NoSQL injection
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.query);
  mongoSanitize.sanitize(req.params);

  // Remove null bytes and other dangerous characters
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
}

// Sanitize object recursively
function sanitizeObject(obj) {
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'string') {
        // Remove null bytes, control characters, and script tags
        sanitized[key] = value
          .replace(/\0/g, '')
          .replace(/[\x00-\x1F\x7F]/g, '')
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .substring(0, 10000); // Limit string length
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
}

// Request validation middleware
function validateRequest(req, res, next) {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//g, // Path traversal
    /<script/gi, // Script injection
    /javascript:/gi, // JavaScript protocol
    /data:.*base64/gi, // Base64 data URLs
    /vbscript:/gi, // VBScript protocol
    /on\w+\s*=/gi, // Event handlers
    /expression\s*\(/gi, // CSS expression
    /import\s*\(/gi, // ES6 imports
    /eval\s*\(/gi, // Eval function
    /document\./gi, // Document object
    /window\./gi // Window object
  ];

  const requestString = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params,
    url: req.url
  });

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestString)) {
      console.warn(`Suspicious request pattern detected from ${req.ip}: ${pattern}`);
      return res.status(400).json({
        error: 'Invalid request format detected',
        requestId: req.id
      });
    }
  }

  // Validate Content-Type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
      return res.status(400).json({
        error: 'Invalid Content-Type header',
        requestId: req.id
      });
    }
  }

  next();
}

// Comprehensive security middleware setup
function setupSecurity(app) {
  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);

  // Request logging
  if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined', {
      skip: (req) => req.path === '/api/health'
    }));
  } else {
    app.use(morgan('dev'));
  }

  // Compression with security considerations
  app.use(compression({
    filter: (req, res) => {
      // Don't compress sensitive endpoints
      if (req.path.includes('/auth/') || req.path.includes('/admin/')) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024
  }));

  // Security headers
  app.use(securityHeaders);

  // Helmet for additional security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...SECURITY_CONFIG.csp.directives,
        scriptSrc: SECURITY_CONFIG.csp.directives.scriptSrc.map(src => 
          src === "'nonce-[NONCE]'" ? (req, res) => `'nonce-${res.locals.nonce}'` : src
        )
      }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Parameter pollution protection
  app.use(hpp());

  // Rate limiting
  app.use('/api/auth/', authRateLimit);
  app.use('/api/admin/', sensitiveRateLimit);
  app.use('/api/', generalRateLimit);
  app.use(speedLimiter);

  // Input validation and sanitization
  app.use(sanitizeInput);
  app.use(validateRequest);

  // Body size limits
  app.use((req, res, next) => {
    req.setTimeout(30000); // 30 second timeout
    next();
  });

  console.log('🔒 Security middleware initialized with comprehensive protection');
}

// Security monitoring middleware
function securityMonitoring(req, res, next) {
  const startTime = Date.now();
  
  // Log security events
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log slow requests
    if (duration > 5000) {
      console.warn(`Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
    }
    
    // Log failed authentication attempts
    if (req.path.includes('/auth/') && res.statusCode >= 400) {
      console.warn(`Failed auth attempt from ${req.ip}: ${req.method} ${req.path} - ${res.statusCode}`);
    }
    
    // Log admin access attempts
    if (req.path.includes('/admin/')) {
      console.info(`Admin access: ${req.ip} ${req.method} ${req.path} - ${res.statusCode}`);
    }
  });
  
  next();
}

// Error handling middleware for security
function securityErrorHandler(err, req, res, next) {
  // Log security-related errors
  if (err.type === 'entity.too.large') {
    console.warn(`Large payload blocked from ${req.ip}: ${err.message}`);
    return res.status(413).json({
      error: 'Request payload too large',
      requestId: req.id
    });
  }
  
  if (err.type === 'entity.parse.failed') {
    console.warn(`Malformed request from ${req.ip}: ${err.message}`);
    return res.status(400).json({
      error: 'Malformed request body',
      requestId: req.id
    });
  }
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    console.error('Internal server error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      requestId: req.id
    });
  }
  
  next(err);
}

module.exports = {
  setupSecurity,
  securityHeaders,
  sanitizeInput,
  validateRequest,
  securityMonitoring,
  securityErrorHandler,
  generalRateLimit,
  authRateLimit,
  sensitiveRateLimit,
  speedLimiter,
  SECURITY_CONFIG
};