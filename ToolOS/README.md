# ToolOS

**ToolOS** is the reusable tool registry and execution gateway for APPNEUROX.

It gives AgenticOS, AutomationOS, CommandOS, and other OS layers a safe way to discover and run tools such as QR generation, PDF generation, domain checks, and brand checks.

## Included

- Tool registry
- Tool manifest validation
- Tool installation and discovery
- Tool execution lifecycle
- Permission checks
- Approval gates for high-risk tools
- Tool policies
- Masked credentials
- Tool usage analytics
- Tool package generator
- Events and audit logs
- Seeded QR, PDF, domain, and brand tools
- API routes under `/v1/tools`
- Tests

## Run

```bash
npm install
npm test
npm start
```

Open:

```txt
http://localhost:6700/health
http://localhost:6700/docs
```

## Example

```bash
curl -X POST http://localhost:6700/v1/tools/tool.qr.generate/execute \
  -H "Content-Type: application/json" \
  -H "x-role: tool_operator" \
  -d '{"text":"upi://pay?pa=demo@appneurox","format":"png"}'
```

## Tool Packages

ToolOS validates manifests with the required APPNEUROX contract:

- identity, package, version, category, and type
- AI support
- input/output schemas
- commands, permissions, and events
- API route, SDK namespace, and CLI namespace
- dependencies, safety rules, and used-by OSs

It can also generate a standalone package from a valid manifest. The generated package includes core, API, SDK, CLI, commands, events, policies, docs, and tests.
## Related OSs

- platformos
- securityos
