export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "policy_admin" | "policy_manager" | "compliance_manager" | "auditor" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";
export type PolicyStatus = "draft" | "in_review" | "approved" | "published" | "deprecated" | "archived";
export type ExceptionStatus = "requested" | "under_review" | "approved" | "rejected" | "expired" | "revoked" | "closed";
export type ViolationSeverity = "low" | "medium" | "high" | "critical";
export type ViolationStatus = "open" | "investigating" | "resolved" | "accepted_risk";
export type AcknowledgmentStatus = "pending" | "acknowledged" | "declined" | "expired" | "overdue" | "not_required";
export type ReviewStatus = "scheduled" | "in_progress" | "completed" | "overdue";
export type ReviewCycle = "monthly" | "quarterly" | "half_yearly" | "yearly" | "event_based" | "regulation_change";
export type DecisionEffect = "allow" | "deny";

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

export interface PolicyRule extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  effect: DecisionEffect;
  subjectRoles: string[];
  actions: string[];
  resources: string[];
  conditions: Record<string, unknown>;
  priority: number;
  status: EntityStatus;
  createdBy: UUID;
}

export interface PolicyVersion extends BaseEntity {
  policyId: UUID;
  version: number;
  template: string;
  rules: PolicyRule[];
  createdBy: UUID;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  notes?: string;
  status: PolicyStatus;
}

export interface Policy extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  status: PolicyStatus;
  ownerId: UUID;
  ownerName?: string;
  reviewCycle: ReviewCycle;
  nextReviewDate?: ISODate;
  activeVersion: number;
  versions: PolicyVersion[];
  metadata: Record<string, unknown>;
  createdBy: UUID;
  publishedAt?: ISODate;
}

export interface Guardrail extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  effect: DecisionEffect;
  conditions: Record<string, unknown>;
  priority: number;
  status: EntityStatus;
  createdBy: UUID;
}

export interface RateLimit extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  resource: string;
  limit: number;
  windowSeconds: number;
  status: EntityStatus;
  createdBy: UUID;
}

export interface ApprovalRule extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  policyId?: UUID;
  ruleId?: UUID;
  requiredApprovers: Array<{ role: string; userId?: UUID }>;
  minApprovers: number;
  autoExpireHours?: number;
  status: EntityStatus;
  createdBy: UUID;
}

export interface Decision extends BaseEntity {
  policyId?: UUID;
  ruleId?: UUID;
  subjectId: UUID;
  subjectType: "user" | "service_account" | "agent" | "system";
  action: string;
  resource: string;
  effect: DecisionEffect;
  reasons: string[];
  matchedPolicyIds: UUID[];
  matchedRuleIds: UUID[];
  evaluatedBy: UUID;
}

export interface AccessDecision {
  allowed: boolean;
  subjectId: UUID;
  subjectType: "user" | "service_account" | "agent" | "system";
  action: string;
  resource: string;
  permissions: string[];
  roles: string[];
  matchedPolicyIds: UUID[];
  matchedRuleIds: UUID[];
  reasons: string[];
  evaluatedAt: ISODate;
  decisionId?: UUID;
}

export interface EnforcementLog extends BaseEntity {
  policyId?: UUID;
  ruleId?: UUID;
  decisionId?: UUID;
  action: string;
  resource: string;
  subjectId: UUID;
  subjectType: "user" | "service_account" | "agent" | "system";
  effect: DecisionEffect;
  enforcedBy: UUID;
  enforcementPoint: string;
  metadata: Record<string, unknown>;
}

export interface PolicyException extends BaseEntity {
  policyId: UUID;
  ruleId?: UUID;
  requestedBy: UUID;
  requestedByName?: string;
  reason: string;
  justification: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  evidenceIds: UUID[];
  approvedBy?: UUID;
  approvedByName?: string;
  approvedAt?: ISODate;
  expiresAt?: ISODate;
  status: ExceptionStatus;
  notes?: string;
}

export interface PolicyViolation extends BaseEntity {
  policyId: UUID;
  ruleId?: UUID;
  exceptionId?: UUID;
  subjectId: UUID;
  subjectType: "user" | "service_account" | "agent" | "system";
  action: string;
  resource: string;
  severity: ViolationSeverity;
  status: ViolationStatus;
  detectedAt: ISODate;
  resolvedAt?: ISODate;
  resolvedBy?: UUID;
  ownerId?: UUID;
  description?: string;
  remediation?: string;
  evidenceIds: UUID[];
}

export interface PolicyAcknowledgment extends BaseEntity {
  policyId: UUID;
  version: number;
  userId: UUID;
  userName?: string;
  acknowledgedAt?: ISODate;
  status: AcknowledgmentStatus;
  reminderSentAt?: ISODate;
  dueDate?: ISODate;
}

export interface PolicyReview extends BaseEntity {
  policyId: UUID;
  reviewerId: UUID;
  reviewerName?: string;
  status: ReviewStatus;
  scheduledAt: ISODate;
  completedAt?: ISODate;
  notes?: string;
  findings?: string;
  nextReviewDate?: ISODate;
}

export interface PolicyEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
  actorId?: UUID;
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

export interface PolicyOverview {
  policies: {
    total: number;
    active: number;
    draft: number;
    inReview: number;
    published: number;
    deprecated: number;
  };
  rules: {
    total: number;
    active: number;
  };
  guardrails: {
    total: number;
    active: number;
  };
  rateLimits: {
    total: number;
    active: number;
  };
  exceptions: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  violations: {
    total: number;
    open: number;
    resolved: number;
    bySeverity: Record<ViolationSeverity, number>;
  };
  acknowledgments: {
    total: number;
    pending: number;
    acknowledged: number;
    overdue: number;
  };
  reviews: {
    total: number;
    overdue: number;
    scheduled: number;
  };
  decisions: {
    total: number;
    allowed: number;
    denied: number;
  };
}

export interface PolicyState {
  policies: Policy[];
  rules: PolicyRule[];
  decisions: Decision[];
  guardrails: Guardrail[];
  policyVersions: PolicyVersion[];
  enforcementLogs: EnforcementLog[];
  rateLimits: RateLimit[];
  approvalRules: ApprovalRule[];
  accessDecisions: AccessDecision[];
  exceptions: PolicyException[];
  violations: PolicyViolation[];
  acknowledgments: PolicyAcknowledgment[];
  reviews: PolicyReview[];
  events: PolicyEvent[];
  auditLogs: AuditLog[];
}
