# ComplianceOS

**ComplianceOS** is a reusable operating layer for Policies, legal checks, audits, regulatory compliance.

Related systems: SecurityOS.

This project follows the same dependency-free TypeScript starter style used by the other OS layers. It runs with Node.js 20+ and stores demo data in a JSON file.

## What is included

- Control management
- Audit management
- Policy workflows
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
http://localhost:5700/health
http://localhost:5700/docs
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: complianceos_admin
x-user-id: user-001
```

## Example

```bash
curl http://localhost:5700/complianceos/overview \
  -H "x-role: complianceos_admin"
```

For production, replace the JSON file store with PostgreSQL using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/complianceos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/compliance`
- Modes: standalone and PlatformOS integrated
- Related systems: SecurityOS, GovernanceOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
