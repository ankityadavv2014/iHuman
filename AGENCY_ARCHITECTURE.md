# 🎭 iHuman Agency Architecture

## The Missing Link: From Skill Execution to Intelligent Workflow Orchestration

### Core Problem We're Solving

**Current State**: User executes React setup → gets a React project
**Missing**: What happens next? Why did we set up React? What's the actual objective?

**New State**: User says "I want to build a SaaS app" → system orchestrates 12 skills automatically

---

## 🏗️ Architecture Overview

```
User Objective ("I want to build a SaaS MVP")
        ↓
Objective Analyzer
        ↓
Workflow Graph Generator
        ↓
Agency Orchestrator (Multi-Agent Coordinator)
        ├─ Agent 1: Frontend Setup
        ├─ Agent 2: Backend Setup
        ├─ Agent 3: Database Config
        ├─ Agent 4: Auth Setup
        ├─ Agent 5: CI/CD Pipeline
        └─ Agent 6: Deployment Config
        ↓
Context Passing System (output → input chaining)
        ↓
Decision Points & Branching Logic
        ↓
Execution Result + Rollback Points
```

---

## 🎯 Key Concepts

### 1. **Objective Context**

The system must understand **what the user is trying to build**, not just individual tasks.

```javascript
// Current: Individual skill execution
{
  skillId: "react-setup",
  params: { projectName: "my-app" },
  mode: "execute"
}

// New: Objective-driven workflow
{
  objective: "Build a SaaS MVP",
  context: {
    businessType: "SaaS",
    targetUsers: "Enterprise",
    timeline: "8 weeks",
    team: 3,
    technologies: ["React", "Node.js", "PostgreSQL"]
  },
  phases: [
    { phase: "Foundation", skills: ["react-setup", "backend-setup", "db-config"] },
    { phase: "Features", skills: ["auth-setup", "api-design", "testing-setup"] },
    { phase: "Operations", skills: ["ci-cd-setup", "monitoring-setup", "deploy-setup"] }
  ]
}
```

### 2. **Agency Orchestrator**

Like agency-agents, but for **skills instead of AI personalities**.

```javascript
class AgencyOrchestrator {
  constructor() {
    this.agents = {}; // Skill agents (specialized executors)
    this.contextBus = {}; // Shared context between agents
    this.executionLog = []; // Audit trail
    this.decisionPoints = []; // User decisions
    this.rollbackPoints = []; // Atomic undo points
  }

  async orchestrate(objective) {
    // 1. Parse objective into skill sequence
    const workflow = await this.parseObjective(objective);
    
    // 2. Build dependency graph
    const graph = this.buildDependencyGraph(workflow);
    
    // 3. Execute in correct order, passing context
    const result = await this.executeWorkflow(graph);
    
    // 4. Handle decision points
    while (this.decisionPoints.length > 0) {
      const decision = await this.getUserDecision();
      await this.replanWorkflow(decision);
    }
    
    return result;
  }
}
```

### 3. **Context Passing Between Skills**

Output from one skill becomes input to the next.

```
Step 1: react-setup
Output: {
  projectPath: "~/projects/my-saas-app",
  nodeVersion: "18.0.0",
  reactVersion: "18.2.0"
}
    ↓
Step 2: backend-setup (uses projectPath from Step 1)
Input: { parentPath: "~/projects", template: "express-typescript" }
Output: {
  backendPath: "~/projects/my-saas-app-api",
  apiPort: 3001
}
    ↓
Step 3: db-config (uses backendPath from Step 2)
Input: { projectPath: "~/projects/my-saas-app-api", database: "postgresql" }
Output: {
  dbConnectionString: "postgresql://localhost:5432/my-saas-app"
}
    ↓
Step 4: auth-setup (uses projectPath and dbConnectionString)
Input: {
  frontendPath: "~/projects/my-saas-app",
  backendPath: "~/projects/my-saas-app-api",
  database: "postgresql://localhost:5432/my-saas-app"
}
Output: {
  authProvider: "NextAuth.js",
  jwtSecret: "[generated]"
}
```

---

## 📋 Pre-Configured Agency Workflows

Like agency-agents' scenario templates, but for development:

### **Workflow 1: Full-Stack SaaS MVP (8 weeks)**

