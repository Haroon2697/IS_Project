const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { logSecurityEvent } = require('../utils/logger');

// Store reference to io instance (set from server.js)
let io = null;

// Simple deduplication - track recent message hashes
const recentMessages = new Map();
const MESSAGE_DEDUP_WINDOW = 5000; // 5 seconds

// Function to set io instance
router.setIO = (ioInstance) => {
  io = ioInstance;
  console.log('✅ Socket.io instance set for key exchange routes');
};

// Check if message is duplicate
function isDuplicate(message) {
  const hash = `${message.type}-${message.senderId}-${message.receiverId}-${message.nonce || message.timestamp}`;
  if (recentMessages.has(hash)) {
    return true;
  }
  recentMessages.set(hash, Date.now());
  // Cleanup old entries
  setTimeout(() => recentMessages.delete(hash), MESSAGE_DEDUP_WINDOW);
  return false;
}

// All routes require authentication
router.use(verifyToken);

/**
 * Key Exchange Init - Relay message from sender to receiver via Socket.io
 */
router.post('/init', async (req, res) => {
  try {
    const message = req.body;
    
    // Validate message structure
    if (!message.type || !message.senderId || !message.receiverId) {
      return res.status(400).json({ error: 'Invalid message format' });
    }
    
    // Log key exchange attempt
    await logSecurityEvent(
      'KEY_EXCHANGE_INIT',
      req.userId,
      {
        senderId: message.senderId,
        receiverId: message.receiverId,
      },
      'INFO'
    );
    
    // Forward message to receiver via Socket.io (with deduplication)
    if (io && !isDuplicate(message)) {
      console.log(`🔑 Forwarding INIT from ${message.senderId} to ${message.receiverId}`);
      io.to(`user:${message.receiverId}`).emit('keyexchange:receive', {
        ...message,
        messageType: 'init'
      });
    } else if (!io) {
      console.warn('⚠️ Socket.io not available for key exchange forwarding');
    }
    
    res.json({
      message: 'Key exchange init message sent',
      status: 'sent',
    });
  } catch (error) {
    console.error('Key exchange init error:', error);
    res.status(500).json({ error: 'Failed to process key exchange init' });
  }
});

/**
 * Key Exchange Response - Relay response message via Socket.io
 */
router.post('/response', async (req, res) => {
  try {
    const message = req.body;
    
    if (!message.type || !message.senderId || !message.receiverId) {
      return res.status(400).json({ error: 'Invalid message format' });
    }
    
    await logSecurityEvent(
      'KEY_EXCHANGE_RESPONSE',
      req.userId,
      {
        senderId: message.senderId,
        receiverId: message.receiverId,
      },
      'INFO'
    );
    
    // Forward message to receiver via Socket.io (with deduplication)
    if (io && !isDuplicate(message)) {
      console.log(`🔑 Forwarding RESPONSE from ${message.senderId} to ${message.receiverId}`);
      io.to(`user:${message.receiverId}`).emit('keyexchange:receive', {
        ...message,
        messageType: 'response'
      });
    } else if (!io) {
      console.warn('⚠️ Socket.io not available for key exchange forwarding');
    }
    
    res.json({
      message: 'Key exchange response sent',
      status: 'sent',
    });
  } catch (error) {
    console.error('Key exchange response error:', error);
    res.status(500).json({ error: 'Failed to process key exchange response' });
  }
});

/**
 * Key Exchange Confirm - Relay confirmation message via Socket.io
 */
router.post('/confirm', async (req, res) => {
  try {
    const message = req.body;
    
    if (!message.type || !message.ciphertext) {
      return res.status(400).json({ error: 'Invalid message format' });
    }
    
    await logSecurityEvent(
      'KEY_EXCHANGE_CONFIRM',
      req.userId,
      {
        senderId: message.senderId,
        receiverId: message.receiverId,
      },
      'INFO'
    );
    
    // Forward message to receiver via Socket.io (with deduplication)
    if (io && !isDuplicate(message)) {
      console.log(`🔑 Forwarding CONFIRM from ${message.senderId} to ${message.receiverId}`);
      io.to(`user:${message.receiverId}`).emit('keyexchange:receive', {
        ...message,
        messageType: 'confirm'
      });
    }
    
    res.json({
      message: 'Key confirmation sent',
      status: 'sent',
    });
  } catch (error) {
    console.error('Key exchange confirm error:', error);
    res.status(500).json({ error: 'Failed to process key confirmation' });
  }
});

/**
 * Key Exchange Acknowledge - Relay acknowledgment message via Socket.io
 */
router.post('/acknowledge', async (req, res) => {
  try {
    const message = req.body;
    
    if (!message.type || !message.ciphertext) {
      return res.status(400).json({ error: 'Invalid message format' });
    }
    
    await logSecurityEvent(
      'KEY_EXCHANGE_ACK',
      req.userId,
      {
        senderId: message.senderId,
        receiverId: message.receiverId,
      },
      'INFO'
    );
    
    // Forward message to receiver via Socket.io (with deduplication)
    if (io && !isDuplicate(message)) {
      console.log(`🔑 Forwarding ACK from ${message.senderId} to ${message.receiverId}`);
      io.to(`user:${message.receiverId}`).emit('keyexchange:receive', {
        ...message,
        messageType: 'acknowledge'
      });
    }
    
    res.json({
      message: 'Key acknowledgment sent',
      status: 'complete',
    });
  } catch (error) {
    console.error('Key exchange ack error:', error);
    res.status(500).json({ error: 'Failed to process key acknowledgment' });
  }
});

module.exports = router;

