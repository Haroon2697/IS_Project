/**
 * File Encryption/Decryption Module
 * Handles file chunking, encryption, and reassembly
 */

import { encryptMessage, decryptMessage } from './encryption';

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

/**
 * Chunk a file into smaller pieces
 * @param {File|Blob} file - File to chunk
 * @param {number} chunkSize - Size of each chunk in bytes
 * @returns {Promise<ArrayBuffer[]>} Array of chunk ArrayBuffers
 */
export async function chunkFile(file, chunkSize = CHUNK_SIZE) {
  const chunks = [];
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    const chunkBuffer = await chunk.arrayBuffer();
    chunks.push(chunkBuffer);
  }
  
  return chunks;
}

/**
 * Encrypt a single chunk
 * @param {ArrayBuffer} chunk - Chunk to encrypt
 * @param {CryptoKey} sessionKey - Session key for encryption
 * @param {number} chunkIndex - Index of chunk in file
 * @returns {Promise<Object>} Encrypted chunk with metadata
 */
export async function encryptChunk(chunk, sessionKey, chunkIndex) {
  try {
    // Encrypt chunk using same AES-256-GCM as messages
    const encrypted = await encryptMessage(sessionKey, chunk);
    
    return {
      chunkIndex,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
    };
  } catch (error) {
    console.error(`Error encrypting chunk ${chunkIndex}:`, error);
    throw new Error(`Failed to encrypt chunk ${chunkIndex}`);
  }
}

/**
 * Decrypt a single chunk
 * @param {Object} encryptedChunk - Encrypted chunk with metadata
 * @param {CryptoKey} sessionKey - Session key for decryption
 * @returns {Promise<ArrayBuffer>} Decrypted chunk
 */
export async function decryptChunk(encryptedChunk, sessionKey) {
  try {
    const { ciphertext, iv, authTag } = encryptedChunk;
    
    // Convert from base64
    const ciphertextArray = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const ivArray = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const authTagArray = Uint8Array.from(atob(authTag), c => c.charCodeAt(0));
    
    // Combine ciphertext and auth tag (GCM format)
    const encryptedData = new Uint8Array(ciphertextArray.length + authTagArray.length);
    encryptedData.set(ciphertextArray);
    encryptedData.set(authTagArray, ciphertextArray.length);
    
    // Decrypt directly to ArrayBuffer
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivArray,
        tagLength: 128,
      },
      sessionKey,
      encryptedData
    );
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting chunk:', error);
    throw new Error('Failed to decrypt chunk. Invalid key or corrupted data.');
  }
}

/**
 * Encrypt entire file
 * @param {File} file - File to encrypt
 * @param {CryptoKey} sessionKey - Session key for encryption
 * @returns {Promise<Object>} Encrypted file data with metadata
 */
export async function encryptFile(file, sessionKey) {
  try {
    console.log(`📁 Encrypting file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // Chunk the file
    const chunks = await chunkFile(file);
    console.log(`📦 File split into ${chunks.length} chunks`);
    
    // Encrypt each chunk
    const encryptedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`🔒 Encrypting chunk ${i + 1}/${chunks.length}...`);
      const encryptedChunk = await encryptChunk(chunks[i], sessionKey, i);
      encryptedChunks.push(encryptedChunk);
    }
    
    console.log(`✅ File encrypted successfully`);
    
    return {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      totalChunks: encryptedChunks.length,
      encryptedChunks,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('File encryption error:', error);
    throw new Error('Failed to encrypt file: ' + error.message);
  }
}

/**
 * Decrypt and reassemble file
 * @param {Object} encryptedFileData - Encrypted file data
 * @param {CryptoKey} sessionKey - Session key for decryption
 * @returns {Promise<Blob>} Decrypted file as Blob
 */
export async function decryptFile(encryptedFileData, sessionKey) {
  try {
    const { fileName, fileType, encryptedChunks } = encryptedFileData;
    console.log(`📁 Decrypting file: ${fileName} (${encryptedChunks.length} chunks)`);
    
    // Sort chunks by index to ensure correct order
    const sortedChunks = encryptedChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    
    // Decrypt each chunk
    const decryptedChunks = [];
    for (let i = 0; i < sortedChunks.length; i++) {
      console.log(`🔓 Decrypting chunk ${i + 1}/${sortedChunks.length}...`);
      const decryptedChunk = await decryptChunk(sortedChunks[i], sessionKey);
      decryptedChunks.push(decryptedChunk);
    }
    
    // Reassemble file
    const totalSize = decryptedChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const reassembled = new Uint8Array(totalSize);
    
    let offset = 0;
    for (const chunk of decryptedChunks) {
      reassembled.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }
    
    console.log(`✅ File decrypted and reassembled`);
    
    // Create Blob from reassembled data
    const blob = new Blob([reassembled], { type: fileType || 'application/octet-stream' });
    return blob;
  } catch (error) {
    console.error('File decryption error:', error);
    throw new Error('Failed to decrypt file: ' + error.message);
  }
}

/**
 * Download file as blob
 * @param {Blob} blob - File blob
 * @param {string} fileName - Name for downloaded file
 */
export function downloadFile(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

