export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "experience_designer" | "ux_researcher" | "product_manager" | "viewer";
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
  type: "user" | "customer" | "employee" | "stakeholder";
  goals: string[];
  painPoints: string[];
  behaviors: string[];
  needs: string[];
  status: EntityStatus;
  metadata: Record<string, unknown>;
}

export interface JourneyStage extends BaseEntity {
  journeyId: UUID;
  name: string;
  description?: string;
  order: number;
  stageType: "awareness" | "consideration" | "decision" | "onboarding" | "adoption" | "retention" | "advocacy";
  emotion: "negative" | "neutral" | "positive";
  touchpointIds: UUID[];
  painPointIds: UUID[];
  opportunityIds: UUID[];
}

export interface Touchpoint extends BaseEntity {
  journeyId: UUID;
  stageId: UUID;
  name: string;
  type: "website" | "app" | "email" | "call" | "chat" | "in_person" | "social" | "support" | "other";
  channel: string;
  description?: string;
  interaction: string;
  emotion: "negative" | "neutral" | "positive";
  status: EntityStatus;
}

export interface PainPoint extends BaseEntity {
  journeyId: UUID;
  stageId: UUID;
  name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  impact: string;
  status: EntityStatus;
}

export interface Opportunity extends BaseEntity {
  journeyId: UUID;
  stageId: UUID;
  name: string;
  description: string;
  potential: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  status: EntityStatus;
}

export interface Journey extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "user" | "customer" | "employee" | "product";
  personaId?: UUID;
  stages: JourneyStage[];
  status: EntityStatus;
  metrics?: JourneyMetrics;
}

export interface JourneyMetrics {
  completionRate?: number;
  averageTime?: number;
  satisfactionScore?: number;
  dropOffRate?: number;
}

export interface FlowStep extends BaseEntity {
  flowId: UUID;
  name: string;
  description?: string;
  order: number;
  action: string;
  trigger: string;
  conditions?: string[];
  nextStepId?: UUID;
  status: EntityStatus;
}

export interface UserFlow extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "signup" | "onboarding" | "checkout" | "support" | "custom";
  steps: FlowStep[];
  status: EntityStatus;
  metrics?: FlowMetrics;
}

export interface FlowMetrics {
  completionRate?: number;
  averageTime?: number;
  dropOffPoints?: string[];
}

export interface Wireframe extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "dashboard" | "landing_page" | "form" | "list" | "detail" | "settings" | "mobile" | "admin" | "other";
  layout: string;
  components: string[];
  annotations?: string;
  status: EntityStatus;
}

export interface UXIssue extends BaseEntity {
  auditId: UUID;
  name: string;
  description: string;
  type: "navigation" | "form" | "content" | "visual" | "accessibility" | "performance" | "other";
  severity: "low" | "medium" | "high" | "critical";
  location?: string;
  recommendation?: string;
  status: EntityStatus;
}

export interface UXAudit extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  targetType: "website" | "app" | "dashboard" | "form" | "flow" | "page" | "other";
  targetUrl?: string;
  issues: UXIssue[];
  score?: number;
  status: EntityStatus;
  completedAt?: ISODate;
}

export interface AccessibilityCheck extends BaseEntity {
  key: string;
  name: string;
  targetType: "page" | "component" | "form" | "navigation" | "other";
  criteria: "wcag_a" | "wcag_aa" | "wcag_aaa";
  checks: AccessibilityCheckItem[];
  status: EntityStatus;
}

export interface AccessibilityCheckItem {
  name: string;
  type: "color_contrast" | "keyboard_navigation" | "screen_reader" | "alt_text" | "focus_indicator" | "form_labels" | "semantic_headings" | "aria_attributes" | "other";
  passed: boolean;
  details?: string;
}

export interface Microcopy extends BaseEntity {
  key: string;
  name: string;
  type: "button" | "tooltip" | "help_text" | "error_message" | "success_message" | "confirmation" | "placeholder" | "empty_state" | "label" | "other";
  content: string;
  context?: string;
  usage?: string;
  status: EntityStatus;
}

