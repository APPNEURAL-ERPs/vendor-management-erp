# AdminOS

**AdminOS** is a reusable operating layer for Internal admin panel, system controls, configuration.

Related systems: PlatformOS.

This project follows the same dependency-free TypeScript starter style used by the other OS layers. It runs with Node.js 20+ and stores demo data in a JSON file.

## What is included

- Control management
- Admin setting management
- System action workflows
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
http://localhost:6200/health
http://localhost:6200/docs
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: adminos_admin
x-user-id: user-001
```

## Example

```bash
curl http://localhost:6200/adminos/overview \
  -H "x-role: adminos_admin"
```

For production, replace the JSON file store with PostgreSQL using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/adminos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/admin`
- Modes: standalone and PlatformOS integrated
- Related systems: PlatformOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
