# 📋 TASK TRACKER

Track your daily progress here. Update daily!

---

## Week 1: Setup & Architecture (Days 1-7)

### Day 1: ⬜ Team Setup
- [ ] Team meeting completed
- [ ] Roles assigned
- [ ] GitHub repository created
- [ ] Branches created
- [ ] Project management board set up

**Notes:**
```
Date completed: _______
Issues faced: _______
Next steps: _______
```

---

### Day 2: ⬜ Architecture Design
- [ ] System architecture diagram created
- [ ] Message structure defined
- [ ] Crypto algorithms decided
- [ ] Documentation started

**Files Created:**
- [ ] `docs/architecture/ARCHITECTURE.md`
- [ ] `docs/protocols/KEY_EXCHANGE_PROTOCOL.md`

**Notes:**
```
Date completed: _______
Issues faced: _______
Next steps: _______
```

---

### Day 3: ⬜ Detailed Design
- [ ] Key exchange protocol documented
- [ ] Component design completed
- [ ] Database schema designed
- [ ] API endpoints planned

**Files Created:**
- [ ] `docs/protocols/CRYPTO_SPEC.md`
- [ ] `docs/architecture/COMPONENT_DESIGN.md`
- [ ] `docs/architecture/API_DESIGN.md`

**Notes:**
```
Date completed: _______
Issues faced: _______
Next steps: _______
```

---

### Day 4: ⬜ Backend Authentication
- [ ] Node.js project initialized
- [ ] User model created
- [ ] Registration endpoint implemented
- [ ] Login endpoint implemented
- [ ] Password hashing working (argon2/bcrypt)

**Git Commits:**
```
Member 3 commits: _______
```

**Notes:**
```
Date completed: _______
Issues faced: _______
Next steps: _______
```

---

### Day 5: ⬜ Frontend Authentication
- [ ] React project initialized
- [ ] Register UI created
- [ ] Login UI created
- [ ] API integration working
- [ ] Protected routes implemented

**Git Commits:**
```
Member 2 commits: _______
```

**Notes:**
```
Date completed: _______
Issues faced: _______
Next steps: _______
```

---

### Day 6: ⬜ Key Generation
- [ ] Web Crypto key generation implemented
- [ ] Public key export working
- [ ] Private key encryption implemented
- [ ] IndexedDB storage working
- [ ] Integration with registration

**Git Commits:**
```
Member 2 commits: _______
```

**Security Verification:**
- [ ] Private key NOT sent to server (verified)
- [ ] Private key encrypted in IndexedDB (verified)

**Notes:**
```
Date completed: _______
Issues faced: _______
Next steps: _______
```

---

### Day 7: ⬜ Key Retrieval
- [ ] Private key retrieval on login
- [ ] Key decryption working
- [ ] Key validation implemented
- [ ] Database verification (no private keys)

**Git Commits:**
```
Member 2 commits: _______
Member 3 commits: _______
```

**Notes:**
```
Date completed: _______
Issues faced: _______
Next steps: _______
```

---

## Week 2: Core Cryptography (Days 8-14)

### Day 8: ⬜ Protocol Design
- [ ] Custom key exchange protocol finalized
- [ ] Protocol diagram created
- [ ] Security properties documented
- [ ] Attack resistance analyzed

**Files Created:**
- [ ] Complete protocol specification
- [ ] Protocol flow diagram

**Notes:**
```
Date completed: _______
Protocol unique identifier: _______
Issues faced: _______
```

---

### Day 9: ⬜ Protocol Implementation
- [ ] ECDH key generation
- [ ] Session key derivation (HKDF)
- [ ] Signature creation
- [ ] Signature verification
- [ ] Backend relay endpoints

**Git Commits:**
```
Member 2 commits: _______
Member 3 commits: _______
```

**Notes:**
```
Date completed: _______
Issues faced: _______
Next steps: _______
```

---

### Day 10: ⬜ Protocol Testing
- [ ] Key exchange flow tested end-to-end
- [ ] Error cases tested
- [ ] MITM attack prep started
- [ ] UI integration completed

**Test Results:**
- [ ] Successful key exchange: ✅/❌
- [ ] Session keys match: ✅/❌
- [ ] Invalid signature rejected: ✅/❌

**Notes:**
```
Date completed: _______
Issues faced: _______
Next steps: _______
```

---

### Day 11: ⬜ Message Encryption
- [ ] AES-GCM encryption implemented
- [ ] Decryption implemented
- [ ] Replay protection implemented
- [ ] Chat UI integration

**Git Commits:**
```
Member 2 commits: _______
```

**Security Verification:**
- [ ] Random IV per message (verified)
- [ ] Auth tag verified (verified)
- [ ] Replay detection working (verified)

**Notes:**
```
Date completed: _______
Issues faced: _______
Next steps: _______
```

---

### Day 12: ⬜ Real-time Messaging
- [ ] Socket.io server set up
- [ ] Socket.io client integrated
- [ ] Real-time message delivery
- [ ] Typing indicators
- [ ] User presence

**Git Commits:**
```
Member 3 commits: _______
Member 2 commits: _______
```

**Notes:**
```
Date completed: _______
Issues faced: _______
Next steps: _______
```

---

### Day 13: ⬜ Message UI
- [ ] Complete chat interface
- [ ] Message features (timestamps, read receipts)
- [ ] Conversation list
- [ ] UI polish

**Git Commits:**
```
Member 2 commits: _______
```

**Notes:**
```
Date completed: _______
Issues faced: _______
Next steps: _______
```

