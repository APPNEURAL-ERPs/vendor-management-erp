export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "qa_manager" | "qa_engineer" | "tester" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: Role;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface QAProcess extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  type: "manual" | "automated" | "performance" | "security" | "accessibility" | "ux" | "regression";
  ownerId?: UUID;
  assigneeIds: UUID[];
  dueDate?: ISODate;
  completedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface QualityChecklist extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  processId?: UUID;
  items: ChecklistItem[];
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  order: number;
  notes?: string;
}

export interface TestPlan extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  processId?: UUID;
  suiteIds: UUID[];
  assigneeIds: UUID[];
  dueDate?: ISODate;
  completedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface TestSuite extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  planId?: UUID;
  testCaseIds: UUID[];
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface TestCase extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  suiteId?: UUID;
  type: "functional" | "integration" | "e2e" | "unit" | "api" | "ui" | "performance" | "security" | "regression" | "uat";
  priority: "critical" | "high" | "medium" | "low";
  steps: TestStep[];
  prerequisites?: string[];
  expectedResult: string;
  assigneeId?: UUID;
  tags: string[];
  estimatedDuration?: number;
  metadata: Record<string, unknown>;
}

export interface TestStep {
  order: number;
  action: string;
  expectedResult?: string;
  data?: string;
}

export interface TestRun extends BaseEntity {
  name: string;
  description?: string;
  status: EntityStatus;
  planId?: UUID;
  suiteId?: UUID;
  testCaseIds: UUID[];
  results: TestResult[];
  startedAt?: ISODate;
  completedAt?: ISODate;
  assigneeId?: UUID;
  metadata: Record<string, unknown>;
}

export interface TestResult {
  testCaseId: UUID;
  status: "passed" | "failed" | "blocked" | "skipped" | "needs_retest";
  executedAt?: ISODate;
  executedBy?: UUID;
  notes?: string;
  evidenceUrls?: string[];
  bugId?: UUID;
}

export interface Bug extends BaseEntity {
  key: string;
  title: string;
  description?: string;
  status: EntityStatus;
  bugStatus: "open" | "triaged" | "assigned" | "in_progress" | "fixed" | "ready_for_retest" | "retested" | "closed" | "reopened" | "rejected" | "duplicate";
  severity: "critical" | "high" | "medium" | "low" | "cosmetic";
  priority: "critical" | "high" | "medium" | "low";
  assigneeId?: UUID;
  reporterId?: UUID;
  testCaseId?: UUID;
  testRunId?: UUID;
  tags: string[];
  reproductionSteps?: string[];
  environment?: string;
  resolvedAt?: ISODate;
  closedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface BugComment extends BaseEntity {
  bugId: UUID;
  authorId: UUID;
  content: string;
  type: "comment" | "status_change" | "assignment_change" | "evidence";
  metadata: Record<string, unknown>;
}

export interface Feedback extends BaseEntity {
  type: "bug_report" | "feature_request" | "general" | "complaint" | "compliment";
  status: "new" | "reviewed" | "in_progress" | "resolved" | "closed";
  source: "web" | "email" | "in_app" | "support" | "survey";
  rating?: number;
  subject?: string;
  content: string;
  authorId?: UUID;
  authorEmail?: string;
  assigneeId?: UUID;
  relatedEntityType?: string;
  relatedEntityId?: UUID;
  tags: string[];
  resolvedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface SatisfactionSurvey extends BaseEntity {
  name: string;
  description?: string;
  status: EntityStatus;
  questions: SurveyQuestion[];
  responses: SurveyResponse[];
  targetAudience: string;
  createdBy: UUID;
  closedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: "rating" | "text" | "multiple_choice" | "boolean" | "scale";
  required: boolean;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  order: number;
}

export interface SurveyResponse extends BaseEntity {
  surveyId: UUID;
  respondentId?: UUID;
  respondentEmail?: string;
  answers: SurveyAnswer[];
  submittedAt: ISODate;
  metadata: Record<string, unknown>;
}

export interface SurveyAnswer {
  questionId: string;
  value: string | number | boolean | string[];
}

export interface QualityMetric extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  category: "test_coverage" | "defect" | "release_readiness" | "customer_satisfaction" | "process_efficiency" | "code_quality" | "performance" | "security" | "accessibility" | "ux";
  value: number;
  unit?: string;
  target?: number;
  threshold?: number;
  status: "on_track" | "at_risk" | "breached";
  period: "daily" | "weekly" | "monthly" | "quarterly" | "release";
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface QualityReport extends BaseEntity {
  name: string;
  description?: string;
  type: "test_summary" | "bug_analysis" | "release_readiness" | "quality_trend" | "satisfaction" | "coverage" | "custom";
  status: EntityStatus;
  period: { start: ISODate; end: ISODate };
  summary: string;
  metrics: Record<string, unknown>;
  createdBy: UUID;
  metadata: Record<string, unknown>;
}

export interface ReleaseReadiness extends BaseEntity {
  name: string;
  description?: string;
  status: "pending" | "in_progress" | "ready" | "blocked" | "released";
  releaseVersion?: string;
  releaseDate?: ISODate;
  checklist: ReleaseReadinessCheck[];
  blockers: ReleaseBlocker[];
  approvedBy: UUID[];
  approvedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface ReleaseReadinessCheck {
  id: string;
  text: string;
  status: "pending" | "passed" | "failed" | "skipped";
  category: "tests" | "bugs" | "security" | "performance" | "documentation" | "approval";
  notes?: string;
  completedBy?: UUID;
  completedAt?: ISODate;
}

export interface ReleaseBlocker {
  id: string;
  type: "bug" | "security" | "performance" | "documentation" | "approval" | "other";
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  relatedEntityType?: string;
  relatedEntityId?: UUID;
  resolved: boolean;
  resolvedBy?: UUID;
  resolvedAt?: ISODate;
}

export interface RootCauseAnalysis extends BaseEntity {
  name: string;
  description?: string;
  status: EntityStatus;
  issue: string;
  impact: string;
  timeline: string;
  rootCause: string;
  contributingFactors: string[];
  fixApplied: string;
  preventionPlan: string;
  ownerId?: UUID;
  dueDate?: ISODate;
  completedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface QualityEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface QualityOverview {
  processes: { total: number; active: number; completed: number };
  testCases: { total: number; byPriority: Record<string, number>; byStatus: Record<string, number> };
  testRuns: { total: number; passed: number; failed: number; blocked: number };
  bugs: { total: number; open: number; critical: number; byStatus: Record<string, number> };
  feedback: { total: number; new: number; resolved: number; avgRating: number };
  surveys: { total: number; active: number; responses: number };
  metrics: { total: number; onTrack: number; atRisk: number; breached: number };
}

export interface QualityState {
  processes: QAProcess[];
  checklists: QualityChecklist[];
  testPlans: TestPlan[];
  testSuites: TestSuite[];
  testCases: TestCase[];
  testRuns: TestRun[];
  bugs: Bug[];
  bugComments: BugComment[];
  feedback: Feedback[];
  surveys: SatisfactionSurvey[];
  surveyResponses: SurveyResponse[];
  metrics: QualityMetric[];
  reports: QualityReport[];
  releaseReadiness: ReleaseReadiness[];
  rootCauseAnalyses: RootCauseAnalysis[];
  events: QualityEvent[];
  auditLogs: AuditLog[];
}
