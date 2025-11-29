const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify JWT token
exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided. Authorization required.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add userId to request object
    req.userId = decoded.userId;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
      });
    }
    return res.status(500).json({
      error: 'Token verification failed',
    });
  }
};

