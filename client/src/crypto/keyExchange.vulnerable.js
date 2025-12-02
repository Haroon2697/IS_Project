/**
 * Key Exchange Protocol Implementation - VULNERABLE VERSION
 * ECDH-MA: Elliptic Curve Diffie-Hellman with Mutual Authentication
 * 
 * ⚠️ WARNING: This is a VULNERABLE version for MITM attack demonstration.
 * Signatures are DISABLED to show how MITM attacks work.
 * 
 * DO NOT USE THIS IN PRODUCTION!
 */

import { generateECDHKeyPair, importECDHPublicKey, exportPublicKey, importPublicKey } from './keyManagement';
import { deriveSessionKey } from './keyDerivation';
// VULNERABLE: Signatures are imported but NOT USED
// import { createSignature, verifySignature } from './signatures';
import { generateNonce } from './utils';

/**
 * Generate ephemeral ECDH key pair for key exchange
 */
export async function generateEphemeralKeyPair() {
  return await generateECDHKeyPair();
}

/**
 * Derive shared secret using ECDH
 */
export async function deriveSharedSecret(ownPrivateKey, peerPublicKey) {
  try {
    const sharedSecret = await window.crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: peerPublicKey,
      },
      ownPrivateKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false, // not extractable
      ['deriveKey']
    );

    return sharedSecret;
  } catch (error) {
    console.error('ECDH derive error:', error);
    throw new Error('Failed to derive shared secret');
  }
}

/**
 * Create key exchange initialization message
 * VULNERABLE: No signature created
 */
export async function createInitMessage(senderId, receiverId, longTermPrivateKey, longTermPublicKey) {
  try {
    // Generate ephemeral ECDH key pair
    const ephemeralKeyPair = await generateEphemeralKeyPair();
    
    // Generate nonce
    const nonce = generateNonce();
    
    // Get timestamp
    const timestamp = Date.now();
    
    // Export public keys
    const longTermPublicKeyJwk = await exportPublicKey(longTermPublicKey);
    const ephemeralPublicKeyJwk = await exportPublicKey(ephemeralKeyPair.publicKey);
    
    // VULNERABLE: Signature creation is COMMENTED OUT
    // This allows MITM attacker to modify the message without detection
    /*
    const messageData = {
      senderId,
      receiverId,
      longTermPublicKey: longTermPublicKeyJwk,
      ephemeralPublicKey: ephemeralPublicKeyJwk,
      nonce,
      timestamp,
    };
    
    const dataToSign = JSON.stringify(messageData);
    const signature = await createSignature(longTermPrivateKey, dataToSign);
    */
    
    return {
      type: 'KEY_EXCHANGE_INIT',
      senderId,
      receiverId,
      senderPublicKey: longTermPublicKeyJwk,
      senderECDHPublic: ephemeralPublicKeyJwk,
      nonce,
      timestamp,
      // VULNERABLE: No signature field - attacker can modify message
      signature: null, // Placeholder, but not verified
      // Store ephemeral private key temporarily
      _ephemeralPrivateKey: ephemeralKeyPair.privateKey,
    };
  } catch (error) {
    console.error('Create init message error:', error);
    throw new Error('Failed to create key exchange init message');
  }
}

/**
 * Verify and process key exchange init message
 * VULNERABLE: Signature verification is DISABLED
 */
