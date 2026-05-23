# SecretOS

SecretOS is the secrets, credentials, tokens, encryption keys, rotation, and secure secret access layer for APPNEURAL.

## Overview

SecretOS helps APPNEURAL safely store, manage, rotate, audit, and protect sensitive credentials used by apps, APIs, workflows, AI agents, integrations, cloud services, payment gateways, databases, and tenants.

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start

# Development mode
npm run dev
```

The server runs on port **5400** by default. Set the `PORT` environment variable to change this.

## API Endpoints

### Health & Info
- `GET /health` - Health check
- `GET /docs` - API documentation
- `GET /permissions` - List permissions for current role

### Dashboard
- `GET /secretos/dashboard` - Complete dashboard with overview, risks, and pending requests
- `GET /secretos/overview` - Secret overview and statistics

### Secrets
- `GET /secretos/secrets` - List all secrets
- `POST /secretos/secrets` - Create a new secret
- `GET /secretos/secrets/:id` - Get secret details
- `PATCH /secretos/secrets/:id` - Update secret
- `DELETE /secretos/secrets/:id` - Delete secret
- `POST /secretos/secrets/:id/rotate` - Rotate secret
- `POST /secretos/secrets/:id/revoke` - Revoke secret
- `GET /secretos/secrets/:id/versions` - Get secret version history

### Access Management
- `POST /secretos/secrets/:id/access-request` - Request access to a secret
- `GET /secretos/access-requests` - List access requests
- `POST /secretos/access-requests/:id/approve` - Approve access request
- `POST /secretos/access-requests/:id/deny` - Deny access request

### Policies
- `GET /secretos/policies` - List rotation policies
- `POST /secretos/policies` - Create rotation policy

### API Keys
- `GET /secretos/api-keys` - List API keys
- `POST /secretos/api-keys` - Create API key
- `POST /secretos/api-keys/:id/revoke` - Revoke API key

### Credentials
- `GET /secretos/credentials` - List credentials
- `POST /secretos/credentials` - Create credential

### Security
- `GET /secretos/risks` - List secret risks
- `POST /secretos/leak-events` - Report a leak event
- `POST /secretos/secrets/scan` - Scan for leaked secrets

### Audit & Usage
- `GET /secretos/audit` - View audit logs
- `GET /secretos/usage` - View usage logs

### Namespaces
- `GET /secretos/namespaces` - List namespaces

## Authentication

SecretOS uses role-based access control. Set these headers in your requests:

- `x-role`: One of `owner`, `admin`, `secret_admin`, `secret_manager`, `security_analyst`, `auditor`, `viewer`
- `x-tenant-id`: Tenant identifier (defaults to `demo-tenant`)
- `x-user-id`: User identifier

## Example Usage

### Create a Secret

```bash
curl -X POST http://localhost:5400/secretos/secrets \
  -H "Content-Type: application/json" \
  -H "x-role: secret_manager" \
  -d '{
    "key": "DATABASE_PASSWORD",
    "name": "Production DB Password",
    "type": "database_credential",
    "environment": "production",
    "value": "super-secret-password-123",
    "tags": ["database", "production"]
  }'
```

### Rotate a Secret

```bash
curl -X POST http://localhost:5400/secretos/secrets/{id}/rotate \
  -H "Content-Type: application/json" \
  -H "x-role: secret_manager" \
  -d '{
    "value": "new-super-secret-password-456"
  }'
```

### Request Secret Access

```bash
curl -X POST http://localhost:5400/secretos/secrets/{id}/access-request \
  -H "Content-Type: application/json" \
  -H "x-role: viewer" \
  -d '{
    "requestedLevel": "reveal",
    "reason": "Need to debug database connection issue"
  }'
```

## Secret Types

- `api_key` - API keys for external services
- `oauth_token` - OAuth tokens for third-party integrations
- `jwt_secret` - Secrets for signing JWTs
- `database_credential` - Database usernames and passwords
- `cloud_credential` - Cloud provider access keys
- `payment_key` - Payment gateway secrets
- `webhook_secret` - Webhook verification secrets
- `certificate` - SSL/TLS certificates and private keys
- `encryption_key` - Data encryption keys
- `environment_variable` - Environment-specific secrets
- `generic` - Other credential types

## Environments

- `local` - Local development machine
- `development` - Development environment
- `staging` - Staging/QA environment
- `preview` - Preview deployments
- `production` - Production environment
- `sandbox` - Sandbox/isolated testing
- `enterprise-isolated` - Multi-tenant isolation

## Features

### Secret Vault
Securely store and manage secrets with masked values and access control.

### Secret Rotation
Automatic and manual rotation with version history and rollback capability.

### Access Control
Role-based access with approval workflows for sensitive operations.

### Audit Logging
Complete audit trail for all secret operations.

### Leak Detection
Scan for leaked secrets in code, logs, and documents.

### Risk Assessment
Identify and track security risks associated with secrets.

### API Key Management
Manage API keys with scopes, expiration, and usage tracking.

### Credential Management
Store and manage database, cloud, OAuth, and service account credentials.

## Architecture

SecretOS follows a modular architecture:

```
SecretOS
├── Core
│   ├── datastore.ts    - JSON file storage
│   ├── http.ts          - HTTP router
│   ├── id.ts            - ID generation
│   ├── utils.ts         - Utility functions
│   └── errors.ts        - Error handling
├── domain.ts            - Entity definitions
├── service.ts           - Business logic
├── seed-state.ts        - Demo data
├── docs.ts              - API documentation
└── main.ts              - Entry point
```

## Data Model

Core entities:
- **Secret** - Stored credentials
- **SecretVersion** - Historical secret values
- **RotationPolicy** - Rotation rules
- **AccessGrant** - Access permissions
- **AccessRequest** - Pending access requests
- **APIKey** - Programmatic access keys
- **Credential** - Various credentials
- **LeakEvent** - Detected secret leaks
- **SecretRisk** - Security risks
- **SecretAuditLog** - Audit trail

## Development

### Build
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Reset Database
```bash
npm run reset
```

## Configuration

Environment variables:
- `PORT` - Server port (default: 5400)
- `SECRETOS_DB_FILE` - Database file path (default: data/secretos.db.json)
- `DEFAULT_TENANT_ID` - Default tenant ID (default: demo-tenant)

## License

MIT
## Related OSs

- platformos
- securityos
