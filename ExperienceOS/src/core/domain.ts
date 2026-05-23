export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "experience_admin" | "ux_designer" | "ux_analyst" | "content_manager" | "viewer";
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

export interface Persona extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "user" | "customer" | "employee" | "partner";
  status: EntityStatus;
  demographics: {
    age?: string;
    location?: string;
    occupation?: string;
    industry?: string;
    companySize?: string;
  };
  goals: string[];
  painPoints: string[];
  behaviors: string[];
  needs: string[];
  metadata: Record<string, unknown>;
}

export interface JourneyStage extends BaseEntity {
  journeyId: UUID;
  name: string;
  description?: string;
  order: number;
  touchpoints: string[];
  painPoints: string[];
  opportunities: string[];
  emotion: "very_negative" | "negative" | "neutral" | "positive" | "very_positive";
  metrics: {
    completionRate?: number;
    averageTime?: number;
    dropOffRate?: number;
  };
}

export interface Journey extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "user" | "customer" | "buyer" | "support";
  status: EntityStatus;
  personaId?: UUID;
  stages: JourneyStage[];
  totalDuration?: number;
  completionRate?: number;
  metadata: Record<string, unknown>;
}

export interface OnboardingStep extends BaseEntity {
  onboardingId: UUID;
  name: string;
  description?: string;
  order: number;
  type: "setup" | "learning" | "configuration" | "verification";
  status: "pending" | "completed" | "skipped" | "failed";
  required: boolean;
  estimatedTime?: number;
  completionCriteria?: string[];
}

export interface Onboarding extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  targetType: "user" | "customer" | "admin" | "partner";
  status: EntityStatus;
  personaId?: UUID;
  steps: OnboardingStep[];
  timeToValue?: number;
  completionRate?: number;
  totalSteps: number;
  requiredSteps: number;
  metadata: Record<string, unknown>;
}

export interface FlowStep extends BaseEntity {
  flowId: UUID;
  name: string;
  description?: string;
  order: number;
  type: "action" | "decision" | "form" | "confirmation" | "error";
  nextSteps: string[];
  previousSteps: string[];
  required: boolean;
  estimatedTime?: number;
  validation?: {
    required: boolean;
    rules?: string[];
  };
}

export interface UserFlow extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "signup" | "onboarding" | "checkout" | "support" | "custom";
  status: EntityStatus;
  personaId?: UUID;
  steps: FlowStep[];
  totalSteps: number;
  requiredSteps: number;
  estimatedTotalTime?: number;
  metadata: Record<string, unknown>;
}

export interface UXIssue extends BaseEntity {
  journeyId?: UUID;
  flowId?: UUID;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "navigation" | "form" | "content" | "design" | "performance" | "accessibility";
  stage?: string;
  affectedUsers?: number;
  impact: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "accepted_risk";
  recommendation?: string;
  createdBy: UUID;
  resolvedAt?: ISODate;
}

export interface UXAudit extends BaseEntity {
  key: string;
  name: string;
  targetType: "website" | "app" | "dashboard" | "form" | "landing_page" | "mobile";
  status: EntityStatus;
  scope?: string;
  issues: UXIssue[];
  metrics: {
    usabilityScore?: number;
    accessibilityScore?: number;
    performanceScore?: number;
    overallScore?: number;
  };
  recommendations: string[];
  createdBy: UUID;
  completedAt?: ISODate;
}

export interface AccessibilityCheck extends BaseEntity {
  auditId?: UUID;
  title: string;
  type: "contrast" | "keyboard" | "screen_reader" | "alt_text" | "focus" | "semantic" | "form_labels";
  status: "pass" | "fail" | "warning" | "not_applicable";
  severity: "low" | "medium" | "high";
  element?: string;
  description: string;
  recommendation?: string;
  wcagLevel?: "A" | "AA" | "AAA";
}

export interface Microcopy extends BaseEntity {
  key: string;
  type: "button" | "label" | "placeholder" | "error" | "success" | "tooltip" | "empty_state" | "confirmation";
  context: string;
  text: string;
  alternatives?: string[];
  language: string;
  status: EntityStatus;
  metadata: Record<string, unknown>;
}