---

### Day 14: ⬜ File Encryption
- [ ] File chunking implemented
- [ ] Chunk encryption implemented
- [ ] File upload flow
- [ ] Upload UI
- [ ] Backend file storage

**Git Commits:**
```
Member 2 commits: _______
Member 3 commits: _______
```

**Test Results:**
- [ ] Tested file types: _______
- [ ] Max file size tested: _______

**Notes:**
```
Date completed: _______
Issues faced: _______
Next steps: _______
```

---

## Week 3: Security & Documentation (Days 15-22)

### Day 15: ⬜ File Download
- [ ] File download flow
- [ ] Chunk decryption
- [ ] File reassembly
- [ ] Download UI

**Git Commits:**
```
Member 2 commits: _______
Member 3 commits: _______
```

**Test Results:**
- [ ] Files decrypt correctly: ✅/❌
- [ ] Large files work: ✅/❌

**Notes:**
```
Date completed: _______
Issues faced: _______
Next steps: _______
```

---

### Day 16: ⬜ MITM Attack Demo
- [ ] Vulnerable version created
- [ ] MITM attack executed
- [ ] Attack screenshots captured
- [ ] Protected version tested
- [ ] Defense documented

**Evidence Collected:**
- [ ] BurpSuite screenshots
- [ ] Wireshark captures
- [ ] Before/after comparison
- [ ] Logs

**Notes:**
```
Date completed: _______
Issues faced: _______
Attack successful on vulnerable version: ✅/❌
Attack failed on protected version: ✅/❌
```

---

### Day 17: ⬜ Replay Attack Demo
- [ ] Vulnerable version created
- [ ] Replay attack executed
- [ ] Attack screenshots captured
- [ ] Protected version tested
- [ ] Defense documented

**Evidence Collected:**
- [ ] Attack script
- [ ] Wireshark captures
- [ ] Logs showing detection
- [ ] Before/after comparison

**Notes:**
```
Date completed: _______
Issues faced: _______
Attack successful on vulnerable version: ✅/❌
Attack failed on protected version: ✅/❌
```

---

### Day 18: ⬜ Security Logging
- [ ] Comprehensive logging system
- [ ] Log query API
- [ ] Log viewer UI
- [ ] Log rotation

**Git Commits:**
```
Member 3 commits: _______
Member 2 commits: _______
```

**Notes:**
```
Date completed: _______
Issues faced: _______
Next steps: _______
```

---

### Day 19: ⬜ Threat Modeling
- [ ] STRIDE analysis completed
- [ ] Threat model table created
- [ ] Data flow diagrams
- [ ] Countermeasures documented

**Files Created:**
- [ ] `docs/security/THREAT_MODEL.md`

**Notes:**
```
Date completed: _______
Issues faced: _______
```

---

### Day 20: ⬜ Project Report
- [ ] All sections written
- [ ] All diagrams included
- [ ] All screenshots included
- [ ] Report reviewed
- [ ] PDF generated

**Report Sections:**
- [ ] Executive Summary
- [ ] Introduction
- [ ] Architecture
- [ ] Cryptographic Design
- [ ] Key Exchange Protocol
- [ ] Implementation
- [ ] Security Features
- [ ] Attack Demos
- [ ] Threat Modeling
- [ ] Logs
- [ ] Testing
- [ ] Conclusion

**Notes:**
```
Date completed: _______
Issues faced: _______
Final page count: _______
```

---

### Day 21: ⬜ Video Demo
- [ ] Script written
- [ ] Video recorded
- [ ] Video edited
- [ ] Video reviewed
- [ ] Video exported

**Video Details:**
```
Duration: _______
Format: MP4
Resolution: 1080p
File size: _______
```

**Notes:**
```
Date completed: _______
Issues faced: _______
```

---

### Day 22: ⬜ Final Testing & Submission
- [ ] All testing completed
- [ ] GitHub repository cleaned
- [ ] README updated
- [ ] All deliverables ready
- [ ] Submission completed

**Final Checklist:**
- [ ] Project report (PDF)
- [ ] Video demonstration (MP4)
- [ ] GitHub repository link
- [ ] Source code backup

**Notes:**
```
Date completed: _______
Submission date: _______
Issues faced: _______
```

---

## Git Contribution Summary

Update weekly:

### Week 1 (Days 1-7)
```
Member 1: _____ commits
Member 2: _____ commits
Member 3: _____ commits
```

### Week 2 (Days 8-14)
```
Member 1: _____ commits
Member 2: _____ commits
Member 3: _____ commits
```

### Week 3 (Days 15-22)
```
Member 1: _____ commits
Member 2: _____ commits
Member 3: _____ commits
```

### Total
```
Member 1: _____ commits (target: ~30-40)
Member 2: _____ commits (target: ~30-40)
Member 3: _____ commits (target: ~30-40)
```

---

## Issues & Blockers

Track problems here:

| Date | Issue | Who | Status | Resolution |
|------|-------|-----|--------|------------|
|      |       |     |        |            |

---

## Team Meetings Log

| Date | Duration | Attendees | Topics | Decisions |
|------|----------|-----------|--------|-----------|
|      |          |           |        |           |

---

## Weekly Retrospective

### Week 1
```
What went well:


What didn't go well:


Action items:

```

### Week 2
```
What went well:


What didn't go well:


Action items:

```

### Week 3
```
What went well:


What didn't go well:


Lessons learned:

```

---

**Remember:** Update this file daily! It will help with your report and demonstrate organized project management.

