/**
 * IndexedDB Storage Utility
 * Wrapper for IndexedDB operations
 */

const DB_NAME = 'SecureMessagingDB';
const DB_VERSION = 2; // Incremented to trigger upgrade

/**
 * Initialize database and create object stores
 */
export async function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Keys store
      if (!db.objectStoreNames.contains('keys')) {
        const keysStore = db.createObjectStore('keys', { keyPath: 'userId' });
        keysStore.createIndex('userId', 'userId', { unique: true });
      }

      // Session keys store
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionsStore = db.createObjectStore('sessions', { keyPath: 'sessionId' });
        sessionsStore.createIndex('recipientId', 'recipientId', { unique: false });
      }

      // Nonces store (for replay protection)
      if (!db.objectStoreNames.contains('nonces')) {
        const noncesStore = db.createObjectStore('nonces', { keyPath: 'nonce' });
        noncesStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Messages store (for message history - encrypted)
      if (!db.objectStoreNames.contains('messages')) {
        const messagesStore = db.createObjectStore('messages', { keyPath: 'messageId', autoIncrement: true });
        messagesStore.createIndex('recipientId', 'recipientId', { unique: false });
        messagesStore.createIndex('senderId', 'senderId', { unique: false });
        messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Generic store operation
 */
export async function storeData(storeName, data) {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    await store.put(data);
    return true;
  } catch (error) {
    console.error(`Store data error (${storeName}):`, error);
    throw error;
  }
}

/**
 * Generic retrieve operation
 */
export async function retrieveData(storeName, key) {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Retrieve data error (${storeName}):`, error);
    throw error;
  }
}

/**
 * Generic delete operation
 */
export async function deleteData(storeName, key) {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    await store.delete(key);
    return true;
  } catch (error) {
    console.error(`Delete data error (${storeName}):`, error);
    throw error;
  }
}

/**
 * Clear all data from a store
 */
export async function clearStore(storeName) {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    await store.clear();
    return true;
  } catch (error) {
    console.error(`Clear store error (${storeName}):`, error);
    throw error;
  }
}

