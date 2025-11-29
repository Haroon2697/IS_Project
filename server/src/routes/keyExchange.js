const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { logSecurityEvent } = require('../utils/logger');

// All routes require authentication
router.use(verifyToken);

/**
 * Key Exchange Init - Relay message from sender to receiver
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
    
    // Store message for receiver to retrieve
    // In production, use WebSocket for real-time delivery
    // For now, store in database or memory
    
    res.json({
      message: 'Key exchange init message received',
      status: 'pending',
    });
  } catch (error) {
    console.error('Key exchange init error:', error);
    res.status(500).json({ error: 'Failed to process key exchange init' });
  }
});

/**
 * Key Exchange Response - Relay response message
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
    
    res.json({
      message: 'Key exchange response received',
      status: 'pending',
    });
  } catch (error) {
    console.error('Key exchange response error:', error);
    res.status(500).json({ error: 'Failed to process key exchange response' });
  }
});

/**
 * Key Exchange Confirm - Relay confirmation message
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
    
    res.json({
      message: 'Key confirmation received',
      status: 'pending',
    });
  } catch (error) {
    console.error('Key exchange confirm error:', error);
    res.status(500).json({ error: 'Failed to process key confirmation' });
  }
});

/**
 * Key Exchange Acknowledge - Relay acknowledgment message
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
    
    res.json({
      message: 'Key acknowledgment received',
      status: 'complete',
    });
  } catch (error) {
    console.error('Key exchange ack error:', error);
    res.status(500).json({ error: 'Failed to process key acknowledgment' });
  }
});

module.exports = router;