```json
{
  "name": "Full-Stack SaaS MVP",
  "phases": [
    {
      "phase": "Foundation (Week 1-2)",
      "skills": ["react-setup", "backend-setup", "db-config", "docker-compose-setup"],
      "parallelizable": true,
      "dependencies": {}
    },
    {
      "phase": "Authentication (Week 2-3)",
      "skills": ["auth-setup", "user-db-schema", "jwt-config", "session-management"],
      "dependencies": { "auth-setup": ["backend-setup"] }
    },
    {
      "phase": "Core Features (Week 3-5)",
      "skills": ["api-design", "data-models", "component-library", "state-management"],
      "dependencies": { "api-design": ["auth-setup", "db-config"] }
    },
    {
      "phase": "Quality (Week 5-6)",
      "skills": ["testing-setup", "e2e-tests", "performance-optimization", "security-audit"],
      "dependencies": { "testing-setup": ["react-setup", "backend-setup"] }
    },
    {
      "phase": "Operations (Week 6-7)",
      "skills": ["ci-cd-setup", "monitoring-setup", "logging-config", "alerting-setup"],
      "dependencies": {}
    },
    {
      "phase": "Deployment (Week 8)",
      "skills": ["production-build", "docker-image-build", "deploy-to-cloud", "domain-config"],
      "dependencies": { "deploy-to-cloud": ["ci-cd-setup", "monitoring-setup"] }
    }
  ],
  "estimatedTime": "40-50 hours of work (5-6 weeks elapsed)",
  "successMetrics": [
    "App deployed to production",
    "Auth system working",
    "Database persisting data",
    "Tests passing (>80% coverage)",
    "CI/CD pipeline active"
  ]
}
```

### **Workflow 2: ML Data Pipeline (2 weeks)**

```json
{
  "name": "ML Data Pipeline",
  "phases": [
    {
      "phase": "Environment Setup",
      "skills": ["python-env-setup", "jupyter-setup", "dvc-config", "mlflow-setup"],
      "parallelizable": true
    },
    {
      "phase": "Data Infrastructure",
      "skills": ["data-loading-setup", "postgres-data-warehouse", "data-validation", "dbt-project"],
      "dependencies": { "data-validation": ["data-loading-setup"] }
    },
    {
      "phase": "ETL Pipeline",
      "skills": ["airflow-dag-setup", "data-transformation", "feature-engineering", "pipeline-orchestration"],
      "dependencies": { "airflow-dag-setup": ["postgres-data-warehouse"] }
    },
    {
      "phase": "Monitoring & Quality",
      "skills": ["data-quality-tests", "pipeline-monitoring", "alerting-config", "documentation-setup"],
      "dependencies": {}
    }
  ],
  "estimatedTime": "20-30 hours"
}
```

### **Workflow 3: DevOps Infrastructure (1 week)**

```json
{
  "name": "DevOps Infrastructure as Code",
  "phases": [
    {
      "phase": "Cloud Setup",
      "skills": ["aws-account-setup", "terraform-init", "vpc-setup", "security-groups"],
      "parallelizable": true
    },
    {
      "phase": "Containerization",
      "skills": ["docker-setup", "docker-compose-prod", "container-registry-setup", "image-optimization"],
      "dependencies": {}
    },
    {
      "phase": "Orchestration",
      "skills": ["kubernetes-cluster", "helm-charts", "service-mesh-config", "ingress-setup"],
      "dependencies": { "kubernetes-cluster": ["vpc-setup"] }
    },
    {
      "phase": "Monitoring & Security",
      "skills": ["prometheus-setup", "grafana-setup", "vault-secrets-management", "rbac-setup"],
      "dependencies": {}
    }
  ],
  "estimatedTime": "30-40 hours"
}
```

---

## 🔄 Execution Flow

### **Step 1: Objective Analysis**

```javascript
class ObjectiveAnalyzer {
  async analyze(objective) {
    return {
      intent: "build-saas",
      scope: "full-stack",
      complexity: "intermediate",
      timeline: "8-weeks",
      teamSize: 3,
      
      // Recommended workflow
      workflow: "full-stack-saas-mvp",
      
      // Required skills
      requiredSkills: [
        "react-setup",
        "backend-setup",
        "db-config",
        // ... etc
      ],
      
      // Decision points where user input needed
      decisionPoints: [
        { phase: "Foundation", question: "PostgreSQL or MongoDB?" },
        { phase: "Auth", question: "NextAuth.js or Auth0?" },
        { phase: "Deployment", question: "AWS, Vercel, or DigitalOcean?" }
      ]
    };
  }
}
```