export async function processInitMessage(message, receiverId, longTermPrivateKey, longTermPublicKey) {
  try {
    // Verify timestamp (within 5 minutes)
    const now = Date.now();
    const messageTime = message.timestamp;
    const timeDiff = Math.abs(now - messageTime);
    if (timeDiff > 5 * 60 * 1000) {
      throw new Error('Message timestamp expired');
    }
    
    // VULNERABLE: Signature verification is COMMENTED OUT
    // This allows MITM attacker to modify the message without detection
    /*
    const messageData = {
      senderId: message.senderId,
      receiverId: message.receiverId,
      longTermPublicKey: message.senderPublicKey,
      ephemeralPublicKey: message.senderECDHPublic,
      nonce: message.nonce,
      timestamp: message.timestamp,
    };
    
    const dataToVerify = JSON.stringify(messageData);
    const senderPublicKey = await importPublicKey(message.senderPublicKey);
    const isValid = await verifySignature(senderPublicKey, dataToVerify, message.signature);
    
    if (!isValid) {
      throw new Error('Invalid signature in init message');
    }
    */
    
    console.warn('⚠️ VULNERABLE MODE: Signature verification DISABLED');
    
    // Store nonce to prevent replay
    await storeNonce(message.nonce, message.timestamp);
    
    return {
      valid: true,
      senderId: message.senderId,
      senderEphemeralPublicKey: message.senderECDHPublic,
      nonce: message.nonce,
    };
  } catch (error) {
    console.error('Process init message error:', error);
    throw error;
  }
}

/**
 * Create key exchange response message
 * VULNERABLE: No signature created
 */
export async function createResponseMessage(
  initMessage,
  receiverId,
  longTermPrivateKey,
  longTermPublicKey
) {
  try {
    // Generate ephemeral ECDH key pair
    const ephemeralKeyPair = await generateEphemeralKeyPair();
    
    // Generate nonce
    const nonce = generateNonce();
    
    // Get timestamp
    const timestamp = Date.now();
    
    // Export public keys
    const longTermPublicKeyJwk = await exportPublicKey(longTermPublicKey);
    const ephemeralPublicKeyJwk = await exportPublicKey(ephemeralKeyPair.publicKey);
    
    // VULNERABLE: Signature creation is COMMENTED OUT
    /*
    const messageData = {
      senderId: receiverId,
      receiverId: initMessage.senderId,
      longTermPublicKey: longTermPublicKeyJwk,
      ephemeralPublicKey: ephemeralPublicKeyJwk,
      nonceAlice: initMessage.nonce,
      nonceBob: nonce,
      timestamp,
    };
    
    const dataToSign = JSON.stringify(messageData);
    const signature = await createSignature(longTermPrivateKey, dataToSign);
    */
    
    return {
      type: 'KEY_EXCHANGE_RESPONSE',
      senderId: receiverId,
      receiverId: initMessage.senderId,
      senderPublicKey: longTermPublicKeyJwk,
      senderECDHPublic: ephemeralPublicKeyJwk,
      nonceAlice: initMessage.nonce,
      nonceBob: nonce,
      timestamp,
      // VULNERABLE: No signature field
      signature: null,
      // Store ephemeral private key temporarily
      _ephemeralPrivateKey: ephemeralKeyPair.privateKey,
      _senderEphemeralPublicKey: initMessage.senderECDHPublic,
    };
  } catch (error) {
    console.error('Create response message error:', error);
    throw new Error('Failed to create key exchange response');
  }
}

/**
 * Process response message and derive session key
 * VULNERABLE: Signature verification is DISABLED
 */
