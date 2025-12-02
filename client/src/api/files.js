/**
 * API calls for file-related operations
 */
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

export const filesAPI = {
  /**
   * Upload encrypted file
   * @param {Object} fileData - Encrypted file data
   * @returns {Promise<Object>} Upload response with fileId
   */
  uploadFile: async (fileData) => {
    const response = await axios.post(
      `${API_URL}/files/upload`,
      fileData,
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Download file (get encrypted chunks)
   * @param {string} fileId - File ID
   * @returns {Promise<Object>} File data with encrypted chunks
   */
  downloadFile: async (fileId) => {
    const response = await axios.get(
      `${API_URL}/files/${fileId}`,
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * List files user has access to
   * @returns {Promise<Object>} List of files
   */
  listFiles: async () => {
    const response = await axios.get(
      `${API_URL}/files`,
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Delete file
   * @param {string} fileId - File ID
   * @returns {Promise<Object>} Delete response
   */
  deleteFile: async (fileId) => {
    const response = await axios.delete(
      `${API_URL}/files/${fileId}`,
      getAuthHeaders()
    );
    return response.data;
  },
};

