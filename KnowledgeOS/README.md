# KnowledgeOS

**KnowledgeOS** is a reusable operating layer for Internal knowledge, docs, memory, wiki, RAG knowledge base.

Related systems: LearningOS / AIOS.

This project follows the same dependency-free TypeScript starter style used by the other OS layers. It runs with Node.js 20+ and stores demo data in a JSON file.

## What is included

- Article management
- Knowledge base management
- Memory workflows
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
http://localhost:5200/health
http://localhost:5200/docs
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: knowledgeos_admin
x-user-id: user-001
```

## Example

```bash
curl http://localhost:5200/knowledgeos/overview \
  -H "x-role: knowledgeos_admin"
```

For production, replace the JSON file store with PostgreSQL using `database/schema.sql`.

## Planning Alignment

- Official package: `@appneurox/knowledgeos`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/knowledge`
- Modes: standalone and PlatformOS integrated
- Related systems: LearningOS, AIOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
