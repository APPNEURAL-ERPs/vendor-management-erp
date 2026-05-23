# DataOS

**DataOS** is a reusable operating layer for Data warehouse, lake, pipelines, governance, datasets.

Related systems: AnalyticsOS / PlatformOS.

This project follows the same dependency-free TypeScript starter style used by the other OS layers. It runs with Node.js 20+ and stores demo data in a JSON file.

## What is included

- Dataset management
- Pipeline management
- Governance rule workflows
- Policies
- Workflow runs
- Events and audit logs
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
http://localhost:5100/health
http://localhost:5100/docs
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: dataos_admin
x-user-id: user-001
```

## Example

```bash
curl http://localhost:5100/dataos/overview \
  -H "x-role: dataos_admin"
```

For production, replace the JSON file store with PostgreSQL using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/dataos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/data`
- Modes: standalone and PlatformOS integrated
- Related systems: AnalyticsOS, PlatformOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
