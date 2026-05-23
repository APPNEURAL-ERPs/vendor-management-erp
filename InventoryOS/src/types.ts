export type UUID = string;
export type TenantId = string;
export type ISODate = string;

export type Role = "owner" | "admin" | "inventory_admin" | "inventory_manager" | "warehouse_manager" | "viewer";
export type EntityStatus = "active" | "inactive" | "archived" | "draft";

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

export interface InventoryItem extends BaseEntity {
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  brand?: string;
  model?: string;
  barcode?: string;
  qrCode?: string;
  costPrice: number;
  sellingPrice: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  status: EntityStatus;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface Warehouse extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  managerId?: UUID;
  capacity?: number;
  status: EntityStatus;
  zones: WarehouseZone[];
  metadata: Record<string, unknown>;
}

export interface WarehouseZone extends BaseEntity {
  warehouseId: UUID;
  name: string;
  code: string;
  description?: string;
  type: "storage" | "receiving" | "shipping" | "quarantine" | "damaged";
  capacity?: number;
  status: EntityStatus;
}

export interface StockLocation extends BaseEntity {
  warehouseId: UUID;
  zoneId?: UUID;
  rack?: string;
  shelf?: string;
  bin?: string;
  code: string;
  description?: string;
  status: EntityStatus;
}

export interface StockLevel extends BaseEntity {
  itemId: UUID;
  warehouseId: UUID;
  locationId?: UUID;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  damagedQuantity: number;
  expiredQuantity: number;
  inTransitQuantity: number;
  lastCountedAt?: ISODate;
  metadata: Record<string, unknown>;
}

export interface StockInward extends BaseEntity {
  itemId: UUID;
  warehouseId: UUID;
  locationId?: UUID;
  referenceNumber?: string;
  sourceType: "purchase" | "return" | "transfer_in" | "adjustment" | "other";
  sourceId?: UUID;
  quantity: number;
  unitCost: number;
  totalCost: number;
  batchNumber?: string;
  expiryDate?: ISODate;
  receivedBy: UUID;
  notes?: string;
  status: "pending" | "received" | "quality_check" | "approved" | "rejected";
  metadata: Record<string, unknown>;
}

export interface StockOutward extends BaseEntity {
  itemId: UUID;
  warehouseId: UUID;
  locationId?: UUID;
  referenceNumber?: string;
  destinationType: "sale" | "issue" | "transfer_out" | "adjustment" | "damage" | "loss" | "other";
  destinationId?: UUID;
  quantity: number;
  unitCost: number;
  totalCost: number;
  issuedTo?: string;
  issuedBy: UUID;
  approvedBy?: UUID;
  notes?: string;
  status: "pending" | "approved" | "issued" | "cancelled";
  metadata: Record<string, unknown>;
}

export interface Transfer extends BaseEntity {
  referenceNumber: string;
  fromWarehouseId: UUID;
  fromLocationId?: UUID;
  toWarehouseId: UUID;
  toLocationId?: UUID;
  status: "requested" | "approved" | "dispatched" | "in_transit" | "received" | "partially_received" | "cancelled" | "rejected";
  requestedBy: UUID;
  approvedBy?: UUID;
  receivedBy?: UUID;
  items: TransferItem[];
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface TransferItem extends BaseEntity {
  transferId: UUID;
  itemId: UUID;
  quantity: number;
  quantitySent: number;
  quantityReceived: number;
  unitCost: number;
}

export interface StockAdjustment extends BaseEntity {
  itemId: UUID;
  warehouseId: UUID;
  locationId?: UUID;
  adjustmentType: "positive" | "negative" | "damage" | "loss" | "expiry" | "return" | "correction" | "count";
  quantity: number;
  reason: string;
  referenceNumber?: string;
  adjustedBy: UUID;
  approvedBy?: UUID;
  notes?: string;
  status: "pending" | "approved" | "applied" | "rejected";
  metadata: Record<string, unknown>;
}

export interface StockReservation extends BaseEntity {
  itemId: UUID;
  warehouseId: UUID;
  quantity: number;
  reservedFor: string;
  referenceType: string;
  referenceId: UUID;
  expiresAt?: ISODate;
  status: "active" | "fulfilled" | "released" | "expired";
  reservedBy: UUID;
}

export interface ReorderRule extends BaseEntity {
  itemId: UUID;
  minimumQuantity: number;
  reorderQuantity: number;
  reorderPoint: number;
  leadTimeDays: number;
  preferredVendorId?: UUID;
  autoReorder: boolean;
  status: "active" | "inactive";
  notes?: string;
}

export interface StockCount extends BaseEntity {
  warehouseId: UUID;
  locationId?: UUID;
  countType: "full" | "cycle" | "random";
  status: "planned" | "in_progress" | "submitted" | "variance_found" | "approved" | "adjusted" | "closed";
  countedBy: UUID;
  approvedBy?: UUID;
  plannedAt?: ISODate;
  countedAt?: ISODate;
  approvedAt?: ISODate;
  items: StockCountItem[];
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface StockCountItem extends BaseEntity {
  stockCountId: UUID;
  itemId: UUID;
  locationId?: UUID;
  systemQuantity: number;
  countedQuantity: number;
  variance: number;
  reason?: string;
  status: "pending" | "counted" | "verified" | "adjusted";
}

export interface InventoryBatch extends BaseEntity {
  itemId: UUID;
  batchNumber: string;
  manufacturingDate?: ISODate;
  expiryDate?: ISODate;
  quantity: number;
  unitCost: number;
  supplierId?: UUID;
  warehouseId: UUID;
  locationId?: UUID;
  status: "active" | "expired" | "quarantined" | "consumed";
  metadata: Record<string, unknown>;
}

export interface InventorySerial extends BaseEntity {
  itemId: UUID;
  serialNumber: string;
  batchId?: UUID;
  warehouseId: UUID;
  locationId?: UUID;
  status: "available" | "reserved" | "assigned" | "damaged" | "retired";
  assignedTo?: UUID;
  assignedAt?: ISODate;
  notes?: string;
}

export interface InventoryAuditLog extends BaseEntity {
  actorId: UUID;
  role: Role;
  action: string;
  entityType: string;
  entityId?: UUID;
  before?: unknown;
  after?: unknown;
}

export interface InventoryEvent extends BaseEntity {
  type: string;
  source: string;
  data: Record<string, unknown>;
  correlationId?: UUID;
}

export interface InventoryOverview {
  items: { total: number; active: number; lowStock: number; outOfStock: number };
  warehouses: { total: number; active: number };
  stock: { total: number; available: number; reserved: number; damaged: number; inTransit: number };
  transfers: { pending: number; inTransit: number };
  adjustments: { pending: number; applied: number };
  totalValue: number;
}

export interface InventoryState {
  items: InventoryItem[];
  warehouses: Warehouse[];
  zones: WarehouseZone[];
  locations: StockLocation[];
  stockLevels: StockLevel[];
  inwards: StockInward[];
  outwards: StockOutward[];
  transfers: Transfer[];
  transferItems: TransferItem[];
  adjustments: StockAdjustment[];
  reservations: StockReservation[];
  reorderRules: ReorderRule[];
  stockCounts: StockCount[];
  stockCountItems: StockCountItem[];
  batches: InventoryBatch[];
  serials: InventorySerial[];
  events: InventoryEvent[];
  auditLogs: InventoryAuditLog[];
}
