export type UUID = string;
export type TenantId = string;
export type ISODate = string;
export type Role = "owner" | "admin" | "unified_admin" | "unified_operator" | "viewer";
export type UnifiedItemType = "OSModule" | "OSDependency" | "CrossOSWorkflow" | "OSEventRoute" | "UnifiedCommand" | "HealthSignal" | "ImpactReport" | "IntegrationMap";
export type UnifiedStatus = "draft" | "active" | "pending_review" | "approved" | "blocked" | "archived";
export type UnifiedRunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface RequestActor { tenantId: TenantId; userId: UUID; role: Role; }
export interface BaseEntity { id: UUID; tenantId: TenantId; createdAt: ISODate; updatedAt: ISODate; }
export interface UnifiedItem extends BaseEntity { key: string; name: string; description?: string; type: UnifiedItemType; status: UnifiedStatus; ownerId?: UUID; tags: string[]; attributes: Record<string, unknown>; metadata: Record<string, unknown>; }
export interface UnifiedRun extends BaseEntity { itemId?: UUID; name: string; status: UnifiedRunStatus; input: Record<string, unknown>; output?: Record<string, unknown>; startedAt?: ISODate; completedAt?: ISODate; error?: string; }
export interface UnifiedEvent extends BaseEntity { type: string; source: string; itemId?: UUID; payload: Record<string, unknown>; }
export interface AuditLog extends BaseEntity { actorId: UUID; role: Role; action: string; entityType: string; entityId?: UUID; before?: unknown; after?: unknown; }
export interface UnifiedOverview { items: { total: number; active: number; pendingReview: number; archived: number }; runs: { total: number; queued: number; running: number; completed: number; failed: number }; events: { total: number }; topTypes: Array<{ type: string; count: number }>; }
export interface UnifiedState { items: UnifiedItem[]; runs: UnifiedRun[]; events: UnifiedEvent[]; auditLogs: AuditLog[]; }
