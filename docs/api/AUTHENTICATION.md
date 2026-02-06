# iHuman Authentication & Authorization

Complete guide to authentication, token management, and role-based access control.

## Overview

iHuman uses **JWT (JSON Web Tokens)** for API authentication with optional API keys for service-to-service communication and OAuth 2.0 for third-party integrations.

## Authentication Methods

### 1. JWT Bearer Tokens (Recommended)

**Usage:** User-initiated API requests from frontend, CLI, or SDKs.

**How to Get:**

```bash
curl -X POST https://api.ihuman.dev/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure-password-123"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

**Token Payload (Decoded):**
```json
{
  "sub": "user_12345",
  "email": "user@example.com",
  "role": "developer",
  "permissions": ["skills:execute", "executions:read", "workflows:read"],
  "iat": 1707156000,
  "exp": 1707159600
}
```

**Using the Token:**
```bash
curl https://api.ihuman.dev/v1/skills \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 2. API Keys

**Usage:** Service-to-service communication, long-lived integrations, webhooks.

**Generate API Key:**

```bash
curl -X POST https://api.ihuman.dev/v1/api-keys \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Integration",
    "scopes": ["skills:execute", "executions:read"],
    "rateLimit": 1000,
    "expiresIn": 7776000
  }'
```

**Response:**
```json
{
  "id": "key_abc123xyz",
  "key": "sk_live_1234567890abcdefghij",
  "name": "Production Integration",
  "created": "2024-02-05T22:18:00Z",
  "lastUsed": null,
  "expiresAt": "2024-04-04T22:18:00Z"
}
```

**Using API Key:**
```bash
curl https://api.ihuman.dev/v1/skills \
  -H "Authorization: ApiKey sk_live_1234567890abcdefghij"
```

**Manage Keys:**
```bash
# List keys
curl https://api.ihuman.dev/v1/api-keys \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Revoke key
curl -X DELETE https://api.ihuman.dev/v1/api-keys/key_abc123xyz \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Rotate key
curl -X POST https://api.ihuman.dev/v1/api-keys/key_abc123xyz/rotate \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

### 3. OAuth 2.0

**Usage:** Third-party app integrations (GitHub, GitLab, Slack, etc.).

**Authorization Code Flow:**

1. **Redirect to iHuman:**
```
https://api.ihuman.dev/v1/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=https://your-app.com/callback&
  scope=skills:execute,executions:read&
  response_type=code
```

2. **User authorizes your app**

3. **Receive authorization code** at redirect_uri

4. **Exchange code for token:**
```bash
curl -X POST https://api.ihuman.dev/v1/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "code": "auth_code_xyz",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "grant_type": "authorization_code",
    "redirect_uri": "https://your-app.com/callback"
  }'
```

5. **Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Token Management

### Refresh Tokens

**Access tokens expire in 1 hour. Use refresh token to get a new one:**

```bash
curl -X POST https://api.ihuman.dev/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### Logout

```bash
curl -X POST https://api.ihuman.dev/v1/auth/logout \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## Role-Based Access Control (RBAC)

### Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| **admin** | Full system access | All endpoints, user management, billing |
| **developer** | Full API access | `*:*` (all permissions) |
| **executor** | Execute skills | `skills:execute`, `executions:read`, `executions:write` |
| **viewer** | Read-only access | `skills:read`, `executions:read`, `analytics:read` |
| **service** | Service accounts | Limited to assigned scopes |

### Permission Matrix

| Permission | Description | Endpoints |
|-----------|-------------|-----------|
| `skills:read` | List and view skills | GET /api/skills/* |
| `skills:execute` | Execute skills | POST /api/skills/:id/execute |
| `executions:read` | View execution history | GET /api/executions/* |
| `executions:write` | Manage executions | POST/DELETE /api/executions/* |
| `analytics:read` | Access analytics | GET /api/analytics/* |
| `workflows:read` | View workflows | GET /api/workflows/* |
| `workflows:write` | Create/edit workflows | POST/PUT/DELETE /api/workflows/* |
| `api-keys:manage` | Manage API keys | POST/DELETE /api/api-keys/* |
| `users:manage` | Manage users | All /api/users/* |
| `admin:full` | All permissions | Any endpoint |

### Check Permissions

```javascript
// In your code
const hasPermission = token.permissions.includes('skills:execute');
if (!hasPermission) {
  throw new Error('Insufficient permissions');
}
```

---

## Security Best Practices

### 1. Token Storage

**DO:**
- ✅ Store JWT in `httpOnly` cookie (most secure)
- ✅ Store JWT in browser memory during session (automatic cleanup on logout)
- ✅ Store in secure localStorage as fallback

**DON'T:**
- ❌ Never store tokens in plain localStorage on sensitive apps
- ❌ Never put tokens in URL parameters
- ❌ Never commit tokens to version control

### 2. Token Transmission

**Always use HTTPS:**
```bash
# Good
curl -H "Authorization: Bearer TOKEN" https://api.ihuman.dev/v1/skills

