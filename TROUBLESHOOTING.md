# Troubleshooting Guide

## Common Issues and Solutions

### 1. Installation & Setup Issues

#### Issue: `npm install` fails
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### Issue: MongoDB connection fails
**Symptoms:** `MongooseError: Connection failed`

**Solutions:**
1. Check MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # Linux/Mac
   sudo systemctl start mongod
   ```

2. Verify connection string in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/secure_messaging
   ```

3. Check MongoDB Atlas (if using cloud):
   - Whitelist your IP address
   - Verify credentials
   - Check network access settings

#### Issue: Port already in use
**Symptoms:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

---

### 2. Web Crypto API Issues

#### Issue: `crypto.subtle is undefined`
**Cause:** Web Crypto API only available in secure contexts (HTTPS or localhost)

**Solution:**
- Development: Run on `localhost` (should work)
- Production: Must use HTTPS
- Check browser support: https://caniuse.com/cryptography

#### Issue: "Key generation failed"
**Debugging:**
```javascript
// Check if Web Crypto is available
if (!window.crypto || !window.crypto.subtle) {
  console.error("Web Crypto API not available");
}

// Try generating a key with error handling
try {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256"
    },
    true,
    ["sign", "verify"]
  );
  console.log("Key generation successful");
} catch (error) {
  console.error("Key generation failed:", error);
}
```

#### Issue: "Cannot export non-extractable key"
**Solution:**
```javascript
// Make sure extractable flag is set to true when generating
const keyPair = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,  // ← Must be true to export
  ["sign", "verify"]
);
```

---

### 3. IndexedDB Issues

#### Issue: "Unable to open database"
**Solution:**
1. Clear browser data (Database may be corrupted)
2. Check browser console for specific errors
3. Verify database name and version:
   ```javascript
   const request = indexedDB.open("SecureMessagingDB", 1);
   
   request.onerror = (event) => {
     console.error("Database error:", event.target.error);
   };
   ```

#### Issue: "Private key not found"
**Possible Causes:**
- User cleared browser data
- Different browser profile
- IndexedDB quota exceeded

**Solution:**
- Inform user their keys are lost
- Implement key re-generation
- Add warning about clearing browser data

#### Issue: Quota exceeded error
**Solution:**
```javascript
// Request persistent storage
if (navigator.storage && navigator.storage.persist) {
  const granted = await navigator.storage.persist();
  console.log(`Persistent storage: ${granted}`);
}

// Check available quota
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate();
  console.log(`Using ${estimate.usage} of ${estimate.quota} bytes`);
}
```

---

### 4. Encryption/Decryption Issues

#### Issue: "Decryption failed" / "Authentication tag mismatch"
**Possible Causes:**
1. Wrong session key
2. Corrupted ciphertext
3. IV mismatch
4. Tampered message

**Debugging:**
```javascript
async function decryptMessage(sessionKey, encryptedData) {
  try {
    console.log("Attempting decryption with:", {
      ivLength: encryptedData.iv.length,
      ciphertextLength: encryptedData.ciphertext.length,
      hasAuthTag: !!encryptedData.authTag
    });
    
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: encryptedData.iv
      },
      sessionKey,
      encryptedData.ciphertext
    );
    
    console.log("Decryption successful");
    return plaintext;
  } catch (error) {
    console.error("Decryption failed:", error);
    console.log("Session key:", sessionKey);
    console.log("IV:", encryptedData.iv);
    throw error;
  }
}
```

**Solution:**
- Verify session key is correctly derived on both sides
- Check IV is correctly transmitted
- Ensure ciphertext is not modified
- Verify both parties used same key exchange

#### Issue: IV reuse warning
**Problem:** Using same IV twice with same key breaks AES-GCM

**Solution:**
```javascript
// Always generate fresh random IV
function generateIV() {
  return crypto.getRandomValues(new Uint8Array(12)); // 96 bits
}

// Per message:
const iv = generateIV();
const ciphertext = await encrypt(sessionKey, plaintext, iv);
```

---

### 5. Key Exchange Issues

#### Issue: "Invalid signature" during key exchange
**Possible Causes:**
1. Public key mismatch
2. Message tampered
3. Incorrect signature algorithm
4. Data encoding issue

