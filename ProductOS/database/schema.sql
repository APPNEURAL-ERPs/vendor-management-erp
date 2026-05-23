-- ProductOS PostgreSQL schema example
-- Replace the local JSON store with these tables for production usage.

CREATE TABLE productos_products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  product_code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  lifecycle_stage TEXT NOT NULL,
  status TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  market TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  target_launch_date DATE,
  custom_fields JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, product_code)
);

CREATE TABLE productos_versions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES productos_products(id),
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  release_date DATE,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, product_id, version)
);

CREATE TABLE productos_roadmap_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  roadmap_number TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES productos_products(id),
  title TEXT NOT NULL,
  description TEXT,
  quarter TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  start_date DATE,
  due_date DATE,
  linked_feature_ids JSONB NOT NULL DEFAULT '[]',
  completed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, roadmap_number)
);

CREATE TABLE productos_requirements (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  requirement_number TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES productos_products(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_by TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, requirement_number)
);

CREATE TABLE productos_features (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  feature_number TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES productos_products(id),
  requirement_id TEXT REFERENCES productos_requirements(id),
  roadmap_item_id TEXT REFERENCES productos_roadmap_items(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  effort_points NUMERIC(12, 2) NOT NULL DEFAULT 1,
  value_score NUMERIC(12, 2) NOT NULL DEFAULT 50,
  risk_score NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tags JSONB NOT NULL DEFAULT '[]',
  released_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, feature_number)
);

CREATE TABLE productos_backlog_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  backlog_number TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES productos_products(id),
  feature_id TEXT REFERENCES productos_features(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  assignee_id TEXT,
  sprint TEXT,
  effort_points NUMERIC(12, 2) NOT NULL DEFAULT 1,
  completed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, backlog_number)
);

CREATE TABLE productos_releases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  release_number TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES productos_products(id),
  version_id TEXT REFERENCES productos_versions(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  planned_date DATE NOT NULL,
  released_at TIMESTAMPTZ,
  feature_ids JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  release_manager_id TEXT NOT NULL,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, release_number)
);

CREATE TABLE productos_components (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_cost NUMERIC(18, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  supplier TEXT,
  status TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, sku)
);

CREATE TABLE productos_boms (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  bom_number TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES productos_products(id),
  version_id TEXT REFERENCES productos_versions(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  lines JSONB NOT NULL DEFAULT '[]',
  total_cost NUMERIC(18, 2) NOT NULL DEFAULT 0,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, bom_number)
);

CREATE TABLE productos_change_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  change_number TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES productos_products(id),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  title TEXT NOT NULL,
  reason TEXT NOT NULL,
  impact TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, change_number)
);

CREATE TABLE productos_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event TEXT NOT NULL,
  source TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE productos_audit_logs (
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

CREATE INDEX idx_productos_products_tenant ON productos_products(tenant_id);
CREATE INDEX idx_productos_features_product ON productos_features(tenant_id, product_id);
CREATE INDEX idx_productos_releases_product ON productos_releases(tenant_id, product_id);
CREATE INDEX idx_productos_roadmap_product ON productos_roadmap_items(tenant_id, product_id);
CREATE INDEX idx_productos_boms_product ON productos_boms(tenant_id, product_id);
CREATE INDEX idx_productos_events_tenant_created ON productos_events(tenant_id, created_at DESC);
CREATE INDEX idx_productos_audit_tenant_created ON productos_audit_logs(tenant_id, created_at DESC);
