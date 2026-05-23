export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "license_admin" | "license_manager" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";
export type LicenseStatus = "draft" | "active" | "trial" | "expired" | "suspended" | "cancelled" | "revoked" | "renewed" | "archived";
export type QuotaStatus = "within_limit" | "near_limit" | "limit_reached" | "overage_allowed" | "blocked";
export type ComplianceStatus = "not_started" | "in_progress" | "compliant" | "non_compliant" | "waived";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "cancelled" | "paused" | "expired" | "renewing" | "payment_failed";

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

export interface License extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "tenant" | "user" | "module" | "tool" | "api" | "template" | "workflow" | "agent" | "plugin" | "marketplace";
  status: LicenseStatus;
  plan: "free" | "starter" | "pro" | "business" | "enterprise";
  ownerId: UUID;
  ownerType: "tenant" | "user";
  parentLicenseId?: UUID;
  moduleId?: UUID;
  toolId?: UUID;
  seats: {
    total: number;
    used: number;
    available: number;
  };
  quotas: {
    monthly: number;
    daily: number;
    api: number;
    storage: number;
    workflowRuns: number;
    agentRuns: number;
  };
  entitlements: string[];
  pricing: {
    model: "free" | "freemium" | "subscription" | "credit" | "usage";
    amount?: number;
    currency?: string;
    interval?: "monthly" | "annual";
    trialDays?: number;
    credits?: number;
  };
  subscriptionId?: UUID;
  startDate: ISODate;
  expiryDate?: ISODate;
  gracePeriodDays?: number;
  activatedAt?: ISODate;
  deactivatedAt?: ISODate;
  renewedAt?: ISODate;
  metadata: Record<string, unknown>;
  tags: string[];
  createdBy: UUID;
  activatedBy?: UUID;
  renewedBy?: UUID;
  suspendedBy?: UUID;
  revokedBy?: UUID;
}

export interface LicenseKey extends BaseEntity {
  licenseId: UUID;
  key: string;
  keyHash: string;
  status: "active" | "revoked" | "expired";
  expiresAt?: ISODate;
  usedAt?: ISODate;
  createdBy: UUID;
  revokedAt?: ISODate;
  revokedBy?: UUID;
}

export interface Entitlement extends BaseEntity {
  licenseId: UUID;
  key: string;
  name: string;
  description?: string;
  type: "module" | "tool" | "feature" | "api" | "workflow" | "agent" | "dataset" | "marketplace";
  resourceId?: UUID;
  resourceKey?: string;
  status: EntityStatus;
  limits?: {
    monthly?: number;
    daily?: number;
    perRun?: number;
  };
  createdBy: UUID;
}

export interface LicenseSeat extends BaseEntity {
  licenseId: UUID;
  userId: UUID;
  seatType: "admin" | "recruiter" | "trainer" | "learner" | "developer" | "standard";
  status: "assigned" | "released" | "suspended";
  assignedAt: ISODate;
  assignedBy: UUID;
  releasedAt?: ISODate;
  releasedBy?: UUID;
}

export interface LicenseQuota extends BaseEntity {
  licenseId: UUID;
  quotaType: "monthly" | "daily" | "api" | "storage" | "workflow_runs" | "agent_runs" | "seats";
  limit: number;
  used: number;
  remaining: number;
  status: QuotaStatus;
  resetAt?: ISODate;
  overageAllowed: boolean;
  overageCost?: number;
  createdBy: UUID;
}

export interface UsageRecord extends BaseEntity {
  licenseId: UUID;
  userId?: UUID;
  resourceType: "tool" | "api" | "workflow" | "agent" | "storage" | "seat" | "report" | "export" | "credit";
  resourceId?: UUID;
  action: string;
  quantity: number;
  unit: string;
  cost?: number;
  metadata: Record<string, unknown>;
  recordedBy: UUID;
}

export interface CreditWallet extends BaseEntity {
  licenseId: UUID;
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  expiresAt?: ISODate;
  status: "active" | "expired" | "depleted";
  transactions: Array<{
    id: UUID;
    type: "deduct" | "topup" | "refund" | "expire";
    amount: number;
    balance: number;
    reason?: string;
    createdAt: ISODate;
    createdBy: UUID;
  }>;
}

export interface ComplianceCheck extends BaseEntity {
  licenseId: UUID;
  checkType: "usage_rights" | "seat_compliance" | "commercial_use" | "redistribution" | "api_license" | "marketplace_license" | "quota_compliance";
  status: ComplianceStatus;
  severity: "low" | "medium" | "high" | "critical";
  description?: string;
  violations: string[];
  remediation?: string;
  checkedAt: ISODate;
  checkedBy: UUID;
  resolvedAt?: ISODate;
  resolvedBy?: UUID;
}

