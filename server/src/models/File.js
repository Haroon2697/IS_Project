const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileId: {
    type: String,
    required: true,
    unique: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    default: 'application/octet-stream',
  },
  fileSize: {
    type: Number,
    required: true,
  },
  uploaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  totalChunks: {
    type: Number,
    required: true,
  },
  encryptedChunks: [{
    chunkIndex: {
      type: Number,
      required: true,
    },
    ciphertext: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    authTag: {
      type: String,
      required: true,
    },
  }],
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  downloadedAt: {
    type: Date,
    default: null,
  },
});

// Indexes for faster queries
fileSchema.index({ uploaderId: 1 });
fileSchema.index({ recipientId: 1 });
fileSchema.index({ uploadedAt: -1 });
fileSchema.index({ fileId: 1 });

const File = mongoose.model('File', fileSchema);

module.exports = File;

