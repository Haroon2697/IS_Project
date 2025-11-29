const mongoose = require('mongoose');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { logSecurityEvent } = require('../utils/logger');
const memoryStore = require('../storage/memoryStore');

// Check if MongoDB is connected (dynamic check)
const useMongoDB = () => mongoose.connection.readyState === 1;
let User = null;
try {
  User = require('../models/User');
} catch (e) {
  console.log('⚠️  User model not available for 2FA - using memory store');
}

// Generate 2FA secret and QR code
exports.setup2FA = async (req, res) => {
  try {
    let user;
    if (useMongoDB() && User) {
      user = await User.findById(req.userId);
    } else {
      user = await memoryStore.findUser({ _id: req.userId });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Secure Messaging (${user.email})`,
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
    const hashedBackupCodes = backupCodes.map(code => 
      require('crypto').createHash('sha256').update(code).digest('hex')
    );

    // Store secret temporarily (user needs to verify before enabling)
    if (useMongoDB() && user.save) {
      user.twoFactorSecret = secret.base32;
      user.twoFactorBackupCodes = hashedBackupCodes;
      await user.save();
    } else {
      await memoryStore.updateUser(user._id, {
        twoFactorSecret: secret.base32,
        twoFactorBackupCodes: hashedBackupCodes,
      });
      user.twoFactorSecret = secret.base32;
      user.twoFactorBackupCodes = hashedBackupCodes;
    }

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: backupCodes, // Only shown once during setup
      message: 'Scan QR code with authenticator app and verify to enable 2FA',
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
};

// Verify 2FA code and enable
exports.verifyAndEnable2FA = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    let user;
    if (useMongoDB() && User) {
      user = await User.findById(req.userId);
    } else {
      user = await memoryStore.findUser({ _id: req.userId });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA not set up. Please setup first.' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps (60 seconds) tolerance
    });

    if (!verified) {
      await logSecurityEvent('INVALID_2FA_TOKEN', req.userId, { attempt: 'enable' }, 'MEDIUM');
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    // Enable 2FA
    if (useMongoDB() && user.save) {
      user.twoFactorEnabled = true;
      await user.save();
    } else {
      await memoryStore.updateUser(user._id, { twoFactorEnabled: true });
      user.twoFactorEnabled = true;
    }

    await logSecurityEvent('2FA_ENABLED', req.userId, {}, 'INFO');

    res.json({
      message: '2FA enabled successfully',
      enabled: true,
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
};

// Verify 2FA code during login
exports.verify2FA = async (req, res) => {
  try {
    const { token, userId } = req.body;

    if (!token || !userId) {
      return res.status(400).json({ error: 'Token and userId are required' });
    }

    let user;
    if (useMongoDB() && User) {
      user = await User.findById(userId);
    } else {
      user = await memoryStore.findUser({ _id: userId });
    }

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA not enabled for this user' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    // Check backup codes if TOTP fails
    if (!verified) {
      const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
      const backupCodeIndex = user.twoFactorBackupCodes.indexOf(tokenHash);

      if (backupCodeIndex !== -1) {
        // Remove used backup code
        const updatedBackupCodes = [...user.twoFactorBackupCodes];
        updatedBackupCodes.splice(backupCodeIndex, 1);
        if (useMongoDB() && user.save) {
          user.twoFactorBackupCodes = updatedBackupCodes;
          await user.save();
        } else {
          await memoryStore.updateUser(user._id, { twoFactorBackupCodes: updatedBackupCodes });
        }
        await logSecurityEvent('2FA_BACKUP_CODE_USED', userId, {}, 'MEDIUM');
        return res.json({ verified: true, usedBackupCode: true });
      }

      await logSecurityEvent('INVALID_2FA_TOKEN', userId, { attempt: 'login' }, 'HIGH');
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    await logSecurityEvent('2FA_VERIFIED', userId, {}, 'INFO');
    res.json({ verified: true });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
};

// Disable 2FA
exports.disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    let user;
    if (useMongoDB() && User) {
      user = await User.findById(req.userId);
    } else {
      user = await memoryStore.findUser({ _id: req.userId });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    // Verify password (if not OAuth user)
    if (!user.googleId && password) {
      const argon2 = require('argon2');
      let isValidPassword;
      if (useMongoDB() && user.verifyPassword) {
        isValidPassword = await user.verifyPassword(password);
      } else {
        isValidPassword = await argon2.verify(user.passwordHash, password);
      }
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Disable 2FA
    if (useMongoDB() && user.save) {
      user.twoFactorEnabled = false;
      user.twoFactorSecret = null;
      user.twoFactorBackupCodes = [];
      await user.save();
    } else {
      await memoryStore.updateUser(user._id, {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      });
    }

    await logSecurityEvent('2FA_DISABLED', req.userId, {}, 'INFO');

    res.json({
      message: '2FA disabled successfully',
      enabled: false,
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
};

// Get 2FA status
exports.get2FAStatus = async (req, res) => {
  try {
    let user;
    if (useMongoDB() && User) {
      user = await User.findById(req.userId).select('twoFactorEnabled');
    } else {
      user = await memoryStore.findUser({ _id: req.userId });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      enabled: user.twoFactorEnabled || false,
    });
  } catch (error) {
    console.error('Get 2FA status error:', error);
    res.status(500).json({ error: 'Failed to get 2FA status' });
  }
};

