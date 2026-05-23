# AgenticOS

**AgenticOS** is the safe execution layer for autonomous and multi-agent workflows in APPNEUROX.

```txt
AIOS      = models, prompts, memory, providers, embeddings
ToolOS    = reusable tools
CommandOS = business command execution
AgenticOS = agent runtime, planning, orchestration, approvals, guardrails, traces, and evals
```

## Included

- Agent registry
- Agent runtime
- Simple deterministic planner
- Tool gateway for ToolOS-style calls
- Command gateway for CommandOS-style calls
- Guardrail engine
- Human approval engine
- Memory manager
- Trace recorder
- Evaluation placeholder
- Agent events and audit logs
- Five MVP agent manifests
- API routes under `/v1/agentic`
- Tests

## Run

```bash
npm install
npm test
npm start
```

Open:

```txt
http://localhost:6600/health
http://localhost:6600/docs
```

## Useful headers

```txt
x-tenant-id: demo-tenant
x-role: agentic_admin
x-user-id: user-001
```

## Example run

```bash
curl -X POST http://localhost:6600/v1/agentic/agents/finance-assistant/run \
  -H "Content-Type: application/json" \
  -H "x-role: agentic_admin" \
  -d '{
    "task": "Create invoice for Acme for 50000 INR, add QR, generate PDF"
  }'
```

If the task includes sending the invoice, the run pauses with `waiting_approval`.
## Related OSs

- aios
- toolos
- securityos
