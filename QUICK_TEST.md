# 🚀 Quick Test Guide - Authentication

## ✅ Authentication is COMPLETE!

**What's Implemented:**
- ✅ User registration (username + email + password)
- ✅ Password hashing with argon2 (salted + hashed)
- ✅ User login with JWT tokens
- ✅ Protected routes
- ✅ Frontend UI (Login/Register pages)

---

## 📋 Quick Test Steps (5 minutes)

### 1. Setup Environment

```bash
# Navigate to server directory
cd /home/haroon/IS/IS_Project/server

# Create .env file
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/secure-messaging
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
EOF
```

### 2. Start MongoDB (if not running)

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# If not running, start it:
sudo systemctl start mongod
```

### 3. Start Backend Server

```bash
cd /home/haroon/IS/IS_Project/server
npm install  # If not done already
npm run dev  # or npm start
```

**Expected output:**
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

### 4. Start Frontend

```bash
# Open new terminal
cd /home/haroon/IS/IS_Project/client
npm install  # If not done already
npm start
```

**Frontend will open at:** http://localhost:3000

---

## 🧪 Test Authentication (3 Methods)

### Method 1: Frontend UI (Easiest) ⭐

1. Open http://localhost:3000
2. Click "Register here"
3. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm: `password123`
4. Click "Register"
5. ✅ Should redirect to Dashboard
6. Logout and try Login with same credentials
7. ✅ Should work!

### Method 2: cURL Commands

```bash
# Test Registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Test Login (save the token from response)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

# Test Protected Route (replace YOUR_TOKEN)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Method 3: Automated Script

```bash
cd /home/haroon/IS/IS_Project/server
./test-auth.sh
```

*(Requires `jq` for JSON formatting: `sudo apt install jq`)*

---

## ✅ Verification Checklist

After testing, verify:

- [ ] Registration creates user in database
- [ ] Password is hashed (not plaintext) in MongoDB
- [ ] Login returns JWT token
- [ ] Protected route works with valid token
- [ ] Protected route rejects invalid/missing token
- [ ] Frontend redirects to login when not authenticated
- [ ] Frontend shows dashboard after successful login

---

## 🔍 Verify Password Hashing

```bash
# Connect to MongoDB
mongosh

# Use database
use secure-messaging

# Check user (password should be hashed)
db.users.findOne({ username: "testuser" })
```

**Expected:** `passwordHash` field contains argon2 hash (starts with `$argon2id$`)

---

## 🐛 Common Issues

**Issue: "MongoDB not connected"**
- Solution: Start MongoDB: `sudo systemctl start mongod`

**Issue: "Port 5000 already in use"**
- Solution: Change PORT in `.env` or kill process: `lsof -ti:5000 | xargs kill -9`

**Issue: "CORS error"**
- Solution: Check `CORS_ORIGIN` in `.env` matches frontend URL (http://localhost:3000)

**Issue: "Cannot find module"**
- Solution: Run `npm install` in both `server/` and `client/` directories

---

## 📊 What to Test

1. ✅ **Valid Registration** - Should create user and return token
2. ✅ **Duplicate Username** - Should return error
3. ✅ **Short Password** - Should return error (min 8 chars)
4. ✅ **Valid Login** - Should return token
5. ✅ **Invalid Credentials** - Should return 401 error
6. ✅ **Protected Route** - Should work with token, fail without

---

## 🎯 Next Steps

Once authentication is tested and working:

1. **Key Generation** - Implement Web Crypto API
2. **Key Exchange** - Implement ECDH protocol
3. **Message Encryption** - Implement AES-256-GCM
4. **File Sharing** - Implement encrypted file upload

---

**Ready to test!** Start with Method 1 (Frontend UI) - it's the easiest! 🚀

