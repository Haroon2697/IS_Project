# Contributing Guidelines

Guidelines for team collaboration on this project.

---

## Git Workflow

### Branch Strategy

We use **feature branches** for development:

```
main                    ← Production-ready code
├── frontend-dev        ← Frontend features
├── backend-dev         ← Backend features
├── crypto-design       ← Cryptography implementation
└── attack-tests        ← Attack demonstrations
```

### Workflow Steps

1. **Start new feature:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Work on feature:**
   ```bash
   # Make changes
   git add .
   git commit -m "Descriptive commit message"
   ```

3. **Push to remote:**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request:**
   - Go to GitHub
   - Create PR from your branch to `main`
   - Request review from team member
   - Address review comments

5. **After PR merged:**
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/your-feature-name
   ```

---

## Commit Message Guidelines

### Format

```
<type>: <subject>

<body> (optional)
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Maintenance tasks

### Examples

**Good commits:**
```
feat: implement AES-GCM encryption for messages

fix: resolve IndexedDB key retrieval error

docs: add key exchange protocol diagrams

refactor: extract signature verification into separate function

test: add unit tests for replay protection
```

**Bad commits:**
```
"Updated files"                    ❌ Too vague
"Fixed bug"                        ❌ What bug?
"asdfghjkl"                        ❌ Meaningless
"Trying to make it work"           ❌ Not descriptive
"Final version"                    ❌ No details
```

---

## Code Style Guidelines

### JavaScript/Node.js

#### Naming Conventions

```javascript
// Variables and functions: camelCase
const sessionKey = ...;
function encryptMessage() { }

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 52428800;

// Classes: PascalCase
class ReplayProtection { }

// Private variables: prefix with _
const _privateKey = ...;
```

#### Code Structure

```javascript
// 1. Imports at top
const crypto = require('crypto');

// 2. Constants
const NONCE_SIZE = 32;

// 3. Functions
async function generateKey() {
  // Implementation
}

// 4. Exports at bottom
module.exports = { generateKey };
```

#### Comments

```javascript
/**
 * Encrypts a message using AES-256-GCM
 * @param {CryptoKey} sessionKey - The session key for encryption
 * @param {string} plaintext - The message to encrypt
 * @param {Uint8Array} iv - The initialization vector
 * @returns {Promise<Object>} Object containing ciphertext and auth tag
 */
async function encryptMessage(sessionKey, plaintext, iv) {
  // Generate random IV if not provided
  if (!iv) {
    iv = crypto.getRandomValues(new Uint8Array(12));
  }
  
  // Encrypt using AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    sessionKey,
    new TextEncoder().encode(plaintext)
  );
  
  return { ciphertext, iv };
}
```

### React/JSX

#### Component Structure

```javascript
import React, { useState, useEffect } from 'react';

/**
 * ChatWindow component for displaying messages
 * @param {Object} props - Component props
 * @param {string} props.userId - Current user ID
 * @param {string} props.partnerId - Chat partner ID
 */
function ChatWindow({ userId, partnerId }) {
  // State declarations
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Effects
  useEffect(() => {
    loadMessages();
  }, [partnerId]);
  
  // Event handlers
  const handleSendMessage = async (text) => {
    // Implementation
  };
  
  // Render
  return (
    <div className="chat-window">
      {/* JSX */}
    </div>
  );
}

export default ChatWindow;
```

#### JSX Style

```javascript
// Good
<div className="container">
  <button onClick={handleClick}>
    Send Message
  </button>
</div>

// Bad
<div className="container"><button onClick={handleClick}>Send Message</button></div>
```

---

## Code Review Guidelines

### For Code Author

Before requesting review:

- [ ] Code runs without errors
- [ ] All new functions have comments
- [ ] No console.log statements left
- [ ] No hardcoded secrets
- [ ] Tests pass (if applicable)
- [ ] Self-review completed

### For Reviewer

Check for:

- [ ] **Functionality**: Does it work correctly?
- [ ] **Security**: Any security issues?
- [ ] **Code Quality**: Readable and maintainable?
- [ ] **Performance**: Any obvious bottlenecks?
- [ ] **Tests**: Are tests adequate?
- [ ] **Documentation**: Comments and docs updated?

### Review Comments

**Good review comments:**
```
"Consider using a constant for this magic number."

"This function could be split into smaller functions for better readability."

"Should we add error handling here in case the API call fails?"

"Great implementation of the replay protection! 👍"
```

**Bad review comments:**
```
"This is wrong."                    ❌ Not helpful
"Why did you do it this way?"       ❌ Confrontational
"Change everything."                ❌ Too vague
```

---

## Testing Guidelines

### Before Committing

