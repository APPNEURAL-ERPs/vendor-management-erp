-- GrowthOS PostgreSQL schema example
-- This file mirrors the JSON data model used by the starter.

CREATE TABLE IF NOT EXISTS growth_leads (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  source TEXT NOT NULL,
  owner_id TEXT,
  status TEXT NOT NULL,
  lifecycle_stage TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  tags JSONB NOT NULL DEFAULT '[]',
  consent TEXT NOT NULL DEFAULT 'unknown',
  last_activity_at TIMESTAMPTZ,
  custom_fields JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_segments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  evaluated_count INTEGER NOT NULL DEFAULT 0,
  last_evaluated_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  channel TEXT NOT NULL,
  objective TEXT NOT NULL,
  status TEXT NOT NULL,
  target_segment_id TEXT,
  landing_page_id TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  budget NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  metrics JSONB NOT NULL DEFAULT '{}',
  tags JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_funnels (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  stages JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_funnel_memberships (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  funnel_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  status TEXT NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL,
  moved_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_touchpoints (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  lead_id TEXT,
  anonymous_id TEXT,
  campaign_id TEXT,
  landing_page_id TEXT,
  channel TEXT NOT NULL,
  source TEXT NOT NULL,
  medium TEXT,
  content TEXT,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  value NUMERIC,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_conversions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  campaign_id TEXT,
  funnel_id TEXT,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  attribution_model TEXT NOT NULL,
  source TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_landing_pages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  headline TEXT NOT NULL,
  description TEXT,
  campaign_id TEXT,
  status TEXT NOT NULL,
  form_fields JSONB NOT NULL DEFAULT '[]',
  thank_you_message TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_experiments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  target_metric TEXT NOT NULL,
  status TEXT NOT NULL,
  variants JSONB NOT NULL DEFAULT '[]',
  winner_variant_id TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_nurture_sequences (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  target_segment_id TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  enrollment_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_nurture_enrollments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sequence_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_step_order INTEGER NOT NULL DEFAULT 1,
  enrolled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  last_step_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_audit_logs (
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

CREATE INDEX IF NOT EXISTS idx_growth_leads_tenant_email ON growth_leads (tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_growth_leads_tenant_status ON growth_leads (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_growth_touchpoints_tenant_lead ON growth_touchpoints (tenant_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_growth_conversions_tenant_campaign ON growth_conversions (tenant_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_growth_events_tenant_created ON growth_events (tenant_id, created_at DESC);
