export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "compliance_manager" | "compliance_analyst" | "auditor" | "viewer";
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

export interface ComplianceFramework extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "iso" | "soc2" | "gdpr" | "hipaa" | "pci_dss" | "nist" | "custom";
  version?: string;
  status: EntityStatus;
  ownerId?: UUID;
  controlCount: number;
  complianceScore?: number;
}

export interface ComplianceRequirement extends BaseEntity {
  frameworkId: UUID;
  code: string;
  title: string;
  description?: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "not_started" | "in_progress" | "compliant" | "non_compliant" | "not_applicable";
  ownerId?: UUID;
  dueDate?: ISODate;
  evidenceIds: UUID[];
  metadata: Record<string, unknown>;
}

export interface Regulation extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  country?: string;
  region?: string;
  industry?: string;
  effectiveDate?: ISODate;
  status: EntityStatus;
  requirementCount: number;
}

export interface Policy extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  version: number;
  status: EntityStatus;
  ownerId?: UUID;
  reviewFrequency?: string;
  lastReviewedAt?: ISODate;
  nextReviewAt?: ISODate;
  acknowledgmentRequired: boolean;
  acknowledgmentCount: number;
  totalAcknowledgmentRequired: number;
  documentUri?: string;
  tags: string[];
}

export interface PolicyVersion extends BaseEntity {
  policyId: UUID;
  version: number;
  changes: string;
  createdBy: UUID;
  notes?: string;
}

export interface Control extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  frameworkId?: UUID;
  category: string;
  controlType: "preventive" | "detective" | "corrective" | "deterrent";
  status: "not_started" | "in_progress" | "compliant" | "non_compliant" | "waived";
  severity: "low" | "medium" | "high" | "critical";
  ownerId?: UUID;
  frequency?: string;
  lastTestedAt?: ISODate;
  nextTestAt?: ISODate;
  evidenceIds: UUID[];
  riskIds: UUID[];
  metadata: Record<string, unknown>;
}

export interface ControlTest extends BaseEntity {
  controlId: UUID;
  status: "passed" | "failed" | "not_tested";
  testedBy: UUID;
  testedAt: ISODate;
  evidenceIds: UUID[];
  findings?: string;
  remediationNotes?: string;
}

export interface Certification extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  frameworkId: UUID;
  issuer: string;
  issueDate: ISODate;
  expiryDate?: ISODate;
  status: "active" | "expired" | "revoked" | "pending";
  evidenceIds: UUID[];
  auditIds: UUID[];
}

export interface Audit extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "internal" | "external" | "certification" | "regulatory";
  status: "planned" | "in_progress" | "completed" | "cancelled";
  frameworkId?: UUID;
  auditorName?: string;
  scope?: string;
  startDate?: ISODate;
  endDate?: ISODate;
  findings: AuditFinding[];
  ownerId?: UUID;
  evidenceIds: UUID[];
  checklistIds: UUID[];
}

export interface AuditFinding extends BaseEntity {
  auditId: UUID;
  title: string;
  description?: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "accepted_risk";
  ownerId?: UUID;
  dueDate?: ISODate;
  resolvedAt?: ISODate;
  remediationTaskId?: UUID;
  evidenceIds: UUID[];
  notes?: string;
}

export interface AuditChecklist extends BaseEntity {
  auditId?: UUID;
  name: string;
  description?: string;
  items: ChecklistItem[];
  status: "draft" | "active" | "completed";
}

export interface ChecklistItem {
  id: UUID;
  title: string;
  description?: string;
  category?: string;
  status: "pending" | "completed" | "not_applicable";
  evidenceIds: UUID[];
  completedAt?: ISODate;
  completedBy?: UUID;
  notes?: string;
}

export interface Evidence extends BaseEntity {
  key?: string;
  title: string;
  description?: string;
  type: "document" | "screenshot" | "log" | "policy" | "ticket" | "certificate" | "report" | "other";
  uri?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: UUID;
  status: "active" | "archived" | "expired";
  expiryDate?: ISODate;
  controlIds: UUID[];
  requirementIds: UUID[];
  auditIds: UUID[];
  metadata: Record<string, unknown>;
}

export interface EvidenceRequest extends BaseEntity {
  title: string;
  description?: string;
  controlId?: UUID;
  requestedBy: UUID;
  requestedFrom?: UUID;
  status: "pending" | "submitted" | "approved" | "rejected";
  dueDate?: ISODate;
  evidenceId?: UUID;
  notes?: string;
}

export interface Risk extends BaseEntity {
  key: string;
  title: string;
  description?: string;
  category: "data_privacy" | "security" | "legal" | "operational" | "financial" | "vendor" | "ai" | "compliance_breach" | "access_control" | "reputation";
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  riskScore: number;
  status: "identified" | "mitigated" | "accepted" | "transferred" | "resolved";
  ownerId?: UUID;
  mitigationPlan?: string;
  mitigationTaskIds: UUID[];
  controlIds: UUID[];
  residualRisk?: number;
  reviewedAt?: ISODate;
  acceptedBy?: UUID;
  acceptedAt?: ISODate;
}

