import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No token found in localStorage for request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (token expired or invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.error || 'Authentication failed';
      console.error('❌ Authentication failed:', errorMessage);
      
      // Don't remove token for 2FA verification failures (user is still logged in)
      const is2FAEndpoint = error.config?.url?.includes('/2fa/verify');
      const is2FASetup = error.config?.url?.includes('/2fa/setup') || error.config?.url?.includes('/2fa/verify-enable');
      
      // Only remove token if it's actually invalid (not just 2FA code wrong)
      if (!is2FAEndpoint && !is2FASetup && errorMessage.includes('Invalid token')) {
        console.log('Token is invalid, removing...');
        if (window.location.pathname !== '/login') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Don't auto-redirect, let components handle it
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default api;

