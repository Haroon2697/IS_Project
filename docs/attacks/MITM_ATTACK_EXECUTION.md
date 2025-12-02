# MITM Attack Execution - Step-by-Step Guide

This document provides detailed step-by-step instructions for executing the MITM attack demonstration.

---

## 🎯 Attack Objective

Demonstrate that without digital signatures, an attacker can:
1. Intercept key exchange messages
2. Replace ECDH public keys with their own
3. Derive session keys with both parties
4. Decrypt all messages between the parties

---

## 📋 Pre-Attack Checklist

- [ ] Vulnerable version is active
- [ ] BurpSuite is installed and running
- [ ] Browser proxy is configured (127.0.0.1:8080)
- [ ] Burp CA certificate is installed
- [ ] Server is running (`npm start` in `server/`)
- [ ] Client is running (`npm start` in `client/`)
- [ ] Two browser windows ready (or one + incognito)

---

## 🔧 Phase 1: Setup (10 minutes)

### 1.1 Start Services

**Terminal 1 - Server:**
```bash
cd server
npm start
```
Expected output: `Server running on port 5000`

**Terminal 2 - Client:**
```bash
cd client
npm start
```
Expected output: `Compiled successfully!` and opens `http://localhost:3000`

### 1.2 Configure BurpSuite

1. **Open BurpSuite**
2. **Go to Proxy → Options**
3. **Verify Proxy Listener:**
   - Should be listening on `127.0.0.1:8080`
   - If not, click "Add" and configure

4. **Go to Proxy → Intercept**
5. **Turn "Intercept is on"** (button should be orange/red)

### 1.3 Configure Browser

1. **Set Proxy:**
   - Chrome: Settings → Advanced → System → Open proxy settings
   - Or use Proxy SwitchyOmega extension
   - HTTP Proxy: `127.0.0.1:8080`

2. **Verify Proxy:**
   - Navigate to any website
   - Check BurpSuite intercepts the request
   - Click "Forward" to continue

---

## 👥 Phase 2: Register Users (5 minutes)

### 2.1 Register Alice

1. **Open Browser Window 1**
2. **Navigate to:** `http://localhost:3000`
3. **Register:**
   - Username: `alice`
   - Email: `alice@test.com`
   - Password: `alice123`
   - Click "Register"

4. **After Registration:**
   - You'll be logged in automatically
   - Keys are generated and stored

### 2.2 Register Bob

1. **Open Browser Window 2** (or Incognito)
2. **Navigate to:** `http://localhost:3000`
3. **Register:**
   - Username: `bob`
   - Email: `bob@test.com`
   - Password: `bob123`
   - Click "Register"

4. **After Registration:**
   - You'll be logged in automatically
   - Keys are generated and stored

---

## 🔑 Phase 3: Generate Attacker Keys (5 minutes)

### 3.1 Open Browser Console

1. **In Browser Window 1 (Alice):**
   - Press `F12` to open Developer Tools
   - Go to "Console" tab

### 3.2 Generate Attacker Key Pair

**Paste and run this code in console:**

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

### 3.3 Save Attacker Public Key

1. **Copy the JSON output** from console
2. **Save it in a text file** or keep console open
3. **You'll use this to replace Alice's/Bob's keys**

**Example Output:**
```json
{
  "kty": "EC",
  "crv": "P-256",
  "x": "BASE64_X_COORDINATE",
  "y": "BASE64_Y_COORDINATE"
}
```

---

## 🎯 Phase 4: Execute Attack (15 minutes)

### 4.1 Initiate Key Exchange

1. **In Browser Window 1 (Alice):**
   - Select user "bob" from the user list
   - Click "Load Keys" (enter password: `alice123`)
   - Click "Establish Secure Connection"

2. **In BurpSuite:**
   - You should see intercepted request: `POST /api/keyExchange/init`
   - Request is paused waiting for your action

### 4.2 Intercept and Modify INIT Message

1. **In BurpSuite Intercept Tab:**
   - You'll see the HTTP request
   - Scroll down to see the request body (JSON)

2. **Find the Key:**
   - Look for `"senderECDHPublic"` field
   - It contains Alice's ECDH public key

3. **Modify the Key:**
   - Replace the entire `senderECDHPublic` object with attacker's public key
   - Example:
     ```json
     "senderECDHPublic": {
       "kty": "EC",
       "crv": "P-256",
       "x": "YOUR_ATTACKER_X",
       "y": "YOUR_ATTACKER_Y"
     }
     ```

4. **Click "Forward"** to send modified message

### 4.3 Intercept and Modify RESPONSE Message

1. **Bob automatically responds:**
   - BurpSuite intercepts: `POST /api/keyExchange/response`
   - Request is paused

2. **Modify Bob's Key:**
   - Find `"senderECDHPublic"` in the response
   - Replace with attacker's public key (same as before)
   - Click "Forward"

### 4.4 Intercept CONFIRM and ACK Messages

