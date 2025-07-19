const jwt = require('jsonwebtoken');

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  // SECURITY: Fail securely if JWT_SECRET is not set in production
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('🚨 SECURITY ERROR: JWT_SECRET not set in production environment');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-finding-sports-insecure-development-only';

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from in-memory store (replace with database in production)
    const users = global.users || new Map();
    req.user = users.get(decoded.id);

    if (!req.user) {
      return res.sendStatus(403);
    }

    // Check if user is banned
    if (req.user.bannedUntil && new Date(req.user.bannedUntil) > new Date()) {
      return res.status(403).json({
        error: 'User is banned',
        reason: req.user.banReason,
        until: req.user.bannedUntil
      });
    }

    next();
  } catch (error) {
    return res.sendStatus(403);
  }
}

// Optional auth middleware - doesn't require auth but adds user if available
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  // SECURITY: Fail securely if JWT_SECRET is not set in production
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('🚨 SECURITY ERROR: JWT_SECRET not set in production environment');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-finding-sports-insecure-development-only';

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = global.users || new Map();
    req.user = users.get(decoded.id);
  } catch (error) {
    // Silent fail - user just won't be authenticated
  }

  next();
}

// Moderator middleware
function authenticateModerator(req, res, next) {
  authenticateToken(req, res, () => {
    if (!req.user || (req.user.role !== 'moderator' && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Moderator access required' });
    }
    next();
  });
}

// Admin middleware
function authenticateAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

// Helper function to check permissions
function hasPermission(user, permission, resource = null) {
  if (!user) return false;

  // Admins have all permissions
  if (user.role === 'admin') return true;

  // Check custom permissions
  if (user.permissions && user.permissions[permission]) {
    if (resource) {
      return user.permissions[permission][resource] === true;
    }
    return user.permissions[permission] === true;
  }

  // Default role-based permissions
  const rolePermissions = {
    admin: ['*'],
    moderator: ['read', 'write', 'delete_message', 'mute', 'kick', 'warn', 'review_report', 'resolve_report'],
    user: ['read', 'write', 'report']
  };

  const userPermissions = rolePermissions[user.role] || rolePermissions.user;
  return userPermissions.includes('*') || userPermissions.includes(permission);
}

module.exports = {
  authenticateToken,
  optionalAuth,
  authenticateModerator,
  authenticateAdmin,
  hasPermission
};
