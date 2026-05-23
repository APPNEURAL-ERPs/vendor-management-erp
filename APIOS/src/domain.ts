export type UUID = string;
export type TenantId = string;
export type ISODate = string;
export type Role = "owner" | "admin" | "api_admin" | "api_operator" | "viewer";
export type APIItemType = "API" | "Endpoint" | "APIContract" | "APIVersion" | "APIConsumer" | "RateLimitPolicy" | "SDKPackage" | "APITest" | "APIMetric";
export type APIStatus = "draft" | "active" | "pending_review" | "approved" | "blocked" | "archived";
export type APIRunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface RequestActor { tenantId: TenantId; userId: UUID; role: Role; }
export interface BaseEntity { id: UUID; tenantId: TenantId; createdAt: ISODate; updatedAt: ISODate; }
export interface APIItem extends BaseEntity { key: string; name: string; description?: string; type: APIItemType; status: APIStatus; ownerId?: UUID; tags: string[]; attributes: Record<string, unknown>; metadata: Record<string, unknown>; }
export interface APIRun extends BaseEntity { itemId?: UUID; name: string; status: APIRunStatus; input: Record<string, unknown>; output?: Record<string, unknown>; startedAt?: ISODate; completedAt?: ISODate; error?: string; }
export interface APIEvent extends BaseEntity { type: string; source: string; itemId?: UUID; payload: Record<string, unknown>; }
export interface AuditLog extends BaseEntity { actorId: UUID; role: Role; action: string; entityType: string; entityId?: UUID; before?: unknown; after?: unknown; }
export interface APIOverview { items: { total: number; active: number; pendingReview: number; archived: number }; runs: { total: number; queued: number; running: number; completed: number; failed: number }; events: { total: number }; topTypes: Array<{ type: string; count: number }>; }
export interface APIState { items: APIItem[]; runs: APIRun[]; events: APIEvent[]; auditLogs: AuditLog[]; }
