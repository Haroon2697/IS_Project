# Custom Key Exchange Protocol

## 1. Protocol Overview

**Protocol Name**: ECDH-MA (Elliptic Curve Diffie-Hellman with Mutual Authentication)

**Version**: 1.0

**Purpose**: Establish a secure session key between two parties with mutual authentication and protection against MITM and replay attacks.

### Design Goals
✅ Forward secrecy (ephemeral keys)
✅ Mutual authentication (both parties verify each other)
✅ MITM resistance (digital signatures)
✅ Replay attack protection (nonces + timestamps)
✅ Key confirmation (explicit verification)

---

## 2. Protocol Specification

### 2.1 Notation

| Symbol | Meaning |
|--------|---------|
| `A`, `B` | Alice and Bob (communicating parties) |
| `Kpriv_A`, `Kpub_A` | Alice's long-term ECC private/public key pair |
| `Kpriv_B`, `Kpub_B` | Bob's long-term ECC private/public key pair |
| `E_A`, `E_B` | Ephemeral ECDH public keys |
| `e_A`, `e_B` | Ephemeral ECDH private keys |
| `N_A`, `N_B` | Random nonces |
| `T_A`, `T_B` | Timestamps |
| `Sign(K, M)` | ECDSA signature of message M using key K |
| `Verify(K, M, S)` | Verify signature S on message M using public key K |
| `ECDH(e, E)` | Elliptic Curve Diffie-Hellman shared secret |
| `HKDF(IKM, salt, info, L)` | HMAC-based Key Derivation Function |
| `Enc(K, M)` | AES-256-GCM encryption |
| `H(M)` | SHA-256 hash |
| `\|\|` | Concatenation |

### 2.2 Pre-requisites

Before starting the protocol:
- Both Alice and Bob have registered with the system
- Both have generated long-term ECC key pairs (P-256 or P-384)
- Public keys are available on the server
- Both have secure storage for private keys (IndexedDB)

---

## 3. Protocol Steps

### Phase 1: INITIALIZATION (Alice → Bob)

**Alice generates:**
- Ephemeral ECDH key pair: `(e_A, E_A)`
- Random nonce: `N_A` (256 bits)
- Current timestamp: `T_A`

**Alice sends:**
```
Message 1: {
  type: "KEY_EXCHANGE_INIT",
  senderId: "Alice",
  receiverId: "Bob",
  senderPublicKey: Kpub_A,          // Long-term public key
  senderECDHPublic: E_A,             // Ephemeral ECDH public key
  nonce: N_A,
  timestamp: T_A,
  signature: Sign(Kpriv_A, H(Kpub_A || E_A || N_A || T_A))
}
```

**Security properties:**
- `E_A` is ephemeral (used once, then discarded)
- `N_A` prevents replay attacks
- `T_A` prevents delayed message attacks
- Signature authenticates Alice and prevents MITM

---

### Phase 2: RESPONSE (Bob → Alice)

**Bob receives Message 1 and validates:**
1. ✅ Verify timestamp `T_A` is recent (within 5 minutes)
2. ✅ Verify nonce `N_A` hasn't been seen before
3. ✅ Retrieve Alice's public key `Kpub_A` from server
4. ✅ Verify signature: `Verify(Kpub_A, H(Kpub_A || E_A || N_A || T_A), signature)`

If validation fails → **ABORT** (log security event)

**Bob generates:**
- Ephemeral ECDH key pair: `(e_B, E_B)`
- Random nonce: `N_B` (256 bits)
- Current timestamp: `T_B`

**Bob sends:**
```
Message 2: {
  type: "KEY_EXCHANGE_RESPONSE",
  senderId: "Bob",
  receiverId: "Alice",
  senderPublicKey: Kpub_B,
  senderECDHPublic: E_B,              // Ephemeral ECDH public key
  nonceAlice: N_A,                    // Echo Alice's nonce
  nonceBob: N_B,
  timestamp: T_B,
  signature: Sign(Kpriv_B, H(Kpub_B || E_B || N_A || N_B || T_B))
}
```

---

### Phase 3: SESSION KEY DERIVATION (Both Parties)

