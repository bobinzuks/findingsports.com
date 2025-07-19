const cors = require('cors');

// Production CORS configuration
const PRODUCTION_ORIGINS = [
  'https://finding-sports.vercel.app',
  'https://finding-sports-production.up.railway.app',
  'https://finding-sports.railway.app',
  'https://www.finding-sports.com',
  'https://finding-sports.com'
];

// Development CORS configuration
const DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
];

// Get allowed origins based on environment
function getAllowedOrigins() {
  const envOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
  
  if (process.env.NODE_ENV === 'production') {
    return [...PRODUCTION_ORIGINS, ...envOrigins];
  } else {
    return [...DEVELOPMENT_ORIGINS, ...PRODUCTION_ORIGINS, ...envOrigins];
  }
}

// Dynamic origin validation
function validateOrigin(origin, callback) {
  const allowedOrigins = getAllowedOrigins();
  
  // Allow requests with no origin (mobile apps, Postman, etc.)
  if (!origin) {
    return callback(null, true);
  }
  
  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  
  // Allow localhost in development
  if (process.env.NODE_ENV !== 'production' && origin.match(/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/)) {
    return callback(null, true);
  }
  
  // Log and reject unauthorized origins
  console.warn(`CORS: Blocked request from unauthorized origin: ${origin}`);
  callback(new Error(`CORS: Origin ${origin} not allowed`), false);
}

// Secure CORS configuration
const corsConfig = {
  origin: validateOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
    'X-Request-ID',
    'Cache-Control'
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
    'X-Total-Count'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400 // 24 hours for preflight cache
};

// Create CORS middleware
const corsMiddleware = cors(corsConfig);

// Enhanced CORS middleware with security logging
function secureCorsMidleware(req, res, next) {
  // Log CORS requests for monitoring
  if (req.headers.origin) {
    console.log(`CORS request from: ${req.headers.origin} to ${req.method} ${req.path}`);
  }
  
  // Add security headers for CORS
  res.header('Vary', 'Origin');
  res.header('X-Content-Type-Options', 'nosniff');
  
  // Apply CORS
  corsMiddleware(req, res, (err) => {
    if (err) {
      console.error(`CORS error: ${err.message}`);
      return res.status(403).json({
        error: 'CORS policy violation',
        message: 'Origin not allowed'
      });
    }
    next();
  });
}

// Preflight optimization middleware
function optimizedPreflight(req, res, next) {
  if (req.method === 'OPTIONS') {
    // Set comprehensive preflight headers
    res.header('Access-Control-Max-Age', '86400');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
    
    // Quick response for preflight
    return res.status(204).end();
  }
  next();
}

// CORS configuration for WebSocket connections
function configureWebSocketCORS(io) {
  const allowedOrigins = getAllowedOrigins();
  
  io.engine.on('initial_headers', (headers, req) => {
    const origin = req.headers.origin;
    
    if (origin && allowedOrigins.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
  });
  
  // Middleware to validate WebSocket connections
  io.use((socket, next) => {
    const origin = socket.handshake.headers.origin;
    
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      next();
    } else {
      console.warn(`WebSocket: Blocked connection from unauthorized origin: ${origin}`);
      next(new Error('CORS: Origin not allowed for WebSocket connection'));
    }
  });
}

// CORS security audit function
function auditCORSConfiguration() {
  const config = {
    environment: process.env.NODE_ENV,
    allowedOrigins: getAllowedOrigins(),
    configuration: {
      credentials: corsConfig.credentials,
      methods: corsConfig.methods,
      allowedHeaders: corsConfig.allowedHeaders,
      maxAge: corsConfig.maxAge
    }
  };
  
  console.log('🔒 CORS Security Configuration:', JSON.stringify(config, null, 2));
  
  // Warn about potential security issues
  if (process.env.NODE_ENV === 'production') {
    const prodOrigins = config.allowedOrigins.filter(origin => 
      !origin.includes('localhost') && !origin.includes('127.0.0.1')
    );
    
    if (prodOrigins.length === 0) {
      console.warn('⚠️  WARNING: No production origins configured for CORS');
    }
    
    if (config.allowedOrigins.some(origin => origin.includes('localhost'))) {
      console.warn('⚠️  WARNING: Localhost origins allowed in production');
    }
  }
  
  return config;
}

module.exports = {
  secureCorsMidleware,
  optimizedPreflight,
  configureWebSocketCORS,
  auditCORSConfiguration,
  getAllowedOrigins,
  corsConfig,
  PRODUCTION_ORIGINS,
  DEVELOPMENT_ORIGINS
};