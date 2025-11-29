const User = require('../models/User');

// Middleware to check if 2FA is required
exports.require2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      // Check if 2FA was verified in this session
      if (!req.session.twoFactorVerified) {
        return res.status(403).json({
          error: '2FA verification required',
          requires2FA: true,
        });
      }
    }

    next();
  } catch (error) {
    console.error('2FA middleware error:', error);
    res.status(500).json({ error: '2FA verification failed' });
  }
};

