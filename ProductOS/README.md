# ProductOS Complete Starter

ProductOS is a reusable product lifecycle operating layer for Appneural-style platforms. It manages product portfolios, versions, roadmap, requirements, features, backlog, releases, BOMs, components, change requests, analytics, events, audit logs, and role-based permissions.

## Stack

- TypeScript
- Node.js HTTP server
- JSON file store for local development
- PostgreSQL schema included for production migration
- No runtime npm dependencies

## Run

```bash
npm run build
npm start
```

Open:

```txt
http://localhost:5600/health
http://localhost:5600/docs
http://localhost:5600/productos/overview
```

Default environment:

```txt
PORT=5600
PRODUCTOS_DB_FILE=data/productos.db.json
DEFAULT_TENANT_ID=demo-tenant
```

## Demo tenant and role headers

Use headers when calling protected APIs:

```txt
x-tenant-id: demo-tenant
x-user-id: admin-user
x-role: product_admin
```

Available roles:

```txt
viewer
product_manager
product_owner
roadmap_planner
release_manager
bom_manager
product_admin
admin
owner
auditor
```

## What is included

```txt
ProductOS
├── Products
├── Product Versions
├── Roadmap Items
├── Requirements
├── Features
├── Backlog Items
├── Releases
├── Components
├── Bill of Materials / BOM
├── Change Requests
├── Product Analytics
├── Feature Prioritization Engine
├── BOM Cost Engine
├── Event Logs
├── Audit Logs
└── Permissions
```

## Main demo IDs

```txt
prod_appneurox
prod_brandlyup
prod_devicekit

ver_appneurox_100
ver_appneurox_110
ver_devicekit_alpha

road_q3_ai_agents
road_q3_product_analytics

req_ai_workspace
req_template_gallery
req_hardware_costing

feat_ai_workspace
feat_agent_templates
feat_usage_dashboard
feat_brand_calendar

backlog_agent_builder_ui
backlog_template_filters
backlog_usage_chart

rel_appneurox_100
rel_appneurox_110

comp_llm_credit
comp_vector_storage
comp_device_board
comp_sensor_pack

bom_appneurox_ai
bom_devicekit_alpha
chg_template_scope
```

## API examples

### Create a product

```bash
curl -X POST http://localhost:5600/productos/products \
  -H "Content-Type: application/json" \
  -H "x-role: product_admin" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "productCode": "INTELLISTRA",
    "name": "Intellistra",
    "type": "software",
    "ownerId": "pm_maya",
    "market": "AI Knowledge Systems",
    "tags": ["ai", "knowledge"]
  }'
```

### Create a requirement

```bash
curl -X POST http://localhost:5600/productos/requirements \
  -H "Content-Type: application/json" \
  -H "x-role: product_owner" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "productId": "prod_appneurox",
    "title": "Agent collaboration",
    "description": "Teams need multiple agents to collaborate on one workflow.",
    "source": "customer",
    "priority": "high"
  }'
```

### Create a feature

```bash
curl -X POST http://localhost:5600/productos/features \
  -H "Content-Type: application/json" \
  -H "x-role: product_manager" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "productId": "prod_appneurox",
    "title": "Agent Collaboration",
    "ownerId": "eng_asha",
    "priority": "high",
    "effortPoints": 8,
    "valueScore": 90,
    "riskScore": 20
  }'
```

### Rank features

```bash
curl http://localhost:5600/productos/features/rank?productId=prod_appneurox \
  -H "x-role: viewer" \
  -H "x-tenant-id: demo-tenant"
```

### Create and activate a BOM

```bash
curl -X POST http://localhost:5600/productos/boms \
  -H "Content-Type: application/json" \
  -H "x-role: bom_manager" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "productId": "prod_devicekit",
    "name": "DeviceKit Production BOM",
    "lines": [
      { "componentId": "comp_device_board", "quantity": 1 },
      { "componentId": "comp_sensor_pack", "quantity": 2 }
    ]
  }'
```

### Create a release

```bash
curl -X POST http://localhost:5600/productos/releases \
  -H "Content-Type: application/json" \
  -H "x-role: release_manager" \
  -H "x-tenant-id: demo-tenant" \
  -d '{
    "productId": "prod_appneurox",
    "versionId": "ver_appneurox_110",
    "name": "AppneuroX Agent Workspace",
    "plannedDate": "2026-07-15",
    "featureIds": ["feat_ai_workspace", "feat_agent_templates"]
  }'
```

## Production notes

For production:

1. Replace the JSON file store with PostgreSQL using `database/schema.sql`.
2. Connect ProductOS events to AutomationOS and AnalyticsOS.
3. Use SecurityOS for identity, RBAC, audit, and policy enforcement.
4. Store release assets and product media in object storage.
5. Add CI/CD deployment through DevOS.

## Test

```bash
npm test
```

## Planning Alignment

- Official package: `@appneurox/productos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/product`
- Modes: standalone and PlatformOS integrated
- Related systems: ResearchOS, QualityOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
