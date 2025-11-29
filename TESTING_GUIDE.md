# 🧪 Testing Guide - User Authentication

## ✅ Authentication Implementation Status

**COMPLETED:**
- ✅ User registration with username + email + password
- ✅ Password hashing with argon2 (salted + hashed)
- ✅ User login with JWT token generation
- ✅ Protected routes with JWT verification
- ✅ Rate limiting (5 requests per 15 minutes)
- ✅ Security logging (authentication events)
- ✅ Frontend Login/Register components
- ✅ Password validation (minimum 8 characters)

**NOT IMPLEMENTED (Optional):**
- ⬜ OAuth (Google, GitHub, etc.) - Optional bonus feature
- ⬜ Two-factor authentication (2FA) - Optional bonus feature

---

## 🚀 Quick Start Testing

### Step 1: Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### Step 2: Setup MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB (if not installed)
# Ubuntu/Debian:
sudo apt-get install mongodb

# macOS:
brew install mongodb-community

# Start MongoDB
sudo systemctl start mongod  # Linux
# OR
brew services start mongodb-community  # macOS
```

**Option B: MongoDB Atlas (Cloud - Free)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster
4. Get connection string
5. Add to `.env` file

### Step 3: Configure Environment Variables

```bash
cd server
cp .env.example .env
```

Edit `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/secure-messaging
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
```

### Step 4: Start the Server

```bash
cd server
npm run dev
# OR
npm start
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

### Step 5: Start the Frontend

```bash
cd client
npm start
```

Frontend will open at: http://localhost:3000

---

## 🧪 Testing Methods

### Method 1: Frontend UI Testing (Easiest)

1. **Open Browser**: http://localhost:3000
2. **Test Registration**:
   - Click "Register here"
   - Fill in:
     - Username: `testuser`
     - Email: `test@example.com`
     - Password: `password123` (min 8 chars)
     - Confirm Password: `password123`
   - Click "Register"
   - Should redirect to Dashboard

3. **Test Login**:
   - Logout from Dashboard
   - Fill in:
     - Username: `testuser`
     - Password: `password123`
   - Click "Login"
   - Should redirect to Dashboard

4. **Test Protected Route**:
   - Try accessing http://localhost:3000/dashboard without login
   - Should redirect to login page

### Method 2: API Testing with cURL

**Test Health Check:**
```bash
curl http://localhost:5000/api/health
```

**Test Registration:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

Expected Response:
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Test Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

**Test Protected Route (Get Current User):**
```bash
# Replace YOUR_TOKEN with token from login response
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Test Invalid Credentials:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "wrongpassword"
  }'
```

Expected: `401 Unauthorized` with error message

### Method 3: API Testing with Postman/Thunder Client

1. **Create Collection**: "Secure Messaging API"
2. **Add Requests**:

   **Register:**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/register`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "username": "testuser",
       "email": "test@example.com",
       "password": "password123"
     }
     ```

   **Login:**
   - Method: POST
   - URL: `http://localhost:5000/api/auth/login`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "username": "testuser",
       "password": "password123"
     }
     ```

   **Get Current User:**
   - Method: GET
   - URL: `http://localhost:5000/api/auth/me`
   - Headers: 
     - `Authorization: Bearer YOUR_TOKEN`
     - `Content-Type: application/json`

---

## ✅ Test Cases Checklist

### Registration Tests

- [ ] **Valid Registration**
  - Username: 3-30 characters
  - Valid email format
  - Password: 8+ characters
  - Should return token and user data

- [ ] **Duplicate Username**
  - Try registering with existing username
  - Should return 400 error: "Username or email already exists"

- [ ] **Duplicate Email**
  - Try registering with existing email
  - Should return 400 error: "Username or email already exists"

- [ ] **Short Password**
  - Password < 8 characters
  - Should return 400 error: "Password must be at least 8 characters long"

- [ ] **Missing Fields**
  - Missing username, email, or password
  - Should return 400 error: "Username, email, and password are required"

- [ ] **Invalid Email Format**
  - Email without @ or invalid format
  - Should return 400 error (MongoDB validation)

### Login Tests

- [ ] **Valid Login**
  - Correct username and password
  - Should return token and user data
  - Should update lastLogin timestamp

- [ ] **Invalid Username**
  - Username doesn't exist
  - Should return 401 error: "Invalid credentials"

- [ ] **Invalid Password**
  - Wrong password for existing user
  - Should return 401 error: "Invalid credentials"

- [ ] **Login with Email**
  - Use email instead of username
  - Should work (username OR email accepted)

- [ ] **Missing Credentials**
  - Missing username or password
  - Should return 400 error: "Username and password are required"