export interface ExperienceMetric extends BaseEntity {
  name: string;
  type: "task_completion" | "time_on_task" | "drop_off_rate" | "click_through" | "form_completion" | "search_success" | "onboarding_completion" | "satisfaction" | "nps" | "other";
  value: number;
  unit: string;
  timestamp: ISODate;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface Feedback extends BaseEntity {
  type: "page" | "feature" | "support" | "product" | "course" | "event" | "general";
  rating?: number;
  comment?: string;
  sentiment?: "positive" | "neutral" | "negative";
  category?: string;
  source: "in_app" | "email" | "survey" | "support_ticket" | "other";
  status: EntityStatus;
  metadata?: Record<string, unknown>;
}

export interface ABTestVariant {
  id: UUID;
  name: string;
  description?: string;
  traffic: number;
  metrics?: Record<string, number>;
}

export interface ABTest extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "landing_page" | "cta" | "form" | "checkout" | "pricing" | "navigation" | "content" | "other";
  hypothesis?: string;
  variants: ABTestVariant[];
  status: "draft" | "running" | "paused" | "completed" | "archived";
  startedAt?: ISODate;
  endedAt?: ISODate;
  winner?: UUID;
  metrics?: Record<string, unknown>;
}

export interface PersonalizationRule extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  trigger: string;
  conditions: Array<{ field: string; operator: "eq" | "contains" | "in" | "exists"; value: unknown }>;
  actions: Array<{ type: "show" | "hide" | "personalize" | "recommend" | "redirect"; content: unknown }>;
  status: EntityStatus;
}

export interface Personalization extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "dashboard" | "content" | "cta" | "onboarding" | "recommendation" | "other";
  rules: PersonalizationRule[];
  status: EntityStatus;
}

export interface OnboardingStep extends BaseEntity {
  onboardingId: UUID;
  name: string;
  description?: string;
  order: number;
  action: string;
  goal?: string;
  timeEstimate?: number;
  isRequired: boolean;
  status: EntityStatus;
}

export interface Onboarding extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "first_time" | "product" | "feature" | "role_based" | "custom";
  personaId?: UUID;
  steps: OnboardingStep[];
  status: EntityStatus;
  metrics?: OnboardingMetrics;
}

export interface OnboardingMetrics {
  completionRate?: number;
  averageTime?: number;
  stepCompletionRates?: Record<string, number>;
  dropOffStep?: string;
}

export interface ExperienceRecommendation extends BaseEntity {
  type: "ux" | "conversion" | "accessibility" | "performance" | "navigation" | "form" | "onboarding" | "content" | "other";
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  priority: number;
  status: EntityStatus;
  implementedAt?: ISODate;
}

export interface ExperienceTemplate extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "onboarding" | "journey" | "flow" | "dashboard" | "form" | "empty_state" | "error_state" | "wireframe" | "other";
  content: Record<string, unknown>;
  tags: string[];
  status: EntityStatus;
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

export interface ExperienceState {
  personas: Persona[];
  journeys: Journey[];
  touchpoints: Touchpoint[];
  painPoints: PainPoint[];
  opportunities: Opportunity[];
  userFlows: UserFlow[];
  wireframes: Wireframe[];
  audits: UXAudit[];
  accessibilityChecks: AccessibilityCheck[];
  microcopies: Microcopy[];
  experiments: ABTest[];
  personalizations: Personalization[];
  onboardings: Onboarding[];
  feedbacks: Feedback[];
  metrics: ExperienceMetric[];
  recommendations: ExperienceRecommendation[];
  templates: ExperienceTemplate[];
  events: ExperienceEvent[];
  auditLogs: AuditLog[];
}

export interface ExperienceOverview {
  personas: { total: number; active: number };
  journeys: { total: number; active: number };
  flows: { total: number; active: number };
  audits: { total: number; completed: number };
  experiments: { total: number; running: number; completed: number };
  onboardings: { total: number; active: number };
  feedbacks: { total: number; positive: number; negative: number };
  metrics: ExperienceMetric[];
}
