# iHuman API Examples

Complete code examples for common tasks across multiple languages.

## Table of Contents
1. [Authentication](#authentication)
2. [Basic Usage](#basic-usage)
3. [Executing Skills](#executing-skills)
4. [Workflows](#workflows)
5. [Advanced Features](#advanced-features)
6. [Error Handling](#error-handling)

---

## Authentication

### JavaScript - Login & Token Management

```javascript
// Using JavaScript SDK
import { IhumanClient } from '@ihuman/sdk';

async function authenticateUser() {
  const client = new IhumanClient({
    apiUrl: 'https://api.ihuman.dev/v1'
  });
  
  // Login with email/password
  const auth = await client.auth.login({
    email: 'developer@example.com',
    password: 'secure-password-123'
  });
  
  // Save tokens
  localStorage.setItem('accessToken', auth.accessToken);
  localStorage.setItem('refreshToken', auth.refreshToken);
  
  return auth;
}

// Set token for subsequent requests
const token = localStorage.getItem('accessToken');
const client = new IhumanClient({
  apiUrl: 'https://api.ihuman.dev/v1',
  token: token
});

// Auto-refresh on expiry
client.auth.onTokenRefresh((newToken) => {
  localStorage.setItem('accessToken', newToken);
});
```

### Python - Login & Token Management

```python
import os
from ihuman import IhumanClient
from ihuman.auth import IhumanAuth

# Authenticate
auth = IhumanAuth(
    email=os.getenv('IHUMAN_EMAIL'),
    password=os.getenv('IHUMAN_PASSWORD')
)

client = IhumanClient(
    auth=auth,
    api_url='https://api.ihuman.dev/v1'
)

# Or use API key
api_key = os.getenv('IHUMAN_API_KEY')
client = IhumanClient(
    api_key=api_key,
    api_url='https://api.ihuman.dev/v1'
)
```

### cURL - Login

```bash
# Get access token
RESPONSE=$(curl -s -X POST https://api.ihuman.dev/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com",
    "password": "secure-password-123"
  }')

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.accessToken')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refreshToken')

# Use token in subsequent requests
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  https://api.ihuman.dev/v1/skills
```

---

## Basic Usage

### List Available Skills

**JavaScript:**
```javascript
async function listSkills() {
  const skills = await client.skills.list({
    category: 'frontend',
    difficulty: 'intermediate',
    limit: 20
  });
  
  console.log(`Found ${skills.total} skills:`);
  skills.items.forEach(skill => {
    console.log(`- ${skill.name} (${skill.difficulty})`);
  });
  
  return skills;
}
```

**Python:**
```python
def list_skills():
    skills = client.skills.list(
        category='frontend',
        difficulty='intermediate',
        limit=20
    )
    
    print(f"Found {skills['total']} skills:")
    for skill in skills['items']:
        print(f"- {skill['name']} ({skill['difficulty']})")
    
    return skills
```

**cURL:**
```bash
curl -s https://api.ihuman.dev/v1/skills?category=frontend&difficulty=intermediate \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### Get Skill Details

**JavaScript:**
```javascript
async function getSkillDetails(skillId) {
  const skill = await client.skills.get(skillId);
  
  console.log(`Skill: ${skill.name}`);
  console.log(`Category: ${skill.category}`);
  console.log(`Difficulty: ${skill.difficulty}`);
  console.log(`Description: ${skill.description}`);
  console.log(`Parameters:`);
  
  skill.parameters.forEach(param => {
    console.log(`  - ${param.name} (${param.type}): ${param.description}`);
  });
  
  return skill;
}
```

**Python:**
```python
def get_skill_details(skill_id):
    skill = client.skills.get(skill_id)
    
    print(f"Skill: {skill['name']}")
    print(f"Category: {skill['category']}")
    print(f"Difficulty: {skill['difficulty']}")
    print(f"Description: {skill['description']}")
    print("Parameters:")
    
    for param in skill['parameters']:
        print(f"  - {param['name']} ({param['type']}): {param['description']}")
    
    return skill
```

---

## Executing Skills

### Simple Skill Execution

**JavaScript:**
```javascript
async function executeSkill() {
  const result = await client.skills.execute('skill_001', {
    framework: 'React',
    componentType: 'form',
    fields: ['email', 'password']
  });
  
  console.log('Execution completed:');
  console.log('Status:', result.status);
  console.log('Duration:', result.duration, 'ms');
  console.log('Output:', result.result);
  
  return result;
}
```

**Python:**
```python
def execute_skill():
    result = client.skills.execute('skill_001', {
        'framework': 'React',
        'componentType': 'form',
        'fields': ['email', 'password']
    })
    
    print(f"Status: {result['status']}")
    print(f"Duration: {result['duration']}ms")
    print(f"Output: {result['result']}")
    
    return result
```

**cURL:**
```bash
curl -X POST https://api.ihuman.dev/v1/skills/skill_001/execute \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "framework": "React",
      "componentType": "form",
      "fields": ["email", "password"]
    },
    "timeout": 300
  }' | jq
```

### Async Skill Execution with Progress

**JavaScript:**
```javascript
async function executeWithProgress(skillId, params) {
  // Start execution (async)
  const execution = await client.skills.executeAsync(skillId, params);
  
  console.log(`Execution started: ${execution.executionId}`);
  console.log(`Estimated time: ${execution.estimatedTime}s`);
  
  // Poll for progress
  let completed = false;
  while (!completed) {
    const status = await client.executions.getStatus(execution.executionId);
    
    console.log(`Progress: ${status.progress}% - ${status.currentSkill.name}`);
    
    if (status.status === 'completed') {
      console.log('Execution completed!');
      console.log('Result:', status.result);
      completed = true;
    } else if (status.status === 'failed') {
      console.error('Execution failed:', status.error);
      completed = true;
    } else {
      // Wait 1 second before checking again
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  return status;
}

// Usage
await executeWithProgress('skill_001', {
  framework: 'React'
});
```

### WebSocket Real-time Progress

**JavaScript:**
```javascript
function executeWithWebSocket(skillId, params) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`wss://api.ihuman.dev/v1/stream?token=${accessToken}`);
    
    ws.onopen = async () => {
      // Start execution
      const execution = await client.skills.executeAsync(skillId, params);
      
      // Subscribe to progress
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: `execution:${execution.executionId}`
      }));
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'execution:progress') {
        console.log(`${message.progress}% - ${message.message}`);
      } else if (message.type === 'execution:completed') {
        console.log('Execution completed!');
        console.log('Result:', message.result);
        ws.close();
        resolve(message.result);
      } else if (message.type === 'execution:error') {
        console.error('Error:', message.error);
        ws.close();
        reject(message.error);
      }
    };
    
    ws.onerror = (error) => reject(error);
  });
}

