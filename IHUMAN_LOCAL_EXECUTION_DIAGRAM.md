# iHuman - Local Execution Flow Diagram

## Visual Flow: What Happens When You Click "Execute Skill"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          YOU AT YOUR COMPUTER                               │
└─────────────────────────────────────────────────────────────────────────────┘

                          Your Browser
                    http://localhost:5173
                      ┌─────────────────┐
                      │  Dashboard UI   │
                      │  (Runs locally) │
                      └────────┬────────┘
                               │
                    You click: Execute Skill
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │  Browser JavaScript sends config to Node.js  │
        │  POST /execute {                             │
        │    projectName: "my-awesome-app",            │
        │    template: "create-react-app",             │
        │    typescript: true,                         │
        │    styling: "tailwind",                      │
        │    level: "beginner"                         │
        │  }                                           │
        └──────────────────────┬───────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │    Node.js Server (port 5173)                │
        │    Runs: packages/web/server.js              │
        └──────────────────────┬───────────────────────┘
                               │
                 ┌─────────────┴──────────────┐
                 │  8-Step Process Begins    │
                 └─────────────┬──────────────┘
                               │
        ┌──────────────────────────────────────────────┐
        │  STEP 1: Parameter Validation               │
        │  ────────────────────────────────           │
        │  ✓ Check project name format                │
        │  ✓ Check for naming conflicts               │
        │  ✓ Verify dependencies available            │
        │  (NO FILE CHANGES)                          │
        └──────────────────────┬───────────────────────┘
                               │
        ┌──────────────────────────────────────────────┐
        │  STEP 2: Safety Checks                      │
        │  ────────────────────────────────           │
        │  $ node --version                           │
        │  $ npm --version                            │
        │  $ git --version                            │
        │  (NO FILE CHANGES)                          │
        └──────────────────────┬───────────────────────┘
                               │
        ┌──────────────────────────────────────────────┐
        │  STEP 3: Backup Creation                    │
        │  ────────────────────────────────           │
        │  CREATES: /tmp/ihuman-backups/exec-123/     │
        │  (First file change!)                       │
        └──────────────────────┬───────────────────────┘
                               │
        ┌──────────────────────────────────────────────┐
        │  STEP 4: MAIN EXECUTION                     │
        │  ═════════════════════════════════════      │
        │                                              │
        │  4a. mkdir ~/projects/my-awesome-app/       │
        │      └─ Creates directory                   │
        │                                              │
        │  4b. npx create-react-app ...               │
        │      └─ Creates:                            │
        │        • src/                               │
        │        • public/                            │
        │        • package.json                       │
        │        • tsconfig.json                      │
        │                                              │
        │  4c. npm install                            │
        │      └─ Creates:                            │
        │        • node_modules/ (45 packages)        │
        │        • package-lock.json                  │
        │                                              │
        │  4d. npm install -D tailwindcss ...         │
        │      └─ Creates:                            │
        │        • tailwind.config.js                 │
        │        • postcss.config.js                  │
        │                                              │
        │  4e. npm install --save-dev eslint          │
        │      └─ Creates:                            │
        │        • .eslintrc.json                     │
        │                                              │
        │  4f. npm install --save-dev prettier        │
        │      └─ Creates:                            │
        │        • .prettierrc                        │
        │                                              │
        │  4g. git init & git commit                  │
        │      └─ Creates:                            │
        │        • .git/ (repository)                 │
        │        • .gitignore                         │
        │                                              │
        │  *** MASSIVE FILE CREATION HAPPENS HERE *** │
        │      Location: ~/projects/my-awesome-app/  │
        │      Files: 42+ files created               │
        │      Packages: 45 installed                 │
        │      Size: ~250MB                           │
        └──────────────────────┬───────────────────────┘
                               │
        ┌──────────────────────────────────────────────┐
        │  STEP 5: File Operations (Atomic Writes)    │
        │  ────────────────────────────────           │
        │  Write to temp: /tmp/config.js.tmp          │
        │  Verify: checksum matches                   │
        │  Move: atomic mv to final location          │
        │  (Safety: no partial/corrupted files)       │
        └──────────────────────┬───────────────────────┘
                               │
        ┌──────────────────────────────────────────────┐
        │  STEP 6: Error Recovery (If Needed)         │
        │  ────────────────────────────────           │
        │  IF error detected:                         │
        │    • Show error message                     │
        │    • Suggest recovery steps                 │
        │    • Offer rollback option                  │
        │  (NO FILE CHANGES unless rollback)          │
        └──────────────────────┬───────────────────────┘
                               │
        ┌──────────────────────────────────────────────┐
        │  STEP 7: Output Streaming                   │
        │  ────────────────────────────────           │
        │  Real-time feedback sent back to browser:   │
        │  • Each step's progress                     │
        │  • Status indicators                        │
        │  • Error messages                           │
        │  • Final summary                            │
        └──────────────────────┬───────────────────────┘
                               │
        ┌──────────────────────────────────────────────┐
        │  STEP 8: Rollback Capability Set            │
        │  ────────────────────────────────           │
        │  Save metadata: /tmp/ihuman-backups/...     │
        │  Enable rollback: rollback exec-123         │
        │  (Backup kept for 30 days)                  │
        └──────────────────────┬───────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Execution Complete  │
                    │  ✅ Success!         │
                    └──────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                       FILES CREATED ON YOUR SYSTEM                           │
└─────────────────────────────────────────────────────────────────────────────┘

