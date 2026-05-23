-- LearningOS PostgreSQL schema example
-- Multi-tenant tables use tenant_id and are designed to be replaceable with your production auth and SecurityOS layer.

CREATE TABLE learning_students (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  admission_no TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  grade_level TEXT NOT NULL,
  section TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  guardian_ids JSONB NOT NULL DEFAULT '[]',
  tags JSONB NOT NULL DEFAULT '[]',
  custom_fields JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, admission_no)
);

CREATE TABLE learning_guardians (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  relation TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  student_ids JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE learning_teachers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  employee_no TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject_ids JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, employee_no)
);

CREATE TABLE learning_classes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  section TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  class_teacher_id TEXT,
  capacity INTEGER NOT NULL DEFAULT 40,
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE learning_subjects (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  credits NUMERIC NOT NULL DEFAULT 1,
  teacher_ids JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, code, grade_level)
);

CREATE TABLE learning_enrollments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES learning_students(id),
  class_id TEXT NOT NULL REFERENCES learning_classes(id),
  academic_year TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE learning_attendance_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  class_id TEXT NOT NULL REFERENCES learning_classes(id),
  subject_id TEXT REFERENCES learning_subjects(id),
  teacher_id TEXT NOT NULL REFERENCES learning_teachers(id),
  date DATE NOT NULL,
  period TEXT,
  topic TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE learning_attendance_marks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  session_id TEXT NOT NULL REFERENCES learning_attendance_sessions(id),
  student_id TEXT NOT NULL REFERENCES learning_students(id),
  status TEXT NOT NULL,
  remarks TEXT,
  marked_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, session_id, student_id)
);

CREATE TABLE learning_exams (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  class_id TEXT NOT NULL REFERENCES learning_classes(id),
  subject_id TEXT NOT NULL REFERENCES learning_subjects(id),
  term TEXT NOT NULL,
  exam_date DATE NOT NULL,
  max_marks NUMERIC NOT NULL,
  weightage NUMERIC NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE learning_exam_scores (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  exam_id TEXT NOT NULL REFERENCES learning_exams(id),
  student_id TEXT NOT NULL REFERENCES learning_students(id),
  marks_obtained NUMERIC NOT NULL,
  grade TEXT NOT NULL,
  result TEXT NOT NULL,
  remarks TEXT,
  evaluated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, exam_id, student_id)
);

CREATE TABLE learning_assignments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  class_id TEXT NOT NULL REFERENCES learning_classes(id),
  subject_id TEXT NOT NULL REFERENCES learning_subjects(id),
  teacher_id TEXT NOT NULL REFERENCES learning_teachers(id),
  due_date TIMESTAMPTZ NOT NULL,
  max_marks NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE learning_assignment_submissions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  assignment_id TEXT NOT NULL REFERENCES learning_assignments(id),
  student_id TEXT NOT NULL REFERENCES learning_students(id),
  status TEXT NOT NULL DEFAULT 'assigned',
  submitted_at TIMESTAMPTZ,
  content TEXT,
  attachment_urls JSONB NOT NULL DEFAULT '[]',
  marks NUMERIC,
  grade TEXT,
  feedback TEXT,
  graded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, assignment_id, student_id)
);

CREATE TABLE learning_timetable_entries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  class_id TEXT NOT NULL REFERENCES learning_classes(id),
  subject_id TEXT NOT NULL REFERENCES learning_subjects(id),
  teacher_id TEXT NOT NULL REFERENCES learning_teachers(id),
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE learning_report_cards (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES learning_students(id),
  class_id TEXT NOT NULL REFERENCES learning_classes(id),
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  attendance_percent NUMERIC NOT NULL,
  subject_results JSONB NOT NULL DEFAULT '[]',
  total_marks NUMERIC NOT NULL,
  max_marks NUMERIC NOT NULL,
  overall_percent NUMERIC NOT NULL,
  overall_grade TEXT NOT NULL,
  result TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  generated_by TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, student_id, class_id, term, academic_year)
);

CREATE TABLE learning_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'LearningOS',
  actor_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE learning_audit_logs (
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

CREATE INDEX idx_learning_students_tenant_status ON learning_students (tenant_id, status);
CREATE INDEX idx_learning_enrollments_class_status ON learning_enrollments (tenant_id, class_id, status);
CREATE INDEX idx_learning_attendance_session ON learning_attendance_marks (tenant_id, session_id);
CREATE INDEX idx_learning_exam_scores_student ON learning_exam_scores (tenant_id, student_id);
CREATE INDEX idx_learning_submissions_assignment ON learning_assignment_submissions (tenant_id, assignment_id);
CREATE INDEX idx_learning_events_tenant_created ON learning_events (tenant_id, created_at DESC);