**Debugging:**
```javascript
// Log all values before signing
console.log("Creating signature for:", {
  publicKey: base64Encode(publicKey),
  nonce: base64Encode(nonce),
  timestamp: timestamp
});

// Verify signature immediately after creation
const dataToSign = concatenate(publicKey, nonce, timestamp);
const signature = await createSignature(privateKey, dataToSign);

// Test verification with same data
const isValid = await verifySignature(publicKey, signature, dataToSign);
console.log("Self-verification:", isValid); // Should be true
```

**Solution:**
- Ensure consistent data ordering in hash
- Use same encoding (e.g., UTF-8) on both sides
- Verify public key retrieved from server matches

#### Issue: "Nonce already seen" immediately
**Cause:** Client state not properly initialized

**Solution:**
```javascript
class ReplayProtection {
  constructor() {
    this.seenNonces = new Set();
    this.lastSequenceNumber = 0;
    this.sessionStart = Date.now();
  }
  
  reset() {
    this.seenNonces.clear();
    this.lastSequenceNumber = 0;
  }
}

// Reset on new session
replayProtection.reset();
```

#### Issue: "Timestamp expired"
**Possible Causes:**
- Clock skew between clients
- Old message from previous session

**Solution:**
```javascript
// Increase tolerance window (but not too much!)
const TIMESTAMP_TOLERANCE = 300000; // 5 minutes

function validateTimestamp(timestamp) {
  const now = Date.now();
  const diff = Math.abs(now - timestamp);
  
  if (diff > TIMESTAMP_TOLERANCE) {
    console.error(`Timestamp too old: ${diff}ms difference`);
    return false;
  }
  
  return true;
}
```

---

### 6. WebSocket / Real-time Messaging Issues

#### Issue: WebSocket connection fails
**Symptoms:** "WebSocket connection to 'ws://localhost:5000' failed"

**Solution:**
1. Check server is running
2. Verify Socket.io server configuration:
   ```javascript
   const io = require('socket.io')(server, {
     cors: {
       origin: "http://localhost:3000",
       methods: ["GET", "POST"]
     }
   });
   ```

3. Check client connection:
   ```javascript
   const socket = io('http://localhost:5000', {
     auth: {
       token: jwtToken
     }
   });
   
   socket.on('connect', () => {
     console.log('Connected:', socket.id);
   });
   
   socket.on('connect_error', (error) => {
     console.error('Connection error:', error);
   });
   ```

#### Issue: Messages not received in real-time
**Debugging:**
```javascript
// Server-side
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  socket.on('message:send', (data) => {
    console.log('Received message:', data);
    
    // Verify recipient is connected
    const recipientSocket = getSocketByUserId(data.receiverId);
    if (recipientSocket) {
      recipientSocket.emit('message:receive', data);
      console.log('Message forwarded to recipient');
    } else {
      console.log('Recipient not online, storing for later');
    }
  });
});

// Client-side
socket.on('message:receive', (data) => {
  console.log('Received message:', data);
  // Decrypt and display
});
```

---

### 7. CORS Issues

#### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Solution:**

**Backend (Express):**
```javascript
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true
}));
```

**Frontend:**
```javascript
axios.defaults.withCredentials = true;
```

---

### 8. JWT Authentication Issues

#### Issue: "Invalid token" / "jwt malformed"
**Debugging:**
```javascript
// Server-side
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token valid:', decoded);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

**Client-side:**
```javascript
// Store token
localStorage.setItem('token', token);

// Add to requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

---

### 9. Performance Issues

#### Issue: Slow encryption/decryption
**Solutions:**
1. Use Web Workers for large files:
   ```javascript
   // crypto-worker.js
   self.onmessage = async (e) => {
     const { operation, data, key } = e.data;
     
     if (operation === 'encrypt') {
       const result = await encryptData(data, key);
       self.postMessage({ result });
     }
   };
   
   // Main thread
   const worker = new Worker('crypto-worker.js');
   worker.postMessage({ operation: 'encrypt', data, key });
   ```

2. Implement chunking for large files
3. Use IndexedDB caching for session keys

#### Issue: High memory usage
**Solutions:**
- Clear old nonces from Set (keep only last hour)
- Limit message history in memory
- Implement pagination for chat history

```javascript
// Cleanup old nonces
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const [nonce, timestamp] of nonceMap.entries()) {
    if (timestamp < oneHourAgo) {
      nonceMap.delete(nonce);
    }
  }
}, 600000); // Every 10 minutes
```

---

### 10. Attack Demo Issues

