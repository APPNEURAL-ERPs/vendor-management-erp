# ContentOS

**ContentOS** is a reusable operating layer for Content calendar, blogs, social posts, media, publishing.

Related systems: BrandOS / WebsiteOS / GrowthOS.

This project follows the same dependency-free TypeScript starter style used by the other OS layers. It runs with Node.js 20+ and stores demo data in a JSON file.

## What is included

- Content item management
- Campaign management
- Publishing task workflows
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
http://localhost:5300/health
http://localhost:5300/docs
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: contentos_admin
x-user-id: user-001
```

## Example

```bash
curl http://localhost:5300/contentos/overview \
  -H "x-role: contentos_admin"
```

For production, replace the JSON file store with PostgreSQL using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/contentos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/content`
- Modes: standalone and PlatformOS integrated
- Related systems: BrandOS, WebsiteOS, GrowthOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- brandos
