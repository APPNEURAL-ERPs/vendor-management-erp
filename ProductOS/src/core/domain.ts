export type UUID = string;
export type TenantId = string;
export type ISODate = string;
export type CurrencyCode = "INR" | "USD" | "EUR" | string;
export type Role = "viewer" | "product_manager" | "product_owner" | "roadmap_planner" | "release_manager" | "bom_manager" | "product_admin" | "admin" | "owner" | "auditor";
export interface RequestActor { tenantId: TenantId; userId: UUID; role: Role; }
export interface BaseEntity { id: UUID; tenantId: TenantId; createdAt: ISODate; updatedAt: ISODate; }
export type EntityStatus = "draft" | "active" | "inactive" | "archived";
export type Priority = "low" | "medium" | "high" | "critical";
export type ProductType = "software" | "hardware" | "service" | "bundle" | "media" | "manufacturing" | "other";
export type ProductLifecycleStage = "idea" | "discovery" | "planning" | "development" | "beta" | "launched" | "growth" | "mature" | "sunset";

export interface Product extends BaseEntity {
  productCode: string;
  name: string;
  description?: string;
  type: ProductType;
  lifecycleStage: ProductLifecycleStage;
  status: EntityStatus;
  ownerId: UUID;
  market?: string;
  tags: string[];
  targetLaunchDate?: string;
  createdBy: UUID;
  customFields: Record<string, unknown>;
}

export type VersionStatus = "planned" | "in_development" | "qa" | "released" | "deprecated";
export interface ProductVersion extends BaseEntity {
  productId: UUID;
  version: string;
  name: string;
  status: VersionStatus;
  releaseDate?: string;
  notes?: string;
  createdBy: UUID;
}

export type RoadmapStatus = "planned" | "in_progress" | "blocked" | "done" | "cancelled";
export interface RoadmapItem extends BaseEntity {
  roadmapNumber: string;
  productId: UUID;
  title: string;
  description?: string;
  quarter: string;
  ownerId: UUID;
  priority: Priority;
  status: RoadmapStatus;
  startDate?: string;
  dueDate?: string;
  linkedFeatureIds: UUID[];
  createdBy: UUID;
  completedAt?: ISODate;
}

export type RequirementStatus = "draft" | "approved" | "rejected" | "implemented" | "archived";
export interface Requirement extends BaseEntity {
  requirementNumber: string;
  productId: UUID;
  title: string;
  description: string;
  source: "customer" | "internal" | "market" | "compliance" | "support" | "sales" | "other";
  priority: Priority;
  status: RequirementStatus;
  requestedBy?: UUID;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  createdBy: UUID;
}

export type FeatureStatus = "backlog" | "planned" | "in_development" | "qa" | "released" | "cancelled";
export interface Feature extends BaseEntity {
  featureNumber: string;
  productId: UUID;
  requirementId?: UUID;
  roadmapItemId?: UUID;
  title: string;
  description?: string;
  priority: Priority;
  status: FeatureStatus;
  ownerId: UUID;
  effortPoints: number;
  valueScore: number;
  riskScore: number;
  tags: string[];
  createdBy: UUID;
  releasedAt?: ISODate;
}

export interface BacklogItem extends BaseEntity {
  backlogNumber: string;
  productId: UUID;
  featureId?: UUID;
  title: string;
  description?: string;
  type: "story" | "bug" | "task" | "research" | "tech_debt";
  priority: Priority;
  status: "open" | "in_progress" | "done" | "blocked" | "cancelled";
  assigneeId?: UUID;
  sprint?: string;
  effortPoints: number;
  createdBy: UUID;
  completedAt?: ISODate;
}

export type ReleaseStatus = "draft" | "approved" | "scheduled" | "released" | "rolled_back" | "cancelled";
export interface ProductRelease extends BaseEntity {
  releaseNumber: string;
  productId: UUID;
  versionId?: UUID;
  name: string;
  status: ReleaseStatus;
  plannedDate: string;
  releasedAt?: ISODate;
  featureIds: UUID[];
  notes?: string;
  releaseManagerId: UUID;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  createdBy: UUID;
}

export interface Component extends BaseEntity {
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  unitCost: number;
  currency: CurrencyCode;
  supplier?: string;
  status: EntityStatus;
  createdBy: UUID;
}

export interface BOMLine {
  componentId: UUID;
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}
export interface BOM extends BaseEntity {
  bomNumber: string;
  productId: UUID;
  versionId?: UUID;
  name: string;
  status: "draft" | "approved" | "active" | "archived";
  currency: CurrencyCode;
  lines: BOMLine[];
  totalCost: number;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  createdBy: UUID;
}

export type ChangeRequestStatus = "submitted" | "approved" | "rejected" | "implemented" | "cancelled";
export interface ChangeRequest extends BaseEntity {
  changeNumber: string;
  productId: UUID;
  targetType: "product" | "version" | "roadmap" | "requirement" | "feature" | "release" | "bom";
  targetId: UUID;
  title: string;
  reason: string;
  impact: "low" | "medium" | "high";
  status: ChangeRequestStatus;
  requestedBy: UUID;
  approvedBy?: UUID;
  approvedAt?: ISODate;
  implementedAt?: ISODate;
}

export interface ProductAnalytics {
  productCount: number;
  activeProducts: number;
  launchedProducts: number;
  roadmapOpen: number;
  roadmapDone: number;
  openFeatures: number;
  releasedFeatures: number;
  backlogOpen: number;
  releasesPlanned: number;
  releasesCompleted: number;
  totalBomCost: number;
  averageFeatureValue: number;
  averageFeatureRisk: number;
}
export interface ProductEvent extends BaseEntity { event: string; source: "ProductOS" | string; actorId: UUID; data: Record<string, unknown>; }
export interface AuditLog extends BaseEntity { actorId: UUID; role: Role; action: string; entityType: string; entityId?: UUID; before?: unknown; after?: unknown; }
export interface ProductState {
  products: Product[];
  versions: ProductVersion[];
  roadmapItems: RoadmapItem[];
  requirements: Requirement[];
  features: Feature[];
  backlogItems: BacklogItem[];
  releases: ProductRelease[];
  components: Component[];
  boms: BOM[];
  changeRequests: ChangeRequest[];
  events: ProductEvent[];
  auditLogs: AuditLog[];
}
