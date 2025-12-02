# MITM Attack Test - Quick Reference

## 🚀 Quick Start

### 1. Run Automated Test
```bash
node test-mitm-attack.js
```

### 2. Check Current Version
```bash
node scripts/switch-mitm-version.js status
```

### 3. Switch Versions
```bash
# Switch to vulnerable (for attack test)
node scripts/switch-mitm-version.js vulnerable

# Switch to protected (for defense test)
node scripts/switch-mitm-version.js protected
```

---

## 📋 Test Checklist

### Vulnerable Version Test (Attack Should Succeed)
- [ ] Switch to vulnerable version
- [ ] Start server and client
- [ ] Configure BurpSuite proxy
- [ ] Register two users (alice, bob)
- [ ] Generate attacker keys in browser console
- [ ] Initiate key exchange
- [ ] Intercept and modify ECDH public key in BurpSuite
- [ ] Verify: Key exchange completes successfully
- [ ] Verify: Both browsers show "Secure channel established"
- [ ] ✅ **TEST PASSED:** Attack succeeds

### Protected Version Test (Attack Should Fail)
- [ ] Switch to protected version
- [ ] Restart client
- [ ] Initiate key exchange
- [ ] Intercept and modify ECDH public key in BurpSuite
- [ ] Verify: Key exchange fails
- [ ] Verify: Signature error in console
- [ ] ✅ **TEST PASSED:** Attack prevented

---

## 🔑 Key Differences

| Feature | Vulnerable Version | Protected Version |
|---------|-------------------|-------------------|
| Signature Creation | ❌ Disabled | ✅ Enabled |
| Signature Verification | ❌ Disabled | ✅ Enabled |
| Key Modification | ✅ Possible | ❌ Detected |
| Attack Success | ✅ Yes | ❌ No |
| Console Warning | ⚠️ VULNERABLE MODE | None |

---

## 🎯 Expected Results

### Vulnerable Version
```
✅ Key exchange completes
✅ No signature errors
✅ Both parties establish connection
✅ Attacker can modify keys without detection
```

### Protected Version
```
✅ Key exchange fails when key is modified
✅ Signature verification error appears
✅ Attack is prevented
✅ Security is maintained
```

---

## ⚠️ Important Reminders

1. **Always restore protected version after testing:**
   ```bash
   node scripts/switch-mitm-version.js protected
   ```

2. **Vulnerable version is ONLY for demonstration**

3. **Never use vulnerable code in production**

---

## 📞 Quick Commands

```bash
# Check status
node scripts/switch-mitm-version.js status

# Switch to vulnerable
node scripts/switch-mitm-version.js vulnerable

# Switch to protected
node scripts/switch-mitm-version.js protected

# Run automated test
node test-mitm-attack.js
```

---

**For detailed instructions, see:** `MITM_TEST_GUIDE.md`

