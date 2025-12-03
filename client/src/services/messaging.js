/**
 * Messaging Service
 * Handles encrypted message sending and receiving
 */

import { encryptMessageWithMetadata, decryptMessageWithMetadata } from '../crypto/encryption';
import replayProtection from '../crypto/replayProtection';

class MessagingService {
  constructor() {
    this.sessionKeys = new Map(); // userId -> sessionKey
    this.messageQueue = [];
  }

  /**
   * Store session key for a user
   */
  setSessionKey(userId, sessionKey) {
    console.log('🔑 Storing session key for user:', userId);
    this.sessionKeys.set(userId, sessionKey);
    console.log('🔑 Session keys map now has', this.sessionKeys.size, 'entries:', Array.from(this.sessionKeys.keys()));
  }

  /**
   * Get session key for a user
   */
  getSessionKey(userId) {
    const key = this.sessionKeys.get(userId);
    console.log('🔑 Getting session key for user:', userId, key ? '✅ Found' : '❌ Not found');
    if (!key) {
      console.log('🔑 Available keys for:', Array.from(this.sessionKeys.keys()));
    }
    return key;
  }

  /**
   * Encrypt and prepare message for sending
   */
  async encryptMessage(userId, plaintext) {
    const sessionKey = this.getSessionKey(userId);
    
    if (!sessionKey) {
      throw new Error('No session key established with this user');
    }

    // Get next sequence number
    const sequenceNumber = replayProtection.getNextSequenceNumber(userId);

    // Encrypt with metadata
    const encrypted = await encryptMessageWithMetadata(
      sessionKey,
      plaintext,
      sequenceNumber
    );

    return {
      ...encrypted,
      senderId: JSON.parse(localStorage.getItem('user')).id,
      receiverId: userId,
    };
  }

  /**
   * Decrypt and verify received message
   */
  async decryptMessage(encryptedData) {
    const sessionKey = this.getSessionKey(encryptedData.senderId);
    
    if (!sessionKey) {
      throw new Error('No session key established with sender');
    }

    // Verify replay protection - returns false for duplicates
    const isValid = await replayProtection.checkMessage(
      encryptedData.nonce,
      encryptedData.timestamp,
      encryptedData.sequenceNumber,
      encryptedData.senderId
    );

    if (!isValid) {
      // Duplicate message - return null to indicate skip
      return null;
    }

    // Decrypt
    const decrypted = await decryptMessageWithMetadata(sessionKey, encryptedData);

    return decrypted.plaintext;
  }
}

// Singleton instance
const messagingService = new MessagingService();

export default messagingService;

