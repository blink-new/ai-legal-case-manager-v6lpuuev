const jwt = require('jsonwebtoken');
const { database } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Middleware to verify JWT token
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'No token provided'
    });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if session exists and is valid
    const session = await database.get(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")',
      [token]
    );

    if (!session) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token has expired or been revoked'
      });
    }

    // Get user details
    const user = await database.get(
      'SELECT id, email, first_name, last_name, role, firm_name, phone, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user || !user.is_active) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User account is inactive or does not exist'
      });
    }

    // Add user info to request object
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please log in again'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is malformed'
      });
    }

    return res.status(500).json({
      error: 'Authentication error',
      message: 'Failed to authenticate token'
    });
  }
}

// Middleware to check user roles
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in first'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
}

// Generate JWT token
function generateToken(userId, email) {
  return jwt.sign(
    { 
      userId, 
      email,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { 
      expiresIn: '7d' // Token expires in 7 days
    }
  );
}

// Clean up expired sessions
async function cleanupExpiredSessions() {
  try {
    const result = await database.run(
      'DELETE FROM sessions WHERE expires_at <= datetime("now")'
    );
    console.log(`Cleaned up ${result.changes} expired sessions`);
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = {
  authenticateToken,
  requireRole,
  generateToken,
  cleanupExpiredSessions
};