# BAD - Never do this
curl -H "Authorization: Bearer TOKEN" http://api.ihuman.dev/v1/skills
```

### 3. Refresh Token Rotation

```bash
# Each refresh generates a new refresh token
curl -X POST https://api.ihuman.dev/v1/auth/refresh \
  -d '{"refreshToken": "old_token"}' \
  
# Response includes new refresh token
# Old token is immediately invalidated
{
  "accessToken": "new_access",
  "refreshToken": "new_refresh"  # ← Rotate on each refresh
}
```

### 4. API Key Security

**Generate Per-Environment:**
```bash
# Development
sk_test_dev_1234567890

# Staging
sk_test_staging_1234567890

# Production
sk_live_1234567890
```

**Rotate Regularly:**
```bash
# Rotate every 90 days
curl -X POST https://api.ihuman.dev/v1/api-keys/key_abc/rotate \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Revoke Immediately:**
```bash
# If compromised
curl -X DELETE https://api.ihuman.dev/v1/api-keys/key_abc \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### 5. Environment Variables

**.env file:**
```bash
IHUMAN_API_KEY=sk_live_1234567890
IHUMAN_API_URL=https://api.ihuman.dev/v1
NODE_ENV=production
```

**Never commit `.env`:**
```bash
echo ".env" >> .gitignore
```

---

## Multi-Factor Authentication (MFA)

### Enable MFA

```bash
curl -X POST https://api.ihuman.dev/v1/auth/mfa/enable \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response:**
```json
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "backupCodes": [
    "1234-5678",
    "9012-3456",
    ...
  ]
}
```

### Verify MFA During Login

```bash
curl -X POST https://api.ihuman.dev/v1/auth/login/verify-mfa \
  -H "Content-Type: application/json" \
  -d '{
    "mfaToken": "temp_token_from_login",
    "code": "123456"  # From authenticator app
  }'
```

---

## Server-Side Implementation

### Validate JWT Token

**Node.js + Express:**
```javascript
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/skills', verifyToken, (req, res) => {
  // req.user contains decoded token
  res.json({ skills: [...] });
});
```

### Check Permissions

```javascript
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

app.post('/api/skills/:id/execute',
  verifyToken,
  requirePermission('skills:execute'),
  (req, res) => {
    // Execute skill
  }
);
```

---

## Client-Side Implementation

### JavaScript SDK

```javascript
import { IhumanClient } from '@ihuman/sdk';

const client = new IhumanClient({
  apiKey: process.env.REACT_APP_API_KEY,
  // OR use token from login
  token: localStorage.getItem('accessToken')
});

// Login
const { accessToken, refreshToken } = await client.auth.login(
  'user@example.com',
  'password'
);
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Execute skill
const result = await client.skills.execute('skill_001', {
  framework: 'React'
});
```

### Python SDK

```python
from ihuman import IhumanClient, IhumanAuth

auth = IhumanAuth(
    email="user@example.com",
    password="password"
)

client = IhumanClient(auth=auth)

# Execute skill
result = client.skills.execute('skill_001', {
    'framework': 'React'
})
```

---

## Rate Limiting & Quotas

### Rate Limits

| Plan | Requests/Hour | Concurrent | Tokens/Month |
|------|---|---|---|
| Free | 100 | 5 | 100K |
| Pro | 1,000 | 50 | 10M |
| Enterprise | Unlimited | 500+ | Unlimited |

### Check Rate Limit Status

Every response includes:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 945
X-RateLimit-Reset: 1707156480
```

```javascript
// Handle rate limiting
if (response.status === 429) {
  const resetTime = parseInt(response.headers['x-ratelimit-reset']) * 1000;
  const waitTime = resetTime - Date.now();
  console.log(`Rate limited. Wait ${waitTime}ms`);
}
```

---

## Troubleshooting

### "Invalid Token" Error

```bash
# Verify token is valid
curl -X POST https://api.ihuman.dev/v1/auth/verify \
  -H "Authorization: Bearer <TOKEN>"

# Get new token if expired
curl -X POST https://api.ihuman.dev/v1/auth/refresh \
  -d '{"refreshToken": "<REFRESH_TOKEN>"}'
```

### "Insufficient Permissions" Error

```bash
# Check your permissions
curl https://api.ihuman.dev/v1/auth/me \
  -H "Authorization: Bearer <TOKEN>"

# Response shows your permissions and role
{
  "user": {
    "id": "user_12345",
    "role": "viewer",
    "permissions": ["skills:read", "executions:read"]
  }
}

# Contact admin to upgrade permissions
```

### "Rate Limit Exceeded" Error

```bash
# Wait for rate limit reset
# Or upgrade your plan
# Check X-RateLimit-Reset header for exact time
```

---

See [EXAMPLES.md](./EXAMPLES.md) for complete authentication code examples.
