-- AutomationOS PostgreSQL schema starter.
-- The TypeScript implementation uses a JSON file store for local development.
-- Use this schema when replacing the in-memory/file store with PostgreSQL.

CREATE TABLE automation_workflows (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]',
  trigger JSONB NOT NULL,
  variables JSONB NOT NULL DEFAULT '{}',
  steps JSONB NOT NULL DEFAULT '[]',
  retry_policy JSONB NOT NULL DEFAULT '{}',
  timeout_seconds INTEGER NOT NULL DEFAULT 300,
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, key)
);

CREATE TABLE automation_executions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workflow_id TEXT NOT NULL REFERENCES automation_workflows(id),
  workflow_key TEXT NOT NULL,
  workflow_version INTEGER NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_event_id TEXT,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  current_step_id TEXT,
  input JSONB NOT NULL DEFAULT '{}',
  context JSONB NOT NULL DEFAULT '{}',
  logs JSONB NOT NULL DEFAULT '[]',
  approval_ids JSONB NOT NULL DEFAULT '[]',
  task_ids JSONB NOT NULL DEFAULT '[]',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE automation_approvals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workflow_id TEXT,
  execution_id TEXT,
  step_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  approver_role TEXT,
  approver_user_ids JSONB NOT NULL DEFAULT '[]',
  decision_by TEXT,
  decision_at TIMESTAMPTZ,
  decision_note TEXT,
  due_at TIMESTAMPTZ,
  payload JSONB NOT NULL DEFAULT '{}',
  resume_step_id TEXT,
  reject_step_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE automation_tasks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  assignee_role TEXT,
  assignee_id TEXT,
  workflow_id TEXT,
  execution_id TEXT,
  due_at TIMESTAMPTZ,
  payload JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE automation_schedules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  workflow_id TEXT NOT NULL REFERENCES automation_workflows(id),
  expression TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  payload JSONB NOT NULL DEFAULT '{}',
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, key)
);

CREATE TABLE automation_connectors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE automation_notifications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  workflow_id TEXT,
  execution_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE automation_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  actor_id TEXT,
  role TEXT,
  correlation_id TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  handled_execution_ids JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE automation_audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  role TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_automation_workflows_tenant_status ON automation_workflows(tenant_id, status);
CREATE INDEX idx_automation_executions_tenant_status ON automation_executions(tenant_id, status);
CREATE INDEX idx_automation_approvals_tenant_status ON automation_approvals(tenant_id, status);
CREATE INDEX idx_automation_tasks_tenant_status ON automation_tasks(tenant_id, status);
CREATE INDEX idx_automation_events_tenant_type ON automation_events(tenant_id, type);
