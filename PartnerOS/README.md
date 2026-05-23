# PartnerOS

**PartnerOS** is a reusable operating layer for Agencies, resellers, affiliates, partner ecosystem.

Related systems: GrowthOS / SalesOS.

This project follows the same dependency-free TypeScript starter style used by the other OS layers. It runs with Node.js 20+ and stores demo data in a JSON file.

## What is included

- Partner management
- Program management
- Deal desk workflows
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
http://localhost:6000/health
http://localhost:6000/docs
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: partneros_admin
x-user-id: user-001
```

## Example

```bash
curl http://localhost:6000/partneros/overview \
  -H "x-role: partneros_admin"
```

For production, replace the JSON file store with PostgreSQL using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/partneros`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/partner`
- Modes: standalone and PlatformOS integrated
- Related systems: GrowthOS, SalesOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
