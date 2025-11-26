# 📅 DETAILED EXECUTION PLAN (22 Days)

This document provides **step-by-step, day-by-day execution tasks** for all 3 team members.

---

## 🗓️ PHASE 1: Team Setup & Planning (Days 1-2)

### Day 1: Team Organization

#### All Members Together (2-3 hours)
1. **Hold kickoff meeting**
   - Read entire project requirements together
   - Discuss grading rubric (100 marks breakdown)
   - Identify potential challenges

2. **Assign roles permanently**
   ```
   Member 1 → Cryptography & Protocol Design
   Member 2 → Frontend (React + Web Crypto)
   Member 3 → Backend (Node + MongoDB)
   ```

3. **Create GitHub repository**
   ```bash
   # Member 3 creates private repo on GitHub
   Repository Name: secure-e2ee-messaging
   Privacy: Private
   ```

4. **Clone and set up branches**
   ```bash
   git clone <your-repo-url>
   cd secure-e2ee-messaging
   
   # Create branches
   git checkout -b frontend-dev
   git checkout -b backend-dev
   git checkout -b crypto-design
   git checkout -b attack-tests
   git checkout main
   ```

5. **Set up project management**
   - Create Trello/Notion board OR use GitHub Projects
   - Add all tasks from this execution plan
   - Assign tasks to team members

#### Member 1 Tasks (Day 1)
- [ ] Research ECDH vs traditional DH
- [ ] Research HKDF key derivation
- [ ] Study ECDSA signature schemes
- [ ] Draft initial key exchange protocol (v0.1)

#### Member 2 Tasks (Day 1)
- [ ] Set up React development environment
- [ ] Research Web Crypto API documentation
- [ ] Study IndexedDB for key storage
- [ ] Create UI wireframes (chat interface)

#### Member 3 Tasks (Day 1)
- [ ] Set up Node.js development environment
- [ ] Install MongoDB locally or set up MongoDB Atlas
- [ ] Research bcrypt vs argon2
- [ ] Plan database schema

### Day 2: Architecture & Design

#### All Members Together (3 hours)
1. **Design system architecture**
   - Draw high-level architecture diagram
   - Define component interactions
   - Establish data flow (plaintext never leaves client)

2. **Define message structure** (Critical for originality)
   ```javascript
   // Your custom message format (example - modify this!)
   {
     messageId: "uuid",
     senderId: "user1",
     receiverId: "user2",
     ciphertext: "base64...",
     iv: "base64...",
     authTag: "base64...",
     nonce: "random-value",
     timestamp: 1234567890,
     sequenceNumber: 42,
     signature: "base64..."
   }
   ```

3. **Decide on crypto algorithms**
   | Purpose | Algorithm | Justification |
   |---------|-----------|---------------|
   | Key Pair | ECC P-256 | Smaller keys, faster |
   | Key Exchange | ECDH | Perfect forward secrecy |
   | Encryption | AES-256-GCM | Authenticated encryption |
   | Key Derivation | HKDF-SHA256 | Industry standard |
   | Signatures | ECDSA | Matches ECC keys |
   | Password Hash | argon2 | Better than bcrypt |

#### Member 1 Tasks (Day 2)
- [ ] Complete key exchange protocol diagram v1.0
- [ ] Document protocol steps (6-8 messages)
- [ ] Add nonce, timestamp, and signature requirements
- [ ] Create file: `docs/protocols/KEY_EXCHANGE_PROTOCOL.md`

#### Member 2 Tasks (Day 2)
- [ ] Finalize UI/UX wireframes
- [ ] Create component hierarchy diagram
- [ ] Plan IndexedDB schema for keys
- [ ] Create file: `docs/architecture/FRONTEND_ARCHITECTURE.md`

#### Member 3 Tasks (Day 2)
- [ ] Design MongoDB schemas (users, messages, files)
- [ ] Plan REST API endpoints
- [ ] Design logging structure
- [ ] Create file: `docs/architecture/BACKEND_ARCHITECTURE.md`

---

## 🗓️ PHASE 2: System Architecture Design (Days 2-3)

### Day 3: Detailed Design Documentation

#### Member 1 Tasks (Full Day)
- [ ] Create detailed key exchange protocol document
  - Message flow diagram (use Mermaid or draw.io)
  - Step-by-step explanation
  - Security properties (authenticity, forward secrecy)
  - Attack resistance analysis
- [ ] Document encryption/decryption workflow
- [ ] Create cryptographic specifications document
- [ ] File: `docs/protocols/CRYPTO_SPEC.md`

#### Member 2 Tasks (Full Day)
- [ ] Design React component structure
  ```
  src/
  ├── components/
  │   ├── Auth/
  │   │   ├── Login.jsx
  │   │   └── Register.jsx
  │   ├── Chat/
  │   │   ├── MessageList.jsx
  │   │   ├── MessageInput.jsx
  │   │   └── ChatWindow.jsx
  │   └── FileShare/
  │       ├── FileUpload.jsx
  │       └── FileDownload.jsx
  ├── crypto/
  │   ├── keyManagement.js
  │   ├── encryption.js
  │   ├── keyExchange.js
  │   └── signatures.js
  ├── storage/
  │   └── indexedDB.js
  └── utils/
      └── helpers.js
  ```
- [ ] Document IndexedDB schema
- [ ] Create state management plan
- [ ] File: `docs/architecture/COMPONENT_DESIGN.md`

#### Member 3 Tasks (Full Day)
- [ ] Design complete database schema
  ```javascript
  // Users Collection
  {
    _id: ObjectId,
    username: String,
    email: String,
    passwordHash: String,
    publicKey: String, // Only public key stored!
    createdAt: Date
  }
  
  // Messages Collection (only encrypted data)
  {
    _id: ObjectId,
    senderId: ObjectId,
    receiverId: ObjectId,
    ciphertext: String,
    iv: String,
    authTag: String,
    nonce: String,
    timestamp: Date,
    sequenceNumber: Number,
    signature: String
  }
  
  // Files Collection
  {
    _id: ObjectId,
    fileId: String,
    uploaderId: ObjectId,
    fileName: String, // Can be encrypted
    encryptedChunks: [String],
    metadata: Object,
    uploadedAt: Date
  }
  
  // Logs Collection (for security auditing)
  {
    _id: ObjectId,
    eventType: String,
    userId: ObjectId,
    timestamp: Date,
    details: Object,
    severity: String
  }
  ```
