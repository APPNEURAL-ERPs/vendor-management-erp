# CommunityOS

**CommunityOS** is a reusable operating layer for Community, forums, ambassadors, events, members.

Related systems: GrowthOS / ExperienceOS.

This project follows the same dependency-free TypeScript starter style used by the other OS layers. It runs with Node.js 20+ and stores demo data in a JSON file.

## What is included

- Member management
- Forum management
- Event workflows
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
http://localhost:5900/health
http://localhost:5900/docs
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: communityos_admin
x-user-id: user-001
```

## Example

```bash
curl http://localhost:5900/communityos/overview \
  -H "x-role: communityos_admin"
```

For production, replace the JSON file store with PostgreSQL using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/communityos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/community`
- Modes: standalone and PlatformOS integrated
- Related systems: GrowthOS, ExperienceOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
