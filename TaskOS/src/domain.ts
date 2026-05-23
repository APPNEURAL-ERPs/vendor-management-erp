export type UUID = string;
export type TenantId = string;
export type ISODate = string;
export type Role = "owner" | "admin" | "task_admin" | "task_operator" | "viewer";
export type TaskItemType = "Task" | "TaskBoard" | "Checklist" | "TaskComment" | "TaskDependency" | "TaskReminder" | "TaskApproval" | "TaskSLA";
export type TaskStatus = "draft" | "active" | "pending_review" | "approved" | "blocked" | "archived";
export type TaskRunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface RequestActor { tenantId: TenantId; userId: UUID; role: Role; }
export interface BaseEntity { id: UUID; tenantId: TenantId; createdAt: ISODate; updatedAt: ISODate; }
export interface TaskItem extends BaseEntity { key: string; name: string; description?: string; type: TaskItemType; status: TaskStatus; ownerId?: UUID; tags: string[]; attributes: Record<string, unknown>; metadata: Record<string, unknown>; }
export interface TaskRun extends BaseEntity { itemId?: UUID; name: string; status: TaskRunStatus; input: Record<string, unknown>; output?: Record<string, unknown>; startedAt?: ISODate; completedAt?: ISODate; error?: string; }
export interface TaskEvent extends BaseEntity { type: string; source: string; itemId?: UUID; payload: Record<string, unknown>; }
export interface AuditLog extends BaseEntity { actorId: UUID; role: Role; action: string; entityType: string; entityId?: UUID; before?: unknown; after?: unknown; }
export interface TaskOverview { items: { total: number; active: number; pendingReview: number; archived: number }; runs: { total: number; queued: number; running: number; completed: number; failed: number }; events: { total: number }; topTypes: Array<{ type: string; count: number }>; }
export interface TaskState { items: TaskItem[]; runs: TaskRun[]; events: TaskEvent[]; auditLogs: AuditLog[]; }
