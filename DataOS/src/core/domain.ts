export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "dataos_admin" | "manager" | "operator" | "auditor" | "viewer";
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

export interface DataItem extends BaseEntity {
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

export interface DataWorkflow extends BaseEntity {
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

export interface DataWorkRun extends BaseEntity {
  workflowKey: string;
  status: WorkStatus;
  requestedBy: UUID;
  currentStep?: string;
  context: Record<string, unknown>;
  completedAt?: ISODate;
}

export interface DataPolicy extends BaseEntity {
  key: string;
  title: string;
  body: string;
  status: EntityStatus;
  ownerTeam: string;
  updatedBy: UUID;
}

export interface DataEvent extends BaseEntity {
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

export interface DataOverview {
  counts: {
    items: number;
    activeItems: number;
    workflows: number;
    activeWorkflows: number;
    workRuns: number;
    openRuns: number;
    policies: number;
  };
  recentItems: DataItem[];
  recentRuns: DataWorkRun[];
  recentEvents: DataEvent[];
}

export interface DataState {
  items: DataItem[];
  workflows: DataWorkflow[];
  workRuns: DataWorkRun[];
  policies: DataPolicy[];
  events: DataEvent[];
  auditLogs: AuditLog[];
}
