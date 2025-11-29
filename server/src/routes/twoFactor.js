const express = require('express');
const router = express.Router();
const twoFactorController = require('../controllers/twoFactorController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Get 2FA status
router.get('/status', twoFactorController.get2FAStatus);

// Setup 2FA (generate secret and QR code)
router.post('/setup', twoFactorController.setup2FA);

// Verify and enable 2FA
router.post('/verify-enable', twoFactorController.verifyAndEnable2FA);

// Verify 2FA code (for login)
router.post('/verify', twoFactorController.verify2FA);

// Disable 2FA
router.post('/disable', twoFactorController.disable2FA);

module.exports = router;

