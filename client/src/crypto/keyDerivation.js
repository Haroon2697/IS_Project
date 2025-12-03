/**
 * Key Derivation Functions
 * HKDF (HMAC-based Key Derivation Function) implementation
 */

/**
 * Derive session key using HKDF
 */
export async function deriveSessionKey(sharedSecret, salt, senderId, receiverId) {
  try {
    // Create info parameter (context information)
    const infoString = `session-key-v1-${senderId}-${receiverId}`;
    const info = new TextEncoder().encode(infoString);
    
    // Convert salt to Uint8Array if it's a string
    let saltArray;
    if (typeof salt === 'string') {
      saltArray = new TextEncoder().encode(salt);
    } else {
      saltArray = salt;
    }
    
    console.log('🔐 Deriving session key with:');
    console.log('   Salt (first 20 chars):', typeof salt === 'string' ? salt.substring(0, 20) : 'binary');
    console.log('   Info:', infoString);
    
    // Derive key using HKDF
    const sessionKey = await window.crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: saltArray,
        info: info,
      },
      sharedSecret,
      {
        name: 'AES-GCM',
        length: 256, // 256 bits = 32 bytes
      },
      false, // not extractable
      ['encrypt', 'decrypt']
    );
    
    console.log('✅ Session key derived successfully');
    return sessionKey;
  } catch (error) {
    console.error('Session key derivation error:', error);
    throw new Error('Failed to derive session key');
  }
}

/**
 * Derive key from password using PBKDF2 (for private key encryption)
 */
export async function deriveKeyFromPassword(password, salt, iterations = 100000) {
  try {
    // Import password as key material
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    // Derive key
    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );
    
    return derivedKey;
  } catch (error) {
    console.error('Key derivation error:', error);
    throw new Error('Failed to derive key from password');
  }
}

