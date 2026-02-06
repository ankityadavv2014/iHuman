# Contributing to ihuman

Thank you for your interest in contributing to **ihuman** - the enterprise skill execution platform! We welcome all contributions that help make skill automation more accessible and powerful.

## 🎯 Our Mission

To transform complex workflows into simple, reliable automation that anyone can execute with confidence.

## 💡 How You Can Contribute

### 1. 🐛 Report Bugs
Found an issue? Help us fix it!

```bash
# Before reporting, check if issue exists:
# https://github.com/ankityadavv2014/ihuman-skills-dashboard/issues

# When reporting, include:
- ihuman version
- Operating system
- Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Error messages/logs
```

### 2. ✨ Add New Skills
Help expand the skill library!

**Skill Template:**
```javascript
{
  "id": "your-skill-name",
  "name": "Human Readable Name",
  "description": "What this skill does",
  "category": "frontend|backend|devops|security|data",
  "parameters": [
    {
      "name": "paramName",
      "type": "text|boolean|select",
      "label": "Display Label",
      "required": true,
      "validation": "/regex/",
      "hint": "Helper text"
    }
  ],
  "steps": [
    {
      "id": "step-id",
      "name": "Step Name",
      "critical": true
    }
  ],
  "estimatedTime": "2-3 minutes"
}
```

**To contribute a skill:**
1. Create `skills/your-skill/metadata.json`
2. Add parameter definitions
3. Test with Dry Run mode
4. Submit PR with test results

### 3. 🎨 Improve UI/UX
- Fix styling issues
- Improve responsiveness
- Enhance accessibility
- Better error messages

### 4. 📖 Improve Documentation
- Add tutorials
- Write API docs
- Create examples
- Fix typos/clarity

### 5. ⚡ Performance Improvements
- Optimize rendering
- Reduce API response times
- Improve memory usage
- Cache optimizations

### 6. 🛡️ Security Enhancements
- Report vulnerabilities responsibly
- Add input validation
- Improve error handling
- Security audits

## 🚀 Getting Started

### Fork & Clone
```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR_USERNAME/ihuman-skills-dashboard.git
cd ihuman-skills-dashboard
git remote add upstream https://github.com/ankityadavv2014/ihuman-skills-dashboard.git
```

### Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Create Feature Branch
```bash
git checkout -b feature/your-amazing-feature
# or
git checkout -b bugfix/issue-description
# or
git checkout -b docs/documentation-improvement
```

### Development Workflow

```bash
# Start server in development
PORT=5173 node packages/web/server.js

# Open browser
# http://localhost:5173

# Make your changes
# Test thoroughly

# Check your code
npm run validate

# Commit changes
git add .
git commit -m "feat: add awesome feature"
```

## 📋 Code Style Guidelines

### Naming Conventions
```javascript
// Variables & functions: camelCase
const myVariable = "value";
function doSomething() {}

// Classes: PascalCase
class SkillExecutor {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// Files: kebab-case
// src/skill-executor.js
// src/components/skill-card.js
```

### JavaScript Style
```javascript
// Use ES6+ features
const data = await fetch(url);
const [first, ...rest] = array;

// Clear variable names
const executedSkillCount = skills.filter(s => s.executed).length;

// Comments for complex logic
// Pattern matching for workflow recommendation
const workflowId = patterns
  .find(pattern => objective.includes(pattern))
  .workflowId;

// No unnecessary nesting
if (error) {
  handleError(error);
  return;
}

processData();
```

### File Organization
```
packages/web/
├── server.js          # API endpoints & routing
├── app.js             # Frontend logic
├── index.html         # HTML structure
└── style.css          # Styling

data/
├── workflows.json     # Workflow definitions
└── skills.json        # Skill metadata

lib/
└── AgencyOrchestrator.js  # Business logic

skills/
└── [skill-name]/      # Individual skills
    ├── metadata.json
    └── steps.js
```

## ✅ Before Submitting a PR

