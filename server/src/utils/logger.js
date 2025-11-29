// Security logging utility
const mongoose = require('mongoose');

const logEvent = async (eventType, userId, details = {}, severity = 'INFO') => {
  try {
    // Only log if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log(`[LOG] ${eventType} - User: ${userId || 'N/A'} - ${JSON.stringify(details)}`);
      return;
    }

    const Log = require('../models/Log');
    const log = new Log({
      eventType,
      userId,
      timestamp: new Date(),
      details,
      severity,
    });
    await log.save();
  } catch (error) {
    // Fallback to console logging if database logging fails
    console.log(`[LOG] ${eventType} - User: ${userId || 'N/A'} - ${JSON.stringify(details)}`);
    // Don't throw - logging failures shouldn't break the app
  }
};

// Log authentication events
const logAuthEvent = async (eventType, userId, ipAddress, success, reason = null) => {
  await logEvent(
    eventType,
    userId,
    {
      ipAddress,
      success,
      reason,
    },
    success ? 'INFO' : 'WARNING'
  );
};

// Log security events
const logSecurityEvent = async (eventType, userId, details, severity = 'MEDIUM') => {
  await logEvent(eventType, userId, details, severity);
};

module.exports = {
  logEvent,
  logAuthEvent,
  logSecurityEvent,
};

