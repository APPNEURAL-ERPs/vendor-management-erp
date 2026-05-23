# LicenseOS

Software licenses, entitlements, usage tracking, compliance, renewals, and license lifecycle management system.

## Quick Start

```bash
npm install
npm run build
npm start
```

Server runs on http://localhost:10700

## API Endpoints

### Health & Documentation
- `GET /health` - Health check
- `GET /licenseos/docs` - API documentation
- `GET /licenseos/overview` - License overview dashboard
- `GET /routes` - List all available routes

### Licenses
- `GET /licenseos/licenses` - List all licenses (supports query, status, plan, type, ownerId filters)
- `POST /licenseos/licenses` - Create a new license
- `GET /licenseos/licenses/:id` - Get license details
- `PATCH /licenseos/licenses/:id` - Update license
- `POST /licenseos/licenses/:id/activate` - Activate a license
- `POST /licenseos/licenses/:id/suspend` - Suspend a license
- `POST /licenseos/licenses/:id/revoke` - Revoke a license
- `POST /licenseos/licenses/:id/validate` - Validate license (check entitlements, quotas, expiry)
- `POST /licenseos/licenses/:id/renew` - Create renewal request

### Entitlements
- `GET /licenseos/licenses/:id/entitlements` - List entitlements for a license
- `POST /licenseos/licenses/:id/entitlements` - Add entitlement to license

### Seats
- `POST /licenseos/licenses/:id/seats` - Assign seat to user
- `DELETE /licenseos/licenses/:id/seats/:userId` - Release seat

### Compliance
- `POST /licenseos/licenses/:id/compliance` - Run compliance check (seat_compliance, quota_compliance, expiry_compliance)

### Usage
- `POST /licenseos/usage` - Record usage
- `GET /licenseos/usage/analytics` - Get usage analytics (supports licenseId, period filters)

### Renewals
- `GET /licenseos/renewals` - List all renewals
- `POST /licenseos/renewals/:id/complete` - Complete a renewal

### Other
- `GET /licenseos/compliance` - List compliance checks
- `GET /licenseos/seats` - List all seats
- `GET /licenseos/quotas` - List all quotas
- `GET /licenseos/credit-wallets` - List credit wallets
- `GET /licenseos/audit-logs` - List audit logs
- `GET /licenseos/events` - List events

## Authentication

Set the following headers:
- `x-role`: owner | admin | license_admin | license_manager | viewer
- `x-tenant-id`: Tenant ID (defaults to demo-tenant)
- `x-user-id`: Actor ID

## Example Usage

### Create a License

```bash
curl -X POST http://localhost:10700/licenseos/licenses \
  -H "Content-Type: application/json" \
  -H "x-role: license_admin" \
  -H "x-tenant-id: demo-tenant" \
  -H "x-user-id: admin_user" \
  -d '{
    "name": "CareerOS Pro for XYZ Corp",
    "type": "module",
    "plan": "pro",
    "ownerId": "tenant_xyz",
    "seats": { "total": 10 },
    "entitlements": ["careeros.resume_builder", "careeros.jd_matcher"],
    "pricing": { "model": "subscription", "amount": 99, "currency": "USD", "interval": "monthly" }
  }'
```

### Validate a License

```bash
curl -X POST http://localhost:10700/licenseos/licenses/lic_careeros_pro_001/validate \
  -H "Content-Type: application/json" \
  -H "x-role: license_manager" \
  -H "x-tenant-id: demo-tenant" \
  -H "x-user-id: user_123" \
  -d '{
    "userId": "user_123",
    "action": "access",
    "resource": "careeros.jd_matcher"
  }'
```

### Record Usage

```bash
curl -X POST http://localhost:10700/licenseos/usage \
  -H "Content-Type: application/json" \
  -H "x-role: license_manager" \
  -H "x-tenant-id: demo-tenant" \
  -H "x-user-id: system" \
  -d '{
    "licenseId": "lic_careeros_pro_001",
    "userId": "user_recruiter_1",
    "resourceType": "tool",
    "resourceId": "tool_jd_matcher",
    "action": "jd_matcher.run",
    "quantity": 1,
    "unit": "run"
  }'
```

### Get Overview

```bash
curl http://localhost:10700/licenseos/overview \
  -H "x-role: admin" \
  -H "x-tenant-id: demo-tenant"
```

## Core Entities

- **License**: Software license with quotas, seats, entitlements, and pricing
- **Entitlement**: Permission or capability granted by a license
- **Seat**: User slot within a license
- **Quota**: Usage limits for resources
- **UsageRecord**: Log entry tracking resource consumption
- **ComplianceCheck**: Verification of license compliance
- **Renewal**: License renewal request

## License Types

- tenant, user, module, tool, api, template, workflow, agent, plugin, marketplace

## Plans

- free, starter, pro, business, enterprise

## License Statuses

- draft, active, trial, expired, suspended, cancelled, revoked, renewed, archived

## Development

```bash
npm run dev        # Build and start
npm run seed       # Reset database with seed data
npm run reset      # Reset database and reseed
npm run test       # Run tests
```

## Data Storage

Data is stored in `data/licenseos.db.json` (JSON file storage).

## Architecture

- **domain.ts**: All entity types and interfaces
- **core/**: Core utilities (datastore, http router, ID generation, utilities)
- **service.ts**: Business logic layer
- **main.ts**: HTTP server and route registration
- **seed-state.ts**: Demo data
- **docs.ts**: API documentation

## Port

Default port: 10700 (configurable via PORT environment variable)
## Related OSs

- platformos
- securityos
