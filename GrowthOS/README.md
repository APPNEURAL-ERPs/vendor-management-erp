# GrowthOS

GrowthOS is a complete runnable TypeScript starter implementation for a reusable growth operating layer.

It handles:

- Lead capture and lifecycle management
- Lead scoring
- Dynamic segments
- Campaigns and marketing metrics
- Funnel stages and funnel memberships
- Touchpoint capture
- Conversion tracking and attribution
- Landing pages and form submissions
- A/B experiments
- Nurture sequences and enrollments
- Growth analytics
- Event logs
- Audit logs
- Role-based permissions
- JSON file persistence for development
- PostgreSQL schema for production migration

## Run

```bash
npm run build
npm start
```

Default server:

```txt
http://localhost:5000
```

Health:

```txt
GET /health
```

Docs:

```txt
GET /docs
```

## Environment

```txt
PORT=5000
DEFAULT_TENANT_ID=demo-tenant
GROWTHOS_DB_FILE=data/growthos.db.json
```

## Auth Headers

GrowthOS uses simple header-based demo auth.

```txt
x-tenant-id: demo-tenant
x-user-id: admin-user
x-role: growth_admin
```

Roles:

```txt
viewer
growth_rep
marketer
campaign_manager
growth_manager
growth_admin
admin
owner
auditor
```

## Demo IDs

```txt
lead_demo_asha
lead_demo_rahul
lead_demo_neha
seg_high_intent
seg_retail
camp_demo_ai_launch
camp_demo_webinar
funnel_demo_growth
lp_demo_ai
exp_demo_headline
seq_demo_high_intent
```

## Quick API Examples

### Create lead

```bash
curl -X POST http://localhost:5000/growthos/leads \
  -H "Content-Type: application/json" \
  -H "x-role: growth_admin" \
  -d '{"firstName":"Maya","email":"maya@example.com","company":"CloudlyUp","source":"linkedin","tags":["saas"],"consent":"opted_in"}'
```

### Capture touchpoint

```bash
curl -X POST http://localhost:5000/growthos/touchpoints \
  -H "Content-Type: application/json" \
  -H "x-role: growth_admin" \
  -d '{"leadId":"lead_demo_asha","campaignId":"camp_demo_ai_launch","eventType":"demo_request","channel":"email","source":"AI Launch"}'
```

### Create conversion

```bash
curl -X POST http://localhost:5000/growthos/conversions \
  -H "Content-Type: application/json" \
  -H "x-role: growth_admin" \
  -d '{"leadId":"lead_demo_asha","campaignId":"camp_demo_ai_launch","type":"revenue","amount":25000,"source":"AI Launch"}'
```

### View analytics

```bash
curl http://localhost:5000/growthos/analytics -H "x-role: growth_admin"
```

## Development Structure

```txt
src/
  core/              data store, security, HTTP router, errors, utilities
  engines/           scoring, segmentation, attribution, funnel metrics
  services/          GrowthService business logic
  modules/           HTTP routes
  seed-state.ts      demo data
  main.ts            server entry

database/
  schema.sql         PostgreSQL schema example

tests/
  growthos.test.cjs  Node test suite
```

## Production Notes

This starter uses JSON file persistence so it can run with zero external dependencies. For production:

1. Replace `DataStore` with PostgreSQL repositories.
2. Replace header auth with SecurityOS / JWT / SSO.
3. Use a queue for campaign event ingestion.
4. Connect AutomationOS for nurture execution.
5. Connect AnalyticsOS for cross-platform dashboards.
6. Connect ClientOS/SalesOS for CRM and pipeline sync.
7. Add rate limiting, PII controls, consent enforcement, and data retention policies.

## Test

```bash
npm test
```

## Planning Alignment

- Official package: `@appneurox/growthos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/growth`
- Modes: standalone and PlatformOS integrated
- Related systems: AnalyticsOS, BrandOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- analyticsos
