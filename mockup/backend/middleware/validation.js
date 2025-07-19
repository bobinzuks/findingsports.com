const { body, query, param, validationResult } = require('express-validator');
const validator = require('validator');
const crypto = require('crypto');

// Validation error handler
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    console.warn(`Validation errors for ${req.ip}: ${JSON.stringify(errorDetails)}`);
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errorDetails,
      requestId: req.id
    });
  }
  
  next();
}

// Authentication validation rules
const authValidation = {
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .isLength({ max: 254 })
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6, max: 128 })
      .withMessage('Password must be between 6 and 128 characters'),
    handleValidationErrors
  ],
  
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .isLength({ max: 254 })
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8, max: 128 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least 8 characters with uppercase, lowercase, number, and special character'),
    body('username')
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username must be 3-30 characters with only letters, numbers, underscore, and dash'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .trim()
      .escape()
      .withMessage('Name must be 1-100 characters'),
    handleValidationErrors
  ],
  
  googleAuth: [
    body('credential')
      .isLength({ min: 1, max: 10000 })
      .withMessage('Google credential is required'),
    handleValidationErrors
  ]
};

// Game validation rules
const gameValidation = {
  create: [
    body('title')
      .isLength({ min: 3, max: 100 })
      .trim()
      .escape()
      .withMessage('Game title must be 3-100 characters'),
    body('sport')
      .isIn(['basketball', 'soccer', 'tennis', 'volleyball', 'hockey', 'baseball', 'football', 'badminton', 'squash', 'other'])
      .withMessage('Invalid sport selection'),
    body('location')
      .isLength({ min: 3, max: 200 })
      .trim()
      .escape()
      .withMessage('Location must be 3-200 characters'),
    body('lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    body('dateTime')
      .isISO8601()
      .isAfter()
      .withMessage('Date and time must be in the future'),
    body('maxPlayers')
      .isInt({ min: 2, max: 50 })
      .withMessage('Maximum players must be between 2 and 50'),
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .trim()
      .escape()
      .withMessage('Description must be less than 1000 characters'),
    body('skillLevel')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'mixed'])
      .withMessage('Invalid skill level'),
    handleValidationErrors
  ],
  
  join: [
    param('gameId')
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Invalid game ID'),
    handleValidationErrors
  ]
};