export interface ABTestVariant extends BaseEntity {
  testId: UUID;
  name: string;
  description?: string;
  weight: number;
  metrics: {
    impressions: number;
    conversions: number;
    conversionRate?: number;
  };
  status: "active" | "paused" | "completed";
}

export interface ABTest extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  targetType: "button" | "page" | "form" | "flow" | "content" | "layout";
  status: EntityStatus;
  hypothesis?: string;
  variants: ABTestVariant[];
  startDate?: ISODate;
  endDate?: ISODate;
  statisticalSignificance?: number;
  winner?: UUID;
  metrics: {
    totalImpressions: number;
    totalConversions: number;
    overallConversionRate?: number;
  };
  createdBy: UUID;
  metadata: Record<string, unknown>;
}

export interface FeedbackItem extends BaseEntity {
  type: "nps" | "rating" | "comment" | "bug_report" | "feature_request";
  source: "in_app" | "email" | "survey" | "support";
  rating?: number;
  npsScore?: number;
  text?: string;
  category?: string;
  userId?: UUID;
  relatedEntityType?: "journey" | "flow" | "page" | "feature" | "onboarding";
  relatedEntityId?: UUID;
  status: "new" | "reviewed" | "implemented" | "declined";
  sentiment?: "positive" | "neutral" | "negative";
  tags?: string[];
  createdBy: UUID;
}

export interface PersonalizationRule extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  targetType: "dashboard" | "content" | "cta" | "navigation" | "flow";
  conditions: Array<{
    field: string;
    operator: "equals" | "contains" | "greater_than" | "less_than" | "in";
    value: unknown;
  }>;
  actions: Array<{
    type: "show" | "hide" | "replace" | "reorder";
    target: string;
    value?: unknown;
  }>;
  priority: number;
  status: EntityStatus;
  metadata: Record<string, unknown>;
}

export interface ExperienceMetric extends BaseEntity {
  type: "conversion" | "engagement" | "satisfaction" | "retention" | "task_completion";
  name: string;
  value: number;
  unit: string;
  timeframe: "daily" | "weekly" | "monthly" | "quarterly";
  dimensions: Record<string, string>;
  trend?: "up" | "down" | "stable";
  change?: number;
  metadata: Record<string, unknown>;
}

export interface Wireframe extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "low_fidelity" | "high_fidelity" | "interactive";
  targetType: "dashboard" | "landing_page" | "form" | "detail_page" | "settings" | "mobile";
  status: EntityStatus;
  layout: {
    grid: string;
    sections: Array<{
      name: string;
      components: string[];
      order: number;
    }>;
  };
  components: Array<{
    type: string;
    name: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    props?: Record<string, unknown>;
  }>;
  metadata: Record<string, unknown>;
}

export interface ExperienceTemplate extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "onboarding" | "journey" | "flow" | "dashboard" | "form" | "landing_page";
  status: EntityStatus;
  content: Record<string, unknown>;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface ExperienceEvent extends BaseEntity {
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

export interface ExperienceOverview {
  personas: { total: number; active: number };
  journeys: { total: number; active: number };
  onboarding: { total: number; active: number; avgCompletionRate: number };
  flows: { total: number; active: number };
  audits: { total: number; completed: number };
  abTests: { total: number; active: number; avgConversionRate: number };
  feedback: { total: number; new: number; avgNps: number };
  metrics: ExperienceMetric[];
}

export interface ExperienceState {
  personas: Persona[];
  journeys: Journey[];
  onboardings: Onboarding[];
  flows: UserFlow[];
  audits: UXAudit[];
  accessibilityChecks: AccessibilityCheck[];
  microcopy: Microcopy[];
  abTests: ABTest[];
  feedback: FeedbackItem[];
  personalizationRules: PersonalizationRule[];
  metrics: ExperienceMetric[];
  wireframes: Wireframe[];
  templates: ExperienceTemplate[];
  events: ExperienceEvent[];
  auditLogs: AuditLog[];
}
