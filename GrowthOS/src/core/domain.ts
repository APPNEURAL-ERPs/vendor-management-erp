export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role =
  | "viewer"
  | "growth_rep"
  | "marketer"
  | "campaign_manager"
  | "growth_manager"
  | "growth_admin"
  | "admin"
  | "owner"
  | "auditor";

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

export type EntityStatus = "active" | "inactive" | "archived";
export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED" | string;

export type LeadStatus = "new" | "contacted" | "qualified" | "opportunity" | "customer" | "lost";
export type LifecycleStage = "subscriber" | "lead" | "mql" | "sql" | "customer" | "evangelist" | "churned";
export type ConsentStatus = "unknown" | "opted_in" | "opted_out";

export interface Lead extends BaseEntity {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source: string;
  ownerId?: UUID;
  status: LeadStatus;
  lifecycleStage: LifecycleStage;
  score: number;
  tags: string[];
  consent: ConsentStatus;
  lastActivityAt?: ISODate;
  customFields: Record<string, unknown>;
  createdBy: UUID;
}

export type SegmentOperator = "eq" | "neq" | "contains" | "gte" | "lte" | "in" | "exists";
export interface SegmentRule {
  field: string;
  operator: SegmentOperator;
  value?: unknown;
}

export interface Segment extends BaseEntity {
  name: string;
  description?: string;
  rules: SegmentRule[];
  status: EntityStatus;
  evaluatedCount: number;
  lastEvaluatedAt?: ISODate;
  createdBy: UUID;
}

export type CampaignChannel = "email" | "sms" | "ads" | "social" | "webinar" | "referral" | "seo" | "content" | "mixed" | string;
export type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed" | "cancelled";
export interface CampaignMetrics {
  impressions: number;
  opens: number;
  clicks: number;
  leads: number;
  conversions: number;
  revenue: number;
  cost: number;
}

export interface Campaign extends BaseEntity {
  name: string;
  channel: CampaignChannel;
  objective: string;
  status: CampaignStatus;
  targetSegmentId?: UUID;
  landingPageId?: UUID;
  startAt?: ISODate;
  endAt?: ISODate;
  budget: number;
  currency: CurrencyCode;
  metrics: CampaignMetrics;
  tags: string[];
  createdBy: UUID;
}

export interface FunnelStage {
  id: UUID;
  name: string;
  order: number;
  probability: number;
  entryCriteria?: string;
}

export interface Funnel extends BaseEntity {
  name: string;
  description?: string;
  stages: FunnelStage[];
  status: EntityStatus;
  createdBy: UUID;
}

export type FunnelMembershipStatus = "active" | "converted" | "lost";
export interface FunnelMembership extends BaseEntity {
  funnelId: UUID;
  leadId: UUID;
  stageId: UUID;
  status: FunnelMembershipStatus;
  enteredAt: ISODate;
  movedAt?: ISODate;
  convertedAt?: ISODate;
  lostAt?: ISODate;
  notes?: string;
  createdBy: UUID;
}

export type TouchpointEventType =
  | "visit"
  | "email_open"
  | "email_click"
  | "ad_click"
  | "form_submit"
  | "webinar_attended"
  | "call"
  | "demo_request"
  | "signup"
  | "purchase"
  | "custom";
export interface Touchpoint extends BaseEntity {
  leadId?: UUID;
  anonymousId?: UUID;
  campaignId?: UUID;
  landingPageId?: UUID;
  channel: CampaignChannel | "direct" | "partner" | string;
  source: string;
  medium?: string;
  content?: string;
  eventType: TouchpointEventType;
  occurredAt: ISODate;
  value?: number;
  metadata: Record<string, unknown>;
  createdBy: UUID;
}

export type ConversionType = "mql" | "sql" | "customer" | "revenue" | "signup" | "trial" | "demo" | "custom";
export type AttributionModel = "first_touch" | "last_touch" | "linear" | "manual";
export interface Conversion extends BaseEntity {
  leadId: UUID;
  campaignId?: UUID;
  funnelId?: UUID;
  type: ConversionType;
  amount: number;
  currency: CurrencyCode;
  attributionModel: AttributionModel;
  source?: string;
  occurredAt: ISODate;
  metadata: Record<string, unknown>;
  createdBy: UUID;
}

export type LandingPageStatus = "draft" | "published" | "archived";
export interface LandingPageMetrics {
  visits: number;
  submissions: number;
  conversionRate: number;
}
export interface LandingPage extends BaseEntity {
  name: string;
  slug: string;
  headline: string;
  description?: string;
  campaignId?: UUID;
  status: LandingPageStatus;
  formFields: string[];
  thankYouMessage: string;
  metrics: LandingPageMetrics;
  createdBy: UUID;
  publishedAt?: ISODate;
}

export type ExperimentStatus = "draft" | "running" | "paused" | "completed";
export interface ExperimentVariant {
  id: UUID;
  name: string;
  trafficWeight: number;
  visitors: number;
  conversions: number;
  revenue: number;
}
export interface Experiment extends BaseEntity {
  name: string;
  hypothesis: string;
  targetMetric: string;
  status: ExperimentStatus;
  variants: ExperimentVariant[];
  winnerVariantId?: UUID;
  startedAt?: ISODate;
  completedAt?: ISODate;
  createdBy: UUID;
}

export type NurtureStatus = "draft" | "active" | "paused" | "archived";
export interface NurtureStep {
  id: UUID;
  order: number;
  channel: "email" | "sms" | "whatsapp" | "task";
  delayDays: number;
  templateName: string;
  subject?: string;
}
export interface NurtureSequence extends BaseEntity {
  name: string;
  description?: string;
  status: NurtureStatus;
  targetSegmentId?: UUID;
  steps: NurtureStep[];
  enrollmentCount: number;
  createdBy: UUID;
}

export type EnrollmentStatus = "active" | "completed" | "cancelled";
export interface NurtureEnrollment extends BaseEntity {
  sequenceId: UUID;
  leadId: UUID;
  status: EnrollmentStatus;
  currentStepOrder: number;
  enrolledAt: ISODate;
  completedAt?: ISODate;
  lastStepAt?: ISODate;
  createdBy: UUID;
}

export interface GrowthEvent extends BaseEntity {
  type: string;
  source: "GrowthOS";
  actorId: UUID;
  data: Record<string, unknown>;
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

export interface GrowthState {
  leads: Lead[];
  segments: Segment[];
  campaigns: Campaign[];
  funnels: Funnel[];
  funnelMemberships: FunnelMembership[];
  touchpoints: Touchpoint[];
  conversions: Conversion[];
  landingPages: LandingPage[];
  experiments: Experiment[];
  nurtureSequences: NurtureSequence[];
  nurtureEnrollments: NurtureEnrollment[];
  events: GrowthEvent[];
  auditLogs: AuditLog[];
}
