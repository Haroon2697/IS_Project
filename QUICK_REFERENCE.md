# ⚡ QUICK REFERENCE GUIDE

**Fast lookup for common tasks and information**

---

## 🚀 Quick Start

```bash
# Backend
cd server && npm install && npm run dev

# Frontend (new terminal)
cd client && npm install && npm start

# Open browser
http://localhost:3000
```

---

## 📁 Important Files

### Documentation
- `PROJECT_PROGRESS.md` - Progress and remaining work
- `PROJECT_DOCUMENTATION.md` - How it works and testing
- `STATUS_REPORT.md` - Current status summary
- `NEXT_STEPS.md` - What to do next
- `IMPLEMENT_SOCKETIO.md` - Socket.io guide

### Key Code Files
- `client/src/crypto/keyManagement.js` - Key generation
- `client/src/crypto/keyExchange.js` - Key exchange protocol
- `client/src/crypto/encryption.js` - Message encryption
- `server/src/controllers/authController.js` - Authentication
- `server/server.js` - Main server file

---

## 🧪 Quick Tests

### Test Encryption (Browser Console)
```javascript
(async function() {
  const { encryptMessage, decryptMessage } = await import('./src/crypto/encryption.js');
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const encrypted = await encryptMessage(key, "test");
  const decrypted = await decryptMessage(key, encrypted.ciphertext, encrypted.iv, encrypted.authTag);
  console.log(decrypted === "test" ? "✅ PASSED" : "❌ FAILED");
})();
```

### Check Keys in IndexedDB
1. Open DevTools (F12)
2. Application → IndexedDB → SecureMessagingDB
3. Check `privateKeys` store

---

## 🔑 Key Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ✅ 100% | Basic + OAuth + 2FA |
| Key Generation | ✅ 100% | ECC P-256 |
| Key Storage | ✅ 100% | IndexedDB encrypted |
| Key Exchange | ✅ 90% | Needs Socket.io |
| Encryption | ✅ 80% | Needs Socket.io |
| Replay Protection | ✅ 100% | Fully working |
| File Sharing | ❌ 0% | Not implemented |
| MITM Demo | ❌ 0% | Not implemented |

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Key Exchange
- `POST /api/keyexchange/init` - Send init message
- `POST /api/keyexchange/response` - Send response
- `POST /api/keyexchange/confirm` - Send confirmation
- `POST /api/keyexchange/acknowledge` - Send acknowledgment

### Users
- `GET /api/users/list` - Get all users
- `GET /api/users/:userId/publicKey` - Get user's public key

---

## 🐛 Common Issues

**Keys not generating?**
- Check browser console
- Verify Web Crypto API: `console.log(window.crypto.subtle)`
- Must be on `http://localhost:3000` (not `file://`)

**MongoDB connection failed?**
- Server uses in-memory storage as fallback
- This is fine for testing
- Set `MONGODB_URI` in `.env` to use MongoDB

**No users in list?**
- Register at least 2 users
- Click "Refresh" button
- Check server console

**Key exchange stuck?**
- Socket.io not yet implemented
- This is expected
- Will work after Socket.io integration

---

## 📊 Current Progress

**Overall:** ~60% Complete  
**Grade Estimate:** ~70/100

**Working:**
- ✅ Authentication
- ✅ Key Generation
- ✅ Encryption/Decryption
- ✅ Replay Protection

**Missing:**
- ❌ Socket.io (Real-time messaging)
- ❌ File Sharing
- ❌ MITM Demo
- ❌ Documentation

---

## 🎯 Next Actions

1. **Socket.io** (1-2 days) - Makes messaging functional
2. **File Sharing** (2-3 days) - Required feature
3. **MITM Demo** (2-3 days) - 15 marks

**See:** [NEXT_STEPS.md](./NEXT_STEPS.md) for detailed plan

---

## 📚 Full Documentation

- **Progress & Implementation:** [PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md)
- **How It Works & Testing:** [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)
- **Current Status:** [STATUS_REPORT.md](./STATUS_REPORT.md)
- **What to Do Next:** [NEXT_STEPS.md](./NEXT_STEPS.md)

---

**Last Updated:** December 2024

