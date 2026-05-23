# PolicyOS

PolicyOS is the policy creation, management, approval, acknowledgment, enforcement, exception, review, versioning, and policy governance layer of the APPNEURAL ecosystem.

## Overview

PolicyOS helps APPNEURAL create, manage, publish, enforce, review, and audit business, security, HR, finance, legal, AI, data, and operational policies across all OS modules.

```
PolicyOS = rules + policies + approvals + acknowledgments + enforcement + exceptions + reviews
```

## Quick Start

```bash
# Navigate to PolicyOS directory
cd /Users/ajayprajapat/Desktop/APPNEURAL\ Engineerings/OSs/PolicyOS

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the server
npm start

# Or use dev mode (build + start)
npm run dev
```

PolicyOS will run on `http://localhost:5200`

## API Documentation

Visit `http://localhost:5200/docs` for interactive API documentation.

## Core Endpoints

### Health & Info
- `GET /health` - Service health check
- `GET /docs` - API documentation
- `GET /permissions` - List permissions for current role

### Policies
- `GET /policyos/policies` - List all policies
- `POST /policyos/policies` - Create new policy
- `GET /policyos/policies/:id` - Get policy by ID
- `PATCH /policyos/policies/:id` - Update policy
- `POST /policyos/policies/:id/publish` - Publish policy
- `POST /policyos/policies/:id/versions` - Add new version

### Rules
- `GET /policyos/rules` - List all rules
- `POST /policyos/rules` - Create new rule
- `GET /policyos/rules/:id` - Get rule by ID

### Access Evaluation
- `POST /policyos/evaluate` - Evaluate access decision
- `GET /policyos/decisions` - List access decisions
- `GET /policyos/enforcement-logs` - List enforcement logs

### Guardrails
- `GET /policyos/guardrails` - List guardrails
- `POST /policyos/guardrails` - Create guardrail
- `POST /policyos/guardrails/evaluate` - Evaluate guardrail

### Rate Limits
- `GET /policyos/rate-limits` - List rate limits
- `POST /policyos/rate-limits` - Create rate limit

### Approval Rules
- `GET /policyos/approval-rules` - List approval rules
- `POST /policyos/approval-rules` - Create approval rule

### Exceptions
- `GET /policyos/exceptions` - List exceptions
- `POST /policyos/exceptions` - Request exception
- `PATCH /policyos/exceptions/:id` - Update exception

### Violations
- `GET /policyos/violations` - List violations
- `POST /policyos/violations` - Report violation
- `PATCH /policyos/violations/:id` - Update violation

### Acknowledgments
- `GET /policyos/acknowledgments` - List acknowledgments
- `POST /policyos/acknowledgments/:id/acknowledge` - Acknowledge policy

### Reviews
- `GET /policyos/reviews` - List reviews
- `POST /policyos/reviews` - Create review
- `PATCH /policyos/reviews/:id` - Update review

### Audit & Events
- `GET /policyos/events` - List events
- `GET /policyos/audit` - List audit logs

## Authentication

PolicyOS uses role-based access control. Include these headers in your requests:

```
x-role: owner | admin | policy_admin | policy_manager | compliance_manager | auditor | viewer
x-tenant-id: your-tenant-id (defaults to demo-tenant)
x-user-id: your-user-id
```

## Roles & Permissions

### owner / admin
Full access to all permissions

### policy_admin
Full policy management access

### policy_manager
- View and manage policies
- Create and update rules
- Manage decisions and guardrails
- Handle exceptions and violations
- Manage acknowledgments and reviews

### compliance_manager
- View policies and rules
- Enforce guardrails
- Manage violations and acknowledgments
- Conduct reviews
- View audit logs

### auditor
- View policy overview
- View policies and rules
- View audit logs and enforcement logs

### viewer
- View policy overview
- Read policies and rules

## Example Usage

### Create a Policy

```bash
curl -X POST http://localhost:5200/policyos/policies \
  -H "Content-Type: application/json" \
  -H "x-role: policy_manager" \
  -d '{
    "key": "data_retention_policy",
    "name": "Data Retention Policy",
    "description": "Policy for data retention and deletion",
    "category": "data",
    "tags": ["data", "retention", "compliance"],
    "ownerId": "user_data_officer",
    "reviewCycle": "yearly",
    "rules": [
      {
        "key": "retention_12_months",
        "name": "12 Month Retention Rule",
        "effect": "allow",
        "actions": ["data.store"],
        "resources": ["*"],
        "conditions": { "retentionMonths": 12 },
        "priority": 100
      }
    ]
  }'
```

### Evaluate Access

```bash
curl -X POST http://localhost:5200/policyos/evaluate \
  -H "Content-Type: application/json" \
  -H "x-role: policy_manager" \
  -d '{
    "subjectId": "user_123",
    "subjectType": "user",
    "action": "ai.generate.high_impact",
    "resource": "tenant:production"
  }'
```

### Request Exception

```bash
curl -X POST http://localhost:5200/policyos/exceptions \
  -H "Content-Type: application/json" \
  -H "x-role: policy_manager" \
  -d '{
    "policyId": "policy_ai_usage",
    "reason": "Emergency AI generation needed",
    "justification": "Customer SLA at risk",
    "riskLevel": "medium",
    "expiresAt": "2026-05-25T00:00:00Z"
  }'
```

## Core Entities

### Policy
Structured policy document with versioning, rules, and lifecycle management.

### Rule
Individual rule within a policy that defines allow/deny conditions.

### Guardrail
Safety guardrails that evaluate actions before enforcement.

### RateLimit
Rate limiting rules to control resource access frequency.

### ApprovalRule
Workflow rules that require human approval before execution.

### Exception
Controlled deviation from policy rules with approval workflow.

### Violation
Detected breach of policy rules requiring investigation.

### Acknowledgment
User acceptance tracking for policy versions.

## Policy Categories

- **Security** - Security and access control policies
- **AI** - AI usage and safety policies
- **Data** - Data privacy and protection policies
- **Finance** - Billing and refund policies
- **Notification** - Communication and consent policies
- **HR** - Employee and team policies
- **Operations** - Daily execution policies
- **Compliance** - Regulatory compliance policies

## Data Storage

PolicyOS uses JSON file storage by default. The database file is located at:
```
data/policyos.db.json
```

You can customize the location with the `POLICYOS_DB_FILE` environment variable.

## Environment Variables

- `PORT` - Server port (default: 5200)
- `POLICYOS_DB_FILE` - Path to database file (default: data/policyos.db.json)
- `DEFAULT_TENANT_ID` - Default tenant ID (default: demo-tenant)

## Development

### Build
```bash
npm run build
```

### Reset Database
```bash
npm run reset
```

### Run Tests
```bash
npm test
```

## Architecture

PolicyOS follows the same architecture pattern as AIOS:

```
src/
├── core/               # Core utilities and infrastructure
│   ├── datastore.ts    # JSON file-based data store
│   ├── errors.ts       # HTTP error handling
│   ├── http.ts         # HTTP router and server
│   ├── id.ts           # ID generation utilities
│   ├── security.ts     # Role-based access control
│   └── utils.ts        # Common utility functions
├── modules/
│   └── routes.ts       # API route definitions
├── domain.ts           # Domain entities and types
├── docs.ts             # API documentation
├── seed-state.ts       # Demo data seeder
├── service.ts          # Business logic layer
└── main.ts             # Application entry point
```

## License

MIT
## Related OSs

- platformos
- securityos
