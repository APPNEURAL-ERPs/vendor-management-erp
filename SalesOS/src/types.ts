export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "sales_manager" | "sales_rep" | "viewer";
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

export type LeadStatus = "new" | "contacted" | "qualified" | "not_qualified" | "discovery_scheduled" | "proposal_needed" | "proposal_sent" | "negotiation" | "won" | "lost" | "nurture" | "archived";
export type LeadSource = "website" | "linkedin" | "referral" | "partner" | "cold_outreach" | "workshop" | "webinar" | "community" | "google_search" | "paid_campaign" | "marketplace" | "manual_entry";

export interface LeadScore {
  total: number;
  fit: number;
  intent: number;
  engagement: number;
  budget: number;
  urgency: number;
  reasons: string[];
}

export interface Lead extends BaseEntity {
  key: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source: LeadSource;
  status: LeadStatus;
  score: LeadScore;
  ownerId?: UUID;
  estimatedValue?: number;
  notes?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export type ContactRole = "decision_maker" | "influencer" | "evaluator" | "technical_contact" | "finance_contact" | "legal_contact" | "end_user" | "partner_contact";

export interface Contact extends BaseEntity {
  key: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  role: ContactRole;
  accountId?: UUID;
  leadId?: UUID;
  isPrimary: boolean;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface Account extends BaseEntity {
  key: string;
  name: string;
  industry?: string;
  website?: string;
  size?: "startup" | "small" | "medium" | "large" | "enterprise";
  location?: string;
  revenue?: number;
  ownerId?: UUID;
  status: EntityStatus;
  notes?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export type DealStage = "lead" | "qualified" | "discovery" | "solution_fit" | "proposal" | "negotiation" | "verbal_approval" | "contract" | "won" | "lost";

export interface Deal extends BaseEntity {
  key: string;
  title: string;
  value: number;
  stage: DealStage;
  probability: number;
  expectedCloseDate?: ISODate;
  actualCloseDate?: ISODate;
  ownerId?: UUID;
  accountId?: UUID;
  leadId?: UUID;
  contactIds: UUID[];
  lostReason?: string;
  notes?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface PipelineStage {
  name: DealStage;
  displayName: string;
  order: number;
  probability: number;
  minDays?: number;
  maxDays?: number;
}

export interface Pipeline extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  isDefault: boolean;
  status: EntityStatus;
}

export type ActivityType = "call" | "email" | "whatsapp" | "linkedin_message" | "meeting" | "demo" | "proposal_sent" | "follow_up" | "negotiation" | "contract_discussion";

export interface SalesActivity extends BaseEntity {
  key: string;
  type: ActivityType;
  subject?: string;
  description?: string;
  dealId?: UUID;
  leadId?: UUID;
  contactId?: UUID;
  accountId?: UUID;
  ownerId: UUID;
  duration?: number;
  outcome?: string;
  metadata: Record<string, unknown>;
}

export type FollowUpStatus = "pending" | "completed" | "cancelled" | "overdue";
export type FollowUpPriority = "low" | "medium" | "high" | "urgent";

export interface FollowUpTask extends BaseEntity {
  key: string;
  subject: string;
  description?: string;
  type: ActivityType;
  status: FollowUpStatus;
  priority: FollowUpPriority;
  dueDate: ISODate;
  completedAt?: ISODate;
  leadId?: UUID;
  dealId?: UUID;
  contactId?: UUID;
  accountId?: UUID;
  ownerId: UUID;
  assignedTo?: UUID;
  notes?: string;
  metadata: Record<string, unknown>;
}

export type ProposalStatus = "draft" | "sent" | "viewed" | "negotiating" | "accepted" | "rejected" | "expired" | "archived";

export interface ProposalSection {
  title: string;
  content: string;
  order: number;
}

export interface ProposalLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  metadata: Record<string, unknown>;
}

export interface Proposal extends BaseEntity {
  key: string;
  title: string;
  status: ProposalStatus;
  dealId?: UUID;
  leadId?: UUID;
  accountId?: UUID;
  contactId?: UUID;
  ownerId: UUID;
  validUntil?: ISODate;
  sections: ProposalSection[];
  lineItems: ProposalLineItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  notes?: string;
  sentAt?: ISODate;
  viewedAt?: ISODate;
  acceptedAt?: ISODate;
  rejectedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  metadata: Record<string, unknown>;
}

export interface Quote extends BaseEntity {
  key: string;
  title: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  dealId?: UUID;
  leadId?: UUID;
  accountId?: UUID;
  ownerId: UUID;
  validUntil?: ISODate;
  lineItems: QuoteLineItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  notes?: string;
  metadata: Record<string, unknown>;
}

export type TargetPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
export type TargetType = "revenue" | "leads" | "qualified_leads" | "meetings" | "proposals" | "deals" | "renewals" | "upsells";

export interface SalesTarget extends BaseEntity {
  key: string;
  title: string;
  type: TargetType;
  period: TargetPeriod;
  targetValue: number;
  currentValue: number;
  startDate: ISODate;
  endDate: ISODate;
  ownerId?: UUID;
  teamId?: UUID;
  status: EntityStatus;
  metadata: Record<string, unknown>;
}

export type ForecastStatus = "draft" | "submitted" | "approved" | "revised";

export interface ForecastItem {
  dealId?: UUID;
  accountName?: string;
  dealTitle?: string;
  value: number;
  probability: number;
  weightedValue: number;
  expectedCloseDate?: ISODate;
  stage: DealStage;
  notes?: string;
}

export interface SalesForecast extends BaseEntity {
  key: string;
  title: string;
  period: "monthly" | "quarterly" | "yearly";
  startDate: ISODate;
  endDate: ISODate;
  status: ForecastStatus;
  ownerId: UUID;
  totalValue: number;
  totalWeightedValue: number;
  items: ForecastItem[];
  assumptions?: string;
  notes?: string;
  submittedAt?: ISODate;
  approvedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface SalesReport extends BaseEntity {
  key: string;
  title: string;
  type: "dashboard" | "pipeline" | "performance" | "forecast" | "activity" | "custom";
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  startDate: ISODate;
  endDate: ISODate;
  ownerId: UUID;
  data: Record<string, unknown>;
  generatedAt: ISODate;
  metadata: Record<string, unknown>;
}

export type LostDealReason = "price_too_high" | "no_budget" | "no_decision" | "chose_competitor" | "timeline_changed" | "poor_fit" | "trust_issue" | "feature_gap" | "internal_delay" | "other";

export interface LostDealAnalysis extends BaseEntity {
  dealId: UUID;
  dealTitle: string;
  accountId?: UUID;
  accountName?: string;
  value: number;
  stage: DealStage;
  lostReason: LostDealReason;
  competitorName?: string;
  competitorDetails?: string;
  analysis?: string;
  recommendations?: string;
  reconnectDate?: ISODate;
  reconnectNotes?: string;
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

export interface SalesEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface SalesOverview {
  leads: { total: number; qualified: number; byStatus: Record<string, number> };
  deals: { total: number; open: number; won: number; lost: number; value: number };
  pipeline: { total: number; byStage: Record<string, { count: number; value: number }> };
  activities: { total: number; byType: Record<string, number> };
  followUps: { total: number; pending: number; overdue: number; dueToday: number };
  proposals: { total: number; pending: number; accepted: number; rejected: number };
  targets: { total: number; active: number; achievementPercent: number };
  forecast: { total: number; weighted: number };
  conversion: { leadToQualified: number; qualifiedToDeal: number; dealToWon: number };
}

export interface SalesState {
  leads: Lead[];
  contacts: Contact[];
  accounts: Account[];
  deals: Deal[];
  pipelines: Pipeline[];
  activities: SalesActivity[];
  followUps: FollowUpTask[];
  proposals: Proposal[];
  quotes: Quote[];
  targets: SalesTarget[];
  forecasts: SalesForecast[];
  reports: SalesReport[];
  lostDealAnalyses: LostDealAnalysis[];
  events: SalesEvent[];
  auditLogs: AuditLog[];
}
