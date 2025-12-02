/**
 * Key Management Module
 * Handles generation, storage, and retrieval of cryptographic keys
 * Uses Web Crypto API for all cryptographic operations
 */

import { initDatabase } from '../storage/indexedDB';

const STORE_NAME = 'keys';

/**
 * Initialize IndexedDB database (uses shared initialization)
 */
async function initDB() {
  return await initDatabase();
}

/**
 * Generate ECC key pair for signing and key exchange
 * Uses P-256 curve (NIST approved)
 */
async function generateKeyPair() {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true, // extractable (needed to export and store)
      ['sign', 'verify']
    );

    return keyPair;
  } catch (error) {
    console.error('Key generation error:', error);
    throw new Error('Failed to generate key pair');
  }
}

/**
 * Generate ECDH key pair for key exchange
 * Uses P-256 curve
 */
async function generateECDHKeyPair() {
  try {
    // Generate with both usages - this is what deriveSharedSecret expects
    // This ensures compatibility throughout the key exchange process
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true, // extractable
      ['deriveKey', 'deriveBits'] // Both usages for full compatibility
    );

    return keyPair;
  } catch (error) {
    console.error('ECDH key generation error:', error);
    throw new Error('Failed to generate ECDH key pair');
  }
}

/**
 * Export public key to JWK format
 */
async function exportPublicKey(publicKey) {
  try {
    if (!publicKey) {
      throw new Error('Public key is null or undefined');
    }
    
    // Check if it's a valid CryptoKey object
    if (!(publicKey instanceof CryptoKey)) {
      throw new Error('Public key is not a valid CryptoKey object');
    }
    
    const exported = await window.crypto.subtle.exportKey('jwk', publicKey);
    
    // Create a completely minimal JWK with ONLY required fields
    // Remove ALL optional properties (key_ops, ext, use, alg, etc.)
    // This ensures maximum compatibility when importing
    const minimalJwk = Object.create(null);
    minimalJwk.kty = exported.kty;
    minimalJwk.crv = exported.crv;
    minimalJwk.x = exported.x;
    minimalJwk.y = exported.y;
    
    // Only include 'd' if it's a private key (shouldn't happen for public keys, but safety check)
    if (exported.d) {
      minimalJwk.d = exported.d;
    }
    
    return minimalJwk;
  } catch (error) {
    console.error('Public key export error:', error);
    console.error('Public key type:', typeof publicKey);
    console.error('Public key:', publicKey);
    throw new Error('Failed to export public key: ' + error.message);
  }
}

/**
 * Import public key from JWK format
 */
async function importPublicKey(jwk) {
  try {
    // Create a minimal JWK with only required fields
    const cleanJwk = {
      kty: jwk.kty,
      crv: jwk.crv,
      x: jwk.x,
      y: jwk.y,
    };
    
    const publicKey = await window.crypto.subtle.importKey(
      'jwk',
      cleanJwk,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true, // extractable
      ['verify'] // key usages
    );
    return publicKey;
  } catch (error) {
    console.error('Public key import error:', error);
    throw new Error('Failed to import public key');
  }
}

/**
 * Import ECDH public key from JWK format
 * NOTE: ECDH public keys must have EMPTY usages array - only private keys can have deriveKey/deriveBits
 */
async function importECDHPublicKey(jwk) {
  try {
    // Validate input
    if (!jwk) {
      throw new Error('ECDH public key JWK is null or undefined');
    }
    
    if (typeof jwk !== 'object') {
      throw new Error('ECDH public key must be a JWK object');
    }
    
    // Validate required JWK fields
    if (!jwk.kty || jwk.kty !== 'EC') {
      throw new Error('Invalid JWK: kty must be "EC"');
    }
    
    if (!jwk.crv || jwk.crv !== 'P-256') {
      throw new Error('Invalid JWK: crv must be "P-256"');
    }
    
    if (!jwk.x || !jwk.y) {
      throw new Error('Invalid JWK: missing x or y coordinates');
    }
    
    // Create a clean JWK with only required fields
    const cleanJwk = {
      kty: String(jwk.kty),
      crv: String(jwk.crv),
      x: String(jwk.x),
      y: String(jwk.y),
    };
    
    console.log('Importing ECDH public key:', { kty: cleanJwk.kty, crv: cleanJwk.crv });
    
    // IMPORTANT: ECDH public keys must have EMPTY usages array
    // Only private keys can have deriveKey/deriveBits usages
    const publicKey = await window.crypto.subtle.importKey(
      'jwk',
      cleanJwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true, // extractable
      []    // EMPTY usages for public key - this is required!
    );
    
    console.log('✅ ECDH public key imported successfully');
    return publicKey;
  } catch (error) {
    console.error('ECDH public key import error:', error);
    console.error('JWK received:', jwk);
    throw new Error('Failed to import ECDH public key: ' + error.message);
  }
}

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKeyFromPassword(password, salt) {
  try {
    // Import password as key material
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive key using PBKDF2
    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000, // High iteration count for security
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false, // not extractable
      ['encrypt', 'decrypt']
    );

    return { derivedKey, salt };
  } catch (error) {
    console.error('Key derivation error:', error);
    throw new Error('Failed to derive key from password');
  }
}

