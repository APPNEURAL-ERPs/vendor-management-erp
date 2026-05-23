# SalesOS

SalesOS is the revenue conversion engine of APPNEURAL that helps capture leads, qualify prospects, manage deals, send proposals, follow up, handle objections, forecast revenue, and close sales.

## Features

- **Lead Management**: Capture, qualify, and score leads from multiple sources
- **Contact Management**: Manage contacts and their roles within accounts
- **Account Management**: Track company accounts and their relationships
- **Pipeline Management**: Visualize and manage your sales pipeline
- **Deal Management**: Track deals through various stages with probability
- **Activity Tracking**: Log calls, emails, meetings, and other sales activities
- **Follow-up Management**: Never miss a follow-up with reminders
- **Proposal Builder**: Create and send professional proposals
- **Sales Forecasting**: Predict revenue based on deal probability
- **Target Setting**: Set and track sales targets
- **Sales Dashboard**: Get an overview of your sales performance

## Installation

```bash
npm install
npm run build
```

## Running

```bash
npm start
```

The server will start on http://localhost:8500

## API Endpoints

### Health & Docs
- `GET /health` - Health check
- `GET /docs` - API documentation

### Leads
- `GET /salesos/leads` - List all leads
- `POST /salesos/leads` - Create a new lead
- `GET /salesos/leads/:id` - Get a lead by ID
- `PATCH /salesos/leads/:id` - Update a lead

### Contacts
- `GET /salesos/contacts` - List all contacts
- `POST /salesos/contacts` - Create a new contact
- `GET /salesos/contacts/:id` - Get a contact by ID

### Accounts
- `GET /salesos/accounts` - List all accounts
- `POST /salesos/accounts` - Create a new account
- `GET /salesos/accounts/:id` - Get an account by ID

### Deals
- `GET /salesos/deals` - List all deals
- `POST /salesos/deals` - Create a new deal
- `GET /salesos/deals/:id` - Get a deal by ID
- `PATCH /salesos/deals/:id` - Update a deal

### Pipelines
- `GET /salesos/pipelines` - List all pipelines
- `POST /salesos/pipelines` - Create a new pipeline

### Activities
- `GET /salesos/activities` - List all activities
- `POST /salesos/activities` - Create a new activity

### Follow-ups
- `GET /salesos/follow-ups` - List all follow-ups
- `POST /salesos/follow-ups` - Create a new follow-up
- `PATCH /salesos/follow-ups/:id` - Update a follow-up

### Proposals
- `GET /salesos/proposals` - List all proposals
- `POST /salesos/proposals` - Create a new proposal
- `GET /salesos/proposals/:id` - Get a proposal by ID
- `PATCH /salesos/proposals/:id` - Update a proposal

### Targets
- `GET /salesos/targets` - List all targets
- `POST /salesos/targets` - Create a new target

### Forecasts
- `GET /salesos/forecasts` - List all forecasts
- `POST /salesos/forecasts` - Create a new forecast

### Overview
- `GET /salesos/overview` - Get sales dashboard overview

### Audit
- `GET /salesos/audit` - View audit logs

## Authentication

Use the following headers:
- `x-role`: Role (owner, admin, sales_manager, sales_rep, viewer)
- `x-tenant-id`: Tenant ID (defaults to demo-tenant)
- `x-user-id`: User ID

## Development

```bash
npm run dev      # Build and run
npm run seed     # Seed demo data
npm run reset    # Reset database and reseed
npm run test     # Run tests
```

## Environment Variables

- `PORT` - Server port (default: 8500)
- `SALESOS_DB_FILE` - Database file path (default: data/salesos.db.json)
- `DEFAULT_TENANT_ID` - Default tenant ID (default: demo-tenant)

## Demo Data

SalesOS comes with demo data including:
- 5 sample leads with various statuses
- 3 accounts
- 3 contacts
- 5 deals across different pipeline stages
- 5 sales activities
- 4 follow-up tasks
- 2 proposals
- 3 sales targets
- 1 revenue forecast

## License

MIT
## Related OSs

- platformos
- securityos
