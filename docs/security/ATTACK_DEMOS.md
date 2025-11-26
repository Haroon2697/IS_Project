# Attack Demonstrations

This document contains detailed plans and documentation for demonstrating security attacks and defenses.

---

## 1. MITM (Man-in-the-Middle) Attack Demonstration

### 1.1 Objective

Demonstrate that:
1. **Without digital signatures**, an attacker can intercept and modify ECDH public keys (attack succeeds)
2. **With digital signatures**, the same attack is detected and prevented (attack fails)

### 1.2 Tools Required

- **BurpSuite Community Edition** (HTTP proxy)
  - Download: https://portswigger.net/burp/communitydownload
- **Wireshark** (packet capture)
  - Download: https://www.wireshark.org/
- **Browser** with proxy configuration (Chrome/Firefox)

### 1.3 Setup

#### Step 1: Install BurpSuite
```bash
# Download and install BurpSuite Community Edition
# Configure browser to use Burp as proxy:
# - Proxy: 127.0.0.1
# - Port: 8080
```

#### Step 2: Install Burp's CA Certificate
```
1. Open Burp → Proxy → Options
2. Import/export CA certificate
3. Install in browser (Trust for intercepting HTTPS)
```

#### Step 3: Prepare Two Versions of Your App

**Version A: Vulnerable (No Signatures)**
```bash
git checkout -b vulnerable-no-signatures
# In keyExchange.js, comment out signature verification:
// Remove these lines:
// const isValid = await verifySignature(publicKey, signature, data);
// if (!isValid) throw new Error("Invalid signature");
```

**Version B: Protected (With Signatures)**
```bash
git checkout main
# Full signature verification enabled
```

---

### 1.4 Attack Execution (Version A - Vulnerable)

#### Step 1: Start Vulnerable Version
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend (vulnerable branch)
cd client
npm start
```

#### Step 2: Configure Burp Intercept
1. Open BurpSuite
2. Go to Proxy → Intercept
3. Turn "Intercept is on"
4. Set scope to your app's domain

#### Step 3: Initiate Key Exchange
1. Open browser (configured to use Burp proxy)
2. Login as Alice
3. Start new chat with Bob
4. Alice initiates key exchange

#### Step 4: Intercept and Modify
1. Burp intercepts the key exchange message:
   ```json
   {
     "type": "KEY_EXCHANGE_INIT",
     "senderId": "alice",
     "senderECDHPublic": "ALICE_ECDH_PUBLIC_KEY",
     "nonce": "...",
     "timestamp": 1234567890
   }
   ```

2. **Attacker replaces Alice's ECDH public key with their own:**
   ```json
   {
     "type": "KEY_EXCHANGE_INIT",
     "senderId": "alice",
     "senderECDHPublic": "ATTACKER_ECDH_PUBLIC_KEY",  ← MODIFIED
     "nonce": "...",
     "timestamp": 1234567890
   }
   ```

3. Forward modified message to Bob

4. Bob responds with his ECDH public key

5. Intercept Bob's response and replace with attacker's key

6. Result: **Both Alice and Bob derive session keys with the attacker, not each other**

#### Step 5: Demonstrate Attack Success
1. Alice sends message: "Hello Bob"
2. Attacker intercepts encrypted message
3. **Attacker can decrypt** (has session key with Alice)
4. Display decrypted plaintext
5. Attacker re-encrypts with Bob's session key
6. Forward to Bob

📸 **Screenshots to capture:**
- Burp showing intercepted key exchange
- Modified ECDH public key
- Decrypted message in Burp
- Both clients think they're secure (show lock icon)

---

### 1.5 Defense Demonstration (Version B - Protected)

#### Step 1: Switch to Protected Version
```bash
git checkout main
# Restart frontend and backend
```

#### Step 2: Attempt Same Attack
1. Configure Burp intercept (same as before)
2. Login as Alice
3. Initiate key exchange with Bob
4. Burp intercepts message:
   ```json
   {
     "type": "KEY_EXCHANGE_INIT",
     "senderId": "alice",
     "senderECDHPublic": "ALICE_ECDH_PUBLIC_KEY",
     "nonce": "...",
     "timestamp": 1234567890,
     "signature": "ALICE_SIGNATURE"  ← NOW INCLUDED
   }
   ```

5. **Attacker replaces ECDH public key** (same as before)

6. Forward to Bob

7. **Bob verifies signature**:
   ```javascript
   // Bob's code:
   const isValid = await verifySignature(
     alicePublicKey,  // Retrieved from server
     signature,
     hash(senderECDHPublic + nonce + timestamp)
   );
   // isValid = FALSE (because ECDH key was modified)
   ```

8. **Signature verification fails** → **Key exchange aborted**

9. Error displayed to user: "Key exchange failed - Invalid signature"

10. Security log entry:
    ```
    [ERROR] Invalid signature detected in key exchange
    Sender: alice
    Receiver: bob
    Timestamp: 2024-11-26T10:30:00Z
    Severity: CRITICAL
    Details: Possible MITM attack
    ```

📸 **Screenshots to capture:**
- Burp showing attempted modification
- Signature verification failure in console
- Error message displayed to user
- Security log showing "Invalid signature" event

---

### 1.6 Evidence Collection

#### Wireshark Capture

**Vulnerable Version:**
```
1. Start Wireshark on loopback interface
2. Filter: tcp.port == 5000
3. Capture key exchange messages
4. Export packet capture: mitm_vulnerable.pcapng
5. Show in report: cleartext JSON (before encryption)
```

**Protected Version:**
```
1. Same Wireshark capture
2. Show signature field present
3. Show connection termination after sig verification fails
4. Export: mitm_protected.pcapng
```

#### Screenshots Checklist

- [ ] BurpSuite proxy configuration
- [ ] Intercepted key exchange message (vulnerable)
- [ ] Modified ECDH public key (red highlight)
- [ ] Decrypted message shown in Burp (vulnerable)
- [ ] Signature field in protected version
- [ ] Error message when attack fails (protected)
- [ ] Security logs showing "Invalid signature"
- [ ] Wireshark packets (side-by-side comparison)

---

### 1.7 Report Documentation

**Section for Report:**

```markdown
## MITM Attack Demonstration

