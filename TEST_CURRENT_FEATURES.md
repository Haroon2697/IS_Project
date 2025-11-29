# 🧪 Testing Guide - Current Features

## ✅ What You Can Test Right Now:

1. **Key Generation** - During registration
2. **Key Storage** - In IndexedDB (browser)
3. **Key Retrieval** - During login
4. **Key Exchange Protocol** - Establish secure connection
5. **Message Encryption** - Encrypt/decrypt messages

---

## 🚀 Quick Test Steps

### Step 1: Start the Application

**Terminal 1 - Backend:**
```bash
cd /home/haroon/IS/IS_Project/server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /home/haroon/IS/IS_Project/client
npm start
```

### Step 2: Test Key Generation (Registration)

1. Open browser: http://localhost:3000
2. Click "Register here"
3. Fill in:
   - Username: `testuser1`
   - Email: `test1@example.com`
   - Password: `password123`
   - Confirm: `password123`
4. Click "Register"
5. **Open Browser DevTools (F12) → Console**
6. You should see:
   ```
   Generating cryptographic keys...
   ✅ Keys generated and stored securely!
   ✅ Private key stored in IndexedDB (encrypted)
   ✅ Public key sent to server
   ```

### Step 3: Verify Keys in IndexedDB

1. Open Browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **IndexedDB** → **SecureMessagingDB** → **keys**
4. You should see:
   - `userId`: "testuser1"
   - `encryptedPrivateKey`: (encrypted data)
   - `iv`: (initialization vector)
   - `salt`: (salt for key derivation)
5. **✅ Private key is encrypted and stored locally!**

### Step 4: Test Key Retrieval (Login)

1. Logout from dashboard
2. Login with:
   - Username: `testuser1`
   - Password: `password123`
3. **Open Console** - You should see:
   ```
   ✅ Private key retrieved and verified
   ```

### Step 5: Test Key Exchange (Two Users)

**Browser 1 (User 1):**
1. Register: `testuser1` / `password123`
2. Login and go to Dashboard
3. You'll see "Secure Connections" section

**Browser 2 (User 2) - Open in Incognito/Private window:**
1. Register: `testuser2` / `password123`
2. Login and go to Dashboard

**Note:** Key exchange requires both users to be online. For now, you can test the UI and see the key exchange initiation.

### Step 6: Test Message Encryption (Console)

1. Open Browser Console (F12)
2. Run these commands:

```javascript
// Import the encryption module
import { encryptMessage, decryptMessage } from './crypto/encryption';

// Generate a test session key (for testing only)
const testKey = await crypto.subtle.generateKey(
  {
    name: 'AES-GCM',
    length: 256,
  },
  true,
  ['encrypt', 'decrypt']
);

// Encrypt a test message
const encrypted = await encryptMessage(testKey, "Hello, this is a test message!");
console.log('Encrypted:', encrypted);

// Decrypt the message
const decrypted = await decryptMessage(testKey, encrypted.ciphertext, encrypted.iv, encrypted.authTag);
console.log('Decrypted:', decrypted);
```

You should see the encrypted data and then the original message decrypted.

---

## 🔍 Verification Checklist

### Key Generation:
- [ ] Keys generated during registration
- [ ] Console shows success messages
- [ ] No errors in console

### Key Storage:
- [ ] IndexedDB shows encrypted key data
- [ ] Private key is encrypted (not plaintext)
- [ ] IV and salt are present

### Key Retrieval:
- [ ] Keys retrieved on login
- [ ] Console shows verification message
- [ ] No errors

### Encryption:
- [ ] Can encrypt messages
- [ ] Can decrypt messages
- [ ] Encrypted data is different from plaintext

---

## 🐛 Troubleshooting

**Issue: "Keys not generating"**
- Check browser console for errors
- Make sure you're using HTTPS or localhost (Web Crypto API requirement)
- Check if browser supports Web Crypto API

**Issue: "IndexedDB not showing"**
- Make sure DevTools Application tab is open
- Refresh the page
- Check if IndexedDB is enabled in browser settings

**Issue: "Encryption errors"**
- Check if session key exists
- Verify key format is correct
- Check console for specific error messages

---

## 📊 Expected Results

### Successful Test Should Show:

1. **Registration:**
   - ✅ Keys generated
   - ✅ Keys stored in IndexedDB
   - ✅ Public key sent to server (check network tab)

2. **Login:**
   - ✅ Keys retrieved
   - ✅ Keys decrypted successfully
   - ✅ No errors

3. **Encryption:**
   - ✅ Messages encrypted
   - ✅ Ciphertext is different from plaintext
   - ✅ Messages decrypt correctly

---

**Ready to test!** Start with registration and check the console/IndexedDB to see keys being generated and stored.

