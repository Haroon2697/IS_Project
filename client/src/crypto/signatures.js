/**
 * Digital Signature Functions
 * ECDSA signature creation and verification
 */

/**
 * Create digital signature using ECDSA
 */
export async function createSignature(privateKey, data) {
  try {
    // Convert data to ArrayBuffer
    const dataBuffer = typeof data === 'string' 
      ? new TextEncoder().encode(data)
      : data;
    
    // Sign the data
    const signature = await window.crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      privateKey,
      dataBuffer
    );
    
    // Convert to base64 for transmission
    const signatureArray = new Uint8Array(signature);
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
    
    return signatureBase64;
  } catch (error) {
    console.error('Signature creation error:', error);
    throw new Error('Failed to create signature');
  }
}

/**
 * Verify digital signature using ECDSA
 */
export async function verifySignature(publicKey, data, signature) {
  try {
    // Convert data to ArrayBuffer
    const dataBuffer = typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data;
    
    // Convert signature from base64
    const signatureArray = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    
    // Verify signature
    const isValid = await window.crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      publicKey,
      signatureArray,
      dataBuffer
    );
    
    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

