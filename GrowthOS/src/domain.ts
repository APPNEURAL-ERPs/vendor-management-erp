export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "growth_manager" | "growth_analyst" | "campaign_manager" | "viewer";
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

export interface GrowthStrategy extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  goals: string[];
  channels: string[];
  model: "content_led" | "product_led" | "sales_led" | "community_led" | "referral_led" | "hybrid";
  priorities: GrowthPriority[];
  metrics: Record<string, number>;
  createdBy: UUID;
}

export interface GrowthPriority {
  area: string;
  priority: number;
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
}

export interface Funnel extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  type: "acquisition" | "conversion" | "retention" | "revenue";
  stages: FunnelStage[];
  totalVisitors?: number;
  totalLeads?: number;
  totalConversions?: number;
  conversionRate?: number;
  createdBy: UUID;
}

export interface FunnelStage extends BaseEntity {
  funnelId: UUID;
  name: string;
  order: number;
  description?: string;
  visitors: number;
  leads: number;
  conversions: number;
  dropoffRate: number;
  conversionRate: number;
  avgTimeInStage?: number;
}

export interface Campaign extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  type: "product_launch" | "service_offer" | "workshop" | "lead_magnet" | "founder_branding" | "retargeting" | "referral" | "seasonal" | "partnership";
  funnelId?: UUID;
  audienceId?: UUID;
  channels: string[];
  startDate?: ISODate;
  endDate?: ISODate;
  budget?: number;
  spent?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
  roi?: number;
  createdBy: UUID;
}

export interface Audience extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  size?: number;
  segments: AudienceSegment[];
  sources: string[];
  createdBy: UUID;
}

export interface AudienceSegment {
  name: string;
  criteria: Record<string, unknown>;
  count?: number;
}

export interface Experiment extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  type: "ab_test" | "multivariate" | "bandit";
  hypothesis?: string;
  metric: string;
  successCriteria?: number;
  funnelStageId?: UUID;
  variants: ExperimentVariant[];
  trafficSplit: number[];
  startDate?: ISODate;
  endDate?: ISODate;
  winner?: string;
  result?: ExperimentResult;
  createdBy: UUID;
}

export interface ExperimentVariant {
  id: UUID;
  name: string;
  description?: string;
  config: Record<string, unknown>;
  traffic: number;
  conversions: number;
  visitors: number;
  conversionRate?: number;
}

export interface ExperimentResult {
  winner: string;
  confidence: number;
  lift: number;
  sampleSize: number;
  statisticalSignificance: boolean;
}

export interface Lead extends BaseEntity {
  email: string;
  name?: string;
  company?: string;
  source: string;
  campaignId?: UUID;
  audienceId?: UUID;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  score?: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Conversion extends BaseEntity {
  leadId?: UUID;
  campaignId?: UUID;
  funnelStageId?: UUID;
  type: "signup" | "purchase" | "upgrade" | "subscription" | "download" | "signup";
  value?: number;
  currency?: string;
  metadata: Record<string, unknown>;
}

export interface GrowthMetric extends BaseEntity {
  name: string;
  type: "acquisition" | "activation" | "retention" | "revenue" | "referral";
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  period: string;
  unit?: string;
  metadata: Record<string, unknown>;
}

export interface Channel extends BaseEntity {
  key: string;
  name: string;
  type: "organic" | "paid" | "social" | "email" | "referral" | "direct";
  status: EntityStatus;
  cost?: number;
  revenue?: number;
  leads?: number;
  conversions?: number;
  metrics: Record<string, number>;
}

export interface Offer extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "free" | "trial" | "discount" | "upsell" | "cross_sell";
  status: EntityStatus;
  price?: number;
  originalPrice?: number;
  conditions?: string[];
  conversions?: number;
  revenue?: number;
  createdBy: UUID;
}

export interface RetentionCampaign extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  type: "reengagement" | "winback" | "upsell" | "renewal";
  targetAudience: string;
  channels: string[];
  startDate?: ISODate;
  endDate?: ISODate;
  targetCount?: number;
  reachedCount?: number;
  convertedCount?: number;
  createdBy: UUID;
}

export interface ReferralProgram extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
  rewardType: "credits" | "cash" | "discount" | "free_months";
  rewardValue?: number;
  referralLink?: string;
  totalReferrals?: number;
  successfulReferrals?: number;
  conversionRate?: number;
  createdBy: UUID;
}

export interface GrowthEvent extends BaseEntity {
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

export interface GrowthOverview {
  strategies: { total: number; active: number };
  funnels: { total: number; avgConversionRate: number };
  campaigns: { total: number; active: number; totalBudget: number; totalSpent: number };
  audiences: { total: number; avgSize: number };
  experiments: { total: number; active: number; completed: number };
  leads: { total: number; qualified: number; converted: number };
  metrics: { acquisition: number; activation: number; retention: number; revenue: number; referral: number };
}

export interface GrowthState {
  strategies: GrowthStrategy[];
  funnels: Funnel[];
  funnelStages: FunnelStage[];
  campaigns: Campaign[];
  audiences: Audience[];
  experiments: Experiment[];
  experimentVariants: ExperimentVariant[];
  leads: Lead[];
  conversions: Conversion[];
  metrics: GrowthMetric[];
  events: GrowthEvent[];
  auditLogs: AuditLog[];
}
