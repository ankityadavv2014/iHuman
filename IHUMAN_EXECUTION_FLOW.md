# iHuman - Skill Execution Flow

## What Happens When You Click "Execute Skill"

When you click the **Execute Skill** button in the iHuman dashboard, a sophisticated sequence of operations happens behind the scenes. Here's the complete flow:

---

## 🔄 The 8-Step Execution Pipeline

### Step 1: Parameter Validation
**What it does**: Validates all your inputs against skill rules

```
Input Validation
├─ Project name format check (no spaces, valid characters)
├─ Check for naming conflicts (project doesn't already exist)
├─ Verify dependency availability (Node.js, npm, git)
├─ Validate template selection against available templates
└─ Check TypeScript compatibility with selected template
```

**Example Rules for react-setup**:
- Project name: must be lowercase, alphanumeric + hyphens
- Template: must be one of [vite, create-react-app, next]
- TypeScript: must be compatible with selected template
- Styling: must have tooling support (Tailwind, Styled Components, etc.)

**Status**: ✅ Configuration validated

---

### Step 2: Safety Checks & Dependency Verification
**What it does**: Ensures your system can actually execute the skill

```
Environment Check
├─ Node.js version >= 16.0.0 installed?
├─ npm version >= 8.0.0 available?
├─ Git version >= 2.0.0 present?
├─ Disk space available for project?
├─ Write permissions on directory?
└─ Required binaries in PATH?
```

**Example for react-setup**:
- Checks that npm can create projects
- Verifies git is installed for initialization
- Confirms npm registry is accessible
- Validates package manager can install dependencies

**Status**: ✅ Environment validated

---

### Step 3: Backup Creation (Safety Net)
**What it does**: Creates atomic backups before making ANY changes

```
Backup Strategy
├─ Create temporary backup directory
├─ Snapshot current state with MD5 hash
├─ Store backup reference with timestamp
├─ Link backups to execution ID
└─ Enable 1-click rollback on failure
```

**Example for react-setup**:
- If a project directory exists with content, it's safely backed up
- Backup includes metadata (what was there, when, why)
- Backup can be restored with: `rollback execution-id-12345`
- Backups are kept for 30 days by default

**Status**: ✅ Backup created (ID: exec-abc123)

---

### Step 4: Skill Execution (The Main Work)
**What it does**: Actually runs the skill's workflow

```
Execution Pipeline
├─ 1. Parse skill definition from SKILL.md file
├─ 2. Load step definitions and handlers
├─ 3. Execute each step in sequence with:
│   ├─ Input validation
│   ├─ Command execution (with 30s timeout)
│   ├─ Output capture
│   ├─ Error handling
│   └─ Recovery suggestions
├─ 4. Stream output to console in real-time
├─ 5. Build context from previous step results
└─ 6. Continue if success, handle errors if failure
```

**Example for react-setup - Actual Steps Executed**:

```bash
# Step 1: Confirm Setup
mkdir -p ~/projects/my-awesome-app
cd ~/projects/my-awesome-app

# Step 2: Create Project (varies by template)
npx create-react-app . --template cra-template-typescript
# OR
npm create vite@latest . -- --template react-ts
# OR
npx create-next-app@latest . --typescript

# Step 3: Install Dependencies
npm install

# Step 4: Setup TypeScript
npm install --save-dev typescript @types/react @types/react-dom

# Step 5: Configure Styling (based on selection)
# If Tailwind:
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Step 6: Setup Linting
npm install --save-dev eslint eslint-config-react-app
npx eslint --init

# Step 7: Setup Prettier
npm install --save-dev prettier
echo '{"semi": true, "singleQuote": true}' > .prettierrc

# Step 8: Initialize Git
git init
git add .
git commit -m "Initial commit: React project setup"
```

**Status**: ✅ Project created, dependencies installed

---

### Step 5: File Operations (Atomic Writes)
**What it does**: Writes configuration files safely

```
File Writing Strategy
├─ Write to temporary file first
├─ Verify file integrity (checksum)
├─ Atomic move to final location
├─ Update file permissions (755 for scripts, 644 for config)
└─ Log all changes with timestamps
```

