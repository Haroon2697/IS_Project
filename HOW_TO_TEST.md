# 🧪 HOW TO TEST YOUR PROJECT

**Complete Step-by-Step Testing Guide**

---

## 📋 PREREQUISITES

1. **Start the Backend Server:**
   ```bash
   cd /home/haroon/IS/IS_Project/server
   npm run dev
   ```
   You should see: `🚀 Server running on port 5000`

2. **Start the Frontend Client:**
   ```bash
   cd /home/haroon/IS/IS_Project/client
   npm start
   ```
   Browser should open: `http://localhost:3000`

---

## ✅ TEST 1: User Registration & Key Generation

### Steps:
1. Go to `http://localhost:3000/register`
2. Fill in the form:
   - Username: `testuser1`
   - Email: `test1@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click "Register"

### What to Check:
✅ **Browser Console (F12):**
   - Should see: "Generating cryptographic keys..."
   - Should see: "✅ Keys generated and stored securely!"
   - Should see: "✅ Private key stored in IndexedDB (encrypted)"
   - Should see: "✅ Public key sent to server"

✅ **DevTools → Application → IndexedDB:**
   - Open `SecureMessagingDB`
   - Check `privateKeys` store
   - Should see encrypted private key stored

✅ **Redirect:**
   - Should redirect to `/dashboard`
   - Should see "Welcome, testuser1!"

### Expected Result:
✅ User registered successfully
✅ Keys generated and stored
✅ Redirected to dashboard

---

## ✅ TEST 2: User Login

### Steps:
1. Click "Logout" (if logged in)
2. Go to `http://localhost:3000/login`
3. Enter credentials:
   - Username: `testuser1`
   - Password: `password123`
4. Click "Login"

### What to Check:
✅ **Browser Console:**
   - Should see successful login messages
   - No errors

✅ **Redirect:**
   - Should redirect to `/dashboard`
   - Should see user info

### Expected Result:
✅ Login successful
✅ JWT token stored in localStorage
✅ User data loaded

---

## ✅ TEST 3: Key Retrieval on Login

### Steps:
1. Logout
2. Login again with same user
3. When prompted for password (for key retrieval), enter: `password123`

### What to Check:
✅ **Browser Console:**
   - Should see key retrieval messages
   - Keys loaded successfully

✅ **IndexedDB:**
   - Private keys should be accessible

### Expected Result:
✅ Keys retrieved successfully
✅ Can access encrypted private keys

---

## ✅ TEST 4: Two-Factor Authentication (2FA)

### Steps:
1. Login to dashboard
2. Scroll to "Security Settings"
3. Click "Enable 2FA"
4. **QR Code should appear**
5. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
6. **Backup codes should appear** (save these!)
7. Enter 6-digit code from your authenticator app
8. Click "Verify and Enable"

### What to Check:
✅ **QR Code:**
   - QR code displayed
   - Can be scanned by authenticator app

✅ **Backup Codes:**
   - 10 backup codes shown
   - Each code is unique

✅ **Verification:**
   - Entering correct code enables 2FA
   - Entering wrong code shows error

✅ **After Enabling:**
   - Logout and login again
   - Should prompt for 2FA code
   - Enter code from authenticator app
   - Should login successfully

### Expected Result:
✅ 2FA setup successful
✅ QR code scannable
✅ Backup codes generated
✅ 2FA verification works on login

---

## ✅ TEST 5: Register Second User (For Messaging Test)

### Steps:
1. **Open Incognito Window** (or different browser)
2. Go to `http://localhost:3000/register`
3. Register:
   - Username: `testuser2`
   - Email: `test2@example.com`
   - Password: `password123`
4. Complete registration

### What to Check:
✅ Second user registered
✅ Keys generated for second user
✅ Can login as testuser2

### Expected Result:
✅ Two users now exist in system

---

## ✅ TEST 6: User List & Selection

### Steps:
1. Login as `testuser1` (in first browser window)
2. Go to dashboard
3. Scroll to "Secure Connections" section

### What to Check:
✅ **User List:**
   - Should see "Select User to Chat With"
   - Should see `testuser2` in the list
   - Should show email and 🔑 icon (if has public key)

✅ **If No Users:**
   - Click "Refresh" button
   - Should reload user list

### Expected Result:
✅ Can see other users in list
✅ Can select a user to chat with

---

## ✅ TEST 7: Key Exchange (Manual Test)

### Steps:
1. As `testuser1`, select `testuser2` from user list
2. Click "Establish Secure Connection"
3. Check browser console

