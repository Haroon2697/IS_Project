# 🧪 TESTING SOCKET.IO REAL-TIME MESSAGING

**Quick Guide to Test Your Real-Time Messaging Implementation**

**📖 For complete testing guide, see:** [COMPLETE_TESTING_GUIDE.md](./COMPLETE_TESTING_GUIDE.md)

---

## 📋 PREREQUISITES

Before testing, make sure you have:
- ✅ Server running on port 5000
- ✅ Client running on port 3000
- ✅ Two browser windows (or one normal + one incognito)
- ✅ At least 2 registered users

---

## 🚀 STEP 1: START THE SERVERS

### Terminal 1 - Start Backend Server
```bash
cd /home/haroon/IS/IS_Project/server
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 5000
🔌 Socket.io ready for connections
```

### Terminal 2 - Start Frontend Client
```bash
cd /home/haroon/IS/IS_Project/client
npm start
```

**Expected Output:**
- Browser opens automatically at `http://localhost:3000`
- Or navigate to `http://localhost:3000` manually

---

## 👥 STEP 2: REGISTER TWO USERS

### User 1 (Browser 1 - Normal Window)
1. Go to `http://localhost:3000/register`
2. Fill in the form:
   - **Username:** `testuser1`
   - **Email:** `test1@example.com`
   - **Password:** `password123`
3. Click "Register"
4. **Check Console (F12):** Should see:
   - `✅ Keys generated and stored`
   - `✅ Public key sent to server`
5. You'll be redirected to Dashboard

### User 2 (Browser 2 - Incognito Window)
1. Open incognito/private window
2. Go to `http://localhost:3000/register`
3. Fill in the form:
   - **Username:** `testuser2`
   - **Email:** `test2@example.com`
   - **Password:** `password123`
4. Click "Register"
5. **Check Console (F12):** Should see key generation messages
6. You'll be redirected to Dashboard

---

## 🔌 STEP 3: VERIFY SOCKET.IO CONNECTION

### In Both Browsers:

1. **Open Browser Console (F12)**
2. **Look for these messages:**
   ```
   ✅ Socket connected: [socket-id]
   ✅ Socket authenticated: {userId: ...}
   ```

3. **Check Chat Header:**
   - Look for connection indicator
   - 🟢 Green dot = Connected
   - 🔴 Red dot = Disconnected

4. **If you see errors:**
   - Check server console for connection errors
   - Verify server is running
   - Check CORS settings in `.env`

---

## 🔑 STEP 4: ESTABLISH SECURE CONNECTION

### In Browser 1 (testuser1):

1. **On Dashboard, find "Secure Connections" section**
2. **Click on user list** - Should see `testuser2`
3. **Select `testuser2`** from the list
4. **Click "Establish Secure Connection"**
5. **Enter your password** when prompted (to load keys)
6. **Watch the status:**
   - Status changes: `idle` → `initiating` → `initiated`
   - Wait for response...

### In Browser 2 (testuser2):

1. **You should see the key exchange happening automatically**
2. **Check console** - Should see:
   ```
   🔑 Received key exchange message: init
   🔑 Key exchange message received via Socket.io
   ```
3. **Status should change:** `responding` → `responded` → `confirming` → `established`

### Back in Browser 1:

1. **Wait for status to change to `established`**
2. **You should see:** "✅ Secure channel established! You can now send encrypted messages."
3. **Chat window should appear**

---

## 💬 STEP 5: TEST REAL-TIME MESSAGING

### Send Message from Browser 1:

1. **In the chat input box**, type: `Hello, this is a test message!`
2. **Click "Send"** or press Enter
3. **Check Browser 1:**
   - Message appears in your chat window immediately
   - Shows your username and timestamp

4. **Check Browser 2 (IMPORTANT):**
   - **Message should appear INSTANTLY** (within 1 second)
   - No page refresh needed
   - Message appears in real-time

### Send Message from Browser 2:

1. **In Browser 2**, type: `Hi! I received your message in real-time!`
2. **Click "Send"**
3. **Check Browser 1:**
   - Message should appear instantly
   - No refresh needed

### Test Multiple Messages:

1. **Send 5-10 messages quickly** from Browser 1
2. **Verify in Browser 2:**
   - All messages appear in order
   - No messages are lost
   - Timestamps are correct

---

## ✅ STEP 6: VERIFY ENCRYPTION

### Check Network Tab:

1. **Open DevTools (F12)**
2. **Go to Network tab**
3. **Filter by "WS" (WebSocket)**
4. **Send a message**
5. **Click on the WebSocket connection**
6. **Check "Messages" tab**
7. **Verify:**
   - You see encrypted data (ciphertext, IV, authTag)
   - **NO plaintext** is visible
   - Only encrypted payload is sent

