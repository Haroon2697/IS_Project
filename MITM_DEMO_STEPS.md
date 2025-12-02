# MITM Attack Demo - Step-by-Step Instructions

**Follow these steps exactly to see the MITM attack demonstration.**

---

## 📋 PREPARATION (15 minutes)

### Step 1: Switch to Vulnerable Version

**Open Terminal/PowerShell in project root:**

```bash
# Navigate to project root (if not already there)
cd C:\Users\hp\Documents\IS_Project\IS_Project

# Switch to vulnerable version
node scripts/switch-mitm-version.js vulnerable
```

**Expected Output:**
```
✅ Switched to VULNERABLE version
⚠️  WARNING: Signatures are DISABLED - for demo only!
   Restart client: cd client && npm start
```

---

### Step 2: Start the Server

**Open Terminal 1 (PowerShell):**

```bash
cd C:\Users\hp\Documents\IS_Project\IS_Project\server
npm start
```

**Wait for:** `Server running on port 5000`

**Keep this terminal open!**

---

### Step 3: Start the Client

**Open Terminal 2 (New PowerShell window):**

```bash
cd C:\Users\hp\Documents\IS_Project\IS_Project\client
npm start
```

**Wait for:** Browser to open at `http://localhost:3000`

**Keep this terminal open!**

---

### Step 4: Install BurpSuite (If Not Installed)

1. **Download BurpSuite:**
   - Go to: https://portswigger.net/burp/communitydownload
   - Download "Community Edition" (free)
   - Install it

2. **Open BurpSuite:**
   - Launch BurpSuite
   - Click "Next" through setup
   - Choose "Temporary project"
   - Click "Start Burp"

3. **Configure BurpSuite:**
   - Go to **Proxy → Intercept**
   - Turn **"Intercept is on"** (button should be orange/red)

---

### Step 5: Configure Browser Proxy

**Option A: Chrome (Recommended)**

1. **Install Proxy Extension:**
   - Go to Chrome Web Store
   - Search: "Proxy SwitchyOmega"
   - Install it

2. **Configure Extension:**
   - Click Proxy SwitchyOmega icon
   - Click "Options"
   - Click "New Profile"
   - Name: "BurpSuite"
   - HTTP Proxy: `127.0.0.1`
   - Port: `8080`
   - Click "Save"
   - Click extension icon → Select "BurpSuite"

**Option B: Manual Chrome Settings**

1. Open Chrome Settings
2. Go to: `chrome://settings/system`
3. Click "Open your computer's proxy settings"
4. Set:
   - Proxy: `127.0.0.1`
   - Port: `8080`

---

### Step 6: Install Burp CA Certificate

**⚠️ CRITICAL: Without this, you can't intercept HTTPS traffic!**

1. **Export Certificate from BurpSuite:**
   - Open BurpSuite
   - Go to **Proxy → Options**
   - Scroll to **"Proxy Listeners"**
   - Click **"Import/export CA certificate"**
   - Click **"Export"**
   - Save as: `burp-cert.der` (on Desktop)

2. **Install in Chrome:**
   - Open Chrome Settings
   - Go to: `chrome://settings/certificates`
   - Click **"Authorities"** tab
   - Click **"Import"**
   - Select `burp-cert.der`
   - Check **"Trust this certificate for identifying websites"**
   - Click **"OK"**

3. **Verify:**
   - Navigate to `http://localhost:3000`
   - Should NOT show SSL errors
   - BurpSuite should intercept requests

---

## 🎯 ATTACK EXECUTION (20 minutes)

### Step 7: Register Two Users

**Browser Window 1 (Alice):**

1. Navigate to: `http://localhost:3000`
2. Click **"Register"**
3. Fill in:
   - Username: `alice`
   - Email: `alice@test.com`
   - Password: `alice123`
4. Click **"Register"**
5. You'll be logged in automatically

**Browser Window 2 (Bob) - Use Incognito or Different Browser:**

1. Open Incognito window (Ctrl+Shift+N)
2. Navigate to: `http://localhost:3000`
3. Click **"Register"**
4. Fill in:
   - Username: `bob`
   - Email: `bob@test.com`
   - Password: `bob123`
5. Click **"Register"**
6. You'll be logged in automatically

---

