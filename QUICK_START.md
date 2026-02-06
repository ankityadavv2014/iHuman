# Quick Start Guide - Antigravity Skills

Welcome! Here's how to get started immediately.

## ⚡ Fastest Way to Use It

### 1. Search for skills from terminal

```bash
node packages/cli/bin/cli.js search "react"
```

### 2. Get a specific skill

```bash
node packages/cli/bin/cli.js get react-patterns
```

### 3. Copy to clipboard (macOS)

```bash
node packages/cli/bin/cli.js get stripe-integration --copy
# Then paste with ⌘V
```

### 4. Export all skills

```bash
node packages/cli/bin/cli.js export --format=json > all-skills.json
```

---

## 🎯 Common Tasks

### Search by keyword
```bash
node packages/cli/bin/cli.js search "authentication"
node packages/cli/bin/cli.js search "testing"
node packages/cli/bin/cli.js search "database"
```

### Filter by category
```bash
node packages/cli/bin/cli.js filter --category=architecture
node packages/cli/bin/cli.js filter --category=devops
```

### Filter by risk level
```bash
node packages/cli/bin/cli.js filter --risk=safe
node packages/cli/bin/cli.js filter --risk=critical
```

### View database stats
```bash
node packages/cli/bin/cli.js info
```

### Export for backup
```bash
# JSON format
node packages/cli/bin/cli.js export --format=json > backup.json

# CSV format
node packages/cli/bin/cli.js export --format=csv > backup.csv

# Markdown format
node packages/cli/bin/cli.js export --format=markdown > backup.md
```

---

## 🚀 Create an Alias

Add to your `.bashrc` or `.zshrc`:

```bash
alias antigravity="node /Users/theprojectxco./Desktop/OS/Skills/packages/cli/bin/cli.js"
```

Then reload:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

Now use it anywhere:
```bash
antigravity search "react"
antigravity get ai-engineer --copy
antigravity info
```

---

## 🔄 Workflow Examples

### Example 1: Find and copy a skill to IDE

```bash
# Search
antigravity search "stripe"

# Get and copy
antigravity get stripe-integration --copy

# Paste into your IDE
# (Use ⌘V on Mac, Ctrl+V on Windows/Linux)
```

### Example 2: Build a list of reference skills

```bash
# Get all architecture skills as JSON
antigravity filter --category=architecture --export

# Pipe to file
antigravity filter --category=architecture > arch-skills.md
```

### Example 3: Quick reference while coding

```bash
# Split screen: Terminal + Editor
# In terminal:
antigravity get react-patterns

# Read while coding in your editor!
```

---

## 📊 What's Available

**Total Skills:** 631+

### Top Categories
- Architecture (62 skills)
- Web Development (200+ skills)
- DevOps (40+ skills)
- Security (50+ skills)
- AI/ML (100+ skills)
- And 300+ more!

### Example Skills
```
ai-engineer           - AI Engineering patterns
brainstorming         - Creative thinking framework
stripe-integration    - Payment processing
react-patterns        - Modern React best practices
kubernetes-pro        - Kubernetes mastery
security-hardening    - Security best practices
```

---

## 💡 Pro Tips

### 1. Create a skill collection

```bash
# Export skills you use frequently
antigravity filter --category=architecture > my-architecture-guide.md
antigravity filter --category="api-design" > my-api-guide.md
```

### 2. Share with your team

```bash
# Export a skill
antigravity get brainstorming --copy

# Paste into a document/Slack and share!
```

### 3. Combine with other tools

```bash
# Find and pipe to grep
antigravity search "react" | grep "state"

# Count skills in a category
antigravity filter --category=architecture | wc -l
```

### 4. Use in scripts

```bash
#!/bin/bash
for skill in react typescript testing; do
  echo "=== $skill ==="
  antigravity search $skill
done
```

---

## ❓ Troubleshooting

### "Skill not found"
```bash
# First search to see available skills
antigravity search "keyword"

# Get the exact ID
antigravity get exact-id-from-search
```

### "Can't copy to clipboard"
```bash
# Try without --copy
antigravity get skill-name

# Then manually copy from terminal
```

### "Node command not found"
```bash
# Make sure Node.js is installed
node --version

# If not: https://nodejs.org/
```

---

## 🔗 Next Steps

1. **Create an alias** (see above)
2. **Bookmark this guide**
3. **Try 5 searches** to get familiar
4. **Export your first collection**
5. **Share a skill with your team**

---

## 📖 Learn More

- Full documentation: See `COMPLETE_BUILD.md`
- Architecture details: See `APP_ARCHITECTURE.md`
- Contribute skills: See `CONTRIBUTING.md`

---

## 🎉 You're Ready!

Start using Antigravity Skills now:

```bash
antigravity search "your topic"
```

Happy learning! 🚀
