const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.SERVER_URL || 'http://localhost:5000'}/api/oauth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, update last login
          await user.updateLastLogin();
          return done(null, user);
        }

        // Check if user exists with this email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          await user.save();
          await user.updateLastLogin();
          return done(null, user);
        }

        // Create new user
        user = new User({
          username: profile.displayName.toLowerCase().replace(/\s+/g, '') + Math.random().toString(36).substring(7),
          email: profile.emails[0].value,
          googleId: profile.id,
          passwordHash: '', // OAuth users don't need password
        });

        await user.save();
        await user.updateLastLogin();
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Generate JWT token for OAuth user
const generateOAuthToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = { passport, generateOAuthToken };

