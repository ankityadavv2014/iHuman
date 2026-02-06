# iHuman API Endpoints

Complete reference for all iHuman REST and WebSocket API endpoints.

## Base URL

```
Production: https://api.ihuman.dev/v1
Development: http://localhost:5173/api
```

## Authentication

All endpoints (except `/health`) require Bearer token in Authorization header:

```bash
Authorization: Bearer <JWT_TOKEN>
```

See [AUTHENTICATION.md](./AUTHENTICATION.md) for token generation.

## Core Endpoints

### Health Check

```http
GET /health
```

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-02-05T22:18:00Z"
}
```

---

## Agency Endpoints

### 1. Analyze Request

```http
POST /api/agency/analyze
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "input": "Generate React component for user dashboard",
  "context": {
    "framework": "React 18",
    "styling": "Tailwind CSS",
    "requirements": ["responsive", "accessible", "dark-mode"]
  },
  "expertiseLevel": "intermediate"
}
```

**Response:** `200 OK`
```json
{
  "id": "analyze_12345",
  "status": "completed",
  "analysis": {
    "type": "component-generation",
    "complexity": "medium",
    "estimatedTime": 120,
    "suggestions": [
      "Use React hooks for state management",
      "Implement keyboard navigation",
      "Add loading skeletons"
    ],
    "riskFactors": []
  },
  "timestamp": "2024-02-05T22:18:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input format
- `401 Unauthorized`: Missing or invalid token
- `429 Too Many Requests`: Rate limit exceeded

---

### 2. Orchestrate Execution

```http
POST /api/agency/orchestrate
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "skills": [
    {
      "id": "skill_001",
      "name": "generate-component",
      "params": {
        "framework": "React",
        "type": "form",
        "fields": ["email", "password"]
      }
    },
    {
      "id": "skill_002",
      "name": "add-validation",
      "params": {
        "rules": ["email-format", "password-strength"]
      }
    }
  ],
  "workflowId": "wf_dashboard_001",
  "priority": "high"
}
```

**Response:** `202 Accepted`
```json
{
  "executionId": "exec_98765",
  "status": "queued",
  "workflowId": "wf_dashboard_001",
  "skills": 2,
  "estimatedDuration": 300,
  "progressUrl": "/api/agency/executions/exec_98765",
  "webhookUrl": "https://example.com/webhooks/execution"
}
```

---

### 3. Get Execution Status

```http
GET /api/agency/executions/:executionId
Authorization: Bearer <JWT_TOKEN>
```

**Response:** `200 OK`
```json
{
  "id": "exec_98765",
  "status": "in-progress",
  "progress": 45,
  "currentSkill": {
    "id": "skill_001",
    "name": "generate-component",
    "status": "executing",
    "startedAt": "2024-02-05T22:18:15Z"
  },
  "skills": [
    {
      "id": "skill_001",
      "name": "generate-component",
      "status": "completed",
      "result": { "code": "...", "language": "jsx" }
    }
  ],
  "estimatedCompletion": "2024-02-05T22:23:15Z"
}
```

---

### 4. Rollback Execution

```http
POST /api/agency/rollback
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "executionId": "exec_98765",
  "stepCount": 1,
  "reason": "incorrect-output"
}
```

**Response:** `200 OK`
```json
{
  "executionId": "exec_98765",
  "status": "rolled-back",
  "rolledBackTo": "skill_001",
  "timestamp": "2024-02-05T22:20:00Z"
}
```

---

## Skills Endpoints

### 5. List Available Skills

```http
GET /api/skills?category=frontend&difficulty=intermediate&limit=50
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `category`: `frontend | backend | devops | ai-ml | data | infrastructure`
- `difficulty`: `beginner | intermediate | expert`
- `limit`: 1-100 (default: 20)
- `offset`: Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "total": 150,
  "limit": 50,
  "offset": 0,
  "skills": [
    {
      "id": "skill_001",
      "name": "react-component-generator",
      "category": "frontend",
      "difficulty": "intermediate",
      "rating": 4.8,
      "executions": 1250,
      "description": "Generate React components with TypeScript...",
      "tags": ["react", "component", "typescript"],
      "estimatedTime": 120
    }
  ]
}
```

---

### 6. Get Skill Details

```http
GET /api/skills/:skillId
Authorization: Bearer <JWT_TOKEN>
```

**Response:** `200 OK`
```json
{
  "id": "skill_001",
  "name": "react-component-generator",
  "category": "frontend",
  "difficulty": "intermediate",
  "description": "Generate React components...",
  "documentation": "https://docs.ihuman.dev/skills/react-component-generator",
  "author": "iHuman Team",
  "version": "2.1.0",
  "parameters": [
    {
      "name": "framework",
      "type": "string",
      "required": true,
      "default": "react",
      "description": "Target framework"
    }
  ],
  "examples": [
    {
      "input": { "framework": "React 18" },
      "output": { "code": "...", "dependencies": [] }
    }
  ],
  "relatedSkills": ["skill_002", "skill_003"]
}
```

---

### 7. Execute Skill

```http
POST /api/skills/:skillId/execute
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "params": {
    "framework": "React 18",
    "componentType": "form"
  },
  "notifyUrl": "https://example.com/webhooks/execution",
  "timeout": 300
}
```

**Response:** `202 Accepted`
```json
{
  "executionId": "exec_12345",
  "skillId": "skill_001",
  "status": "queued",
  "estimatedTime": 120
}
```

---

## Execution History Endpoints

### 8. List Execution History

```http
GET /api/executions?status=completed&limit=20
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `status`: `queued | in-progress | completed | failed | rolled-back`
- `skillId`: Filter by specific skill
- `limit`: 1-100 (default: 20)
- `startDate`: ISO 8601 timestamp
- `endDate`: ISO 8601 timestamp

**Response:** `200 OK`
```json
{
  "total": 42,
  "limit": 20,
  "executions": [
    {
      "id": "exec_12345",
      "skillId": "skill_001",
      "skillName": "react-component-generator",
      "status": "completed",
      "result": { "code": "...", "language": "jsx" },
      "duration": 125,
      "expertise": "intermediate",
      "persona": "developer",
      "timestamp": "2024-02-05T22:18:00Z"
    }
  ]
}
```

---

### 9. Get Execution Details

```http
GET /api/executions/:executionId
Authorization: Bearer <JWT_TOKEN>
```

**Response:** `200 OK`
```json
{
  "id": "exec_12345",
  "skillId": "skill_001",
  "skillName": "react-component-generator",
  "status": "completed",
  "input": { "framework": "React 18" },
  "result": {
    "code": "const Dashboard = () => { ... }",
    "language": "jsx",
    "syntax": "valid"
  },
  "metadata": {
    "expertise": "intermediate",
    "persona": "full-stack-developer",
    "duration": 125,
    "tokens": { "input": 245, "output": 892 }
  },
  "startedAt": "2024-02-05T22:17:55Z",
  "completedAt": "2024-02-05T22:18:00Z"
}
```

---

## Analytics Endpoints

### 10. Get User Analytics

```http
GET /api/analytics/user?period=30d
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `period`: `1d | 7d | 30d | 90d | 1y | all`

**Response:** `200 OK`
```json
{
  "period": "30d",
  "stats": {
    "totalExecutions": 145,
    "successRate": 0.94,
    "averageDuration": 87,
    "totalDuration": 12615,
    "mostUsedSkill": "react-component-generator",
    "topCategories": {
      "frontend": 65,
      "backend": 35,
      "devops": 20
    }
  },
  "timeline": [
    {
      "date": "2024-02-05",
      "executions": 12,
      "successes": 11,
      "failures": 1
    }
  ]
}
```

---

## Workflow Endpoints

### 11. List Workflows

```http
GET /api/workflows?type=template&limit=20
Authorization: Bearer <JWT_TOKEN>
```

**Response:** `200 OK`
```json
{
  "total": 28,
  "workflows": [
    {
      "id": "wf_001",
      "name": "Full Stack Dashboard Builder",
      "type": "template",
      "description": "Build complete dashboard with backend...",
      "skills": 5,
      "estimatedTime": 600,
      "rating": 4.9,
      "usageCount": 234
    }
  ]
}
```

---

### 12. Get Workflow Details

```http
GET /api/workflows/:workflowId
Authorization: Bearer <JWT_TOKEN>
```

**Response:** `200 OK`
```json
{
  "id": "wf_001",
  "name": "Full Stack Dashboard Builder",
  "description": "...",
  "skills": [
    {
      "id": "skill_001",
      "order": 1,
      "params": { "framework": "React" },
      "dependsOn": []
    },
    {
      "id": "skill_002",
      "order": 2,
      "params": { "database": "PostgreSQL" },
      "dependsOn": ["skill_001"]
    }
  ]
}
```

---

## Rate Limiting

- **Free Tier**: 100 requests/hour
- **Pro Tier**: 1,000 requests/hour
- **Enterprise**: Custom limits

**Rate Limit Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 945
X-RateLimit-Reset: 1707156480
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | Maintenance/overload |

**Error Response:**
```json
{
  "error": "invalid_skill_id",
  "message": "Skill not found",
  "code": 404,
  "requestId": "req_12345"
}
```

---

## WebSocket API

**Connect:** `wss://api.ihuman.dev/v1/stream?token=<JWT_TOKEN>`

**Subscribe to Execution Updates:**
```json
{
  "type": "subscribe",
  "channel": "execution:exec_98765"
}
```

**Message Format:**
```json
{
  "type": "execution:progress",
  "executionId": "exec_98765",
  "progress": 45,
  "message": "Executing step 2 of 5...",
  "timestamp": "2024-02-05T22:18:15Z"
}
```

---

## Pagination

All list endpoints support cursor-based pagination:

```http
GET /api/skills?limit=20&offset=0
```

**Response:**
```json
{
  "total": 500,
  "limit": 20,
  "offset": 0,
  "hasMore": true,
  "nextUrl": "/api/skills?limit=20&offset=20",
  "items": [...]
}
```

---

See [EXAMPLES.md](./EXAMPLES.md) for code examples in JavaScript, Python, cURL, and more.