// Usage
const result = await executeWithWebSocket('skill_001', {
  framework: 'React'
});
```

---

## Workflows

### Execute Workflow

**JavaScript:**
```javascript
async function executeWorkflow() {
  const workflow = await client.workflows.get('wf_001');
  
  console.log(`Executing workflow: ${workflow.name}`);
  console.log(`Skills in workflow: ${workflow.skills.length}`);
  
  const execution = await client.workflows.execute('wf_001', {
    // Pass parameters for skills in workflow
    params: {
      'skill_001': { framework: 'React' },
      'skill_002': { database: 'PostgreSQL' },
      'skill_003': { styleSystem: 'Tailwind CSS' }
    },
    notifyUrl: 'https://example.com/webhooks/execution'
  });
  
  console.log(`Workflow execution started: ${execution.workflowExecutionId}`);
  console.log(`Total skills: ${execution.totalSkills}`);
  console.log(`Estimated time: ${execution.estimatedTime}s`);
  
  return execution;
}
```

**Python:**
```python
def execute_workflow():
    workflow = client.workflows.get('wf_001')
    
    print(f"Executing workflow: {workflow['name']}")
    print(f"Skills in workflow: {len(workflow['skills'])}")
    
    execution = client.workflows.execute('wf_001', {
        'params': {
            'skill_001': {'framework': 'React'},
            'skill_002': {'database': 'PostgreSQL'},
            'skill_003': {'styleSystem': 'Tailwind CSS'}
        },
        'notifyUrl': 'https://example.com/webhooks/execution'
    })
    
    print(f"Workflow execution started: {execution['workflowExecutionId']}")
    print(f"Total skills: {execution['totalSkills']}")
    
    return execution
