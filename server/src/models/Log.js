const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: [
      'AUTH_SUCCESS',
      'AUTH_FAILURE',
      'KEY_EXCHANGE_INIT',
      'KEY_EXCHANGE_COMPLETE',
      'KEY_EXCHANGE_FAILED',
      'REPLAY_ATTACK_DETECTED',
      'INVALID_SIGNATURE',
      'DECRYPTION_FAILED',
      'MESSAGE_SENT',
      'MESSAGE_RECEIVED',
      'MESSAGE_FAILED',
      'FILE_UPLOADED',
      'FILE_DOWNLOADED',
      'FILE_DELETED',
      'FILE_ACCESS_DENIED',
      'FILE_DECRYPTION_FAILED',
    ],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'INFO', 'WARNING'],
    default: 'INFO',
  },
});

// Index for faster queries
logSchema.index({ timestamp: -1 });
logSchema.index({ eventType: 1 });
logSchema.index({ userId: 1 });
logSchema.index({ severity: 1 });

const Log = mongoose.model('Log', logSchema);

module.exports = Log;