### **Step 2: Dependency Graph Building**

```javascript
class DependencyGraphBuilder {
  build(workflow) {
    const graph = new DAG(); // Directed Acyclic Graph
    
    for (const phase of workflow.phases) {
      for (const skill of phase.skills) {
        const deps = this.extractDependencies(skill, workflow);
        graph.addNode(skill, { deps });
      }
    }
    
    return graph.topologicalSort(); // Returns execution order
  }
}
```

### **Step 3: Orchestrated Execution**

```javascript
class OrchestrationEngine {
  async execute(graph, contextBus) {
    const results = {};
    
    for (const skill of graph.executionOrder) {
      console.log(`🎬 Executing: ${skill}`);
      
      // 1. Get inputs from context bus
      const inputs = this.extractInputs(skill, contextBus);
      
      // 2. Check for decision points
      if (contextBus.decisionPoints[skill]) {
        const decision = await this.getUserDecision(skill);
        inputs.userDecision = decision;
      }
      
      // 3. Execute skill
      const result = await this.executeSkill(skill, inputs);
      
      // 4. Store outputs in context bus
      contextBus[skill] = result.outputs;
      results[skill] = result;
      
      // 5. Save rollback point
      this.saveRollbackPoint(skill, result);
      
      console.log(`✅ ${skill} complete`);
      console.log(`   Output keys: ${Object.keys(result.outputs).join(", ")}`);
    }
    
    return results;
  }
}
```

---

## 🎭 Agent Specialization Within iHuman

Like agency-agents but for **skill domains**:

### **Infrastructure Agent**
- **Skills**: docker-setup, kubernetes-setup, terraform-config, networking
- **Expertise**: Building reliable, scalable infrastructure
- **Success Metric**: System runs stably at 99.9% uptime

### **Frontend Agent**
- **Skills**: react-setup, component-library, styling-setup, a11y-audit
- **Expertise**: Building responsive, accessible UIs
- **Success Metric**: Lighthouse score >90

### **Backend Agent**
- **Skills**: api-design, database-config, auth-setup, caching-config
- **Expertise**: Building scalable, secure APIs
- **Success Metric**: API responds <100ms at 1000 req/s

### **Data Agent**
- **Skills**: data-pipeline-setup, warehouse-config, etl-orchestration, analytics-setup
- **Expertise**: Building reliable data systems
- **Success Metric**: Data pipeline runs daily with 99.99% accuracy

### **Security Agent**
- **Skills**: security-audit, secrets-management, compliance-setup, penetration-testing
- **Expertise**: Building secure systems
- **Success Metric**: Passes all security audits

---

## 📊 Context Bus Architecture

The "shared memory" between all executing agents:

```javascript
class ContextBus {
  constructor() {
    this.contexts = {
      // Project-level context
      project: {
        name: "my-saas-app",
        path: "~/projects/my-saas-app",
        type: "full-stack",
        startTime: Date.now()
      },
      
      // Skills context (output from each skill)
      skills: {
        "react-setup": {
          nodeVersion: "18.0.0",
          packageManager: "npm",
          projectPath: "~/projects/my-saas-app"
        },
        "backend-setup": {
          framework: "Express",
          apiPort: 3001,
          projectPath: "~/projects/my-saas-app-api"
        },
        // ... etc
      },
      
      // User decisions
      decisions: {
        database: "postgresql",
        auth: "nextauth",
        deployment: "vercel"
      },
      
      // Rollback information
      rollbackPoints: {
        "react-setup": { backup: "/tmp/ihuman-backups/...", timestamp: 123456 },
        "backend-setup": { backup: "/tmp/ihuman-backups/...", timestamp: 123457 }
      },
      
      // Execution log
      log: [
        { skill: "react-setup", status: "success", duration: 45 },
        { skill: "backend-setup", status: "success", duration: 52 }
      ]
    };
  }
  
  get(key) { return this.contexts[key]; }
  set(key, value) { this.contexts[key] = value; }
  
  // Extract what inputs a skill needs from context
  extractInputs(skillId, requiredInputs) {
    const inputs = {};
    for (const input of requiredInputs) {
      inputs[input] = this.contexts.skills[input];
    }
    return inputs;
  }
}
```

---

## 🎯 Decision Points & Branching