- [ ] Design REST API endpoints
- [ ] Plan WebSocket events (for real-time chat)
- [ ] File: `docs/architecture/API_DESIGN.md`

---

## 🗓️ PHASE 3: User Authentication System (Days 4-5)

### Day 4: Backend Authentication Setup

#### Member 3 Tasks (Full Day)
- [ ] Initialize Node.js project
  ```bash
  mkdir server
  cd server
  npm init -y
  npm install express mongoose bcryptjs argon2 jsonwebtoken dotenv cors
  npm install --save-dev nodemon
  ```

- [ ] Create project structure
  ```
  server/
  ├── src/
  │   ├── models/
  │   │   ├── User.js
  │   │   ├── Message.js
  │   │   └── Log.js
  │   ├── routes/
  │   │   ├── auth.js
  │   │   ├── messages.js
  │   │   └── files.js
  │   ├── middleware/
  │   │   ├── auth.js
  │   │   └── logger.js
  │   ├── controllers/
  │   │   └── authController.js
  │   └── utils/
  │       └── logger.js
  ├── .env
  ├── .gitignore
  └── server.js
  ```

- [ ] Implement User model with password hashing
- [ ] Create registration endpoint
  - Validate username/email
  - Hash password with argon2
  - Store public key from client
  - Return JWT token
- [ ] Create login endpoint
  - Verify credentials
  - Return JWT token
- [ ] Test with Postman/Thunder Client

#### Member 2 Tasks (Day 4)
- [ ] Initialize React project
  ```bash
  npx create-react-app client
  cd client
  npm install axios react-router-dom
  ```

- [ ] Create project structure
- [ ] Set up routing (Login, Register, Chat)
- [ ] Create basic UI components (no crypto yet)

#### Member 1 Tasks (Day 4)
- [ ] Finalize key exchange protocol specification
- [ ] Create protocol validation checklist
- [ ] Review backend authentication implementation
- [ ] Document security considerations

### Day 5: Frontend Authentication UI

#### Member 2 Tasks (Full Day)
- [ ] Build Register component
  - Username, email, password fields
  - Form validation
  - Call backend registration API
- [ ] Build Login component
  - Credential inputs
  - Call backend login API
  - Store JWT in sessionStorage
- [ ] Implement protected routes
- [ ] Add error handling and user feedback
- [ ] Test registration and login flow

#### Member 3 Tasks (Day 5)
- [ ] Add input validation middleware
- [ ] Implement rate limiting (prevent brute force)
- [ ] Add authentication logging
  - Log successful logins
  - Log failed attempts
  - Log new registrations
- [ ] Set up CORS properly
- [ ] Test all edge cases

#### Member 1 Tasks (Day 5)
- [ ] Review authentication implementation
- [ ] Document password security measures
- [ ] Prepare key generation implementation plan
- [ ] Create security checklist for auth

---

## 🗓️ PHASE 4: Client Key Generation & Storage (Days 6-7)

### Day 6: Key Generation Implementation

#### Member 2 Tasks (Full Day - Critical)
- [ ] Create `crypto/keyManagement.js` module
- [ ] Implement key pair generation using Web Crypto API
  ```javascript
  // Pseudocode - you must implement this
  async function generateKeyPair() {
    // Use window.crypto.subtle.generateKey()
    // Algorithm: ECDSA with P-256 curve
    // Return { publicKey, privateKey }
  }
  ```

- [ ] Implement public key export
  ```javascript
  async function exportPublicKey(publicKey) {
    // Export to JWK or SPKI format
    // Convert to base64 for server storage
  }
  ```

- [ ] Implement private key encryption & storage
  ```javascript
  async function storePrivateKey(privateKey, userPassword) {
    // Derive encryption key from password using PBKDF2
    // Encrypt private key with AES-GCM
    // Store encrypted key in IndexedDB
  }
  ```

- [ ] Create IndexedDB wrapper (`storage/indexedDB.js`)
  ```javascript
  // Database: "SecureMessagingDB"
  // Store: "keys"
  // Schema: { userId, encryptedPrivateKey, iv, salt }
  ```

- [ ] Integrate key generation into Register flow
  1. User submits registration form
  2. Generate key pair client-side
  3. Export and send public key to server
  4. Encrypt and store private key locally
  5. Complete registration

#### Member 1 Tasks (Day 6)
- [ ] Review Web Crypto implementation
- [ ] Verify key generation parameters
  - Key size (2048 for RSA or P-256 for ECC)
  - Proper algorithm configuration
- [ ] Document key storage security
- [ ] Test key generation flow

#### Member 3 Tasks (Day 6)
- [ ] Update User model to store publicKey field
- [ ] Create endpoint to retrieve user public keys
  ```
  GET /api/users/:userId/publicKey
  ```
- [ ] Ensure private keys are NEVER stored on server
- [ ] Add logging for key exchange attempts

### Day 7: Key Retrieval & Verification

#### Member 2 Tasks (Full Day)
- [ ] Implement private key retrieval on login
  ```javascript
  async function retrievePrivateKey(userId, userPassword) {
    // Get encrypted key from IndexedDB
    // Derive decryption key from password
    // Decrypt private key
    // Import back to CryptoKey format
  }
  ```

- [ ] Add key validation
  - Verify key exists in IndexedDB
  - Test encryption/decryption with key pair
- [ ] Implement key re-generation option
- [ ] Handle edge cases:
  - Lost private key → inform user (cannot decrypt old messages)
  - Browser data cleared → re-authentication needed
- [ ] Create key management UI section

