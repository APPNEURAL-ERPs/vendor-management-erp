-- BrandOS PostgreSQL starter schema
-- Replace the JSON file store with these tables for production.

CREATE TABLE brand_kits (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  logo_asset_ids JSONB NOT NULL DEFAULT '[]',
  color_palette JSONB NOT NULL DEFAULT '[]',
  typography JSONB NOT NULL DEFAULT '{}',
  voice JSONB NOT NULL DEFAULT '{}',
  social_profiles JSONB NOT NULL DEFAULT '[]',
  guidelines JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE brand_assets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  brand_kit_id TEXT REFERENCES brand_kits(id),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  tags JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  folder TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE brand_asset_versions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  asset_id TEXT NOT NULL REFERENCES brand_assets(id),
  version INTEGER NOT NULL,
  url TEXT NOT NULL,
  notes TEXT,
  created_by TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE brand_content_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  brand_kit_id TEXT REFERENCES brand_kits(id),
  campaign_id TEXT,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  body TEXT NOT NULL,
  brief TEXT,
  asset_ids JSONB NOT NULL DEFAULT '[]',
  tags JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  compliance_score NUMERIC,
  compliance_passed BOOLEAN,
  created_by TEXT NOT NULL,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE brand_campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  brand_kit_id TEXT REFERENCES brand_kits(id),
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  channels JSONB NOT NULL DEFAULT '[]',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  budget NUMERIC,
  owner_id TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]',
  content_ids JSONB NOT NULL DEFAULT '[]',
  asset_ids JSONB NOT NULL DEFAULT '[]',
  kpis JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE brand_collections (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  asset_ids JSONB NOT NULL DEFAULT '[]',
  tags JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE brand_guideline_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  brand_kit_id TEXT REFERENCES brand_kits(id),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  field TEXT NOT NULL,
  value JSONB,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE brand_approvals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  approver_role TEXT,
  approver_user_ids JSONB NOT NULL DEFAULT '[]',
  decision_by TEXT,
  decision_at TIMESTAMPTZ,
  decision_note TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE brand_publish_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  content_id TEXT NOT NULL REFERENCES brand_content_items(id),
  campaign_id TEXT,
  channel TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  result JSONB,
  error TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE brand_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  actor_id TEXT,
  role TEXT,
  correlation_id TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE brand_audit_logs (
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

CREATE INDEX idx_brand_assets_tenant_status ON brand_assets(tenant_id, status);
CREATE INDEX idx_brand_content_tenant_status ON brand_content_items(tenant_id, status);
CREATE INDEX idx_brand_campaigns_tenant_status ON brand_campaigns(tenant_id, status);
CREATE INDEX idx_brand_approvals_tenant_status ON brand_approvals(tenant_id, status);
CREATE INDEX idx_brand_events_tenant_type ON brand_events(tenant_id, type);
