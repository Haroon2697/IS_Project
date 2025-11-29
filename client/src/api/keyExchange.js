import api from './auth';

export const keyExchangeAPI = {
  // Send key exchange init message
  sendInit: async (message) => {
    const response = await api.post('/keyexchange/init', message);
    return response.data;
  },

  // Send key exchange response
  sendResponse: async (message) => {
    const response = await api.post('/keyexchange/response', message);
    return response.data;
  },

  // Send key confirmation
  sendConfirm: async (message) => {
    const response = await api.post('/keyexchange/confirm', message);
    return response.data;
  },

  // Send key acknowledgment
  sendAck: async (message) => {
    const response = await api.post('/keyexchange/acknowledge', message);
    return response.data;
  },

  // Get user's public key
  getUserPublicKey: async (userId) => {
    const response = await api.get(`/users/${userId}/publicKey`);
    return response.data;
  },
};

