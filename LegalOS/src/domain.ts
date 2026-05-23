export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "legal_admin" | "legal_counsel" | "paralegal" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft" | "pending" | "approved" | "rejected";

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

export interface LegalCase extends BaseEntity {
  caseNumber: string;
  title: string;
  description?: string;
  caseType: "litigation" | "arbitration" | "mediation" | "corporate" | "ip" | "employment" | "real_estate" | "tax" | "regulatory" | "other";
  status: "open" | "pending" | "active" | "on_hold" | "closed" | "archived";
  priority: "low" | "medium" | "high" | "critical";
  court?: string;
  judge?: string;
  opposingCounsel?: string;
  matterId?: UUID;
  assignedCounselId?: UUID;
  budget?: number;
  spend?: number;
  openedAt: ISODate;
  closedAt?: ISODate;
  nextHearing?: ISODate;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface LegalMatter extends BaseEntity {
  matterNumber: string;
  title: string;
  description?: string;
  matterType: "corporate" | "commercial" | "employment" | "ip" | "real_estate" | "regulatory" | "compliance" | "other";
  status: "active" | "pending" | "closed" | "archived";
  priority: "low" | "medium" | "high" | "critical";
  clientName?: string;
  clientContact?: string;
  assignedCounselId?: UUID;
  caseIds: UUID[];
  budget?: number;
  startDate: ISODate;
  endDate?: ISODate;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface LegalDocument extends BaseEntity {
  title: string;
  documentType: "contract" | "agreement" | "nda" | "policy" | "terms" | "privacy" | "notice" | "letter" | "motion" | "brief" | "pleading" | "evidence" | "correspondence" | "other";
  status: EntityStatus;
  caseId?: UUID;
  matterId?: UUID;
  contractId?: UUID;
  party?: string;
  content?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  version?: number;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  signedAt?: ISODate;
  expiresAt?: ISODate;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Contract extends BaseEntity {
  contractNumber: string;
  title: string;
  contractType: "service" | "vendor" | "client" | "employment" | "nda" | "partnership" | "license" | "lease" | "loan" | "other";
  status: "draft" | "under_review" | "approved" | "sent_for_signature" | "signed" | "active" | "expired" | "renewal_due" | "terminated" | "archived";
  partyName: string;
  partyEmail?: string;
  value?: number;
  currency?: string;
  startDate: ISODate;
  endDate?: ISODate;
  renewalDate?: ISODate;
  paymentTerms?: string;
  autoRenew?: boolean;
  caseId?: UUID;
  matterId?: UUID;
  assignedCounselId?: UUID;
  clauses: ContractClause[];
  obligations: ContractObligation[];
  risks: ContractRisk[];
  signedAt?: ISODate;
  signatures: Signature[];
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface ContractClause {
  id: UUID;
  title: string;
  text: string;
  category: "payment" | "confidentiality" | "ip" | "termination" | "liability" | "indemnity" | "data_protection" | "sla" | "dispute_resolution" | "governing_law" | "force_majeure" | "non_compete" | "non_solicit" | "other";
  riskLevel: "low" | "medium" | "high" | "critical";
  riskNotes?: string;
  isRequired?: boolean;
  isModified?: boolean;
  originalText?: string;
}

export interface ContractObligation extends BaseEntity {
  contractId: UUID;
  title: string;
  description?: string;
  obligationType: "payment" | "delivery" | "reporting" | "maintenance" | "confidentiality" | "compliance" | "renewal" | "other";
  status: "pending" | "in_progress" | "completed" | "overdue" | "waived";
  dueDate?: ISODate;
  completedDate?: ISODate;
  ownerId?: UUID;
  assigneeId?: UUID;
  evidenceIds: UUID[];
  notes?: string;
}

export interface ContractRisk {
  id: UUID;
  contractId?: UUID;
  clauseId?: UUID;
  riskType: "unlimited_liability" | "unclear_payment" | "no_termination" | "no_confidentiality" | "auto_renewal" | "strong_penalty" | "data_protection" | "ip_ownership" | "other";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  recommendation?: string;
  status: "identified" | "accepted" | "mitigated" | "transferred";
}

export interface Signature extends BaseEntity {
  signerName: string;
  signerEmail: string;
  signerRole?: string;
  status: "pending" | "sent" | "signed" | "declined" | "expired";
  signedAt?: ISODate;
  signedIp?: string;
  signedUserAgent?: string;
  declineReason?: string;
}

export interface LegalHold extends BaseEntity {
  holdNumber: string;
  title: string;
  description?: string;
  caseId?: UUID;
  matterId?: UUID;
  status: "active" | "released" | "expired";
  holdType: "litigation" | "investigation" | "regulatory" | "compliance" | "other";
  custodianIds: UUID[];
  dataSources: string[];
  scope?: string;
  startDate: ISODate;
  endDate?: ISODate;
  releasedAt?: ISODate;
  notes?: string;
}

export interface Counsel extends BaseEntity {
  counselNumber: string;
  name: string;
  email: string;
  phone?: string;
  firm?: string;
  barNumber?: string;
  jurisdiction?: string;
  specialties: string[];
  status: "active" | "inactive" | "on_leave";
  hourlyRate?: number;
  caseIds: UUID[];
  matterIds: UUID[];
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface LegalInvoice extends BaseEntity {
  invoiceNumber: string;
  counselId?: UUID;
  caseId?: UUID;
  matterId?: UUID;
  description: string;
  invoiceDate: ISODate;
  dueDate: ISODate;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "paid" | "overdue" | "disputed" | "cancelled";
  lineItems: InvoiceLineItem[];
  approvedBy?: UUID;
  approvedAt?: ISODate;
  paidAt?: ISODate;
  paymentReference?: string;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface InvoiceLineItem {
  description: string;
  hours?: number;
  rate?: number;
  amount: number;
  date?: ISODate;
}

export interface NDA extends BaseEntity {
  ndaNumber: string;
  title: string;
  ndaType: "one_way" | "mutual" | "employee" | "vendor" | "client";
  status: "draft" | "sent" | "signed" | "expired" | "terminated" | "archived";
  partyName: string;
  partyEmail?: string;
  purpose?: string;
  confidentialInfo?: string;
  effectiveDate: ISODate;
  expirationDate?: ISODate;
  autoRenew?: boolean;
  renewalTermDays?: number;
  caseId?: UUID;
  matterId?: UUID;
  signatures: Signature[];
  signedAt?: ISODate;
  scope?: string;
  exclusions?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface LegalTemplate extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  templateType: "contract" | "nda" | "policy" | "notice" | "letter" | "agreement" | "terms" | "privacy" | "other";
  category: string;
  content: string;
  variables: TemplateVariable[];
  status: "active" | "inactive" | "archived";
  version: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: "string" | "number" | "date" | "boolean" | "select";
  required?: boolean;
  defaultValue?: unknown;
  options?: string[];
}

export interface LegalNotice extends BaseEntity {
  noticeNumber: string;
  title: string;
  noticeType: "payment" | "breach" | "termination" | "reminder" | "default" | "dispute" | "settlement" | "other";
  status: "draft" | "sent" | "delivered" | "acknowledged" | "responded" | "closed";
  recipientName: string;
  recipientEmail?: string;
  recipientAddress?: string;
  subject?: string;
  content?: string;
  caseId?: UUID;
  matterId?: UUID;
  contractId?: UUID;
  sentAt?: ISODate;
  deliveredAt?: ISODate;
  acknowledgedAt?: ISODate;
  responseDue?: ISODate;
  response?: string;
  deliveryMethod?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Dispute extends BaseEntity {
  disputeNumber: string;
  title: string;
  description?: string;
  disputeType: "payment" | "scope" | "delivery" | "quality" | "breach" | "vendor" | "customer" | "ip" | "other";
  status: "open" | "negotiating" | "escalated" | "resolved" | "litigated" | "closed";
  severity: "low" | "medium" | "high" | "critical";
  caseId?: UUID;
  matterId?: UUID;
  contractId?: UUID;
  partyName: string;
  partyContact?: string;
  amount?: number;
  currency?: string;
  openedAt: ISODate;
  resolvedAt?: ISODate;
  resolution?: string;
  assignedCounselId?: UUID;
  timeline: DisputeEvent[];
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface DisputeEvent {
  date: ISODate;
  action: string;
  description?: string;
  actor?: string;
}

export interface IPAsset extends BaseEntity {
  assetNumber: string;
  name: string;
  assetType: "trademark" | "copyright" | "patent" | "trade_secret" | "domain" | "source_code" | "design" | "content" | "other";
  status: "registered" | "pending" | "active" | "expired" | "transferred" | "abandoned";
  registrationNumber?: string;
  jurisdiction?: string;
  owner?: string;
  description?: string;
  caseIds: UUID[];
  renewalDate?: ISODate;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface ApprovalRequest extends BaseEntity {
  requestNumber: string;
  requestType: "contract" | "nda" | "policy" | "document" | "settlement" | "other";
  title: string;
  description?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requestorId: UUID;
  approverId?: UUID;
  caseId?: UUID;
  matterId?: UUID;
  contractId?: UUID;
  documentId?: UUID;
  priority: "low" | "medium" | "high" | "critical";
  dueDate?: ISODate;
  decidedAt?: ISODate;
  decisionNotes?: string;
  comments: ApprovalComment[];
}

export interface ApprovalComment {
  commentId: UUID;
  userId: UUID;
  comment: string;
  createdAt: ISODate;
}

export interface LegalEvent extends BaseEntity {
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

export interface LegalOverview {
  cases: { total: number; open: number; byType: Record<string, number> };
  matters: { total: number; active: number };
  documents: { total: number; byStatus: Record<string, number> };
  contracts: { total: number; active: number; expiring: number };
  ndas: { total: number; active: number; expiring: number };
  invoices: { pending: number; overdue: number; totalAmount: number };
  disputes: { open: number; bySeverity: Record<string, number> };
  holds: { active: number };
  counsel: { total: number; active: number };
}

export interface LegalState {
  cases: LegalCase[];
  matters: LegalMatter[];
  documents: LegalDocument[];
  contracts: Contract[];
  obligations: ContractObligation[];
  holds: LegalHold[];
  counsel: Counsel[];
  invoices: LegalInvoice[];
  ndas: NDA[];
  templates: LegalTemplate[];
  notices: LegalNotice[];
  disputes: Dispute[];
  ipAssets: IPAsset[];
  approvals: ApprovalRequest[];
  events: LegalEvent[];
  auditLogs: AuditLog[];
}
