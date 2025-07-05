const jwt = require('jsonwebtoken');

// Auth middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get user from in-memory store (replace with database in production)
        const users = global.users || new Map();
        req.user = users.get(decoded.id);

        if (!req.user) {
            return res.sendStatus(403);
        }

        next();
    } catch (error) {
        return res.sendStatus(403);
    }
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

module.exports = {
    authenticateToken,
    authenticateAdmin
};
