# iHuman API Reference

**Base URL**: https://api.ihuman.dev/api

## Authentication

Use JWT Bearer token:
```
Authorization: Bearer YOUR_TOKEN
```

## Endpoints

### GET /api/skills
List all available skills (626+)

**Response:**
```json
{
  "skills": [...],
  "total": 626
}
```

### POST /api/executions
Create and execute a skill

**Request:**
```json
{
  "skillId": "react-setup",
  "parameters": { ... }
}
```

**Response:**
```json
{
  "executionId": "exec-abc123",
  "status": "queued",
  "createdAt": "2026-02-05T10:30:00Z"
}
```

### GET /api/executions/{id}
Get execution status and results

**Response:**
```json
{
  "executionId": "exec-abc123",
  "status": "completed",
  "duration": 45,
  "output": { ... }
}
```

## WebSocket

Real-time execution updates:
```
wss://api.ihuman.dev/ws
```

## Error Codes

- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

## Rate Limiting

- Free: 100 requests/hour
- Pro: 10,000 requests/hour