// Search validation rules
const searchValidation = {
  games: [
    query('location')
      .optional()
      .isLength({ max: 200 })
      .trim()
      .escape()
      .withMessage('Location must be less than 200 characters'),
    query('sport')
      .optional()
      .isIn(['basketball', 'soccer', 'tennis', 'volleyball', 'hockey', 'baseball', 'football', 'badminton', 'squash', 'other'])
      .withMessage('Invalid sport filter'),
    query('lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    query('lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    query('radius')
      .optional()
      .isInt({ min: 1, max: 200 })
      .withMessage('Radius must be between 1 and 200 km'),
    query('date')
      .optional()
      .isISO8601()
      .withMessage('Date must be in ISO8601 format'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer'),
    handleValidationErrors
  ]
};

// User preferences validation
const userValidation = {
  preferences: [
    body('location')
      .optional()
      .isLength({ max: 200 })
      .trim()
      .escape()
      .withMessage('Location must be less than 200 characters'),
    body('sports')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Sports must be an array with maximum 10 items'),
    body('sports.*')
      .optional()
      .isIn(['basketball', 'soccer', 'tennis', 'volleyball', 'hockey', 'baseball', 'football', 'badminton', 'squash', 'other'])
      .withMessage('Invalid sport in preferences'),
    body('timePreferences')
      .optional()
      .isObject()
      .withMessage('Time preferences must be an object'),
    body('timePreferences.morning')
      .optional()
      .isBoolean()
      .withMessage('Morning preference must be boolean'),
    body('timePreferences.afternoon')
      .optional()
      .isBoolean()
      .withMessage('Afternoon preference must be boolean'),
    body('timePreferences.evening')
      .optional()
      .isBoolean()
      .withMessage('Evening preference must be boolean'),
    handleValidationErrors
  ]
};

// Chat validation rules
const chatValidation = {
  message: [
    body('message')
      .isLength({ min: 1, max: 1000 })
      .trim()
      .withMessage('Message must be 1-1000 characters'),
    body('roomId')
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Invalid room ID'),
    handleValidationErrors
  ],
  
  createRoom: [
    body('name')
      .isLength({ min: 3, max: 100 })
      .trim()
      .escape()
      .withMessage('Room name must be 3-100 characters'),
    body('type')
      .isIn(['public', 'private', 'game'])
      .withMessage('Invalid room type'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .trim()
      .escape()
      .withMessage('Description must be less than 500 characters'),
    handleValidationErrors
  ]
};

// Admin validation rules
const adminValidation = {
  banUser: [
    body('userId')
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Invalid user ID'),
    body('reason')
      .isLength({ min: 5, max: 500 })
      .trim()
      .escape()
      .withMessage('Ban reason must be 5-500 characters'),
    body('duration')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Duration must be 1-365 days'),
    handleValidationErrors
  ],
  
  moderateContent: [
    body('contentId')
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Invalid content ID'),
    body('action')
      .isIn(['approve', 'reject', 'flag', 'delete'])
      .withMessage('Invalid moderation action'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .trim()
      .escape()
      .withMessage('Reason must be less than 500 characters'),
    handleValidationErrors
  ]
};

// File upload validation
const fileValidation = {
  image: [
    body('fileType')
      .optional()
      .isIn(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
      .withMessage('Invalid image file type'),
    body('fileSize')
      .optional()
      .isInt({ min: 1, max: 5 * 1024 * 1024 }) // 5MB max
      .withMessage('File size must be less than 5MB'),
    handleValidationErrors
  ]
};

// Custom validation functions
const customValidators = {
  // Validate JWT token format
  isJWTToken: (value) => {
    const parts = value.split('.');
    return parts.length === 3 && parts.every(part => /^[A-Za-z0-9_-]+$/.test(part));
  },
  
  // Validate coordinate pair
  isCoordinatePair: (lat, lng) => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },
  
  // Validate time range
  isValidTimeRange: (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return start < end && start > new Date();
  },
  
  // Validate safe HTML content
  isSafeHTML: (content) => {
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(content));
  },
  
  // Validate API key format
  isValidAPIKey: (key) => {
    return /^[A-Za-z0-9_-]{32,128}$/.test(key);
  }
};

// Sanitization functions
const sanitizers = {
  // Sanitize HTML content
  sanitizeHTML: (content) => {
    return validator.escape(content)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },
  
  // Sanitize SQL-like content
  sanitizeSQL: (content) => {
    return content
      .replace(/['";]/g, '')
      .replace(/\b(DROP|DELETE|UPDATE|INSERT|SELECT|UNION|ALTER|CREATE)\b/gi, '')
      .trim();
  },
  
  // Sanitize file paths
  sanitizePath: (path) => {
    return path
      .replace(/\.\./g, '')
      .replace(/[^a-zA-Z0-9._/-]/g, '')
      .replace(/\/+/g, '/')
      .substring(0, 255);
  }
};

// Rate limiting for validation endpoints
const validationRateLimit = {
  email: new Map(),
  registration: new Map(),
  
  checkEmailRate: (email, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const now = Date.now();
    const attempts = validationRateLimit.email.get(email) || [];
    const validAttempts = attempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    validationRateLimit.email.set(email, validAttempts);
    return true;
  }
};

module.exports = {
  authValidation,
  gameValidation,
  searchValidation,
  userValidation,
  chatValidation,
  adminValidation,
  fileValidation,
  customValidators,
  sanitizers,
  validationRateLimit,
  handleValidationErrors
};