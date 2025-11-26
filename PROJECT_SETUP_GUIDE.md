# Project Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v16 or higher)
  - Download: https://nodejs.org/
  - Verify: `node --version`

- **npm** (comes with Node.js)
  - Verify: `npm --version`

- **MongoDB** (v5 or higher)
  - **Option A (Local):** https://www.mongodb.com/try/download/community
  - **Option B (Cloud):** https://www.mongodb.com/cloud/atlas (Free tier)
  - Verify (local): `mongod --version`

- **Git**
  - Download: https://git-scm.com/
  - Verify: `git --version`

- **Modern Browser**
  - Chrome (recommended) or Firefox
  - Required for Web Crypto API support

---

## Step 1: Clone Repository

```bash
# If repository already exists
git clone <your-repo-url>
cd secure-e2ee-messaging

# If starting fresh
mkdir secure-e2ee-messaging
cd secure-e2ee-messaging
git init
```

---

## Step 2: Project Structure Setup

Create the following directory structure:

```bash
# Windows PowerShell
New-Item -ItemType Directory -Path client, server, docs, tests, logs -Force

# Linux/Mac
mkdir -p client server docs tests logs
```

Your structure should look like:

```
secure-e2ee-messaging/
├── client/           # React frontend
├── server/           # Node.js backend
├── docs/             # Documentation
├── tests/            # Attack demonstration scripts
├── logs/             # Security logs
├── .gitignore
├── .env.example
├── README.md
└── EXECUTION_PLAN.md
```

---

## Step 3: Backend Setup

### 3.1 Initialize Node.js Project

```bash
cd server
npm init -y
```

### 3.2 Install Dependencies

```bash
npm install express mongoose bcryptjs argon2 jsonwebtoken dotenv cors socket.io
npm install --save-dev nodemon
```

**Package explanations:**
- `express`: Web framework
- `mongoose`: MongoDB object modeling
- `bcryptjs` / `argon2`: Password hashing
- `jsonwebtoken`: JWT authentication
- `dotenv`: Environment variables
- `cors`: Cross-origin resource sharing
- `socket.io`: Real-time communication
- `nodemon`: Auto-restart server (development)

### 3.3 Create Backend Structure

```bash
# Windows
New-Item -ItemType Directory -Path src\models, src\routes, src\controllers, src\middleware, src\utils, src\socket -Force

# Linux/Mac
mkdir -p src/{models,routes,controllers,middleware,utils,socket}
```

### 3.4 Configure Environment

```bash
# Copy example .env file
cp ../.env.example .env

# Edit .env file with your settings
# Windows: notepad .env
# Linux/Mac: nano .env
```

**Important:** Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the generated string into `.env` as `JWT_SECRET`.

### 3.5 Update package.json Scripts

Edit `server/package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"No tests yet\" && exit 0"
  }
}
```

### 3.6 Create Entry Point

Create `server/server.js`:

```javascript
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

### 3.7 Test Backend

```bash
# Start server
npm run dev

# In another terminal, test:
curl http://localhost:5000/api/health
# Should return: {"status":"OK","message":"Server is running"}
```

---

## Step 4: Frontend Setup

### 4.1 Create React App

```bash
cd ../client
npx create-react-app . --template=typescript
# Or without TypeScript:
# npx create-react-app .
```

**Note:** This will take a few minutes.

### 4.2 Install Dependencies

```bash
npm install axios react-router-dom socket.io-client
npm install --save-dev @types/node @types/react @types/react-dom
```

**Package explanations:**
- `axios`: HTTP client for API requests
- `react-router-dom`: Routing
- `socket.io-client`: WebSocket client

### 4.3 Create Frontend Structure

```bash
# Windows
cd src
New-Item -ItemType Directory -Path components\Auth, components\Chat, components\FileShare, crypto, storage, api, utils -Force

# Linux/Mac
cd src
mkdir -p components/{Auth,Chat,FileShare} crypto storage api utils
```

Your `client/src` structure:

```
src/
├── components/
│   ├── Auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── Chat/
│   │   ├── ChatWindow.jsx
│   │   └── MessageList.jsx
│   └── FileShare/
│       └── FileUpload.jsx
├── crypto/
│   ├── keyManagement.js
│   ├── encryption.js
│   └── keyExchange.js
├── storage/
│   └── indexedDB.js
├── api/
│   └── auth.js
├── utils/
│   └── helpers.js
├── App.js
└── index.js
```

### 4.4 Configure API Base URL

Create `client/src/config.js`:

```javascript
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
```

### 4.5 Test Frontend

```bash
# From client directory
npm start

# Browser should open automatically to http://localhost:3000
```

---

## Step 5: MongoDB Setup

### Option A: Local MongoDB

**Windows:**
```bash
# Start MongoDB service
net start MongoDB

