# System Architecture

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT A (Browser)                          │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   React UI   │  │  Web Crypto  │  │  IndexedDB   │              │
│  │              │  │              │  │  (Private    │              │
│  │              │  │              │  │   Keys)      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                  │                  │                      │
│         └──────────────────┴──────────────────┘                      │
│                            │                                          │
│                    AES-256-GCM Encryption                            │
│                    (Client-Side Only)                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              │ (Only Ciphertext Transmitted)
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVER (Node.js + Express)                      │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │     REST     │  │  Socket.io   │  │   Logging    │              │
│  │     API      │  │  (Real-time) │  │   System     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                  │                  │                      │
│         └──────────────────┴──────────────────┘                      │
│                            │                                          │
│                  (Stores Only Ciphertext)                            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                       MongoDB Database                               │
│                                                                       │
│  Collections:                                                        │
│  - users (passwordHash, publicKey only)                             │
│  - messages (ciphertext, IV, metadata)                              │
│  - files (encrypted chunks)                                          │
│  - logs (security audit logs)                                        │
│                                                                       │
│  ❌ NO PRIVATE KEYS                                                  │
│  ❌ NO PLAINTEXT MESSAGES                                            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              │ (Only Ciphertext Transmitted)
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT B (Browser)                          │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   React UI   │  │  Web Crypto  │  │  IndexedDB   │              │
│  │              │  │              │  │  (Private    │              │
│  │              │  │              │  │   Keys)      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                  │                  │                      │
│         └──────────────────┴──────────────────┘                      │
│                            │                                          │
│                    AES-256-GCM Decryption                            │
│                    (Client-Side Only)                                │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Security Principles

### 2.1 End-to-End Encryption
- **All encryption happens on the client**
- **Server only stores and forwards ciphertext**
- **Private keys NEVER leave the client device**

### 2.2 Zero-Knowledge Architecture
- Server cannot read messages
- Server cannot read files
- Server cannot access private keys
- Server only stores encrypted data

### 2.3 Defense in Depth
```
Layer 1: HTTPS (Transport security)
Layer 2: E2EE (Content security)
Layer 3: Digital Signatures (Authentication)
Layer 4: Replay Protection (Nonce + Timestamp + Sequence)
Layer 5: Secure Key Storage (Encrypted IndexedDB)
Layer 6: Password Hashing (argon2)
```

## 3. Data Flow

### 3.1 Message Flow

```
Alice (Sender)                           Bob (Receiver)
     │                                        │
     │ 1. Type message: "Hello Bob"          │
     │                                        │
     │ 2. Encrypt with AES-GCM               │
     │    - Use session key                  │
     │    - Generate random IV               │
     │    - Add nonce, timestamp, seq#       │
     │                                        │
     │ 3. Send ciphertext to server          │
     ├──────────────────────────────────────>│
     │         {                              │
     │           ciphertext: "a8f2...",       │
     │           iv: "7b3d...",               │
     │           nonce: "9c4e...",            │
     │           timestamp: 1234567890,       │
     │           sequenceNumber: 42,          │
     │           signature: "e1f5..."         │
     │         }                              │
     │                                        │
     │                                   4. Receive ciphertext
     │                                        │
     │                                   5. Verify timestamp
     │                                   6. Verify nonce (not replayed)
     │                                   7. Verify sequence number
     │                                   8. Decrypt with session key
     │                                   9. Display: "Hello Bob"
     │                                        │
```

**Server's Role:**
- Receives ciphertext from Alice
- Stores in MongoDB (for offline delivery)
- Forwards to Bob via WebSocket (if online)
- **NEVER decrypts or reads content**

### 3.2 File Upload Flow

