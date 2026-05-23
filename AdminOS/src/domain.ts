export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type AdminRole = "viewer" | "admin" | "org_admin" | "approval_manager" | "resource_manager" | "owner";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";
export type RequestStatus = "draft" | "submitted" | "in_review" | "approved" | "rejected" | "completed" | "cancelled";
export type RequestPriority = "low" | "medium" | "high" | "critical";
export type ResourceType = "storage" | "compute" | "bandwidth" | "api_calls" | "users" | "custom";
export type ResourceStatus = "available" | "allocated" | "reserved" | "exhausted";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: AdminRole;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface AdminSetting extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  value: string | number | boolean | object;
  valueType: "string" | "number" | "boolean" | "json";
  category: "general" | "security" | "notification" | "billing" | "feature_flag" | "custom";
  status: EntityStatus;
  editable: boolean;
  visible: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface OrgUnit extends BaseEntity {
  name: string;
  description?: string;
  type: "company" | "branch" | "department" | "team" | "unit";
  parentId?: UUID;
  status: EntityStatus;
  metadata: Record<string, unknown>;
}

export interface InternalRequest extends BaseEntity {
  title: string;
  description?: string;
  type: "access" | "resource" | "approval" | "support" | "change" | "incident";
  status: RequestStatus;
  priority: RequestPriority;
  requestedBy: UUID;
  assignedTo?: UUID;
  orgUnitId?: UUID;
  data: Record<string, unknown>;
  attachments: string[];
  comments: RequestComment[];
  slaDeadline?: ISODate;
  completedAt?: ISODate;
}

export interface RequestComment {
  id: UUID;
  userId: UUID;
  content: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface ResourceRecord extends BaseEntity {
  name: string;
  description?: string;
  type: ResourceType;
  status: ResourceStatus;
  allocatedTo?: UUID;
  orgUnitId?: UUID;
  quota: number;
  used: number;
  unit: string;
  metadata: Record<string, unknown>;
}

export interface AdminApproval extends BaseEntity {
  name: string;
  description?: string;
  type: "request" | "access" | "change" | "expense" | "resource" | "custom";
  status: ApprovalStatus;
  requestId?: UUID;
  requestedBy: UUID;
  approvedBy?: UUID;
  decisionAt?: ISODate;
  reason?: string;
  workflow: ApprovalStep[];
  currentStep: number;
  metadata: Record<string, unknown>;
}

export interface ApprovalStep {
  step: number;
  approverId?: UUID;
  approverRole?: AdminRole;
  status: ApprovalStatus;
  decisionAt?: ISODate;
  reason?: string;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: AdminRole;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
  metadata: Record<string, unknown>;
}

export interface AdminEvent extends BaseEntity {
  type: string;
  source: string;
  actorId: UUID;
  data: Record<string, unknown>;
}

export interface AdminOverview {
  settings: { total: number; active: number; byCategory: Record<string, number> };
  orgUnits: { total: number; byType: Record<string, number> };
  requests: { total: number; byStatus: Record<string, number>; byPriority: Record<string, number> };
  resources: { total: number; byType: Record<string, number>; byStatus: Record<string, number> };
  approvals: { total: number; pending: number; byStatus: Record<string, number> };
}

export interface AdminState {
  settings: AdminSetting[];
  orgUnits: OrgUnit[];
  requests: InternalRequest[];
  resources: ResourceRecord[];
  approvals: AdminApproval[];
  events: AdminEvent[];
  auditLogs: AuditLog[];
}
