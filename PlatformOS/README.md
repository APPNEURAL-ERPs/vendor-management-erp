# PlatformOS

**PlatformOS** is a reusable platform operating layer for Appneural-style platforms. It manages the platform profile, OS service registry, environments, deployments, integrations, feature flags, releases, health checks, events, permissions, and audit logs.

This project follows the same dependency-free TypeScript starter style used by the other OS layers. It runs with Node.js 20+ and stores demo data in a JSON file.

## What is included

- Platform profile
- OS service registry
- Environment catalog
- Deployment tracking
- OS-to-OS integration contracts
- Platform feature flags
- Release records
- Health checks and service health rollups
- Event logs and audit logs
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
http://localhost:5000/health
http://localhost:5000/docs
```

## Default tenant

```txt
demo-tenant
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: platform_admin
x-user-id: user-001
```

Roles:

```txt
owner
admin
platform_admin
architect
ops_manager
integration_manager
auditor
viewer
```

## Main demo IDs

```txt
platform_appneural
svc_businessos
svc_commandos
svc_commerceos
env_dev
env_prod
dep_commandos_100
int_commerce_command
flag_platform_control_plane
rel_foundation_100
```

## Example: get overview

```bash
curl http://localhost:5000/platformos/overview \
  -H "x-role: platform_admin"
```

## Example: register an OS service

```bash
curl -X POST http://localhost:5000/platformos/services \
  -H "Content-Type: application/json" \
  -H "x-role: platform_admin" \
  -d '{
    "key": "analyticsos",
    "name": "AnalyticsOS",
    "category": "intelligence",
    "ownerTeam": "Analytics",
    "baseUrl": "http://localhost:5100",
    "version": "1.0.0",
    "health": "healthy",
    "capabilities": ["dashboards", "metrics", "reports"]
  }'
```

## Example: create deployment

```bash
curl -X POST http://localhost:5000/platformos/deployments \
  -H "Content-Type: application/json" \
  -H "x-role: ops_manager" \
  -d '{
    "serviceKey": "commandos",
    "environmentKey": "prod",
    "version": "1.0.1",
    "status": "deploying",
    "commitSha": "abc123"
  }'
```

## Example: record health check

```bash
curl -X POST http://localhost:5000/platformos/health-checks \
  -H "Content-Type: application/json" \
  -H "x-role: ops_manager" \
  -d '{
    "serviceKey": "commerceos",
    "environmentKey": "prod",
    "status": "healthy",
    "latencyMs": 120,
    "message": "Recovered"
  }'
```

For production, replace the JSON file store with PostgreSQL using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/platformos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/platform`
- Modes: standalone and PlatformOS integrated
- Related systems: SecurityOS, DeveloperOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- securityos
