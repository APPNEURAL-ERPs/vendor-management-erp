-- AgenticOS PostgreSQL schema starter
-- Replace the JSON DataStore with these tables for production use.

CREATE TABLE IF NOT EXISTS agentic_agents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  model TEXT,
  tools JSONB NOT NULL DEFAULT '[]',
  commands JSONB NOT NULL DEFAULT '[]',
  memory JSONB NOT NULL DEFAULT '{}',
  permissions JSONB NOT NULL DEFAULT '[]',
  guardrails JSONB NOT NULL DEFAULT '[]',
  human_approval JSONB NOT NULL DEFAULT '{}',
  max_cost_per_run NUMERIC NOT NULL DEFAULT 1,
  max_steps INTEGER NOT NULL DEFAULT 12,
  status TEXT NOT NULL,
  owner_team TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS agentic_runs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  user_id TEXT,
  workspace_id TEXT,
  input JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  plan_id TEXT,
  task_id TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  output JSONB,
  error TEXT,
  cost NUMERIC NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS agentic_plans (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  goal TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  validation_issues JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS agentic_approvals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  decided_by TEXT,
  decided_at TIMESTAMPTZ,
  decision_note TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS agentic_memory (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  run_id TEXT,
  scope TEXT NOT NULL,
  scope_id TEXT,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  sensitivity TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS agentic_traces (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  entries JSONB NOT NULL DEFAULT '[]',
  summary TEXT,
  cost NUMERIC NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
