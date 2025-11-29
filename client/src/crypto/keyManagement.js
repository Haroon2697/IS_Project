/**
 * Key Management Module
 * Handles generation, storage, and retrieval of cryptographic keys
 * Uses Web Crypto API for all cryptographic operations
 */

// IndexedDB database name and version
const DB_NAME = 'SecureMessagingDB';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

/**
 * Initialize IndexedDB database
 */
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
        objectStore.createIndex('userId', 'userId', { unique: true });
      }
    };
  });
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
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true, // extractable
      ['deriveKey', 'deriveBits']
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
    const exported = await window.crypto.subtle.exportKey('jwk', publicKey);
    return exported;
  } catch (error) {
    console.error('Public key export error:', error);
    throw new Error('Failed to export public key');
  }
}

/**
 * Import public key from JWK format
 */
async function importPublicKey(jwk) {
  try {
    const publicKey = await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['verify']
    );
    return publicKey;
  } catch (error) {
    console.error('Public key import error:', error);
    throw new Error('Failed to import public key');
  }
}

/**
 * Import ECDH public key from JWK format
 */
async function importECDHPublicKey(jwk) {
  try {
    const publicKey = await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey', 'deriveBits']
    );
    return publicKey;
  } catch (error) {
    console.error('ECDH public key import error:', error);
    throw new Error('Failed to import ECDH public key');
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
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const keyData = {
      userId: userId,
      encryptedPrivateKey: encryptedKeyData.encryptedKey,
      iv: encryptedKeyData.iv,
      salt: encryptedKeyData.salt,
      createdAt: new Date().toISOString(),
    };

    await store.put(keyData);
    return true;
  } catch (error) {
    console.error('Store private key error:', error);
    throw new Error('Failed to store private key');
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