### Step 8: Generate Attacker's Keys

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
    
    // Export attacker's public key
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
    console.error('Error:', error);
  }
})();
```

4. Press **Enter**
5. **Copy the JSON output** (the public key)
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

---

### Step 9: Initiate Key Exchange

**In Browser Window 1 (Alice):**

1. You should see a list of users
2. **Click on "bob"** to select him
3. You'll see: "Selected: **bob**"
4. Click **"Load Keys"** button
5. Enter password: `alice123`
6. Wait for: "Keys loaded successfully"
7. Click **"Establish Secure Connection"** button

**What Happens:**
- Alice sends a key exchange INIT message
- BurpSuite intercepts it (you'll see it in BurpSuite)

---

### Step 10: Intercept and Modify INIT Message

**In BurpSuite:**

1. **You should see an intercepted request:**
   - Request: `POST /api/keyExchange/init`
   - Status: Paused (waiting for you)

2. **Click on the request** in BurpSuite
3. **Scroll down** to see the request body (JSON)
4. **Find this field:**
   ```json
   "senderECDHPublic": {
     "kty": "EC",
     "crv": "P-256",
     "x": "ALICE_X_COORDINATE",
     "y": "ALICE_Y_COORDINATE"
   }
   ```

5. **Replace the entire `senderECDHPublic` object:**
   - Delete Alice's key
   - Paste attacker's public key (from Step 8)
   - Example:
     ```json
     "senderECDHPublic": {
       "kty": "EC",
       "crv": "P-256",
       "x": "YOUR_ATTACKER_X",
       "y": "YOUR_ATTACKER_Y"
     }
     ```

6. **Click "Forward"** button in BurpSuite
   - This sends the modified message to the server

---

### Step 11: Intercept and Modify RESPONSE Message

**In BurpSuite:**

1. **Another request will be intercepted:**
   - Request: `POST /api/keyExchange/response`
   - This is Bob's response

2. **Find `senderECDHPublic` in the response:**
   - It contains Bob's ECDH public key

3. **Replace it with attacker's public key** (same as before)

4. **Click "Forward"**

---

### Step 12: Complete Key Exchange

**In BurpSuite:**

1. **More requests will be intercepted:**
   - `POST /api/keyExchange/confirm`
   - `POST /api/keyExchange/ack`
   - **You can forward these without modification** (they're encrypted)

2. **After forwarding all messages:**
   - Turn **"Intercept is off"** in BurpSuite
   - This allows normal traffic to flow

---

### Step 13: Verify Attack Success

**In Browser Window 1 (Alice):**

1. **Check the status:**
   - Should show: "✅ Secure channel established"
   - Status: "established"

**In Browser Window 2 (Bob):**

1. **Check the status:**
   - Should show: "✅ Secure channel established"
   - Status: "established"

**⚠️ IMPORTANT:**
- Both Alice and Bob think they're connected to each other
- But they're actually both connected to the attacker!
- The attacker can decrypt all messages

---

### Step 14: Test Message Exchange

**In Browser Window 1 (Alice):**

1. Type a message: `"Hello Bob, this is a secret message!"`
2. Click **"Send"**

**In Browser Window 2 (Bob):**

1. **You should receive the message:**
   - "Hello Bob, this is a secret message!"

**In BurpSuite:**

1. Go to **Proxy → HTTP history**
2. Find the message send request: `POST /api/messages/send`
3. **You can see the encrypted message** (attacker can decrypt it)

---

## 🛡️ DEMONSTRATE DEFENSE (10 minutes)

### Step 15: Switch to Protected Version

**In Terminal (PowerShell):**

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

**Restart Client:**

1. **In Terminal 2 (client terminal):**
   - Press `Ctrl+C` to stop
   - Run: `npm start` again

---

### Step 16: Attempt Same Attack

**Repeat Steps 9-11:**

1. Register users (or use existing)
2. Initiate key exchange
3. Intercept and modify ECDH public key

**What Happens:**

1. **In Browser Console:**
   - Error: `"Invalid signature in init message"`

2. **In Browser UI:**
   - Key exchange failed
   - Error message displayed

3. **Attack is PREVENTED!**

---

## 📸 CAPTURE EVIDENCE

**Take Screenshots of:**

1. ✅ BurpSuite intercepting INIT message
2. ✅ Modified ECDH public key in BurpSuite
3. ✅ Both browsers showing "Secure channel established" (vulnerable)
4. ✅ Signature error in console (protected)
5. ✅ Key exchange failed message (protected)

---

## ✅ COMPLETION CHECKLIST

- [ ] Vulnerable version activated
- [ ] Server running
- [ ] Client running
- [ ] BurpSuite installed and configured
- [ ] Browser proxy configured
- [ ] CA certificate installed
- [ ] Users registered (alice, bob)
- [ ] Attacker keys generated
- [ ] Attack executed successfully
- [ ] Evidence captured (screenshots)
- [ ] Defense demonstrated
- [ ] Protected version restored

---

## 🔄 RESTORE PROTECTED VERSION

**After Demo:**

```bash
node scripts/switch-mitm-version.js protected
```

**Restart client:**
```bash
cd client
npm start
```

---

## ⚠️ TROUBLESHOOTING

### Problem: BurpSuite Not Intercepting

**Solution:**
1. Check proxy settings in browser
2. Verify BurpSuite listener on port 8080
3. Check "Intercept is on"
4. Try turning off intercept and check HTTP history

### Problem: Can't Modify JSON

**Solution:**
1. Use BurpSuite "Pretty" view
2. Copy to Notepad, modify, paste back
3. Use "Repeater" tab for easier editing

### Problem: Key Exchange Fails

**Solution:**
1. Check browser console for errors
2. Verify both users registered
3. Check server is running
4. Verify keys loaded (click "Load Keys")

### Problem: SSL Certificate Errors

**Solution:**
1. Install Burp CA certificate (Step 6)
2. Restart browser
3. Clear browser cache

---

## 📝 NOTES

- **Vulnerable version is ONLY for demonstration**
- **Never use in production**
- **Always restore protected version after demo**
- **Keep vulnerable code separate**

---

**Total Time:** ~45-60 minutes  
**Difficulty:** Medium  
**Required Tools:** BurpSuite, Browser with proxy

---

**Ready to start? Begin with Step 1!** 🚀

