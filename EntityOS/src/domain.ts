export type UUID = string;
export type TenantId = string;
export type ISODate = string;
export type Role = "owner" | "admin" | "entity_admin" | "entity_operator" | "viewer";
export type EntityItemType = "EntityType" | "EntityRecord" | "EntitySchema" | "EntityField" | "EntityRelationship" | "EntityLifecycle" | "EntityValidation" | "EntityIndex";
export type EntityStatus = "draft" | "active" | "pending_review" | "approved" | "blocked" | "archived";
export type EntityRunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface RequestActor { tenantId: TenantId; userId: UUID; role: Role; }
export interface BaseEntity { id: UUID; tenantId: TenantId; createdAt: ISODate; updatedAt: ISODate; }
export interface EntityItem extends BaseEntity { key: string; name: string; description?: string; type: EntityItemType; status: EntityStatus; ownerId?: UUID; tags: string[]; attributes: Record<string, unknown>; metadata: Record<string, unknown>; }
export interface EntityRun extends BaseEntity { itemId?: UUID; name: string; status: EntityRunStatus; input: Record<string, unknown>; output?: Record<string, unknown>; startedAt?: ISODate; completedAt?: ISODate; error?: string; }
export interface EntityEvent extends BaseEntity { type: string; source: string; itemId?: UUID; payload: Record<string, unknown>; }
export interface AuditLog extends BaseEntity { actorId: UUID; role: Role; action: string; entityType: string; entityId?: UUID; before?: unknown; after?: unknown; }
export interface EntityOverview { items: { total: number; active: number; pendingReview: number; archived: number }; runs: { total: number; queued: number; running: number; completed: number; failed: number }; events: { total: number }; topTypes: Array<{ type: string; count: number }>; }
export interface EntityState { items: EntityItem[]; runs: EntityRun[]; events: EntityEvent[]; auditLogs: AuditLog[]; }
