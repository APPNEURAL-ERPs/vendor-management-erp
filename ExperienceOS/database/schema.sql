-- ExperienceOS PostgreSQL schema starter
-- Replace the JSON file store with these tables for production usage.

CREATE TABLE experience_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_user_id TEXT,
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  segment TEXT NOT NULL,
  lifecycle_stage TEXT NOT NULL,
  health_score NUMERIC NOT NULL DEFAULT 75,
  tags JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE experience_feedback (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  profile_id TEXT REFERENCES experience_profiles(id),
  source_ref TEXT,
  channel TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  rating NUMERIC,
  score NUMERIC,
  sentiment_score NUMERIC NOT NULL,
  sentiment_label TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]',
  linked_case_id TEXT,
  created_by TEXT NOT NULL,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE experience_surveys (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  target_segment TEXT,
  channel TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  launch_at TIMESTAMPTZ,
  close_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE experience_survey_responses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  survey_id TEXT NOT NULL REFERENCES experience_surveys(id),
  profile_id TEXT REFERENCES experience_profiles(id),
  channel TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  nps_score NUMERIC,
  csat_score NUMERIC,
  ces_score NUMERIC,
  comment TEXT,
  sentiment_score NUMERIC NOT NULL,
  sentiment_label TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE experience_journey_maps (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  persona TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  stages JSONB NOT NULL DEFAULT '[]',
  owner_team TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE experience_touchpoints (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  channel TEXT NOT NULL,
  owner_team TEXT NOT NULL,
  journey_map_id TEXT REFERENCES experience_journey_maps(id),
  stage_id TEXT,
  status TEXT NOT NULL,
  expected_experience TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE experience_journey_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  profile_id TEXT REFERENCES experience_profiles(id),
  journey_map_id TEXT REFERENCES experience_journey_maps(id),
  stage_id TEXT,
  touchpoint_id TEXT REFERENCES experience_touchpoints(id),
  event_type TEXT NOT NULL,
  outcome TEXT NOT NULL,
  score NUMERIC,
  metadata JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE experience_sla_policies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  priority TEXT NOT NULL,
  response_minutes INTEGER NOT NULL,
  resolution_minutes INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE experience_cases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  case_number TEXT NOT NULL,
  profile_id TEXT REFERENCES experience_profiles(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  assigned_to TEXT,
  feedback_ids JSONB NOT NULL DEFAULT '[]',
  sla_policy_id TEXT REFERENCES experience_sla_policies(id),
  response_due_at TIMESTAMPTZ,
  resolution_due_at TIMESTAMPTZ,
  first_responded_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  resolution_summary TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE experience_recovery_actions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  case_id TEXT NOT NULL REFERENCES experience_cases(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  owner_user_id TEXT,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE experience_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE experience_audit_logs (
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

CREATE INDEX idx_experience_profiles_tenant ON experience_profiles(tenant_id);
CREATE INDEX idx_experience_feedback_tenant_status ON experience_feedback(tenant_id, status);
CREATE INDEX idx_experience_cases_tenant_status ON experience_cases(tenant_id, status);
CREATE INDEX idx_experience_survey_responses_survey ON experience_survey_responses(tenant_id, survey_id);
CREATE INDEX idx_experience_journey_events_profile ON experience_journey_events(tenant_id, profile_id);
