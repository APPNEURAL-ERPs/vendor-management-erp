-- DeveloperOS PostgreSQL schema starter
-- Replace the JSON file store with these normalized tables for production.

CREATE TABLE developeros_developer_apps (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  environment_ids JSONB NOT NULL DEFAULT '[]',
  callback_urls JSONB NOT NULL DEFAULT '[]',
  allowed_origins JSONB NOT NULL DEFAULT '[]',
  scopes JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE developeros_api_keys (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  app_id TEXT NOT NULL REFERENCES developeros_developer_apps(id),
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  masked_key TEXT NOT NULL,
  environment_id TEXT,
  scopes JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE developeros_api_products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL,
  version TEXT NOT NULL,
  base_path TEXT NOT NULL,
  visibility TEXT NOT NULL,
  status TEXT NOT NULL,
  owner_team TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE(tenant_id, slug)
);

CREATE TABLE developeros_api_endpoints (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  api_product_id TEXT NOT NULL REFERENCES developeros_api_products(id),
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  summary TEXT NOT NULL,
  scopes_required JSONB NOT NULL DEFAULT '[]',
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE developeros_sdk_packages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  language TEXT NOT NULL,
  api_product_ids JSONB NOT NULL DEFAULT '[]',
  latest_version TEXT,
  status TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE developeros_sdk_versions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sdk_package_id TEXT NOT NULL REFERENCES developeros_sdk_packages(id),
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  artifact_path TEXT NOT NULL,
  generated_code TEXT,
  changelog TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE developeros_webhook_subscriptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  app_id TEXT NOT NULL REFERENCES developeros_developer_apps(id),
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  event_types JSONB NOT NULL DEFAULT '[]',
  secret_hash TEXT,
  signing_algorithm TEXT NOT NULL DEFAULT 'hmac-sha256',
  retry_policy JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE developeros_webhook_deliveries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  subscription_id TEXT REFERENCES developeros_webhook_subscriptions(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  response_status INTEGER,
  error TEXT,
  signature TEXT,
  next_retry_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE developeros_environments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '{}',
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE(tenant_id, slug)
);

CREATE TABLE developeros_pipelines (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  repository TEXT NOT NULL,
  branch TEXT NOT NULL,
  environment_id TEXT REFERENCES developeros_environments(id),
  stages JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE developeros_pipeline_runs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  pipeline_id TEXT NOT NULL REFERENCES developeros_pipelines(id),
  status TEXT NOT NULL,
  commit_sha TEXT,
  triggered_by TEXT NOT NULL,
  stage_results JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  approval JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE developeros_deployments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  pipeline_run_id TEXT REFERENCES developeros_pipeline_runs(id),
  environment_id TEXT NOT NULL REFERENCES developeros_environments(id),
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  url TEXT,
  deployed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE developeros_docs_pages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  body TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  visibility TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE(tenant_id, slug)
);

CREATE TABLE developeros_changelog_entries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  version TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE developeros_usage_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  app_id TEXT,
  api_key_id TEXT,
  api_product_id TEXT,
  endpoint_id TEXT,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE developeros_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  actor_id TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE developeros_audit_logs (
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

CREATE INDEX idx_developeros_apps_tenant ON developeros_developer_apps(tenant_id);
CREATE INDEX idx_developeros_keys_app ON developeros_api_keys(app_id);
CREATE INDEX idx_developeros_usage_tenant_time ON developeros_usage_events(tenant_id, timestamp DESC);
CREATE INDEX idx_developeros_events_tenant_time ON developeros_events(tenant_id, created_at DESC);
CREATE INDEX idx_developeros_audit_tenant_time ON developeros_audit_logs(tenant_id, created_at DESC);
