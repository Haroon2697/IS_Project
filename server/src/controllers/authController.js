const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logAuthEvent } = require('../utils/logger');

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

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Username or email already exists',
      });
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Create user
    const user = new User({
      username,
      email,
      passwordHash,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    await user.updateLastLogin();

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
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user) {
      // Log failed login attempt
      await logAuthEvent('AUTH_FAILURE', null, req.ip, false, 'User not found');
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    // Verify password
    const isValidPassword = await user.verifyPassword(password);

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
    await user.updateLastLogin();

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
    const user = await User.findById(req.userId).select('-passwordHash');

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