#### Member 1 Tasks (Day 7)
- [ ] Create comprehensive key management documentation
- [ ] Verify security properties:
  - ✅ Private key never sent to server
  - ✅ Private key encrypted at rest
  - ✅ Proper key derivation from password
- [ ] Prepare for key exchange implementation
- [ ] Document recovery scenarios

#### Member 3 Tasks (Day 7)
- [ ] Test public key storage and retrieval
- [ ] Verify database contains no private keys
  ```bash
  # MongoDB query to verify
  db.users.find({}, { passwordHash: 0 })
  # Should only see publicKey, not privateKey
  ```
- [ ] Add database indexes for performance
- [ ] Create backup and recovery procedures

---

## 🗓️ PHASE 5: Custom Secure Key Exchange Protocol (Days 8-10)

**⚠️ CRITICAL PHASE - This is worth 15 marks and must be UNIQUE to your group**

### Day 8: Protocol Design Finalization

#### Member 1 Tasks (Full Day - Lead)
- [ ] Design complete key exchange protocol (must be custom variant)

**Example Protocol Structure (customize this!):**

```
Protocol: ECDH with Mutual Authentication & Nonce Confirmation

1. INIT Phase - Alice → Bob:
   {
     type: "KEY_EXCHANGE_INIT",
     senderId: "Alice",
     receiverId: "Bob",
     alicePublicKey: "...",      // Long-term public key
     aliceECDHPublic: "...",     // Ephemeral ECDH public key
     nonceAlice: "random_value",
     timestamp: 1234567890,
     signature: ECDSA_Sign(Alice_PrivateKey, Hash(all above fields))
   }

2. RESPONSE Phase - Bob → Alice:
   {
     type: "KEY_EXCHANGE_RESPONSE",
     senderId: "Bob",
     receiverId: "Alice",
     bobECDHPublic: "...",       // Ephemeral ECDH public key
     nonceAlice: "...",          // Echo Alice's nonce
     nonceBob: "random_value",
     timestamp: 1234567891,
     signature: ECDSA_Sign(Bob_PrivateKey, Hash(all above fields))
   }

3. DERIVE Phase - Both compute:
   sharedSecret = ECDH(own_private_ECDH, peer_public_ECDH)
   sessionKey = HKDF(
     ikm: sharedSecret,
     salt: nonceAlice + nonceBob,
     info: "session-key-v1",
     length: 32 bytes
   )

4. CONFIRM Phase - Alice → Bob:
   {
     type: "KEY_CONFIRM",
     confirmMessage: AES_GCM_Encrypt(
       key: sessionKey,
       plaintext: "KEY_CONFIRMED_" + nonceBob,
       iv: random_iv
     )
   }

5. ACKNOWLEDGE Phase - Bob → Alice:
   {
     type: "KEY_ACK",
     ackMessage: AES_GCM_Encrypt(
       key: sessionKey,
       plaintext: "KEY_ACKNOWLEDGED_" + nonceAlice,
       iv: random_iv
     )
   }
```

- [ ] Create detailed message flow diagram (use Mermaid or draw.io)
- [ ] Document security properties:
  - Forward secrecy (ephemeral ECDH keys)
  - Mutual authentication (signatures)
  - Replay protection (nonces + timestamps)
  - MITM resistance (signature verification)
- [ ] Write protocol specification document
- [ ] Create attack resistance analysis

#### Member 2 & 3 Tasks (Day 8)
- [ ] Review protocol design with Member 1
- [ ] Provide feedback on implementation complexity
- [ ] Identify potential issues
- [ ] Begin planning implementation modules

### Day 9: Protocol Implementation - Client Side

#### Member 2 Tasks (Full Day)
- [ ] Create `crypto/keyExchange.js` module
- [ ] Implement ECDH key generation
  ```javascript
  async function generateECDHKeyPair() {
    // Generate ephemeral ECDH key pair
    // Algorithm: ECDH with P-256
  }
  ```

- [ ] Implement session key derivation
  ```javascript
  async function deriveSessionKey(sharedSecret, nonces) {
    // Use HKDF with SHA-256
    // Input: shared secret + both nonces
    // Output: 256-bit AES key
  }
  ```

- [ ] Implement signature creation
  ```javascript
  async function createSignature(privateKey, data) {
    // Sign data with ECDSA
    // Return base64 signature
  }
  ```

- [ ] Implement signature verification
  ```javascript
  async function verifySignature(publicKey, signature, data) {
    // Verify ECDSA signature
    // Return true/false
  }
  ```

- [ ] Implement nonce generation
  ```javascript
  function generateNonce(length = 32) {
    // Generate cryptographically random nonce
    // Use crypto.getRandomValues()
  }
  ```

#### Member 3 Tasks (Day 9)
- [ ] Create key exchange message relay endpoints
  ```
  POST /api/keyexchange/init
  POST /api/keyexchange/response
  POST /api/keyexchange/confirm
  POST /api/keyexchange/acknowledge
  ```
