const mongoose = require('mongoose');
const { logSecurityEvent } = require('../utils/logger');
const memoryStore = require('../storage/memoryStore');

// Check if MongoDB is connected
const useMongoDB = () => mongoose.connection.readyState === 1;
let File = null;

try {
  File = require('../models/File');
} catch (e) {
  console.log('⚠️  File model not available - using memory store');
}

/**
 * Upload encrypted file
 */
exports.uploadFile = async (req, res) => {
  try {
    const { fileName, fileType, fileSize, recipientId, encryptedChunks, totalChunks } = req.body;
    const uploaderId = req.userId;

    // Validation
    if (!fileName || !recipientId || !encryptedChunks || !Array.isArray(encryptedChunks)) {
      return res.status(400).json({
        error: 'Missing required fields: fileName, recipientId, encryptedChunks',
      });
    }

    if (uploaderId === recipientId) {
      return res.status(400).json({
        error: 'Cannot send file to yourself',
      });
    }

    // Generate unique file ID
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const fileData = {
      fileId,
      fileName,
      fileType: fileType || 'application/octet-stream',
      fileSize: fileSize || 0,
      uploaderId,
      recipientId,
      totalChunks: totalChunks || encryptedChunks.length,
      encryptedChunks,
      uploadedAt: new Date(),
    };

    // Save file
    let file;
    if (useMongoDB() && File) {
      file = new File(fileData);
      await file.save();
    } else {
      file = await memoryStore.saveFile(fileData);
    }

    // Log file upload
    await logSecurityEvent(
      'FILE_UPLOADED',
      uploaderId,
      {
        fileId,
        fileName,
        fileSize,
        recipientId,
      },
      'INFO'
    );

    res.status(201).json({
      message: 'File uploaded successfully',
      fileId: file.fileId,
      file: {
        fileId: file.fileId,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        uploadedAt: file.uploadedAt,
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      error: 'Failed to upload file: ' + error.message,
    });
  }
};

/**
 * Download file (get encrypted chunks)
 */
exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId;

    // Get file
    let file;
    if (useMongoDB() && File) {
      file = await File.findOne({ fileId });
    } else {
      file = await memoryStore.getFile(fileId);
    }

    if (!file) {
      return res.status(404).json({
        error: 'File not found',
      });
    }

    // Verify access (only uploader or recipient can download)
    const uploaderIdStr = file.uploaderId?.toString ? file.uploaderId.toString() : file.uploaderId;
    const recipientIdStr = file.recipientId?.toString ? file.recipientId.toString() : file.recipientId;
    const userIdStr = userId?.toString ? userId.toString() : userId;

    if (uploaderIdStr !== userIdStr && recipientIdStr !== userIdStr) {
      await logSecurityEvent(
        'FILE_ACCESS_DENIED',
        userId,
        {
          fileId,
          attemptedAccess: true,
        },
        'WARNING'
      );
      return res.status(403).json({
        error: 'Access denied. You are not authorized to download this file.',
      });
    }

    // Update download timestamp
    if (useMongoDB() && File) {
      file.downloadedAt = new Date();
      await file.save();
    } else {
      file.downloadedAt = new Date();
      await memoryStore.saveFile(file);
    }

    // Log file download
    await logSecurityEvent(
      'FILE_DOWNLOADED',
      userId,
      {
        fileId,
        fileName: file.fileName,
      },
      'INFO'
    );

    // Note: Decryption happens on client side
    // If decryption fails, client should log FILE_DECRYPTION_FAILED event

    res.json({
      fileId: file.fileId,
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      totalChunks: file.totalChunks,
      encryptedChunks: file.encryptedChunks,
      uploadedAt: file.uploadedAt,
    });
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      error: 'Failed to download file: ' + error.message,
    });
  }
};

/**
 * List files user has access to
 */
exports.listFiles = async (req, res) => {
  try {
    const userId = req.userId;

    // Get files where user is uploader or recipient
    let files;
    if (useMongoDB() && File) {
      files = await File.find({
        $or: [
          { uploaderId: userId },
          { recipientId: userId },
        ],
      }).sort({ uploadedAt: -1 });
    } else {
      const allFiles = await memoryStore.getFiles({});
      files = allFiles.filter(file => {
        const uploaderIdStr = file.uploaderId?.toString ? file.uploaderId.toString() : file.uploaderId;
        const recipientIdStr = file.recipientId?.toString ? file.recipientId.toString() : file.recipientId;
        const userIdStr = userId?.toString ? userId.toString() : userId;
        return uploaderIdStr === userIdStr || recipientIdStr === userIdStr;
      });
    }

    // Return file metadata (without encrypted chunks)
    const fileList = files.map(file => ({
      fileId: file.fileId,
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      uploaderId: file.uploaderId,
      recipientId: file.recipientId,
      uploadedAt: file.uploadedAt,
      downloadedAt: file.downloadedAt,
      isUploader: file.uploaderId?.toString ? file.uploaderId.toString() === userId.toString() : file.uploaderId === userId,
    }));

    res.json({
      files: fileList,
      count: fileList.length,
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      error: 'Failed to list files: ' + error.message,
    });
  }
};

/**
 * Delete file (only uploader can delete)
 */
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId;

    // Get file
    let file;
    if (useMongoDB() && File) {
      file = await File.findOne({ fileId });
    } else {
      file = await memoryStore.getFile(fileId);
    }

    if (!file) {
      return res.status(404).json({
        error: 'File not found',
      });
    }

    // Verify uploader
    const uploaderIdStr = file.uploaderId?.toString ? file.uploaderId.toString() : file.uploaderId;
    const userIdStr = userId?.toString ? userId.toString() : userId;

    if (uploaderIdStr !== userIdStr) {
      return res.status(403).json({
        error: 'Only the uploader can delete this file',
      });
    }

    // Delete file
    if (useMongoDB() && File) {
      await File.deleteOne({ fileId });
    } else {
      await memoryStore.deleteFile(fileId);
    }

    // Log deletion
    await logSecurityEvent(
      'FILE_DELETED',
      userId,
      {
        fileId,
        fileName: file.fileName,
      },
      'INFO'
    );

    res.json({
      message: 'File deleted successfully',
      fileId,
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      error: 'Failed to delete file: ' + error.message,
    });
  }
};

