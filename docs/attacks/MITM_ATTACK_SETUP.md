# MITM Attack Demonstration - Setup Guide

This guide will help you set up and execute a Man-in-the-Middle (MITM) attack demonstration on the vulnerable version of the secure messaging system.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Create Vulnerable Version](#step-1-create-vulnerable-version)
4. [Step 2: Install BurpSuite](#step-2-install-burpsuite)
5. [Step 3: Configure Browser Proxy](#step-3-configure-browser-proxy)
6. [Step 4: Install Burp CA Certificate](#step-4-install-burp-ca-certificate)
7. [Step 5: Execute Attack](#step-5-execute-attack)
8. [Step 6: Demonstrate Defense](#step-6-demonstrate-defense)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### Objective

Demonstrate that:
1. **Without digital signatures**, an attacker can intercept and modify ECDH public keys during key exchange (attack succeeds)
2. **With digital signatures**, the same attack is detected and prevented (attack fails)

### Attack Scenario

1. Alice initiates key exchange with Bob
2. Attacker (using BurpSuite) intercepts the key exchange messages
3. Attacker replaces Alice's ECDH public key with their own
4. Bob receives modified key and derives session key with attacker
5. Attacker can now decrypt all messages between Alice and Bob

---

## Prerequisites

### Required Software

- **Node.js** (v14+) - Already installed
- **BurpSuite Community Edition** - Free download
- **Browser** (Chrome or Firefox)
- **Wireshark** (optional, for packet capture)

### Required Knowledge

- Basic understanding of HTTP proxies
- Basic understanding of key exchange protocols
- Familiarity with browser developer tools

---

## Step 1: Create Vulnerable Version

### Option A: Use Vulnerable File (Recommended)

1. **Copy the vulnerable file:**
   ```bash
   cd client/src/crypto
   cp keyExchange.js keyExchange.backup.js  # Backup original
   cp keyExchange.vulnerable.js keyExchange.js  # Use vulnerable version
   ```

2. **Restart the client:**
   ```bash
   cd client
   npm start
   ```

### Option B: Create Git Branch

1. **Create and switch to vulnerable branch:**
   ```bash
   git checkout -b vulnerable-no-signatures
   ```

2. **Modify `client/src/crypto/keyExchange.js`:**
   - Comment out signature creation in `createInitMessage()` (line 76)
   - Comment out signature verification in `processInitMessage()` (line 121)
   - Comment out signature creation in `createResponseMessage()` (line 178)
   - Comment out signature verification in `processResponseMessage()` (line 236)

3. **Test vulnerable version:**
   - Key exchange should still work
   - But signatures are missing/not verified
   - Check browser console for: `⚠️ VULNERABLE MODE: Signature verification DISABLED`

---

## Step 2: Install BurpSuite

### Download

1. Go to: https://portswigger.net/burp/communitydownload
2. Download BurpSuite Community Edition (free)
3. Install the application

### First Launch

1. Open BurpSuite
2. Click "Next" through the setup wizard
3. Choose "Temporary project" or create a new project
4. Click "Start Burp"

---

## Step 3: Configure Browser Proxy

### Chrome Configuration

1. **Install Proxy Extension (Recommended):**
   - Install "Proxy SwitchyOmega" or similar extension
   - Or use Chrome's built-in proxy settings

2. **Manual Configuration:**
   - Open Chrome Settings → Advanced → System
   - Click "Open proxy settings"
   - Or use: `chrome://settings/system`

3. **Set Proxy:**
   - Proxy: `127.0.0.1`
   - Port: `8080`
   - Protocol: HTTP

### Firefox Configuration

1. Open Firefox Settings
2. Go to Network Settings
3. Click "Settings"
4. Select "Manual proxy configuration"
5. Set:
   - HTTP Proxy: `127.0.0.1`
   - Port: `8080`
   - Check "Use this proxy server for all protocols"

### Verify Proxy

1. Open BurpSuite
2. Go to **Proxy → Intercept**
3. Turn **"Intercept is on"**
4. Open browser and navigate to any website
5. You should see the request intercepted in BurpSuite

---

## Step 4: Install Burp CA Certificate

**⚠️ CRITICAL:** Without the CA certificate, BurpSuite cannot intercept HTTPS traffic.

### Export Certificate

1. Open BurpSuite
2. Go to **Proxy → Options**
3. Scroll to **"Proxy Listeners"**
4. Click **"Import/export CA certificate"**
5. Click **"Export"**
6. Save as `burp-cert.der` or `burp-cert.crt`

### Install in Chrome

1. Open Chrome Settings
2. Go to **Privacy and security → Security → Manage certificates**
3. Or navigate to: `chrome://settings/certificates`
4. Click **"Authorities"** tab
5. Click **"Import"**
6. Select the exported certificate file
7. Check **"Trust this certificate for identifying websites"**
8. Click **"OK"**

### Install in Firefox

1. Open Firefox Settings
2. Go to **Privacy & Security**
3. Scroll to **"Certificates"**
4. Click **"View Certificates"**
5. Click **"Authorities"** tab
6. Click **"Import"**
7. Select the exported certificate file
8. Check **"Trust this CA to identify websites"**
9. Click **"OK"**

### Verify Certificate

1. Navigate to `https://localhost:3000` (or your app URL)
2. You should NOT see SSL certificate errors
3. BurpSuite should intercept HTTPS traffic

---

## Step 5: Execute Attack

### Setup Environment

1. **Start Server:**
   ```bash
   cd server
   npm start
   ```

2. **Start Client (Vulnerable Version):**
   ```bash
   cd client
   npm start
   ```

3. **Open BurpSuite:**
   - Go to **Proxy → Intercept**
   - Turn **"Intercept is on"**

### Attack Execution

#### Step 5.1: Register Users

1. Open browser (with proxy configured)
2. Navigate to `http://localhost:3000`
3. Register user "alice" (password: `alice123`)
4. Register user "bob" (password: `bob123`)
5. Log in as both users in separate browser windows/incognito

#### Step 5.2: Generate Attacker Keys

1. **In browser console (or separate script):**
   ```javascript
   // Generate attacker's ECDH key pair
   const attackerKeyPair = await window.crypto.subtle.generateKey(
     {
       name: 'ECDH',
       namedCurve: 'P-256',
     },
     true,
     ['deriveKey', 'deriveBits']
   );
   
   // Export attacker's public key
   const attackerPublicKey = await window.crypto.subtle.exportKey('jwk', attackerKeyPair.publicKey);
   console.log('Attacker Public Key:', JSON.stringify(attackerPublicKey));
   ```

2. **Save the attacker's public key** (you'll need it to replace Alice's key)

#### Step 5.3: Initiate Key Exchange

1. **In Browser 1 (Alice):**
   - Select user "bob"
   - Click "Load Keys"
   - Click "Establish Secure Connection"

2. **In BurpSuite:**
   - You should see the intercepted request: `POST /api/keyExchange/init`
   - The request body contains Alice's ECDH public key

#### Step 5.4: Modify Key Exchange Message

1. **In BurpSuite Intercept:**
   - Find the `senderECDHPublic` field in the JSON
   - Replace Alice's ECDH public key with attacker's public key
   - Example:
     ```json
     {
       "type": "KEY_EXCHANGE_INIT",
       "senderId": "alice",
       "receiverId": "bob",
       "senderECDHPublic": {
         "kty": "EC",
         "crv": "P-256",
         "x": "ATTACKER_X_COORDINATE",
         "y": "ATTACKER_Y_COORDINATE"
       },
       ...
     }
     ```

2. **Click "Forward"** to send modified message

#### Step 5.5: Intercept Response

1. **Bob automatically responds:**
   - BurpSuite intercepts: `POST /api/keyExchange/response`

2. **Modify Bob's Response:**
   - Replace Bob's `senderECDHPublic` with attacker's public key
   - Click "Forward"

#### Step 5.6: Verify Attack Success

1. **Check Browser Console:**
   - Both Alice and Bob should show "Secure channel established"
   - But they're actually connected to the attacker!

2. **Attacker Can Decrypt:**
   - Attacker has session keys with both Alice and Bob
   - Any message sent between them can be decrypted by attacker

3. **Send Test Message:**
   - Alice sends: "Hello Bob, this is secret!"
   - Attacker intercepts and decrypts in BurpSuite
   - Bob receives the message (unaware of MITM)

---

## Step 6: Demonstrate Defense

### Switch to Protected Version

1. **Restore Original File:**
   ```bash
   cd client/src/crypto
   cp keyExchange.backup.js keyExchange.js  # Restore original
   ```

2. **Or Switch Git Branch:**
   ```bash
   git checkout main
   ```

3. **Restart Client:**
   ```bash
   cd client
   npm start
   ```

### Attempt Same Attack

1. **Repeat Attack Steps:**
   - Register users
   - Initiate key exchange
   - Intercept and modify ECDH public key

2. **Attack Should Fail:**
   - Signature verification fails
   - Key exchange aborted
   - Error message: "Invalid signature in init message"
   - Security log entry created

3. **Capture Evidence:**
   - Screenshot: Signature verification error
   - Screenshot: Key exchange failed
   - Screenshot: Security log entry

---

## Troubleshooting

### BurpSuite Not Intercepting

**Problem:** Requests not showing in BurpSuite

**Solutions:**
1. Check proxy settings in browser
2. Verify BurpSuite is listening on port 8080
3. Check "Intercept is on" in BurpSuite
4. Try turning off "Intercept is on" and check "Proxy → HTTP history"

### SSL Certificate Errors

**Problem:** Browser shows SSL certificate errors

**Solutions:**
1. Install Burp CA certificate (Step 4)
2. Restart browser after installing certificate
3. Clear browser cache

### Key Exchange Not Working

**Problem:** Key exchange fails even in vulnerable version

**Solutions:**
1. Check browser console for errors
2. Verify both users are registered
3. Check server is running
4. Verify keys are loaded (click "Load Keys")

### Can't Modify JSON in BurpSuite

**Problem:** JSON is minified or hard to edit

**Solutions:**
1. Use BurpSuite's "Pretty" view
2. Use "Repeater" tab for easier editing
3. Copy request to external editor, modify, paste back

---

## Next Steps

After completing the attack demonstration:

1. **Document Results:**
   - Create `docs/attacks/MITM_ATTACK_RESULTS.md`
   - Include screenshots
   - Explain attack success/failure

2. **Create Comparison:**
   - Vulnerable vs Protected
   - Before/After screenshots
   - Security log entries

3. **Prepare for Report:**
   - Collect all screenshots
   - Write attack analysis
   - Include in project report

---

## Safety Notes

⚠️ **IMPORTANT:**
- The vulnerable version is ONLY for demonstration
- Never use vulnerable code in production
- Always restore original files after demonstration
- Keep vulnerable branch separate from main branch

---

**Last Updated:** December 2024

