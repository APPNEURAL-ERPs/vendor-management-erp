# ResearchOS

**ResearchOS** is a reusable operating layer for Market research, user research, competitor intelligence.

Related systems: ProductOS / BusinessOS.

This project follows the same dependency-free TypeScript starter style used by the other OS layers. It runs with Node.js 20+ and stores demo data in a JSON file.

## What is included

- Study management
- Insight management
- Competitor brief workflows
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
http://localhost:6100/health
http://localhost:6100/docs
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: researchos_admin
x-user-id: user-001
```

## Example

```bash
curl http://localhost:6100/researchos/overview \
  -H "x-role: researchos_admin"
```

For production, replace the JSON file store with PostgreSQL using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/researchos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/research`
- Modes: standalone and PlatformOS integrated
- Related systems: ProductOS, BusinessOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