1. **Continue intercepting:**
   - `POST /api/keyExchange/confirm`
   - `POST /api/keyExchange/ack`
   - You can forward these without modification (they're encrypted)

2. **Turn off intercept:**
   - In BurpSuite, turn "Intercept is off"
   - This allows normal traffic to flow

---

## ✅ Phase 5: Verify Attack Success (10 minutes)

### 5.1 Check Key Exchange Status

1. **In Browser Window 1 (Alice):**
   - Should show: "✅ Secure channel established"
   - Status: "established"

2. **In Browser Window 2 (Bob):**
   - Should show: "✅ Secure channel established"
   - Status: "established"

3. **⚠️ IMPORTANT:**
   - Both think they're connected to each other
   - But they're actually both connected to the attacker!

### 5.2 Verify Attacker Can Decrypt

1. **In Browser Window 1 (Alice):**
   - Send a message: "Hello Bob, this is a secret message!"
   - Click "Send"

2. **In BurpSuite:**
   - Go to **Proxy → HTTP history**
   - Find the message send request: `POST /api/messages/send`
   - The request body contains encrypted message

3. **Decrypt Message (Optional - Advanced):**
   - Since attacker has session keys with both parties
   - Attacker can decrypt the message
   - (This requires additional code - see Advanced section)

### 5.3 Verify Bob Receives Message

1. **In Browser Window 2 (Bob):**
   - Should receive: "Hello Bob, this is a secret message!"
   - Bob is unaware of the MITM attack

### 5.4 Capture Evidence

**Take Screenshots:**
- [ ] BurpSuite intercepting INIT message
- [ ] Modified ECDH public key in BurpSuite
- [ ] BurpSuite intercepting RESPONSE message
- [ ] Both browsers showing "Secure channel established"
- [ ] Message being sent/received
- [ ] BurpSuite HTTP history showing encrypted messages

---

## 🛡️ Phase 6: Demonstrate Defense (10 minutes)

### 6.1 Switch to Protected Version

1. **Restore Original File:**
   ```bash
   cd client/src/crypto
   cp keyExchange.backup.js keyExchange.js
   ```

2. **Or Switch Branch:**
   ```bash
   git checkout main
   ```

3. **Restart Client:**
   ```bash
   cd client
   npm start
   ```

### 6.2 Attempt Same Attack

1. **Repeat Attack Steps:**
   - Register users (or use existing)
   - Initiate key exchange
   - Intercept and modify ECDH public key

2. **Attack Should Fail:**
   - Signature verification fails
   - Key exchange aborted
   - Error in browser console: "Invalid signature in init message"

### 6.3 Capture Defense Evidence

**Take Screenshots:**
- [ ] BurpSuite intercepting message
- [ ] Attempting to modify key
- [ ] Browser console showing signature error
- [ ] Key exchange failed message
- [ ] Security log entry (if available)

---

## 📊 Phase 7: Document Results (15 minutes)

### 7.1 Create Results Document

Create file: `docs/attacks/MITM_ATTACK_RESULTS.md`

**Include:**
1. Attack overview
2. Vulnerable version setup
3. Attack execution steps
4. Attack success evidence (screenshots)
5. Protected version setup
6. Defense demonstration
7. Defense evidence (screenshots)
8. Analysis and comparison

### 7.2 Comparison Table

| Aspect | Vulnerable Version | Protected Version |
|--------|-------------------|------------------|
| Signature Creation | ❌ Disabled | ✅ Enabled |
| Signature Verification | ❌ Disabled | ✅ Enabled |
| Key Modification | ✅ Possible | ❌ Detected |
| Attack Success | ✅ Yes | ❌ No |
| Key Exchange | ✅ Completes (compromised) | ❌ Aborted (secure) |

---

## 🔍 Advanced: Decrypt Messages as Attacker

### Option 1: Using Browser Console

1. **In Browser Console (Alice's window):**
   ```javascript
   // Get the session key (if stored)
   const sessionKey = /* get from your app's state */;
   
   // Decrypt intercepted message
   const decrypted = await window.crypto.subtle.decrypt(
     {
       name: 'AES-GCM',
       iv: /* IV from message */,
       tagLength: 128
     },
     sessionKey,
     /* ciphertext from message */
   );
   ```

### Option 2: Using BurpSuite Extensions

1. Install BurpSuite extension for crypto operations
2. Configure with attacker's keys
3. Automatically decrypt messages

---

## ⚠️ Troubleshooting

### Problem: BurpSuite Not Intercepting

**Solution:**
1. Check proxy settings in browser
2. Verify BurpSuite listener on port 8080
3. Check "Intercept is on"
4. Try turning off intercept and check HTTP history

### Problem: Can't Modify JSON

**Solution:**
1. Use BurpSuite "Pretty" view
2. Use "Repeater" tab for easier editing
3. Copy to external editor, modify, paste back

### Problem: Key Exchange Fails

**Solution:**
1. Check browser console for errors
2. Verify both users registered
3. Check server is running
4. Verify keys loaded (click "Load Keys")

### Problem: SSL Certificate Errors

**Solution:**
1. Install Burp CA certificate
2. Restart browser
3. Clear browser cache

---

## 📝 Notes

- **Vulnerable version is ONLY for demonstration**
- **Never use in production**
- **Always restore original files after demo**
- **Keep vulnerable branch separate**

---

## ✅ Completion Checklist

- [ ] Vulnerable version created and tested
- [ ] BurpSuite installed and configured
- [ ] Browser proxy configured
- [ ] CA certificate installed
- [ ] Users registered
- [ ] Attacker keys generated
- [ ] Attack executed successfully
- [ ] Evidence captured (screenshots)
- [ ] Defense demonstrated
- [ ] Results documented

---

**Last Updated:** December 2024  
**Estimated Total Time:** 60-90 minutes

