# IntegrationOS

External integrations, connectors, sync rules, webhooks, OAuth, and integration marketplace for the APPNEURAL ecosystem.

## Overview

IntegrationOS is the connection engine of APPNEURAL that helps connect:
- APIs and webhooks
- Payment gateways (Razorpay, Stripe)
- CRM systems (HubSpot, Salesforce)
- Email services (Gmail, SendGrid)
- Calendar integrations (Google Calendar)
- Communication tools (WhatsApp, Slack)
- AI providers (OpenAI, Azure AI Foundry)
- And many more external systems

## Quick Start

```bash
cd IntegrationOS
npm install
npm run build
npm start
```

The server starts on **port 10400** (or `PORT` environment variable).

## API Endpoints

### Connectors
- `GET /integrationos/connectors` - List all connectors
- `POST /integrationos/connectors` - Create a connector
- `GET /integrationos/connectors/:id` - Get connector details
- `PATCH /integrationos/connectors/:id` - Update connector
- `DELETE /integrationos/connectors/:id` - Delete connector

### Connected Apps
- `GET /integrationos/apps` - List connected apps
- `POST /integrationos/apps` - Connect an app
- `GET /integrationos/apps/:id` - Get app details
- `PATCH /integrationos/apps/:id` - Update app
- `DELETE /integrationos/apps/:id` - Disconnect app

### Webhooks
- `GET /integrationos/webhooks` - List webhooks
- `POST /integrationos/webhooks` - Create webhook
- `GET /integrationos/webhooks/:id` - Get webhook
- `PATCH /integrationos/webhooks/:id` - Update webhook
- `DELETE /integrationos/webhooks/:id` - Delete webhook
- `POST /integrationos/webhooks/:id/receive` - Receive webhook event

### OAuth
- `GET /integrationos/oauth` - List OAuth connections
- `POST /integrationos/oauth` - Create OAuth connection
- `POST /integrationos/oauth/:id/refresh` - Refresh token
- `DELETE /integrationos/oauth/:id` - Revoke connection

### Sync Rules
- `GET /integrationos/sync` - List sync rules
- `POST /integrationos/sync` - Create sync rule
- `GET /integrationos/sync/:id` - Get sync rule
- `PATCH /integrationos/sync/:id` - Update sync rule
- `POST /integrationos/sync/:id/run` - Run sync
- `GET /integrationos/sync/runs` - List sync runs

### Other
- `GET /integrationos` - Overview dashboard
- `GET /integrationos/api-keys` - List API keys
- `GET /integrationos/logs` - View integration logs
- `GET /integrationos/templates` - List templates
- `GET /integrationos/events` - List events
- `GET /integrationos/health` - Health checks
- `GET /integrationos/audit` - Audit logs

## Authentication

Set headers for each request:
- `x-role`: Role (owner, admin, integration_admin, connector_builder, webhook_manager, oauth_manager, sync_operator, viewer)
- `x-tenant-id`: Tenant ID (defaults to "demo-tenant")
- `x-user-id`: User ID

## Example Usage

```bash
# Get overview
curl http://localhost:10400/integrationos

# Create a connector
curl -X POST http://localhost:10400/integrationos/connectors \
  -H "Content-Type: application/json" \
  -H "x-role: connector_builder" \
  -d '{
    "key": "razorpay",
    "name": "Razorpay Payment Gateway",
    "type": "rest",
    "category": "payment",
    "authType": "api_key"
  }'

# List connectors
curl http://localhost:10400/integrationos/connectors

# Create a webhook
curl -X POST http://localhost:10400/integrationos/webhooks \
  -H "Content-Type: application/json" \
  -H "x-role: webhook_manager" \
  -d '{
    "key": "payment_webhook",
    "name": "Payment Webhook",
    "type": "incoming",
    "events": ["payment.captured", "payment.failed"]
  }'

# Create a sync rule
curl -X POST http://localhost:10400/integrationos/sync \
  -H "Content-Type: application/json" \
  -H "x-role: sync_operator" \
  -d '{
    "key": "leads_to_crm",
    "name": "Leads to CRM Sync",
    "sourceConnectorId": "connector_xxx",
    "targetConnectorId": "connector_yyy",
    "syncMode": "scheduled",
    "schedule": {"frequency": "hourly"},
    "mapping": {
      "sourceEntity": "leads",
      "targetEntity": "contacts",
      "fieldMappings": [
        {"sourceField": "email", "targetField": "email"}
      ]
    }
  }'
```

## Demo Data

Seed data includes:
- 7 connectors (Razorpay, HubSpot, Gmail, Google Calendar, WhatsApp, GitHub, OpenAI)
- 2 connected apps
- 3 webhooks
- 3 sync rules
- 2 OAuth connections
- 2 integration templates

## Environment Variables

- `PORT` - Server port (default: 10400)
- `INTEGRATIONOS_DB_FILE` - Database file path (default: data/integrationos.db.json)
- `DEFAULT_TENANT_ID` - Default tenant ID (default: demo-tenant)

## Architecture

```
IntegrationOS/
├── src/
│   ├── core/          # Core utilities (datastore, http, errors, utils)
│   ├── main.ts        # Entry point
│   ├── service.ts     # Business logic
│   ├── routes.ts      # API routes
│   ├── types.ts       # TypeScript interfaces
│   ├── docs.ts        # API documentation
│   └── seed-state.ts  # Demo data
└── manifest.json      # OS manifest
```

## Core Entities

- **Connector**: API connector configuration (REST, GraphQL, SOAP, etc.)
- **ConnectedApp**: Active connection to an external service
- **Webhook**: Event-based integration endpoint
- **OAuthConnection**: OAuth 2.0 authenticated connection
- **SyncRule**: Data synchronization rule between systems
- **SyncRun**: Execution instance of a sync rule
- **APIKey**: API key for external access
- **IntegrationTemplate**: Reusable integration recipes

## Features

- REST API with JSON storage
- Role-based access control
- Multi-tenant support
- Webhook management with retry policies
- OAuth 2.0 token management
- Data sync with conflict resolution
- Field mapping and transformations
- Audit logging
- Event tracking
- Health monitoring
- Integration templates

## See Also

- [Planning Document](./docs/planning.md)
- [AIOS](../AIOS/) - AI Operating System
- [SecurityOS](../SecurityOS/) - Security & Access Control
## Related OSs

- platformos
- securityos
