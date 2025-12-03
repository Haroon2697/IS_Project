import React, { useState, useRef } from 'react';
import { encryptFile } from '../../crypto/fileEncryption';
import { filesAPI } from '../../api/files';
import messagingService from '../../services/messaging';
import { formatFileSize } from '../../crypto/fileEncryption';
import './Files.css';

const FileUpload = ({ recipientId, sessionKey, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 50MB for now)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setError(`File size exceeds limit of ${formatFileSize(maxSize)}`);
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !sessionKey || !recipientId) {
      setError('Please select a file and ensure secure connection is established');
      return;
    }

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      // Get session key from messaging service
      const key = messagingService.getSessionKey(recipientId);
      if (!key) {
        throw new Error('No session key established with recipient');
      }

      // Encrypt file
      console.log('🔒 Starting file encryption...');
      setProgress(10);
      const encryptedFileData = await encryptFile(selectedFile, key);
      setProgress(50);

      // Upload to server
      console.log('📤 Uploading encrypted file...');
      const uploadData = {
        fileName: encryptedFileData.fileName,
        fileType: encryptedFileData.fileType,
        fileSize: encryptedFileData.fileSize,
        recipientId: recipientId,
        encryptedChunks: encryptedFileData.encryptedChunks,
        totalChunks: encryptedFileData.totalChunks,
      };

      const response = await filesAPI.uploadFile(uploadData);
      setProgress(100);

      console.log('✅ File uploaded successfully:', response.fileId);

      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(response.fileId);
      }

      // Show success message briefly
      setTimeout(() => {
        setProgress(0);
      }, 2000);
    } catch (err) {
      console.error('File upload error:', err);
      setError('Failed to upload file: ' + err.message);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setError('');
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="file-upload">
      <h4>Share File</h4>
      
      {!sessionKey && (
        <div className="warning-message">
          Establish secure connection first before sharing files
        </div>
      )}

      <div className="file-input-container">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          disabled={uploading || !sessionKey}
          className="file-input"
        />
      </div>

      {selectedFile && (
        <div className="file-info">
          <div className="file-details">
            <span className="file-name">{selectedFile.name}</span>
            <span className="file-size">{formatFileSize(selectedFile.size)}</span>
          </div>
          
          {progress > 0 && (
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              <span className="progress-text">{progress}%</span>
            </div>
          )}

          <div className="file-actions">
            <button
              onClick={handleUpload}
              disabled={uploading || !sessionKey}
              className="btn-primary"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
            <button
              onClick={handleCancel}
              disabled={uploading}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default FileUpload;

