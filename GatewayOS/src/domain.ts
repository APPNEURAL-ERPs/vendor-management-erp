export type UUID = string;
export type TenantId = string;
export type ISODate = string;
export type Role = "owner" | "admin" | "gateway_admin" | "gateway_operator" | "viewer";
export type GatewayItemType = "Gateway" | "GatewayRoute" | "GatewayService" | "GatewayPolicy" | "TrafficRule" | "RateLimit" | "GatewayTrace" | "GatewayIncident";
export type GatewayStatus = "draft" | "active" | "pending_review" | "approved" | "blocked" | "archived";
export type GatewayRunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface RequestActor { tenantId: TenantId; userId: UUID; role: Role; }
export interface BaseEntity { id: UUID; tenantId: TenantId; createdAt: ISODate; updatedAt: ISODate; }
export interface GatewayItem extends BaseEntity { key: string; name: string; description?: string; type: GatewayItemType; status: GatewayStatus; ownerId?: UUID; tags: string[]; attributes: Record<string, unknown>; metadata: Record<string, unknown>; }
export interface GatewayRun extends BaseEntity { itemId?: UUID; name: string; status: GatewayRunStatus; input: Record<string, unknown>; output?: Record<string, unknown>; startedAt?: ISODate; completedAt?: ISODate; error?: string; }
export interface GatewayEvent extends BaseEntity { type: string; source: string; itemId?: UUID; payload: Record<string, unknown>; }
export interface AuditLog extends BaseEntity { actorId: UUID; role: Role; action: string; entityType: string; entityId?: UUID; before?: unknown; after?: unknown; }
export interface GatewayOverview { items: { total: number; active: number; pendingReview: number; archived: number }; runs: { total: number; queued: number; running: number; completed: number; failed: number }; events: { total: number }; topTypes: Array<{ type: string; count: number }>; }
export interface GatewayState { items: GatewayItem[]; runs: GatewayRun[]; events: GatewayEvent[]; auditLogs: AuditLog[]; }