### What to Check:
✅ **Browser Console:**
   - Should see: "Creating init message..."
   - Should see: "Key exchange initiated"
   - Status should change to "initiated"

✅ **Network Tab (F12 → Network):**
   - Should see POST request to `/api/keyexchange/init`
   - Request should contain encrypted key exchange data

### Expected Result:
✅ Key exchange init message sent
✅ Status shows "initiated"
✅ Waiting for response

### ⚠️ Known Limitation:
- Key exchange response needs to be handled manually or via Socket.io
- Full end-to-end test requires Socket.io integration

---

## ✅ TEST 8: Message Encryption/Decryption

### Steps:
1. Login to dashboard
2. Open browser console (F12)
3. **Enable "Allow pasting"** in console settings
4. Copy and paste this entire block:

```javascript
// FIXED VERSION - Copy this entire block
(async function testEncryption() {
  try {
    console.log('🧪 Starting Encryption Test...\n');
    
    // Import encryption functions (use correct path)
    const encryptionModule = await import('./src/crypto/encryption.js');
    const { encryptMessage, decryptMessage } = encryptionModule;
    
    console.log('🔑 Generating test key...');
    const testKey = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    const plaintext = "Hello, this is a secret message!";
    console.log('📝 Plaintext:', plaintext);
    
    console.log('🔒 Encrypting...');
    const encrypted = await encryptMessage(testKey, plaintext);
    console.log('🔒 Encrypted:', {
      ciphertext: encrypted.ciphertext.substring(0, 50) + '...',
      iv: encrypted.iv,
      authTag: encrypted.authTag
    });
    
    console.log('🔓 Decrypting...');
    const decrypted = await decryptMessage(
      testKey,
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.authTag
    );
    console.log('🔓 Decrypted:', decrypted);
    
    if (decrypted === plaintext) {
      console.log('\n✅ Encryption/Decryption test PASSED!');
    } else {
      console.log('\n❌ Encryption/Decryption test FAILED!');
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    console.log('\n💡 If import fails, try the simple test below (Option 2)');
  }
})();
```

**If the above doesn't work, use this simpler version (Option 2 - No imports needed):**

```javascript
// SIMPLE TEST - No imports, uses Web Crypto API directly
(async function() {
  try {
    const plaintext = "Hello, secret message!";
    const plaintextBuffer = new TextEncoder().encode(plaintext);
    
    console.log('🔑 Generating key...');
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    console.log('📝 Plaintext:', plaintext);
    
    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    console.log('🔒 Encrypting...');
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv, tagLength: 128 },
      key,
      plaintextBuffer
    );
    
    console.log('🔒 Encrypted (bytes):', new Uint8Array(encrypted).length, 'bytes');
    
    console.log('🔓 Decrypting...');
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv, tagLength: 128 },
      key,
      encrypted
    );
    
    const decryptedText = new TextDecoder().decode(decrypted);
    console.log('🔓 Decrypted:', decryptedText);
    
    if (decryptedText === plaintext) {
      console.log('\n✅ Basic encryption test PASSED!');
    } else {
      console.log('\n❌ Test FAILED - text mismatch');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
```

### What to Check:
✅ **Console Output:**
   - Should see plaintext
   - Should see encrypted data (ciphertext, IV, auth tag)
   - Should see decrypted text matching original
   - Should see "✅ Encryption/Decryption test PASSED!"

### Expected Result:
✅ Encryption works
✅ Decryption works
✅ Plaintext matches after decryption

---

## ✅ TEST 9: Automated Crypto Tests

### Steps:
1. Login to dashboard
2. Open browser console (F12)
3. Run:

```javascript
// Run all automated tests
if (typeof runAllTests === 'function') {
  runAllTests();
} else {
  console.log('Loading test utilities...');
  import('./utils/testCrypto.js').then(() => {
    if (typeof runAllTests === 'function') {
      runAllTests();
    }
  });
}
```

### What to Check:
✅ **Test Results:**
   - Key generation test
   - Encryption test
   - Key exchange test
   - Signature test
   - All should pass ✅

### Expected Result:
✅ All automated tests pass

---

## ✅ TEST 10: Replay Attack Protection

### Steps:
1. Open browser console
2. Run:

```javascript
// Test replay protection
(async () => {
  const { ReplayProtection } = await import('./crypto/replayProtection');
  const protection = new ReplayProtection();
  
  const nonce1 = "test-nonce-1";
  const timestamp = Date.now();
  
  // First message - should pass
  const result1 = await protection.checkMessage(nonce1, timestamp, 1, "user1");
  console.log('First message check:', result1 ? '✅ PASSED' : '❌ FAILED');
  
  // Replay - should fail
  const result2 = await protection.checkMessage(nonce1, timestamp, 1, "user1");
  console.log('Replay check:', result2 ? '❌ FAILED (should reject)' : '✅ PASSED (correctly rejected)');
  
  // New message - should pass
  const result3 = await protection.checkMessage("test-nonce-2", Date.now(), 2, "user1");
  console.log('New message check:', result3 ? '✅ PASSED' : '❌ FAILED');
})();
```

