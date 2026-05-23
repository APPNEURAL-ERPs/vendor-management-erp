export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "legal_admin" | "contract_manager" | "legal_reviewer" | "finance_approver" | "viewer";
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

export type ContractStatus = "draft" | "internal_review" | "legal_review" | "client_review" | "negotiation" | "pending_approval" | "approved" | "ready_for_signature" | "sent_for_signature" | "partially_signed" | "signed" | "active" | "expired" | "terminated" | "renewed" | "amended" | "archived";

export type ContractType = "service_agreement" | "nda" | "msa" | "sow" | "vendor_agreement" | "partner_agreement" | "employment_agreement" | "freelancer_agreement" | "retainer_agreement" | "license_agreement" | "subscription_agreement" | "other";

export type PartyRole = "client" | "vendor" | "partner" | "service_provider" | "employee" | "consultant" | "licensor" | "licensee" | "witness" | "approver" | "signer";

export interface ContractParty extends BaseEntity {
  name: string;
  legalName?: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
  role: PartyRole;
  authorizedSignatory?: string;
  status: "verified" | "pending" | "unverified";
  metadata: Record<string, unknown>;
}

export interface ContractClause extends BaseEntity {
  key: string;
  name: string;
  category: string;
  content: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  status: EntityStatus;
  tags: string[];
  version: number;
  metadata: Record<string, unknown>;
}

export interface ContractTemplate extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: ContractType;
  content: string;
  clauses: string[];
  status: EntityStatus;
  tags: string[];
  version: number;
  metadata: Record<string, unknown>;
}

export interface ContractVersion extends BaseEntity {
  contractId: UUID;
  version: number;
  content: string;
  changes: string;
  createdBy: UUID;
  notes?: string;
  status: "draft" | "finalized";
}

export interface ContractReview extends BaseEntity {
  contractId: UUID;
  reviewType: "legal" | "finance" | "business" | "security" | "privacy";
  status: "pending" | "in_progress" | "approved" | "rejected" | "needs_changes";
  comments: string;
  reviewedBy?: UUID;
  reviewedAt?: ISODate;
  createdBy: UUID;
}

export interface ContractApproval extends BaseEntity {
  contractId: UUID;
  approvalType: "single" | "multi_level";
  approverRole: string;
  status: "pending" | "approved" | "rejected" | "escalated";
  approvedBy?: UUID;
  approvedAt?: ISODate;
  comments?: string;
  sequence: number;
  createdBy: UUID;
}

export interface ContractNegotiation extends BaseEntity {
  contractId: UUID;
  status: "not_started" | "sent_to_counterparty" | "under_negotiation" | "changes_requested" | "counterparty_approved" | "internally_approved" | "finalized";
  redlines: ContractRedline[];
  timeline: NegotiationTimelineEntry[];
  ownerId?: UUID;
  createdBy: UUID;
}

export interface ContractRedline extends BaseEntity {
  negotiationId: UUID;
  clauseId?: UUID;
  originalText: string;
  newText: string;
  changeType: "added" | "removed" | "modified";
  status: "pending" | "accepted" | "rejected" | "modified";
  changedBy: UUID;
  resolvedBy?: UUID;
  resolvedAt?: ISODate;
}

export interface NegotiationTimelineEntry {
  timestamp: ISODate;
  action: string;
  actorId: UUID;
  notes?: string;
}

export interface ContractSignature extends BaseEntity {
  contractId: UUID;
  signerPartyId: UUID;
  signerName: string;
  signerEmail: string;
  signerRole: PartyRole;
  status: "pending" | "sent" | "viewed" | "signed" | "declined" | "expired" | "cancelled";
  signedAt?: ISODate;
  signatureData?: string;
  ipAddress?: string;
  order: number;
  createdBy: UUID;
}

export interface ContractAmendment extends BaseEntity {
  contractId: UUID;
  version: string;
  title: string;
  description: string;
  effectiveDate: ISODate;
  status: "draft" | "pending_approval" | "approved" | "signed" | "effective" | "rejected";
  changes: AmendmentChange[];
  createdBy: UUID;
  approvedBy?: UUID;
  approvedAt?: ISODate;
}

export interface AmendmentChange {
  field: string;
  oldValue: string;
  newValue: string;
  description: string;
}

export interface ContractObligation extends BaseEntity {
  contractId: UUID;
  title: string;
  description?: string;
  responsiblePartyId?: UUID;
  sourceClause?: string;
  dueDate: ISODate;
  status: "pending" | "in_progress" | "completed" | "overdue" | "cancelled";
  completedAt?: ISODate;
  evidence?: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  metadata: Record<string, unknown>;
  createdBy: UUID;
}

export interface ContractRenewal extends BaseEntity {
  contractId: UUID;
  renewalDate: ISODate;
  newExpiryDate: ISODate;
  newValue?: number;
  status: "pending" | "negotiating" | "approved" | "rejected" | "completed" | "expired";
  autoRenew: boolean;
  renewalTerms?: string;
  createdBy: UUID;
  completedAt?: ISODate;
}

export interface ContractRisk extends BaseEntity {
  contractId: UUID;
  title: string;
  description: string;
  category: "missing_clause" | "liability" | "payment" | "renewal" | "compliance" | "termination" | "ip" | "data_protection" | "other";
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "mitigated" | "accepted" | "resolved";
  mitigation?: string;
  ownerId?: UUID;
  createdBy: UUID;
}

export interface ContractDocument extends BaseEntity {
  contractId: UUID;
  title: string;
  fileType: "pdf" | "docx" | "other";
  fileUrl?: string;
  status: "draft" | "final" | "signed" | "archived";
  version: number;
  uploadedBy: UUID;
}

export interface ContractEvent extends BaseEntity {
  type: string;
  source: string;
  contractId?: UUID;
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

export interface Contract extends BaseEntity {
  title: string;
  type: ContractType;
  status: ContractStatus;
  description?: string;
  effectiveDate?: ISODate;
  expiryDate?: ISODate;
  value?: number;
  currency: string;
  paymentTerms?: string;
  renewalTerms?: string;
  governingLaw?: string;
  terminationTerms?: string;
  partyIds: UUID[];
  clauseIds: UUID[];
  templateId?: UUID;
  version: number;
  currentVersionId?: UUID;
  ownerId?: UUID;
  locked: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy: UUID;
}

export interface ContractOverview {
  contracts: {
    total: number;
    active: number;
    draft: number;
    pendingApproval: number;
    pendingSignature: number;
    expiringSoon: number;
    expired: number;
  };
  obligations: {
    total: number;
    pending: number;
    overdue: number;
    completed: number;
  };
  risks: {
    total: number;
    bySeverity: Record<string, number>;
  };
  byType: Record<string, number>;
  totalValue: number;
  pendingValue: number;
}

export interface ContractState {
  contracts: Contract[];
  parties: ContractParty[];
  clauses: ContractClause[];
  templates: ContractTemplate[];
  versions: ContractVersion[];
  reviews: ContractReview[];
  approvals: ContractApproval[];
  negotiations: ContractNegotiation[];
  redlines: ContractRedline[];
  signatures: ContractSignature[];
  amendments: ContractAmendment[];
  obligations: ContractObligation[];
  renewals: ContractRenewal[];
  risks: ContractRisk[];
  documents: ContractDocument[];
  events: ContractEvent[];
  auditLogs: AuditLog[];
}
