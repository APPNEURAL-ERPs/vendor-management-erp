# AIResourceOS

AI resource management, token budgets, model selection, cost tracking, and quota management.

## Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run the server
npm start

# Or use dev mode (build + run)
npm run dev
```

## Configuration

- **Port**: 12200 (default, can override with `PORT` env var)
- **Database**: `data/airesourceos.db.json` (can override with `AIRESOURCEOS_DB_FILE`)
- **Tenant**: `demo-tenant` (can override with `DEFAULT_TENANT_ID`)

## API Endpoints

### Health & Docs
- `GET /health` - Health check
- `GET /docs` - API documentation

### AI Models
- `GET /airesourceos/models` - List models
- `POST /airesourceos/models` - Create model
- `GET /airesourceos/models/:id` - Get model
- `PUT /airesourceos/models/:id` - Update model

### Token Budgets
- `GET /airesourceos/budgets` - List budgets
- `POST /airesourceos/budgets` - Create budget
- `GET /airesourceos/budgets/:id` - Get budget
- `PUT /airesourceos/budgets/:id` - Update budget

### Usage Tracking
- `GET /airesourceos/usage` - List usage records
- `POST /airesourceos/usage` - Track usage

### Model Configs
- `GET /airesourceos/configs` - List configurations
- `POST /airesourceos/configs` - Create configuration
- `GET /airesourceos/configs/:id` - Get configuration
- `PUT /airesourceos/configs/:id` - Update configuration

### Cost Allocations
- `GET /airesourceos/allocations` - List allocations
- `POST /airesourceos/allocations` - Create allocation
- `GET /airesourceos/allocations/:id` - Get allocation
- `PUT /airesourceos/allocations/:id` - Update allocation

### Quota Management
- `GET /airesourceos/quotas` - List quotas
- `POST /airesourceos/quotas` - Create quota
- `GET /airesourceos/quotas/:id` - Get quota
- `PUT /airesourceos/quotas/:id` - Update quota
- `POST /airesourceos/quotas/check` - Check quota

### Analytics
- `GET /airesourceos/overview` - Get overview
- `GET /airesourceos/events` - Get events
- `GET /airesourceos/audit-logs` - Get audit logs

## Authentication

Uses header-based authentication:
- `x-tenant-id`: Tenant ID (defaults to `demo-tenant`)
- `x-user-id`: User ID
- `x-role`: User role (`owner`, `admin`, `resource_admin`, `resource_analyst`, `viewer`)

## Core Entities

- **AIModel**: AI model definitions with pricing
- **TokenBudget**: Token budgets with usage tracking
- **AIUsage**: Usage records with cost calculation
- **ModelConfig**: Model configuration templates
- **CostAllocation**: Cost allocations by scope
- **QuotaLimit**: Rate and usage limits

## Example Usage

```bash
# Start the server
npm start

# In another terminal, test the API
curl http://localhost:12200/health
curl http://localhost:12200/airesourceos/overview
curl http://localhost:12200/airesourceos/models
```

## Architecture

- **Port**: 12200
- **Storage**: JSON file-based datastore
- **Patterns**: Follows AIOS/SecurityOS patterns
- **Language**: TypeScript with strict mode
## Related OSs

- platformos