Where the system asks users **what they want**, then branches accordingly:

```javascript
class DecisionEngine {
  async processDecisionPoints(workflow, contextBus) {
    const decisions = [];
    
    for (const phase of workflow.phases) {
      if (phase.decisionPoints) {
        for (const decision of phase.decisionPoints) {
          const userChoice = await this.presentDecision(decision);
          decisions.push({ decision, choice: userChoice });
          
          // Replan based on choice
          workflow = this.replan(workflow, decision, userChoice);
        }
      }
    }
    
    return { decisions, replanedWorkflow: workflow };
  }
  
  replan(workflow, decision, choice) {
    // If user chose "PostgreSQL", skip MongoDB skills
    // If user chose "Vercel", skip AWS skills
    // Etc.
    return modifiedWorkflow;
  }
}
```

---

## 🔄 Rollback & Recovery

Full undo capability at each decision point:

```javascript
class RollbackManager {
  async rollback(toSkill, contextBus) {
    // Get rollback point for that skill
    const rollbackPoint = contextBus.get(`rollbackPoints.${toSkill}`);
    
    // Restore from backup
    await this.restoreBackup(rollbackPoint.backup);
    
    // Clear all subsequent skills from context
    const executedSkills = contextBus.get("log").map(l => l.skill);
    const skillIndex = executedSkills.indexOf(toSkill);
    for (let i = skillIndex + 1; i < executedSkills.length; i++) {
      contextBus.delete(`skills.${executedSkills[i]}`);
    }
    
    console.log(`✅ Rolled back to: ${toSkill}`);
  }
}
```

---

## 🚀 UI Changes Required

### **Dashboard Phase 1: Objective Selection**

```
┌─────────────────────────────────────────┐
│          🎯 iHuman Agencies             │
├─────────────────────────────────────────┤
│                                         │
│  What are you building?                 │
│                                         │
│  ◯ Full-Stack SaaS MVP                  │
│  ◯ ML Data Pipeline                     │
│  ◯ DevOps Infrastructure                │
│  ◯ Mobile App                           │
│  ◯ Custom Workflow                      │
│  ◯ Individual Skills (classic mode)     │
│                                         │
│           [Continue →]                  │
└─────────────────────────────────────────┘
```

### **Dashboard Phase 2: Workflow Configuration**

```
┌─────────────────────────────────────────┐
│  Full-Stack SaaS MVP Configuration      │
├─────────────────────────────────────────┤
│                                         │
│  📋 Workflow Phases                     │
│  ├─ Foundation (6 skills)               │
│  ├─ Authentication (4 skills)           │
│  ├─ Core Features (4 skills)            │
│  ├─ Quality Assurance (4 skills)        │
│  ├─ Operations (4 skills)               │
│  └─ Deployment (4 skills)               │
│                                         │
│  🎯 Decision Points                     │
│  ├─ [?] Database: PostgreSQL / MongoDB  │
│  ├─ [?] Auth Provider: NextAuth / Auth0 │
│  └─ [?] Deployment: Vercel / AWS        │
│                                         │
│  [Start Orchestration →]                │
└─────────────────────────────────────────┘
```

### **Dashboard Phase 3: Orchestration Progress**

```
┌─────────────────────────────────────────┐
│  🎭 Orchestration in Progress           │
├─────────────────────────────────────────┤
│                                         │
│  📋 Foundation (2/6 complete)           │
│  ├─ ✅ react-setup (45s)                │
│  ├─ ✅ backend-setup (52s)              │
│  ├─ ⏳ db-config (running...)           │
│  ├─ ⏳ docker-compose-setup (waiting)   │
│  ├─ ⧖ auth-setup (on hold)              │
│  └─ ⧖ api-design (on hold)              │
│                                         │
│  Context Bus State:                     │
│  • projectPath: ~/projects/my-saas-app  │
│  • apiPort: 3001                        │
│  • nodeVersion: 18.0.0                  │
│                                         │
│  [⏸ Pause] [📊 View Logs] [↩ Rollback] │
└─────────────────────────────────────────┘
```

---

## 📈 Benefits

### **For Users**
- ✅ One command builds entire system (not 12 separate skills)
- ✅ Smart decision points reduce cognitive load
- ✅ Context-aware recommendations
- ✅ Full rollback at any step
- ✅ Estimated time savings visible upfront