#### Issue: BurpSuite can't intercept HTTPS
**Solution:**
1. Install Burp's CA certificate:
   - Burp → Proxy → Options → Import/export CA cert
   - Install in browser (Chrome settings → Certificates)

2. Configure browser proxy:
   - HTTP Proxy: 127.0.0.1
   - Port: 8080
   - Use for all protocols

#### Issue: Wireshark shows no packets
**Solution:**
1. Select correct interface (Loopback/localhost)
2. Use correct filter:
   ```
   tcp.port == 5000
   ```
3. Run Wireshark as administrator (Windows)

---

### 11. Browser-Specific Issues

#### Chrome
- **Issue:** "DOMException: QuotaExceededError"
  - **Solution:** Request persistent storage (see IndexedDB section)

#### Firefox
- **Issue:** Web Crypto limitations in private browsing
  - **Solution:** Use normal browsing mode for development

#### Safari
- **Issue:** IndexedDB issues in iOS
  - **Solution:** Test on latest iOS version, or use alternative storage

---

### 12. Git & Collaboration Issues

#### Issue: Merge conflicts
**Prevention:**
```bash
# Before starting work
git pull origin main

# Before committing
git pull origin main
# Resolve conflicts
git add .
git commit -m "Resolved conflicts"
```

#### Issue: Unequal commit distribution
**Solution:**
- Use feature branches
- Each member commits to their own branch
- Regular merges to main
- Use meaningful commit messages

```bash
# Example workflow
git checkout -b feature/key-exchange
# Make changes
git add .
git commit -m "Implement ECDH key derivation"
git push origin feature/key-exchange
# Create pull request
```

---

### 13. Testing Issues

#### Issue: Unit tests fail
**Debugging:**
```javascript
// Use try-catch for better error messages
describe('Encryption', () => {
  test('should encrypt and decrypt', async () => {
    try {
      const key = await generateKey();
      const plaintext = "Hello World";
      const encrypted = await encrypt(key, plaintext);
      const decrypted = await decrypt(key, encrypted);
      
      expect(decrypted).toBe(plaintext);
    } catch (error) {
      console.error("Test failed:", error);
      throw error;
    }
  });
});
```

---

### 14. Environment Variables

#### Issue: `.env` not loading
**Solution:**
```javascript
// server.js
require('dotenv').config();

console.log('Environment check:');
console.log('MongoDB URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ Missing');
console.log('JWT Secret:', process.env.JWT_SECRET ? '✓ Set' : '✗ Missing');
console.log('Port:', process.env.PORT || 5000);
```

**Verify `.env` file exists:**
```bash
# .env file should be in server/ directory
server/
├── .env          ← Must be here
├── server.js
└── package.json
```

---

### 15. Deployment Issues (If applicable)

#### Issue: App works locally but not on server
**Checklist:**
- [ ] Environment variables set on server
- [ ] MongoDB accessible from server
- [ ] HTTPS configured (required for Web Crypto)
- [ ] CORS configured for production domain
- [ ] Build files generated (`npm run build`)
- [ ] Node version matches development

---

## Getting Additional Help

### 1. Check Browser Console
Always check the browser console (F12) for error messages.

### 2. Check Server Logs
```bash
# Run server with verbose logging
DEBUG=* npm start
```

### 3. Check Network Tab
Use browser DevTools → Network tab to inspect:
- Request/response bodies
- Status codes
- Headers

### 4. Enable Debugging Logs
```javascript
// Add at top of file
const DEBUG = true;

function log(...args) {
  if (DEBUG) console.log('[DEBUG]', ...args);
}

// Use throughout code
log('Encrypting message:', plaintext.length, 'bytes');
```

### 5. Consult Documentation
- Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- Socket.io: https://socket.io/docs/
- Mongoose: https://mongoosejs.com/docs/

### 6. Ask Your Team
- Use your team communication channel
- Share error messages and screenshots
- Pair program on difficult issues

---

## Prevention Tips

1. **Commit frequently** - Small commits are easier to debug
2. **Test incrementally** - Don't build everything before testing
3. **Use version control** - Easy to rollback if something breaks
4. **Document as you go** - Write down what works and what doesn't
5. **Code reviews** - Have teammates review before merging

---

## Emergency Contacts

- **Instructor:** [Email]
- **TA:** [Email]
- **Team Lead:** [Name]

---

**Remember:** Most issues have been encountered by others. Search error messages online, check Stack Overflow, and don't hesitate to ask for help!

