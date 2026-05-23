# CommandOS

**CommandOS** is a reusable command-center operating layer for Appneural-style platforms. It manages command registry, executions, runbooks, automation rules, schedules, incident response, events, permissions, and audit logs.

This project follows the same dependency-free TypeScript starter style used by the other OS layers. It runs with Node.js 20+ and stores demo data in a JSON file.

## What is included

- Command registry with roles, tags, input schemas, ownership, and status
- Command execution lifecycle
- Runbook definitions and runbook run step progression
- Automation rules that trigger commands or runbooks
- Scheduled command/runbook definitions
- Incident records with timeline notes
- Overview metrics
- Event logs and audit logs
- Role-based permissions
- Seed demo data
- PostgreSQL schema example
- Automated tests

## Run

```bash
npm run build
npm start
```

Open:

```txt
http://localhost:4900/health
http://localhost:4900/docs
```

## Default tenant

```txt
demo-tenant
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: command_admin
x-user-id: user-001
```

Roles:

```txt
owner
admin
command_admin
operator
incident_commander
automation_manager
auditor
viewer
```

## Main demo IDs

```txt
cmd_restart_checkout
cmd_rotate_api_keys
cmd_freeze_signups
exec_demo_restart
runbook_checkout_degradation
auto_checkout_error_rate
sched_weekly_key_rotation
inc_checkout_demo
```

## Example: get overview

```bash
curl http://localhost:4900/commandos/overview \
  -H "x-role: command_admin"
```

## Example: create a command

```bash
curl -X POST http://localhost:4900/commandos/commands \
  -H "Content-Type: application/json" \
  -H "x-role: command_admin" \
  -d '{
    "key": "finance.rebuild-ledger",
    "name": "Rebuild FinanceOS ledger",
    "category": "finance",
    "ownerTeam": "Finance Platform",
    "priority": "high",
    "requiredRole": "operator",
    "inputSchema": { "period": "string" },
    "tags": ["finance", "ledger"]
  }'
```

## Example: execute a command

```bash
curl -X POST http://localhost:4900/commandos/commands/commerce.restart-checkout-worker/execute \
  -H "Content-Type: application/json" \
  -H "x-role: operator" \
  -d '{
    "reason": "manual recovery",
    "drainSeconds": 30
  }'
```

## Example: complete an execution

```bash
curl -X PATCH http://localhost:4900/commandos/executions/EXECUTION_ID/status \
  -H "Content-Type: application/json" \
  -H "x-role: operator" \
  -d '{
    "status": "succeeded",
    "output": { "healthy": true },
    "logs": ["worker health check passed"]
  }'
```

## Example: start a runbook

```bash
curl -X POST http://localhost:4900/commandos/runbooks/incident.checkout-degradation/start \
  -H "Content-Type: application/json" \
  -H "x-role: incident_commander" \
  -d '{ "context": { "incidentId": "inc_checkout_demo" }, "priority": "critical" }'
```

## Example: open an incident

```bash
curl -X POST http://localhost:4900/commandos/incidents \
  -H "Content-Type: application/json" \
  -H "x-role: incident_commander" \
  -d '{
    "key": "INC-1002",
    "title": "API error rate elevated",
    "severity": "sev2",
    "summary": "Partner API error rate crossed threshold."
  }'
```

For production, replace the JSON file store with PostgreSQL using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/commandos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/command`
- Modes: standalone and PlatformOS integrated
- Related systems: PlatformOS, AutomationOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
