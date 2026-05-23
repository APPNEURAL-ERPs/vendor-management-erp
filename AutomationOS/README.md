# AutomationOS

AutomationOS is a reusable operating layer for workflows, triggers, approvals, schedules, events, tasks, notifications, connectors, permissions, and audit logs.

It is designed to power platforms such as AppneuroX, CommerceOS-based apps, GrowthOS, ClientOS, FinanceOS, internal ERPs, and industry systems.

## What is included

- Workflow definitions
- Manual, event, schedule, and webhook triggers
- Action, condition, approval, delay, and end steps
- Workflow execution engine
- Approval pause/resume flow
- Tasks and task status updates
- Schedules and due schedule runner
- Connectors
- Notifications
- Event ingestion
- Webhook ingestion
- Audit logs
- Role-based permissions
- Demo seed workflows
- PostgreSQL schema starter
- Automated tests

## Tech stack

```txt
Language: TypeScript
Runtime: Node.js
Runtime dependencies: none
Local data store: JSON file
Production database option: PostgreSQL schema included
```

## Run locally

```bash
npm run build
npm start
```

Default server:

```txt
http://localhost:4200
```

Health:

```txt
GET /health
```

Docs:

```txt
GET /docs
```

## Seed data

The app automatically seeds demo data on first start.

Manual seed:

```bash
npm run seed
```

Reset seed:

```bash
npm run reset
```

Default tenant:

```txt
demo-tenant
```

## Roles

Use request headers:

```txt
x-role: owner | admin | automation_manager | operator | approver | viewer
x-tenant-id: demo-tenant
x-user-id: user-001
```

## Main API endpoints

```txt
GET    /automationos/overview
GET    /automationos/permissions

GET    /automationos/workflows
POST   /automationos/workflows
GET    /automationos/workflows/:id
PUT    /automationos/workflows/:id
PATCH  /automationos/workflows/:id/status
DELETE /automationos/workflows/:id
POST   /automationos/workflows/:id/run

POST   /automationos/events/ingest
GET    /automationos/events
POST   /automationos/webhooks/:path

GET    /automationos/executions
GET    /automationos/executions/:id
PATCH  /automationos/executions/:id/cancel

GET    /automationos/approvals
POST   /automationos/approvals
POST   /automationos/approvals/:id/decision

GET    /automationos/tasks
POST   /automationos/tasks
PATCH  /automationos/tasks/:id/status

GET    /automationos/schedules
POST   /automationos/schedules
POST   /automationos/schedules/:id/run
POST   /automationos/schedules/run-due

GET    /automationos/connectors
POST   /automationos/connectors

GET    /automationos/notifications
GET    /automationos/audit
```

## Example 1: Trigger a CommerceOS order automation

The seed data includes an active workflow called `high_value_order_approval`.

It listens for:

```txt
event type: order.created
source: CommerceOS
condition: data.totalAmount >= 5000
```

Request:

```bash
curl -X POST http://localhost:4200/automationos/events/ingest \
  -H "Content-Type: application/json" \
  -H "x-role: operator" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "type": "order.created",
    "source": "CommerceOS",
    "data": {
      "orderId": "ORD-1001",
      "customerId": "CUS-1001",
      "totalAmount": 7500
    }
  }'
```

Result:

```txt
AutomationOS creates an execution and pauses it for approval.
```

## Example 2: Approve the workflow

Get pending approvals:

```bash
curl http://localhost:4200/automationos/approvals \
  -H "x-role: approver" \
  -H "x-tenant-id: demo-tenant"
```

Approve:

```bash
curl -X POST http://localhost:4200/automationos/approvals/APPROVAL_ID/decision \
  -H "Content-Type: application/json" \
  -H "x-role: approver" \
  -H "x-user-id: manager-001" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "decision": "approved",
    "note": "Approved for fulfillment"
  }'
```

After approval, AutomationOS:

```txt
1. Resumes the execution
2. Creates a fulfillment task
3. Sends a notification
4. Emits order.approved event
5. Completes the workflow
```

## Example 3: Trigger a lead automation

```bash
curl -X POST http://localhost:4200/automationos/events/ingest \
  -H "Content-Type: application/json" \
  -H "x-role: operator" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "type": "lead.created",
    "source": "GrowthOS",
    "data": {
      "leadId": "LEAD-1001",
      "name": "Asha Sharma",
      "email": "asha@example.com"
    }
  }'
```

This creates:

```txt
Sales notification
Follow-up task
Completed execution
```

## Example 4: Trigger a webhook automation

```bash
curl -X POST http://localhost:4200/automationos/webhooks/support-escalation \
  -H "Content-Type: application/json" \
  -H "x-role: operator" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "source": "ClientOS",
    "data": {
      "ticketId": "TICKET-9001",
      "severity": "critical"
    }
  }'
```

This creates an urgent support task.

## Example 5: Run due schedules

```bash
curl -X POST http://localhost:4200/automationos/schedules/run-due \
  -H "x-role: operator" \
  -H "x-tenant-id: demo-tenant"
```

## Workflow step types

```txt
action      Executes a configured action
condition   Routes execution based on filters
approval    Pauses execution until a human approves/rejects
delay       Records a simulated delay step
end         Completes the execution
```

## Supported action types

```txt
send_notification
create_task
webhook_call
emit_event
update_record
set_variable
log
```

## Development structure

```txt
src/
 ├── core/
 │    ├── datastore.ts
 │    ├── domain.ts
 │    ├── errors.ts
 │    ├── event-bus.ts
 │    ├── http.ts
 │    ├── id.ts
 │    ├── security.ts
 │    └── utils.ts
 │
 ├── engines/
 │    ├── condition-engine.ts
 │    ├── schedule-engine.ts
 │    └── workflow-engine.ts
 │
 ├── services/
 │    └── automation.service.ts
 │
 ├── modules/
 │    └── routes.ts
 │
 ├── scripts/
 │    └── seed.ts
 │
 ├── docs.ts
 ├── main.ts
 └── seed-state.ts
```

## Production upgrade path

This starter uses a JSON file store so it can run immediately. For production:

1. Replace `DataStore` with PostgreSQL repositories.
2. Use the schema in `database/schema.sql`.
3. Add external connectors for email, WhatsApp, Slack, and webhooks.
4. Add durable queues for long-running workflows.
5. Add cron processing for schedule triggers.
6. Add OpenTelemetry/logging for observability.
7. Add workflow version publishing and rollback.

## OS integration example

```txt
CommerceOS -> order.created event
AutomationOS -> high value approval workflow
Approver -> approval decision
AutomationOS -> creates task and notification
FinanceOS -> can listen to order.approved
AnalyticsOS -> can track execution and approval KPIs
```

## Planning Alignment

- Official package: `@appneurox/automationos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/automation`
- Modes: standalone and PlatformOS integrated
- Related systems: PlatformOS, CommandOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
