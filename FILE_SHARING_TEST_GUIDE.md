# 📁 File Sharing Testing Guide

**Complete step-by-step guide to test encrypted file sharing**

---

## ✅ Prerequisites

Before testing file sharing, ensure:

1. ✅ **Both users are registered and logged in**
   - Browser 1: User 1 (e.g., "kik")
   - Browser 2: User 2 (e.g., "kiki") - Incognito window

2. ✅ **Secure connection is established**
   - Both browsers show "Secure channel established!"
   - Chat window is visible in both browsers
   - Status shows "🔒 Secure" in chat header

3. ✅ **Servers are running**
   - Backend: `cd server && npm run dev` (port 5000)
   - Frontend: `cd client && npm start` (port 3000)

---

## 🧪 Step-by-Step Testing Instructions

### Step 1: Establish Secure Connection

**Browser 1 (User 1 - e.g., "kik"):**
1. Select User 2 from "Secure Connections" section
2. Click "Load Keys" → Enter password
3. Click "Establish Secure Connection"
4. Wait for "Secure channel established!" message
5. Chat window should appear automatically

**Browser 2 (User 2 - e.g., "kiki" - Incognito):**
1. Select User 1 from "Secure Connections" section
2. Click "Load Keys" → Enter password
3. Wait for automatic response (or click "Establish Secure Connection" if needed)
4. Wait for "Secure channel established!" message
5. Chat window should appear automatically

**✅ Verification:**
- Both browsers show chat window
- Both show "🔒 Secure" indicator
- You can send/receive text messages

---

### Step 2: Access File Sharing Section

**In Both Browsers:**

1. **Scroll down** in the chat window
2. Look for **"▶ Files"** button at the bottom (below message input)
3. **Click "▶ Files"** to expand the file sharing section
4. You should see:
   - **File Upload** section (at top)
   - **File List** section (below)

**✅ Verification:**
- "▶ Files" button changes to "▼ Files" when expanded
- File upload interface is visible
- File list section is visible (may be empty initially)

---

### Step 3: Upload a Test File

**Browser 1 (Sender):**

1. In the expanded "Files" section, find **"Share File"**
2. Click **"Choose File"** button
3. Select a test file:
   - **Recommended:** Start with a small file (< 1MB)
   - Good test files:
     - Text file (.txt)
     - Small image (.jpg, .png)
     - Small document (.pdf)
   - **Avoid:** Very large files (> 50MB) for initial testing
4. After selecting file, you should see:
   - File name displayed
   - File size displayed
   - Progress bar area
5. Click **"Upload File"** button
6. Watch the progress:
   - Progress bar should fill: 10% → 50% → 100%
   - Console logs should show:
     - "🔒 Starting file encryption..."
     - "📤 Uploading encrypted file..."
     - "✅ File uploaded successfully"

**✅ Verification:**
- Progress bar completes
- File disappears from upload form
- No error messages
- Console shows success messages

---

### Step 4: View Uploaded File (Receiver)

**Browser 2 (Receiver):**