### Check Console:

1. **In Browser 1 Console**, you should see:
   ```
   📨 Message received via Socket.io
   🔒 Encrypted message: {ciphertext: ..., iv: ..., ...}
   ```

2. **In Browser 2 Console**, you should see:
   ```
   📨 Message received via Socket.io
   🔓 Decrypted: [your plaintext message]
   ```

---

## 🔄 STEP 7: TEST RECONNECTION

### Test Disconnect/Reconnect:

1. **In Browser 1**, disconnect internet (turn off WiFi or unplug ethernet)
2. **Watch connection indicator:**
   - Should change from 🟢 to 🔴
   - Console shows: `❌ Socket disconnected`

3. **Reconnect internet**
4. **Watch connection indicator:**
   - Should automatically reconnect
   - Changes back to 🟢
   - Console shows: `✅ Socket connected: [new-socket-id]`

5. **Send a message** - Should work normally

---

## 🐛 TROUBLESHOOTING

### Problem: Socket not connecting

**Symptoms:**
- No "Socket connected" message in console
- Connection indicator shows 🔴
- Messages not sending

**Solutions:**
1. Check server is running: `cd server && npm run dev`
2. Check server console for errors
3. Verify CORS settings in `server/.env`:
   ```
   CORS_ORIGIN=http://localhost:3000
   ```
4. Check firewall isn't blocking port 5000
5. Try refreshing the page

---

### Problem: Messages not appearing in real-time

**Symptoms:**
- Messages send but don't appear on recipient side
- No errors in console

**Solutions:**
1. **Check both users are logged in**
2. **Verify Socket.io connection in both browsers:**
   - Both should show 🟢
   - Both should have "Socket authenticated" message
3. **Check server console:**
   - Should see: `📨 Message from [userId] to [userId]`
4. **Verify key exchange completed:**
   - Both should see "Secure channel established"
5. **Check recipient ID matches:**
   - Make sure you selected the correct user

---

### Problem: Key exchange stuck on "initiated"

**Symptoms:**
- Status shows "initiated" but never progresses
- No response from recipient

**Solutions:**
1. **Check recipient is logged in** (Browser 2)
2. **Check recipient's console** for key exchange messages
3. **Verify Socket.io is connected** in both browsers
4. **Try refreshing both pages** and re-establishing connection
5. **Check server console** for key exchange errors

---

### Problem: "Socket authentication failed"

**Symptoms:**
- Console shows: `❌ Authentication error`
- Socket disconnects immediately

**Solutions:**
1. **Check JWT token:**
   - Open console: `localStorage.getItem('token')`
   - Should return a JWT string
2. **If token is null:**
   - Logout and login again
3. **Check JWT_SECRET in server `.env`:**
   - Must match between client and server
4. **Verify token hasn't expired:**
   - Tokens expire after 7 days
   - Try logging in again

---

## 📊 EXPECTED RESULTS SUMMARY

### ✅ Successful Test Should Show:

1. **Connection:**
   - ✅ Socket connected in both browsers
   - ✅ Connection indicator shows 🟢
   - ✅ Authentication successful

2. **Key Exchange:**
   - ✅ Status progresses: idle → initiated → established
   - ✅ "Secure channel established" message appears
   - ✅ Chat window becomes available

3. **Messaging:**
   - ✅ Messages send successfully
   - ✅ Messages appear instantly in recipient browser
   - ✅ No page refresh needed
   - ✅ Messages are encrypted (check network tab)

4. **Encryption:**
   - ✅ Only ciphertext visible in network tab
   - ✅ Messages decrypt correctly on recipient side
   - ✅ Plaintext never visible to server

---

## 🎯 QUICK TEST CHECKLIST

Use this checklist to verify everything works:

- [ ] Server starts without errors
- [ ] Client starts without errors
- [ ] Two users can register
- [ ] Socket.io connects in both browsers (🟢)
- [ ] Key exchange completes successfully
- [ ] Messages send from Browser 1
- [ ] Messages appear instantly in Browser 2
- [ ] Messages send from Browser 2
- [ ] Messages appear instantly in Browser 1
- [ ] Network tab shows encrypted data only
- [ ] Reconnection works after disconnect

---

## 🎉 SUCCESS!

If all tests pass, your Socket.io implementation is working correctly! 

**Next Steps:**
- Test with more users (3-4 users)
- Test file sharing (when implemented)
- Test offline message storage (future feature)

---

**For more detailed information, see:**
- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) - Complete testing guide
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Quick commands

