# InfrastructureOS

**InfrastructureOS** is a reusable operating layer for Cloud, servers, deployments, networking, observability.

Related systems: PlatformOS / DeveloperOS.

This project follows the same dependency-free TypeScript starter style used by the other OS layers. It runs with Node.js 20+ and stores demo data in a JSON file.

## What is included

- Resource management
- Deployment target management
- Monitor workflows
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
http://localhost:6400/health
http://localhost:6400/docs
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: infrastructureos_admin
x-user-id: user-001
```

## Example

```bash
curl http://localhost:6400/infrastructureos/overview \
  -H "x-role: infrastructureos_admin"
```

For production, replace the JSON file store with PostgreSQL using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/infrastructureos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/infrastructure`
- Modes: standalone and PlatformOS integrated
- Related systems: PlatformOS, DeveloperOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