```

### Create Custom Workflow

**JavaScript:**
```javascript
async function createWorkflow() {
  const workflow = await client.workflows.create({
    name: 'Full Stack Dashboard Builder',
    description: 'Build a complete dashboard with frontend, backend, and database',
    skills: [
      {
        id: 'skill_001',
        name: 'generate-component',
        order: 1,
        params: { framework: 'React' },
        dependsOn: []
      },
      {
        id: 'skill_002',
        name: 'add-validation',
        order: 2,
        params: { rules: ['email-format'] },
        dependsOn: ['skill_001']
      },
      {
        id: 'skill_003',
        name: 'create-api',
        order: 3,
        params: { framework: 'Express' },
        dependsOn: []
      }
    ]
  });
  
  console.log(`Workflow created: ${workflow.id}`);
  return workflow;
}
```

---

## Advanced Features

### Analyze Before Execution

**JavaScript:**
```javascript
async function analyzeAndExecute(input) {
  // First analyze the request
  const analysis = await client.agency.analyze({
    input: input,
    context: {
      framework: 'React 18',
      styling: 'Tailwind CSS',
      requirements: ['responsive', 'accessible', 'dark-mode']
    }
  });
  
  console.log(`Analysis: ${analysis.analysis.type}`);
  console.log(`Complexity: ${analysis.analysis.complexity}`);
  console.log(`Estimated time: ${analysis.analysis.estimatedTime}s`);
  console.log(`Suggestions:`, analysis.analysis.suggestions);
  
  // If analysis looks good, execute
  if (analysis.analysis.riskFactors.length === 0) {
    const result = await client.agency.orchestrate({
      skills: [
        {
          id: 'skill_001',
          name: 'generate-component',
          params: { framework: 'React' }
        }
      ]
    });
    
    return result;
  } else {
    console.warn('Potential risks detected:', analysis.analysis.riskFactors);
  }
}

await analyzeAndExecute('Generate React component for user dashboard');
```

### Handle Execution Rollback

**JavaScript:**
```javascript
async function executeWithRollback(skillId, params) {
  try {
    // Execute skill
    const result = await client.skills.execute(skillId, params);
    
    if (result.status !== 'completed') {
      throw new Error('Execution failed');
    }
    
    // Save execution ID in case we need to rollback
    const executionId = result.id;
    
    // Validate output
    if (!isValidOutput(result.result)) {
      console.log('Invalid output, rolling back...');
      
      // Rollback to previous state
      const rollback = await client.agency.rollback({
        executionId: executionId,
        stepCount: 1,
        reason: 'invalid-output'
      });
      
      console.log('Rolled back successfully');
      throw new Error('Output validation failed');
    }
    
    return result;
  } catch (error) {
    console.error('Execution error:', error);
    throw error;
  }
}