1. In the expanded "Files" section, scroll to **"Shared Files"**
2. Click **"Refresh"** button (if file doesn't appear automatically)
3. You should see the uploaded file in the list:
   - 📎 File icon
   - File name
   - File size
   - Status: "Received"
   - Upload date
   - **"Download"** button

**✅ Verification:**
- File appears in the list
- File name matches the uploaded file
- File size matches
- Status shows "Received"

---

### Step 5: Download and Decrypt File

**Browser 2 (Receiver):**

1. Click **"Download"** button next to the file
2. Watch the console for:
   - "📥 Downloading file: [filename]"
   - "🔓 Decrypting file..."
   - "✅ File downloaded successfully"
3. File should download to your computer
4. **Open the downloaded file** and verify:
   - File opens correctly
   - Content matches the original file
   - File is not corrupted

**✅ Verification:**
- File downloads successfully
- File opens correctly
- Content is identical to original
- No decryption errors

---

### Step 6: Test File Sharing from Other Direction

**Browser 2 (Now Sender):**

1. Upload a different file
2. Follow same steps as Step 3

**Browser 1 (Now Receiver):**

1. Refresh file list
2. Download the file
3. Verify it opens correctly

**✅ Verification:**
- Files can be shared in both directions
- Both users can upload and download

---

## 🔍 What to Check During Testing

### Console Logs (F12 → Console Tab)

**During Upload:**
```
🔒 Starting file encryption...
Encrypting chunk 1/3...
Encrypting chunk 2/3...
Encrypting chunk 3/3...
📤 Uploading encrypted file...
✅ File uploaded successfully: [fileId]
```

**During Download:**
```
📥 Downloading file: [filename]
🔓 Decrypting file...
Decrypting chunk 1/3...
Decrypting chunk 2/3...
Decrypting chunk 3/3...
✅ File downloaded successfully
```

### Server Console

**During Upload:**
```
📁 File upload initiated: [fileId]
📦 Chunk uploaded: [chunkIndex]/[totalChunks]
✅ File upload completed: [fileId]
```

**During Download:**
```
📥 File download requested: [fileId]
✅ File download completed: [fileId]
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Establish secure connection first" Warning

**Problem:** File upload shows warning message

**Solution:**
- Ensure secure connection is established
- Check that chat window shows "🔒 Secure"
- Re-establish connection if needed

---

### Issue 2: "No session key established" Error

**Problem:** Error when trying to upload

**Solution:**
- Re-establish secure connection
- Make sure both users completed key exchange
- Check browser console for key exchange errors

---

### Issue 3: File Doesn't Appear in List

**Problem:** Uploaded file doesn't show in receiver's list

**Solution:**
- Click "Refresh" button in file list
- Check server console for errors
- Verify recipientId is correct
- Check browser console for API errors

---

### Issue 4: Download Fails or File is Corrupted

**Problem:** Downloaded file doesn't open or is corrupted

**Solution:**
- Check browser console for decryption errors
- Verify session key is still valid
- Try re-establishing secure connection
- Check that file wasn't corrupted during upload

---

### Issue 5: "File size exceeds limit" Error

**Problem:** Cannot upload large file

**Solution:**
- Current limit: 50MB
- Use smaller file for testing
- Or increase limit in `FileUpload.jsx` (line 19)

---

## 📊 Test Checklist

### Basic Functionality
- [ ] Secure connection established
- [ ] File sharing section visible
- [ ] Can select file
- [ ] Can upload file (< 1MB)
- [ ] Upload progress shows correctly
- [ ] File appears in receiver's list
- [ ] Can download file
- [ ] Downloaded file opens correctly
- [ ] File content matches original

### Encryption Verification
- [ ] Console shows encryption logs
- [ ] Console shows decryption logs
- [ ] Server only stores encrypted chunks (check server logs)
- [ ] No plaintext visible in network tab

### Large Files
- [ ] Can upload file (1-5MB)
- [ ] Can upload file (5-10MB)
- [ ] Progress bar works for large files
- [ ] Large file downloads correctly

### Multiple Files
- [ ] Can upload multiple files
- [ ] All files appear in list
- [ ] Can download each file
- [ ] Files are correctly identified

### Error Handling
- [ ] Error shown if no secure connection
- [ ] Error shown if file too large
- [ ] Error shown if upload fails
- [ ] Error shown if download fails

---

## 🎯 Expected Behavior Summary

### Upload Flow:
1. User selects file
2. File is encrypted client-side (chunked if large)
3. Encrypted chunks uploaded to server
4. Server stores encrypted chunks
5. Success message shown

### Download Flow:
1. User clicks download
2. Encrypted chunks downloaded from server
3. File decrypted client-side
4. File reassembled from chunks
5. File downloaded to computer

### Security:
- ✅ Files encrypted before upload
- ✅ Server never sees plaintext
- ✅ Files decrypted after download
- ✅ Only recipient can decrypt (with session key)

---

## 📝 Testing Notes

**Recommended Test Files:**
1. **Small text file** (.txt) - ~1KB - Quick test
2. **Small image** (.jpg) - ~100KB - Visual verification
3. **Small document** (.pdf) - ~500KB - Document test
4. **Medium file** - ~2MB - Chunking test
5. **Large file** - ~10MB - Large file test

**What to Document:**
- Screenshots of upload/download process
- Console logs showing encryption/decryption
- Server logs showing encrypted storage
- Network tab showing encrypted data transfer
- Verification that files open correctly after download

---

## 🚀 Quick Test (5 minutes)

1. **Establish connection** (2 min)
2. **Upload small text file** (1 min)
3. **Download and verify** (1 min)
4. **Check console logs** (1 min)

If all steps work, file sharing is functional! ✅

---

**Last Updated:** December 2024

