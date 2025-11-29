import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const oauthAPI = {
  getGoogleAuthUrl: async () => {
    const response = await axios.get(`${API_URL}/oauth/url`);
    return response.data;
  },

  initiateGoogleAuth: () => {
    // Redirect to Google OAuth
    window.location.href = `${API_URL}/oauth/google`;
  },
};

