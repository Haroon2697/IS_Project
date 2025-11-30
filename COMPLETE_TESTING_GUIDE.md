# 🧪 COMPLETE TESTING GUIDE

**Step-by-Step Testing Instructions for Secure End-to-End Encrypted Messaging System**

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Test 1: User Registration](#test-1-user-registration)
4. [Test 2: User Login](#test-2-user-login)
5. [Test 3: Key Generation & Storage](#test-3-key-generation--storage)
6. [Test 4: Two-Factor Authentication](#test-4-two-factor-authentication)
7. [Test 5: User List & Selection](#test-5-user-list--selection)
8. [Test 6: Key Exchange Protocol](#test-6-key-exchange-protocol)
9. [Test 7: Real-Time Encrypted Messaging](#test-7-real-time-encrypted-messaging)
10. [Test 8: Security Verification](#test-8-security-verification)
11. [Troubleshooting](#troubleshooting)

---

## 🔧 PREREQUISITES

### Required Software:
- ✅ Node.js (v14 or higher)
- ✅ npm (comes with Node.js)
- ✅ Modern web browser (Chrome, Firefox, Edge)
- ✅ Authenticator app (Google Authenticator, Authy, etc.) - for 2FA testing

### Required Knowledge:
- Basic terminal/command line usage
- How to open browser DevTools (F12)

---

## 🚀 INITIAL SETUP

### Step 1: Start Backend Server

**Open Terminal 1:**
```bash
cd /home/haroon/IS/IS_Project/server
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 5000
🔌 Socket.io ready for connections
```

**✅ Verification:**
- Server should start without errors
- Should see "Socket.io ready for connections"
- If you see MongoDB errors, that's OK - it uses in-memory storage

---

### Step 2: Start Frontend Client

**Open Terminal 2 (NEW Terminal):**
```bash
cd /home/haroon/IS/IS_Project/client
npm start
```

**Expected Output:**
- Browser automatically opens at `http://localhost:3000`
- Or navigate manually to `http://localhost:3000`

**✅ Verification:**
- Browser opens successfully
- No errors in browser console (F12)
- Page loads without errors

---

## 👤 TEST 1: USER REGISTRATION

### Objective:
Verify that users can register and keys are generated correctly.

### Steps:

#### 1.1 Register First User (Alice)

1. **Navigate to Registration:**
   - Go to `http://localhost:3000/register`
   - Or click "Register" link if available

2. **Fill Registration Form:**
   - **Username:** `alice`
   - **Email:** `alice@example.com`
   - **Password:** `password123`
   - **Confirm Password:** `password123`

3. **Click "Register"**

4. **Check Browser Console (F12):**
   ```
   Generating cryptographic keys...
   ✅ Keys generated and stored securely!
   ✅ Private key stored in IndexedDB (encrypted)
   ✅ Public key sent to server
   ```

5. **Verify IndexedDB Storage:**
   - Open DevTools (F12)
   - Go to: **Application** → **IndexedDB** → **SecureMessagingDB** → **keys**
   - Should see an entry with encrypted private key
   - **Important:** Private key should be encrypted (not plaintext)

6. **Verify Server Logs:**
   ```
   [LOG] USER_REGISTERED - User: alice
   ```

**✅ Expected Results:**
- ✅ Registration successful
- ✅ Redirected to Dashboard
- ✅ Keys generated in console
- ✅ Encrypted private key in IndexedDB
- ✅ Public key sent to server

---

#### 1.2 Register Second User (Bob)

1. **Open Incognito/Private Window:**
   - Chrome: `Ctrl+Shift+N` (Windows/Linux) or `Cmd+Shift+N` (Mac)
   - Firefox: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)

2. **Navigate to Registration:**
   - Go to `http://localhost:3000/register`

3. **Fill Registration Form:**
   - **Username:** `bob`
   - **Email:** `bob@example.com`
   - **Password:** `password123`
   - **Confirm Password:** `password123`

4. **Click "Register"**

5. **Verify Same Steps as Alice:**
   - Check console for key generation
   - Check IndexedDB for encrypted key
   - Check server logs

**✅ Expected Results:**
- ✅ Bob registered successfully
- ✅ Bob's keys generated
- ✅ Both users now exist in system

---

## 🔐 TEST 2: USER LOGIN

### Objective:
Verify authentication works and keys can be loaded.

### Steps:

#### 2.1 Login as Alice

1. **In Browser 1 (Normal Window):**
   - Go to `http://localhost:3000/login`
   - Or click "Login" if on registration page

2. **Enter Credentials:**
   - **Username/Email:** `alice` or `alice@example.com`
   - **Password:** `password123`

3. **Click "Login"**

4. **Check Browser Console:**
   ```
   ✅ Socket connected: [socket-id]
   ✅ Socket authenticated: {userId: ...}
   ```

5. **Check Server Logs:**
   ```
   [LOG] AUTH_SUCCESS - User: alice
   ```

**✅ Expected Results:**
- ✅ Login successful
- ✅ Redirected to Dashboard
- ✅ Socket.io connected
- ✅ Socket authenticated

---

#### 2.2 Login as Bob

1. **In Browser 2 (Incognito Window):**
   - Go to `http://localhost:3000/login`

2. **Enter Credentials:**
   - **Username/Email:** `bob` or `bob@example.com`
   - **Password:** `password123`

3. **Click "Login"**

4. **Verify Same as Alice:**
   - Check console for socket connection
   - Check server logs

**✅ Expected Results:**
- ✅ Bob logged in successfully
- ✅ Socket.io connected
- ✅ Both users now logged in

---

## 🔑 TEST 3: KEY GENERATION & STORAGE

### Objective:
Verify keys are generated, stored securely, and can be retrieved.

### Steps:

#### 3.1 Verify Keys in IndexedDB

**In Browser 1 (Alice):**

1. **Open DevTools (F12)**
2. **Go to:** Application → IndexedDB → SecureMessagingDB
3. **Expand:** `keys` object store
4. **Click on the entry:**
   - Should see encrypted private key data
   - **Important:** Should NOT see plaintext private key
   - Should see `userId` field

**✅ Expected Results:**
- ✅ Encrypted private key stored
- ✅ No plaintext visible
- ✅ User ID associated with key

---

#### 3.2 Load Keys (Key Exchange Manager)

**In Browser 1 (Alice):**

1. **On Dashboard, find "Secure Connections" section**
2. **Select a user** (Bob) from the list
3. **Click "Load Keys" button**
4. **Enter password:** `password123`
5. **Check Console:**
   ```
   🔑 Loading keys...
   ✅ Private key loaded
   ✅ Public key loaded
   ```

**✅ Expected Results:**
- ✅ Keys load successfully
- ✅ No errors in console
- ✅ "Establish Secure Connection" button appears

---

#### 3.3 Verify Public Key on Server

**Check Server Logs:**
- Should see: `GET /api/users/[userId]/publicKey`
- Should return public key in JWK format

**✅ Expected Results:**
- ✅ Public key retrieved successfully
- ✅ Public key is in JWK format
- ✅ No private key data in response

---

## 🔒 TEST 4: TWO-FACTOR AUTHENTICATION (OPTIONAL)

### Objective:
Verify 2FA setup and verification works.

### Steps:

#### 4.1 Enable 2FA for Alice

1. **On Dashboard, find "Security Settings"**
2. **Click "Enable 2FA"**
3. **QR Code Should Appear:**
   - White square with QR code pattern
   - Backup codes displayed below

4. **Scan QR Code:**
   - Open authenticator app (Google Authenticator, Authy, etc.)
   - Tap "Add account" or "+"
   - Scan the QR code
   - Account should be added

5. **Get 6-Digit Code:**
   - Authenticator app shows 6-digit code
   - Code changes every 30 seconds

6. **Enter Code:**
   - Type the 6-digit code in the input field
   - Click "Verify" or "Enable 2FA"

7. **Check Console:**
   ```
   🔐 Verifying 2FA code...
   ```

8. **Check Server Logs:**
   ```
   POST /api/2fa/verify-enable
   ```

**✅ Expected Results:**
- ✅ QR code displayed
- ✅ Backup codes shown
- ✅ 2FA enabled successfully
- ✅ Status shows "✅ 2FA is enabled"

---

#### 4.2 Test 2FA on Login

1. **Logout** (click Logout button)
2. **Login again:**
   - Enter username and password
   - Should see 2FA verification screen
3. **Enter 6-digit code** from authenticator app
4. **Click "Verify"**

**✅ Expected Results:**
- ✅ 2FA verification screen appears
- ✅ Login successful after verification
- ✅ Can use backup codes if needed

---

## 👥 TEST 5: USER LIST & SELECTION

### Objective:
Verify users can see other users and select them for messaging.

### Steps:

#### 5.1 Verify User List (Alice)

**In Browser 1 (Alice):**

1. **On Dashboard, find "Secure Connections" section**
2. **Check User List:**
   - Should see "Select User to Chat With"
   - Should see Bob in the list
   - **Important:** Should NOT see Alice (herself)

3. **Check Console:**
   ```
   Loading users list...
   Users list response: { users: [...] }
   ```

4. **Check Server Logs:**
   ```
   GET /api/users/list
   User alice: excluded (current user)
   User bob: included
   Filtered users count: 1
   ```

**✅ Expected Results:**
- ✅ Bob appears in list
- ✅ Alice does NOT appear in list
- ✅ Only 1 user shown (Bob)
- ✅ User list loads without errors

---

#### 5.2 Select User

1. **Click on Bob** in the user list
2. **Check UI:**
   - Should show "Selected: bob"
   - Should show "Change User" button
   - Key Exchange Manager should appear

**✅ Expected Results:**
- ✅ User selected successfully
- ✅ UI updates correctly
- ✅ Key Exchange section appears

---

## 🔐 TEST 6: KEY EXCHANGE PROTOCOL

### Objective:
Verify the 5-phase key exchange protocol works correctly.

### Steps:

#### 6.1 Initiate Key Exchange (Alice → Bob)

**In Browser 1 (Alice):**

1. **Make sure Bob is selected**
2. **Click "Load Keys"** (if not already loaded)
   - Enter password: `password123`
3. **Click "Establish Secure Connection"**
4. **Check Status:**
   - Should change: `idle → initiating → initiated`
5. **Check Console:**
   ```
   🔑 Creating init message...
   🔑 Key exchange message sent
   ```
6. **Check Server Logs:**
   ```
   POST /api/keyexchange/init
   [LOG] KEY_EXCHANGE_INIT - User: alice
   🔑 Key exchange message from alice to bob
   ```

**✅ Expected Results:**
- ✅ Status shows "initiated"
- ✅ Init message sent
- ✅ Server logs show correct sender/receiver

---

#### 6.2 Receive and Respond (Bob)

**In Browser 2 (Bob):**

1. **Should automatically receive init message**
2. **Check Console:**
   ```
   🔑 Received key exchange message: init
   🔑 Key exchange message received via Socket.io
   ```
3. **Check Status:**
   - Should change: `responding → responded`
4. **Check Server Logs:**
   ```
   🔑 Key exchange message from alice to bob
   POST /api/keyexchange/response
   [LOG] KEY_EXCHANGE_RESPONSE - User: bob
   ```

**✅ Expected Results:**
- ✅ Bob receives init message automatically
- ✅ Bob creates response
- ✅ Response sent back to Alice

---

#### 6.3 Confirm and Acknowledge

**In Browser 1 (Alice):**

1. **Should automatically receive response**
2. **Check Console:**
   ```
   🔑 Received key exchange message: response
   ✅ Session key derived
   ```
3. **Check Status:**
   - Should change: `confirming → established`
4. **Should see:** "✅ Secure channel established!"

**In Browser 2 (Bob):**

1. **Should receive confirmation**
2. **Check Status:**
   - Should show: `established`
3. **Should see:** "✅ Secure channel established!"

**✅ Expected Results:**
- ✅ Both users show "established" status
- ✅ Session key derived on both sides
- ✅ Chat window appears
- ✅ 5-phase protocol completed

---

## 💬 TEST 7: REAL-TIME ENCRYPTED MESSAGING

### Objective:
Verify messages are encrypted and delivered in real-time.

### Steps:

#### 7.1 Send Message (Alice → Bob)

**In Browser 1 (Alice):**

1. **In Chat Window, type message:**
   ```
   Hello Bob! This is an encrypted message!
   ```

2. **Click "Send" or press Enter**

3. **Check Browser 1:**
   - Message appears immediately in Alice's chat
   - Shows timestamp
   - Shows as "own" message (right-aligned)

4. **Check Console:**
   ```
   🔒 Encrypting message...
   📨 Message sent via Socket.io
   ```

5. **Check Network Tab (F12):**
   - Go to **Network** tab
   - Filter by **WS** (WebSocket)
   - Click on WebSocket connection
   - Go to **Messages** tab
   - **Verify:** Only encrypted data visible
   - Should see: `ciphertext`, `iv`, `authTag`
   - **Important:** NO plaintext visible

6. **Check Server Logs:**
   ```
   📨 Message from alice to bob
   ```

**✅ Expected Results:**
- ✅ Message appears in Alice's chat
- ✅ Message encrypted before sending
- ✅ Only encrypted data in Network tab
- ✅ No plaintext visible to server

---

#### 7.2 Receive Message (Bob)

**In Browser 2 (Bob):**

1. **Watch Chat Window:**
   - Message should appear **INSTANTLY** (within 1 second)
   - No page refresh needed
   - Shows as "other" message (left-aligned)

2. **Check Console:**
   ```
   📨 Message received via Socket.io
   🔓 Decrypting message...
   ✅ Message decrypted successfully
   ```

3. **Verify Message:**
   - Should see: "Hello Bob! This is an encrypted message!"
   - Should show correct timestamp
   - Should show sender (Alice)

**✅ Expected Results:**
- ✅ Message appears instantly (real-time)
- ✅ Message decrypted correctly
- ✅ Plaintext displayed correctly
- ✅ No errors in console

---

#### 7.3 Send Reply (Bob → Alice)

**In Browser 2 (Bob):**

1. **Type reply:**
   ```
   Hi Alice! I received your encrypted message in real-time!
   ```

2. **Click "Send"**

3. **Check Browser 1 (Alice):**
   - Reply should appear **INSTANTLY**
   - Should see Bob's message

**✅ Expected Results:**
- ✅ Bidirectional messaging works
- ✅ Real-time delivery both ways
- ✅ Messages encrypted/decrypted correctly

---

#### 7.4 Test Multiple Messages

1. **Send 5-10 messages quickly** from Alice
2. **Check Bob's browser:**
   - All messages should appear in order
   - No messages lost
   - Timestamps correct

**✅ Expected Results:**
- ✅ All messages delivered
- ✅ Messages in correct order
- ✅ No duplicates
- ✅ No lost messages

---

## 🔒 TEST 8: SECURITY VERIFICATION

### Objective:
Verify security features are working correctly.

### Steps:

#### 8.1 Verify End-to-End Encryption

1. **Open Network Tab (F12)**
2. **Filter by WS (WebSocket)**
3. **Send a message**
4. **Click on WebSocket connection**
5. **Check Messages tab:**
   - Should see encrypted payload
   - Should see: `ciphertext`, `iv`, `authTag`
   - **Verify:** NO plaintext message visible

**✅ Expected Results:**
- ✅ Only encrypted data transmitted
- ✅ Server cannot see plaintext
- ✅ Encryption working correctly

---

#### 8.2 Verify Private Key Security

1. **Open DevTools (F12)**
2. **Go to:** Application → IndexedDB → SecureMessagingDB → keys
3. **Check stored key:**
   - Should be encrypted
   - Should NOT be plaintext
   - Should require password to decrypt

**✅ Expected Results:**
- ✅ Private keys encrypted in storage
- ✅ No plaintext private keys
- ✅ Keys never sent to server

---

#### 8.3 Verify Connection Status

1. **Check Chat Header:**
   - Should show 🟢 (green dot) when connected
   - Should show 🔴 (red dot) when disconnected

2. **Test Disconnect:**
   - Disconnect internet briefly
   - Should see 🔴 (red dot)
   - Reconnect internet
   - Should automatically reconnect
   - Should see 🟢 (green dot)

**✅ Expected Results:**
- ✅ Connection status visible
- ✅ Auto-reconnection works
- ✅ Status updates correctly

---

#### 8.4 Verify Replay Protection

1. **Send a message**
2. **Try to send same message again** (copy/paste)
3. **Check Console:**
   - Should see replay protection logs
   - Should reject duplicate messages

**Note:** Replay protection is implemented but may not show obvious errors. Check console for nonce/sequence validation.

**✅ Expected Results:**
- ✅ Replay protection active
- ✅ Duplicate messages rejected
- ✅ Nonces validated

---

## 🐛 TROUBLESHOOTING

### Problem: Authentication Errors (401 Unauthorized)

**Symptoms:**
- `❌ Authentication failed: Invalid token`
- `401 Unauthorized` errors
- Users list empty
- `currentUserId` is undefined

**Solutions:**
1. **Check if you're logged in:**
   - Open console: `localStorage.getItem('token')`
   - Should return a JWT string
   - If null, logout and login again

2. **If token exists but still getting 401:**
   - Token might be expired (7 days)
   - Logout and login again
   - Check server logs for token verification errors

3. **After 2FA failure:**
   - You should stay logged in (token not removed)
   - Try entering 2FA code again
   - Don't need to re-login

4. **Verify token is sent:**
   - Check Network tab (F12)
   - Look for `Authorization: Bearer [token]` header
   - If missing, check `auth.js` interceptor

---

### Problem: Users List Empty or Shows Yourself

**Symptoms:**
- "No other users found"
- Current user appears in their own list
- `currentUserId` is undefined

**Solutions:**
1. **Make sure you're logged in:**
   - Check `localStorage.getItem('token')` exists
   - Check `localStorage.getItem('user')` exists

2. **Register at least 2 users:**
   - Need 2 different users for testing
   - Register in different browsers

3. **Check server logs:**
   - Should see: `Filtered users count: 1` (or more)
   - Should see: `User [yourname]: excluded (current user)`

4. **Refresh the page:**
   - Sometimes user list needs refresh
   - Click "Refresh List" button

---

### Problem: Socket.io Not Connecting

**Symptoms:**
- Console shows: `❌ Socket disconnected`
- No "Socket connected" message
- Connection indicator shows 🔴

**Solutions:**
1. Check server is running: `cd server && npm run dev`
2. Check server console for errors
3. Verify CORS settings in `.env`:
   ```
   CORS_ORIGIN=http://localhost:3000
   ```
4. Try refreshing browser page
5. Check firewall isn't blocking port 5000

---

### Problem: Keys Not Loading

**Symptoms:**
- "Load Keys" button doesn't work
- Error: "Failed to load keys"
- Keys not appearing in IndexedDB

**Solutions:**
1. Check password is correct
2. Verify user is logged in
3. Check IndexedDB:
   - DevTools → Application → IndexedDB
   - Should see SecureMessagingDB
4. Try logging out and logging back in
5. Check console for specific error messages

---

### Problem: User List Empty

**Symptoms:**
- "No other users found" message
- User list is empty

**Solutions:**
1. Make sure at least 2 users are registered
2. Check both users are logged in
3. Click "Refresh List" button
4. Check server logs for errors
5. Verify server is running

---

### Problem: Key Exchange Stuck

**Symptoms:**
- Status shows "initiated" but never progresses
- No response from recipient

**Solutions:**
1. Make sure recipient is logged in
2. Check recipient's console for key exchange messages
3. Verify Socket.io is connected in both browsers
4. Check server logs for errors
5. Try refreshing both pages
6. Re-establish connection

---

### Problem: Messages Not Appearing

**Symptoms:**
- Messages send but don't appear on recipient side
- No errors in console

**Solutions:**
1. Verify key exchange completed (status: "established")
2. Check both users are connected (🟢 green dot)
3. Check server console for message forwarding
4. Verify recipient ID matches
5. Check Network tab for WebSocket messages
6. Try refreshing both pages

---

### Problem: 2FA Not Working

**Symptoms:**
- "No token provided" error
- 2FA verification fails
- "Invalid verification code" error

**Solutions:**
1. **Make sure you're logged in:**
   - Check console: `localStorage.getItem('token')`
   - Should return a JWT string

2. **If token is null:**
   - Logout and login again
   - Token will be set after login

3. **If 2FA code is wrong:**
   - You stay logged in (token not removed)
   - Try entering the code again
   - Make sure code is from authenticator app
   - Code changes every 30 seconds

4. **If token expired:**
   - Tokens expire after 7 days
   - Logout and login again

5. **Check server logs:**
   - Should see: `POST /api/2fa/verify-enable`
   - Check for `INVALID_2FA_TOKEN` errors

---

## ✅ TESTING CHECKLIST

Use this checklist to verify all features:

### Authentication:
- [ ] User can register
- [ ] Keys generated on registration
- [ ] User can login
- [ ] Socket.io connects on login
- [ ] JWT token stored correctly

### Key Management:
- [ ] Private keys stored in IndexedDB (encrypted)
- [ ] Public keys sent to server
- [ ] Keys can be loaded with password
- [ ] Keys never sent to server unencrypted

### Key Exchange:
- [ ] User list shows other users (not self)
- [ ] Key exchange can be initiated
- [ ] 5-phase protocol completes
- [ ] Session key established
- [ ] Status shows "established"

### Messaging:
- [ ] Messages can be sent
- [ ] Messages appear instantly (real-time)
- [ ] Messages encrypted (check Network tab)
- [ ] Messages decrypted correctly
- [ ] Bidirectional messaging works

### Security:
- [ ] Only encrypted data in Network tab
- [ ] Private keys encrypted in IndexedDB
- [ ] Connection status visible
- [ ] Replay protection active

---

## 📊 EXPECTED SERVER LOGS

When everything works correctly, you should see:

```
🚀 Server running on port 5000
🔌 Socket.io ready for connections
[LOG] USER_REGISTERED - User: alice
[LOG] USER_REGISTERED - User: bob
[LOG] AUTH_SUCCESS - User: alice
🔌 User connected: [socket-id]
✅ User alice authenticated (socket: [socket-id])
[LOG] KEY_EXCHANGE_INIT - User: alice
🔑 Key exchange message from alice to bob
[LOG] KEY_EXCHANGE_RESPONSE - User: bob
📨 Message from alice to bob
```

---

## 🎯 SUCCESS CRITERIA

Your testing is successful if:

1. ✅ Users can register and login
2. ✅ Keys are generated and stored securely
3. ✅ Key exchange completes successfully
4. ✅ Messages are sent and received in real-time
5. ✅ Only encrypted data is visible in Network tab
6. ✅ Private keys never leave the client
7. ✅ All security features work correctly

---

## 📝 NOTES

- **Test with 2 browsers** - Need 2 users for key exchange and messaging
- **Check console often** - Most issues show up in browser console
- **Check server logs** - Backend errors appear in server terminal
- **Network tab is your friend** - Verify encryption is working
- **IndexedDB shows storage** - Verify keys are stored securely

---

## 🎉 COMPLETE!

If all tests pass, your system is working correctly!

**Next Steps:**
- Test with more users (3-4 users)
- Test edge cases (disconnect/reconnect)
- Prepare for demo/presentation

---

**For more information, see:**
- [DEMO_GUIDE.md](./DEMO_GUIDE.md) - Demo presentation guide
- [QUICK_START_TESTING.md](./QUICK_START_TESTING.md) - Quick reference
- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) - Technical details