# Or run manually:
"C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" --dbpath "C:\data\db"
```

**Linux:**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod  # Start on boot
```

**Mac:**
```bash
brew services start mongodb-community
```

**Verify:**
```bash
# Connect to MongoDB shell
mongosh
# Or older versions:
# mongo

# Should see MongoDB prompt
```

### Option B: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a cluster (free tier)
4. Create database user
5. Whitelist your IP (or allow from anywhere for development)
6. Get connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/secure_messaging
   ```
7. Update `server/.env` with this connection string

---

## Step 6: Verify Complete Setup

### 6.1 Backend Health Check

```bash
# Terminal 1
cd server
npm run dev

# Should see:
# ✅ MongoDB connected
# 🚀 Server running on http://localhost:5000
```

### 6.2 Frontend Running

```bash
# Terminal 2
cd client
npm start

# Should see:
# Compiled successfully!
# Browser opens to http://localhost:3000
```

### 6.3 Test Connection

In browser console (F12):

```javascript
fetch('http://localhost:5000/api/health')
  .then(res => res.json())
  .then(data => console.log(data));

// Should log: {status: "OK", message: "Server is running"}
```

---

## Step 7: Install Development Tools

### 7.1 BurpSuite (Attack Demonstrations)

1. Download: https://portswigger.net/burp/communitydownload
2. Install and run
3. Configure browser proxy:
   - Proxy: 127.0.0.1
   - Port: 8080
4. Install Burp CA certificate in browser

### 7.2 Wireshark (Packet Analysis)

1. Download: https://www.wireshark.org/download.html
2. Install (use default options)
3. Run as administrator/sudo
4. Select "Loopback" interface for local testing

### 7.3 Postman / Thunder Client (API Testing)

**Option A: Postman**
- Download: https://www.postman.com/downloads/

**Option B: Thunder Client (VS Code Extension)**
- Install from VS Code extensions marketplace
- Lighter weight alternative

---

## Step 8: Initial Git Setup

### 8.1 Create .gitignore

```bash
# Copy from root directory (already created)
# Verify it excludes:
cat .gitignore
```

Should include:
- `node_modules/`
- `.env`
- `build/`
- `logs/`

### 8.2 Initial Commit

```bash
git add .
git commit -m "Initial project setup"
```

### 8.3 Create Branches

```bash
git branch frontend-dev
git branch backend-dev
git branch crypto-design
git branch attack-tests
```

### 8.4 Push to Remote

```bash
# Add remote repository
git remote add origin <your-repo-url>

# Push main branch
git push -u origin main

# Push other branches
git push -u origin frontend-dev
git push -u origin backend-dev
git push -u origin crypto-design
git push -u origin attack-tests
```

---

## Step 9: Team Setup

### 9.1 Repository Access

1. Add team members to GitHub repository
2. Set permissions (all members need write access)
3. Share repository URL

### 9.2 Each Team Member Should:

```bash
# Clone repository
git clone <repo-url>
cd secure-e2ee-messaging

# Install dependencies
cd server && npm install
cd ../client && npm install

# Copy .env and configure
cd ../server
cp .env.example .env
# Edit .env with own settings

# Verify setup works
npm run dev  # In server directory
npm start    # In client directory
```

---

## Step 10: Verification Checklist

Before starting development, verify:

### Backend
- [ ] Server starts without errors
- [ ] MongoDB connects successfully
- [ ] `/api/health` endpoint responds
- [ ] Environment variables loaded

### Frontend
- [ ] React app starts without errors
- [ ] Can access `http://localhost:3000`
- [ ] Console shows no errors

### Database
- [ ] MongoDB is running
- [ ] Can connect to database
- [ ] Database visible in MongoDB Compass (optional GUI)

### Tools
- [ ] Git initialized
- [ ] All branches created
- [ ] BurpSuite installed
- [ ] Wireshark installed

### Team
- [ ] All members have repository access
- [ ] All members can run project locally
- [ ] Communication channel set up (Discord/Slack/WhatsApp)

---

## Common Setup Issues

### Issue: MongoDB connection fails
```bash
# Check MongoDB is running
# Windows:
net start MongoDB

# Linux:
sudo systemctl status mongod

# Mac:
brew services list
```

### Issue: Port 3000 or 5000 already in use
```bash
# Windows - Kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Issue: npm install fails
```bash
# Clear cache
npm cache clean --force

# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

Once setup is complete:

1. ✅ Review [EXECUTION_PLAN.md](./EXECUTION_PLAN.md)
2. ✅ Start with Day 1 tasks
3. ✅ Hold team meeting to assign roles
4. ✅ Begin Phase 1: Team Setup & Planning

---

## Getting Help

If you encounter issues:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Search error messages online
3. Ask team members
4. Contact instructor/TA

---

**Setup Complete! Ready to start development 🚀**

