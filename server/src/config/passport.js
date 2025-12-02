const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const memoryStore = require('../storage/memoryStore');

// Check if MongoDB is connected (dynamic check)
const useMongoDB = () => mongoose.connection.readyState === 1;
let User = null;
try {
  User = require('../models/User');
} catch (e) {
  console.log('⚠️  User model not available for OAuth - using memory store');
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    let user;
    if (useMongoDB() && User) {
      user = await User.findById(id);
    } else {
      user = await memoryStore.findUser({ _id: id });
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy (only initialize if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
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
          let user;
          if (useMongoDB() && User) {
            user = await User.findOne({ googleId: profile.id });
          } else {
            user = await memoryStore.findUser({ googleId: profile.id });
          }

          if (user) {
            // User exists, update last login
            if (useMongoDB() && user.updateLastLogin) {
              await user.updateLastLogin();
            } else {
              user.lastLogin = new Date();
              await memoryStore.updateUser(user._id, { lastLogin: user.lastLogin });
            }
            return done(null, user);
          }

          // Check if user exists with this email
          if (useMongoDB() && User) {
            user = await User.findOne({ email: profile.emails[0].value });
          } else {
            user = await memoryStore.findUser({ email: profile.emails[0].value });
          }

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            if (useMongoDB() && user.save) {
              await user.save();
              await user.updateLastLogin();
            } else {
              await memoryStore.updateUser(user._id, { googleId: profile.id, lastLogin: new Date() });
            }
            return done(null, user);
          }

          // Create new user
          const username = profile.displayName.toLowerCase().replace(/\s+/g, '') + Math.random().toString(36).substring(7);
          if (useMongoDB() && User) {
            user = new User({
              username,
              email: profile.emails[0].value,
              googleId: profile.id,
              passwordHash: '', // OAuth users don't need password
            });
            await user.save();
            await user.updateLastLogin();
          } else {
            user = await memoryStore.createUser({
              username,
              email: profile.emails[0].value,
              googleId: profile.id,
              passwordHash: '', // OAuth users don't need password
              lastLogin: new Date(),
            });
          }
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
  console.log('✅ Google OAuth strategy initialized');
} else {
  console.log('ℹ️  Google OAuth not configured (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not set)');
  console.log('💡 OAuth login will not be available, but regular login will work');
}

// Generate JWT token for OAuth user
const generateOAuthToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = { passport, generateOAuthToken };

