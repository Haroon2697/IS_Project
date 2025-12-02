/**
 * In-Memory Storage for Testing Without MongoDB
 * This allows testing cryptographic features without database setup
 */

class MemoryStore {
  constructor() {
    this.users = new Map();
    this.userIndex = new Map(); // Track user IDs separately
    this.messages = new Map();
    this.files = new Map();
    this.logs = [];
  }

  // User operations
  async createUser(userData) {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const user = {
      _id: userId,
      ...userData,
      createdAt: new Date(),
      lastLogin: null,
    };
    // Store user by ID in main map
    this.users.set(userId, user);
    // Store in index for quick lookup
    this.userIndex.set(userId, user);
    // Also index by username and email for findUser
    this.users.set(userData.username, user);
    this.users.set(userData.email, user);
    return user;
  }

  async findUser(query) {
    if (query.username) {
      return this.users.get(query.username) || null;
    }
    if (query.email) {
      return this.users.get(query.email) || null;
    }
    if (query._id || query.id) {
      return this.users.get(query._id || query.id) || null;
    }
    // Try to find by any field
    for (const [key, user] of this.users.entries()) {
      if (typeof key === 'string' && key.startsWith('user_')) {
        let match = true;
        for (const [field, value] of Object.entries(query)) {
          if (user[field] !== value) {
            match = false;
            break;
          }
        }
        if (match) return user;
      }
    }
    return null;
  }

  async updateUser(userId, updates) {
    const user = this.userIndex.get(userId) || this.users.get(userId);
    if (user) {
      Object.assign(user, updates);
      // Update index
      this.userIndex.set(userId, user);
      return user;
    }
    return null;
  }

  // Get all users (for listing)
  getAllUsers() {
    return Array.from(this.userIndex.values());
  }

  // Message operations
  async saveMessage(messageData) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const message = {
      _id: messageId,
      ...messageData,
      createdAt: new Date(),
    };
    this.messages.set(messageId, message);
    return message;
  }

  async getMessages(query) {
    const results = [];
    for (const [id, message] of this.messages.entries()) {
      let match = true;
      for (const [field, value] of Object.entries(query)) {
        if (message[field] !== value) {
          match = false;
          break;
        }
      }
      if (match) results.push(message);
    }
    return results;
  }

  // Log operations
  async saveLog(logData) {
    this.logs.push({
      ...logData,
      _id: `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
    });
  }

  async getLogs(query) {
    return this.logs.filter(log => {
      for (const [field, value] of Object.entries(query)) {
        if (log[field] !== value) return false;
      }
      return true;
    });
  }

  // File operations
  async saveFile(fileData) {
    const fileId = fileData.fileId || `file_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const file = {
      _id: fileId,
      fileId,
      ...fileData,
      uploadedAt: new Date(),
      downloadedAt: null,
    };
    this.files.set(fileId, file);
    return file;
  }

  async getFile(fileId) {
    return this.files.get(fileId) || null;
  }

  async getFiles(query) {
    const results = [];
    for (const [id, file] of this.files.entries()) {
      let match = true;
      for (const [field, value] of Object.entries(query)) {
        if (file[field] !== value) {
          match = false;
          break;
        }
      }
      if (match) results.push(file);
    }
    return results;
  }

  async deleteFile(fileId) {
    return this.files.delete(fileId);
  }
}

// Singleton instance
const memoryStore = new MemoryStore();

module.exports = memoryStore;

