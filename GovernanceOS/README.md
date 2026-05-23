# GovernanceOS

**GovernanceOS** is a reusable operating layer for Rules, approvals, ownership, decision rights.

Related systems: BusinessOS / SecurityOS.

This project follows the same dependency-free TypeScript starter style used by the other OS layers. It runs with Node.js 20+ and stores demo data in a JSON file.

## What is included

- Rule management
- Approval management
- Ownership record workflows
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
http://localhost:6500/health
http://localhost:6500/docs
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: governanceos_admin
x-user-id: user-001
```

## Example

```bash
curl http://localhost:6500/governanceos/overview \
  -H "x-role: governanceos_admin"
```

For production, replace the JSON file store with PostgreSQL using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/governanceos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/governance`
- Modes: standalone and PlatformOS integrated
- Related systems: BusinessOS, SecurityOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
