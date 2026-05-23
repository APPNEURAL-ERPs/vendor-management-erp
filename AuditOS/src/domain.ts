export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type AuditRole = "owner" | "admin" | "audit_admin" | "compliance_manager" | "security_analyst" | "auditor" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: AuditRole;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Actor extends BaseEntity {
  actorId: string;
  actorType: "user" | "service_account" | "system" | "admin" | "ai_agent";
  displayName?: string;
  email?: string;
  metadata: Record<string, unknown>;
}

export interface Target extends BaseEntity {
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  module?: string;
  metadata: Record<string, unknown>;
}

export interface ChangeSet extends BaseEntity {
  eventId: UUID;
  field: string;
  fieldPath?: string;
  oldValue?: unknown;
  newValue?: unknown;
  changeType: "create" | "update" | "delete" | "access" | "execute" | "export" | "approve" | "reject";
}

export interface EvidenceLink extends BaseEntity {
  eventId: UUID;
  evidenceType: "document" | "screenshot" | "log" | "policy" | "ticket" | "approval" | "signature" | "other";
  title: string;
  uri?: string;
  fileHash?: string;
  uploadedBy: UUID;
  validUntil?: ISODate;
  reviewStatus: "pending" | "approved" | "rejected" | "expired";
  metadata: Record<string, unknown>;
}

export interface RetentionPolicy extends BaseEntity {
  name: string;
  description?: string;
  retentionDays: number;
  appliesTo: string[];
  status: "active" | "inactive" | "archived";
  archived?: boolean;
  metadata: Record<string, unknown>;
}

export interface AuditEvent extends BaseEntity {
  eventType: string;
  module?: string;
  action: string;
  status: "success" | "failure" | "warning" | "blocked";
  actorId: UUID;
  actorType?: string;
  actorDisplayName?: string;
  targetId?: UUID;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  changeSetIds?: UUID[];
  approvalId?: UUID;
  evidenceLinkIds?: UUID[];
  ipAddress?: string;
  device?: string;
  location?: string;
  reason?: string;
  outcome?: string;
  sensitive: boolean;
  complianceRelevant: boolean;
  metadata: Record<string, unknown>;
  previousHash?: string;
  currentHash?: string;
}

export interface AuditReport extends BaseEntity {
  name: string;
  description?: string;
  reportType: "activity" | "access" | "financial" | "security" | "compliance" | "permission" | "data" | "ai_agent" | "custom";
  format: "json" | "csv" | "pdf";
  status: "draft" | "generating" | "completed" | "failed";
  filters: ReportFilters;
  generatedBy: UUID;
  completedAt?: ISODate;
  downloadUrl?: string;
  metadata: Record<string, unknown>;
}

export interface ReportFilters {
  tenantId?: TenantId;
  startDate?: ISODate;
  endDate?: ISODate;
  actorIds?: UUID[];
  resourceTypes?: string[];
  eventTypes?: string[];
  actions?: string[];
  statuses?: string[];
  sensitive?: boolean;
  complianceRelevant?: boolean;
}

export interface ComplianceAudit extends BaseEntity {
  name: string;
  description?: string;
  auditType: "internal" | "external" | "regulatory" | "certification";
  framework?: string;
  scope?: string;
  startDate: ISODate;
  endDate?: ISODate;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  findings?: number;
  evidenceCollected?: number;
  ownerId?: UUID;
  auditorName?: string;
  metadata: Record<string, unknown>;
}

export interface AuditInvestigation extends BaseEntity {
  title: string;
  description?: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  eventIds: UUID[];
  evidenceIds: UUID[];
  assignedTo?: UUID;
  resolvedAt?: ISODate;
  resolution?: string;
  metadata: Record<string, unknown>;
}

export interface IntegrityHash extends BaseEntity {
  eventId: UUID;
  previousHash?: string;
  currentHash: string;
  chainValid: boolean;
  computedAt: ISODate;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: AuditRole;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface AuditOverview {
  totalEvents: number;
  sensitiveEvents: number;
  complianceEvents: number;
  failedEvents: number;
  eventsByType: Record<string, number>;
  eventsByModule: Record<string, number>;
  recentEvents: AuditEvent[];
  evidenceLinks: { total: number; pending: number; approved: number };
  reports: { total: number; completed: number };
  investigations: { open: number; inProgress: number };
}

export interface AuditState {
  events: AuditEvent[];
  actors: Actor[];
  targets: Target[];
  changeSets: ChangeSet[];
  evidenceLinks: EvidenceLink[];
  retentionPolicies: RetentionPolicy[];
  reports: AuditReport[];
  investigations: AuditInvestigation[];
  integrityHashes: IntegrityHash[];
  auditLogs: AuditLog[];
}