PRIMARY LOCATION: ~/projects/my-awesome-app/
├── 📁 src/                          (NEW - Your React source code)
│   ├── App.tsx
│   ├── index.tsx
│   └── ... (React components)
├── 📁 public/                       (NEW - Static assets)
│   ├── index.html
│   └── favicon.ico
├── 📁 node_modules/                 (NEW - 45 packages, ~250MB)
│   ├── react/
│   ├── react-dom/
│   ├── typescript/
│   ├── tailwindcss/
│   └── ... (41 more)
├── 📁 .git/                         (NEW - Git repository)
│   ├── objects/
│   ├── refs/
│   └── HEAD
├── package.json                     (NEW - Project config)
├── package-lock.json               (NEW - Dependency lock)
├── tsconfig.json                   (NEW - TypeScript config)
├── .eslintrc.json                 (NEW - ESLint rules)
├── .prettierrc                     (NEW - Prettier config)
├── tailwind.config.js              (NEW - Tailwind config)
├── postcss.config.js               (NEW - PostCSS config)
├── .gitignore                      (NEW - Git ignore rules)
└── README.md                       (NEW - Project readme)

BACKUP LOCATION: /tmp/ihuman-backups/exec-abc123/
├── backup/                         (Copy of previous state)
│   └── ... (your files before execution)
└── metadata.json                   (Execution details)

LOGS LOCATION: ~/.ihuman/logs/
└── exec-abc123.log                (Complete execution log)


┌─────────────────────────────────────────────────────────────────────────────┐
│                         TIMELINE (Typical Execution)                        │
└─────────────────────────────────────────────────────────────────────────────┘

[0s]   You click "Execute Skill" in browser
[0.1s] Dashboard sends config to Node.js server
[0.2s] Parameter validation (instant)
[0.3s] Safety checks run (< 1 second)
[0.5s] Backup created (2-3 seconds)
[0.8s] npx create-react-app starts
[10s]  ← Creating React app structure (10 seconds)
[50s]  ← npm install running (40+ seconds for 45 packages)
[55s]  npm install complete
[60s]  Tailwind/ESLint/Prettier setup (5 seconds)
[65s]  Git initialization (1 second)
[66s]  ← Total time: ~65 seconds

[66s]  ✅ Execution complete! Ready to use
       You can: cd ~/projects/my-awesome-app && npm start


┌─────────────────────────────────────────────────────────────────────────────┐
│                    WHAT'S HAPPENING DURING EXECUTION                        │
└─────────────────────────────────────────────────────────────────────────────┘

YOUR MACHINE:
├── Hard Drive:
│   ├── ~/projects/my-awesome-app/  ← Files being created HERE
│   ├── /tmp/ihuman-backups/        ← Backup being created here
│   └── ~/.ihuman/logs/             ← Logs being written here
│
├── RAM:
│   ├── Node.js server (port 5173)  ← Running and coordinating
│   ├── Child processes             ← Running npm, git commands
│   └── Output buffers              ← Capturing stdout/stderr
│
└── Network:
    └── npm registry                ← Downloading packages
        (45 packages downloaded)


┌─────────────────────────────────────────────────────────────────────────────┐
│                              RECOVERY SCENARIO                              │
└─────────────────────────────────────────────────────────────────────────────┘

If something fails during execution:

Option 1: Retry
  ✓ Fix the issue
  ✓ Click "Retry" button
  ✓ Same execution ID used
  ✓ Same backup location

Option 2: Rollback
  ✓ Click "Rollback" button
  ✓ System restores from backup
  ✓ ~/projects/my-awesome-app/ restored to previous state
  ✓ /tmp/ihuman-backups/exec-123/ acts as recovery point
  ✓ Takes ~2-3 seconds

Option 3: Manual Recovery
  $ rollback exec-abc123
  ✓ Same as Option 2
  ✓ Can be run from terminal anytime (within 30 days)


┌─────────────────────────────────────────────────────────────────────────────┐
│                          AFTER EXECUTION: WHAT'S NEXT?                      │
└─────────────────────────────────────────────────────────────────────────────┘

Your project is ready to use:

$ cd ~/projects/my-awesome-app

$ npm start
  ↓
  Development server starts on http://localhost:3000
  ↓
  Your browser auto-opens the React app
  ↓
  Start developing!

OR build for production:

$ npm run build
  ↓
  Creates optimized build in ~/projects/my-awesome-app/build/
  ↓
  Ready to deploy!

OR run tests:

$ npm test
  ↓
  All tests run with jest
  ↓
  See test results


┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLEANUP: 30-DAY BACKUP RETENTION                         │
└─────────────────────────────────────────────────────────────────────────────┘

Backups are kept in /tmp/ihuman-backups/ for 30 days:

Day 1-30:   Backup available, can rollback anytime
Day 31:     Backup automatically deleted
Result:     You have one month to verify everything is perfect


KEY INSIGHT: Everything stays in ONE place - your project directory!

You can always:
  ✅ Browse ~/projects/my-awesome-app/ to see what was created
  ✅ Start developing immediately
  ✅ Rollback within 30 days if needed
  ✅ Modify any config file manually
  ✅ Delete the project if you don't want it
```

---

## Summary

When you click "Execute Skill" **locally**:

1. **Browser** sends config to Node.js server
2. **Node.js** validates and prepares (no changes yet)
3. **Node.js** creates backup in `/tmp/` (safety only)
4. **Node.js** runs shell commands that create/modify files in `~/projects/your-project/`
5. **Node.js** streams real-time output back to browser
6. **Browser** displays progress with emojis and status
7. **All changes** happen in ONE directory: `~/projects/your-project-name/`
8. **You can** rollback, modify, or delete anytime

**No magic. No hidden changes. Everything transparent and recoverable.** ✅