### Protected Route Tests

- [ ] **Valid Token**
  - Use token from login
  - Should return user data

- [ ] **No Token**
  - Request without Authorization header
  - Should return 401 error: "No token provided"

- [ ] **Invalid Token**
  - Random string as token
  - Should return 401 error: "Invalid token"

- [ ] **Expired Token**
  - Use expired token (wait for expiration)
  - Should return 401 error: "Token expired"

### Security Tests

- [ ] **Rate Limiting**
  - Make 6+ requests in 15 minutes
  - 6th request should return 429: "Too many requests"

- [ ] **Password Hashing**
  - Check MongoDB database
  - Password should be hashed (not plaintext)
  - Should use argon2 format

- [ ] **Token Storage**
  - Check browser localStorage
  - Token should be stored after login
  - Token should be removed after logout

---

## 🔍 Verification Steps

### 1. Verify Password Hashing

**Check MongoDB:**
```bash
# Connect to MongoDB
mongosh

# Use database
use secure-messaging

# Check user document
db.users.findOne({ username: "testuser" })
```

**Expected:**
- `passwordHash` field exists
- Password is NOT plaintext
- Hash starts with `$argon2id$` (argon2 format)

### 2. Verify JWT Token

**Decode Token (use jwt.io):**
1. Go to https://jwt.io
2. Paste token from login response
3. Verify:
   - Contains `userId`
   - Has expiration time
   - Signature is valid

### 3. Verify Security Logging

**Check MongoDB Logs:**
```bash
mongosh
use secure-messaging
db.logs.find({ eventType: "AUTH_SUCCESS" }).sort({ timestamp: -1 }).limit(5)
```

**Expected:**
- Logs for successful logins
- Logs for failed login attempts
- Contains IP address, timestamp, user ID

### 4. Verify Frontend Protection

1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Remove `token` key
4. Try accessing `/dashboard`
5. Should redirect to `/login`

---

## 🐛 Troubleshooting

### Issue: "MongoDB not connected"

**Solution:**
1. Check if MongoDB is running:
   ```bash
   sudo systemctl status mongod  # Linux
   ```
2. Check MongoDB URI in `.env` file
3. Test connection:
   ```bash
   mongosh mongodb://localhost:27017
   ```

### Issue: "CORS error"

**Solution:**
1. Check `CORS_ORIGIN` in `.env` matches frontend URL
2. Default: `http://localhost:3000`
3. Restart server after changing `.env`

### Issue: "Cannot find module"

**Solution:**
```bash
cd server
npm install
```

### Issue: "Port already in use"

**Solution:**
1. Change PORT in `.env` file
2. Or kill process using port 5000:
   ```bash
   lsof -ti:5000 | xargs kill -9
   ```

### Issue: "Invalid credentials" but password is correct

**Solution:**
1. Check if user exists in database
2. Verify password hashing is working
3. Check server logs for errors

---

## 📊 Expected Test Results

### Successful Test Run Should Show:

1. **Registration:**
   - ✅ User created in database
   - ✅ Password hashed with argon2
   - ✅ JWT token returned
   - ✅ Log entry created

2. **Login:**
   - ✅ Token returned
   - ✅ lastLogin updated
   - ✅ Log entry created

3. **Protected Route:**
   - ✅ User data returned with valid token
   - ✅ 401 error with invalid/missing token

4. **Security:**
   - ✅ Rate limiting works
   - ✅ Passwords never stored in plaintext
   - ✅ Tokens expire correctly

---

## 🎯 Next Steps After Testing

Once authentication is verified working:

1. ✅ **Key Generation** - Implement Web Crypto API for key pairs
2. ✅ **Key Exchange Protocol** - Implement ECDH + signatures
3. ✅ **Message Encryption** - Implement AES-256-GCM
4. ✅ **File Sharing** - Implement encrypted file upload/download

---

## 📝 Test Report Template

```
Date: ___________
Tester: ___________

Registration Tests:
- [ ] Valid registration: PASS/FAIL
- [ ] Duplicate username: PASS/FAIL
- [ ] Short password: PASS/FAIL

Login Tests:
- [ ] Valid login: PASS/FAIL
- [ ] Invalid credentials: PASS/FAIL

Security Tests:
- [ ] Password hashing: PASS/FAIL
- [ ] Rate limiting: PASS/FAIL
- [ ] Token validation: PASS/FAIL

Issues Found:
1. ___________
2. ___________

Overall Status: ✅ PASS / ❌ FAIL
```

---

**Ready to test!** Start with Method 1 (Frontend UI) for the easiest testing experience.