export interface Renewal extends BaseEntity {
  licenseId: UUID;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  renewalDate: ISODate;
  expiryDate: ISODate;
  newExpiryDate: ISODate;
  amount?: number;
  currency?: string;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  rejectedBy?: UUID;
  rejectedAt?: ISODate;
  rejectionReason?: string;
  createdBy: UUID;
  completedAt?: ISODate;
}

export interface LicenseSubscription extends BaseEntity {
  licenseId: UUID;
  status: SubscriptionStatus;
  plan: "free" | "starter" | "pro" | "business" | "enterprise";
  amount: number;
  currency: string;
  interval: "monthly" | "annual";
  startDate: ISODate;
  currentPeriodStart: ISODate;
  currentPeriodEnd: ISODate;
  cancelledAt?: ISODate;
  cancelAtPeriodEnd: boolean;
  trialEnd?: ISODate;
  paymentFailedAt?: ISODate;
  createdBy: UUID;
}

export interface LicenseTrial extends BaseEntity {
  licenseId: UUID;
  startDate: ISODate;
  endDate: ISODate;
  features: string[];
  usageLimits: {
    reports?: number;
    apiCalls?: number;
    workflowRuns?: number;
    agentRuns?: number;
  };
  convertedToPaid: boolean;
  convertedAt?: ISODate;
  createdBy: UUID;
}

export interface LicenseAddOn extends BaseEntity {
  licenseId: UUID;
  addOnType: "seats" | "storage" | "api_calls" | "ai_credits" | "support" | "white_label" | "analytics" | "custom_domain";
  name: string;
  quantity: number;
  amount: number;
  currency: string;
  status: EntityStatus;
  startDate: ISODate;
  expiryDate?: ISODate;
  createdBy: UUID;
}

export interface LicenseBundle extends BaseEntity {
  bundleId: UUID;
  name: string;
  description?: string;
  modules: string[];
  tools: string[];
  workflows: string[];
  agents: string[];
  seats: number;
  quotas: {
    monthly: number;
    api: number;
    storage: number;
    workflowRuns: number;
    agentRuns: number;
  };
  price: number;
  currency: string;
  status: EntityStatus;
  createdBy: UUID;
}

export interface LicenseOverage extends BaseEntity {
  licenseId: UUID;
  quotaType: string;
  overageAmount: number;
  overageCost: number;
  currency: string;
  billingPeriod: ISODate;
  status: "pending" | "billed" | "waived";
  billedAt?: ISODate;
  waivedBy?: UUID;
  waivedAt?: ISODate;
  createdBy: UUID;
}

export interface LicensePolicy extends BaseEntity {
  policyType: "seat_sharing" | "template_resale" | "api_key_sharing" | "trial_abuse" | "commercial_use" | "redistribution";
  name: string;
  description?: string;
  rules: string[];
  enforcement: "alert" | "block" | "suspend";
  status: EntityStatus;
  createdBy: UUID;
}

export interface LicenseViolation extends BaseEntity {
  licenseId: UUID;
  policyId?: UUID;
  violationType: "seat_sharing" | "quota_exceeded" | "trial_abuse" | "api_key_shared" | "template_resold" | "commercial_misuse";
  severity: "low" | "medium" | "high" | "critical";
  description?: string;
  evidence: string[];
  status: "open" | "investigating" | "resolved" | "accepted_risk";
  resolvedAt?: ISODate;
  resolvedBy?: UUID;
  createdBy: UUID;
}

export interface LicenseEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  licenseId?: UUID;
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

export interface LicenseOverview {
  licenses: {
    total: number;
    active: number;
    trial: number;
    expired: number;
    suspended: number;
  };
  seats: {
    total: number;
    used: number;
    available: number;
  };
  usage: {
    totalRecords: number;
    thisMonth: number;
    thisWeek: number;
    today: number;
  };
  renewals: {
    pending: number;
    upcoming: number;
    thisMonth: number;
  };
  compliance: {
    checks: number;
    compliant: number;
    nonCompliant: number;
    violations: number;
  };
  quotas: {
    atLimit: number;
    nearLimit: number;
    overage: number;
  };
}

export interface LicenseState {
  licenses: License[];
  licenseKeys: LicenseKey[];
  entitlements: Entitlement[];
  seats: LicenseSeat[];
  quotas: LicenseQuota[];
  usageRecords: UsageRecord[];
  creditWallets: CreditWallet[];
  complianceChecks: ComplianceCheck[];
  renewals: Renewal[];
  subscriptions: LicenseSubscription[];
  trials: LicenseTrial[];
  addOns: LicenseAddOn[];
  bundles: LicenseBundle[];
  overages: LicenseOverage[];
  policies: LicensePolicy[];
  violations: LicenseViolation[];
  events: LicenseEvent[];
  auditLogs: AuditLog[];
}
