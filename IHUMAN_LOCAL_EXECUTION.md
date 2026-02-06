# iHuman - Local Execution Technical Deep Dive

## What ACTUALLY Happens When You Click "Execute Skill" Locally

When you click the button in your browser at `http://localhost:5173`, here's the complete technical flow of where changes happen on YOUR machine:

---

## 📍 System Locations & Changes

### Starting Point: Your Browser
```
Browser: http://localhost:5173
├─ HTML/CSS/JavaScript loads
├─ You fill in configuration
├─ You click "Execute Skill"
└─ JavaScript sends command to Node.js server
```

### Step 1: Parameter Validation (No Changes Yet)
**Location**: Node.js server running on port 5173

```javascript
// server.js receives the request
// Validates parameters in memory only
const projectName = "my-awesome-app";  // in memory
const template = "create-react-app";   // in memory
const typescript = true;                // in memory

// Validation checks (NO FILE CHANGES):
✅ Check project name format (alphanumeric + hyphens)
✅ Check for naming conflicts
✅ Verify dependencies available
```

**Files affected**: NONE (yet - all validation is in RAM)

---

### Step 2: Safety Checks (No Changes Yet)
**Location**: System commands executed via Node.js

```bash
# Node.js runs these commands to check your system:

node --version          # Check: Is Node.js 16+ installed?
npm --version          # Check: Is npm 8+ installed?
git --version          # Check: Is git 2+ installed?
which npm              # Check: Where is npm located?
test -w $(pwd)         # Check: Can I write to current directory?
```

**Where these run**: 
- On YOUR machine in the terminal/subprocess
- Check only - NO CHANGES to your files

**Files affected**: NONE

---

### Step 3: Backup Creation (FIRST CHANGE)
**Location**: Your home directory or specified project location

```bash
# If project directory already exists, backup is created
BACKUP_DIR="/tmp/ihuman-backups"

mkdir -p /tmp/ihuman-backups/exec-abc123/

# If ~/projects/my-awesome-app/ already exists:
cp -r ~/projects/my-awesome-app/ /tmp/ihuman-backups/exec-abc123/backup/

# Create backup metadata:
/tmp/ihuman-backups/exec-abc123/metadata.json
{
  "executionId": "exec-abc123",
  "timestamp": "2026-02-04T19:51:00Z",
  "skillName": "react-setup",
  "parameters": { "projectName": "my-awesome-app", ... },
  "status": "backup_created"
}
```

**Files affected**:
- ✅ `/tmp/ihuman-backups/exec-abc123/` - NEW directory created
- ✅ Backup of existing files (if any)
- ✅ Metadata file with execution details

---

### Step 4: Skill Execution - THE REAL WORK HAPPENS HERE
**Location**: Your project directory

This is where actual changes happen to YOUR system:

#### 4a. Create Project Directory
```bash
# Command executed:
mkdir -p ~/projects/my-awesome-app
cd ~/projects/my-awesome-app

# Files created:
~/projects/my-awesome-app/          # NEW directory
```

#### 4b. Create React App
```bash
# Command executed:
npx create-react-app . --template cra-template-typescript

# Files created:
~/projects/my-awesome-app/
├── src/
│   ├── App.tsx                    # NEW
│   ├── index.tsx                  # NEW
│   ├── App.css                    # NEW
│   ├── index.css                  # NEW
│   └── react-app-env.d.ts        # NEW
├── public/
│   ├── index.html                # NEW
│   ├── favicon.ico               # NEW
│   └── manifest.json             # NEW
├── package.json                  # NEW (with 45+ dependencies)
├── tsconfig.json                 # NEW (TypeScript config)
├── .gitignore                    # NEW
└── README.md                     # NEW
```

#### 4c. Install Dependencies
```bash
# Command executed:
cd ~/projects/my-awesome-app
npm install

# Changes made:
~/projects/my-awesome-app/node_modules/         # NEW (45+ packages)
├── react/                                      # NEW
├── react-dom/                                  # NEW
├── typescript/                                 # NEW
├── ... (43 more packages)
└── package-lock.json                         # NEW

# Modified:
~/projects/my-awesome-app/package.json         # MODIFIED (versions added)
```

#### 4d. Configure TypeScript
```bash
# Command executed:
# (already created by CRA, but can be enhanced)

# Files modified:
~/projects/my-awesome-app/tsconfig.json        # ALREADY CREATED by CRA
```

#### 4e. Install & Configure Tailwind CSS (if selected)
```bash
# Commands executed:
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Files created:
~/projects/my-awesome-app/tailwind.config.js   # NEW
~/projects/my-awesome-app/postcss.config.js    # NEW
~/projects/my-awesome-app/src/index.css        # MODIFIED (Tailwind directives added)
```

Example `tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### 4f. Configure ESLint
```bash
# Command executed:
npm install --save-dev eslint eslint-config-react-app
npx eslint --init

# Files created:
~/projects/my-awesome-app/.eslintrc.json       # NEW
```

#### 4g. Configure Prettier
```bash
# Command executed:
npm install --save-dev prettier

