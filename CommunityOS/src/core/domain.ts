export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "communityos_admin" | "manager" | "operator" | "auditor" | "viewer";
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

export interface CommunityItem extends BaseEntity {
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

export interface CommunityWorkflow extends BaseEntity {
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

export interface CommunityWorkRun extends BaseEntity {
  workflowKey: string;
  status: WorkStatus;
  requestedBy: UUID;
  currentStep?: string;
  context: Record<string, unknown>;
  completedAt?: ISODate;
}

export interface CommunityPolicy extends BaseEntity {
  key: string;
  title: string;
  body: string;
  status: EntityStatus;
  ownerTeam: string;
  updatedBy: UUID;
}

export interface CommunityEvent extends BaseEntity {
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

export interface CommunityOverview {
  counts: {
    items: number;
    activeItems: number;
    workflows: number;
    activeWorkflows: number;
    workRuns: number;
    openRuns: number;
    policies: number;
  };
  recentItems: CommunityItem[];
  recentRuns: CommunityWorkRun[];
  recentEvents: CommunityEvent[];
}

export interface CommunityState {
  items: CommunityItem[];
  workflows: CommunityWorkflow[];
  workRuns: CommunityWorkRun[];
  policies: CommunityPolicy[];
  events: CommunityEvent[];
  auditLogs: AuditLog[];
}