### Attack on Vulnerable Version (No Signatures)

We created a vulnerable version of our protocol by removing digital signature
verification. Using BurpSuite as a proxy, we intercepted the key exchange
messages between Alice and Bob.

[Screenshot 1: BurpSuite intercept configuration]

The attacker replaced Alice's ephemeral ECDH public key with their own:

[Screenshot 2: Modified message in Burp]

As a result, Alice and Bob unknowingly performed key exchange with the attacker
instead of each other. The attacker could decrypt all messages:

[Screenshot 3: Decrypted message in Burp]

[Screenshot 4: Wireshark capture showing cleartext after attack]

### Defense with Digital Signatures

In our final protocol implementation, every key exchange message is signed
with the sender's long-term private key:

[Code snippet: signature creation]

When we attempted the same MITM attack on the protected version, Bob's
signature verification detected the tampering:

[Screenshot 5: Signature verification failure]

The key exchange was immediately aborted, and a security event was logged:

[Screenshot 6: Security log entry]

This demonstrates that digital signatures successfully prevent MITM attacks
on our key exchange protocol.
```

---

## 2. Replay Attack Demonstration

### 2.1 Objective

Demonstrate that:
1. **Without replay protection**, an attacker can resend captured messages (attack succeeds)
2. **With nonce/timestamp/sequence checks**, replayed messages are rejected (attack fails)

### 2.2 Tools Required

- **BurpSuite** (Repeater function)
- **Wireshark**
- **Custom Python script** (optional, for automated replay)

### 2.3 Setup

#### Create Vulnerable Version
```bash
git checkout -b vulnerable-no-replay-protection

# In encryption.js, disable replay protection:
// Remove these checks:
// if (seenNonces.has(nonce)) throw new Error("Replay attack");
// if (Date.now() - timestamp > 300000) throw new Error("Old message");
// if (sequenceNumber <= lastSequenceNumber) throw new Error("Out of order");
```

---

### 2.4 Attack Execution (Vulnerable Version)

#### Step 1: Capture Legitimate Message

1. Start vulnerable version
2. Alice sends message: "Transfer $100 to Bob"
3. Capture message in Burp:
   ```json
   {
     "senderId": "alice",
     "receiverId": "bob",
     "ciphertext": "a8f2...",
     "iv": "7b3d...",
     "nonce": "9c4e...",
     "timestamp": 1234567890,
     "sequenceNumber": 1
   }
   ```

#### Step 2: Replay Captured Message

**Option A: Using Burp Repeater**
1. Right-click captured request → "Send to Repeater"
2. Click "Send" multiple times
3. Observe: **Message accepted and delivered each time**

**Option B: Using Python Script**
```python
import requests
import time

