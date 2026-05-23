# SupportOS

**SupportOS** is a reusable operating layer for Tickets, helpdesk, customer support, issue resolution.

Related systems: ClientOS / ExperienceOS.

This project follows the same dependency-free TypeScript starter style used by the other OS layers. It runs with Node.js 20+ and stores demo data in a JSON file.

## What is included

- Ticket management
- Helpdesk queue management
- Resolution playbook workflows
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
http://localhost:5400/health
http://localhost:5400/docs
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: supportos_admin
x-user-id: user-001
```

## Example

```bash
curl http://localhost:5400/supportos/overview \
  -H "x-role: supportos_admin"
```

For production, replace the JSON file store with PostgreSQL using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/supportos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/support`
- Modes: standalone and PlatformOS integrated
- Related systems: ClientOS, ExperienceOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