# Files created:
~/projects/my-awesome-app/.prettierrc          # NEW
```

Example `.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

#### 4h. Initialize Git
```bash
# Commands executed:
git init
git config user.email "ihuman@example.com"
git config user.name "iHuman"
git add .
git commit -m "Initial commit: React project setup"

# Files created:
~/projects/my-awesome-app/.git/                # NEW (git repository)
├── objects/
├── refs/
├── HEAD
├── config
└── ... (git internals)

# Modified:
~/projects/my-awesome-app/.gitignore          # NEW
```

---

## 📊 Complete File Structure After Execution

```
~/projects/my-awesome-app/
│
├── 📁 src/                           (NEW)
│   ├── App.tsx
│   ├── App.css
│   ├── App.test.tsx
│   ├── index.tsx
│   ├── index.css
│   └── react-app-env.d.ts
│
├── 📁 public/                        (NEW)
│   ├── index.html
│   ├── favicon.ico
│   ├── manifest.json
│   └── robots.txt
│
├── 📁 node_modules/                 (NEW - 45+ packages)
│   ├── react/
│   ├── react-dom/
│   ├── typescript/
│   ├── tailwindcss/
│   ├── eslint/
│   ├── prettier/
│   └── ... (39 more packages)
│
├── 📁 .git/                         (NEW - git repository)
│   ├── objects/
│   ├── refs/
│   ├── HEAD
│   └── config
│
├── package.json                     (NEW)
├── package-lock.json               (NEW)
├── tsconfig.json                   (NEW)
├── .eslintrc.json                 (NEW)
├── .prettierrc                     (NEW)
├── tailwind.config.js              (NEW)
├── postcss.config.js               (NEW)
├── .gitignore                      (NEW)
└── README.md                       (NEW)
```

---

## 🔄 Step 5: File Operations - Atomic Writes

**How it works locally:**

```bash
# For each config file, the system:

# 1. Write to temporary location
cat > /tmp/tailwind.config.js.tmp << 'EOF'
module.exports = { ... }
EOF

# 2. Verify file is valid (checksum)
md5sum /tmp/tailwind.config.js.tmp
# Output: abc123def456 /tmp/tailwind.config.js.tmp

# 3. Move atomically to final location (atomic operation)
mv /tmp/tailwind.config.js.tmp ~/projects/my-awesome-app/tailwind.config.js

# 4. Verify final file
md5sum ~/projects/my-awesome-app/tailwind.config.js
# Output: abc123def456 ~/projects/my-awesome-app/tailwind.config.js ✅
```

**Why atomic writes matter:**
- If power fails during write, file is NOT corrupted
- Either the OLD file exists OR the NEW file exists
- Never a half-written file

**Files affected**:
- Configuration files written atomically
- Temporary files cleaned up automatically
- `/tmp/` might have temporary backups (cleaned up after verification)

---

## ⚡ Step 6: Error Recovery (If Something Fails)

If an error occurs, the system:

```bash
# Example: npm install fails due to network issue

# 1. Error is detected:
❌ npm install failed: connection timeout

# 2. Recovery suggestion shown:
📋 Recovery options:
   1. Check your internet connection
   2. Try: npm cache clean --force
   3. Try: npm install again
   4. Rollback to previous state

# 3. If user chooses rollback:
# Restore from backup:
rm -rf ~/projects/my-awesome-app/*
cp -r /tmp/ihuman-backups/exec-abc123/backup/* ~/projects/my-awesome-app/

# Verify restoration:
ls ~/projects/my-awesome-app/
# (original state restored)
```

**Files affected**:
- NO permanent changes (rollback restores original state)
- Backup files in `/tmp/ihuman-backups/` remain for 30 days
- Error logs saved to `~/.ihuman/logs/exec-abc123.log`

---

## 📡 Step 7: Output Streaming (What You See)

The dashboard shows real-time output:

```
Browser Console (http://localhost:5173):

🚀 Starting skill execution...
📝 Skill: react-setup
📊 Level: beginner
👤 Persona: security

✅ Configuration validated
🔒 Security checks passed
💾 Backup created (ID: exec-abc123)
  Location: /tmp/ihuman-backups/exec-abc123/

📁 Creating project structure...
  mkdir -p ~/projects/my-awesome-app

📦 Installing React template...
  npx create-react-app . --template cra-template-typescript
  [████████████████████] 100% (2.3s)

⚙️ Installing dependencies...
  npm install
  [████████████████████] 100% (45.2s, 45 packages)

🎨 Setting up styling...
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  [████████████████████] 100% (8.1s)

🔍 Configuring linting...
  npm install --save-dev eslint
  npx eslint --init
  [████████████████████] 100% (3.2s)

✨ Initializing git repository...
  git init && git add . && git commit -m "Initial commit"
  [████████████████████] 100% (0.8s)

🎉 Skill execution completed successfully!

📊 Summary:
  ✅ Project created: ~/projects/my-awesome-app
  ✅ Files created: 42
  ✅ Packages installed: 45
  ✅ Configuration files created: 7
  ✅ Total time: 1m 23s
  ✅ Git repository initialized

🚀 Next steps:
  $ cd ~/projects/my-awesome-app
  $ npm start
  
✅ Rollback available until: 2026-02-05
   Command: rollback exec-abc123
```