### Testing Checklist
- [ ] Feature works in development
- [ ] No console errors/warnings
- [ ] Responsive design tested (desktop/tablet/mobile)
- [ ] Error handling works properly
- [ ] Parameter validation functions correctly
- [ ] API responses are correct
- [ ] SSE streaming works smoothly

### Code Quality Checklist
- [ ] Code follows style guide
- [ ] Comments explain complex logic
- [ ] No dead/unused code
- [ ] Performance optimized
- [ ] Accessibility considered

### Documentation Checklist
- [ ] Code is self-documenting
- [ ] Complex functions have comments
- [ ] README updated if needed
- [ ] Examples provided where helpful

## 📤 Submitting a Pull Request

### PR Title Format
```
type(scope): short description

Examples:
feat(skills): add Docker setup skill
fix(ui): resolve responsive design issues
docs(readme): add API examples
perf(api): optimize workflow recommendation
refactor(frontend): simplify event listeners
test(validation): add parameter validation tests
```

### PR Description Template
```markdown
## Description
Brief explanation of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Performance improvement
- [ ] Code refactoring

## Related Issues
Closes #issue_number

## Testing Done
- [ ] Unit tests
- [ ] Manual testing
- [ ] Dry run verified
- [ ] Production simulation

## Screenshots (if applicable)
<!-- Add UI changes here -->

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Tests pass
- [ ] Works on multiple browsers
```

## 🔄 Review Process

1. **Automated Checks**
   - Code style validation
   - Syntax checking
   - Performance tests

2. **Manual Review**
   - Code quality
   - Design patterns
   - Security implications

3. **Testing**
   - Feature testing
   - Regression testing
   - Edge cases

4. **Approval & Merge**
   - Maintainer approval
   - All checks pass
   - PR merged to main

## 🎓 Learning Resources

### Understanding ihuman
- [README.md](README.md) - Project overview
- [IHUMAN_QUICK_START.md](IHUMAN_QUICK_START.md) - Getting started
- [IHUMAN_EXECUTION_FLOW.md](IHUMAN_EXECUTION_FLOW.md) - Technical details

### Architecture
- **Skill Execution** - Single skill with parameters
- **Agency Mode** - Multi-step workflow orchestration
- **Streaming** - Real-time SSE progress updates
- **Safety** - 8-layer protection system

### Code Examples
```javascript
// Adding a new API endpoint
app.post('/api/new-endpoint', handleNewEndpoint);

function handleNewEndpoint(req, res) {
  // Parse request
  const data = JSON.parse(body);
  
  // Validate
  if (!data.required) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Missing required field' }));
    return;
  }
  
  // Process
  const result = processData(data);
  
  // Respond
  res.writeHead(200);
  res.end(JSON.stringify(result));
}

// Adding a new UI feature
document.getElementById('button').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({ data })
    });
    
    if (!response.ok) throw new Error('Request failed');
    
    const result = await response.json();
    updateUI(result);
  } catch (error) {
    console.error('Error:', error);
    showError(error.message);
  }
});
```

## 📊 Contribution Types & Impact

| Type | Impact | Effort | Examples |
|------|--------|--------|----------|
| **Bug Fixes** | High | Low | Fix typo, resolve error |
| **Features** | High | Medium-High | New skill, new API |
| **Docs** | Medium | Low | Tutorial, clarification |
| **Perf** | Medium | Medium | Optimize query, cache |
| **Tests** | Medium | Low-Medium | Add validation |
| **UI/UX** | Medium | Low-High | Styling, accessibility |

## 🏆 Recognition

All contributors are recognized:
- In [CONTRIBUTORS.md](CONTRIBUTORS.md)
- In commit history
- In release notes
- As GitHub collaborators

## 💬 Questions?

- 📧 Email: contact@ihuman.dev
- 💭 Discussions: [GitHub Discussions](https://github.com/ankityadavv2014/ihuman-skills-dashboard/discussions)
- 🐛 Issues: [GitHub Issues](https://github.com/ankityadavv2014/ihuman-skills-dashboard/issues)

## 📝 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

<div align="center">

**Thank you for contributing to ihuman! Together we're making automation accessible to everyone. 🚀**

</div>