Test your code:

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# Manual testing
# - Run both server and client
# - Test the feature you added
# - Check for console errors
```

### Writing Tests

```javascript
// Example test structure
describe('Encryption Module', () => {
  test('should generate random IV', () => {
    const iv1 = generateIV();
    const iv2 = generateIV();
    
    expect(iv1.length).toBe(12);
    expect(iv2.length).toBe(12);
    expect(iv1).not.toEqual(iv2); // Should be different
  });
  
  test('should encrypt and decrypt correctly', async () => {
    const key = await generateKey();
    const plaintext = 'Hello World';
    
    const encrypted = await encrypt(key, plaintext);
    const decrypted = await decrypt(key, encrypted);
    
    expect(decrypted).toBe(plaintext);
  });
});
```

---

## Documentation Guidelines

### Code Documentation

Document:

- All public functions
- Complex algorithms
- Non-obvious logic
- Security-critical code

Don't document:

- Obvious code (`i++` doesn't need a comment)
- Getters/setters
- Simple utility functions

### README Updates

Update README.md when you:

- Add new features
- Change setup process
- Add new dependencies
- Change project structure

---

## Security Guidelines

### Never Commit

- Private keys
- Passwords
- API keys
- `.env` files
- Session tokens
- Certificates

### Always

- Use `.gitignore`
- Encrypt sensitive data before storage
- Validate all inputs
- Use parameterized queries
- Handle errors properly

### Code Review Focus

For security-critical code (crypto, auth, etc.):

- Require 2 team members to review
- Test thoroughly
- Document security properties

---

## Communication

### Daily Updates

Post daily in team chat:

```
[Your Name] - [Date]
Today:
- Implemented key exchange Phase 1
- Fixed bug in signature verification
  
Tomorrow:
- Complete Phase 2
- Write tests for key exchange

Blockers:
- Need help understanding HKDF parameters
```

### Asking for Help

**Good question:**
```
"I'm implementing ECDH key derivation and getting an error:
'Cannot derive key from non-derivable key'. Here's my code:
[paste code snippet]
I've tried making the key extractable but that didn't work.
Any ideas?"
```

**Bad question:**
```
"My code doesn't work. Help!"        ❌ No context
"ECDH error"                         ❌ Too vague
```

---

## Conflict Resolution

### Code Conflicts

When you have merge conflicts:

1. **Don't panic**
2. **Communicate** with team member whose code conflicts
3. **Understand both changes**
4. **Merge carefully**
5. **Test after merging**

```bash
# Steps to resolve conflicts
git pull origin main
# Git will show conflicts

# Edit conflicted files (look for <<<<<<< ======= >>>>>>>)
# Choose correct version or combine both

git add .
git commit -m "Resolved merge conflicts in [file]"
git push origin main
```

### Team Conflicts

If there's disagreement:

1. Discuss calmly
2. Present your reasoning
3. Listen to others
4. Compromise or vote
5. Document decision

---

## Work Distribution

### Equal Contribution

Each team member should:

- Make ~30-40 commits
- Work on significant features
- Review others' code
- Contribute to documentation

### Task Assignment

Use TASK_TRACKER.md:

```markdown
### Day 5: Frontend Authentication

#### Member 2 Tasks (Full Day)
- [x] Build Register component
- [x] Build Login component
- [ ] Implement protected routes
```

---

## Quality Standards

### Before Merging to Main

- [ ] Code reviewed by at least 1 other member
- [ ] All tests pass
- [ ] No console errors
- [ ] Documentation updated
- [ ] TASK_TRACKER.md updated

### Before Final Submission

- [ ] All features implemented
- [ ] All attacks demonstrated
- [ ] Full report written
- [ ] Video recorded
- [ ] Code cleaned (no debug code)
- [ ] README complete
- [ ] All team members reviewed

---

## Don'ts

❌ **Don't commit to `main` directly** (use feature branches)

❌ **Don't push broken code** (test before pushing)

❌ **Don't commit large files** (use .gitignore)

❌ **Don't force push** (unless you know what you're doing)

❌ **Don't leave TODO comments** in production code

❌ **Don't copy code** without understanding it

❌ **Don't skip code review**

---

## Do's

✅ **Do commit frequently** (small, focused commits)

✅ **Do pull before starting work** (stay up to date)

✅ **Do write meaningful commit messages**

✅ **Do test your code** before committing

✅ **Do help team members** when they're stuck

✅ **Do document your code**

✅ **Do communicate** progress and blockers

---

## Emergency Procedures

### Accidental Commit to Main

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Move changes to new branch
git checkout -b feature/fix
git add .
git commit -m "Properly committed fix"
git push origin feature/fix
```

### Committed Sensitive Data (.env file)

**⚠️ CRITICAL:**

```bash
# 1. Remove from repository
git rm --cached .env
git commit -m "Remove .env from tracking"
git push origin main

# 2. Change all secrets immediately
# - New JWT secret
# - New database password
# - Invalidate all tokens

# 3. Update .gitignore to prevent future commits
echo ".env" >> .gitignore
```

### Lost Work

```bash
# Find lost commits
git reflog

# Recover
git checkout <commit-hash>
git checkout -b recovery-branch
```

---

## Final Reminders

1. **Communication is key** - Talk to your team daily
2. **Quality over speed** - Write good code, not fast code
3. **Ask for help** - Don't struggle alone for hours
4. **Review carefully** - Catch bugs early
5. **Test thoroughly** - Prevent bugs from reaching main
6. **Document everything** - Your future self will thank you
7. **Have fun!** - This is a learning experience

---

**Happy coding! 🚀**

