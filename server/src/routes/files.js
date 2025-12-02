const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const fileController = require('../controllers/fileController');

// All routes require authentication
router.use(verifyToken);

/**
 * POST /api/files/upload
 * Upload encrypted file
 */
router.post('/upload', fileController.uploadFile);

/**
 * GET /api/files/:fileId
 * Download file (get encrypted chunks)
 */
router.get('/:fileId', fileController.downloadFile);

/**
 * GET /api/files
 * List files user has access to
 */
router.get('/', fileController.listFiles);

/**
 * DELETE /api/files/:fileId
 * Delete file (only uploader)
 */
router.delete('/:fileId', fileController.deleteFile);

module.exports = router;