export interface RemediationTask extends BaseEntity {
  key?: string;
  title: string;
  description?: string;
  status: "open" | "assigned" | "in_progress" | "waiting_evidence" | "ready_review" | "closed" | "overdue" | "accepted_risk";
  priority: "low" | "medium" | "high" | "critical";
  ownerId?: UUID;
  assignedTo?: UUID;
  findingId?: UUID;
  riskId?: UUID;
  dueDate?: ISODate;
  completedAt?: ISODate;
  evidenceIds: UUID[];
  notes?: string;
}

export interface ComplianceChecklist extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  type: "onboarding" | "access_review" | "vendor" | "project" | "privacy" | "general";
  status: EntityStatus;
  ownerId?: UUID;
  department?: string;
  items: ChecklistItem[];
  assignedTo?: UUID[];
  dueDate?: ISODate;
  completedAt?: ISODate;
  completionRate: number;
}

export interface VendorCompliance extends BaseEntity {
  name: string;
  description?: string;
  vendorType: string;
  riskLevel: "low" | "medium" | "high";
  status: "pending" | "reviewed" | "approved" | "rejected" | "expired";
  questionnaireIds: UUID[];
  documentIds: UUID[];
  securityScore?: number;
  complianceScore?: number;
  lastReviewedAt?: ISODate;
  nextReviewAt?: ISODate;
  contractExpiry?: ISODate;
  evidenceIds: UUID[];
  ownerId?: UUID;
  notes?: string;
}

export interface AccessReview extends BaseEntity {
  name: string;
  description?: string;
  status: "draft" | "active" | "completed";
  reviewerId: UUID;
  scope?: string;
  dueAt?: ISODate;
  completedAt?: ISODate;
  items: AccessReviewItem[];
  completionRate: number;
}

export interface AccessReviewItem {
  identityId: UUID;
  identityName: string;
  roleId?: UUID;
  roleName?: string;
  resource?: string;
  status: "pending" | "approved" | "revoked" | "needs_change";
  decisionBy?: UUID;
  decisionAt?: ISODate;
  notes?: string;
}

export interface PrivacyRequest extends BaseEntity {
  type: "access" | "deletion" | "rectification" | "portability" | "consent_withdrawal";
  requesterEmail: string;
  status: "received" | "in_progress" | "completed" | "rejected";
  receivedAt: ISODate;
  completedAt?: ISODate;
  dueDate?: ISODate;
  assigneeId?: UUID;
  evidenceIds: UUID[];
  notes?: string;
}

export interface ComplianceException extends BaseEntity {
  title: string;
  description?: string;
  controlId?: UUID;
  riskId?: UUID;
  status: "pending" | "approved" | "rejected" | "expired";
  requestedBy: UUID;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  expiryDate?: ISODate;
  justification?: string;
  compensatingControls?: string;
  notes?: string;
}

export interface ComplianceReport extends BaseEntity {
  name: string;
  description?: string;
  type: "executive_summary" | "detailed" | "gap_analysis" | "audit_report" | "risk_report" | "custom";
  frameworkId?: UUID;
  startDate?: ISODate;
  endDate?: ISODate;
  generatedBy: UUID;
  status: "draft" | "generated" | "approved" | "archived";
  content: string;
  attachmentUri?: string;
}

export interface ComplianceViolation extends BaseEntity {
  title: string;
  description?: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "detected" | "investigating" | "contained" | "resolved" | "accepted_risk";
  detectedAt: ISODate;
  resolvedAt?: ISODate;
  controlId?: UUID;
  requirementId?: UUID;
  riskId?: UUID;
  evidenceIds: UUID[];
  remediationTaskId?: UUID;
  reportedBy?: UUID;
  notes?: string;
}

export interface ComplianceEvent extends BaseEntity {
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

export interface ComplianceOverview {
  frameworks: { total: number; active: number };
  controls: { total: number; compliant: number; nonCompliant: number; inProgress: number };
  audits: { total: number; completed: number; inProgress: number; planned: number };
  findings: { total: number; open: number; critical: number; high: number };
  risks: { total: number; high: number; medium: number; low: number };
  policies: { total: number; acknowledged: number; pending: number };
  evidence: { total: number; pending: number; expiringSoon: number };
  complianceScore: number;
}

export interface ComplianceState {
  frameworks: ComplianceFramework[];
  requirements: ComplianceRequirement[];
  regulations: Regulation[];
  policies: Policy[];
  policyVersions: PolicyVersion[];
  controls: Control[];
  controlTests: ControlTest[];
  certifications: Certification[];
  audits: Audit[];
  auditFindings: AuditFinding[];
  auditChecklists: AuditChecklist[];
  evidences: Evidence[];
  evidenceRequests: EvidenceRequest[];
  risks: Risk[];
  remediationTasks: RemediationTask[];
  checklists: ComplianceChecklist[];
  vendorCompliances: VendorCompliance[];
  accessReviews: AccessReview[];
  privacyRequests: PrivacyRequest[];
  exceptions: ComplianceException[];
  reports: ComplianceReport[];
  violations: ComplianceViolation[];
  events: ComplianceEvent[];
  auditLogs: AuditLog[];
}