captured_message = {
    "senderId": "alice",
    "receiverId": "bob",
    "ciphertext": "a8f2...",
    "iv": "7b3d...",
    "nonce": "9c4e...",
    "timestamp": 1234567890,
    "sequenceNumber": 1
}

# Replay attack: send same message 10 times
for i in range(10):
    response = requests.post(
        "http://localhost:5000/api/messages/send",
        json=captured_message,
        headers={"Authorization": "Bearer <alice_jwt>"}
    )
    print(f"Replay {i+1}: {response.status_code}")
    time.sleep(1)
```

#### Step 3: Observe Results

- **Vulnerable version**: All 10 replayed messages accepted ❌
- Bob's chat shows "Transfer $100 to Bob" message 10 times
- Alice's actual message sent once, but Bob sees 10 copies

📸 **Screenshots:**
- Burp Repeater with captured request
- "Send" button clicked multiple times
- Bob's chat showing duplicate messages
- Wireshark showing replayed packets

---

### 2.5 Defense Demonstration (Protected Version)

#### Step 1: Switch to Protected Version
```bash
git checkout main
# Restart frontend and backend
```

#### Step 2: Capture Legitimate Message

1. Alice sends message: "Transfer $100 to Bob"
2. Capture in Burp (now includes nonce/timestamp/sequence)
3. Message delivered successfully (first time) ✅

#### Step 3: Attempt Replay Attack

**Using Burp Repeater:**
1. Send to Repeater
2. Click "Send" again

**Client-side rejection:**
```javascript
// decryptMessage() function checks:

// Check 1: Nonce already seen?
if (this.seenNonces.has(nonce)) {
  logSecurityEvent("REPLAY_ATTACK_DETECTED", {
    nonce: nonce,
    timestamp: timestamp,
    sender: senderId
  });
  throw new Error("Replay attack detected - nonce already used");
}

// Check 2: Timestamp too old?
if (Date.now() - timestamp > 300000) {  // 5 minutes
  throw new Error("Message too old - possible replay");
}

// Check 3: Sequence number valid?
if (sequenceNumber <= this.lastSequenceNumber) {
  throw new Error("Invalid sequence number - possible replay");
}

// All checks passed → accept message and update state
this.seenNonces.add(nonce);
this.lastSequenceNumber = sequenceNumber;
```

**Result:**
- **First send**: ✅ Accepted (new nonce)
- **Second send**: ❌ Rejected (nonce already seen)
- Security log entry created
- Error displayed in console

📸 **Screenshots:**
- Burp Repeater showing repeated sends
- First request: 200 OK
- Second request: 400 Bad Request (or client-side rejection)
- Console error: "Replay attack detected"
- Security log showing replay attempt

---

### 2.6 Testing Different Replay Scenarios

#### Scenario A: Immediate Replay
```
Original: timestamp = 1700000000, nonce = "abc123", seq = 1
Replayed: (exactly the same)
Result: ❌ REJECTED (nonce already seen)
```

#### Scenario B: Modified Timestamp
```
Original: timestamp = 1700000000, nonce = "abc123", seq = 1
Replayed: timestamp = 1700000001, nonce = "abc123", seq = 1
Result: ❌ REJECTED (nonce still seen, even with new timestamp)
```

#### Scenario C: Old Message
```
Original: timestamp = 1700000000 (5 minutes ago)
Replayed: (same)
Result: ❌ REJECTED (timestamp too old)
```

#### Scenario D: Out-of-Order
```
Already received: seq = 5
Attacker replays: seq = 3
Result: ❌ REJECTED (sequence number going backwards)
```

---

### 2.7 Evidence Collection

#### Security Logs

```json
{
  "eventType": "REPLAY_ATTACK_DETECTED",
  "timestamp": "2024-11-26T15:30:45Z",
  "severity": "HIGH",
  "details": {
    "senderId": "alice",
    "receiverId": "bob",
    "nonce": "9c4e...",
    "originalTimestamp": 1234567890,
    "attemptedAt": 1234567950,
    "reason": "Nonce already seen"
  }
}
```

#### Screenshots Checklist

- [ ] Burp Repeater with multiple sends (vulnerable)
- [ ] Bob's chat showing duplicate messages (vulnerable)
- [ ] Burp Repeater showing rejection (protected)
- [ ] Console error message (protected)
- [ ] Security log entry
- [ ] Wireshark showing repeated packets
- [ ] Side-by-side comparison (before/after)

---

### 2.8 Report Documentation

**Section for Report:**

```markdown
## Replay Attack Demonstration

