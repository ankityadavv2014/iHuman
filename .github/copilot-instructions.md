# Antigravity Awesome Skills - Copilot Instructions

## Project Overview

**Antigravity Awesome Skills** is a comprehensive collection of 631+ agentic skills designed for AI coding assistants including Claude Code, Gemini CLI, GitHub Copilot, Cursor, and others. It provides universal skills for building full-stack AI-powered applications.

### Key Technologies
- **Runtime**: Node.js with npm
- **Language**: JavaScript (CLI tool) + Python (validation scripts)
- **Main Entry Point**: `bin/install.js`
- **Package**: Published as `antigravity-awesome-skills` on npm

## Development Workflow

### Available Scripts

- `npm run validate` - Validate all skills for correct structure and metadata
- `npm run validate:strict` - Run validation in strict mode
- `npm run index` - Generate skill index from repository
- `npm run readme` - Update README with skill information
- `npm run chain` - Run validate, index, and readme sequentially
- `npm run catalog` - Build the skills catalog
- `npm run build` - Execute full build pipeline (chain + catalog)
- `npm run test` - Run test suite for skill validation

### Quick Start

1. **Install dependencies**: `npm install` (already completed)
2. **Validate skills**: `npm run validate` 
3. **Build everything**: `npm run build`
4. **Test**: `npm run test`

## Project Structure

```
.
├── bin/                    # Executable scripts (install.js)
├── data/                   # Data files
├── docs/                   # Documentation
├── lib/                    # Library code
├── scripts/                # Maintenance scripts (validation, indexing, etc.)
├── skills/                 # 631+ skill definitions (main content)
├── skills_index.json       # Auto-generated skill index
├── CATALOG.md              # Skills catalog
├── package.json            # Node.js configuration
└── README.md               # Main documentation
```

## Key Commands for Copilot

- **Explore skills**: Browse `/skills/` directory for individual skill SKILL.md files
- **Run validation**: `npm run validate` to check all skills for issues
- **Generate documentation**: `npm run build` to update all auto-generated files
- **Test changes**: `npm run test` to validate any modifications

## Important Notes

- Skills are organized in directories under `/skills/` with a `SKILL.md` file per skill
- Current status: 631 skills validated, 1324 warnings (mostly missing metadata)
- The project is a curated collection and CLI installer for AI assistant skills
- No external database dependencies required - all data is file-based

---

*Setup completed: Repository cloned, dependencies installed, and project validated.*
