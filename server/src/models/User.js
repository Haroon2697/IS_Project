const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  passwordHash: {
    type: String,
    required: function() {
      return !this.googleId; // Required only if not OAuth user
    },
  },
  googleId: {
    type: String,
    default: null,
    sparse: true, // Allows multiple nulls
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    default: null,
  },
  twoFactorBackupCodes: [{
    type: String,
  }],
  publicKey: {
    type: String,
    default: null, // Will be set during key generation
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
});

// Index for faster queries
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });

// Method to verify password
userSchema.methods.verifyPassword = async function (password) {
  try {
    return await argon2.verify(this.passwordHash, password);
  } catch (error) {
    return false;
  }
};

// Method to update last login
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save();
};

// Static method to hash password
userSchema.statics.hashPassword = async function (password) {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;

