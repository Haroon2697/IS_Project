# Built-in Libraries Usage Report

This document lists all built-in libraries/APIs used in the project and their status.

## ❌ REPLACED (No longer using built-in libraries)

### 1. Node.js `crypto` module
- **Location:** `server/src/controllers/twoFactorController.js`
- **Usage:** SHA-256 hashing for backup codes
- **Status:** ✅ **REPLACED** with custom implementation
- **Replacement:** `server/src/utils/sha256.js` - Custom SHA-256 implementation
- **Files Modified:**
  - `server/src/controllers/twoFactorController.js` - Now uses `createHash` from `sha256.js`

---

## ⚠️ REQUIRED (Cannot be replaced - Core functionality)

### 1. Node.js `http` module
- **Location:** `server/server.js`
- **Usage:** Creating HTTP server for Express and Socket.io
- **Status:** ⚠️ **REQUIRED** - Cannot be replaced
- **Reason:** 
  - Socket.io requires an HTTP server instance
  - Express can listen directly, but Socket.io needs `http.createServer()`
  - This is a core Node.js runtime module, not a third-party library
- **Alternative Considered:** Express's `app.listen()` doesn't work with Socket.io

### 2. Browser `window.crypto` (Web Crypto API)
- **Location:** All files in `client/src/crypto/`
- **Usage:** All cryptographic operations (key generation, encryption, decryption, signing)
- **Status:** ⚠️ **REQUIRED** - Cannot be replaced
- **Reason:**
  - This is the **only** secure way to perform cryptography in browsers
  - Standard W3C API, not a third-party library
  - Required for E2EE (End-to-End Encryption) security
  - Replacing this would require implementing entire crypto library (insecure and impractical)
- **Files Using It:**
  - `client/src/crypto/keyManagement.js`
  - `client/src/crypto/encryption.js`
  - `client/src/crypto/keyExchange.js`
  - `client/src/crypto/signatures.js`
  - `client/src/crypto/keyDerivation.js`
  - `client/src/crypto/fileEncryption.js`
  - `client/src/crypto/utils.js`

### 3. Browser `indexedDB` API
- **Location:** `client/src/crypto/keyManagement.js`
- **Usage:** Storing encrypted private keys client-side
- **Status:** ⚠️ **REQUIRED** - Cannot be replaced
- **Reason:**
  - Standard browser API for persistent client-side storage
  - Required for secure key storage (private keys never leave client)
  - Not a third-party library - part of browser specification

---

## 📋 Summary

| Built-in Library/API | Status | Replacement | Notes |
|---------------------|--------|-------------|-------|
| Node.js `crypto` | ✅ Replaced | Custom SHA-256 | Used only for backup code hashing |
| Node.js `http` | ⚠️ Required | None | Core Node.js module, required for Socket.io |
| Browser `window.crypto` | ⚠️ Required | None | Standard W3C API, only secure crypto option |
| Browser `indexedDB` | ⚠️ Required | None | Standard browser API for storage |

---

## ✅ Actions Taken

1. ✅ Created custom SHA-256 implementation (`server/src/utils/sha256.js`)
2. ✅ Replaced all `require('crypto')` usage in `twoFactorController.js`
3. ✅ Documented required built-in APIs that cannot be replaced

---

## 📝 Notes

- **Web Crypto API** and **IndexedDB** are standard browser APIs, not third-party libraries
- **Node.js `http`** is a core runtime module, not a library
- All cryptographic operations use Web Crypto API (required for security)
- Custom SHA-256 implementation is used only for non-critical hashing (backup codes)

---

## 🧪 Testing

After replacing Node.js `crypto` module:
1. Test 2FA backup code generation
2. Test 2FA backup code verification
3. Verify SHA-256 hashing produces correct results

