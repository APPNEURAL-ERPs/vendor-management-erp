export type UUID = string;
export type TenantId = string;
export type ISODate = string;
export type Role = "owner" | "admin" | "vendor_admin" | "vendor_operator" | "viewer";
export type VendorItemType = "Vendor" | "VendorContact" | "VendorDocument" | "VendorOnboarding" | "VendorEvaluation" | "VendorContract" | "VendorRisk" | "VendorPayment";
export type VendorStatus = "draft" | "active" | "pending_review" | "approved" | "blocked" | "archived";
export type VendorRunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface RequestActor { tenantId: TenantId; userId: UUID; role: Role; }
export interface BaseEntity { id: UUID; tenantId: TenantId; createdAt: ISODate; updatedAt: ISODate; }
export interface VendorItem extends BaseEntity { key: string; name: string; description?: string; type: VendorItemType; status: VendorStatus; ownerId?: UUID; tags: string[]; attributes: Record<string, unknown>; metadata: Record<string, unknown>; }
export interface VendorRun extends BaseEntity { itemId?: UUID; name: string; status: VendorRunStatus; input: Record<string, unknown>; output?: Record<string, unknown>; startedAt?: ISODate; completedAt?: ISODate; error?: string; }
export interface VendorEvent extends BaseEntity { type: string; source: string; itemId?: UUID; payload: Record<string, unknown>; }
export interface AuditLog extends BaseEntity { actorId: UUID; role: Role; action: string; entityType: string; entityId?: UUID; before?: unknown; after?: unknown; }
export interface VendorOverview { items: { total: number; active: number; pendingReview: number; archived: number }; runs: { total: number; queued: number; running: number; completed: number; failed: number }; events: { total: number }; topTypes: Array<{ type: string; count: number }>; }
export interface VendorState { items: VendorItem[]; runs: VendorRun[]; events: VendorEvent[]; auditLogs: AuditLog[]; }
