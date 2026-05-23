# ClientOS

ClientOS is a reusable TypeScript operating layer for customers, clients, CRM, support tickets, notes, interactions, tasks, SLA policies, segments, analytics, events, audit logs, and role-based permissions.

It is designed to power platforms in healthcare, legal, services, education, retail, hospitality, enterprise, and other client-facing products.

## What is included

- Customer/account management
- Contact management
- CRM opportunity pipeline
- Support ticket lifecycle
- SLA policy calculation and breach detection
- Notes and interaction timeline
- Client tasks and follow-ups
- Dynamic client segments
- Customer health and support analytics
- Event bus
- Audit logs
- Role-based permissions
- Demo seed data
- PostgreSQL schema starter
- Automated tests

## Run

```bash
npm run build
npm start
```

Open:

```txt
http://localhost:4600/health
http://localhost:4600/docs
```

## Environment

```txt
PORT=4600
DEFAULT_TENANT_ID=demo-tenant
CLIENTOS_DB_FILE=data/clientos.db.json
```

## Auth headers

This starter uses simple headers for local development:

```txt
x-role: client_admin
x-tenant-id: demo-tenant
x-user-id: user_123
```

Roles:

```txt
viewer
sales_rep
account_manager
support_agent
support_manager
success_manager
client_admin
admin
owner
auditor
```

## Important endpoints

```txt
GET    /clientos/overview
GET    /clientos/accounts
POST   /clientos/accounts
GET    /clientos/accounts/:id/profile
GET    /clientos/contacts
POST   /clientos/contacts
GET    /clientos/opportunities
POST   /clientos/opportunities
POST   /clientos/opportunities/:id/stage
GET    /clientos/tickets
POST   /clientos/tickets
POST   /clientos/tickets/:id/assign
POST   /clientos/tickets/:id/respond
POST   /clientos/tickets/:id/resolve
POST   /clientos/tickets/:id/close
GET    /clientos/sla-policies
POST   /clientos/sla-policies
GET    /clientos/notes
POST   /clientos/notes
GET    /clientos/interactions
POST   /clientos/interactions
GET    /clientos/tasks
POST   /clientos/tasks
GET    /clientos/segments
POST   /clientos/segments
GET    /clientos/events
GET    /clientos/audit-logs
```

## Example: create customer account

```bash
curl -X POST http://localhost:4600/clientos/accounts \
  -H "Content-Type: application/json" \
  -H "x-role: client_admin" \
  -d '{
    "name": "Acme Healthcare",
    "type": "company",
    "status": "active",
    "lifecycleStage": "onboarding",
    "industry": "Healthcare",
    "primaryEmail": "ops@acme.example",
    "tags": ["healthcare", "priority"],
    "healthScore": 82
  }'
```

## Example: create support ticket

```bash
curl -X POST http://localhost:4600/clientos/tickets \
  -H "Content-Type: application/json" \
  -H "x-role: support_agent" \
  -d '{
    "accountId": "acct_demo_northstar",
    "contactId": "ctc_demo_mira",
    "subject": "Cannot access appointment dashboard",
    "description": "The operations team cannot log into the dashboard.",
    "priority": "high",
    "channel": "portal",
    "category": "access"
  }'
```

## Example: respond to ticket

```bash
curl -X POST http://localhost:4600/clientos/tickets/tkt_demo_login/respond \
  -H "Content-Type: application/json" \
  -H "x-role: support_agent" \
  -d '{
    "message": "We are checking the access issue now.",
    "channel": "email"
  }'
```

## Example: move opportunity to won

```bash
curl -X POST http://localhost:4600/clientos/opportunities/opp_demo_pixel/stage \
  -H "Content-Type: application/json" \
  -H "x-role: sales_rep" \
  -d '{ "stage": "won" }'
```

## Development structure

```txt
src/
 ├── core/                 # HTTP router, datastore, security, errors, utilities
 ├── engines/              # SLA engine and analytics engine
 ├── modules/routes.ts     # API routes
 ├── services/             # ClientOS domain service
 ├── seed-state.ts         # Demo tenant state
 └── main.ts               # HTTP server

database/schema.sql        # PostgreSQL schema starter
tests/clientos.test.cjs    # Node test suite
```

## Production notes

This project stores data in a JSON file for easy local testing. For production:

1. Replace `DataStore` with PostgreSQL repositories using `database/schema.sql`.
2. Connect SecurityOS for real authentication and RBAC.
3. Connect AutomationOS for ticket escalations and customer follow-up workflows.
4. Connect AnalyticsOS for advanced dashboards and KPI tracking.
5. Connect FinanceOS for invoices, subscriptions, disputes, and payment history.
6. Connect AIOS for ticket summarization, client health insights, and next-best-action recommendations.

## Planning Alignment

- Official package: `@appneurox/clientos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/client`
- Modes: standalone and PlatformOS integrated
- Related systems: SalesOS, ExperienceOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
