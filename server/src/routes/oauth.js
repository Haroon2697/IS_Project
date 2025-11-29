const express = require('express');
const router = express.Router();
const { passport } = require('../config/passport');
const oauthController = require('../controllers/oauthController');

// Get OAuth URL
router.get('/url', oauthController.getOAuthUrl);

// Google OAuth routes
router.get(
  '/google',
  oauthController.googleAuth,
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  oauthController.googleCallback
);

module.exports = router;

