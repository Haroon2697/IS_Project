/**
 * Replay Attack Protection
 * Tracks nonces, timestamps, and sequence numbers
 */

import { storeData, retrieveData } from '../storage/indexedDB';

class ReplayProtection {
  constructor() {
    this.seenNonces = new Set();
    this.sequenceNumbers = new Map(); // oderId -> lastSequenceNumber
    this.timestampWindow = 5 * 60 * 1000; // 5 minutes
    this.processedMessages = new Set(); // Track processed message IDs
  }

  /**
   * Check if message is valid (not a replay)
   * For key exchange messages, we use relaxed sequence checking
   */
  async checkMessage(nonce, timestamp, sequenceNumber, userId, options = {}) {
    const { skipSequenceCheck = false } = options;
    
    // Check timestamp (must be within window)
    const now = Date.now();
    const timeDiff = Math.abs(now - timestamp);
    if (timeDiff > this.timestampWindow) {
      throw new Error('Message timestamp out of window');
    }

    // Check nonce (must not be seen before)
    if (this.seenNonces.has(nonce)) {
      // For duplicate messages (same nonce), just skip silently
      console.log('⚠️ Duplicate message detected (same nonce) - skipping');
      return false; // Return false instead of throwing - caller should skip this message
    }

    // Check in IndexedDB as well (gracefully handle missing store)
    try {
      const stored = await retrieveData('nonces', nonce);
      if (stored) {
        console.log('⚠️ Duplicate message detected (nonce in storage) - skipping');
        return false;
      }
    } catch (e) {
      // Nonce not found is good, or store doesn't exist yet (first run)
      if (e.message && e.message.includes('Replay attack')) {
        return false;
      }
      // Otherwise continue - store may not exist yet
    }

    // Check sequence number (must be increasing) - skip for key exchange
    if (!skipSequenceCheck) {
      const lastSequence = this.sequenceNumbers.get(userId) || 0;
      if (sequenceNumber <= lastSequence) {
        console.log(`⚠️ Out-of-order message (seq ${sequenceNumber} <= ${lastSequence}) - skipping`);
        return false;
      }
      this.sequenceNumbers.set(userId, sequenceNumber);
    }

    // All checks passed - mark as seen
    this.seenNonces.add(nonce);

    // Store nonce in IndexedDB (gracefully handle errors)
    try {
      await storeData('nonces', {
        nonce,
        timestamp,
        sequenceNumber,
        userId,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to store nonce in IndexedDB:', e.message);
      // Continue anyway - in-memory check is still active
    }

    return true;
  }

  /**
   * Get next sequence number for a user
   */
  getNextSequenceNumber(userId) {
    const current = this.sequenceNumbers.get(userId) || 0;
    const next = current + 1;
    this.sequenceNumbers.set(userId, next);
    return next;
  }

  /**
   * Clean up old nonces (older than timestamp window)
   */
  async cleanupOldNonces() {
    const now = Date.now();
    const cutoff = now - this.timestampWindow * 2; // Keep 2x window for safety

    // Clean in-memory set (keep recent ones)
    // In production, implement proper cleanup for IndexedDB
  }
}

// Singleton instance
const replayProtection = new ReplayProtection();

export default replayProtection;

