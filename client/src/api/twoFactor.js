import api from './auth';

export const twoFactorAPI = {
  getStatus: async () => {
    const response = await api.get('/2fa/status');
    return response.data;
  },

  setup: async () => {
    const response = await api.post('/2fa/setup');
    return response.data;
  },

  verifyAndEnable: async (token) => {
    const response = await api.post('/2fa/verify-enable', { token });
    return response.data;
  },

  verify: async (token, userId) => {
    const response = await api.post('/2fa/verify', { token, userId });
    return response.data;
  },

  disable: async (password) => {
    const response = await api.post('/2fa/disable', { password });
    return response.data;
  },
};