```
Alice                              Server                              Bob
  │                                  │                                  │
  │ 1. Select file                   │                                  │
  │ 2. Read file as ArrayBuffer      │                                  │
  │ 3. Split into 1MB chunks         │                                  │
  │ 4. For each chunk:               │                                  │
  │    - Generate random IV          │                                  │
  │    - Encrypt with AES-GCM        │                                  │
  │ 5. Upload encrypted chunks       │                                  │
  ├─────────────────────────────────>│                                  │
  │                                   │ 6. Store encrypted chunks       │
  │                                   │    in database                  │
  │                                   │                                  │
  │                                   │ 7. Notify Bob (file available)  │
  │                                   ├─────────────────────────────────>│
  │                                   │                                  │
  │                                   │                       8. Request file
  │                                   │<─────────────────────────────────┤
  │                                   │                                  │
  │                                   │ 9. Send encrypted chunks         │
  │                                   ├─────────────────────────────────>│
  │                                   │                                  │
  │                                   │              10. Decrypt chunks  │
  │                                   │              11. Reassemble file │
  │                                   │              12. Download/View   │
  │                                   │                                  │
```

## 4. Component Breakdown

### 4.1 Frontend Components

```
src/
├── components/
│   ├── Auth/
│   │   ├── Login.jsx           (Login form)
│   │   ├── Register.jsx        (Registration with key generation)
│   │   └── ProtectedRoute.jsx  (Route guard)
│   ├── Chat/
│   │   ├── ChatWindow.jsx      (Main chat interface)
│   │   ├── MessageList.jsx     (Display messages)
│   │   ├── MessageInput.jsx    (Message composer)
│   │   └── ContactList.jsx     (User list)
│   ├── FileShare/
│   │   ├── FileUpload.jsx      (File upload UI)
│   │   ├── FileList.jsx        (Received files)
│   │   └── FileDownload.jsx    (Download handler)
│   └── Security/
│       ├── KeyExchangeStatus.jsx  (Show secure connection status)
│       └── SecurityIndicator.jsx  (Lock icon, etc.)
│
├── crypto/
│   ├── keyManagement.js        (Generate, store, retrieve keys)
│   ├── encryption.js           (AES-GCM encrypt/decrypt)
│   ├── keyExchange.js          (ECDH + signatures)
│   ├── signatures.js           (Create/verify signatures)
│   └── replayProtection.js     (Nonce tracking)
│
├── storage/
│   └── indexedDB.js            (Secure key storage)
│
├── api/
│   ├── auth.js                 (Auth API calls)
│   ├── messages.js             (Message API calls)
│   ├── files.js                (File API calls)
│   └── socket.js               (WebSocket connection)
│
└── utils/
    ├── helpers.js
    └── constants.js
```

### 4.2 Backend Components

```
server/
├── src/
│   ├── models/
│   │   ├── User.js             (User schema)
│   │   ├── Message.js          (Message schema)
│   │   ├── File.js             (File schema)
│   │   └── Log.js              (Security log schema)
│   │
│   ├── routes/
│   │   ├── auth.js             (Registration, login)
│   │   ├── messages.js         (Message endpoints)
│   │   ├── files.js            (File endpoints)
│   │   ├── keyExchange.js      (Key exchange relay)
│   │   └── logs.js             (Log retrieval)
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── messageController.js
│   │   ├── fileController.js
│   │   └── logController.js
│   │
│   ├── middleware/
│   │   ├── auth.js             (JWT verification)
│   │   ├── rateLimiter.js      (Prevent brute force)
│   │   └── logger.js           (Security logging)
│   │
│   ├── utils/
│   │   ├── logger.js           (Logging utility)
│   │   └── validators.js       (Input validation)
│   │
│   └── socket/
│       └── socketHandler.js    (Real-time messaging)
│
├── .env                        (Environment variables)
└── server.js                   (Entry point)
```

## 5. Technology Stack Justification

### Frontend

| Technology | Purpose | Justification |
|------------|---------|---------------|
| React.js | UI Framework | Component-based, large ecosystem, good for complex UIs |
| Web Crypto API | Cryptography | Native browser API, secure, fast, no external dependencies |
| IndexedDB | Key Storage | Browser-native, persistent, supports binary data |
| Socket.io Client | Real-time | WebSocket support, automatic reconnection, fallback options |
| Axios | HTTP Client | Promise-based, interceptors for JWT, good error handling |

### Backend

