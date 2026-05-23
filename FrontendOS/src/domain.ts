export type UUID = string;
export type TenantId = string;
export type ISODate = string;
export type Role = "owner" | "admin" | "frontend_admin" | "frontend_operator" | "viewer";
export type FrontendItemType = "FrontendApp" | "AppShell" | "Page" | "Route" | "Component" | "Layout" | "Theme" | "Form" | "AccessibilityCheck";
export type FrontendStatus = "draft" | "active" | "pending_review" | "approved" | "blocked" | "archived";
export type FrontendRunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface RequestActor { tenantId: TenantId; userId: UUID; role: Role; }
export interface BaseEntity { id: UUID; tenantId: TenantId; createdAt: ISODate; updatedAt: ISODate; }
export interface FrontendItem extends BaseEntity { key: string; name: string; description?: string; type: FrontendItemType; status: FrontendStatus; ownerId?: UUID; tags: string[]; attributes: Record<string, unknown>; metadata: Record<string, unknown>; }
export interface FrontendRun extends BaseEntity { itemId?: UUID; name: string; status: FrontendRunStatus; input: Record<string, unknown>; output?: Record<string, unknown>; startedAt?: ISODate; completedAt?: ISODate; error?: string; }
export interface FrontendEvent extends BaseEntity { type: string; source: string; itemId?: UUID; payload: Record<string, unknown>; }
export interface AuditLog extends BaseEntity { actorId: UUID; role: Role; action: string; entityType: string; entityId?: UUID; before?: unknown; after?: unknown; }
export interface FrontendOverview { items: { total: number; active: number; pendingReview: number; archived: number }; runs: { total: number; queued: number; running: number; completed: number; failed: number }; events: { total: number }; topTypes: Array<{ type: string; count: number }>; }
export interface FrontendState { items: FrontendItem[]; runs: FrontendRun[]; events: FrontendEvent[]; auditLogs: AuditLog[]; }
