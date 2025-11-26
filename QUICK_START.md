# Quick Start Guide

Get your project up and running in **30 minutes**.

---

## Prerequisites Check

Before starting, verify you have:

```bash
# Node.js (v16+)
node --version

# npm
npm --version

# Git
git --version

# MongoDB (if using local)
mongod --version
# OR MongoDB Atlas account (cloud)
```

If any command fails, install the missing software first (see [PROJECT_SETUP_GUIDE.md](./PROJECT_SETUP_GUIDE.md)).

---

## 10-Minute Setup

### 1. Clone & Navigate (1 min)

```bash
git clone <your-repo-url>
cd secure-e2ee-messaging
```

### 2. Backend Setup (4 min)

```bash
# Navigate to server
cd server

# Install dependencies (takes 2-3 min)
npm install

# Create environment file
# Windows:
copy .env.example .env

# Linux/Mac:
cp .env.example .env

# Edit .env file (set MongoDB URI and JWT secret)
# Minimum required:
# MONGODB_URI=mongodb://localhost:27017/secure_messaging
# JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

### 3. Frontend Setup (4 min)

```bash
# Navigate to client
cd ../client

# Install dependencies (takes 2-3 min)
npm install
```

### 4. Start MongoDB (1 min)

**Local MongoDB:**
```bash
# Windows
net start MongoDB

# Linux
sudo systemctl start mongod

# Mac
brew services start mongodb-community
```

**MongoDB Atlas (Cloud):**
- Already running, just verify connection string in `.env`

---

## Run the Application

### Terminal 1: Backend

```bash
cd server
npm run dev
```

**Expected output:**
```
✅ MongoDB connected
🚀 Server running on http://localhost:5000
```

### Terminal 2: Frontend

```bash
cd client
npm start
```

**Expected output:**
```
Compiled successfully!
Local:            http://localhost:3000
```

Browser should open automatically.

---

## Verify Everything Works

### 1. Backend Health Check

Open browser and go to:
```
http://localhost:5000/api/health
```

Should see:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### 2. Frontend Loads

Browser should show your React app at `http://localhost:3000`.

### 3. Console Check

Press F12 (browser console) - should see no errors.

---

## Next Steps

Now that everything is running:

1. **Review the Execution Plan**
   ```bash
   # Read this file carefully
   cat EXECUTION_PLAN.md
   ```

2. **Check Task Tracker**
   ```bash
   cat TASK_TRACKER.md
   ```

3. **Start Day 1 Tasks**
   - Hold team meeting
   - Assign roles
   - Start Phase 1 work

---

## Common Issues

### Issue: "MongoDB connection failed"
```bash
# Check if MongoDB is running
# Windows:
net start MongoDB

# Linux:
sudo systemctl status mongod
```

### Issue: "Port 5000 already in use"
```bash
# Kill process on port
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5000 | xargs kill -9
```

### Issue: "npm install" fails
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## Development Workflow

### Daily Workflow

**Morning:**
```bash
# Pull latest changes
git pull origin main

# Start MongoDB (if local)
# Start backend (Terminal 1)
cd server && npm run dev

# Start frontend (Terminal 2)
cd client && npm start
```

**During Work:**
- Work on your assigned tasks
- Commit frequently:
  ```bash
  git add .
  git commit -m "Descriptive message"
  ```

**End of Day:**
```bash
# Push your changes
git push origin <your-branch>

# Update task tracker
# Mark completed tasks in TASK_TRACKER.md
```

### Branch Strategy

```bash
# Frontend work
git checkout frontend-dev

# Backend work
git checkout backend-dev

# Cryptography work
git checkout crypto-design

# Attack testing
git checkout attack-tests
```

---

## Key Files to Know

```
IS_Project/
├── README.md                    # Project overview
├── EXECUTION_PLAN.md            # Day-by-day guide ⭐
├── TASK_TRACKER.md              # Track progress ⭐
├── PROJECT_SETUP_GUIDE.md       # Detailed setup
├── TROUBLESHOOTING.md           # Solutions to common issues
│
├── server/
│   ├── .env                     # Configuration (DON'T COMMIT)
│   ├── server.js                # Entry point
│   └── src/                     # Source code
│
├── client/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── crypto/              # Cryptography logic
│   │   └── storage/             # IndexedDB
│   └── public/
│
└── docs/
    ├── architecture/            # System design docs
    ├── protocols/               # Key exchange protocol
    ├── security/                # Threat model, attack demos
    └── report/                  # Final report outline
```

---

## Team Communication

### Daily Standup (15 minutes)

**Each member answers:**
1. What did I do yesterday?
2. What will I do today?
3. Any blockers?

### Weekly Check-in

Review:
- Progress against TASK_TRACKER.md
- Upcoming tasks
- Any issues

---

## Important Commands

### Backend
```bash
npm run dev        # Development (auto-restart)
npm start          # Production
npm test           # Run tests (when added)
```

### Frontend
```bash
npm start          # Development server
npm run build      # Production build
npm test           # Run tests (when added)
```

### Git
```bash
git status                           # Check status
git add .                            # Stage all changes
git commit -m "message"              # Commit
git push origin <branch>             # Push to remote
git pull origin main                 # Pull latest
git checkout -b <new-branch>         # Create new branch
```

### MongoDB
```bash
mongosh                              # Connect to MongoDB
use secure_messaging                 # Switch to database
db.users.find()                      # Query users
db.messages.find().limit(5)          # Query messages
```

---

## Development Tools

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- MongoDB for VS Code
- Thunder Client (API testing)
- GitLens

### Browser Extensions

- React Developer Tools
- Redux DevTools (if you add Redux)

---

## Testing Your Work

### Manual Testing Checklist

- [ ] Registration works
- [ ] Login works
- [ ] Keys generated on registration
- [ ] Private key stored in IndexedDB
- [ ] Public key sent to server
- [ ] Messages encrypt/decrypt
- [ ] File upload works
- [ ] No errors in console

### Database Verification

```bash
mongosh
use secure_messaging

# Check users (should see public keys, NO private keys)
db.users.findOne()

# Check messages (should see ciphertext, NOT plaintext)
db.messages.findOne()
```

---

## Getting Help

1. **Check documentation:**
   - TROUBLESHOOTING.md
   - PROJECT_SETUP_GUIDE.md

2. **Ask your team:**
   - Team chat
   - Screen share for complex issues

3. **Search online:**
   - Stack Overflow
   - GitHub issues for libraries

4. **Contact instructor/TA**
   - For conceptual questions only
   - Not for complete code solutions

---

## Milestone Checklist

### Week 1 ✅
- [ ] Project setup complete
- [ ] Backend authentication working
- [ ] Frontend UI created
- [ ] Key generation implemented
- [ ] Keys stored securely

### Week 2 ✅
- [ ] Key exchange protocol designed
- [ ] Key exchange implemented
- [ ] Message encryption working
- [ ] File encryption working
- [ ] Real-time messaging (WebSocket)

### Week 3 ✅
- [ ] MITM attack demonstrated
- [ ] Replay attack demonstrated
- [ ] Threat model complete
- [ ] Logging system implemented
- [ ] Report written
- [ ] Video recorded

---

**You're all set! Start with the EXECUTION_PLAN.md and follow it day by day. Good luck! 🚀**

