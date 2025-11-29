const User = require('../models/User');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { logSecurityEvent } = require('../utils/logger');

// Generate 2FA secret and QR code
exports.setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

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

    // Store secret temporarily (user needs to verify before enabling)
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
    user.twoFactorBackupCodes = backupCodes.map(code => 
      require('crypto').createHash('sha256').update(code).digest('hex')
    );
    await user.save();

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

    const user = await User.findById(req.userId);

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
    user.twoFactorEnabled = true;
    await user.save();

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

    const user = await User.findById(userId);

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
        user.twoFactorBackupCodes.splice(backupCodeIndex, 1);
        await user.save();
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
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    // Verify password (if not OAuth user)
    if (!user.googleId && password) {
      const isValidPassword = await user.verifyPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorBackupCodes = [];
    await user.save();

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
    const user = await User.findById(req.userId).select('twoFactorEnabled');

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

