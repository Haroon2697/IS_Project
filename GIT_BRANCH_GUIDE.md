# Git Branch Guide - Create and Push to New Branch

## 🎯 Quick Steps

### Step 1: Create and Switch to New Branch

```bash
# Create a new branch and switch to it
git checkout -b mitm-testing

# OR if you prefer a different name:
git checkout -b feature/mitm-attack
```

### Step 2: Add All Changes

```bash
# Add all modified and new files
git add .

# OR add specific files only:
git add MANUAL_MITM_TEST_GUIDE.md
git add test-mitm-attack.js
git add MITM_TEST_GUIDE.md
# ... etc
```

### Step 3: Commit Changes

```bash
# Commit with a descriptive message
git commit -m "Add MITM attack testing implementation and documentation"
```

### Step 4: Push to Remote

```bash
# Push the new branch to GitHub
git push -u origin mitm-testing

# OR if you used a different branch name:
git push -u origin feature/mitm-attack
```

---

## 📋 Detailed Step-by-Step Instructions

### Option A: Create Branch for MITM Testing Files

**1. Create and switch to new branch:**
```bash
git checkout -b mitm-testing
```

**2. Check you're on the new branch:**
```bash
git branch
```
You should see `* mitm-testing` (the asterisk shows current branch)

**3. Add all your new files:**
```bash
git add .
```

**4. Check what will be committed:**
```bash
git status
```

**5. Commit the changes:**
```bash
git commit -m "Add MITM attack testing: documentation, test scripts, and guides"
```

**6. Push to GitHub:**
```bash
git push -u origin mitm-testing
```

**7. Verify on GitHub:**
- Go to: https://github.com/Haroon2697/IS_Project
- You should see a banner saying "mitm-testing had recent pushes"
- Click on the branch dropdown to see your new branch

---

### Option B: Create Branch for Specific Feature

**1. Create branch with descriptive name:**
```bash
git checkout -b feature/mitm-attack-implementation
```

**2. Add only MITM-related files:**
```bash
git add MANUAL_MITM_TEST_GUIDE.md
git add MITM_TEST_GUIDE.md
git add MITM_TEST_QUICK_REFERENCE.md
git add MITM_TESTING_SUMMARY.md
git add QUICK_START_MITM_TEST.md
git add test-mitm-attack.js
git add scripts/switch-mitm-version.js
git add client/src/crypto/keyExchange.vulnerable.js
git add client/src/crypto/keyExchange.backup.js
git add docs/attacks/
```

**3. Commit:**
```bash
git commit -m "Add comprehensive MITM attack testing suite"
```

**4. Push:**
```bash
git push -u origin feature/mitm-attack-implementation
```

---

## 🔄 Common Branch Operations

### Switch Between Branches

```bash
# Switch to main branch
git checkout main

# Switch back to your branch
git checkout mitm-testing
```

### See All Branches

```bash
# Local branches
git branch

# All branches (local + remote)
git branch -a
```

### Update Branch from Main

```bash
# Switch to main
git checkout main

# Pull latest changes
git pull origin main

# Switch back to your branch
git checkout mitm-testing

# Merge main into your branch
git merge main
```

### Delete Branch (after merging)

```bash
# Delete local branch
git branch -d mitm-testing

# Delete remote branch
git push origin --delete mitm-testing
```

---

## 📝 Recommended Branch Names

- `mitm-testing` - For MITM testing work
- `feature/mitm-attack` - Feature branch for MITM attack
- `docs/mitm-guide` - Documentation branch
- `test/mitm-verification` - Testing branch
- `dev` - Development branch

---

## ⚠️ Important Notes

1. **Always commit before switching branches** (or use `git stash`)

2. **Use descriptive commit messages:**
   ```bash
   git commit -m "Add MITM attack testing documentation"
   ```

3. **Push regularly:**
   ```bash
   git push -u origin branch-name
   ```

4. **Keep main branch clean** - Only merge tested code

---

## 🚀 Quick Command Reference

```bash
# Create and switch to new branch
git checkout -b branch-name

# Add all changes
git add .

# Commit
git commit -m "Your commit message"

# Push to remote (first time)
git push -u origin branch-name

# Push to remote (subsequent times)
git push
```

---

## ✅ Checklist

- [ ] Created new branch
- [ ] Added files to staging
- [ ] Committed changes
- [ ] Pushed to GitHub
- [ ] Verified branch on GitHub
- [ ] Branch is visible in repository

---

**Ready to create your branch? Follow the steps above!** 🚀