---

## 🔄 Step 8: Rollback Capability

If something goes wrong, you can undo everything:

```bash
# Command in terminal:
$ rollback exec-abc123

# What happens:
1. Find backup: /tmp/ihuman-backups/exec-abc123/
2. Verify backup integrity
3. Remove current project:
   rm -rf ~/projects/my-awesome-app
4. Restore from backup:
   cp -r /tmp/ihuman-backups/exec-abc123/backup ~/projects/my-awesome-app
5. Verify restoration
6. Show status

# Output:
✅ Rollback complete!
📁 Original state restored: ~/projects/my-awesome-app
⏱️ Took: 2.3 seconds
📊 Files restored: 42

# Your system is back to exactly how it was before execution
```

**Backup location**: `/tmp/ihuman-backups/exec-abc123/`

---

## 📍 Summary: All Changes Locations

### Where Files Get Created/Modified:

**Primary location:**
```
~/projects/my-awesome-app/                    # Your React project
├── src/                                       # Your source code
├── public/                                    # Public assets
├── node_modules/                              # Dependencies
├── .git/                                      # Git repository
├── package.json                               # Project config
└── ... (config files)
```

**Backup location:**
```
/tmp/ihuman-backups/exec-abc123/              # Backup snapshots
├── backup/                                    # Previous state
└── metadata.json                              # Execution details
```

**Logs location:**
```
~/.ihuman/logs/exec-abc123.log                # Execution log
```

**Temporary files:**
```
/tmp/*.tmp                                    # Cleaned up automatically
```

---

## 🛡️ Safety: What's Protected

### Cannot be changed by accident:
- ❌ System files (they're protected by OS permissions)
- ❌ Other project directories (only operates on target directory)
- ❌ Home directory files (only creates `~/.ihuman/` for logs)
- ❌ System packages (only uses npm)

### Can be rolled back:
- ✅ Project files (backed up before execution)
- ✅ Configurations (backed up atomically)
- ✅ All changes (one-command rollback)

### Always safe:
- ✅ Validation before execution
- ✅ Isolated subprocess (cannot affect other processes)
- ✅ 30-second timeout (prevents infinite loops)
- ✅ Atomic writes (no partial files)
- ✅ Full backup (complete restoration available)

---

## 🔍 How to Verify Changes

After execution, you can inspect what was created:

```bash
# Check project was created:
$ ls -la ~/projects/my-awesome-app/
total 120
-rw-r--r--   1 user  staff     1234 Feb  4 19:51 package.json
-rw-r--r--   1 user  staff     5678 Feb  4 19:51 tsconfig.json
drwxr-xr-x   3 user  staff     4096 Feb  4 19:51 src
drwxr-xr-x   3 user  staff     4096 Feb  4 19:51 public
drwxr-xr-x  45 user  staff    14336 Feb  4 19:51 node_modules
drwxr-xr-x  11 user  staff     3520 Feb  4 19:51 .git

# Check git repository was initialized:
$ cd ~/projects/my-awesome-app && git log --oneline
abc1234 Initial commit: React project setup

# Check packages were installed:
$ npm list --depth=0
my-awesome-app@0.1.0
├── react@18.2.0
├── react-dom@18.2.0
├── typescript@5.0.0
├── tailwindcss@3.3.0
└── ... (40 more)

# Check configuration files:
$ cat package.json | jq '.dependencies'
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

---

## 🚀 Then What? Ready to Use

After execution completes, you can immediately start using your project:

```bash
# Start the development server:
$ cd ~/projects/my-awesome-app
$ npm start

# Your app opens at: http://localhost:3000
# You can start developing immediately!

# Or build for production:
$ npm run build

# Or run tests:
$ npm test

# Or lint your code:
$ npm run lint
```

---

## ⚡ Real Example: Step-by-Step Terminal View

Here's what actually happens in your terminal if you were running it directly:

```bash
$ cd ~/projects/my-awesome-app && npm start

> my-awesome-app@0.1.0 start
> react-scripts start

ℹ️ On Your Network: http://192.168.1.100:3000

Compiled successfully!

You can now view my-awesome-app in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.100:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled with warnings.
```

---

## Key Takeaway

**When you click "Execute Skill" locally:**

1. ✅ Dashboard sends configuration to Node.js server
2. ✅ Server validates parameters in memory (no changes)
3. ✅ Server runs safety checks (no changes)
4. ✅ Server creates backup in `/tmp/ihuman-backups/` (safety only)
5. 🔴 **Server executes commands that create/modify files in YOUR project directory**
6. ✅ All output streams back to browser in real-time
7. ✅ If anything fails, rollback is available
8. ✅ Project is ready to use immediately

**All changes happen in:** `~/projects/your-project-name/`

**All backups saved in:** `/tmp/ihuman-backups/exec-id/`

**All logs saved in:** `~/.ihuman/logs/exec-id.log`

This is professional automation with complete transparency and safety! 🚀
