export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "partner_manager" | "partner" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft" | "suspended" | "terminated";
export type PartnerStatus = "prospect" | "invited" | "applied" | "under_review" | "approved" | "active" | "inactive" | "suspended" | "terminated" | "archived";
export type PartnerType = "agency" | "consultant" | "freelancer" | "training_institute" | "college" | "technology" | "vendor" | "reseller" | "affiliate" | "community" | "implementation";
export type LeadStatus = "submitted" | "accepted" | "rejected" | "duplicate" | "qualified" | "proposal_sent" | "won" | "lost" | "expired" | "commission_eligible";
export type CommissionModel = "fixed" | "percentage" | "recurring_revenue_share" | "tier_based" | "milestone_based" | "performance_bonus";
export type PayoutStatus = "pending" | "under_review" | "approved" | "scheduled" | "paid" | "failed" | "on_hold" | "cancelled" | "disputed";
export type ProgramType = "affiliate" | "referral" | "reseller" | "agency" | "implementation" | "training" | "technology" | "community" | "college";
export type TierLevel = "registered" | "silver" | "gold" | "platinum" | "strategic" | "certified" | "authorized";
export type AgreementStatus = "draft" | "pending_signature" | "active" | "expired" | "terminated";
export type CampaignStatus = "draft" | "active" | "completed" | "cancelled";
export type EnablementStatus = "not_started" | "in_progress" | "completed";

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

