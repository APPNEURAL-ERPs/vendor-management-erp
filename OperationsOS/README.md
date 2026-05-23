# OperationsOS

Operating cadence, processes, tasks, resources, incidents, SOPs, and cross-team execution.

## Overview

OperationsOS is the execution engine of APPNEURAL that helps teams manage daily work, tasks, processes, checklists, SOPs, approvals, issues, SLAs, reports, and operational performance.

## Quick Start

```bash
cd OperationsOS
npm install
npm run dev
```

The server will start on `http://localhost:8100`.

## Core Entities

- **Task**: Operational work items with status, priority, assignee, and due dates
- **Checklist**: Repeatable work execution with multiple items
- **SOP** (Standard Operating Procedure): Step-by-step instructions
- **Process**: Business processes with multiple steps and dependencies
- **Issue**: Problems or blockers that need tracking and resolution
- **Incident**: Operational incidents requiring immediate attention
- **Resource**: Operational resources (people, tools, equipment, etc.)
- **SLARule**: Service Level Agreement rules
- **CalendarItem**: Operational calendar items (meetings, deadlines, etc.)

## API Endpoints

### Health & Documentation
- `GET /health` - Health check
- `GET /docs` - API documentation
- `GET /permissions` - List permissions for current role

### Tasks
- `GET /operations/tasks` - List all tasks
- `POST /operations/tasks` - Create a task
- `GET /operations/tasks/:id` - Get task by ID
- `PATCH /operations/tasks/:id` - Update a task

### Checklists
- `GET /operations/checklists` - List all checklists
- `POST /operations/checklists` - Create a checklist
- `PATCH /operations/checklists/:id/items/:itemId` - Update checklist item

### SOPs
- `GET /operations/sops` - List all SOPs
- `POST /operations/sops` - Create an SOP
- `POST /operations/sops/executions` - Execute an SOP
- `PATCH /operations/sops/executions/:id` - Update SOP execution

### Processes
- `GET /operations/processes` - List all processes
- `POST /operations/processes` - Create a process
- `POST /operations/processes/executions` - Start a process execution

### Issues
- `GET /operations/issues` - List all issues
- `POST /operations/issues` - Create an issue
- `PATCH /operations/issues/:id` - Update an issue

### Incidents
- `GET /operations/incidents` - List all incidents
- `POST /operations/incidents` - Create an incident
- `PATCH /operations/incidents/:id` - Update an incident

### Resources
- `GET /operations/resources` - List all resources
- `POST /operations/resources` - Create a resource

### SLA Rules
- `GET /operations/sla-rules` - List all SLA rules
- `POST /operations/sla-rules` - Create an SLA rule

### Calendar
- `GET /operations/calendar` - List calendar items
- `POST /operations/calendar` - Create a calendar item

### Reports
- `POST /operations/reports/daily` - Generate daily operations report
- `GET /operations/audit` - View audit logs

## Authentication

OperationsOS uses header-based authentication:

```
x-role: owner | admin | ops_manager | ops_engineer | ops_analyst | ops_viewer
x-tenant-id: your-tenant-id
x-user-id: your-user-id
```

Default role is `ops_viewer` if not specified.

## Environment Variables

- `PORT` - Server port (default: 8100)
- `OPS_DB_FILE` - Database file path (default: data/operationsos.db.json)
- `DEFAULT_TENANT_ID` - Default tenant ID (default: demo-tenant)

## Example Usage

### Create a Task
```bash
curl -X POST http://localhost:8100/operations/tasks \
  -H "Content-Type: application/json" \
  -H "x-role: ops_engineer" \
  -d '{
    "key": "task-006",
    "title": "Review quarterly report",
    "status": "todo",
    "priority": "high",
    "dueDate": "2026-05-30T00:00:00.000Z",
    "tags": ["report", "quarterly"]
  }'
```

### List All Tasks
```bash
curl http://localhost:8100/operations/tasks \
  -H "x-role: ops_viewer"
```

### Get Operations Overview
```bash
curl http://localhost:8100/operations/overview \
  -H "x-role: ops_manager"
```

## Project Structure

```
OperationsOS/
├── manifest.json          # OS manifest
├── package.json          # Package configuration
├── tsconfig.json        # TypeScript configuration
├── data/                # Database storage
│   └── operationsos.db.json
└── src/
    ├── main.ts          # Entry point
    ├── domain.ts        # Type definitions
    ├── service.ts       # Business logic
    ├── docs.ts          # API documentation
    ├── seed-state.ts    # Demo data
    ├── core/
    │   ├── datastore.ts  # JSON file storage
    │   ├── http.ts       # HTTP router
    │   ├── id.ts         # ID generation
    │   ├── utils.ts      # Utilities
    │   ├── errors.ts     # Error classes
    │   └── security.ts   # RBAC
    └── modules/
        └── routes.ts    # API routes
```

## Role-Based Permissions

- **ops_viewer**: Read-only access to all operations data
- **ops_analyst**: Read access + audit logs
- **ops_engineer**: Read/write access to all operational items
- **ops_manager**: Full read/write + reports
- **admin/owner**: Full access

## Demo Data

When the server starts with an empty database, it automatically seeds demo data including:
- 5 sample tasks (various statuses and priorities)
- 2 checklists (client onboarding, website launch)
- 1 SOP (client onboarding)
- 1 process (lead to client)
- 3 issues (various priorities and statuses)
- 1 incident (critical production outage)
- 3 resources (team, cloud server, meeting room)
- 2 SLA rules (support, task)
- 2 calendar items (standup, weekly review)

## Events

OperationsOS emits events for key actions:
- `ops.task.created`, `ops.task.updated`, `ops.task.completed`, `ops.task.delayed`
- `ops.process.started`
- `ops.issue.created`, `ops.issue.resolved`
- `ops.incident.created`, `ops.incident.resolved`
- `ops.sla.breached`

## License

MIT
## Related OSs

- platformos
- securityos
