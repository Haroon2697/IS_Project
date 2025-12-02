/**
 * Custom SHA-256 Implementation
 * Replaces Node.js built-in crypto module
 * 
 * This is a pure JavaScript implementation of SHA-256
 * Based on the SHA-256 specification (FIPS 180-4)
 */

// SHA-256 constants
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

// Right rotate function
function rightRotate(value, amount) {
  return (value >>> amount) | (value << (32 - amount));
}

// SHA-256 helper functions
function ch(x, y, z) {
  return (x & y) ^ (~x & z);
}

function maj(x, y, z) {
  return (x & y) ^ (x & z) ^ (y & z);
}

function sigma0(x) {
  return rightRotate(x, 2) ^ rightRotate(x, 13) ^ rightRotate(x, 22);
}

function sigma1(x) {
  return rightRotate(x, 6) ^ rightRotate(x, 11) ^ rightRotate(x, 25);
}

function gamma0(x) {
  return rightRotate(x, 7) ^ rightRotate(x, 18) ^ (x >>> 3);
}

function gamma1(x) {
  return rightRotate(x, 17) ^ rightRotate(x, 19) ^ (x >>> 10);
}

/**
 * Convert string to bytes
 */
function stringToBytes(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      bytes.push(charCode);
    } else if (charCode < 0x800) {
      bytes.push(0xc0 | (charCode >> 6));
      bytes.push(0x80 | (charCode & 0x3f));
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      bytes.push(0xe0 | (charCode >> 12));
      bytes.push(0x80 | ((charCode >> 6) & 0x3f));
      bytes.push(0x80 | (charCode & 0x3f));
    } else {
      // Surrogate pair
      i++;
      const charCode2 = str.charCodeAt(i);
      const codePoint = 0x10000 + (((charCode & 0x3ff) << 10) | (charCode2 & 0x3ff));
      bytes.push(0xf0 | (codePoint >> 18));
      bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
    }
  }
  return bytes;
}

/**
 * SHA-256 hash function
 * @param {string|Buffer} input - Input to hash
 * @returns {string} - Hexadecimal hash string
 */
function sha256(input) {
  // Convert input to bytes
  let bytes;
  if (typeof input === 'string') {
    bytes = stringToBytes(input);
  } else if (input instanceof Uint8Array || (input && typeof input.length === 'number')) {
    // Handle Uint8Array or array-like objects
    bytes = Array.from(input);
  } else {
    // Convert to string and then to bytes
    bytes = stringToBytes(String(input));
  }

  // Pre-processing
  const originalLength = bytes.length;
  const bitLength = originalLength * 8;

  // Append '1' bit
  bytes.push(0x80);

  // Append padding zeros
  while ((bytes.length % 64) !== 56) {
    bytes.push(0x00);
  }

  // Append original length (64-bit big-endian)
  const lengthBytes = [];
  let tempLength = bitLength;
  for (let i = 0; i < 8; i++) {
    lengthBytes.unshift(tempLength & 0xff);
    tempLength = tempLength >>> 8;
  }
  bytes = bytes.concat(lengthBytes);

  // Initialize hash values
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  // Process message in 512-bit chunks
  for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += 64) {
    const chunk = bytes.slice(chunkStart, chunkStart + 64);

    // Create message schedule
    const w = new Array(64);
    for (let i = 0; i < 16; i++) {
      w[i] = (chunk[i * 4] << 24) | (chunk[i * 4 + 1] << 16) | (chunk[i * 4 + 2] << 8) | chunk[i * 4 + 3];
    }

    for (let i = 16; i < 64; i++) {
      const s0 = gamma0(w[i - 15]);
      const s1 = gamma1(w[i - 2]);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    // Initialize working variables
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    // Main loop
    for (let i = 0; i < 64; i++) {
      const S1 = sigma1(e);
      const chResult = ch(e, f, g);
      const temp1 = (h + S1 + chResult + K[i] + w[i]) >>> 0;
      const S0 = sigma0(a);
      const majResult = maj(a, b, c);
      const temp2 = (S0 + majResult) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    // Add compressed chunk to hash
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  // Produce final hash value
  const hash = [h0, h1, h2, h3, h4, h5, h6, h7];
  return hash.map(h => h.toString(16).padStart(8, '0')).join('');
}

/**
 * Create hash object with update and digest methods (compatible with Node.js crypto API)
 */
function createHash(algorithm) {
  if (algorithm !== 'sha256') {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }

  let data = '';

  return {
    update(input) {
      if (typeof input === 'string') {
        data += input;
      } else if (input instanceof Uint8Array || (input && typeof input.length === 'number')) {
        // Convert array/bytes to string
        const bytes = Array.from(input);
        data += String.fromCharCode.apply(null, bytes);
      } else {
        data += String(input);
      }
      return this;
    },
    digest(encoding) {
      const hash = sha256(data);
      if (encoding === 'hex') {
        return hash;
      } else if (encoding === 'base64') {
        // Convert hex to base64 manually (without Buffer)
        const bytes = [];
        for (let i = 0; i < hash.length; i += 2) {
          bytes.push(parseInt(hash.substr(i, 2), 16));
        }
        // Base64 encoding without Buffer
        const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let base64 = '';
        for (let i = 0; i < bytes.length; i += 3) {
          const b1 = bytes[i] || 0;
          const b2 = bytes[i + 1] || 0;
          const b3 = bytes[i + 2] || 0;
          const bitmap = (b1 << 16) | (b2 << 8) | b3;
          base64 += base64Chars.charAt((bitmap >> 18) & 63);
          base64 += base64Chars.charAt((bitmap >> 12) & 63);
          base64 += i + 1 < bytes.length ? base64Chars.charAt((bitmap >> 6) & 63) : '=';
          base64 += i + 2 < bytes.length ? base64Chars.charAt(bitmap & 63) : '=';
        }
        return base64;
      } else {
        // Return as Uint8Array (instead of Buffer)
        const bytes = [];
        for (let i = 0; i < hash.length; i += 2) {
          bytes.push(parseInt(hash.substr(i, 2), 16));
        }
        return new Uint8Array(bytes);
      }
    }
  };
}

module.exports = {
  sha256,
  createHash
};

