# Quick Start: MITM Attack Manual Testing

## 🚀 Fast Track (5 minutes to start)

### 1. Verify Setup
```bash
node test-mitm-attack.js
```

### 2. Start Services
```bash
# Terminal 1 - Server
cd server && npm start

# Terminal 2 - Client  
cd client && npm start
```

### 3. Configure BurpSuite
- Open BurpSuite → Proxy → Intercept → Turn "Intercept is on"
- Configure browser proxy: `127.0.0.1:8080`
- Install Burp CA certificate (Proxy → Options → Export CA certificate)

### 4. Test Attack
- Register two users (alice, bob)
- Generate attacker keys in browser console
- Initiate key exchange
- Intercept and modify keys in BurpSuite
- Verify attack succeeds (vulnerable) or fails (protected)

---

## 📖 Full Guide

**See:** `MANUAL_MITM_TEST_GUIDE.md` for complete step-by-step instructions

---

## ⚡ Quick Commands

```bash
# Check version
node scripts/switch-mitm-version.js status

# Switch to vulnerable (for attack test)
node scripts/switch-mitm-version.js vulnerable

# Switch to protected (for defense test)
node scripts/switch-mitm-version.js protected

# Run automated test
node test-mitm-attack.js
```

---

## ✅ Expected Results

**Vulnerable Version:**
- ✅ Attack succeeds
- ✅ Key exchange completes
- ✅ Both parties connect (but to attacker)

**Protected Version:**
- ✅ Attack fails
- ✅ Signature error appears
- ✅ Key exchange aborted

---

**For detailed instructions, see:** `MANUAL_MITM_TEST_GUIDE.md`

