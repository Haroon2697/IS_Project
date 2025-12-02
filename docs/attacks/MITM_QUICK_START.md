# MITM Attack Demo - Quick Start Guide

**Quick reference for executing the MITM attack demonstration.**

---

## 🚀 Quick Setup (5 minutes)

### 1. Switch to Vulnerable Version

```bash
cd client/src/crypto
cp keyExchange.js keyExchange.backup.js  # Backup original
cp keyExchange.vulnerable.js keyExchange.js  # Use vulnerable
```

### 2. Start Services

**Terminal 1:**
```bash
cd server
npm start
```

**Terminal 2:**
```bash
cd client
npm start
```

### 3. Install BurpSuite

1. Download: https://portswigger.net/burp/communitydownload
2. Install and launch
3. Go to **Proxy → Intercept** → Turn "Intercept is on"

### 4. Configure Browser Proxy

- **Proxy:** `127.0.0.1:8080`
- **Port:** `8080`

### 5. Install Burp CA Certificate

1. BurpSuite → **Proxy → Options**
2. Click **"Import/export CA certificate"** → **Export**
3. Install in browser (Chrome: Settings → Certificates → Import)

---

## ⚡ Quick Attack (10 minutes)

### Step 1: Register Users
- Alice: `alice` / `alice123`
- Bob: `bob` / `bob123`

### Step 2: Generate Attacker Keys
**Browser Console:**
```javascript
const attackerKeyPair = await window.crypto.subtle.generateKey(
  { name: 'ECDH', namedCurve: 'P-256' },
  true,
  ['deriveKey', 'deriveBits']
);
const attackerPublicKey = await window.crypto.subtle.exportKey('jwk', attackerKeyPair.publicKey);
console.log(JSON.stringify(attackerPublicKey));
window.attackerPublicKey = attackerPublicKey;
```

### Step 3: Execute Attack
1. Alice initiates key exchange with Bob
2. BurpSuite intercepts `POST /api/keyExchange/init`
3. Replace `senderECDHPublic` with attacker's public key
4. Forward message
5. Intercept response, replace Bob's key
6. Forward

### Step 4: Verify
- Both browsers show "Secure channel established"
- Attacker can decrypt messages

---

## 🛡️ Quick Defense Demo (5 minutes)

### Switch to Protected Version

```bash
cd client/src/crypto
cp keyExchange.backup.js keyExchange.js  # Restore original
```

### Attempt Same Attack
- Intercept and modify key
- Attack fails: "Invalid signature"
- Key exchange aborted

---

## 📸 Screenshots Needed

1. BurpSuite intercepting INIT message
2. Modified ECDH public key
3. Both browsers showing "established"
4. Signature error (protected version)
5. Key exchange failed (protected version)

---

## 🔄 Switch Versions Script

**Create `switch-version.sh`:**
```bash
#!/bin/bash
cd client/src/crypto

if [ "$1" == "vulnerable" ]; then
  cp keyExchange.js keyExchange.backup.js
  cp keyExchange.vulnerable.js keyExchange.js
  echo "✅ Switched to VULNERABLE version"
elif [ "$1" == "protected" ]; then
  cp keyExchange.backup.js keyExchange.js
  echo "✅ Switched to PROTECTED version"
else
  echo "Usage: ./switch-version.sh [vulnerable|protected]"
fi
```

---

## 📚 Full Documentation

- **Setup Guide:** `docs/attacks/MITM_ATTACK_SETUP.md`
- **Execution Guide:** `docs/attacks/MITM_ATTACK_EXECUTION.md`
- **Attack Plan:** `docs/security/ATTACK_DEMOS.md`

---

**Time to Complete:** 20-30 minutes total

