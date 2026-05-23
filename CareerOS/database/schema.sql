-- CareerOS PostgreSQL schema starter
-- Replace the JSON file store with these tables for production.

CREATE TABLE career_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  workplace_type TEXT NOT NULL,
  openings INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  description TEXT NOT NULL,
  responsibilities JSONB NOT NULL DEFAULT '[]',
  requirements JSONB NOT NULL DEFAULT '[]',
  required_skills JSONB NOT NULL DEFAULT '[]',
  nice_to_have_skills JSONB NOT NULL DEFAULT '[]',
  experience_min_years NUMERIC NOT NULL DEFAULT 0,
  experience_max_years NUMERIC,
  salary_range JSONB,
  recruiter_id TEXT,
  hiring_manager_id TEXT,
  screening_questions JSONB NOT NULL DEFAULT '[]',
  tags JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, code)
);

CREATE TABLE career_candidates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  current_company TEXT,
  current_title TEXT,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  consent_status TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]',
  skills JSONB NOT NULL DEFAULT '[]',
  experience_years NUMERIC NOT NULL DEFAULT 0,
  linkedin_url TEXT,
  portfolio_url TEXT,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, email)
);

CREATE TABLE career_resumes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL REFERENCES career_candidates(id),
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  text TEXT NOT NULL,
  parsed_skills JSONB NOT NULL DEFAULT '[]',
  experience_years NUMERIC,
  education JSONB NOT NULL DEFAULT '[]',
  certifications JSONB NOT NULL DEFAULT '[]',
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE career_pipeline_stages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  job_id TEXT REFERENCES career_jobs(id),
  template_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  sort_order NUMERIC NOT NULL,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  sla_days NUMERIC,
  interview_required BOOLEAN NOT NULL DEFAULT FALSE,
  scorecard_template TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE career_applications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  job_id TEXT NOT NULL REFERENCES career_jobs(id),
  candidate_id TEXT NOT NULL REFERENCES career_candidates(id),
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  current_stage_id TEXT REFERENCES career_pipeline_stages(id),
  stage_entered_at TIMESTAMPTZ NOT NULL,
  match_score NUMERIC,
  screening_answers JSONB NOT NULL DEFAULT '[]',
  rating NUMERIC,
  rejection_reason TEXT,
  hired_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  tags JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE career_interviews (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  application_id TEXT NOT NULL REFERENCES career_applications(id),
  job_id TEXT NOT NULL REFERENCES career_jobs(id),
  candidate_id TEXT NOT NULL REFERENCES career_candidates(id),
  stage_id TEXT REFERENCES career_pipeline_stages(id),
  title TEXT NOT NULL,
  interview_type TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  timezone TEXT NOT NULL,
  interviewer_user_ids JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  meeting_link TEXT,
  location TEXT,
  notes TEXT,
  created_by TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE career_scorecards (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  interview_id TEXT NOT NULL REFERENCES career_interviews(id),
  application_id TEXT NOT NULL REFERENCES career_applications(id),
  interviewer_user_id TEXT NOT NULL,
  criteria_scores JSONB NOT NULL DEFAULT '{}',
  overall_rating NUMERIC NOT NULL,
  recommendation TEXT NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]',
  concerns JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, interview_id, interviewer_user_id)
);

CREATE TABLE career_offers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  application_id TEXT NOT NULL REFERENCES career_applications(id),
  job_id TEXT NOT NULL REFERENCES career_jobs(id),
  candidate_id TEXT NOT NULL REFERENCES career_candidates(id),
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  compensation JSONB NOT NULL,
  start_date TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  approvals JSONB NOT NULL DEFAULT '[]',
  terms JSONB NOT NULL DEFAULT '[]',
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE career_talent_pools (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  owner_user_id TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  candidate_ids JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE career_events (
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

CREATE TABLE career_audit_logs (
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

CREATE INDEX idx_career_jobs_tenant_status ON career_jobs (tenant_id, status);
CREATE INDEX idx_career_candidates_tenant_status ON career_candidates (tenant_id, status);
CREATE INDEX idx_career_applications_job_status ON career_applications (tenant_id, job_id, status);
CREATE INDEX idx_career_interviews_schedule ON career_interviews (tenant_id, scheduled_at, status);
CREATE INDEX idx_career_offers_status ON career_offers (tenant_id, status);
