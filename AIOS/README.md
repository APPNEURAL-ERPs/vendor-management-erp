# AIOS Complete Starter

AIOS is the reusable Artificial Intelligence Operating System layer for Appneural platforms.
It manages AI agents, prompt templates, LLM model configuration, RAG knowledge retrieval, tools, guardrails, conversations, automations, evaluations, analytics, event logs, permissions, and audit logs.

This starter is written in TypeScript and runs with zero external npm dependencies. It uses a JSON file store for local development and includes a PostgreSQL schema for production migration.

## What is included

- Model provider management
- LLM model catalog
- Mock deterministic LLM completion engine
- Versioned prompt templates
- Prompt rendering
- Knowledge bases
- Document ingestion
- Text chunking and keyword indexing
- RAG search and answer generation
- AI tools
- Built-in calculator, summarizer, task creator, and OS event emitter
- Guardrail input/output scanning
- AI agent definitions
- Agent run lifecycle
- Tool execution during agent runs
- Conversation memory
- Event-triggered AI automations
- Evaluation suites and evaluation runs
- Usage metrics
- Event logs
- Audit logs
- Role-based permissions
- Seed demo data
- PostgreSQL schema example
- Automated tests

## Run locally

```bash
npm run build
npm start
```

Open:

```txt
http://localhost:5700/health
http://localhost:5700/docs
```

Default tenant:

```txt
demo-tenant
```

Use request headers:

```txt
x-role: ai_engineer
x-tenant-id: demo-tenant
x-user-id: user_demo
```

Available roles:

```txt
owner
admin
ai_admin
ai_engineer
agent_operator
knowledge_manager
viewer
```

## Main demo IDs

```txt
provider_mock
model_mock_mind
model_mock_embed
prompt_rag_answer
prompt_agent_assistant
prompt_event_triage
kb_appneural_os
doc_aios_architecture
doc_rag_playbook
doc_agent_tooling
tool_calculator
tool_summarizer
tool_task_creator
tool_os_event_emitter
guardrail_safe_ai
guardrail_rag_citations
agent_business_assistant
agent_rag_researcher
auto_support_question
auto_document_uploaded_summary
evalsuite_aios_basics
```

## Example: RAG query

```bash
curl -X POST http://localhost:5700/aios/rag/query \
  -H "Content-Type: application/json" \
  -H "x-role: agent_operator" \
  -d '{
    "query": "What is RAG in AIOS?",
    "knowledgeBaseIds": ["kb_appneural_os"]
  }'
```

## Example: Run AI agent

```bash
curl -X POST http://localhost:5700/aios/agents/agent_business_assistant/run \
  -H "Content-Type: application/json" \
  -H "x-role: agent_operator" \
  -d '{
    "input": "Explain AIOS agents and RAG"
  }'
```

## Example: Agent using calculator tool

```bash
curl -X POST http://localhost:5700/aios/agents/agent_business_assistant/run \
  -H "Content-Type: application/json" \
  -H "x-role: agent_operator" \
  -d '{
    "input": "calculate 12 + 18 and explain AIOS tools"
  }'
```

## Example: Add a document

```bash
curl -X POST http://localhost:5700/aios/documents \
  -H "Content-Type: application/json" \
  -H "x-role: knowledge_manager" \
  -d '{
    "knowledgeBaseId": "kb_appneural_os",
    "title": "New AIOS Policy",
    "sourceType": "text",
    "content": "AIOS answers must use retrieved context where possible and include citations for RAG responses."
  }'
```

## Example: Event automation

```bash
curl -X POST http://localhost:5700/aios/events/ingest \
  -H "Content-Type: application/json" \
  -H "x-role: agent_operator" \
  -d '{
    "type": "support.question",
    "source": "ClientOS",
    "data": {
      "question": "How does AIOS use RAG?"
    }
  }'
```

## Folder structure

```txt
aios-complete/
├── src/
│   ├── core/
│   ├── engines/
│   ├── modules/
│   ├── services/
│   ├── scripts/
│   ├── seed-state.ts
│   ├── docs.ts
│   └── main.ts
├── database/
│   └── schema.sql
├── tests/
│   └── aios.test.cjs
├── package.json
└── tsconfig.json
```

## Production notes

For production:

1. Replace the JSON file store with PostgreSQL using `database/schema.sql`.
2. Replace the mock provider with real LLM providers.
3. Replace keyword search with embeddings and a vector database.
4. Connect permissions to SecurityOS.
5. Connect usage metrics to AnalyticsOS.
6. Connect event-triggered workflows to AutomationOS.
7. Store secrets in SecurityOS or a real KMS/HSM.
8. Add rate limits, tenant isolation checks, and production observability.

## Development commands

```bash
npm run build
npm test
npm run seed
npm start
```

## Planning Alignment

- Official package: `@appneurox/aios`
- Manifest: `manifest.json`
- Domain API namespace: `/v1/ai`
- Modes: standalone and PlatformOS integrated
- Related systems: PlatformOS, SecurityOS

See `docs/planning.md` for the planning contract applied from `APPNEURAL Plannings/OSs`.
## Related OSs

- platformos
- securityos
