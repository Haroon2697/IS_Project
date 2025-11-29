/**
 * API calls for user-related operations
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

export const usersAPI = {
  /**
   * Get list of all users (excluding current user)
   */
  getUsersList: async () => {
    const response = await axios.get(`${API_URL}/users/list`, getAuthHeaders());
    return response.data;
  },

  /**
   * Get user's public key
   */
  getUserPublicKey: async (userId) => {
    const response = await axios.get(`${API_URL}/users/${userId}/publicKey`, getAuthHeaders());
    return response.data;
  },
};