**Files Created for react-setup**:
```
my-awesome-app/
├─ package.json (modified with new dependencies)
├─ tsconfig.json (configured)
├─ .eslintrc.json (created)
├─ .prettierrc (created)
├─ tailwind.config.js (if Tailwind selected)
├─ postcss.config.js (if Tailwind selected)
├─ src/
│  ├─ App.tsx
│  ├─ index.tsx
│  └─ styles/ (configured)
├─ public/
├─ .git/ (initialized)
├─ .gitignore (created)
└─ README.md (generated)
```

**Status**: ✅ Configuration files written

---

### Step 6: Error Recovery & Suggestions
**What it does**: Detects and suggests fixes for common issues

```
Error Detection Patterns
├─ Pattern 1: Missing dependencies
│  └─ Suggestion: npm install missing-package
├─ Pattern 2: Permission denied
│  └─ Suggestion: chmod +x file-name
├─ Pattern 3: Port already in use
│  └─ Suggestion: kill process on port or use different port
├─ Pattern 4: Out of disk space
│  └─ Suggestion: Free up space or use different location
├─ Pattern 5: Network timeout
│  └─ Suggestion: Check internet or use npm cache
├─ Pattern 6: Version incompatibility
│  └─ Suggestion: Update Node.js or use compatible version
├─ Pattern 7: File already exists
│  └─ Suggestion: Remove file or use different name
└─ Pattern 8: Command not found
   └─ Suggestion: Install missing tool or add to PATH
```

**If Error Occurs**:
- System doesn't crash
- Error message is captured
- Recovery suggestions are shown
- System asks: "Would you like to:
  1. Retry the step
  2. Skip this step
  3. Rollback and cancel
  4. Continue anyway"

**Status**: ✅ No errors encountered (or handled)

---

### Step 7: Real-Time Output Streaming
**What it does**: Shows you exactly what's happening

```
Output Stream Format
├─ 🚀 Starting execution... (blue)
├─ 📁 Creating directories... (info)
├─ 📦 Installing packages... (info)
├─ ⚙️ Configuring tools... (info)
├─ ✅ Step completed (green)
├─ ⚠️ Warning message (yellow)
├─ ❌ Error encountered (red)
└─ 🎉 Execution complete (green)
```

**What You See in Console**:
```
🚀 Starting skill execution...
📝 Skill: react-setup
📊 Level: beginner
👤 Persona: security

✅ Configuration validated
🔒 Security checks passed
💾 Backup created (ID: exec-abc123)
📁 Creating project structure...
📦 Installing dependencies...
⚙️ Configuring tools...
🎨 Setting up styling...
✨ Initializing git repository...

🎉 Skill execution completed successfully!
📊 Summary:
  • Files created: 12
  • Dependencies installed: 45
  • Configuration time: 2.5s
  • Total time: 1m 23s
```

**Status**: ✅ Skill execution completed successfully

---

### Step 8: Rollback Capability & Results
**What it does**: Provides undo capability and final results

```
Post-Execution Actions
├─ Save execution log
├─ Generate rollback script
├─ Create performance report
├─ Suggest next steps
└─ Ask for feedback
```

**If Something Goes Wrong**:
```bash
# Automatic rollback offered
> Rollback previous execution? (y/n)
> y

# System restores from backup:
Restoring from backup: exec-abc123
├─ Removing created files...
├─ Restoring original state...
├─ Verifying integrity...
└─ Rollback complete! ✅
```

**Final Report**:
```
═════════════════════════════════════════
        EXECUTION SUMMARY
═════════════════════════════════════════

✅ Status: SUCCESS
⏱️  Duration: 1m 23s
📊 Files Created: 12
📦 Packages Installed: 45
🔧 Configurations Applied: 8

Location: /Users/yourname/projects/my-awesome-app

Next Steps:
  1. cd my-awesome-app
  2. npm start (or npm run dev)
  3. Start building your app!

Skill Details:
  • Expertise level: Beginner
  • Persona: Security
  • Template: Create React App
  • TypeScript: Yes
  • Styling: Emotion

Rollback Available: Yes (ID: exec-abc123)
  • Expires: 2026-02-05
  • Command: rollback exec-abc123
```

---

## 🎯 Execution Modes

### Beginner Mode
```
Flow:
1. Validate parameters ✅
2. ASK: "Create project at ~/projects/my-awesome-app?"
3. ASK: "Install 45 dependencies? (takes ~2 min)"
4. ASK: "Configure TypeScript, ESLint, Prettier?"
5. ASK: "Initialize git repository?"
6. Execute
7. Show results
```

