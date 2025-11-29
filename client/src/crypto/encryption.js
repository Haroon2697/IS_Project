/**
 * Message Encryption/Decryption
 * AES-256-GCM implementation
 */

import { generateNonce } from './utils';

/**
 * Encrypt message using AES-256-GCM
 */
export async function encryptMessage(sessionKey, plaintext) {
  try {
    // Convert plaintext to ArrayBuffer
    const plaintextBuffer = typeof plaintext === 'string'
      ? new TextEncoder().encode(plaintext)
      : plaintext;
    
    // Generate random IV (12 bytes for GCM)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128, // 128-bit authentication tag
      },
      sessionKey,
      plaintextBuffer
    );
    
    // Extract ciphertext and auth tag
    // GCM appends the auth tag at the end
    const encryptedArray = new Uint8Array(encrypted);
    const authTagLength = 16; // 128 bits = 16 bytes
    const ciphertextLength = encryptedArray.length - authTagLength;
    
    const ciphertext = encryptedArray.slice(0, ciphertextLength);
    const authTag = encryptedArray.slice(ciphertextLength);
    
    // Convert to base64 for storage/transmission
    const ciphertextBase64 = btoa(String.fromCharCode(...ciphertext));
    const ivBase64 = btoa(String.fromCharCode(...iv));
    const authTagBase64 = btoa(String.fromCharCode(...authTag));
    
    return {
      ciphertext: ciphertextBase64,
      iv: ivBase64,
      authTag: authTagBase64,
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt message using AES-256-GCM
 */
export async function decryptMessage(sessionKey, ciphertext, iv, authTag) {
  try {
    // Convert from base64
    const ciphertextArray = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const ivArray = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const authTagArray = Uint8Array.from(atob(authTag), c => c.charCodeAt(0));
    
    // Combine ciphertext and auth tag (GCM format)
    const encryptedData = new Uint8Array(ciphertextArray.length + authTagArray.length);
    encryptedData.set(ciphertextArray);
    encryptedData.set(authTagArray, ciphertextArray.length);
    
    // Decrypt
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivArray,
        tagLength: 128,
      },
      sessionKey,
      encryptedData
    );
    
    // Convert to string
    const decryptedText = new TextDecoder().decode(decrypted);
    return decryptedText;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message. Invalid key or corrupted data.');
  }
}

/**
 * Encrypt message with metadata (for actual messaging)
 */
export async function encryptMessageWithMetadata(sessionKey, plaintext, sequenceNumber) {
  try {
    // Generate nonce for replay protection
    const nonce = generateNonce();
    const timestamp = Date.now();
    
    // Encrypt the message
    const encrypted = await encryptMessage(sessionKey, plaintext);
    
    return {
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      nonce,
      timestamp,
      sequenceNumber,
    };
  } catch (error) {
    console.error('Encrypt with metadata error:', error);
    throw error;
  }
}

/**
 * Decrypt message with metadata verification
 */
export async function decryptMessageWithMetadata(sessionKey, encryptedData) {
  try {
    // Verify timestamp (within 5 minutes)
    const now = Date.now();
    const messageTime = encryptedData.timestamp;
    const timeDiff = Math.abs(now - messageTime);
    if (timeDiff > 5 * 60 * 1000) {
      throw new Error('Message timestamp expired');
    }
    
    // Check for replay attack
    const { isNonceSeen } = await import('./keyExchange');
    if (await isNonceSeen(encryptedData.nonce)) {
      throw new Error('Replay attack detected - nonce already seen');
    }
    
    // Store nonce
    const { storeData } = await import('../storage/indexedDB');
    await storeData('nonces', {
      nonce: encryptedData.nonce,
      timestamp: encryptedData.timestamp,
      createdAt: new Date().toISOString(),
    });
    
    // Decrypt message
    const plaintext = await decryptMessage(
      sessionKey,
      encryptedData.ciphertext,
      encryptedData.iv,
      encryptedData.authTag
    );
    
    return {
      plaintext,
      sequenceNumber: encryptedData.sequenceNumber,
      timestamp: encryptedData.timestamp,
    };
  } catch (error) {
    console.error('Decrypt with metadata error:', error);
    throw error;
  }
}
