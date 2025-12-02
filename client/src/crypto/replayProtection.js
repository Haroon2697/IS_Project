/**
 * Replay Attack Protection
 * Tracks nonces, timestamps, and sequence numbers
 */

import { storeData, retrieveData } from '../storage/indexedDB';

class ReplayProtection {
  constructor() {
    this.seenNonces = new Set();
    this.sequenceNumbers = new Map(); // userId -> lastSequenceNumber
    this.timestampWindow = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if message is valid (not a replay)
   */
  async checkMessage(nonce, timestamp, sequenceNumber, userId) {
    // Check timestamp (must be within window)
    const now = Date.now();
    const timeDiff = Math.abs(now - timestamp);
    if (timeDiff > this.timestampWindow) {
      throw new Error('Message timestamp out of window');
    }

    // Check nonce (must not be seen before)
    if (this.seenNonces.has(nonce)) {
      throw new Error('Replay attack detected - nonce already seen');
    }

    // Check in IndexedDB as well (gracefully handle missing store)
    try {
      const stored = await retrieveData('nonces', nonce);
      if (stored) {
        throw new Error('Replay attack detected - nonce found in storage');
      }
    } catch (e) {
      // Nonce not found is good, or store doesn't exist yet (first run)
      if (!e.message.includes('Replay attack')) {
        console.log('Nonce check skipped (store may not exist yet)');
      } else {
        throw e;
      }
    }

    // Check sequence number (must be increasing)
    const lastSequence = this.sequenceNumbers.get(userId) || 0;
    if (sequenceNumber <= lastSequence) {
      throw new Error('Invalid sequence number - possible replay or out-of-order message');
    }

    // All checks passed - mark as seen
    this.seenNonces.add(nonce);
    this.sequenceNumbers.set(userId, sequenceNumber);

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

