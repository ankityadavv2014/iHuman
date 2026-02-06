# iHuman - Quick Reference Guide

## What is iHuman?

**iHuman** is a professional skill execution platform that transforms complex workflows into guided, safe, automated processes.

---

## What Happens When You Click "Execute Skill"

A sophisticated 8-step process runs automatically:

### 🔍 Step 1: Parameter Validation
Your inputs (project name, template, etc.) are validated against skill rules to catch issues early.

### ✅ Step 2: Safety Checks
System verifies all dependencies exist:
- Node.js version check
- npm availability check
- Git installation check
- Disk space verification
- Write permissions check

### 💾 Step 3: Backup Creation
Before ANY changes, the system creates an atomic backup snapshot. If something goes wrong, you can rollback with one command.

### ⚡ Step 4: Skill Execution
The actual workflow runs:
- Parses skill definition
- Executes each step in sequence
- Captures all output
- Handles errors gracefully
- Suggests recovery if needed

**For react-setup example**, this means:
```bash
✅ Create project directory
✅ Install React template
✅ Install 45+ dependencies
✅ Configure TypeScript
✅ Setup CSS-in-JS or Tailwind
✅ Configure ESLint & Prettier
✅ Initialize git repository
✅ Create .gitignore
```

All automatically, with real-time progress shown.

### 📝 Step 5: File Operations
Configuration files are written atomically:
1. Write to temporary location first
2. Verify file integrity
3. Atomic move to final location
4. Update permissions
5. Log all changes

### 🛡️ Step 6: Error Recovery
If any step fails:
- Error is detected and captured
- Recovery suggestions are provided
- You choose: Retry, Skip, Rollback, or Continue
- No silent failures

### 📡 Step 7: Real-Time Output
You see everything happening:
```
🚀 Starting execution...
✅ Validation passed
💾 Backup created (exec-abc123)
📦 Installing packages...
⚙️ Configuring tools...
🎉 Complete!
```

### 🔄 Step 8: Rollback Capability
If something goes wrong, fully undo with:
```bash
rollback exec-abc123
```

This restores the exact state from before execution.

---

## 3 Expertise Levels

### 👶 Beginner
- Ask for confirmation on EVERY important step
- Educational - see what's happening at each stage
- Safe - can cancel at any time before execution

### 🎯 Intermediate (Recommended)
- Auto-run safety checks
- Ask for one final confirmation
- Good balance of speed and control

### 🚀 Expert
- Run completely automatically
- Best for CI/CD pipelines
- For experienced users who trust the system

---

## 5 Expert Personas

Each persona tailors guidance and tool selection:

### 🤖 AI Engineer
- Focuses on code quality
- Recommends AI-friendly patterns
- Suggests type safety and testing

### 🏗️ Architect
- Design-first approach
- Emphasizes scalability
- Plans for growth from day one

### 🔒 Security
- Security-first configurations
- Adds security tools by default
- Suggests hardening steps

### ⚙️ DevOps
- Operations-first thinking
- Containerization ready
- CI/CD integration suggested

### 💻 Full-Stack
- Balanced approach
- Considers all aspects
- Good for general development

---

## What Gets Created (React Setup Example)

After execution, you get:

```
my-awesome-app/
├── src/
│   ├── App.tsx
│   ├── index.tsx
│   └── styles/
├── public/
├── node_modules/ (45+ packages)
├── package.json (configured)
├── tsconfig.json (TypeScript config)
├── .eslintrc.json (linting rules)
├── .prettierrc (formatting config)
├── tailwind.config.js (if selected)
├── .git/ (repository initialized)
├── .gitignore (configured)
└── README.md (auto-generated)
```

**All configured and ready to use:**
```bash
cd my-awesome-app
npm start
# App opens at http://localhost:3000
```

---

## Safety Features

| Feature | How It Works |
|---------|------------|
| **Atomic Writes** | Files written to temp location first, then moved atomically |
| **Backup Before Changes** | Snapshot created before any modifications |
| **Timeout Protection** | 30-second limit per command (configurable) |
| **Dependency Checking** | Verifies all required tools exist |
| **Permission Validation** | Checks write access before starting |
| **Error Detection** | Recognizes 8+ common error patterns |
| **Recovery Suggestions** | Provides fixes for detected errors |
| **Full Rollback** | One-command undo of entire execution |

---

## Dry Run Mode

Before committing, preview what would happen:

```bash
Click "Dry Run" button
↓
System shows execution plan without making changes
↓
You review the steps
↓
If good, click "Execute"
↓
If worried, make adjustments and try again
```

---

## Real Data Flow

### What's Captured:
✅ Execution ID (for rollback)
✅ Skill name and parameters
✅ All output and logs
✅ Performance metrics
✅ Success/failure status
✅ Error messages (if any)

### What's NOT Captured:
❌ Your project code
❌ API keys or secrets
❌ Personal information
❌ File contents (unless in error)

---

## Common Questions

**Q: What if something goes wrong?**
A: Rollback! You have the execution ID. One command restores everything.

**Q: How long does it take?**
A: React setup takes ~1-2 minutes depending on internet speed. Most steps finish in seconds.

**Q: Can I cancel mid-execution?**
A: Yes! Press Ctrl+C. System will handle cleanup.

**Q: Do I need internet?**
A: For dependency installation, yes. But the system itself works offline.

**Q: Can I modify the skills?**
A: Yes! Skills are markdown files in the `/skills` directory. Edit them directly.

**Q: What if I don't have Node.js installed?**
A: System will tell you before execution starts. Install it, then try again.

**Q: Can teams use this?**
A: Yes! Deploy via Docker for team usage.

**Q: Is it really safe?**
A: Yes. Multiple layers: validation, backups, atomic writes, timeout protection, error recovery, full rollback.

---

## Quick Start

1. **Open dashboard**: http://localhost:5173
2. **Select a skill** (left sidebar)
3. **Configure parameters** (middle panel)
4. **Choose expertise level** (Beginner/Intermediate/Expert)
5. **Click "Dry Run"** to preview (optional)
6. **Click "Execute Skill"** to run

---

## Next Steps After Execution

**If successful:**
```bash
# Navigate to your new project
cd ~/projects/my-awesome-app

# Start development
npm start

# Begin coding!
```

**If something went wrong:**
```bash
# Rollback to previous state
rollback exec-abc123

# Try again with different parameters
```

---

## Learning More

For deeper understanding, read:
- **IHUMAN_EXECUTION_FLOW.md** - Complete technical flow
- **MVP_README.md** - System overview
- **IMPLEMENTATION_REAL_FUNCTIONALITY.md** - Architecture details

---

## Status

**Server**: ✅ Running on http://localhost:5173
**Skills**: ✅ 631 available
**Safety**: ✅ All 8 layers active
**Ready**: ✅ Production-ready

---

**iHuman: Professional Skill Execution. Simple Interface. Maximum Safety.**

🚀 Ready to execute your first skill?
