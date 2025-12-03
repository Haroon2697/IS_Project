# MITM Attack Testing Guide

This guide provides step-by-step instructions to test the MITM attack implementation.

## 📋 Prerequisites

1. **Node.js** installed (v14+)
2. **BurpSuite Community Edition** (free) - [Download here](https://portswigger.net/burp/communitydownload)
3. **Two browser windows** (or one browser + incognito)
4. **Server and client** running

---

## 🧪 Automated Test

First, run the automated test to verify the setup:

```bash
node test-mitm-attack.js
```

This will check:
- ✅ Vulnerable version file exists
- ✅ Protected version backup exists
- ✅ Current version status
- ✅ Key differences between versions
- ✅ Version switcher script exists

---

## 🔧 Manual Testing Steps

### Phase 1: Setup (10 minutes)

#### Step 1: Check Current Version

```bash
node scripts/switch-mitm-version.js status
```

**Expected Output:**
- Either `VULNERABLE` or `PROTECTED`

#### Step 2: Switch to Vulnerable Version (for attack test)

```bash
node scripts/switch-mitm-version.js vulnerable
```

**Expected Output:**
```
✅ Switched to VULNERABLE version
⚠️  WARNING: Signatures are DISABLED - for demo only!
   Restart client: cd client && npm start
```

#### Step 3: Start Server

```bash
cd server
npm start
```

**Wait for:** `Server running on port 5000`

#### Step 4: Start Client

```bash
cd client
npm start
```

**Wait for:** Browser to open at `http://localhost:3000`

#### Step 5: Configure BurpSuite

1. **Open BurpSuite**
2. **Go to Proxy → Intercept**
3. **Turn "Intercept is on"** (button should be orange/red)
4. **Configure Browser Proxy:**
   - Chrome: Settings → Advanced → System → Open proxy settings
   - Set HTTP Proxy: `127.0.0.1:8080`
   - Or use Proxy SwitchyOmega extension

5. **Install Burp CA Certificate:**
   - BurpSuite → Proxy → Options → Import/export CA certificate
   - Export certificate
   - Chrome: `chrome://settings/certificates` → Authorities → Import
   - Check "Trust this certificate for identifying websites"

---

### Phase 2: Test Vulnerable Version (Attack Should Succeed)

#### Step 6: Register Two Users

**Browser Window 1 (Alice):**
1. Navigate to `http://localhost:3000`
2. Register:
   - Username: `alice`
   - Email: `alice@test.com`
   - Password: `alice123`

**Browser Window 2 (Bob) - Use Incognito:**
1. Open Incognito (Ctrl+Shift+N)
2. Navigate to `http://localhost:3000`
3. Register:
   - Username: `bob`
   - Email: `bob@test.com`
   - Password: `bob123`

#### Step 7: Generate Attacker Keys

**In Browser Window 1 (Alice's console):**
1. Press `F12` to open Developer Tools
2. Go to Console tab
3. Paste and run:

```javascript
(async function() {
  const attackerKeyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );
  
  const attackerPublicKeyJwk = await window.crypto.subtle.exportKey(
    'jwk',
    attackerKeyPair.publicKey
  );
  
  window.attackerPublicKey = attackerPublicKeyJwk;
  window.attackerPrivateKey = attackerKeyPair.privateKey;
  
  console.log('✅ Attacker keys generated!');
  console.log('Public Key:', JSON.stringify(attackerPublicKeyJwk, null, 2));
  return attackerPublicKeyJwk;
})();
```

4. **Copy the JSON output** (attacker's public key)

#### Step 8: Initiate Key Exchange

**In Browser Window 1 (Alice):**
1. Select user "bob" from the user list
2. Click "Load Keys" (enter password: `alice123`)
3. Click "Establish Secure Connection"

**In BurpSuite:**
- You should see intercepted request: `POST /api/keyExchange/init`
- Request is paused waiting for your action

#### Step 9: Modify INIT Message

**In BurpSuite:**
1. Find `"senderECDHPublic"` field in the JSON request body
2. Replace it with attacker's public key (from Step 7)
3. Click "Forward"

**Expected Result:**
- Message is forwarded with modified key
- No signature verification error (because vulnerable version)

#### Step 10: Modify RESPONSE Message

**In BurpSuite:**
1. Another request will be intercepted: `POST /api/keyExchange/response`
2. Find `"senderECDHPublic"` in the response
3. Replace with attacker's public key (same as before)
4. Click "Forward"

#### Step 11: Complete Key Exchange

**In BurpSuite:**
1. Forward remaining messages (`confirm`, `ack`) without modification
2. Turn "Intercept is off" after all messages

#### Step 12: Verify Attack Success

**In Browser Window 1 (Alice):**
- Should show: "✅ Secure channel established"

**In Browser Window 2 (Bob):**
- Should show: "✅ Secure channel established"

**⚠️ IMPORTANT:**
- Both think they're connected to each other
- But they're actually both connected to the attacker!
- The attacker can decrypt all messages

**✅ TEST PASSED:** If both browsers show "Secure channel established" after modifying keys

---

### Phase 3: Test Protected Version (Attack Should Fail)

#### Step 13: Switch to Protected Version

```bash
node scripts/switch-mitm-version.js protected
```

**Expected Output:**
```
✅ Switched to PROTECTED version
   Signatures are ENABLED
   Restart client: cd client && npm start
```

**Restart Client:**
- Press `Ctrl+C` in client terminal
- Run `npm start` again

#### Step 14: Attempt Same Attack

**Repeat Steps 8-9:**
1. Initiate key exchange
2. Intercept and modify ECDH public key in BurpSuite
3. Forward modified message

**Expected Result:**
- **Browser Console:** Error: `"Invalid signature in init message"`
- **Browser UI:** Key exchange failed
- **Attack is PREVENTED!**

**✅ TEST PASSED:** If key exchange fails with signature error after modifying key

---

## 📊 Test Results Checklist

### Vulnerable Version Tests
- [ ] Key exchange completes successfully
- [ ] No signature verification errors
- [ ] Both parties show "Secure channel established"
- [ ] Attack succeeds (attacker can intercept keys)

### Protected Version Tests
- [ ] Key exchange fails when key is modified
- [ ] Signature verification error appears in console
- [ ] Attack is prevented
- [ ] Security log entry created (if available)

---

## 🔍 Verification Points

### Vulnerable Version Should:
1. ✅ Allow key exchange without signature verification
2. ✅ Accept modified ECDH public keys
3. ✅ Complete key exchange even with tampered messages
4. ✅ Show console warning: `⚠️ VULNERABLE MODE: Signature verification DISABLED`

### Protected Version Should:
1. ✅ Verify signatures on all key exchange messages
2. ✅ Reject modified ECDH public keys
3. ✅ Abort key exchange on signature failure
4. ✅ Show error: `Invalid signature in init message`

---

## 🐛 Troubleshooting

### Problem: BurpSuite Not Intercepting

**Solutions:**
1. Check proxy settings in browser (127.0.0.1:8080)
2. Verify BurpSuite listener on port 8080
3. Check "Intercept is on" in BurpSuite
4. Try turning off intercept and check HTTP history

### Problem: Can't Modify JSON in BurpSuite

**Solutions:**
1. Use BurpSuite "Pretty" view
2. Use "Repeater" tab for easier editing
3. Copy to external editor, modify, paste back

### Problem: Key Exchange Fails Even in Vulnerable Version

**Solutions:**
1. Check browser console for errors
2. Verify both users registered
3. Check server is running
4. Verify keys loaded (click "Load Keys")
5. Check Socket.io connection (should see connection in server logs)

### Problem: SSL Certificate Errors

**Solutions:**
1. Install Burp CA certificate (see Step 5)
2. Restart browser after installing certificate
3. Clear browser cache

---

## 📝 Expected Test Results

### Test 1: Vulnerable Version (Attack Succeeds)
```
✅ Key exchange completes
✅ No signature errors
✅ Both parties establish connection
✅ Attacker can modify keys without detection
```

### Test 2: Protected Version (Attack Fails)
```
✅ Key exchange fails when key is modified
✅ Signature verification error appears
✅ Attack is prevented
✅ Security is maintained
```

---

## ⚠️ Important Notes

1. **Always restore protected version after testing:**
   ```bash
   node scripts/switch-mitm-version.js protected
   ```

2. **Vulnerable version is ONLY for demonstration**
3. **Never use vulnerable code in production**
4. **Keep vulnerable branch separate from main branch**

---

## 📸 Evidence to Capture

For documentation, capture screenshots of:
1. BurpSuite intercepting INIT message
2. Modified ECDH public key in BurpSuite
3. Both browsers showing "Secure channel established" (vulnerable)
4. Signature error in console (protected)
5. Key exchange failed message (protected)

---

## ✅ Completion Checklist

- [ ] Automated test passed (`node test-mitm-attack.js`)
- [ ] Vulnerable version tested (attack succeeds)
- [ ] Protected version tested (attack fails)
- [ ] Evidence captured (screenshots)
- [ ] Protected version restored
- [ ] Results documented

---

**Total Time:** ~60-90 minutes  
**Difficulty:** Medium  
**Required Tools:** BurpSuite, Browser with proxy

---

**Last Updated:** December 2024

