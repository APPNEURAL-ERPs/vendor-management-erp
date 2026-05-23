export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "complianceos_admin" | "manager" | "operator" | "auditor" | "viewer";
export type EntityStatus = "draft" | "active" | "paused" | "archived";
export type WorkStatus = "todo" | "in_progress" | "blocked" | "done" | "cancelled";
export type Priority = "low" | "normal" | "high" | "critical";

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: Role;
}

export interface ComplianceItem extends BaseEntity {
  key: string;
  title: string;
  description?: string;
  category: string;
  ownerTeam: string;
  status: EntityStatus;
  priority: Priority;
  tags: string[];
  metadata: Record<string, unknown>;
  updatedBy: UUID;
}

export interface ComplianceWorkflow extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  category: string;
  status: EntityStatus;
  itemKeys: string[];
  steps: string[];
  ownerTeam: string;
  updatedBy: UUID;
}

export interface ComplianceWorkRun extends BaseEntity {
  workflowKey: string;
  status: WorkStatus;
  requestedBy: UUID;
  currentStep?: string;
  context: Record<string, unknown>;
  completedAt?: ISODate;
}

export interface CompliancePolicy extends BaseEntity {
  key: string;
  title: string;
  body: string;
  status: EntityStatus;
  ownerTeam: string;
  updatedBy: UUID;
}

export interface ComplianceEvent extends BaseEntity {
  type: string;
  source: string;
  actorId?: UUID;
  role?: Role;
  data: Record<string, unknown>;
}

export interface AuditLog extends BaseEntity {
  action: string;
  actorId: UUID;
  role: Role;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface ComplianceOverview {
  counts: {
    items: number;
    activeItems: number;
    workflows: number;
    activeWorkflows: number;
    workRuns: number;
    openRuns: number;
    policies: number;
  };
  recentItems: ComplianceItem[];
  recentRuns: ComplianceWorkRun[];
  recentEvents: ComplianceEvent[];
}

export interface ComplianceState {
  items: ComplianceItem[];
  workflows: ComplianceWorkflow[];
  workRuns: ComplianceWorkRun[];
  policies: CompliancePolicy[];
  events: ComplianceEvent[];
  auditLogs: AuditLog[];
}
