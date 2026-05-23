export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "experiment_admin" | "experimenter" | "analyst" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";

export type ExperimentStatus = "draft" | "planned" | "running" | "paused" | "completed" | "inconclusive" | "winner_selected" | "stopped" | "archived";
export type ExperimentType = "ab_test" | "multivariate_test" | "feature_experiment" | "pricing_experiment" | "landing_page_experiment" | "email_experiment" | "workflow_experiment" | "ai_prompt_experiment" | "ux_experiment" | "growth_experiment";
export type VariantType = "control" | "treatment" | "treatment_2" | "treatment_3";
export type AssignmentStatus = "exposed" | "converted" | "bounced" | "excluded";
export type ObservationType = "exposure" | "conversion" | "guardrail" | "custom";
export type DecisionType = "rollout_winner" | "stop_experiment" | "continue_experiment" | "retest" | "rollback" | "mark_inconclusive" | "followup_experiment";

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

export interface Hypothesis extends BaseEntity {
  hypothesis: string;
  ifStatement: string;
  thenStatement: string;
  becauseStatement?: string;
  problemStatement?: string;
  assumptions: string[];
  successCriteria: string[];
  failureCriteria: string[];
  status: "draft" | "active" | "archived";
}

export interface MetricDefinition extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "primary" | "secondary" | "guardrail";
  unit: string;
  aggregator: "sum" | "count" | "avg" | "min" | "max" | "rate";
  formula?: string;
  status: EntityStatus;
}

export interface AudienceDefinition extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  rules: AudienceRule[];
  estimatedSize?: number;
  status: EntityStatus;
}

export interface AudienceRule {
  field: string;
  operator: "eq" | "neq" | "contains" | "gt" | "lt" | "gte" | "lte" | "in" | "not_in" | "exists" | "not_exists";
  value?: string | number | boolean | string[] | number[];
}

export interface TrafficSplit extends BaseEntity {
  experimentId: UUID;
  splits: Array<{ variantId: UUID; percentage: number }>;
  stickyAssignment: boolean;
  assignmentSeed?: string;
}

export interface Variant extends BaseEntity {
  experimentId: UUID;
  key: string;
  name: string;
  description?: string;
  type: VariantType;
  isControl: boolean;
  trafficPercentage: number;
  config: Record<string, unknown>;
  status: "active" | "locked" | "archived";
}

export interface Experiment extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: ExperimentType;
  hypothesisId?: UUID;
  status: ExperimentStatus;
  audienceId?: UUID;
  primaryMetricId?: UUID;
  secondaryMetricIds: UUID[];
  guardrailMetricIds: UUID[];
  startDate?: ISODate;
  endDate?: ISODate;
  targetSampleSize?: number;
  currentSampleSize: number;
  confidenceLevel: number;
  decisionRule?: string;
  ownerId?: UUID;
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy: UUID;
}

export interface Assignment extends BaseEntity {
  experimentId: UUID;
  variantId: UUID;
  userId: UUID;
  sessionId?: string;
  trafficSplit: number;
  status: AssignmentStatus;
  exposureAt?: ISODate;
  convertedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface Observation extends BaseEntity {
  experimentId: UUID;
  variantId: UUID;
  metricId: UUID;
  type: ObservationType;
  value: number;
  count: number;
  timestamp: ISODate;
  segment?: string;
  metadata: Record<string, unknown>;
}

export interface StatisticalResult extends BaseEntity {
  experimentId: UUID;
  variantId: UUID;
  metricId: UUID;
  sampleSize: number;
  mean: number;
  variance: number;
  standardDeviation: number;
  confidenceInterval: [number, number];
  pValue: number;
  isSignificant: boolean;
  testType: "t_test" | "chi_square" | "mann_whitney" | "bayesian";
  effectSize: number;
  power?: number;
}

export interface Analysis extends BaseEntity {
  experimentId: UUID;
  type: "interim" | "final" | "segment";
  winnerVariantId?: UUID;
  lift: number;
  confidenceLevel: number;
  isConclusive: boolean;
  recommendation: string;
  statisticalResults: StatisticalResult[];
  segmentResults?: Record<string, StatisticalResult[]>;
  guardrailResults: Array<{ metricId: UUID; status: "passed" | "failed"; value: number }>;
  conclusion?: string;
  createdBy: UUID;
}

export interface FeatureFlag extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  experimentId?: UUID;
  enabled: boolean;
  rolloutPercentage: number;
  targetAudience?: UUID;
  rules: Record<string, unknown>;
  status: EntityStatus;
  killSwitch: boolean;
  metadata: Record<string, unknown>;
}

export interface Rollout extends BaseEntity {
  experimentId: UUID;
  variantId: UUID;
  status: "planned" | "in_progress" | "completed" | "paused" | "rolled_back";
  stages: RolloutStage[];
  currentStage: number;
  startedAt?: ISODate;
  completedAt?: ISODate;
}

export interface RolloutStage {
  stage: number;
  name: string;
  percentage: number;
  startDate?: ISODate;
  endDate?: ISODate;
  status: "pending" | "active" | "completed" | "skipped";
}

export interface Decision extends BaseEntity {
  experimentId: UUID;
  type: DecisionType;
  variantId?: UUID;
  status: "pending" | "approved" | "rejected" | "applied";
  reason: string;
  decidedBy?: UUID;
  decidedAt?: ISODate;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  notes?: string;
}

export interface ExperimentEvent extends BaseEntity {
  experimentId: UUID;
  type: string;
  source: string;
  data: Record<string, unknown>;
  actorId?: UUID;
}

export interface ExperimentRisk extends BaseEntity {
  experimentId: UUID;
  category: "user_impact" | "revenue" | "security" | "privacy" | "ai_safety" | "brand" | "operational";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  mitigation?: string;
  status: "open" | "mitigated" | "accepted" | "closed";
  ownerId?: UUID;
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

export interface ExperimentOverview {
  experiments: { total: number; active: number; completed: number; failed: number };
  variants: { total: number; winners: number };
  assignments: { total: number; active: number };
  observations: { total: number; today: number };
  analyses: { total: number; conclusive: number };
  featureFlags: { total: number; enabled: number };
  rollout: { active: number; completed: number };
  metrics: { total: number; primary: number; guardrail: number };
}

export interface ExperimentosState {
  hypotheses: Hypothesis[];
  experiments: Experiment[];
  variants: Variant[];
  assignments: Assignment[];
  observations: Observation[];
  analyses: Analysis[];
  metricDefinitions: MetricDefinition[];
  audienceDefinitions: AudienceDefinition[];
  trafficSplits: TrafficSplit[];
  featureFlags: FeatureFlag[];
  rollouts: Rollout[];
  decisions: Decision[];
  experimentEvents: ExperimentEvent[];
  experimentRisks: ExperimentRisk[];
  auditLogs: AuditLog[];
}
