# Dashboard Testing Guide

## Start the Dashboard

```bash
cd /Users/theprojectxco./Desktop/OS/Skills/packages/web
PORT=5175 node server.js
```

Then open: **http://localhost:5175**

---

## Test 1: Skill Execution (Real File Creation)

### What to Test:
1. Open "Skills" tab
2. Select any skill from dropdown (e.g., "React Dashboard")
3. Set Level: "Intermediate"
4. Set Persona: "Frontend Developer"
5. Click "Execute Skill"

### Expected Results:
✅ Shows execution messages
✅ Lists "Files created:" with paths
✅ Files actually exist on filesystem at `skill-output/React-Dashboard/`
✅ No "Error" status

### Verify Files Created:
```bash
ls -la /Users/theprojectxco./Desktop/OS/Skills/skill-output/React-Dashboard/
cat /Users/theprojectxco./Desktop/OS/Skills/skill-output/React-Dashboard/package.json
```

---

## Test 2: Agency Tab Error Handling

### What to Test:
1. Open "Agency" tab
2. Type an unmatched objective: **"Zscale ZPA App segmentation"**
3. Click "Analyze Objective"

### Expected Results (Before Fix):
❌ Screen goes completely blank
❌ No error message
❌ No way to recover

### Expected Results (After Fix):
✅ Shows alert message: `"No matching workflow found for: 'Zscale ZPA...'"` 
✅ Provides suggestions for valid objectives
✅ Screen doesn't go blank
✅ Can type a new objective and try again

### What IS Matched:
- "SaaS MVP" → matches "full-stack-saas-mvp"
- "Machine learning" → matches "ml-data-pipeline"
- "DevOps" → matches "devops-infrastructure"
- "Mobile" → matches "mobile-app"
- "API" → matches "backend-api"

---

## Test 3: Matched Agency Workflow

### What to Test:
1. Open "Agency" tab
2. Type a matched objective: **"Build a SaaS MVP"**
3. Click "Analyze Objective"

### Expected Results:
✅ Moves to Phase 2 (Recommendation)
✅ Shows workflow name and description
✅ Shows decision points as selectable options
✅ No errors or blank screen

---

## API Endpoints (for manual testing)

### Execute Skill
```bash
curl -X POST http://localhost:5175/api/execute-skill \
  -H "Content-Type: application/json" \
  -d '{
    "skill":"React Dashboard",
    "level":"Intermediate",
    "persona":"Frontend Developer"
  }'
```

Expected response:
```json
{
  "success": true,
  "filesCreated": [
    "/Users/.../skill-output/React-Dashboard",
    "/Users/.../skill-output/React-Dashboard/src",
    "...more files..."
  ],
  "output": ["✅ Project directory created", "...more output..."],
  "projectPath": "/Users/.../skill-output/React-Dashboard"
}
```

### Analyze Objective
```bash
curl -X POST http://localhost:5175/api/agency/analyze \
  -H "Content-Type: application/json" \
  -d '{"objective":"Zscale ZPA"}'
```

Expected response: Returns a workflow (defaults to "full-stack-saas-mvp")

---

## Browser Console Debugging

Open DevTools Console (F12) while testing to see:
- Fetch requests and responses
- Console errors or warnings
- Network activity

Look for:
- `POST /api/execute-skill` - Should succeed (status 200)
- `POST /api/agency/analyze` - Should succeed (status 200)
- No JavaScript errors

---

## Checklist for Full Validation

### Skills Tab
- [ ] Dropdown loads skills
- [ ] Level/Persona dropdowns work
- [ ] Execute button shows output
- [ ] Files are created in filesystem
- [ ] "Success" status appears after execution
- [ ] No errors in console

### Agency Tab
- [ ] Can type objectives
- [ ] Matched objectives progress to Phase 2
- [ ] Unmatched objectives show error message
- [ ] No blank screens
- [ ] Can retry after error
- [ ] Decision points display correctly

### File System
- [ ] Files appear in `skill-output/` directory
- [ ] Directory structure matches expected layout
- [ ] Files contain valid JSON/JavaScript
- [ ] Multiple skills create separate directories

---

## If Something Goes Wrong

### Problem: Port already in use
```bash
lsof -i :5175
kill -9 <PID>
PORT=5176 node server.js
```

### Problem: Import errors
```bash
cd /Users/theprojectxco./Desktop/OS/Skills/packages/web
node server.js 2>&1 | head -20
```

### Problem: Files not appearing
```bash
# Check if directory exists
ls -la /Users/theprojectxco./Desktop/OS/Skills/skill-output/

# Check server logs for file creation errors
```

### Problem: Blank Agency tab
- Open browser console (F12)
- Look for JavaScript errors
- Check Network tab for failed API calls
- Verify server is running

---

## Support

All changes are documented in: `FIXES_APPLIED.md`

Key files modified:
- `packages/web/app.js` - Frontend logic
- `packages/web/server.js` - Backend API endpoint

Files created:
- `FIXES_APPLIED.md` - Full documentation of changes
- Real project files in `skill-output/` directory