**Alice computes:**
```
sharedSecret = ECDH(e_A, E_B)
sessionKey = HKDF(
  ikm: sharedSecret,
  salt: N_A || N_B,
  info: "session-key-v1" || "Alice" || "Bob",
  length: 32 bytes (256 bits)
)
```

**Bob computes:**
```
sharedSecret = ECDH(e_B, E_A)
sessionKey = HKDF(
  ikm: sharedSecret,
  salt: N_A || N_B,
  info: "session-key-v1" || "Alice" || "Bob",
  length: 32 bytes (256 bits)
)
```

**Both now have the same `sessionKey`**

**Important:**
- Ephemeral private keys `e_A` and `e_B` are **immediately deleted**
- Only `sessionKey` is kept in memory
- If either party loses connection, protocol must restart

---

### Phase 4: KEY CONFIRMATION (Alice → Bob)

Alice must prove she has derived the correct session key.

**Alice generates:**
- Random IV: `IV_A` (96 bits for GCM)

**Alice sends:**
```
Message 3: {
  type: "KEY_CONFIRM",
  senderId: "Alice",
  receiverId: "Bob",
  ciphertext: Enc(sessionKey, "KEY_CONFIRMED_" || N_B),
  iv: IV_A,
  authTag: <from AES-GCM>
}
```

**Bob validates:**
1. Decrypt ciphertext using `sessionKey`
2. Verify plaintext equals `"KEY_CONFIRMED_" || N_B`
3. If valid → Bob knows Alice has correct key

---

### Phase 5: KEY ACKNOWLEDGMENT (Bob → Alice)

Bob confirms he has the correct key.

**Bob generates:**
- Random IV: `IV_B`

**Bob sends:**
```
Message 4: {
  type: "KEY_ACK",
  senderId: "Bob",
  receiverId: "Alice",
  ciphertext: Enc(sessionKey, "KEY_ACKNOWLEDGED_" || N_A),
  iv: IV_B,
  authTag: <from AES-GCM>
}
```

**Alice validates:**
1. Decrypt ciphertext using `sessionKey`
2. Verify plaintext equals `"KEY_ACKNOWLEDGED_" || N_A`
3. If valid → Alice knows Bob has correct key

---

### Phase 6: SECURE COMMUNICATION ESTABLISHED

✅ Both parties have verified session key
✅ Secure channel established
✅ Can now exchange encrypted messages and files

**Session state:**
```javascript
{
  sessionKey: <32-byte AES key>,
  partnerId: "Alice" or "Bob",
  established: timestamp,
  lastSequenceNumber: 0,
  seenNonces: Set()
}
```

---

## 4. Protocol Flow Diagram

```
Alice                                                    Bob
  │                                                       │
  │ Generate: (e_A, E_A), N_A, T_A                       │
  │                                                       │
  │───────────── Message 1: INIT ──────────────────────> │
  │   Kpub_A, E_A, N_A, T_A, Sig_A                       │
  │                                                       │
  │                                   Verify: timestamp, signature
  │                                   Generate: (e_B, E_B), N_B, T_B
  │                                                       │
  │ <────────── Message 2: RESPONSE ─────────────────────│
  │   Kpub_B, E_B, N_A, N_B, T_B, Sig_B                  │
  │                                                       │
  │ Verify: timestamp, signature, nonce echo             │
  │                                                       │
  ├─ Compute: sharedSecret = ECDH(e_A, E_B) ─────────────┤
  ├─ Derive: sessionKey = HKDF(...) ─────────────────────┤
  │                                                       │
  │ Delete e_A                               Delete e_B  │
  │                                                       │
  │───────────── Message 3: CONFIRM ───────────────────> │
  │   Enc(sessionKey, "KEY_CONFIRMED_" || N_B)           │
  │                                                       │
  │                                   Decrypt & verify    │
  │                                                       │
  │ <──────────── Message 4: ACK ────────────────────────│
  │   Enc(sessionKey, "KEY_ACKNOWLEDGED_" || N_A)        │
  │                                                       │
  │ Decrypt & verify                                     │
  │                                                       │
  │════════════ SECURE CHANNEL ESTABLISHED ══════════════│
  │                                                       │
  │──────── Encrypted Messages (AES-GCM) ───────────────>│
  │<────── Encrypted Messages (AES-GCM) ─────────────────│
  │                                                       │
```