### Attack on Vulnerable Version

Without replay protection, an attacker can capture an encrypted message
and resend it multiple times. We demonstrated this using BurpSuite's
Repeater function.

[Screenshot 1: Captured message in Burp]

We replayed the same encrypted message 10 times:

[Screenshot 2: Burp Repeater with multiple sends]

In the vulnerable version (without nonce/timestamp checks), all replayed
messages were accepted. Bob's chat showed the same message 10 times:

[Screenshot 3: Duplicate messages in Bob's chat]

[Screenshot 4: Wireshark capture showing replayed packets]

### Defense with Replay Protection

Our final implementation includes three layers of replay protection:

1. **Nonce Tracking**: Each message has a unique random nonce. The client
   tracks all seen nonces and rejects duplicates.

2. **Timestamp Validation**: Messages older than 5 minutes are rejected.

3. **Sequence Numbers**: Messages have incrementing sequence numbers.
   Out-of-order messages are rejected.

[Code snippet: replay protection checks]

When we attempted the same replay attack on the protected version:

[Screenshot 5: Console showing "Replay attack detected"]

[Screenshot 6: Security log entry]

The first message was accepted, but all subsequent replays were rejected.
This demonstrates that our replay protection mechanisms are effective.
```

---

## 3. Additional Attack Scenarios (Optional)

### 3.1 Brute Force Password Attack

**Objective**: Demonstrate rate limiting prevents brute force

1. Script to attempt multiple logins:
   ```python
   for password in password_list:
       login(username="alice", password=password)
   ```

2. Show rate limiting kicks in after N attempts
3. User locked out temporarily

### 3.2 Packet Sniffing (Wireshark)

**Objective**: Show that HTTPS + E2EE prevents reading messages

1. Capture all traffic with Wireshark
2. Show encrypted TLS traffic
3. Demonstrate that even with packet capture, messages are unreadable

---

## 4. Evidence Organization

### Folder Structure

```
docs/security/evidence/
├── mitm/
│   ├── screenshots/
│   │   ├── 01_burp_intercept.png
│   │   ├── 02_modified_key.png
│   │   ├── 03_decrypted_message.png
│   │   ├── 04_signature_failure.png
│   │   └── 05_security_log.png
│   ├── wireshark/
│   │   ├── mitm_vulnerable.pcapng
│   │   └── mitm_protected.pcapng
│   └── notes.md
│
├── replay/
│   ├── screenshots/
│   │   ├── 01_burp_repeater.png
│   │   ├── 02_duplicate_messages.png
│   │   ├── 03_replay_rejected.png
│   │   └── 04_security_log.png
│   ├── wireshark/
│   │   └── replay_attack.pcapng
│   ├── scripts/
│   │   └── replay_attack.py
│   └── notes.md
│
└── README.md
```

---

## 5. Testing Checklist

### MITM Attack
- [ ] Vulnerable version created (no signatures)
- [ ] BurpSuite configured and CA cert installed
- [ ] Attack executed successfully (vulnerable)
- [ ] Messages decrypted in Burp (vulnerable)
- [ ] Protected version tested
- [ ] Attack failed with signature error (protected)
- [ ] All screenshots captured
- [ ] Wireshark captures saved
- [ ] Documented in report

### Replay Attack
- [ ] Vulnerable version created (no replay protection)
- [ ] Message captured in Burp
- [ ] Replay successful (vulnerable)
- [ ] Duplicate messages observed (vulnerable)
- [ ] Protected version tested
- [ ] Replay rejected (protected)
- [ ] Security logs show detection (protected)
- [ ] All screenshots captured
- [ ] Python script created (optional)
- [ ] Documented in report

---

**Remember**: These attack demonstrations are **critical** for your grade (15 marks total). Make sure you have clear evidence with screenshots, logs, and Wireshark captures!

