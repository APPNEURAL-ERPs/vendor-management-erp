export type UUID = string;
export type TenantId = string;
export type ISODate = string;
export type Role = "owner" | "admin" | "asset_admin" | "asset_manager" | "asset_operator" | "viewer";
export type EntityStatus = "draft" | "active" | "inactive" | "pending_review" | "approved" | "archived";

export interface RequestActor {
  tenantId: TenantId;
  userId: UUID;
  role: Role;
}

export interface BaseEntity {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface AssetCategory extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  parentId?: UUID;
  status: EntityStatus;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface AssetLocation {
  building?: string;
  floor?: string;
  room?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
}

export interface AssetDepreciation {
  id: UUID;
  tenantId: TenantId;
  createdAt: ISODate;
  updatedAt: ISODate;
  assetId: UUID;
  method: "straight_line" | "declining_balance" | "sum_of_years" | "units_of_production";
  purchasePrice: number;
  salvageValue: number;
  usefulLifeMonths: number;
  depreciationStartDate: ISODate;
  currentValue: number;
  accumulatedDepreciation: number;
  monthlyDepreciation: number;
  status: "active" | "completed" | "sold" | "disposed";
  metadata: Record<string, unknown>;
}

export interface MaintenanceRecord extends BaseEntity {
  assetId: UUID;
  type: "preventive" | "corrective" | "inspection" | "upgrade" | "calibration";
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description?: string;
  scheduledDate: ISODate;
  completedDate?: ISODate;
  technician?: string;
  vendorId?: UUID;
  cost?: number;
  partsReplaced?: string[];
  notes?: string;
  nextMaintenanceDate?: ISODate;
  metadata: Record<string, unknown>;
}

export interface AssetAssignment extends BaseEntity {
  assetId: UUID;
  assignedTo: UUID;
  assignedBy: UUID;
  status: "active" | "returned" | "lost" | "stolen" | "transferred";
  assignedDate: ISODate;
  expectedReturnDate?: ISODate;
  actualReturnDate?: ISODate;
  location?: AssetLocation;
  notes?: string;
  handoverCondition?: "excellent" | "good" | "fair" | "poor";
  returnCondition?: "excellent" | "good" | "fair" | "poor";
  metadata: Record<string, unknown>;
}

export interface AssetWarranty extends BaseEntity {
  assetId: UUID;
  provider: string;
  type: "manufacturer" | "extended" | "service" | "limited";
  startDate: ISODate;
  endDate: ISODate;
  coverageDetails?: string;
  claimContact?: string;
  claimPhone?: string;
  status: "active" | "expired" | "void" | "claimed";
  cost?: number;
  documentUri?: string;
  metadata: Record<string, unknown>;
}

export interface AssetAudit extends BaseEntity {
  assetId?: UUID;
  title: string;
  description?: string;
  auditorId: UUID;
  scheduledDate: ISODate;
  completedDate?: ISODate;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  findings?: string;
  recommendations?: string;
  itemsAudited: number;
  itemsPassed: number;
  itemsFailed: number;
  metadata: Record<string, unknown>;
}

export interface Asset extends BaseEntity {
  key: string;
  name: string;
  description?: string;
  categoryId: UUID;
  serialNumber?: string;
  barcode?: string;
  qrCode?: string;
  status: EntityStatus;
  condition: "excellent" | "good" | "fair" | "poor" | "not_available";
  purchaseDate?: ISODate;
  purchasePrice?: number;
  warrantyId?: UUID;
  depreciationId?: UUID;
  supplier?: string;
  manufacturer?: string;
  model?: string;
  color?: string;
  weight?: string;
  dimensions?: string;
  location: AssetLocation;
  assignedTo?: UUID;
  assignedDate?: ISODate;
  parentAssetId?: UUID;
  childAssetIds: UUID[];
  tags: string[];
  photos?: string[];
  documents?: string[];
  customFields: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface AssetEvent extends BaseEntity {
  type: string;
  source: string;
  assetId?: UUID;
  correlationId?: UUID;
  data: Record<string, unknown>;
}

export interface AssetRun extends BaseEntity {
  name: string;
  description?: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  startedAt?: ISODate;
  completedAt?: ISODate;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface AuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface AssetOverview {
  assets: { total: number; active: number; assigned: number; available: number; inMaintenance: number; archived: number };
  categories: { total: number; active: number };
  assignments: { total: number; active: number; returned: number; overdue: number };
  maintenance: { total: number; scheduled: number; inProgress: number; completed: number; overdue: number };
  depreciation: { total: number; active: number; totalValue: number; totalAccumulatedDepreciation: number };
  warranties: { active: number; expiringSoon: number; expired: number };
  events: { total: number };
  topCategories: Array<{ categoryId: UUID; name: string; count: number }>;
  recentActivity: AssetEvent[];
}

export interface AssetState {
  assets: Asset[];
  categories: AssetCategory[];
  assignments: AssetAssignment[];
  maintenanceRecords: MaintenanceRecord[];
  warranties: AssetWarranty[];
  audits: AssetAudit[];
  depreciations: AssetDepreciation[];
  events: AssetEvent[];
  runs: AssetRun[];
  auditLogs: AuditLog[];
}
