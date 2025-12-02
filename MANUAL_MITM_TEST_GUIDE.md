# Manual MITM Attack Testing Guide

**Complete step-by-step guide to manually test the MITM attack demonstration.**

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js** installed (v14+)
- [ ] **BurpSuite Community Edition** installed ([Download here](https://portswigger.net/burp/communitydownload))
- [ ] **Two browser windows** ready (or one browser + incognito mode)
- [ ] **Project files** ready (server and client folders)

---

## 🚀 PART 1: Setup (15 minutes)

### Step 1: Check Current Version Status

Open PowerShell/Terminal in the project root:

```bash
cd C:\Users\hp\Documents\IS_Project\IS_Project
node scripts/switch-mitm-version.js status
```

**Expected Output:**
```
📊 Current Status: VULNERABLE (Signatures DISABLED)
```

If it shows "PROTECTED", switch to vulnerable:
```bash
node scripts/switch-mitm-version.js vulnerable
```

### Step 2: Start the Server

**Open Terminal/PowerShell 1:**

```bash
cd C:\Users\hp\Documents\IS_Project\IS_Project\server
npm start
```

**Wait for:**
```
Server running on port 5000
MongoDB connected
```

**Keep this terminal open!** ⚠️ Don't close it.

### Step 3: Start the Client

**Open Terminal/PowerShell 2 (NEW WINDOW):**

```bash
cd C:\Users\hp\Documents\IS_Project\IS_Project\client
npm start
```

**Wait for:**
- Browser to automatically open at `http://localhost:3000`
- Or navigate manually to `http://localhost:3000`

**Keep this terminal open!** ⚠️ Don't close it.

### Step 4: Install and Configure BurpSuite

#### 4.1: Download BurpSuite (if not installed)

1. Go to: https://portswigger.net/burp/communitydownload
2. Download "Community Edition" (free)
3. Install it
4. Open BurpSuite

#### 4.2: First Launch Setup

1. Click "Next" through the setup wizard
2. Choose "Temporary project" or create a new project
3. Click "Start Burp"

#### 4.3: Configure BurpSuite Intercept

1. In BurpSuite, go to **Proxy → Intercept**
2. Click **"Intercept is on"** button (should turn orange/red)
3. This enables request interception

#### 4.4: Configure Browser Proxy

**Option A: Chrome with Proxy Extension (Recommended)**

1. Install "Proxy SwitchyOmega" extension from Chrome Web Store
2. Click the extension icon → "Options"
3. Click "New Profile"
4. Name: `BurpSuite`
5. Set:
   - **HTTP Proxy:** `127.0.0.1`
   - **Port:** `8080`
6. Click "Save"
7. Click extension icon → Select "BurpSuite"

**Option B: Manual Chrome Settings**

1. Open Chrome Settings
2. Go to: `chrome://settings/system`
3. Click "Open your computer's proxy settings"
4. Set:
   - **Proxy:** `127.0.0.1`
   - **Port:** `8080`
5. Save

#### 4.5: Install BurpSuite CA Certificate

**⚠️ CRITICAL:** Without this, you can't intercept HTTPS traffic!

1. **Export Certificate from BurpSuite:**
   - Open BurpSuite
   - Go to **Proxy → Options**
   - Scroll to **"Proxy Listeners"**
   - Click **"Import/export CA certificate"**
   - Click **"Export"**
   - Save as: `burp-cert.der` (save to Desktop)

2. **Install in Chrome:**
   - Open Chrome Settings
   - Go to: `chrome://settings/certificates`
   - Click **"Authorities"** tab
   - Click **"Import"**
   - Select `burp-cert.der` file
   - Check **"Trust this certificate for identifying websites"**
   - Click **"OK"**

3. **Verify:**
   - Navigate to `http://localhost:3000`
   - Should NOT show SSL certificate errors
   - BurpSuite should intercept requests

---

## 👥 PART 2: Register Users (5 minutes)

### Step 5: Register Alice

**In Browser Window 1 (with proxy enabled):**

1. Navigate to: `http://localhost:3000`
2. Click **"Register"** button
3. Fill in:
   - **Username:** `alice`
   - **Email:** `alice@test.com`
   - **Password:** `alice123`
4. Click **"Register"**
5. You'll be automatically logged in
6. Keys are generated and stored

**Note:** You may see requests intercepted in BurpSuite. Click "Forward" to continue.

### Step 6: Register Bob

**Open Browser Window 2 (Incognito or Different Browser):**

1. **Open Incognito Window:** Press `Ctrl+Shift+N` (Chrome) or `Ctrl+Shift+P` (Firefox)
2. **Configure Proxy in Incognito:**
   - If using Proxy SwitchyOmega, it should work in incognito
   - Or configure proxy manually in incognito settings
3. Navigate to: `http://localhost:3000`
4. Click **"Register"** button
5. Fill in:
   - **Username:** `bob`
   - **Email:** `bob@test.com`
   - **Password:** `bob123`
6. Click **"Register"**
7. You'll be automatically logged in
8. Keys are generated and stored

---

## 🔑 PART 3: Generate Attacker Keys (5 minutes)

### Step 7: Generate Attacker's ECDH Key Pair

**In Browser Window 1 (Alice's window):**

1. Press **F12** to open Developer Tools
2. Click **"Console"** tab
3. **Copy and paste this code:**

```javascript
(async function() {
  try {
    // Generate attacker's ECDH key pair
    const attackerKeyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true, // extractable
      ['deriveKey', 'deriveBits']
    );
    
    // Export attacker's public key (JWK format)
    const attackerPublicKeyJwk = await window.crypto.subtle.exportKey(
      'jwk',
      attackerKeyPair.publicKey
    );
    
    // Store for later use
    window.attackerPublicKey = attackerPublicKeyJwk;
    window.attackerPrivateKey = attackerKeyPair.privateKey;
    
    console.log('✅ Attacker keys generated!');
    console.log('Public Key:', JSON.stringify(attackerPublicKeyJwk, null, 2));
    
    // Copy this JSON - you'll need it!
    return attackerPublicKeyJwk;
  } catch (error) {
    console.error('Error generating attacker keys:', error);
  }
})();
```

4. Press **Enter** to run
5. **Copy the JSON output** (the public key object)
6. **Save it somewhere** (Notepad or keep console open)

**Example Output:**
```json
{
  "kty": "EC",
  "crv": "P-256",
  "x": "BASE64_X_COORDINATE_HERE",
  "y": "BASE64_Y_COORDINATE_HERE"
}
```

**⚠️ IMPORTANT:** Keep this JSON - you'll use it to replace Alice's and Bob's keys!

---

## 🎯 PART 4: Execute MITM Attack (20 minutes)

### Step 8: Navigate to Key Exchange

**In Browser Window 1 (Alice):**

1. You should see a list of users
2. **Click on "bob"** to select him
3. You'll see: "Selected: **bob**"
4. You should see a "Key Exchange" section

### Step 9: Load Keys

**In Browser Window 1 (Alice):**

1. Click **"Load Keys"** button
2. Enter password: `alice123`
3. Wait for: "Keys loaded successfully" or similar message
4. Keys are now loaded in memory

### Step 10: Initiate Key Exchange

**In Browser Window 1 (Alice):**

1. Click **"Establish Secure Connection"** button
2. Status should change to "initiating"

**In BurpSuite:**

1. **You should see an intercepted request:**
   - Request: `POST /api/keyExchange/init`
   - Status: **Paused** (waiting for your action)
   - The request is stopped in BurpSuite

2. **If you don't see it:**
   - Check "Intercept is on" in BurpSuite
   - Check proxy settings in browser
   - Try refreshing the page and clicking again

### Step 11: Modify INIT Message (THE ATTACK!)

**In BurpSuite Intercept Tab:**

1. **Click on the intercepted request** to view it
2. **Scroll down** to see the request body (JSON)
3. **Find this field:**
   ```json
   "senderECDHPublic": {
     "kty": "EC",
     "crv": "P-256",
     "x": "ALICE_X_COORDINATE",
     "y": "ALICE_Y_COORDINATE"
   }
   ```

4. **Replace the entire `senderECDHPublic` object:**
   - Select the entire object (from `"senderECDHPublic": {` to `}`)
   - Delete it
   - Paste the attacker's public key (from Step 7)
   - Make sure the JSON is valid (check commas, brackets)

5. **Example modification:**
   ```json
   "senderECDHPublic": {
     "kty": "EC",
     "crv": "P-256",
     "x": "YOUR_ATTACKER_X_FROM_STEP_7",
     "y": "YOUR_ATTACKER_Y_FROM_STEP_7"
   }
   ```

6. **Click "Forward"** button in BurpSuite
   - This sends the modified message to the server

**⚠️ IMPORTANT:** 
- Make sure JSON syntax is correct (no extra commas)
- The attacker's key should replace Alice's key completely

### Step 12: Intercept and Modify RESPONSE Message

**In BurpSuite:**

1. **Another request will be intercepted:**
   - Request: `POST /api/keyExchange/response`
   - This is Bob's response to Alice
   - Status: **Paused**

2. **Find `senderECDHPublic` in the response:**
   - It contains Bob's ECDH public key

3. **Replace it with attacker's public key** (same as before):
   - Select Bob's `senderECDHPublic` object
   - Replace with attacker's public key (from Step 7)
   - Make sure JSON is valid

4. **Click "Forward"**

### Step 13: Forward Remaining Messages

**In BurpSuite:**

1. **More requests will be intercepted:**
   - `POST /api/keyExchange/confirm`
   - `POST /api/keyExchange/acknowledge`

2. **You can forward these without modification:**
   - These messages are encrypted
   - The attack has already succeeded at this point
   - Click "Forward" for each

3. **After forwarding all messages:**
   - Turn **"Intercept is off"** in BurpSuite
   - This allows normal traffic to flow

---

## ✅ PART 5: Verify Attack Success (10 minutes)

### Step 14: Check Key Exchange Status

**In Browser Window 1 (Alice):**

1. **Check the status:**
   - Should show: "✅ Secure channel established"
   - Status: "established"
   - No error messages

**In Browser Window 2 (Bob):**

1. **Check the status:**
   - Should show: "✅ Secure channel established"
   - Status: "established"
   - No error messages

**⚠️ CRITICAL OBSERVATION:**
- Both Alice and Bob think they're connected to each other
- But they're actually both connected to the attacker!
- The attacker can decrypt all messages between them

### Step 15: Verify in Browser Console

**In Browser Window 1 (Alice):**

1. Open Developer Tools (F12)
2. Go to Console tab
3. **Look for:**
   - `⚠️ VULNERABLE MODE: Signature verification DISABLED`
   - This confirms you're using the vulnerable version

**In Browser Window 2 (Bob):**

1. Open Developer Tools (F12)
2. Go to Console tab
3. **Look for:**
   - `⚠️ VULNERABLE MODE: Signature verification DISABLED`
   - This confirms you're using the vulnerable version

### Step 16: Test Message Exchange (Optional)

**In Browser Window 1 (Alice):**

1. Type a message: `"Hello Bob, this is a secret message!"`
2. Click **"Send"**

**In Browser Window 2 (Bob):**

1. **You should receive the message:**
   - "Hello Bob, this is a secret message!"
   - Bob is unaware of the MITM attack

**In BurpSuite:**

1. Go to **Proxy → HTTP history**
2. Find the message send request: `POST /api/messages/send`
3. **You can see the encrypted message**
   - The attacker has session keys with both parties
   - The attacker can decrypt this message

---

## 🛡️ PART 6: Test Protected Version (Attack Should Fail) (15 minutes)

### Step 17: Switch to Protected Version

**In Terminal/PowerShell (project root):**

```bash
cd C:\Users\hp\Documents\IS_Project\IS_Project
node scripts/switch-mitm-version.js protected
```

**Expected Output:**
```
✅ Switched to PROTECTED version
   Signatures are ENABLED
   Restart client: cd client && npm start
```

### Step 18: Restart Client

**In Terminal/PowerShell 2 (client terminal):**

1. Press `Ctrl+C` to stop the client
2. Run:
   ```bash
   npm start
   ```
3. Wait for browser to reload

### Step 19: Attempt Same Attack

**Repeat Steps 8-11:**

1. **In Browser Window 1 (Alice):**
   - Select user "bob"
   - Click "Load Keys" (enter password: `alice123`)
   - Click "Establish Secure Connection"

2. **In BurpSuite:**
   - Intercept the INIT message
   - Modify the `senderECDHPublic` with attacker's key
   - Click "Forward"

### Step 20: Verify Attack Failure

**In Browser Window 1 (Alice):**

1. **Check the status:**
   - Should show: "Key exchange failed" or error message
   - Status: "idle" or "error"

2. **Open Developer Tools (F12) → Console:**
   - **Look for error:**
     ```
     Invalid signature in init message
     ```
   - Or similar signature verification error

**In Browser Window 2 (Bob):**

1. **Check the status:**
   - Should NOT show "Secure channel established"
   - Key exchange should have failed

**✅ TEST PASSED:** If key exchange fails with signature error after modifying key!

---

## 📸 PART 7: Capture Evidence (10 minutes)

### Screenshots to Take

1. **Vulnerable Version:**
   - [ ] BurpSuite intercepting INIT message
   - [ ] Modified ECDH public key in BurpSuite
   - [ ] Both browsers showing "Secure channel established"
   - [ ] Console warning: `VULNERABLE MODE: Signature verification DISABLED`

2. **Protected Version:**
   - [ ] BurpSuite intercepting message
   - [ ] Attempting to modify key
   - [ ] Signature error in console
   - [ ] Key exchange failed message

---

## 🧹 PART 8: Cleanup (2 minutes)

### Step 21: Restore Protected Version

**After testing, always restore the protected version:**

```bash
cd C:\Users\hp\Documents\IS_Project\IS_Project
node scripts/switch-mitm-version.js protected
```

**Restart client:**
```bash
cd client
npm start
```

---

## 🐛 Troubleshooting

### Problem: BurpSuite Not Intercepting

**Solutions:**
1. Check proxy settings in browser (127.0.0.1:8080)
2. Verify BurpSuite listener on port 8080 (Proxy → Options)
3. Check "Intercept is on" in BurpSuite
4. Try turning off intercept and check HTTP history
5. Restart browser after configuring proxy

### Problem: Can't Modify JSON in BurpSuite

**Solutions:**
1. Use BurpSuite "Pretty" view (formats JSON nicely)
2. Use "Repeater" tab for easier editing:
   - Right-click request → "Send to Repeater"
   - Edit in Repeater tab
   - Click "Send"
3. Copy to external editor (Notepad++), modify, paste back

### Problem: Key Exchange Fails Even in Vulnerable Version

**Solutions:**
1. Check browser console for errors
2. Verify both users registered successfully
3. Check server is running (Terminal 1)
4. Verify keys loaded (click "Load Keys" and enter password)
5. Check Socket.io connection (should see connection in server logs)
6. Make sure you're using the vulnerable version:
   ```bash
   node scripts/switch-mitm-version.js status
   ```

### Problem: SSL Certificate Errors

**Solutions:**
1. Install Burp CA certificate (Step 4.5)
2. Restart browser after installing certificate
3. Clear browser cache
4. Make sure certificate is trusted

### Problem: JSON Syntax Error After Modification

**Solutions:**
1. Make sure you replace the entire object, not just part of it
2. Check for missing commas or extra commas
3. Use a JSON validator (online tool)
4. Make sure quotes are correct (use double quotes)

---

## ✅ Testing Checklist

### Setup
- [ ] Server running on port 5000
- [ ] Client running on port 3000
- [ ] BurpSuite installed and running
- [ ] Browser proxy configured (127.0.0.1:8080)
- [ ] Burp CA certificate installed
- [ ] Vulnerable version active

### Vulnerable Version Test
- [ ] Two users registered (alice, bob)
- [ ] Attacker keys generated
- [ ] Key exchange initiated
- [ ] INIT message intercepted and modified
- [ ] RESPONSE message intercepted and modified
- [ ] Key exchange completed successfully
- [ ] Both browsers show "Secure channel established"
- [ ] Console shows vulnerable mode warning
- [ ] **TEST PASSED:** Attack succeeds

### Protected Version Test
- [ ] Switched to protected version
- [ ] Client restarted
- [ ] Key exchange initiated
- [ ] INIT message intercepted and modified
- [ ] Key exchange failed
- [ ] Signature error in console
- [ ] **TEST PASSED:** Attack prevented

### Cleanup
- [ ] Protected version restored
- [ ] Evidence captured (screenshots)
- [ ] Results documented

---

## 📊 Expected Results Summary

### Vulnerable Version (Attack Succeeds)
```
✅ Key exchange completes
✅ No signature errors
✅ Both parties establish connection
✅ Attacker can modify keys without detection
✅ Console shows: "VULNERABLE MODE: Signature verification DISABLED"
```

### Protected Version (Attack Fails)
```
✅ Key exchange fails when key is modified
✅ Signature verification error appears
✅ Attack is prevented
✅ Security is maintained
✅ Console shows: "Invalid signature in init message"
```

---

## ⚠️ Important Notes

1. **Always restore protected version after testing:**
   ```bash
   node scripts/switch-mitm-version.js protected
   ```

2. **Vulnerable version is ONLY for demonstration**

3. **Never use vulnerable code in production**

4. **Keep vulnerable code separate from main branch**

---

## 📝 Test Results Template

After testing, document your results:

```
MITM Attack Test Results
Date: ___________

Vulnerable Version:
- Attack Status: [ ] SUCCESS [ ] FAILED
- Key Exchange: [ ] Completed [ ] Failed
- Signature Errors: [ ] None [ ] Present
- Notes: _________________________________

Protected Version:
- Attack Status: [ ] PREVENTED [ ] SUCCEEDED
- Key Exchange: [ ] Failed [ ] Completed
- Signature Errors: [ ] Present [ ] None
- Notes: _________________________________

Screenshots: [ ] Captured [ ] Not captured
```

---

**Total Time:** ~60-90 minutes  
**Difficulty:** Medium  
**Required Tools:** BurpSuite, Browser with proxy

---

**Ready to start? Begin with Step 1!** 🚀

