# DeveloperOS Complete Starter

DeveloperOS is a reusable developer operating layer for Appneural-style platforms. It manages developer apps, API products, API endpoints, API keys, SDK packages, webhook subscriptions, CI/CD pipelines, releases, docs, changelogs, usage analytics, events, permissions, and audit logs.

This starter is dependency-free and runs with Node.js 20+.

## Included

- Developer app registry
- API key generation and revocation
- API product catalog
- API endpoint catalog
- SDK package creation and SDK version generation
- Webhook subscriptions, signed deliveries, retry support
- Environment management with secret redaction
- CI/CD pipeline definitions
- Pipeline run engine with build, test, approval, deploy stages
- Deployment create, promote, and rollback flows
- Developer docs pages
- Changelog entries
- Usage event ingestion
- Developer analytics
- Event log and audit log
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
http://localhost:4700/health
http://localhost:4700/docs
```

Use role headers for protected routes:

```bash
curl -H "x-role: dev_admin" http://localhost:4700/developeros/overview
```

Default tenant:

```txt
demo-tenant
```

## Seed

```bash
npm run seed
```

Main seed IDs:

```txt
app_demo_partner
app_demo_internal
key_demo_partner_prod
api_demo_commerce
api_demo_analytics
ep_demo_orders_list
ep_demo_orders_create
ep_demo_metrics
sdk_demo_ts
sdkver_demo_ts_100
whsub_demo_orders
env_dev
env_prod
pipe_demo_appneurox_api
dep_demo_v100
doc_demo_getting_started
doc_demo_auth
chg_demo_100
```

## Common routes

```txt
GET  /developeros/overview
GET  /developeros/analytics
GET  /developeros/apps
POST /developeros/apps
GET  /developeros/apps/:id
PUT  /developeros/apps/:id
GET  /developeros/apps/:id/api-keys
POST /developeros/apps/:id/api-keys
POST /developeros/api-keys/:id/revoke
GET  /developeros/apis
POST /developeros/apis
POST /developeros/apis/:id/endpoints
PUT  /developeros/endpoints/:id
GET  /developeros/sdks
POST /developeros/sdks
POST /developeros/sdks/:id/versions
GET  /developeros/webhooks/subscriptions
POST /developeros/webhooks/subscriptions
POST /developeros/webhooks/test
GET  /developeros/webhooks/deliveries
POST /developeros/webhooks/deliveries/:id/retry
GET  /developeros/environments
POST /developeros/environments
GET  /developeros/pipelines
POST /developeros/pipelines
GET  /developeros/pipeline-runs
POST /developeros/pipelines/:id/run
POST /developeros/pipeline-runs/:id/complete-stage
POST /developeros/pipeline-runs/:id/approve
POST /developeros/deployments
POST /developeros/deployments/:id/promote
POST /developeros/deployments/:id/rollback
GET  /developeros/docs/pages
POST /developeros/docs/pages
POST /developeros/docs/pages/:id/publish
GET  /developeros/changelog
POST /developeros/changelog
POST /developeros/usage/events
GET  /developeros/events
GET  /developeros/audit
```

## API examples

### Create an API product

```bash
curl -X POST http://localhost:4700/developeros/apis \
  -H "Content-Type: application/json" \
  -H "x-role: dev_admin" \
  -d '{
    "name": "CommerceOS Partner API",
    "description": "Partner API for CommerceOS order integrations.",
    "slug": "commerceos-partner-api",
    "visibility": "partner",
    "status": "active",
    "ownerTeam": "CommerceOS"
  }'
```

### Add an endpoint to an API product

```bash
curl -X POST http://localhost:4700/developeros/apis/api_demo_commerce/endpoints \
  -H "Content-Type: application/json" \
  -H "x-role: dev_admin" \
  -d '{
    "method": "GET",
    "path": "/orders",
    "summary": "List orders",
    "scopesRequired": ["orders.read"],
    "rateLimitPerMinute": 120,
    "status": "active"
  }'
```

### Create a developer app

```bash
curl -X POST http://localhost:4700/developeros/apps \
  -H "Content-Type: application/json" \
  -H "x-role: dev_admin" \
  -d '{
    "name": "Commerce Partner App",
    "ownerUserId": "dev_001",
    "environmentIds": ["env_prod"],
    "callbackUrls": ["https://partner.example/callback"],
    "allowedOrigins": ["https://partner.example"],
    "scopes": ["orders.read"]
  }'