### **For Creators**
- ✅ Skills compose into bigger workflows automatically
- ✅ New skill = automatically works in orchestrations
- ✅ Dependency system manages complexity
- ✅ Reusable patterns across workflows

### **For Teams**
- ✅ Standardized workflow = team consistency
- ✅ Reproducible infrastructure
- ✅ Knowledge codified as orchestrations
- ✅ Audit trail of all decisions

---

## 🔌 Implementation Roadmap

### **Phase 1: Foundation** (Week 1-2)
- [ ] ObjectiveAnalyzer class
- [ ] DependencyGraphBuilder class
- [ ] ContextBus implementation
- [ ] Basic AgencyOrchestrator

### **Phase 2: Execution** (Week 2-3)
- [ ] OrchestrationEngine
- [ ] Skill context extraction
- [ ] Context passing between skills
- [ ] RollbackManager

### **Phase 3: UI** (Week 3-4)
- [ ] Objective selector component
- [ ] Workflow configuration UI
- [ ] Progress visualization
- [ ] Decision point prompts

### **Phase 4: Workflows** (Week 4-5)
- [ ] Full-Stack SaaS MVP template
- [ ] ML Data Pipeline template
- [ ] DevOps Infrastructure template

### **Phase 5: Polish** (Week 5)
- [ ] Error recovery in orchestrations
- [ ] Performance optimization
- [ ] Documentation & examples

---

## 🎭 The Agency Philosophy

Like agency-agents, but applied to **skill orchestration**:

> "Skills don't exist in isolation. They're part of larger objectives. The system should understand **what the user is trying to build**, not just execute individual tasks."

Each workflow is a "team" of skills working together:
- **Frontend Skill**: "I'll set up React"
- **Backend Skill**: "I'll build the API for that React app"
- **Database Skill**: "I'll configure the database this API needs"
- **Auth Skill**: "I'll secure both with auth"

When orchestrated together, they form an **agency** that transforms a user's objective into a complete system.

---

## 🚀 Example: User Journey

### **Before (Current)**
```
User: "I want to build a SaaS"
iHuman: "Here are 50 skills. Pick one."
User: "Uh, React setup?"
[Executes React setup]
User: "Now what?"
iHuman: [silence]
```

### **After (With Agency)**
```
User: "I want to build a SaaS MVP in 8 weeks"
iHuman: 🎭 Agency Orchestrator
  ├─ "Perfect! I recommend: Full-Stack SaaS MVP workflow"
  ├─ "This includes 26 skills across 6 phases"
  ├─ "I'll ask you 3 key decisions along the way"
  └─ "Estimated 40-50 hours of work"

User: "Let's go"
iHuman: 🎯 Analyzing...
  ├─ "First decision: Database?"
  ├─ "PostgreSQL (recommended for SaaS) or MongoDB?"
  
User: "PostgreSQL"
iHuman: ✅ Updated workflow, starting Phase 1...
  ├─ ✅ React setup (45s)
  ├─ ✅ Backend setup (52s)
  ├─ ✅ DB config using PostgreSQL (30s)
  ├─ ⏳ Docker compose (running...)
  
[After all 26 skills complete]
iHuman: 🎉 Your SaaS is ready!
  ├─ Frontend at http://localhost:3000
  ├─ API at http://localhost:3001
  ├─ Database running with sample schema
  ├─ Auth system configured
  ├─ CI/CD pipeline ready
  ├─ Deployed to Vercel
  └─ "Next: Build your first feature!"
```

---

## 🔗 Key Files to Create

1. **lib/AgencyOrchestrator.js** - Main orchestration engine
2. **lib/ObjectiveAnalyzer.js** - Parse user intent
3. **lib/ContextBus.js** - Shared state management
4. **lib/DependencyGraphBuilder.js** - Build execution order
5. **lib/DecisionEngine.js** - Handle user choices
6. **lib/RollbackManager.js** - Undo capability
7. **data/workflows.json** - Pre-configured workflows
8. **packages/web/pages/Agency.jsx** - New UI component

---

## 💡 Why This Transforms iHuman

**From a skill executor** → **To an AI agency orchestrator**

This is the jump from:
- "Execute random skills" 
- To "Execute coordinated skill sequences that form complete systems"

The difference is **context**, **goals**, and **composition**.

This turns iHuman into a **true AI agency** - multiple specialized agents (skills) working together to achieve user objectives.