---

## 5. Security Analysis

### 5.1 Forward Secrecy
✅ **Achieved** through ephemeral ECDH keys
- Each session uses fresh `e_A` and `e_B`
- Ephemeral keys deleted after session key derivation
- Compromise of long-term keys does **not** compromise past sessions

### 5.2 Mutual Authentication
✅ **Achieved** through digital signatures
- Alice proves identity with `Sign(Kpriv_A, ...)`
- Bob proves identity with `Sign(Kpriv_B, ...)`
- Both verify each other's signatures before proceeding

### 5.3 MITM Resistance
✅ **Protected** by signature verification
- Attacker cannot forge signatures without private keys
- If attacker replaces ECDH public keys, signatures become invalid
- Both parties verify signatures before deriving session key

**Attack scenario:**
```
Alice → [Attacker intercepts] → Bob
- Attacker replaces E_A with E_attacker
- Attacker recomputes hash: H(Kpub_A || E_attacker || N_A || T_A)
- But attacker cannot create valid signature with Kpriv_A
- Bob's signature verification FAILS
- Protocol ABORTS
```

### 5.4 Replay Attack Resistance
✅ **Protected** by nonces and timestamps
- Each nonce is used exactly once
- Timestamps prevent old messages from being accepted
- Replayed messages are detected and rejected

**Attack scenario:**
```
- Attacker captures Message 1 from previous session
- Attacker resends captured Message 1
- Bob checks nonce N_A → already seen → REJECT
- OR Bob checks timestamp T_A → too old → REJECT
```

### 5.5 Key Confirmation
✅ **Ensured** by encrypted confirmation messages
- Alice proves she has correct key by encrypting known value
- Bob verifies by decrypting and checking expected value
- Prevents "unknown key share" attacks

### 5.6 Cryptographic Agility
⚠️ **Limited** - hardcoded algorithms
- Current: ECC P-256, AES-256-GCM, HKDF-SHA256
- No negotiation mechanism
- Future work: add algorithm negotiation phase

---

## 6. Comparison with Standard Protocols

### vs. Traditional Diffie-Hellman
| Feature | DH | Our Protocol |
|---------|----|----|
| Key Exchange | ✅ | ✅ |
| Forward Secrecy | ✅ (with ephemeral keys) | ✅ |
| Authentication | ❌ (vulnerable to MITM) | ✅ (signatures) |
| Replay Protection | ❌ | ✅ (nonces + timestamps) |
| Key Confirmation | ❌ | ✅ |

### vs. TLS 1.3 Handshake
| Feature | TLS 1.3 | Our Protocol |
|---------|---------|--------------|
| Key Exchange | ECDHE | ECDH |
| Authentication | Certificates | ECC Signatures |
| Forward Secrecy | ✅ | ✅ |
| Replay Protection | ✅ | ✅ |
| 0-RTT Support | ✅ | ❌ |
| Complexity | High | Medium |

**Why not just use TLS?**
- This is an **educational project** to learn cryptographic protocols
- We demonstrate understanding by building our own
- TLS is complex; this protocol is simpler to understand and document
- In production, we would use TLS!

---

## 7. Implementation Notes

### 7.1 Web Crypto API Usage

**Generate ECDH key pair:**
```javascript
const keyPair = await crypto.subtle.generateKey(
  {
    name: "ECDH",
    namedCurve: "P-256"
  },
  true,  // extractable (need to export public key)
  ["deriveKey"]
);
```

**Derive shared secret:**
```javascript
const sharedSecret = await crypto.subtle.deriveKey(
  {
    name: "ECDH",
    public: peerPublicKey
  },
  ownPrivateKey,
  {
    name: "AES-GCM",
    length: 256
  },
  false,  // not extractable
  ["encrypt", "decrypt"]
);
```

**HKDF:**
```javascript
const sessionKey = await crypto.subtle.deriveKey(
  {
    name: "HKDF",
    hash: "SHA-256",
    salt: combinedNonces,
    info: new TextEncoder().encode("session-key-v1")
  },
  sharedSecretKey,
  {
    name: "AES-GCM",
    length: 256
  },
  false,
  ["encrypt", "decrypt"]
);
```

