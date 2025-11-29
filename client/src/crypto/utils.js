/**
 * Cryptographic Utility Functions
 */

/**
 * Generate cryptographically random nonce
 */
export function generateNonce(length = 32) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  
  // Convert to base64 for easy transmission
  return btoa(String.fromCharCode(...array));
}

/**
 * Generate random IV for encryption
 */
export function generateIV(length = 12) {
  const iv = new Uint8Array(length);
  window.crypto.getRandomValues(iv);
  return iv;
}

/**
 * Convert ArrayBuffer to base64
 */
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Convert base64 to ArrayBuffer
 */
export function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Hash data using SHA-256
 */
export async function hashData(data) {
  try {
    const dataBuffer = typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data;
    
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    return arrayBufferToBase64(hashBuffer);
  } catch (error) {
    console.error('Hash error:', error);
    throw new Error('Failed to hash data');
  }
}

