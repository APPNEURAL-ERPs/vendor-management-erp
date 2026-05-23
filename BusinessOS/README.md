# BusinessOS

**BusinessOS** is a reusable organization and admin operating layer for Appneural-style platforms. It manages organization profile, branches, departments, teams, settings, feature flags, subscription, policies, notices, onboarding, events, permissions, and audit logs.

This project is intentionally dependency-free TypeScript so it can run as a starter service without Express/NestJS. You can later move the same domain/service logic into NestJS or another framework.

## What is included

- Organization profile management
- Branch/location management
- Department management
- Team management
- Business settings with scoped settings
- Secret setting masking
- Feature flags and rollout percentage
- Subscription/plan record
- Policies with versioning and publishing
- Admin notices
- Onboarding checklist
- Business hierarchy view
- Configuration export and validation
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
http://localhost:4400/health
http://localhost:4400/docs
```

## Default tenant

```txt
demo-tenant
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: business_admin
x-user-id: user-001
```

Roles:

```txt
owner
admin
business_admin
operations_manager
branch_manager
config_manager
auditor
viewer
```

## Main demo IDs

```txt
org_appneural_demo
br_hq
br_remote
dep_engineering
dep_operations
dep_sales
team_platform
team_support
new_admin_console
ai_setup_assistant
sub_demo
pol_operating_hours
notice_launch
```

## Example: get overview

```bash
curl http://localhost:4400/businessos/overview \
  -H "x-role: business_admin"
```

## Example: update organization profile

```bash
curl -X PUT http://localhost:4400/businessos/organization \
  -H "Content-Type: application/json" \
  -H "x-role: business_admin" \
  -d '{
    "displayName": "Appneural",
    "legalName": "Appneural Solutions Private Limited",
    "timezone": "Asia/Kolkata",
    "currency": "INR",
    "contactEmail": "admin@appneural.example"
  }'
```

## Example: create branch

```bash
curl -X POST http://localhost:4400/businessos/branches \
  -H "Content-Type: application/json" \
  -H "x-role: operations_manager" \
  -d '{
    "name": "Mumbai Branch",
    "code": "MUM-001",
    "type": "branch",
    "address": { "city": "Mumbai", "country": "India" },
    "managerUserId": "user-branch-001"
  }'
```

## Example: create department

```bash
curl -X POST http://localhost:4400/businessos/departments \
  -H "Content-Type: application/json" \
  -H "x-role: operations_manager" \
  -d '{
    "name": "Customer Success",
    "code": "CS",
    "branchIds": ["br_hq"],
    "costCenter": "CC-CS"
  }'
```

## Example: create setting

```bash
curl -X POST http://localhost:4400/businessos/settings \
  -H "Content-Type: application/json" \
  -H "x-role: config_manager" \
  -d '{
    "key": "admin.defaultLocale",
    "label": "Default Admin Locale",
    "category": "admin",
    "value": "en-IN",
    "dataType": "string",
    "validation": { "required": true }
  }'
```

## Example: toggle feature flag

```bash
curl -X PATCH http://localhost:4400/businessos/feature-flags/ai_setup_assistant/toggle \
  -H "Content-Type: application/json" \
  -H "x-role: config_manager" \
  -d '{"enabled": true}'
```

## Example: validate configuration

```bash
curl -X POST http://localhost:4400/businessos/config/validate \
  -H "x-role: business_admin"
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
 │    ├── config-engine.ts
 │    └── hierarchy-engine.ts
 ├── modules/
 │    └── routes.ts
 ├── services/
 │    └── business.service.ts
 ├── docs.ts
 ├── main.ts
 └── seed-state.ts
```

## BusinessOS in the Appneural architecture

```txt
Platform
  └── BusinessOS
       ├── Organization profile
       ├── Branches
       ├── Departments
       ├── Teams
       ├── Settings
       ├── Feature flags
       ├── Subscription
       ├── Policies
       ├── Notices
       └── Onboarding
```

BusinessOS should usually be one of the first OS layers you implement because other OS layers need tenant/company settings, branch structure, configuration, and admin basics.

For production, replace the JSON file store with PostgreSQL using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/businessos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/business`
- Modes: standalone and PlatformOS integrated
- Related systems: PlatformOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
