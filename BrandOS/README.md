# BrandOS

**BrandOS** is a reusable brand operating layer for Appneural-style platforms. It manages brand kits, assets, content, campaigns, compliance rules, approvals, publishing, events, permissions, and audit logs.

This project is intentionally dependency-free TypeScript so it can run as a starter service without Express/NestJS. You can later move the same domain/service logic into NestJS or another framework.

## What is included

- Brand kit management
- Brand asset library
- Asset versioning
- Media collections
- Content creation and status lifecycle
- Campaign management
- Campaign rollups
- Brand compliance engine
- Guideline/rule management
- Approval requests and decisions
- Content scheduling and publishing
- Event logs
- Audit logs
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
http://localhost:4300/health
http://localhost:4300/docs
```

## Default tenant

```txt
demo-tenant
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: brand_manager
x-user-id: user-001
```

Roles:

```txt
owner
admin
brand_manager
designer
content_creator
marketer
approver
viewer
```

## Main demo IDs

```txt
kit_appneural_master
asset_logo_primary
asset_hero_ai
asset_social_template
cnt_launch_linkedin
camp_appneurox_launch
```

## Example: create an asset

```bash
curl -X POST http://localhost:4300/brandos/assets \
  -H "Content-Type: application/json" \
  -H "x-role: designer" \
  -d '{
    "brandKitId": "kit_appneural_master",
    "name": "New launch banner",
    "type": "image",
    "url": "https://assets.example/banner.png",
    "tags": ["launch", "banner", "website"]
  }'
```

## Example: check compliance

```bash
curl -X POST http://localhost:4300/brandos/compliance/check \
  -H "Content-Type: application/json" \
  -H "x-role: content_creator" \
  -d '{
    "brandKitId": "kit_appneural_master",
    "title": "Appneural launch",
    "body": "Appneural helps teams build reusable OS layers. #Appneural",
    "tags": ["launch"]
  }'
```

## Example: schedule approved content

```bash
curl -X POST http://localhost:4300/brandos/content/cnt_launch_linkedin/schedule \
  -H "Content-Type: application/json" \
  -H "x-role: marketer" \
  -d '{"scheduledAt":"2026-05-20T10:00:00.000Z"}'
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
 ├── engines/
 │    ├── campaign-engine.ts
 │    └── compliance-engine.ts
 ├── modules/
 │    └── routes.ts
 ├── services/
 │    └── brand.service.ts
 ├── scripts/
 │    └── seed.ts
 ├── docs.ts
 ├── main.ts
 └── seed-state.ts
```

## Production notes

The starter uses a JSON file store at `data/brandos.db.json`. For production, replace `DataStore` with PostgreSQL using `database/schema.sql`.

Recommended integrations:

```txt
BrandOS → WebsiteOS: pages, CMS, SEO content
BrandOS → GrowthOS: campaigns, funnels, leads
BrandOS → AnalyticsOS: content performance and campaign KPIs
BrandOS → AutomationOS: review reminders and publishing workflows
BrandOS → SecurityOS: RBAC, audit, compliance
BrandOS → AIOS: AI copy generation and brand voice checks
```

## Planning Alignment

- Official package: `@appneurox/brandos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/brand`
- Modes: standalone and PlatformOS integrated
- Related systems: AIOS, WebsiteOS, GrowthOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
