# QualityOS

**QualityOS** is a reusable operating layer for QA, testing, release quality, bug tracking.

Related systems: DeveloperOS / ProductOS.

This project follows the same dependency-free TypeScript starter style used by the other OS layers. It runs with Node.js 20+ and stores demo data in a JSON file.

## What is included

- Test suite management
- Bug management
- Quality gate workflows
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
http://localhost:6300/health
http://localhost:6300/docs
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: qualityos_admin
x-user-id: user-001
```

## Example

```bash
curl http://localhost:6300/qualityos/overview \
  -H "x-role: qualityos_admin"
```

For production, replace the JSON file store with PostgreSQL using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/qualityos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/quality`
- Modes: standalone and PlatformOS integrated
- Related systems: DeveloperOS, ProductOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