| Technology | Purpose | Justification |
|------------|---------|---------------|
| Node.js | Runtime | JavaScript full-stack, async I/O, large package ecosystem |
| Express | Web Framework | Minimal, flexible, widely used, good middleware support |
| MongoDB | Database | Document-based (good for JSON), flexible schema, easy setup |
| Socket.io | Real-time | Full-duplex communication, room support, automatic reconnection |
| argon2 | Password Hashing | Winner of Password Hashing Competition, memory-hard |
| jsonwebtoken | Authentication | Stateless auth, standard, widely supported |

### Security Tools

| Tool | Purpose | Justification |
|------|---------|---------------|
| Wireshark | Packet Analysis | Industry standard, detailed packet inspection |
| BurpSuite | MITM Testing | Proxy tool, SSL interception, request manipulation |
| OpenSSL | Certificate Mgmt | Standard tool, wide compatibility |

## 6. Deployment Architecture

### Development Environment

```
┌────────────────────────────────────────┐
│         Developer Machine              │
│                                        │
│  Frontend: localhost:3000              │
│  Backend:  localhost:5000              │
│  MongoDB:  localhost:27017             │
│                                        │
└────────────────────────────────────────┘
```

### Production Environment (Optional)

```
┌────────────────────────────────────────┐
│         Cloud Platform (e.g., AWS)     │
│                                        │
│  Frontend: S3 + CloudFront             │
│  Backend:  EC2 / ECS                   │
│  MongoDB:  MongoDB Atlas               │
│  SSL:      Let's Encrypt / ACM         │
│                                        │
└────────────────────────────────────────┘
```

## 7. Security Boundaries

### Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    TRUSTED ZONE (Client)                     │
│                                                              │
│  - Plaintext messages                                        │
│  - Private keys                                              │
│  - Decryption operations                                     │
│  - Signature creation                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            │ (Only encrypted data crosses)
                            │
┌─────────────────────────────────────────────────────────────┐
│                   UNTRUSTED ZONE (Server)                    │
│                                                              │
│  - Ciphertext only                                           │
│  - Public keys only                                          │
│  - Metadata (IDs, timestamps)                                │
│  - NO plaintext, NO private keys                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 8. Performance Considerations

### Frontend Performance
- Lazy load crypto modules
- Encrypt/decrypt in Web Workers (if needed for large files)
- Cache session keys in memory
- Batch IndexedDB operations

### Backend Performance
- Database indexes on frequently queried fields
- Connection pooling for MongoDB
- Rate limiting to prevent abuse
- Pagination for message history

### Network Performance
- Compress HTTP responses (gzip)
- Use WebSocket for real-time (reduces HTTP overhead)
- Implement file chunking (parallel uploads/downloads)
- CDN for frontend static assets (if deployed)

## 9. Scalability Considerations

### Current Design Limitations
- Session keys stored in memory (lost on refresh)
- No multi-device sync
- Files stored on single server

### Future Improvements
- Persistent session key storage (encrypted)
- Multi-device support (key distribution)
- Distributed file storage (S3, CDN)
- Load balancing for backend servers
- Database sharding

## 10. Key Security Properties

### Confidentiality
✅ Messages encrypted end-to-end
✅ Files encrypted end-to-end
✅ Private keys never leave client
✅ Server cannot read content

### Integrity
✅ AES-GCM authentication tags
✅ Digital signatures on key exchange
✅ Replay protection (nonce + sequence)

### Authentication
✅ Password-based user authentication
✅ Public key authentication (signatures)
✅ Mutual authentication in key exchange

### Availability
⚠️ Single server (no redundancy)
⚠️ No disaster recovery
(Out of scope for this project)

### Forward Secrecy
✅ Ephemeral ECDH keys
✅ Session keys derived per session
✅ Past sessions secure even if long-term key compromised

---

## Notes for Report

When writing your report, include:
1. This complete architecture diagram
2. Explanation of each component
3. Data flow diagrams
4. Security boundary analysis
5. Technology stack justification
6. Scalability discussion

Make sure to customize this based on your actual implementation!

