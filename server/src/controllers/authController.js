const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { logAuthEvent } = require('../utils/logger');
const memoryStore = require('../storage/memoryStore');

// Check if MongoDB is connected (dynamic check)
const useMongoDB = () => mongoose.connection.readyState === 1;
let User = null;

// Try to load User model (will fail gracefully if MongoDB not connected)
try {
  User = require('../models/User');
} catch (e) {
  console.log('⚠️  User model not available - using memory store');
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email, and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
      });
    }

    // Hash password (use static method or direct argon2)
    const argon2 = require('argon2');
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Check if user already exists
    let existingUser = null;
    if (useMongoDB() && User) {
      existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });
    } else {
      existingUser = await memoryStore.findUser({ username }) || 
                     await memoryStore.findUser({ email });
    }

    if (existingUser) {
      return res.status(400).json({
        error: 'Username or email already exists',
      });
    }

    // Create user
    let user;
    if (useMongoDB() && User) {
      user = new User({
        username,
        email,
        passwordHash,
        publicKey: req.body.publicKey || null,
      });
      await user.save();
    } else {
      // Use memory store
      user = await memoryStore.createUser({
        username,
        email,
        passwordHash,
        publicKey: req.body.publicKey || null,
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    if (useMongoDB() && user.updateLastLogin) {
      await user.updateLastLogin();
    } else {
      user.lastLogin = new Date();
      await memoryStore.updateUser(user._id, { lastLogin: user.lastLogin });
    }

    // Log successful registration
    await logAuthEvent('AUTH_SUCCESS', user._id, req.ip, true);

    // Return user data (without password hash)
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    // Log failed registration
    await logAuthEvent('AUTH_FAILURE', null, req.ip, false, error.message);
    res.status(500).json({
      error: 'Registration failed. Please try again.',
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required',
      });
    }

    // Find user
    let user;
    if (useMongoDB() && User) {
      user = await User.findOne({
        $or: [{ username }, { email: username }],
      });
    } else {
      user = await memoryStore.findUser({ username }) || 
             await memoryStore.findUser({ email: username });
    }

    if (!user) {
      // Log failed login attempt
      await logAuthEvent('AUTH_FAILURE', null, req.ip, false, 'User not found');
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    // Verify password
    const argon2 = require('argon2');
    let isValidPassword;
    if (useMongoDB() && user.verifyPassword) {
      isValidPassword = await user.verifyPassword(password);
    } else {
      isValidPassword = await argon2.verify(user.passwordHash, password);
    }

    if (!isValidPassword) {
      // Log failed login attempt
      await logAuthEvent('AUTH_FAILURE', user._id, req.ip, false, 'Invalid password');
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    // Check if 2FA is enabled
    const requires2FA = user.twoFactorEnabled;

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    if (useMongoDB() && user.updateLastLogin) {
      await user.updateLastLogin();
    } else {
      user.lastLogin = new Date();
      await memoryStore.updateUser(user._id, { lastLogin: user.lastLogin });
    }

    // Log successful login
    await logAuthEvent('AUTH_SUCCESS', user._id, req.ip, true);

    // Return user data (without password hash)
    res.json({
      message: 'Login successful',
      token,
      requires2FA,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed. Please try again.',
    });
  }
};

// Get current user (protected route)
exports.getCurrentUser = async (req, res) => {
  try {
    let user;
    if (useMongoDB() && User) {
      user = await User.findById(req.userId).select('-passwordHash');
    } else {
      user = await memoryStore.findUser({ _id: req.userId });
      if (user) {
        // Remove password hash
        const { passwordHash, ...userWithoutPassword } = user;
        user = userWithoutPassword;
      }
    }

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        publicKey: user.publicKey,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user information',
    });
  }
};