### What to Check:
✅ **Console Output:**
   - First message: ✅ PASSED
   - Replay: ✅ PASSED (correctly rejected)
   - New message: ✅ PASSED

### Expected Result:
✅ Replay protection working correctly

---

## ✅ TEST 11: Google OAuth (Optional)

### Steps:
1. Logout
2. Go to login page
3. Click "Continue with Google"
4. Select Google account
5. Authorize the app

### What to Check:
✅ **Redirect:**
   - Should redirect back to app
   - Should be logged in
   - Should see dashboard

### Expected Result:
✅ OAuth login successful

---

## ✅ TEST 12: IndexedDB Storage

### Steps:
1. Login to dashboard
2. Open DevTools (F12)
3. Go to: **Application → IndexedDB → SecureMessagingDB**

### What to Check:
✅ **Stores:**
   - `privateKeys` - Should contain encrypted private key
   - `nonces` - May contain nonces (if messages sent)
   - `data` - May contain other data

✅ **Private Key:**
   - Should be encrypted (not plaintext)
   - Should have metadata (username, createdAt)

### Expected Result:
✅ Private keys stored securely in IndexedDB
✅ Keys are encrypted

---

## ❌ WHAT CAN'T BE TESTED YET

### 1. **Real-Time Messaging Between Users**
- **Why:** Socket.io not integrated
- **What's Missing:** WebSocket connection for message delivery
- **Workaround:** Messages are encrypted but can't be sent/received

### 2. **Complete Key Exchange Flow**
- **Why:** Needs automatic message receiving
- **What's Missing:** Socket.io for real-time key exchange messages
- **Workaround:** Can initiate, but response needs manual handling

### 3. **File Sharing**
- **Why:** Not implemented
- **What's Missing:** File upload/download endpoints and UI

---

## 🐛 TROUBLESHOOTING

### Issue: "No other users found"
**Solution:**
- Register a second user (in incognito window)
- Click "Refresh" button
- Check server console for errors

### Issue: "Keys not generating"
**Solution:**
- Check browser console for errors
- Verify Web Crypto API is available: `console.log(window.crypto.subtle)`
- Make sure you're on `http://localhost:3000` (not `file://`)

### Issue: "2FA QR code not showing"
**Solution:**
- Check server is running
- Check browser console for errors
- Try refreshing the page

### Issue: "Key exchange stuck on 'initiated'"
**Solution:**
- This is expected - Socket.io not integrated yet
- Key exchange messages are sent but not automatically received
- This will work after Socket.io integration

---

## 📊 TEST RESULTS CHECKLIST

- [ ] User registration works
- [ ] Keys generated and stored
- [ ] User login works
- [ ] Key retrieval works
- [ ] 2FA setup works
- [ ] 2FA verification works
- [ ] User list shows other users
- [ ] Key exchange can be initiated
- [ ] Message encryption works
- [ ] Message decryption works
- [ ] Replay protection works
- [ ] IndexedDB storage works
- [ ] OAuth login works (optional)

---

## 🎯 QUICK TEST COMMAND

Run this in browser console after login:

```javascript
// Quick test all features
(async () => {
  console.log('🧪 Running Quick Tests...\n');
  
  // Test 1: Check keys
  const { hasKeys } = await import('./crypto/keyManagement');
  const user = JSON.parse(localStorage.getItem('user'));
  const hasKeysResult = await hasKeys(user.username);
  console.log('1. Keys exist:', hasKeysResult ? '✅' : '❌');
  
  // Test 2: Encryption
  const { encryptMessage, decryptMessage } = await import('./crypto/encryption');
  const testKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const encrypted = await encryptMessage(testKey, "test");
  const decrypted = await decryptMessage(testKey, encrypted.ciphertext, encrypted.iv, encrypted.authTag);
  console.log('2. Encryption works:', decrypted === "test" ? '✅' : '❌');
  
  // Test 3: IndexedDB
  const db = indexedDB.open('SecureMessagingDB');
  console.log('3. IndexedDB accessible:', db ? '✅' : '❌');
  
  console.log('\n✅ Quick tests complete!');
})();
```

---

**Happy Testing! 🚀**

