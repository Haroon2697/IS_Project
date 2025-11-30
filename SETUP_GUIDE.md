# 🚀 SETUP GUIDE

**Complete setup instructions for the project**

---

## 📋 PREREQUISITES

- Node.js 16+ installed
- npm or yarn package manager
- Modern browser (Chrome, Firefox, Edge recommended)
- Git (for version control)

---

## 🔧 INSTALLATION

### Step 1: Clone Repository

```bash
git clone <your-repo-url>
cd IS_Project
```

### Step 2: Backend Setup

```bash
cd server
npm install
```

**Create `.env` file:**
```bash
cp .env.example .env
# Edit .env with your values
```

**Required Environment Variables:**
```env
PORT=5000
JWT_SECRET=your-secret-key-change-this
MONGODB_URI=mongodb://localhost:27017/secure-messaging  # Optional
GOOGLE_CLIENT_ID=your-google-client-id  # Optional
GOOGLE_CLIENT_SECRET=your-google-client-secret  # Optional
CORS_ORIGIN=http://localhost:3000
```

### Step 3: Frontend Setup

```bash
cd client
npm install
```

**Optional:** Create `.env` file for frontend:
```env
REACT_APP_API_URL=http://localhost:5000
```

---

## 🚀 RUNNING THE APPLICATION

### Development Mode

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

You should see:
```
🚀 Server running on port 5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

Browser should automatically open: `http://localhost:3000`

---

## ✅ VERIFICATION

### Check Backend
```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "..."
}
```

### Check Frontend
- Open `http://localhost:3000`
- Should see login/register page
- No console errors

---

## 🔐 OPTIONAL SETUP

### MongoDB (Optional)

**Without MongoDB:**
- Server uses in-memory storage
- Works fine for testing
- Data lost on server restart

**With MongoDB:**
1. Install MongoDB or use MongoDB Atlas
2. Set `MONGODB_URI` in `.env`
3. Server will use MongoDB for persistence

**See:** `server/GET_MONGODB_CONNECTION.txt` for MongoDB Atlas setup

### Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add to `.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
4. Set callback URL: `http://localhost:5000/api/oauth/google/callback`

**See:** `server/SETUP_OAUTH.txt` for detailed instructions

---

## 🧪 TESTING SETUP

### Register First User

1. Go to `http://localhost:3000/register`
2. Fill in:
   - Username: `testuser1`
   - Email: `test1@example.com`
   - Password: `password123`
3. Click "Register"
4. Check browser console for key generation messages

### Verify Keys

1. Open DevTools (F12)
2. Go to: **Application → IndexedDB → SecureMessagingDB**
3. Check `privateKeys` store
4. Should see encrypted private key

### Test Encryption

Open browser console and run:
```javascript
// See QUICK_REFERENCE.md for test code
```

---

## 🐛 TROUBLESHOOTING

### Port Already in Use

**Backend (5000):**
```bash
# Find process
lsof -i :5000
# Kill process
kill -9 <PID>
```

**Frontend (3000):**
```bash
# Find process
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Module Not Found

```bash
# Reinstall dependencies
cd server && rm -rf node_modules && npm install
cd client && rm -rf node_modules && npm install
```

### MongoDB Connection Issues

- Server will use in-memory storage as fallback
- This is fine for testing
- Check `MONGODB_URI` in `.env` if using MongoDB

### Browser Console Errors

- Make sure you're on `http://localhost:3000` (not `file://`)
- Check Web Crypto API is available
- Clear browser cache and reload

---

## 📦 PRODUCTION BUILD

### Build Frontend

```bash
cd client
npm run build
```

Output in `client/build/`

### Run Production Server

```bash
cd server
NODE_ENV=production npm start
```

---

## 🔒 SECURITY NOTES

- Change `JWT_SECRET` in production
- Use HTTPS in production
- Set secure cookies in production
- Don't commit `.env` file to Git

---

## 📚 NEXT STEPS

After setup:
1. Test registration and login
2. Test key generation
3. Test encryption
4. See [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) for testing guide

---

**For more information:**
- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) - Complete guide
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Quick lookup
- [STATUS_REPORT.md](./STATUS_REPORT.md) - Current status

