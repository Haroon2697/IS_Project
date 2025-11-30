/**
 * Socket.io Service
 * Handles WebSocket connections for real-time messaging
 */
import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
    this.messageCallbacks = [];
    this.keyExchangeCallbacks = [];
  }

  /**
   * Connect to Socket.io server
   */
  connect(token) {
    if (this.socket && this.connected) {
      console.log('Socket already connected');
      return;
    }

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    this.socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.connected = true;
      
      // Authenticate with token
      if (token) {
        this.socket.emit('authenticate', token);
      }
    });

    this.socket.on('authenticated', (data) => {
      console.log('✅ Socket authenticated:', data);
      this.authenticated = true;
    });

    this.socket.on('auth_error', (error) => {
      console.error('❌ Authentication error:', error);
      this.authenticated = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.connected = false;
      this.authenticated = false;
      
      // Auto-reconnect if it was an unexpected disconnect
      if (reason === 'io server disconnect') {
        // Server disconnected, don't reconnect automatically
        console.log('Server disconnected the socket');
      } else {
        // Client disconnected or network issue, will auto-reconnect
        console.log('Will attempt to reconnect...');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connected = false;
    });

    // Set up message listeners
    this.socket.on('message:receive', (encryptedMessage) => {
      console.log('📨 Message received via Socket.io');
      this.messageCallbacks.forEach(callback => {
        try {
          callback(encryptedMessage);
        } catch (error) {
          console.error('Error in message callback:', error);
        }
      });
    });

    this.socket.on('message:sent', (data) => {
      console.log('✅ Message sent confirmation:', data);
    });

    // Set up key exchange listeners
    this.socket.on('keyexchange:receive', (message) => {
      console.log('🔑 Key exchange message received via Socket.io');
      this.keyExchangeCallbacks.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in key exchange callback:', error);
        }
      });
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Disconnect from Socket.io server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.authenticated = false;
      this.messageCallbacks = [];
      this.keyExchangeCallbacks = [];
    }
  }

  /**
   * Send encrypted message
   */
  sendMessage(encryptedMessage) {
    if (this.socket && this.connected && this.authenticated) {
      this.socket.emit('message:send', encryptedMessage);
      return true;
    } else {
      console.error('Socket not connected or authenticated');
      return false;
    }
  }

  /**
   * Send key exchange message
   */
  sendKeyExchangeMessage(message) {
    if (this.socket && this.connected && this.authenticated) {
      this.socket.emit('keyexchange:send', message);
      return true;
    } else {
      console.error('Socket not connected or authenticated');
      return false;
    }
  }

  /**
   * Register callback for incoming messages
   */
  onMessage(callback) {
    if (typeof callback === 'function') {
      this.messageCallbacks.push(callback);
    }
  }

  /**
   * Unregister message callback
   */
  offMessage(callback) {
    this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Register callback for key exchange messages
   */
  onKeyExchange(callback) {
    if (typeof callback === 'function') {
      this.keyExchangeCallbacks.push(callback);
    }
  }

  /**
   * Unregister key exchange callback
   */
  offKeyExchange(callback) {
    this.keyExchangeCallbacks = this.keyExchangeCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Check if socket is connected and authenticated
   */
  isReady() {
    return this.connected && this.authenticated;
  }
}

// Singleton instance
const socketService = new SocketService();

export default socketService;

