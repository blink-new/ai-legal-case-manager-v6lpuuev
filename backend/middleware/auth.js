const jwt = require('jsonwebtoken');
const { database } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

function generateToken(userId, email) {
  return jwt.sign(
    { 
      id: userId, 
      email: email 
    },
    JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
    }
  );
}

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
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if session exists and is valid
    const session = await database.get(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")',
      [token]
    );

    if (!session) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token has expired or is invalid'
      });
    }

    // Get user data
    const user = await database.get(
      'SELECT id, email, first_name, last_name, role, firm_name, phone FROM users WHERE id = ? AND is_active = 1',
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User account not found or inactive'
      });
    }

    // Attach user and token to request
    req.user = user;
    req.token = token;
    next();

  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is malformed or invalid'
      });
    }

    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
}

module.exports = {
  generateToken,
  authenticateToken,
  requireRole
};