- [ ] Implement message forwarding (server doesn't process, just relays)
- [ ] Add key exchange attempt logging
- [ ] Store session metadata (not the key itself!)

#### Member 1 Tasks (Day 9)
- [ ] Assist with implementation
- [ ] Review code for security issues
- [ ] Test cryptographic functions
- [ ] Document implementation details

### Day 10: Protocol Testing & Attack Demo Prep

#### All Members Together (Morning - 3 hours)
- [ ] Integrate key exchange into application
- [ ] Test complete flow:
  1. User A initiates key exchange with User B
  2. Both users exchange messages
  3. Session key derived on both sides
  4. Verify both have same session key (test with encryption)
- [ ] Test error cases:
  - Invalid signature
  - Expired timestamp
  - Replayed nonce
  - Network failure mid-exchange

#### Member 1 Tasks (Afternoon)
- [ ] Prepare MITM attack demonstration
- [ ] Create "vulnerable protocol" version (no signatures)
- [ ] Document attack methodology
- [ ] Create attack script or BurpSuite configuration

#### Member 2 Tasks (Afternoon)
- [ ] Add UI for key exchange status
  - Show "Establishing secure connection..."
  - Show "Secure channel established ✓"
  - Show errors if exchange fails
- [ ] Add key rotation option
- [ ] Implement session timeout

#### Member 3 Tasks (Afternoon)
- [ ] Review and test all backend endpoints
- [ ] Ensure proper logging of key exchange events
- [ ] Add monitoring for failed exchanges
- [ ] Test concurrent key exchanges

---

## 🗓️ PHASE 6: E2EE Messaging System (Days 11-13)

### Day 11: Message Encryption Implementation

#### Member 2 Tasks (Full Day - Lead)
- [ ] Create `crypto/encryption.js` module
- [ ] Implement message encryption
  ```javascript
  async function encryptMessage(sessionKey, plaintext, sequenceNumber) {
    // Generate random IV (12 bytes for GCM)
    // Create nonce (timestamp + random)
    // Encrypt with AES-256-GCM
    // Return {
    //   ciphertext,
    //   iv,
    //   authTag,
    //   nonce,
    //   timestamp,
    //   sequenceNumber
    // }
  }
  ```

- [ ] Implement message decryption
  ```javascript
  async function decryptMessage(sessionKey, encryptedData) {
    // Verify timestamp (not too old)
    // Verify nonce (not replayed)
    // Verify sequence number (incremental)
    // Decrypt with AES-256-GCM
    // Verify auth tag
    // Return plaintext or throw error
  }
  ```

- [ ] Implement replay protection
  ```javascript
  class ReplayProtection {
    constructor() {
      this.seenNonces = new Set();
      this.lastSequenceNumber = 0;
    }
    
    checkMessage(nonce, timestamp, sequenceNumber) {
      // Check nonce not seen before
      // Check timestamp within acceptable window (e.g., 5 minutes)
      // Check sequence number > last seen
      // Return true if valid, false if replay attack detected
    }
  }
  ```

- [ ] Integrate into chat UI
  - Encrypt before sending
  - Decrypt after receiving
  - Show decryption errors

#### Member 3 Tasks (Day 11)
- [ ] Create message storage endpoints
  ```
  POST /api/messages/send
  GET /api/messages/:userId (get messages for user)
  ```
- [ ] Implement message forwarding
  - Receive encrypted message from sender
  - Store ciphertext + metadata in MongoDB
  - Forward to recipient (if online via WebSocket)
- [ ] Ensure server never logs plaintext
- [ ] Add message encryption logging

#### Member 1 Tasks (Day 11)
- [ ] Review encryption implementation
- [ ] Verify AES-GCM parameters
  - 256-bit key
  - 96-bit (12 byte) IV
  - Authentication tag included
- [ ] Test replay protection logic
- [ ] Document message security properties

### Day 12: Real-time Messaging with WebSockets

#### Member 3 Tasks (Full Day)
- [ ] Set up Socket.io
  ```bash
  npm install socket.io
  ```
- [ ] Implement WebSocket server
  ```javascript
  // Events:
  // - "user:connect"
  // - "user:disconnect"
  // - "message:send"
  // - "message:receive"
  // - "typing:start"
  // - "typing:stop"
  ```
- [ ] Implement user presence tracking
- [ ] Forward encrypted messages in real-time
- [ ] Handle offline users (store and forward)

#### Member 2 Tasks (Full Day)
- [ ] Integrate Socket.io client
  ```bash
  npm install socket.io-client
  ```
- [ ] Connect to WebSocket on login
- [ ] Listen for incoming encrypted messages
- [ ] Decrypt and display messages in real-time
- [ ] Implement typing indicators
- [ ] Add message status (sent, delivered, read)
- [ ] Handle connection errors

#### Member 1 Tasks (Day 12)
- [ ] Test end-to-end message flow
- [ ] Verify no plaintext in transit
- [ ] Use Wireshark to capture packets
- [ ] Verify all messages are encrypted
- [ ] Document findings with screenshots

### Day 13: Message UI & Features

#### Member 2 Tasks (Full Day)
- [ ] Build complete chat interface
  - Contact list
  - Message history
  - Message input
  - File attachment button
- [ ] Add message features:
  - Message timestamps
  - Read receipts
  - Delete messages (local only)
  - Copy message text
- [ ] Implement conversation list
- [ ] Add search functionality
- [ ] Polish UI/UX

#### Member 3 Tasks (Day 13)
- [ ] Optimize database queries
- [ ] Add pagination for message history
- [ ] Implement message deletion
- [ ] Add user search functionality
- [ ] Performance testing

#### Member 1 Tasks (Day 13)
- [ ] Conduct security review of messaging system
- [ ] Test replay attack protection
- [ ] Document all security measures
- [ ] Prepare attack demonstration scripts

---

## 🗓️ PHASE 7: Secure File Sharing (Days 14-15)

### Day 14: File Encryption Implementation

#### Member 2 Tasks (Full Day - Lead)
- [ ] Create `crypto/fileEncryption.js` module
- [ ] Implement file chunking
  ```javascript
  function chunkFile(file, chunkSize = 1024 * 1024) {
    // Split file into 1MB chunks
    // Return array of ArrayBuffers
  }
  ```

- [ ] Implement chunk encryption
  ```javascript
  async function encryptFileChunk(sessionKey, chunkData, chunkIndex) {
    // Generate unique IV for each chunk
    // Encrypt with AES-256-GCM
    // Return { encryptedChunk, iv, authTag, chunkIndex }
  }
  ```

- [ ] Implement file upload flow
  ```javascript
  async function uploadEncryptedFile(file, recipientId, sessionKey) {
    // 1. Generate unique file ID
    // 2. Chunk file
    // 3. Encrypt each chunk
    // 4. Upload chunks to server
    // 5. Send file metadata to recipient
  }
  ```

- [ ] Create file upload UI component
  - File selector
  - Upload progress bar
  - File preview (for images)
  - Cancel upload option

#### Member 3 Tasks (Day 14)
- [ ] Create file storage endpoints
  ```
  POST /api/files/upload (chunk upload)
  GET /api/files/:fileId/chunks
  DELETE /api/files/:fileId
  ```
- [ ] Implement file metadata storage
  ```javascript
  {
    fileId: "uuid",
    uploaderId: ObjectId,
    recipientId: ObjectId,
    fileName: "encrypted_filename",
    fileSize: Number,
    chunkCount: Number,
    encryptedChunks: [
      { chunkIndex, ciphertext, iv, authTag }
    ],
    uploadedAt: Date
  }
  ```
- [ ] Set up file storage (local filesystem or cloud)
- [ ] Add file access logging

#### Member 1 Tasks (Day 14)
- [ ] Review file encryption implementation
- [ ] Verify chunk encryption security
- [ ] Test file encryption with different file types
- [ ] Document file encryption flow

### Day 15: File Download & Decryption

#### Member 2 Tasks (Full Day)
- [ ] Implement file download flow
  ```javascript
  async function downloadAndDecryptFile(fileId, sessionKey) {
    // 1. Get file metadata from server
    // 2. Download all encrypted chunks
    // 3. Decrypt each chunk
    // 4. Reassemble file
    // 5. Create blob and download
  }
  ```

- [ ] Implement chunk decryption
  ```javascript
  async function decryptFileChunk(sessionKey, encryptedChunk) {
    // Decrypt with AES-256-GCM
    // Verify auth tag
    // Return decrypted chunk
  }
  ```

- [ ] Create file download UI
  - File list (received files)
  - Download button
  - Download progress
  - Preview option
- [ ] Handle large files efficiently
- [ ] Add error handling (corrupted chunks)

#### Member 3 Tasks (Day 15)
- [ ] Optimize file chunk retrieval
- [ ] Implement streaming download
- [ ] Add file expiration (optional)
- [ ] Test with various file sizes
- [ ] Add file download logging

#### Member 1 Tasks (Day 15)
- [ ] Test file encryption/decryption with various files
  - Text files
  - Images (JPG, PNG)
  - PDFs
  - Large files (>10MB)
- [ ] Verify no plaintext files on server
- [ ] Document file security measures
- [ ] Capture Wireshark traces of file uploads

---

## 🗓️ PHASE 8: Attack Demonstrations (Days 16-17)

**⚠️ CRITICAL PHASE - Worth 15 marks total**

### Day 16: MITM Attack Demonstration

#### Member 1 Tasks (Full Day - Lead)

**Part 1: Create Vulnerable Version**
- [ ] Create branch `vulnerable-protocol`
- [ ] Remove signature verification from key exchange
- [ ] Deploy vulnerable version locally

**Part 2: Perform MITM Attack**
- [ ] Set up attack environment
  - Install BurpSuite Community Edition
  - Configure browser to use Burp as proxy
  - Enable SSL/TLS interception
  
- [ ] Execute MITM attack on vulnerable version
  ```
  1. Start two clients (Alice and Bob)
  2. Alice initiates key exchange with Bob
  3. Burp intercepts ECDH public keys
  4. Attacker replaces keys with their own
  5. Attacker can now decrypt all messages
  ```

- [ ] Capture evidence:
  - [ ] Screenshots of BurpSuite intercepting traffic
  - [ ] Screenshot showing decrypted messages
  - [ ] Wireshark packet capture
  - [ ] Detailed explanation of attack

**Part 3: Demonstrate Defense**
- [ ] Switch to main branch (with signatures)
- [ ] Attempt same MITM attack
- [ ] Show attack failure:
  - Signature verification fails
  - Connection rejected
  - Security log shows "Invalid signature detected"
- [ ] Capture evidence:
  - [ ] Screenshots showing failed attack
  - [ ] Logs showing signature verification
  - [ ] Comparison: before vs after signatures

- [ ] Document findings in `docs/security/MITM_ATTACK_DEMO.md`

#### Member 2 & 3 Tasks (Day 16)
- [ ] Assist with attack setup
- [ ] Test vulnerable version
- [ ] Help capture screenshots
- [ ] Review documentation

### Day 17: Replay Attack Demonstration

#### Member 1 Tasks (Full Day - Lead)

**Part 1: Create Vulnerable Version**
- [ ] Create branch `no-replay-protection`
- [ ] Remove nonce/sequence number checks
- [ ] Deploy vulnerable version

**Part 2: Perform Replay Attack**
- [ ] Set up attack environment
  - Use Burp Repeater OR custom script
  
- [ ] Execute replay attack
  ```
  1. Capture legitimate encrypted message
  2. Resend same message multiple times
  3. Observe duplicate messages appearing
  ```

- [ ] Create attack script (Python/Node.js)
  ```python
  # Pseudocode
  # 1. Capture POST request to /api/messages/send
  # 2. Store request body (encrypted message)
  # 3. Resend same request 10 times
  # 4. Observe behavior
  ```

- [ ] Capture evidence:
  - [ ] Screenshot of duplicate messages
  - [ ] Wireshark showing replayed packets
  - [ ] Attack script code
  - [ ] Explanation

**Part 3: Demonstrate Defense**
- [ ] Switch to main branch (with replay protection)
- [ ] Attempt same replay attack
- [ ] Show attack failure:
  - First message: accepted
  - Replayed messages: rejected
  - Security log: "Replay attack detected - nonce already seen"
  - Sequence number out of order
- [ ] Capture evidence:
  - [ ] Screenshot showing rejection
  - [ ] Logs showing replay detection
  - [ ] Console errors on client
  - [ ] Comparison before/after

- [ ] Document findings in `docs/security/REPLAY_ATTACK_DEMO.md`

#### Member 2 Tasks (Day 17)
- [ ] Test replay protection thoroughly
- [ ] Verify nonce tracking works correctly
- [ ] Test sequence number validation
- [ ] Test timestamp validation (old messages rejected)
- [ ] Document replay protection mechanisms

#### Member 3 Tasks (Day 17)
- [ ] Review security logs for attack evidence
- [ ] Ensure all attacks are logged properly
- [ ] Test log query functionality
- [ ] Create log analysis report
- [ ] Document logging system

---

## 🗓️ PHASE 9: Logging & Threat Modeling (Days 18-19)

### Day 18: Security Logging System

#### Member 3 Tasks (Full Day - Lead)
- [ ] Create comprehensive logging system
- [ ] Log categories:

**Authentication Logs**
```javascript
{
  eventType: "AUTH_SUCCESS" | "AUTH_FAILURE",
  userId: "...",
  timestamp: Date,
  ipAddress: "...",
  userAgent: "..."
}
```

**Key Exchange Logs**
```javascript
{
  eventType: "KEY_EXCHANGE_INIT" | "KEY_EXCHANGE_COMPLETE" | "KEY_EXCHANGE_FAILED",
  initiatorId: "...",
  responderId: "...",
  timestamp: Date,
  failureReason: "..." // if failed
}
```

**Security Event Logs**
```javascript
{
  eventType: "REPLAY_ATTACK_DETECTED" | "INVALID_SIGNATURE" | "DECRYPTION_FAILED",
  userId: "...",
  timestamp: Date,
  details: Object,
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}
```

**Message Logs (metadata only)**
```javascript
{
  eventType: "MESSAGE_SENT" | "MESSAGE_RECEIVED" | "MESSAGE_FAILED",
  senderId: "...",
  receiverId: "...",
  timestamp: Date,
  messageId: "..."
  // NO PLAINTEXT CONTENT
}
```

- [ ] Create log query API
  ```
  GET /api/logs?eventType=...&userId=...&startDate=...&endDate=...
  ```
- [ ] Implement log rotation (keep last 30 days)
- [ ] Create log viewer UI (admin panel)

#### Member 2 Tasks (Day 18)
- [ ] Build log viewer component
- [ ] Display logs in table format
- [ ] Add filtering and search
- [ ] Show security alerts prominently
- [ ] Add data visualization (charts for security events)

#### Member 1 Tasks (Day 18)
- [ ] Review logging implementation
- [ ] Ensure no sensitive data is logged
- [ ] Test log queries
- [ ] Document logging system
- [ ] Create log analysis guide

### Day 19: STRIDE Threat Modeling

#### All Members Together (Full Day)

**Step 1: Identify System Components**
- [ ] List all components:
  - User authentication
  - Key generation
  - Key exchange protocol
  - Message encryption
  - File encryption
  - Client storage (IndexedDB)
  - Server API
  - Database
  - Network communication

**Step 2: Apply STRIDE to Each Component**

Create comprehensive threat model table:

| Component | Threat Type | Specific Threat | Risk Level | Mitigation | Implementation Status |
|-----------|-------------|-----------------|------------|------------|---------------------|
| User Auth | Spoofing | Attacker impersonates user | HIGH | Password hashing (argon2) + JWT | ✅ Implemented |
| User Auth | Tampering | Password database compromise | CRITICAL | Salted hashes, no plaintext | ✅ Implemented |
| Key Exchange | Spoofing | MITM replaces public keys | CRITICAL | Digital signatures (ECDSA) | ✅ Implemented |
| Key Exchange | Repudiation | User denies initiating exchange | MEDIUM | Signatures + timestamps + logs | ✅ Implemented |
| Key Exchange | Info Disclosure | Attacker learns session key | CRITICAL | Forward secrecy (ephemeral ECDH) | ✅ Implemented |
| Messages | Tampering | Attacker modifies ciphertext | HIGH | AES-GCM auth tags | ✅ Implemented |
| Messages | Repudiation | Replay attack | MEDIUM | Nonce + timestamp + sequence# | ✅ Implemented |
| Messages | Info Disclosure | Server admin reads messages | CRITICAL | E2EE (server sees only ciphertext) | ✅ Implemented |
| Client Storage | Info Disclosure | Malware steals private key | HIGH | Private key encrypted at rest | ✅ Implemented |
| Client Storage | Tampering | Attacker modifies stored keys | MEDIUM | Integrity checks on key retrieval | ⚠️ Partial |
| Server DB | Info Disclosure | Database breach | CRITICAL | Only ciphertext stored | ✅ Implemented |
| Server DB | Tampering | Attacker modifies messages | MEDIUM | Client verifies auth tags | ✅ Implemented |
| Network | Info Disclosure | Packet sniffing | HIGH | HTTPS + E2EE | ✅ Implemented |
| Network | Denial of Service | Flood server with requests | MEDIUM | Rate limiting | ⚠️ Basic implementation |
| File Transfer | Info Disclosure | Server admin reads files | CRITICAL | Client-side encryption | ✅ Implemented |
| File Transfer | Tampering | Attacker corrupts chunks | HIGH | Per-chunk auth tags | ✅ Implemented |

**Step 3: Analyze Attack Surface**
- [ ] Map data flow diagrams
- [ ] Identify trust boundaries
- [ ] Document assumptions
- [ ] Prioritize threats by risk level

**Step 4: Document Countermeasures**
- [ ] For each threat, document:
  - Countermeasure implemented
  - Why it's effective
  - Limitations (if any)
  - Testing evidence

**Step 5: Create Threat Model Report**
- [ ] Write comprehensive threat model document
- [ ] Include diagrams (data flow, trust boundaries)
- [ ] File: `docs/security/THREAT_MODEL.md`

---

## 🗓️ PHASE 10: Final Documentation & Testing (Days 20-22)

### Day 20: Project Report Writing

#### All Members Together (Full Day)

Create final report with following structure:

**1. Executive Summary**
- [ ] Project overview
- [ ] Key features
- [ ] Security highlights
- [ ] Team contributions

**2. Introduction**
- [ ] Problem statement
- [ ] Objectives
- [ ] Scope and limitations
- [ ] Report organization

**3. System Architecture**
- [ ] High-level architecture diagram
- [ ] Component descriptions
- [ ] Technology stack justification
- [ ] Deployment architecture

**4. Cryptographic Design**
- [ ] Algorithm selection and justification
  - Why ECC P-256? (security vs performance)
  - Why AES-256-GCM? (authenticated encryption)
  - Why HKDF? (proper key derivation)
- [ ] Key management
  - Generation
  - Storage
  - Distribution
  - Rotation
- [ ] Encryption workflows with diagrams

**5. Custom Key Exchange Protocol**
- [ ] Protocol specification
- [ ] Message flow diagram (detailed)
- [ ] Step-by-step explanation
- [ ] Security properties:
  - Forward secrecy
  - Mutual authentication
  - Replay protection
- [ ] Comparison with standard protocols (DH, TLS)
- [ ] Why your variant is secure

**6. Implementation Details**
- [ ] Frontend architecture
- [ ] Backend architecture
- [ ] Database schema
- [ ] API design
- [ ] Client-side cryptography implementation

**7. Security Features**
- [ ] End-to-end encryption
- [ ] Replay attack protection (with examples)
- [ ] MITM attack resistance (with examples)
- [ ] Secure key storage
- [ ] Authentication security
- [ ] Logging and auditing

**8. Attack Demonstrations**
- [ ] MITM Attack
  - Vulnerable version behavior
  - Attack execution (screenshots)
  - Logs showing attack
  - Protected version behavior
  - Defense mechanism explanation
- [ ] Replay Attack
  - Vulnerable version behavior
  - Attack execution (screenshots)
  - Logs showing attack
  - Protected version behavior
  - Defense mechanism explanation

**9. Threat Modeling**
- [ ] STRIDE analysis (complete table)
- [ ] Data flow diagrams
- [ ] Trust boundaries
- [ ] Risk assessment
- [ ] Mitigation strategies

**10. Security Audit Logs**
- [ ] Sample logs from different scenarios
- [ ] Log analysis
- [ ] Security event statistics

**11. Testing & Validation**
- [ ] Functional testing results
- [ ] Security testing results
- [ ] Performance testing (if applicable)
- [ ] Packet captures (Wireshark screenshots)

**12. Limitations & Future Work**
- [ ] Known limitations
- [ ] Potential improvements
- [ ] Scalability considerations
- [ ] Future features

**13. Conclusion**
- [ ] Summary of achievements
- [ ] Learning outcomes
- [ ] Final thoughts

**14. References**
- [ ] Academic papers
- [ ] RFCs (RFC 5869 for HKDF, etc.)
- [ ] Documentation (Web Crypto API, etc.)

**15. Appendices**
- [ ] Code snippets (key functions)
- [ ] Complete protocol specification
- [ ] Database schemas
- [ ] API documentation

#### Task Division
- **Member 1**: Sections 4, 5, 8, 9 (crypto & security)
- **Member 2**: Sections 3, 6, 11 (architecture & frontend)
- **Member 3**: Sections 6, 7, 10 (backend & logs)
- **All together**: Sections 1, 2, 12, 13

### Day 21: Video Demonstration Preparation

#### All Members Together (Full Day)

**Step 1: Script Writing (Morning)**
- [ ] Write detailed video script (10-15 minutes)

**Example Script Structure:**
```
[0:00-1:00] Introduction
- Team introduction
- Project overview
- Technologies used

[1:00-2:30] System Architecture
- Show architecture diagram
- Explain E2EE concept
- Show data flow

[2:30-4:30] Key Exchange Protocol
- Explain custom protocol
- Show protocol diagram
- Walkthrough message flow
- Highlight security properties

[4:30-6:00] Live Demo - Registration & Key Generation
- Register two users (Alice & Bob)
- Show key generation in browser console
- Verify public key sent to server
- Verify private key stored locally (show IndexedDB)

[6:00-8:00] Live Demo - Encrypted Messaging
- Alice sends message to Bob
- Show encryption in network tab
- Show ciphertext in database (MongoDB Compass)
- Bob receives and decrypts
- Show plaintext only on client

[8:00-9:30] Live Demo - File Sharing
- Alice uploads encrypted file
- Show chunking and encryption process
- Verify encrypted chunks on server
- Bob downloads and decrypts
- File opens correctly

[9:30-11:30] Attack Demonstrations
- MITM Attack
  - Show vulnerable version
  - Execute attack with BurpSuite
  - Show attack success
  - Switch to protected version
  - Show attack failure
  - Explain defense (signatures)
- Replay Attack
  - Capture message
  - Replay it
  - Show rejection
  - Show logs detecting replay

[11:30-13:00] Security Features
- Show threat model diagram
- Explain STRIDE analysis
- Show security logs
- Demonstrate log viewer

[13:00-14:00] Code Walkthrough (Brief)
- Show key encryption function
- Show signature verification
- Show replay protection logic

[14:00-15:00] Conclusion
- Summary of achievements
- Lessons learned
- Q&A preparation
```

**Step 2: Record Video (Afternoon)**
- [ ] Set up recording environment
  - Use OBS Studio or Zoom
  - Test audio quality
  - Screen resolution: 1920x1080
  - Record browser, code editor, and tools
- [ ] Do dry run
- [ ] Record full demonstration
- [ ] Record multiple takes if needed

**Step 3: Video Editing (Evening)**
- [ ] Edit video
  - Add title slide
  - Add transitions
  - Add annotations/highlights
  - Add background music (optional)
  - Add subtitles (optional)
- [ ] Final review
- [ ] Export (MP4, H.264, 1080p)

### Day 22: Final Testing & Submission

#### Morning: Final Testing

**Member 2 Tasks**
- [ ] Test entire frontend flow
  - Registration
  - Login
  - Key exchange
  - Messaging
  - File sharing
- [ ] Fix any UI bugs
- [ ] Test on different browsers
- [ ] Test responsive design
- [ ] Clear all console errors

**Member 3 Tasks**
- [ ] Test all backend endpoints
- [ ] Verify database integrity
- [ ] Test error handling
- [ ] Test concurrent users
- [ ] Review all security logs
- [ ] Backup database

**Member 1 Tasks**
- [ ] Final security review
- [ ] Verify all cryptographic implementations
- [ ] Test all attack demos one more time
- [ ] Review report for accuracy
- [ ] Check all diagrams

#### Afternoon: GitHub Repository Preparation

**All Members**
- [ ] Clean up repository
  ```bash
  # Remove node_modules
  # Remove .env files
  # Remove build artifacts
  # Remove temporary files
  ```

- [ ] Verify .gitignore
  ```
  node_modules/
  .env
  build/
  dist/
  *.log
  .DS_Store
  ```

- [ ] Update main README.md with:
  - [ ] Setup instructions
  - [ ] Prerequisites
  - [ ] Installation steps
  - [ ] Running the application
  - [ ] Testing instructions
  - [ ] Project structure
  - [ ] Team members
  - [ ] License

- [ ] Create setup documentation
  ```markdown
  # Setup Instructions
  
  ## Prerequisites
  - Node.js v16+
  - MongoDB v5+
  - Modern browser (Chrome/Firefox)
  
  ## Installation
  
  ### Backend
  ```bash
  cd server
  npm install
  cp .env.example .env  # Configure your settings
  npm start
  ```
  
  ### Frontend
  ```bash
  cd client
  npm install
  npm start
  ```
  
  ## Testing
  - Open http://localhost:3000
  - Register two users
  - Test messaging and file sharing
  ```

- [ ] Add screenshots to README
- [ ] Add architecture diagrams to README

#### Final Checks

- [ ] **Report Checklist**
  - [ ] All sections complete
  - [ ] All diagrams included
  - [ ] All screenshots included
  - [ ] Page numbers
  - [ ] Table of contents
  - [ ] References formatted
  - [ ] No spelling errors
  - [ ] PDF generated
  - [ ] File size < 20MB

- [ ] **Code Checklist**
  - [ ] All code commented
  - [ ] No TODO comments left
  - [ ] No console.log in production code
  - [ ] All dependencies documented
  - [ ] Code formatted consistently
  - [ ] No hardcoded secrets

- [ ] **Video Checklist**
  - [ ] Duration: 10-15 minutes
  - [ ] Clear audio
  - [ ] Clear visuals
  - [ ] All features demonstrated
  - [ ] Attacks demonstrated
  - [ ] File format: MP4
  - [ ] File size manageable for submission

- [ ] **Repository Checklist**
  - [ ] All members have commits
  - [ ] Commit messages meaningful
  - [ ] No sensitive data
  - [ ] README complete
  - [ ] License added
  - [ ] Clean history

- [ ] **Deliverables Ready**
  - [ ] Project report (PDF)
  - [ ] Video demonstration (MP4)
  - [ ] GitHub repository link
  - [ ] Source code (zipped backup)

#### Submission
- [ ] Submit all deliverables as per instructor's requirements
- [ ] Keep backup copies
- [ ] Prepare for presentation/viva (if required)

---

## 📊 Daily Time Commitment

**Per Member**: 4-6 hours/day
**Total Project Time**: ~300 hours (100 hours per member)

## 🚨 Critical Success Factors

1. **Start Early** - Don't wait until last week
2. **Daily Commits** - Show consistent progress
3. **Communication** - Daily standups (15 min)
4. **Code Reviews** - Review each other's code
5. **Documentation** - Document as you build
6. **Testing** - Test continuously, not at the end
7. **Uniqueness** - Make sure your protocol is different from other groups
8. **Evidence** - Capture screenshots and logs as you go
9. **Backup** - Backup work daily
10. **Time Buffer** - Finish 1-2 days early for unexpected issues

## ⚠️ Common Pitfalls to Avoid

1. ❌ Storing private keys on server
2. ❌ Using weak key sizes (< 2048 bits for RSA)
3. ❌ Reusing IVs
4. ❌ Not verifying signatures
5. ❌ Logging plaintext
6. ❌ Copying code from other groups
7. ❌ Using pre-built crypto libraries
8. ❌ Not testing attacks
9. ❌ Incomplete documentation
10. ❌ Last-minute rush

---

## 🎯 Success Metrics

### Functional Correctness (20 marks)
- ✅ Registration works
- ✅ Login works
- ✅ Key generation works
- ✅ Messaging works end-to-end
- ✅ File sharing works
- ✅ No crashes or critical bugs

### Cryptographic Design (20 marks)
- ✅ Correct algorithms used
- ✅ Proper key sizes
- ✅ Secure key storage
- ✅ No plaintext leakage
- ✅ All crypto operations client-side

### Key Exchange Protocol (15 marks)
- ✅ Custom design (not copied)
- ✅ Complete specification
- ✅ Detailed diagrams
- ✅ Security properties documented
- ✅ Implementation matches design

### Attack Demonstrations (15 marks)
- ✅ MITM attack demonstrated (8 marks)
- ✅ Replay attack demonstrated (7 marks)
- ✅ Real logs and screenshots
- ✅ Clear explanations

### Threat Modeling (10 marks)
- ✅ Complete STRIDE analysis
- ✅ All components covered
- ✅ Mitigations mapped to threats
- ✅ Professional documentation

### Logging & Auditing (5 marks)
- ✅ Comprehensive logging
- ✅ No sensitive data logged
- ✅ Queryable logs
- ✅ Log viewer implemented

### UI/UX (5 marks)
- ✅ Professional appearance
- ✅ Intuitive interface
- ✅ Good user experience
- ✅ Responsive design

### Code Quality (10 marks)
- ✅ Clean code
- ✅ Well documented
- ✅ Proper structure
- ✅ Equal contributions
- ✅ Original work

---

## 📞 Support Resources

- **Web Crypto API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- **HKDF RFC**: https://tools.ietf.org/html/rfc5869
- **AES-GCM**: https://csrc.nist.gov/publications/detail/sp/800-38d/final
- **ECDH**: https://tools.ietf.org/html/rfc6090
- **STRIDE**: Microsoft Threat Modeling

---

**Good luck with your project! 🚀**

