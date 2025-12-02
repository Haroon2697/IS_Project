import React, { useState, useEffect } from 'react';
import { filesAPI } from '../../api/files';
import { decryptFile, downloadFile, formatFileSize } from '../../crypto/fileEncryption';
import messagingService from '../../services/messaging';
import './Files.css';

const FileList = ({ recipientId, sessionKey, currentUserId }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    loadFiles();
  }, [recipientId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await filesAPI.listFiles();
      
      // Filter files for this recipient
      const relevantFiles = response.files.filter(file => {
        const uploaderIdStr = file.uploaderId?.toString ? file.uploaderId.toString() : file.uploaderId;
        const recipientIdStr = file.recipientId?.toString ? file.recipientId.toString() : file.recipientId;
        const currentUserIdStr = currentUserId?.toString ? currentUserId.toString() : currentUserId;
        
        // Show files where current user is involved with this recipient
        return (
          (uploaderIdStr === currentUserIdStr && recipientIdStr === recipientId) ||
          (recipientIdStr === currentUserIdStr && uploaderIdStr === recipientId)
        );
      });
      
      setFiles(relevantFiles);
    } catch (err) {
      console.error('Failed to load files:', err);
      setError('Failed to load files: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file) => {
    if (!sessionKey) {
      setError('Secure connection not established');
      return;
    }

    const fileId = file.fileId;
    if (downloading.has(fileId)) {
      return; // Already downloading
    }

    setDownloading(prev => new Set(prev).add(fileId));
    setError('');

    try {
      console.log(`📥 Downloading file: ${file.fileName}`);
      
      // Get session key with the uploader (who encrypted the file)
      // If we're the uploader, we need key with recipient
      // If we're the recipient, we need key with uploader
      const uploaderIdStr = file.uploaderId?.toString ? file.uploaderId.toString() : file.uploaderId;
      const currentUserIdStr = currentUserId?.toString ? currentUserId.toString() : currentUserId;
      
      // Determine who we need the session key with
      const otherUserId = uploaderIdStr === currentUserIdStr ? recipientId : uploaderIdStr;
      const key = messagingService.getSessionKey(otherUserId);
      
      if (!key) {
        throw new Error('No session key established with file owner');
      }

      // Download encrypted file data
      const encryptedFileData = await filesAPI.downloadFile(fileId);
      
      // Decrypt and reassemble file
      console.log('🔓 Decrypting file...');
      const decryptedBlob = await decryptFile(encryptedFileData, key);
      
      // Download file
      downloadFile(decryptedBlob, encryptedFileData.fileName);
      
      console.log('✅ File downloaded successfully');
    } catch (err) {
      console.error('File download error:', err);
      setError('Failed to download file: ' + err.message);
    } finally {
      setDownloading(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await filesAPI.deleteFile(fileId);
      // Reload files list
      loadFiles();
    } catch (err) {
      console.error('File delete error:', err);
      setError('Failed to delete file: ' + err.message);
    }
  };

  if (loading) {
    return <div className="file-list-loading">Loading files...</div>;
  }

  if (files.length === 0) {
    return (
      <div className="file-list-empty">
        No files shared yet. Upload a file to get started.
      </div>
    );
  }

  return (
    <div className="file-list">
      <div className="file-list-header">
        <h4>Shared Files</h4>
        <button onClick={loadFiles} className="btn-refresh">Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="files-container">
        {files.map((file) => {
          const isUploader = file.isUploader;
          const isDownloading = downloading.has(file.fileId);
          
          return (
            <div key={file.fileId} className="file-item">
              <div className="file-item-info">
                <div className="file-item-name">
                  📎 {file.fileName}
                </div>
                <div className="file-item-meta">
                  <span>{formatFileSize(file.fileSize)}</span>
                  <span>•</span>
                  <span>{isUploader ? 'Sent' : 'Received'}</span>
                  <span>•</span>
                  <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="file-item-actions">
                <button
                  onClick={() => handleDownload(file)}
                  disabled={!sessionKey || isDownloading}
                  className="btn-download"
                >
                  {isDownloading ? 'Downloading...' : 'Download'}
                </button>
                {isUploader && (
                  <button
                    onClick={() => handleDelete(file.fileId)}
                    className="btn-delete"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileList;

