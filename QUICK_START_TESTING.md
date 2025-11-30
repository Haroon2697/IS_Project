# 🚀 QUICK START - TESTING GUIDE

**Quick Reference for Testing Your Secure Messaging System**

**📖 For detailed testing, see:** [COMPLETE_TESTING_GUIDE.md](./COMPLETE_TESTING_GUIDE.md)

---

## ⚡ QUICK COMMANDS

### Terminal 1 - Start Backend
```bash
cd /home/haroon/IS/IS_Project/server
npm run dev
```

### Terminal 2 - Start Frontend
```bash
cd /home/haroon/IS/IS_Project/client
npm start
```

---

## 📝 STEP-BY-STEP TESTING

### 1️⃣ Register User 1

**Browser 1 (Normal Window):**
- URL: `http://localhost:3000/register`
- Username: `testuser1`
- Email: `test1@example.com`
- Password: `password123`
- Click "Register"

**Check Console (F12):**
- ✅ `Keys generated and stored`
- ✅ `Socket connected: [id]`
- ✅ `Socket authenticated`

---

### 2️⃣ Register User 2

**Browser 2 (Incognito/Private Window):**
- URL: `http://localhost:3000/register`
- Username: `testuser2`
- Email: `test2@example.com`
- Password: `password123`
- Click "Register"

**Check Console:**
- Same messages as User 1

---

### 3️⃣ Establish Connection

**In Browser 1:**
1. On Dashboard, find "Secure Connections"
2. Select `testuser2` from user list
3. Click "Establish Secure Connection"
4. Enter password: `password123`
5. Wait for status: `idle → initiating → established`
6. See: "✅ Secure channel established!"

**In Browser 2:**
- Key exchange happens automatically
- Status should show `established`

---

### 4️⃣ Test Real-Time Messaging

**Send from Browser 1:**
1. Type: `Hello! This is a test message!`
2. Click "Send"
3. ✅ Message appears in Browser 1 immediately

**Check Browser 2:**
- ✅ Message appears INSTANTLY (within 1 second)
- ✅ No page refresh needed
- ✅ Shows in real-time

**Send from Browser 2:**
1. Type: `Hi! I received it in real-time!`
2. Click "Send"
3. ✅ Message appears in Browser 1 instantly

---

## ✅ VERIFICATION CHECKLIST

Use this to verify everything works:

- [ ] Server starts without errors
- [ ] Client starts without errors
- [ ] Both users can register
- [ ] Socket.io connects (🟢 green dot in chat header)
- [ ] Key exchange completes successfully
- [ ] Messages send from Browser 1
- [ ] Messages appear instantly in Browser 2
- [ ] Messages send from Browser 2
- [ ] Messages appear instantly in Browser 1
- [ ] Console shows Socket.io messages
- [ ] Network tab shows WebSocket connection

---

## 🐛 TROUBLESHOOTING

### Problem: Socket not connecting
**Solution:**
- Check server is running
- Check server console for errors
- Refresh browser page
- Check `.env` file has correct CORS_ORIGIN

### Problem: Messages not appearing
**Solution:**
- Verify both users are logged in
- Check both show 🟢 (connected)
- Verify key exchange completed
- Check server console for errors

### Problem: Key exchange stuck
**Solution:**
- Make sure both users are logged in
- Check both browsers have Socket.io connected
- Try refreshing both pages
- Re-establish connection

---

## 📊 WHAT YOU SHOULD SEE

### Console Messages (Both Browsers):
```
✅ Socket connected: abc123
✅ Socket authenticated: {userId: ...}
🔑 Received key exchange message: init
📨 Message received via Socket.io
```

### Visual Indicators:
- 🟢 Green dot = Connected
- 🔴 Red dot = Disconnected
- Messages appear instantly
- No page refresh needed

### Network Tab (F12):
- WebSocket connection (WS)
- Encrypted data only (ciphertext, IV, authTag)
- No plaintext visible

---

## 🎉 SUCCESS!

If all tests pass:
- ✅ Socket.io is working correctly
- ✅ Real-time messaging is functional
- ✅ End-to-end encryption is working

**Next Steps:**
- Test with more users
- Test reconnection (disconnect/reconnect)
- Move to File Sharing implementation

---

## 📚 MORE HELP

- **Detailed Guide:** See `TEST_SOCKETIO.md`
- **Documentation:** See `PROJECT_DOCUMENTATION.md`
- **Next Steps:** See `NEXT_STEPS.md`