**Best for**: Learning what each step does

### Intermediate Mode (Default)
```
Flow:
1. Validate parameters ✅
2. Auto-execute safety checks ✅
3. ASK: "Proceed with setup?" (one confirmation)
4. Execute all steps
5. Show detailed results
```

**Best for**: Most users who want balance

### Expert Mode
```
Flow:
1. Validate parameters ✅
2. Auto-execute everything ✅
3. Show only results
```

**Best for**: Experienced users, CI/CD pipelines, automation

---

## 🛡️ Safety Features Built In

### 1. **Timeout Protection**
- Each command has a 30-second timeout
- Prevents hanging processes
- Automatic cleanup on timeout

### 2. **Atomic Writes**
- Files written to temp location first
- Only moved to final location if successful
- No partial/corrupted files

### 3. **Backup Before Changes**
- Automatic snapshots before modifications
- Full rollback capability
- 30-day retention policy

### 4. **Dependency Checking**
- Verifies all required tools exist
- Checks version compatibility
- Provides installation instructions if missing

### 5. **Permission Validation**
- Checks write permissions before starting
- Verifies directory access
- Suggests sudo only when absolutely necessary

### 6. **Error Recovery**
- Detects 8+ common error patterns
- Provides recovery suggestions
- Allows retry, skip, or rollback

### 7. **Output Logging**
- All output captured to log file
- Useful for debugging
- Can be reviewed after execution

### 8. **Dry Run Mode**
- Shows exactly what would be executed
- No actual changes made
- Preview before committing

---

## 📊 What Data is Collected

### During Execution:
- ✅ Execution ID (for rollback)
- ✅ Skill name and parameters
- ✅ Expertise level and persona selected
- ✅ All output (stdout/stderr)
- ✅ Duration and performance metrics
- ✅ Success/failure status
- ✅ Any errors encountered

### NOT Collected:
- ❌ Your actual project code
- ❌ API keys or secrets
- ❌ Personal information
- ❌ File contents (unless errors)

---

## 🔐 Security Considerations

### Execution Isolation
- Runs in subprocess with its own environment
- No access to parent process
- Cannot read files outside project directory
- Timeout prevents resource exhaustion

### File Safety
- Only writes to specified directory
- Validates file paths (no directory traversal)
- Checks permissions before writing
- Creates backups automatically

### Command Safety
- Whitelist of allowed commands
- No shell injection possible
- Parameters sanitized before execution
- Dangerous operations require confirmation

### User Control
- You approve parameters before execution
- Can review dry run first
- Can cancel at any point
- Can rollback after completion

---

## 🚀 Example: Full React Setup Execution

### You Input:
- Project name: `my-awesome-app`
- Template: `Create React App`
- TypeScript: `Yes`
- Styling: `Tailwind CSS`
- Expertise: `Beginner`

### System Does:
1. ✅ Validates project name format
2. ✅ Checks Node.js and npm versions
3. ✅ Creates backup point
4. 👤 Asks for confirmation (Beginner mode)
5. ✅ Creates directory structure
6. ✅ Runs `npx create-react-app . --template cra-template-typescript`
7. ✅ Installs 45+ dependencies
8. ✅ Configures TypeScript
9. ✅ Installs Tailwind CSS
10. ✅ Configures PostCSS
11. ✅ Sets up ESLint
12. ✅ Sets up Prettier
13. ✅ Initializes git repository
14. ✅ Creates .gitignore
15. ✅ Shows completion summary
16. 🔄 Offers rollback if needed

### Result:
A fully functional React project in `~/projects/my-awesome-app/` ready to use!

```bash
$ cd my-awesome-app
$ npm start
# App opens at http://localhost:3000
```

---

## 💡 Key Takeaway

**When you click "Execute Skill":**

You're not just running a script. You're:
- ✅ Validating everything first
- ✅ Creating safety backups
- ✅ Running professional workflows
- ✅ Handling errors gracefully
- ✅ Capturing all output
- ✅ Enabling full rollback
- ✅ Getting expert guidance

All **automatically**, with **multiple safety layers**, and **zero risk** because you can always rollback.

This is professional-grade automation, not just bash scripts.

---

**Ready to Execute? Click the button and watch the magic happen! 🚀**
