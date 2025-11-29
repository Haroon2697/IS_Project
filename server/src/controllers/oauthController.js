const { generateOAuthToken } = require('../config/passport');
const { logAuthEvent } = require('../utils/logger');

// Google OAuth login initiation
exports.googleAuth = (req, res, next) => {
  // Store redirect URL if provided
  if (req.query.redirect) {
    req.session.redirectUrl = req.query.redirect;
  }
  next();
};

// Google OAuth callback
exports.googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }

    // Generate JWT token
    const token = generateOAuthToken(req.user._id);

    // Log successful OAuth login
    await logAuthEvent('AUTH_SUCCESS', req.user._id, req.ip, true, 'OAuth');

    // Redirect to frontend with token
    const redirectUrl = req.session.redirectUrl || `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`;
    delete req.session.redirectUrl;

    // Redirect with token in URL (frontend will extract it)
    res.redirect(`${redirectUrl}?token=${token}&oauth=true`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
  }
};

// Get OAuth URL
exports.getOAuthUrl = (req, res) => {
  const redirectUrl = req.query.redirect || `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`;
  const authUrl = `/api/auth/google?redirect=${encodeURIComponent(redirectUrl)}`;
  res.json({ authUrl });
};

