-- ClientOS PostgreSQL schema starter
-- This schema mirrors the JSON file store used by the TypeScript starter.

CREATE TABLE IF NOT EXISTS client_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  lifecycle_stage TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  primary_email TEXT,
  primary_phone TEXT,
  owner_user_id TEXT,
  health_score INTEGER NOT NULL DEFAULT 80,
  annual_value NUMERIC,
  currency TEXT DEFAULT 'INR',
  addresses JSONB NOT NULL DEFAULT '[]',
  tags JSONB NOT NULL DEFAULT '[]',
  custom_fields JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS client_contacts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT REFERENCES client_accounts(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role_title TEXT,
  department TEXT,
  decision_maker BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL,
  preferred_channel TEXT NOT NULL,
  consent_status TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]',
  custom_fields JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS client_opportunities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT NOT NULL REFERENCES client_accounts(id),
  contact_id TEXT REFERENCES client_contacts(id),
  name TEXT NOT NULL,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  probability INTEGER NOT NULL DEFAULT 10,
  expected_close_date TIMESTAMPTZ,
  owner_user_id TEXT,
  source TEXT,
  products JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  lost_reason TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS client_sla_policies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  priority TEXT NOT NULL,
  first_response_minutes INTEGER NOT NULL,
  resolution_minutes INTEGER NOT NULL,
  business_hours_only BOOLEAN NOT NULL DEFAULT FALSE,
  escalation_user_ids JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS client_tickets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  ticket_number TEXT NOT NULL,
  account_id TEXT REFERENCES client_accounts(id),
  contact_id TEXT REFERENCES client_contacts(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  severity TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  assigned_to_user_id TEXT,
  team TEXT,
  sla_policy_id TEXT REFERENCES client_sla_policies(id),
  first_response_due_at TIMESTAMPTZ,
  resolution_due_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  resolution_summary TEXT,
  satisfaction_score NUMERIC,
  tags JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS client_notes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  note TEXT NOT NULL,
  visibility TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  tags JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS client_interactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  account_id TEXT,
  contact_id TEXT,
  channel TEXT NOT NULL,
  direction TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  participants JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS client_tasks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  related_type TEXT,
  related_id TEXT,
  assigned_to_user_id TEXT,
  due_at TIMESTAMPTZ,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS client_segments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '{}',
  account_ids JSONB NOT NULL DEFAULT '[]',
  dynamic BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL,
  owner_user_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS client_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  actor_id TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS client_audit_logs (
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

CREATE INDEX IF NOT EXISTS idx_client_accounts_tenant_status ON client_accounts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_client_contacts_tenant_account ON client_contacts(tenant_id, account_id);
CREATE INDEX IF NOT EXISTS idx_client_tickets_tenant_status ON client_tickets(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_client_tickets_tenant_priority ON client_tickets(tenant_id, priority);
CREATE INDEX IF NOT EXISTS idx_client_opportunities_tenant_stage ON client_opportunities(tenant_id, stage);
CREATE INDEX IF NOT EXISTS idx_client_events_tenant_type ON client_events(tenant_id, type);