/**
 * Encrypt private key with password-derived key
 */
async function encryptPrivateKey(privateKey, password) {
  try {
    // Generate random salt
    const salt = window.crypto.getRandomValues(new Uint8Array(16));

    // Derive encryption key from password
    const { derivedKey } = await deriveKeyFromPassword(password, salt);

    // Export private key to JWK
    const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', privateKey);

    // Convert JWK to string
    const privateKeyString = JSON.stringify(privateKeyJwk);

    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM

    // Encrypt private key
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      derivedKey,
      new TextEncoder().encode(privateKeyString)
    );

    // Convert to base64 for storage
    const encryptedArray = new Uint8Array(encrypted);
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
    const ivBase64 = btoa(String.fromCharCode(...iv));
    const saltBase64 = btoa(String.fromCharCode(...salt));

    return {
      encryptedKey: encryptedBase64,
      iv: ivBase64,
      salt: saltBase64,
    };
  } catch (error) {
    console.error('Private key encryption error:', error);
    throw new Error('Failed to encrypt private key');
  }
}

/**
 * Decrypt private key with password
 */
async function decryptPrivateKey(encryptedData, password) {
  try {
    const { encryptedKey, iv, salt } = encryptedData;

    // Convert from base64
    const encryptedArray = Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0));
    const ivArray = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const saltArray = Uint8Array.from(atob(salt), c => c.charCodeAt(0));

    // Derive key from password
    const { derivedKey } = await deriveKeyFromPassword(password, saltArray);

    // Decrypt
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivArray,
      },
      derivedKey,
      encryptedArray
    );

    // Convert to JWK
    const privateKeyString = new TextDecoder().decode(decrypted);
    const privateKeyJwk = JSON.parse(privateKeyString);

    // Import as CryptoKey
    const privateKey = await window.crypto.subtle.importKey(
      'jwk',
      privateKeyJwk,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign']
    );

    return privateKey;
  } catch (error) {
    console.error('Private key decryption error:', error);
    throw new Error('Failed to decrypt private key. Wrong password?');
  }
}

/**
 * Store encrypted private key in IndexedDB
 */
async function storePrivateKey(userId, encryptedKeyData) {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const keyData = {
        userId: userId,
        encryptedPrivateKey: encryptedKeyData.encryptedKey,
        iv: encryptedKeyData.iv,
        salt: encryptedKeyData.salt,
        createdAt: new Date().toISOString(),
      };

      const request = store.put(keyData);
      
      request.onsuccess = () => {
        console.log('✅ Private key stored for user:', userId);
        resolve(true);
      };
      
      request.onerror = () => {
        console.error('Store request error:', request.error);
        reject(request.error);
      };
      
      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('Store private key error:', error);
    throw new Error('Failed to store private key: ' + error.message);
  }
}

/**
 * Retrieve encrypted private key from IndexedDB
 */
async function retrieveEncryptedPrivateKey(userId) {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(userId);

      request.onsuccess = () => {
        if (request.result) {
          resolve({
            encryptedKey: request.result.encryptedPrivateKey,
            iv: request.result.iv,
            salt: request.result.salt,
          });
        } else {
          reject(new Error('Private key not found'));
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Retrieve private key error:', error);
    throw new Error('Failed to retrieve private key');
  }
}

/**
 * Retrieve and decrypt private key
 */
async function retrievePrivateKey(userId, password) {
  try {
    const encryptedData = await retrieveEncryptedPrivateKey(userId);
    const privateKey = await decryptPrivateKey(encryptedData, password);
    return privateKey;
  } catch (error) {
    console.error('Retrieve and decrypt error:', error);
    throw error;
  }
}

/**
 * Check if user has keys stored
 */
async function hasKeys(userId) {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.get(userId);
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => resolve(false);
    });
  } catch (error) {
    return false;
  }
}

/**
 * Generate and store keys for a new user
 * This is called during registration
 */
async function generateAndStoreKeys(userId, password) {
  try {
    // Generate key pair
    const keyPair = await generateKeyPair();

    // Export public key
    const publicKeyJwk = await exportPublicKey(keyPair.publicKey);

    // Encrypt private key
    const encryptedKeyData = await encryptPrivateKey(keyPair.privateKey, password);

    // Store encrypted private key
    await storePrivateKey(userId, encryptedKeyData);

    return {
      publicKey: publicKeyJwk,
      success: true,
    };
  } catch (error) {
    console.error('Generate and store keys error:', error);
    throw error;
  }
}

export {
  generateKeyPair,
  generateECDHKeyPair,
  exportPublicKey,
  importPublicKey,
  importECDHPublicKey,
  encryptPrivateKey,
  decryptPrivateKey,
  storePrivateKey,
  retrievePrivateKey,
  retrieveEncryptedPrivateKey,
  hasKeys,
  generateAndStoreKeys,
  initDB,
};

