const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/auth');
const memoryStore = require('../storage/memoryStore');

// Check if MongoDB is connected (dynamic check)
const useMongoDB = () => mongoose.connection.readyState === 1;
let User = null;
try {
  User = require('../models/User');
} catch (e) {
  console.log('⚠️  User model not available - using memory store');
}

/**
 * Get list of all users (excluding current user)
 */
router.get('/list', verifyToken, async (req, res) => {
  try {
    let users;
    if (useMongoDB() && User) {
      users = await User.find({ _id: { $ne: req.userId } })
        .select('username email publicKey createdAt')
        .sort({ username: 1 });
    } else {
      // Get all users from memory store (excluding current user)
      const allUsers = memoryStore.getAllUsers();
      console.log('All users in memory store:', allUsers.length);
      console.log('Current user ID:', req.userId);
      
      const filteredUsers = allUsers
        .filter(user => {
          const isNotCurrent = user._id !== req.userId;
          console.log(`User ${user.username} (${user._id}): ${isNotCurrent ? 'included' : 'excluded (current user)'}`);
          return isNotCurrent;
        })
        .map(user => ({
          _id: user._id,
          username: user.username,
          email: user.email,
          publicKey: user.publicKey,
          createdAt: user.createdAt,
        }));
      users = filteredUsers.sort((a, b) => a.username.localeCompare(b.username));
      console.log('Filtered users count:', users.length);
    }
    
    res.json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        hasPublicKey: !!user.publicKey,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get users list error:', error);
    res.status(500).json({ error: 'Failed to get users list' });
  }
});

/**
 * Update user's public key (for key regeneration)
 */
router.put('/:userId/publicKey', verifyToken, async (req, res) => {
  try {
    const { publicKey } = req.body;
    
    // Verify user is updating their own key
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ error: 'Cannot update another user\'s public key' });
    }
    
    if (!publicKey) {
      return res.status(400).json({ error: 'Public key is required' });
    }
    
    let user;
    if (useMongoDB() && User) {
      user = await User.findByIdAndUpdate(
        req.params.userId,
        { publicKey },
        { new: true }
      ).select('publicKey username');
    } else {
      user = await memoryStore.updateUser(req.params.userId, { publicKey });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`🔑 Public key updated for user ${user.username}`);
    
    res.json({
      message: 'Public key updated successfully',
      userId: user._id,
      username: user.username,
    });
  } catch (error) {
    console.error('Update public key error:', error);
    res.status(500).json({ error: 'Failed to update public key' });
  }
});

/**
 * Get user's public key
 */
router.get('/:userId/publicKey', verifyToken, async (req, res) => {
  try {
    let user;
    if (useMongoDB() && User) {
      user = await User.findById(req.params.userId).select('publicKey username');
    } else {
      user = await memoryStore.findUser({ _id: req.params.userId });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.publicKey) {
      return res.status(404).json({ error: 'Public key not found for user' });
    }
    
    res.json({
      userId: user._id,
      username: user.username,
      publicKey: user.publicKey,
    });
  } catch (error) {
    console.error('Get public key error:', error);
    res.status(500).json({ error: 'Failed to get public key' });
  }
});

module.exports = router;

