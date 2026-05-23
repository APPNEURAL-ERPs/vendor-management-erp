# WorkflowOS

**WorkflowOS** is the workflow orchestration operating system for APPNEURAL. It provides structured workflows, states, approvals, transitions, escalations, human-in-loop steps, and workflow execution capabilities.

## Quick Start

```bash
npm install
npm run build
npm start
```

Server runs on `http://localhost:6000`

## API Documentation

Visit `http://localhost:6000/docs` for interactive API documentation.

## Authentication

WorkflowOS uses role-based access control with the following headers:

- `x-role`: User role (owner, admin, workflow_admin, workflow_designer, workflow_operator, workflow_viewer, approver)
- `x-tenant-id`: Tenant ID (defaults to "demo-tenant")
- `x-user-id`: Actor ID

## Core Concepts

### Workflow
A reusable automation definition with triggers, steps, transitions, and approval gates.

### Trigger
Event, schedule, webhook, or manual event that starts workflow execution.

### Step
A single action unit (create, update, notify, approval, AI call, etc.).

### Transition
Conditional path between steps based on results or data.

### Approval
Human decision gate requiring one or more approvals.

### Escalation
Automatic or manual escalation of pending approvals.

### Execution
A running or completed instance of a workflow.

## Example Workflows

### Lead Qualification Workflow
```bash
curl -X POST http://localhost:6000/workflowos/workflows \
  -H "Content-Type: application/json" \
  -H "x-role: workflow_admin" \
  -d '{
    "key": "lead_qualification",
    "name": "Lead Qualification Workflow",
    "description": "Automated lead scoring and routing",
    "status": "draft"
  }'
```

### Run a Workflow
```bash
curl -X POST http://localhost:6000/workflowos/workflows/{id}/run \
  -H "Content-Type: application/json" \
  -H "x-role: workflow_operator" \
  -d '{
    "input": {
      "leadId": "lead_123",
      "source": "website"
    }
  }'
```

### Approve a Step
```bash
curl -X POST http://localhost:6000/workflowos/approvals/{id}/approve \
  -H "Content-Type: application/json" \
  -H "x-role: approver" \
  -d '{
    "reason": "Approved - all criteria met"
  }'
```

## API Endpoints

### Workflows
- `GET /workflowos/workflows` - List all workflows
- `POST /workflowos/workflows` - Create a workflow
- `GET /workflowos/workflows/:id` - Get workflow details
- `PATCH /workflowos/workflows/:id` - Update workflow
- `POST /workflowos/workflows/:id/publish` - Publish workflow
- `POST /workflowos/workflows/:id/run` - Run workflow

### Triggers
- `GET /workflowos/triggers` - List triggers
- `POST /workflowos/workflows/:id/triggers` - Create trigger

### Steps
- `GET /workflowos/steps` - List steps
- `POST /workflowos/workflows/:id/steps` - Create step

### Transitions
- `GET /workflowos/transitions` - List transitions
- `POST /workflowos/workflows/:id/transitions` - Create transition

### Executions
- `GET /workflowos/executions` - List executions
- `GET /workflowos/executions/:id` - Get execution details
- `POST /workflowos/executions/:id/cancel` - Cancel execution
- `POST /workflowos/executions/:id/retry` - Retry failed execution

### Approvals
- `GET /workflowos/approvals` - List approvals
- `GET /workflowos/approvals/:id` - Get approval details
- `POST /workflowos/approvals/:id/approve` - Approve
- `POST /workflowos/approvals/:id/reject` - Reject
- `POST /workflowos/approvals/:id/escalate` - Escalate

### Escalations
- `GET /workflowos/escalations` - List escalations
- `POST /workflowos/escalations/:id/resolve` - Resolve escalation

## Workflow Statuses

- `draft` - Workflow is being designed
- `active` - Workflow is live and can be triggered
- `paused` - Workflow is temporarily disabled
- `running` - Workflow execution is in progress
- `waiting` - Workflow is waiting for external input
- `completed` - Workflow execution finished successfully
- `failed` - Workflow execution failed
- `cancelled` - Workflow execution was cancelled

## Step Types

- `create` - Create a new record
- `update` - Update an existing record
- `delete` - Delete a record
- `notify` - Send notification (email, SMS, etc.)
- `call_api` - Call external API
- `run_tool` - Execute a tool
- `generate_document` - Generate document (PDF, etc.)
- `condition` - Conditional branching
- `approval` - Human approval gate
- `delay` - Delay execution
- `ai_call` - Call AI model
- `custom` - Custom action

## Trigger Types

- `event` - Triggered by OS event
- `schedule` - Cron-based schedule
- `webhook` - Webhook endpoint
- `manual` - Manual trigger
- `api` - API call
- `form` - Form submission
- `file` - File upload
- `email` - Email received

## Role Permissions

### owner / admin
Full access to all features

### workflow_admin
Full workflow management access

### workflow_designer
Can create and manage workflow definitions and templates

### workflow_operator
Can run and monitor workflow executions

### approver
Can approve/reject/escalate approval requests

### workflow_viewer
Read-only access to workflows and executions

## Development

```bash
npm run build     # Compile TypeScript
npm start         # Start production server
npm run dev       # Build and start
npm run seed      # Seed demo data
npm run reset     # Reset database and reseed
```

## Architecture

WorkflowOS follows a modular architecture:

- **Core**: DataStore, HTTP router, security, utilities
- **Domain**: Type definitions and workflow entities
- **Service**: Business logic layer
- **Routes**: API endpoint handlers
- **Seed**: Demo data initialization

## License

MIT
## Related OSs

- platformos
- securityos