```

### Issue an API key

```bash
curl -X POST http://localhost:4700/developeros/apps/app_demo_partner/api-keys \
  -H "Content-Type: application/json" \
  -H "x-role: dev_admin" \
  -d '{
    "name": "Partner live key",
    "environmentId": "env_prod"
  }'
```

The raw key is returned once as `plainTextKey`. The stored key is hashed and masked.

### Create SDK package and generate a version

```bash
curl -X POST http://localhost:4700/developeros/sdks \
  -H "Content-Type: application/json" \
  -H "x-role: dev_admin" \
  -d '{
    "name": "CommerceOS TypeScript SDK",
    "language": "typescript",
    "apiProductIds": ["api_demo_commerce"]
  }'
```

```bash
curl -X POST http://localhost:4700/developeros/sdks/sdk_demo_ts/versions \
  -H "Content-Type: application/json" \
  -H "x-role: dev_admin" \
  -d '{ "version": "1.1.0", "changelog": "Added order helpers." }'
```

### Test a webhook

```bash
curl -X POST http://localhost:4700/developeros/webhooks/test \
  -H "Content-Type: application/json" \
  -H "x-role: dev_admin" \
  -d '{
    "subscriptionId": "whsub_demo_orders",
    "eventType": "order.created",
    "payload": { "orderId": "ORD-1001" }
  }'
```

### Run and complete a pipeline

```bash
curl -X POST http://localhost:4700/developeros/pipelines/pipe_demo_appneurox_api/run \
  -H "Content-Type: application/json" \
  -H "x-role: dev_admin" \
  -d '{ "commitSha": "release123" }'
```

The default pipeline includes build, test, approval, and deploy stages. Complete stages using:

```bash
curl -X POST http://localhost:4700/developeros/pipeline-runs/<RUN_ID>/complete-stage \
  -H "Content-Type: application/json" \
  -H "x-role: dev_admin" \
  -d '{ "success": true, "log": "Stage completed" }'
```

Approve approval stage:

```bash
curl -X POST http://localhost:4700/developeros/pipeline-runs/<RUN_ID>/approve \
  -H "Content-Type: application/json" \
  -H "x-role: dev_admin" \
  -d '{ "approved": true, "comment": "Approved for deploy" }'
```

### Create deployment

```bash
curl -X POST http://localhost:4700/developeros/deployments \
  -H "Content-Type: application/json" \
  -H "x-role: dev_admin" \
  -d '{
    "environmentId": "env_prod",
    "pipelineRunId": "run_id_here",
    "version": "1.1.0",
    "url": "https://api.appneural.example"
  }'
```

### Ingest usage event

```bash
curl -X POST http://localhost:4700/developeros/usage/events \
  -H "Content-Type: application/json" \
  -H "x-role: dev_admin" \
  -d '{
    "appId": "app_demo_partner",
    "apiKeyId": "key_demo_partner_prod",
    "apiProductId": "api_demo_commerce",
    "endpointId": "ep_demo_orders_list",
    "method": "GET",
    "path": "/orders",
    "statusCode": 200,
    "latencyMs": 89
  }'
```

View analytics:

```bash
curl -H "x-role: dev_admin" http://localhost:4700/developeros/analytics
```

## Roles

```txt
viewer
developer
support_engineer
release_manager
security_reviewer
auditor
dev_admin
admin
owner
```

## Suggested architecture

```txt
DeveloperOS
├── Developer Apps
├── API Keys
├── API Products
├── API Endpoints
├── SDK Packages
├── SDK Versions
├── Webhook Subscriptions
├── Webhook Deliveries
├── Environments
├── CI/CD Pipelines
├── Pipeline Runs
├── Deployments
├── Docs Pages
├── Changelog
├── Usage Analytics
├── Events
└── Audit Logs
```

## Production notes

This starter uses a JSON file store for easy local execution. For production:

1. Replace `DataStore` with PostgreSQL repositories.
2. Use `database/schema.sql` as a production schema starting point.
3. Encrypt environment variables and webhook/API key secrets.
4. Replace the demo pipeline engine with GitHub Actions, GitLab CI, Jenkins, or an internal runner.
5. Replace demo webhook delivery with real HTTP delivery, retry backoff, and signed payload verification.
6. Add OpenAPI generation and package registry publishing for SDKs.

## Planning Alignment

- Official package: `@appneurox/developeros`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/developer`
- Modes: standalone and PlatformOS integrated
- Related systems: PlatformOS, SecurityOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