### 7.2 Message Format (JSON)

```javascript
// Message 1: INIT
{
  "type": "KEY_EXCHANGE_INIT",
  "senderId": "alice@example.com",
  "receiverId": "bob@example.com",
  "senderPublicKey": "base64-encoded-jwk",
  "senderECDHPublic": "base64-encoded-jwk",
  "nonce": "base64-encoded-256-bits",
  "timestamp": 1638360000000,
  "signature": "base64-encoded-ecdsa-sig"
}
```

### 7.3 Error Handling

| Error | Code | Action |
|-------|------|--------|
| Invalid signature | 401 | Abort protocol, log security event |
| Expired timestamp | 408 | Abort protocol, request retry |
| Duplicate nonce | 409 | Abort protocol, log replay attempt |
| Decryption failure | 400 | Abort protocol, log error |
| Unknown user | 404 | Abort protocol, show error |

### 7.4 Timing Considerations

- Timestamp tolerance: **5 minutes** (300 seconds)
  - Accounts for clock skew between clients
  - Not too large to allow replay attacks
  
- Nonce cache duration: **10 minutes**
  - Keep seen nonces for longer than timestamp tolerance
  - Prevents replay attacks even with clock manipulation

- Session timeout: **1 hour**
  - After 1 hour of inactivity, require new key exchange
  - Reduces risk from compromised session keys

---

## 8. Testing Plan

### 8.1 Positive Tests
- [ ] Alice and Bob successfully establish session key
- [ ] Both derive identical session key
- [ ] Can encrypt/decrypt messages after key exchange
- [ ] Protocol completes in < 2 seconds

### 8.2 Negative Tests
- [ ] Invalid signature → protocol aborted
- [ ] Expired timestamp → protocol aborted
- [ ] Wrong nonce in confirmation → protocol aborted
- [ ] Replayed message → rejected

### 8.3 Attack Tests
- [ ] MITM attack → signatures prevent attack
- [ ] Replay attack → nonces prevent attack
- [ ] Modified ciphertext → auth tag verification fails

---

## 9. Limitations & Future Work

### Current Limitations
1. No algorithm negotiation (hardcoded)
2. No certificate infrastructure (trust on first use)
3. No session resumption (must re-exchange for each session)
4. No group key exchange (only pairwise)
5. No rekeying mechanism

### Future Improvements
1. Add cipher suite negotiation
2. Implement PKI with certificate verification
3. Add session tickets for resumption
4. Extend to group key establishment
5. Add periodic rekeying for long sessions

---

## 10. References

1. **RFC 5869** - HMAC-based Extract-and-Expand Key Derivation Function (HKDF)
   https://tools.ietf.org/html/rfc5869

2. **NIST SP 800-56A Rev. 3** - Recommendation for Pair-Wise Key-Establishment Schemes
   https://csrc.nist.gov/publications/detail/sp/800-56a/rev-3/final

3. **RFC 8446** - The Transport Layer Security (TLS) Protocol Version 1.3
   https://tools.ietf.org/html/rfc8446

4. **Web Cryptography API**
   https://www.w3.org/TR/WebCryptoAPI/

5. **NIST FIPS 186-4** - Digital Signature Standard (DSS)
   https://csrc.nist.gov/publications/detail/fips/186/4/final

---

## Appendix A: Protocol State Machine

```
       ┌─────────┐
       │  IDLE   │
       └────┬────┘
            │
            │ (User initiates chat)
            ▼
       ┌─────────┐
       │  INIT   │ ──────> Send Message 1
       └────┬────┘
            │
            │ (Receive Message 2)
            ▼
     ┌──────────┐
     │ RESPONSE │ ──────> Send Message 3 (Confirmation)
     └────┬─────┘
          │
          │ (Receive Message 4)
          ▼
    ┌───────────┐
    │ CONFIRMED │
    └─────┬─────┘
          │
          │ (All confirmations complete)
          ▼
    ┌────────────┐
    │ ESTABLISHED│ ──────> Can send encrypted messages
    └────────────┘
```

---

**Remember:** This protocol must be **unique to your group**. Modify message structure, add additional fields, or change the confirmation mechanism to make it yours!

