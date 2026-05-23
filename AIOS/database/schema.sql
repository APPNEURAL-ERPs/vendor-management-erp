-- AIOS PostgreSQL schema starter
-- Replace the JSON file store with these tables for production deployments.

CREATE TABLE aios_providers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  base_url TEXT,
  masked_api_key TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, key)
);

CREATE TABLE aios_models (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  provider_id TEXT NOT NULL REFERENCES aios_providers(id),
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  family TEXT NOT NULL,
  context_window INTEGER NOT NULL,
  max_output_tokens INTEGER NOT NULL,
  temperature_default NUMERIC NOT NULL DEFAULT 0.2,
  status TEXT NOT NULL,
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, key)
);

CREATE TABLE aios_prompts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  active_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, key)
);

CREATE TABLE aios_prompt_versions (
  prompt_id TEXT NOT NULL REFERENCES aios_prompts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  template TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (prompt_id, version)
);

CREATE TABLE aios_knowledge_bases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  embedding_model_id TEXT REFERENCES aios_models(id),
  chunk_size INTEGER NOT NULL DEFAULT 700,
  chunk_overlap INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, key)
);

CREATE TABLE aios_documents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  knowledge_base_id TEXT NOT NULL REFERENCES aios_knowledge_bases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_uri TEXT,
  status TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE aios_chunks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  knowledge_base_id TEXT NOT NULL REFERENCES aios_knowledge_bases(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES aios_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  token_estimate INTEGER NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX aios_chunks_keywords_idx ON aios_chunks USING GIN (keywords);

CREATE TABLE aios_tools (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  input_schema JSONB NOT NULL DEFAULT '{}',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, key)
);

CREATE TABLE aios_tool_runs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  tool_id TEXT NOT NULL REFERENCES aios_tools(id),
  agent_run_id TEXT,
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE aios_guardrails (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  banned_terms TEXT[] NOT NULL DEFAULT '{}',
  required_terms TEXT[] NOT NULL DEFAULT '{}',
  require_citations BOOLEAN NOT NULL DEFAULT FALSE,
  max_input_length INTEGER,
  max_output_length INTEGER,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, key)
);

CREATE TABLE aios_agents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  model_id TEXT NOT NULL REFERENCES aios_models(id),
  prompt_id TEXT NOT NULL REFERENCES aios_prompts(id),
  knowledge_base_ids TEXT[] NOT NULL DEFAULT '{}',
  tool_ids TEXT[] NOT NULL DEFAULT '{}',
  guardrail_ids TEXT[] NOT NULL DEFAULT '{}',
  memory_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  variables JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, key)
);

CREATE TABLE aios_agent_runs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL REFERENCES aios_agents(id),
  conversation_id TEXT,
  input TEXT NOT NULL,
  rendered_prompt TEXT NOT NULL,
  retrieved_hits JSONB NOT NULL DEFAULT '[]',
  tool_run_ids TEXT[] NOT NULL DEFAULT '{}',
  output TEXT NOT NULL,
  status TEXT NOT NULL,
  usage JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE aios_conversations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT REFERENCES aios_agents(id),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE aios_messages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES aios_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  agent_run_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE aios_automations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '[]',
  action TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, key)
);

CREATE TABLE aios_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  correlation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE aios_audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