export async function processResponseMessage(
  responseMessage,
  initMessage,
  ownEphemeralPrivateKey,
  longTermPrivateKey
) {
  try {
    // Verify timestamp
    const now = Date.now();
    const messageTime = responseMessage.timestamp;
    const timeDiff = Math.abs(now - messageTime);
    if (timeDiff > 5 * 60 * 1000) {
      throw new Error('Response message timestamp expired');
    }
    
    // Verify nonce echo
    if (responseMessage.nonceAlice !== initMessage.nonce) {
      throw new Error('Nonce mismatch in response');
    }
    
    // VULNERABLE: Signature verification is COMMENTED OUT
    /*
    const messageData = {
      senderId: responseMessage.senderId,
      receiverId: responseMessage.receiverId,
      longTermPublicKey: responseMessage.senderPublicKey,
      ephemeralPublicKey: responseMessage.senderECDHPublic,
      nonceAlice: responseMessage.nonceAlice,
      nonceBob: responseMessage.nonceBob,
      timestamp: responseMessage.timestamp,
    };
    
    const dataToVerify = JSON.stringify(messageData);
    const senderPublicKey = await importPublicKey(responseMessage.senderPublicKey);
    const isValid = await verifySignature(senderPublicKey, dataToVerify, responseMessage.signature);
    
    if (!isValid) {
      throw new Error('Invalid signature in response message');
    }
    */
    
    console.warn('⚠️ VULNERABLE MODE: Signature verification DISABLED');
    
    // Store nonce to prevent replay
    await storeNonce(responseMessage.nonceBob, responseMessage.timestamp);
    
    // Validate and import peer's ephemeral public key
    if (!responseMessage.senderECDHPublic) {
      console.error('Response message missing senderECDHPublic:', responseMessage);
      throw new Error('Response message missing ephemeral public key');
    }
    
    const peerEphemeralPublicKey = await importECDHPublicKey(responseMessage.senderECDHPublic);
    
    // Derive shared secret
    const sharedSecret = await deriveSharedSecret(ownEphemeralPrivateKey, peerEphemeralPublicKey);
    
    // Derive session key using HKDF
    const combinedNonces = initMessage.nonce + responseMessage.nonceBob;
    const sessionKey = await deriveSessionKey(
      sharedSecret,
      combinedNonces,
      initMessage.senderId,
      responseMessage.senderId
    );
    
    return {
      valid: true,
      sessionKey,
      nonceBob: responseMessage.nonceBob,
    };
  } catch (error) {
    console.error('Process response message error:', error);
    throw error;
  }
}

/**
 * Create key confirmation message
 */
export async function createConfirmationMessage(sessionKey, nonceToConfirm, senderId, receiverId) {
  try {
    const { encryptMessage } = await import('./encryption');
    
    const confirmText = `KEY_CONFIRMED_${nonceToConfirm}`;
    const encrypted = await encryptMessage(sessionKey, confirmText);
    
    return {
      type: 'KEY_CONFIRM',
      senderId,
      receiverId,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
    };
  } catch (error) {
    console.error('Create confirmation message error:', error);
    throw new Error('Failed to create confirmation message');
  }
}

/**
 * Verify key confirmation message
 */
export async function verifyConfirmationMessage(confirmMessage, sessionKey, expectedNonce) {
  try {
    const { decryptMessage } = await import('./encryption');
    
    const decrypted = await decryptMessage(
      sessionKey,
      confirmMessage.ciphertext,
      confirmMessage.iv,
      confirmMessage.authTag
    );
    
    const expectedText = `KEY_CONFIRMED_${expectedNonce}`;
    if (decrypted !== expectedText) {
      throw new Error('Key confirmation failed - incorrect nonce');
    }
    
    return true;
  } catch (error) {
    console.error('Verify confirmation error:', error);
    throw new Error('Key confirmation verification failed');
  }
}

/**
 * Create key acknowledgment message
 */
export async function createAcknowledgmentMessage(sessionKey, nonceToAck, senderId, receiverId) {
  try {
    const { encryptMessage } = await import('./encryption');
    
    const ackText = `KEY_ACKNOWLEDGED_${nonceToAck}`;
    const encrypted = await encryptMessage(sessionKey, ackText);
    
    return {
      type: 'KEY_ACK',
      senderId,
      receiverId,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
    };
  } catch (error) {
    console.error('Create acknowledgment error:', error);
    throw new Error('Failed to create acknowledgment message');
  }
}

/**
 * Store nonce to prevent replay attacks
 */
async function storeNonce(nonce, timestamp) {
  try {
    const { storeData } = await import('../storage/indexedDB');
    await storeData('nonces', {
      nonce,
      timestamp,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Store nonce error:', error);
  }
}

/**
 * Check if nonce has been seen before
 */
export async function isNonceSeen(nonce) {
  try {
    const { retrieveData } = await import('../storage/indexedDB');
    const result = await retrieveData('nonces', nonce);
    return !!result;
  } catch (error) {
    return false;
  }
}