export interface PartnerContact {
  id: UUID;
  tenantId: TenantId;
  partnerId: UUID;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  isPrimary: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Partner extends BaseEntity {
  key: string;
  name: string;
  type: PartnerType;
  status: PartnerStatus;
  tierId?: UUID;
  programId?: UUID;
  contactPerson?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  taxId?: string;
  gstin?: string;
  logo?: string;
  description?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  notes?: string;
  referralCode?: string;
  commissionModel?: CommissionModel;
  commissionRate?: number;
  revenueGenerated: number;
  leadsSubmitted: number;
  dealsWon: number;
  activeSince?: ISODate;
  lastActivityAt?: ISODate;
  healthScore?: number;
  ownerId?: UUID;
  createdBy: UUID;
}

export interface PartnerTier extends BaseEntity {
  key: string;
  name: string;
  programId: UUID;
  level: TierLevel;
  description?: string;
  benefits: string[];
  requirements: string[];
  minRevenue?: number;
  minLeads?: number;
  minDeals?: number;
  commissionMultiplier: number;
  status: EntityStatus;
  badgeColor?: string;
  createdBy: UUID;
}

export interface PartnerProgram extends BaseEntity {
  key: string;
  name: string;
  type: ProgramType;
  description?: string;
  status: EntityStatus;
  benefits: string[];
  requirements: string[];
  commissionModel: CommissionModel;
  defaultCommissionRate: number;
  tierEnabled: boolean;
  tierIds: UUID[];
  tags: string[];
  metadata: Record<string, unknown>;
  startDate?: ISODate;
  endDate?: ISODate;
  createdBy: UUID;
}

export interface PartnerApplication extends BaseEntity {
  partnerId?: UUID;
  programId: UUID;
  type: PartnerType;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  status: "pending" | "under_review" | "approved" | "rejected";
  applicationData: Record<string, unknown>;
  documents: Array<{ name: string; url: string; verified: boolean }>;
  reviewedBy?: UUID;
  reviewedAt?: ISODate;
  notes?: string;
  createdBy: UUID;
}

export interface PartnerAgreement extends BaseEntity {
  partnerId: UUID;
  programId: UUID;
  title: string;
  agreementType: string;
  status: AgreementStatus;
  effectiveDate: ISODate;
  expiryDate?: ISODate;
  terms: string;
  commissionTerms?: string;
  leadOwnership?: string;
  confidentiality?: string;
  brandUsage?: string;
  paymentTerms?: string;
  complianceRules?: string;
  signedBy?: string;
  signedAt?: ISODate;
  documentUrl?: string;
  createdBy: UUID;
}

export interface PartnerLead extends BaseEntity {
  partnerId: UUID;
  programId?: UUID;
  source: "referral" | "affiliate" | "reseller" | "direct";
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  company?: string;
  description?: string;
  dealValue?: number;
  status: LeadStatus;
  assignedTo?: UUID;
  convertedAt?: ISODate;
  convertedDealId?: string;
  commissionEligible: boolean;
  commissionAmount?: number;
  referralCode?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  notes?: string;
  createdBy: UUID;
}

export interface PartnerReferral extends BaseEntity {
  partnerId: UUID;
  leadId: UUID;
  referralCode: string;
  referralLink?: string;
  clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
  status: "active" | "completed" | "expired";
  expiresAt?: ISODate;
  createdBy: UUID;
}

export interface PartnerDeal extends BaseEntity {
  partnerId: UUID;
  leadId?: UUID;
  dealName: string;
  dealValue: number;
  stage: "prospecting" | "qualification" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  status: "active" | "won" | "lost" | "cancelled";
  closedAt?: ISODate;
  partnerCommission: number;
  commissionPaid: boolean;
  payoutId?: UUID;
  createdBy: UUID;
}

export interface PartnerCommission extends BaseEntity {
  partnerId: UUID;
  dealId?: UUID;
  leadId?: UUID;
  commissionType: CommissionModel;
  commissionRate: number;
  dealValue: number;
  commissionAmount: number;
  status: "calculated" | "pending_approval" | "approved" | "paid" | "disputed" | "clawed_back";
  approvedBy?: UUID;
  approvedAt?: ISODate;
  paidAt?: ISODate;
  payoutId?: UUID;
  notes?: string;
  createdBy: UUID;
}

export interface PartnerPayout extends BaseEntity {
  partnerId: UUID;
  commissionIds: UUID[];
  totalAmount: number;
  status: PayoutStatus;
  paymentMethod?: string;
  bankAccount?: string;
  transactionId?: string;
  scheduledDate?: ISODate;
  paidAt?: ISODate;
  failureReason?: string;
  reviewedBy?: UUID;
  reviewedAt?: ISODate;
  notes?: string;
  createdBy: UUID;
}

export interface PartnerCampaign extends BaseEntity {
  key: string;
  name: string;
  programId?: UUID;
  partnerIds: UUID[];
  type: "referral" | "affiliate" | "training" | "co_marketing" | "product_launch";
  status: CampaignStatus;
  description?: string;
  budget?: number;
  startDate: ISODate;
  endDate?: ISODate;
  targetLeads?: number;
  targetRevenue?: number;
  actualLeads?: number;
  actualRevenue?: number;
  assets: Array<{ name: string; url: string; type: string }>;
  createdBy: UUID;
}

export interface Enablement extends BaseEntity {
  key: string;
  name: string;
  partnerId: UUID;
  type: "training" | "certification" | "resource" | "workshop" | "course";
  description?: string;
  status: EnablementStatus;
  contentUrl?: string;
  completionDate?: ISODate;
  score?: number;
  certificateUrl?: string;
  expiresAt?: ISODate;
  createdBy: UUID;
}

export interface JointGTM extends BaseEntity {
  key: string;
  name: string;
  partnerIds: UUID[];
  initiative: string;
  type: "co_selling" | "co_marketing" | "joint_solution" | "integrated_offering";
  status: "planned" | "active" | "completed" | "cancelled";
  description?: string;
  targetRevenue?: number;
  actualRevenue?: number;
  startDate: ISODate;
  endDate?: ISODate;
  activities: Array<{ type: string; description: string; date: ISODate; outcome?: string }>;
  createdBy: UUID;
}

export interface PartnerResource extends BaseEntity {
  key: string;
  name: string;
  type: "brochure" | "sales_deck" | "proposal_template" | "case_study" | "pricing_sheet" | "demo_script" | "brand_asset" | "faq";
  description?: string;
  url: string;
  tags: string[];
  accessLevels: string[];
  createdBy: UUID;
}

export interface PartnerCertification extends BaseEntity {
  partnerId: UUID;
  certificationName: string;
  issuedDate: ISODate;
  expiryDate?: ISODate;
  status: "active" | "expired" | "revoked";
  certificateUrl?: string;
  score?: number;
  issuedBy: string;
  createdBy: UUID;
}

export interface PartnerHealthScore extends BaseEntity {
  partnerId: UUID;
  overallScore: number;
  activityScore: number;
  revenueScore: number;
  leadQualityScore: number;
  engagementScore: number;
  complianceScore: number;
  lastCalculatedAt: ISODate;
  factors: Record<string, number>;
  recommendations: string[];
}

export interface PartnerSupportTicket extends BaseEntity {
  partnerId: UUID;
  subject: string;
  description: string;
  category: "commission" | "lead_status" | "resource_request" | "training_help" | "portal_access" | "agreement" | "campaign" | "technical";
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: UUID;
  resolvedAt?: ISODate;
  createdBy: UUID;
}

export interface PartnerEvent extends BaseEntity {
  type: string;
  source: string;
  partnerId?: UUID;
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

export interface PartnerOverview {
  partners: {
    total: number;
    active: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  };
  programs: {
    total: number;
    active: number;
  };
  leads: {
    total: number;
    submitted: number;
    converted: number;
    conversionRate: number;
  };
  revenue: {
    total: number;
    partnerInfluenced: number;
    commission: number;
    paid: number;
    pending: number;
  };
  campaigns: {
    total: number;
    active: number;
  };
  performance: {
    topPartners: Array<{ id: UUID; name: string; revenue: number; leads: number }>;
    recentActivity: Array<{ partnerId: UUID; partnerName: string; action: string; date: ISODate }>;
  };
}

export interface PartnerState {
  partners: Partner[];
  contacts: PartnerContact[];
  programs: PartnerProgram[];
  tiers: PartnerTier[];
  applications: PartnerApplication[];
  agreements: PartnerAgreement[];
  leads: PartnerLead[];
  referrals: PartnerReferral[];
  deals: PartnerDeal[];
  commissions: PartnerCommission[];
  payouts: PartnerPayout[];
  campaigns: PartnerCampaign[];
  enablements: Enablement[];
  jointGTMs: JointGTM[];
  resources: PartnerResource[];
  certifications: PartnerCertification[];
  healthScores: PartnerHealthScore[];
  supportTickets: PartnerSupportTicket[];
  events: PartnerEvent[];
  auditLogs: AuditLog[];
}