function isValidOutput(output) {
  // Validate the output
  return output && output.code && output.code.length > 0;
}
```

### Batch Executions

**JavaScript:**
```javascript
async function executeBatch(skills) {
  const executions = [];
  
  for (const skill of skills) {
    const execution = await client.skills.executeAsync(
      skill.id,
      skill.params
    );
    executions.push(execution);
  }
  
  // Wait for all to complete
  const results = await Promise.all(
    executions.map(exec => 
      new Promise((resolve) => {
        const interval = setInterval(async () => {
          const status = await client.executions.getStatus(exec.executionId);
          if (status.status !== 'in-progress') {
            clearInterval(interval);
            resolve(status);
          }
        }, 1000);
      })
    )
  );
  
  return results;
}

// Execute multiple skills in parallel
const results = await executeBatch([
  {
    id: 'skill_001',
    params: { framework: 'React' }
  },
  {
    id: 'skill_002',
    params: { database: 'PostgreSQL' }
  },
  {
    id: 'skill_003',
    params: { styleSystem: 'Tailwind' }
  }
]);
```

### Analytics & Reporting

**JavaScript:**
```javascript
async function getAnalytics() {
  const analytics = await client.analytics.getUserAnalytics({
    period: '30d'
  });
  
  console.log(`Period: ${analytics.period}`);
  console.log(`Total executions: ${analytics.stats.totalExecutions}`);
  console.log(`Success rate: ${(analytics.stats.successRate * 100).toFixed(1)}%`);
  console.log(`Average duration: ${analytics.stats.averageDuration}s`);
  
  console.log('Executions by category:');
  Object.entries(analytics.stats.topCategories).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });
  
  console.log('Daily breakdown:');
  analytics.timeline.forEach(day => {
    console.log(`  ${day.date}: ${day.executions} total, ${day.successes} successful`);
  });
  
  return analytics;
}
```

---

## Error Handling

### Comprehensive Error Handler

**JavaScript:**
```javascript
async function executeWithErrorHandling(skillId, params) {
  try {
    const result = await client.skills.execute(skillId, params);
    return result;
  } catch (error) {
    // Handle specific error types
    if (error.code === 401) {
      console.error('Unauthorized - token may be expired');
      // Try to refresh token
      try {
        const newToken = await client.auth.refreshToken();
        localStorage.setItem('accessToken', newToken);
        // Retry execution
        return client.skills.execute(skillId, params);
      } catch (refreshError) {
        console.error('Failed to refresh token, please login again');
        // Redirect to login
        window.location.href = '/login';
      }
    } else if (error.code === 403) {
      console.error('Forbidden - insufficient permissions');
      console.error('Required permission:', error.requiredPermission);
    } else if (error.code === 404) {
      console.error('Skill not found');
    } else if (error.code === 429) {
      console.error('Rate limited');
      const resetTime = error.resetTime;
      const waitTime = resetTime - Date.now();
      console.log(`Wait ${(waitTime / 1000).toFixed(1)}s before retrying`);
    } else if (error.code === 500) {
      console.error('Server error', error.message);
      // Notify user and retry
      setTimeout(() => {
        return executeWithErrorHandling(skillId, params);
      }, 5000);
    } else {
      console.error('Unexpected error:', error);
    }
    
    throw error;
  }
}
```

### Python Error Handling

```python
def execute_with_error_handling(skill_id, params):
    try:
        result = client.skills.execute(skill_id, params)
        return result
    except IhumanAuthError as e:
        print(f"Authentication error: {e}")
        # Refresh token
        client.auth.refresh_token()
        return client.skills.execute(skill_id, params)
    except IhumanPermissionError as e:
        print(f"Permission denied: {e}")
    except IhumanNotFoundError as e:
        print(f"Skill not found: {e}")
    except IhumanRateLimitError as e:
        print(f"Rate limited. Wait {e.retry_after}s")
    except IhumanServerError as e:
        print(f"Server error: {e}")
        # Retry after delay
        time.sleep(5)
        return execute_with_error_handling(skill_id, params)
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise
```

---

See [ENDPOINTS.md](./ENDPOINTS.md) for complete API reference and [AUTHENTICATION.md](./AUTHENTICATION.md) for auth details.
