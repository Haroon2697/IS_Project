# 📚 PROJECT DOCUMENTATION

**Secure End-to-End Encrypted Messaging & File-Sharing System**  
**Complete Guide: How It Works, Testing, Setup, and Everything You Need**

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [How It Works](#how-it-works)
3. [Setup Instructions](#setup-instructions)
4. [Testing Guide](#testing-guide)
5. [Architecture](#architecture)
6. [Security Features](#security-features)
7. [API Documentation](#api-documentation)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 PROJECT OVERVIEW

### Purpose
End-to-end encrypted messaging system where:
- Messages are encrypted client-side
- Server never sees plaintext
- Private keys never leave the client
- Secure key exchange protocol
- Replay attack protection

### Technology Stack
- **Frontend:** React.js, Web Crypto API, IndexedDB
- **Backend:** Node.js, Express, Socket.io
- **Database:** MongoDB (optional, has in-memory fallback)
- **Authentication:** JWT, OAuth 2.0, TOTP (2FA)

---

## 🔧 HOW IT WORKS

### 1. User Registration & Key Generation

**Flow:**
1. User registers with username, email, password
2. Client generates ECC P-256 key pair (Web Crypto API)
3. Private key encrypted with password-derived key (PBKDF2)
4. Encrypted private key stored in IndexedDB
5. Public key sent to server (stored in database)
6. Password hashed with Argon2 and stored

**Files:**
- `client/src/components/Auth/Register.jsx`
- `client/src/crypto/keyManagement.js`
- `client/src/storage/indexedDB.js`

**Security:**
- Private keys NEVER sent to server
- Keys encrypted before storage
- Password required to decrypt keys

---

### 2. Key Exchange Protocol (ECDH-MA)

**5-Phase Protocol:**

**Phase 1: Init (Alice → Bob)**
- Alice generates ephemeral ECDH key pair
- Creates init message with:
  - Ephemeral public key
  - Nonce (Alice)
  - Timestamp
  - Digital signature (ECDSA)
- Sends to server, forwards to Bob

**Phase 2: Response (Bob → Alice)**
- Bob generates ephemeral ECDH key pair
- Verifies Alice's signature
- Creates response with:
  - Bob's ephemeral public key
  - Echo of Alice's nonce
  - New nonce (Bob)
  - Digital signature
- Sends to server, forwards to Alice

**Phase 3: Confirm (Alice → Bob)**
- Alice verifies Bob's signature
- Derives shared secret (ECDH)
- Derives session key (HKDF)
- Creates confirmation with session key signature
- Sends to server, forwards to Bob

**Phase 4: Acknowledge (Bob → Alice)**
- Bob verifies confirmation
- Derives same session key
- Sends acknowledgment
- Both have established session key

**Phase 5: Established**
- Secure channel ready
- Can send encrypted messages

**Files:**
- `client/src/crypto/keyExchange.js`
- `client/src/crypto/keyDerivation.js`
- `client/src/crypto/signatures.js`

**Security Features:**
- Digital signatures prevent MITM
- Nonces prevent replay
- Timestamps prevent old messages
- Forward secrecy (ephemeral keys)

---

### 3. Message Encryption

**Process:**
1. User types message
2. Client encrypts with AES-256-GCM:
   - Generates random 12-byte IV
   - Encrypts plaintext
   - Gets 128-bit authentication tag
3. Adds metadata:
   - Nonce (replay protection)
   - Timestamp
   - Sequence number
5. Sends encrypted message via Socket.io (real-time WebSocket)
6. Server forwards to recipient via Socket.io (instant delivery)
7. Recipient decrypts client-side

**Files:**
- `client/src/crypto/encryption.js`
- `client/src/services/messaging.js`

**Security:**
- AES-256-GCM (authenticated encryption)
- Random IV per message
- Authentication tag verifies integrity
- Client-side only encryption

---

### 4. Replay Attack Protection

**Three Mechanisms:**

1. **Nonces:**
   - Unique random nonce per message
   - Stored in IndexedDB
   - Rejected if seen before

2. **Timestamps:**
   - 5-minute validity window
   - Messages outside window rejected
   - Prevents old message replay

3. **Sequence Numbers:**
   - Incremental per conversation
   - Must be greater than last seen
   - Prevents out-of-order replay

**Files:**
- `client/src/crypto/replayProtection.js`

---

## 🚀 SETUP INSTRUCTIONS

### Prerequisites
- Node.js 16+ installed
- npm or yarn
- Modern browser (Chrome, Firefox, Edge)

### Backend Setup

```bash
cd server
npm install
cp .env.example .env  # Edit with your values
npm run dev
```

**Environment Variables:**
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - Secret for JWT tokens
- `MONGODB_URI` - MongoDB connection (optional)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret

### Frontend Setup

```bash
cd client
npm install
npm start
```

Opens `http://localhost:3000`

---

## 🧪 TESTING GUIDE

### Socket.io Testing (NEW)

**Prerequisites:**
- Server running: `cd server && npm run dev`
- Client running: `cd client && npm start`
- Two browser windows (or one normal + one incognito)

**Quick Socket.io Test:**
1. Login to the application
2. Open browser console (F12)
3. Look for these messages:
   - `✅ Socket connected: [socket-id]`
   - `✅ Socket authenticated: {userId: ...}`
4. Check chat header - should show 🟢 (green = connected)
5. If you see 🔴 (red), check server console for errors

**Real-Time Messaging Test:**
1. Register 2 users in different browsers
2. Login both users
3. User 1: Select User 2 from user list
4. Click "Establish Secure Connection"
5. Wait for "Secure channel established" message
6. User 1: Type and send a message
7. **Expected:** Message appears instantly in User 2's browser
8. User 2: Reply with a message
9. **Expected:** Message appears instantly in User 1's browser

**Connection Status Test:**
- 🟢 Green dot = Connected and authenticated
- 🔴 Red dot = Disconnected or not authenticated
- Check browser console for connection errors

---

### Quick Test

1. **Start servers:**
   ```bash
   # Terminal 1
   cd server && npm run dev
   
   # Terminal 2
   cd client && npm start
   ```

2. **Register a user:**
   - Go to `http://localhost:3000/register`
   - Fill form and register
   - Check console for key generation messages

3. **Verify keys:**
   - Open DevTools (F12)
   - Application → IndexedDB → SecureMessagingDB
   - Check `privateKeys` store

4. **Test encryption:**
   - Open browser console
   - Run encryption test (see Testing section below)

### Detailed Tests

#### Test 1: Registration & Key Generation
- Register new user
- Check console: "Keys generated and stored"
- Verify IndexedDB has encrypted private key
- Verify public key sent to server

#### Test 2: Login & Key Retrieval
- Login with registered user
- Enter password when prompted
- Check console: "Keys retrieved successfully"
- Verify keys accessible

#### Test 3: 2FA Setup
- Go to Dashboard → Security Settings
- Click "Enable 2FA"
- Scan QR code with authenticator app
- Enter 6-digit code
- Verify 2FA enabled

#### Test 4: Encryption/Decryption
Open browser console and run:

```javascript
(async function testEncryption() {
  try {
    const encryptionModule = await import('./src/crypto/encryption.js');
    const { encryptMessage, decryptMessage } = encryptionModule;
    
    const testKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    const plaintext = "Hello, secret message!";
    console.log('📝 Plaintext:', plaintext);
    
    const encrypted = await encryptMessage(testKey, plaintext);
    console.log('🔒 Encrypted:', encrypted);
    
    const decrypted = await decryptMessage(
      testKey,
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.authTag
    );
    console.log('🔓 Decrypted:', decrypted);
    
    if (decrypted === plaintext) {
      console.log('✅ Encryption test PASSED!');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
```

#### Test 5: Two Users (Key Exchange & Real-Time Messaging)
1. Register `testuser1` in browser 1
2. Register `testuser2` in browser 2 (incognito)
3. Login as `testuser1` in browser 1
4. Login as `testuser2` in browser 2
5. In browser 1: Select `testuser2` from user list
6. Click "Establish Secure Connection"
7. Check console for key exchange messages
8. Wait for "Secure channel established" message
9. Send a message from browser 1
10. **Verify:** Message appears instantly in browser 2 (real-time!)
11. Send a message from browser 2
12. **Verify:** Message appears instantly in browser 1

**Expected Results:**
- ✅ Key exchange completes successfully
- ✅ Connection indicator shows 🟢 (connected)
- ✅ Messages appear in real-time without page refresh
- ✅ Messages are encrypted (check network tab - only ciphertext visible)
- ✅ Messages decrypt correctly on recipient side

#### Test 6: Socket.io Connection Status
1. Login to the application
2. Open browser console
3. Check for: "✅ Socket connected: [socket-id]"
4. Check for: "✅ Socket authenticated: {userId: ...}"
5. Look at chat header - should show 🟢 (green dot = connected)
6. Disconnect internet briefly
7. **Verify:** Connection indicator changes to 🔴
8. Reconnect internet
9. **Verify:** Automatically reconnects and shows 🟢

#### Test 7: Real-Time Message Delivery
1. Set up 2 users (as in Test 5)
2. Establish secure connection
3. In browser 1, type a message but don't send yet
4. In browser 2, watch the chat window
5. Send message from browser 1
6. **Verify:** Message appears in browser 2 within 1 second
7. Send multiple messages quickly
8. **Verify:** All messages appear in order in browser 2

---

## 🏗️ ARCHITECTURE

### System Components

**Frontend (React):**
- Authentication components
- Dashboard
- Chat interface
- Key exchange UI
- Cryptographic modules

**Backend (Node.js/Express):**
- REST API endpoints
- Socket.io server ✅ (implemented)
- Authentication middleware
- Key exchange relay
- User management

**Storage:**
- IndexedDB (client) - Private keys, nonces
- MongoDB (server) - User data, public keys, messages
- In-memory fallback (server) - When MongoDB not connected

### Data Flow

**Registration:**
```
User → Client → Generate Keys → Encrypt Private Key → Store in IndexedDB
                                    ↓
                              Send Public Key → Server → Store in DB
```

**Key Exchange (Real-Time via Socket.io):**
```
Alice → Init Message → Socket.io Server → Bob (real-time)
Bob → Response → Socket.io Server → Alice (real-time)
Alice → Confirm → Socket.io Server → Bob (real-time)
Bob → Acknowledge → Socket.io Server → Alice (real-time)
Both have session key
```

**Message Sending (Real-Time via Socket.io):**
```
User → Encrypt Message → Socket.io → Server → Socket.io → Recipient → Decrypt Message
     (client-side)      (WebSocket)          (WebSocket)  (client-side)
```
**Note:** Messages are delivered in real-time via WebSocket connections. Server only sees encrypted ciphertext.

---

## 🔒 SECURITY FEATURES

### Implemented

1. **Password Security:**
   - Argon2 hashing (memory-hard)
   - Salt per password
   - No plaintext storage

2. **Key Security:**
   - Private keys encrypted
   - Stored client-side only
   - Password required to decrypt

3. **Encryption:**
   - AES-256-GCM (authenticated)
   - Random IV per message
   - Authentication tags

4. **Key Exchange:**
   - Digital signatures (ECDSA)
   - Forward secrecy (ephemeral keys)
   - MITM protection

5. **Replay Protection:**
   - Nonces
   - Timestamps
   - Sequence numbers

6. **Authentication:**
   - JWT tokens
   - OAuth 2.0
   - Two-factor authentication

---

## 📡 API DOCUMENTATION

### Authentication Endpoints

**POST `/api/auth/register`**
- Register new user
- Body: `{ username, email, password, publicKey }`
- Returns: `{ token, user }`

**POST `/api/auth/login`**
- Login user
- Body: `{ username, password }`
- Returns: `{ token, user, requires2FA }`

**GET `/api/auth/me`**
- Get current user (protected)
- Headers: `Authorization: Bearer <token>`
- Returns: `{ user }`

### Key Exchange Endpoints

**POST `/api/keyexchange/init`**
- Send init message
- Body: Key exchange init message
- Returns: `{ success }`

**POST `/api/keyexchange/response`**
- Send response message
- Body: Key exchange response message
- Returns: `{ success }`

### User Endpoints

**GET `/api/users/list`**
- Get list of all users (protected)
- Returns: `{ users: [...] }`

**GET `/api/users/:userId/publicKey`**
- Get user's public key (protected)
- Returns: `{ userId, username, publicKey }`

---

## 🐛 TROUBLESHOOTING

### Common Issues

**Issue: "Keys not generating"**
- Check browser console for errors
- Verify Web Crypto API available: `console.log(window.crypto.subtle)`
- Make sure on `http://localhost:3000` (not `file://`)

**Issue: "MongoDB connection failed"**
- Server uses in-memory storage as fallback
- This is fine for testing
- To use MongoDB, set `MONGODB_URI` in `.env`

**Issue: "Import errors in console"**
- Make sure you're on the dashboard page
- Check file paths are correct
- Use simple test (no imports) if needed

**Issue: "No users in list"**
- Register at least 2 users
- Click "Refresh" button
- Check server console for errors

**Issue: "Key exchange stuck on 'initiated'"**
- Socket.io not yet implemented
- This is expected behavior
- Will work after Socket.io integration

---

## 📊 CURRENT STATUS

### Working Features ✅
- User registration/login
- Key generation and storage
- Key exchange protocol (code complete)
- Message encryption/decryption
- Replay attack protection
- OAuth and 2FA

### Missing Features ❌
- Real-time messaging (Socket.io)
- File sharing
- MITM attack demo
- Comprehensive logging UI
- Architecture diagrams
- Project report

---

## 🎯 NEXT STEPS

1. **Implement Socket.io** (1-2 days)
   - See `IMPLEMENT_SOCKETIO.md` for guide
   - Makes messaging functional

2. **File Sharing** (2-3 days)
   - Implement file chunking and encryption
   - Create upload/download endpoints

3. **MITM Demo** (2-3 days)
   - Create attack scripts
   - Document demonstration

---

**For detailed progress and implementation guides, see `PROJECT_PROGRESS.md`**

**Last Updated:** December 2024

