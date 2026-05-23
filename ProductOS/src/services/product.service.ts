import { AnalyticsEngine } from "../engines/analytics-engine";
import { BOMEngine, BOMLineInput } from "../engines/bom-engine";
import { PrioritizationEngine } from "../engines/prioritization-engine";
import { DataStore } from "../core/datastore";
import { EventBus } from "../core/event-bus";
import { badRequest, conflict, notFound } from "../core/errors";
import { newId, nowIso } from "../core/id";
import { assertDate, clone, numberOrZero, optionalString, requiredString, unique } from "../core/utils";
import { BacklogItem, BOM, ChangeRequest, ChangeRequestStatus, Component, EntityStatus, Feature, FeatureStatus, Priority, Product, ProductLifecycleStage, ProductRelease, ProductType, ProductVersion, ReleaseStatus, Requirement, RequirementStatus, RequestActor, RoadmapItem, RoadmapStatus, VersionStatus } from "../core/domain";

type ListFilter = { status?: string; productId?: string; ownerId?: string; lifecycleStage?: string; quarter?: string; };
type ProductInput = Partial<Product> & { name?: string; productCode?: string; type?: ProductType; ownerId?: string; };
type VersionInput = Partial<ProductVersion> & { productId?: string; version?: string; name?: string; };
type RoadmapInput = Partial<RoadmapItem> & { productId?: string; title?: string; quarter?: string; ownerId?: string; };
type RequirementInput = Partial<Requirement> & { productId?: string; title?: string; description?: string; };
type FeatureInput = Partial<Feature> & { productId?: string; title?: string; ownerId?: string; };
type BacklogInput = Partial<BacklogItem> & { productId?: string; title?: string; };
type ComponentInput = Partial<Component> & { sku?: string; name?: string; category?: string; unit?: string; unitCost?: number; };
type BOMInput = Partial<BOM> & { productId?: string; name?: string; lines?: BOMLineInput[]; };
type ReleaseInput = Partial<ProductRelease> & { productId?: string; name?: string; plannedDate?: string; featureIds?: string[]; };
type ChangeInput = Partial<ChangeRequest> & { productId?: string; targetType?: ChangeRequest["targetType"]; targetId?: string; title?: string; reason?: string; };

export class ProductService {
  constructor(private readonly store: DataStore, private readonly events: EventBus) {}

  overview(actor: RequestActor): unknown {
    const state = this.store.getState();
    return {
      os: "ProductOS",
      tenantId: actor.tenantId,
      counts: {
        products: this.tenant(state.products, actor.tenantId).length,
        versions: this.tenant(state.versions, actor.tenantId).length,
        roadmapItems: this.tenant(state.roadmapItems, actor.tenantId).length,
        requirements: this.tenant(state.requirements, actor.tenantId).length,
        features: this.tenant(state.features, actor.tenantId).length,
        backlogItems: this.tenant(state.backlogItems, actor.tenantId).length,
        releases: this.tenant(state.releases, actor.tenantId).length,
        components: this.tenant(state.components, actor.tenantId).length,
        boms: this.tenant(state.boms, actor.tenantId).length,
        changeRequests: this.tenant(state.changeRequests, actor.tenantId).length
      },
      analytics: AnalyticsEngine.calculate(state, actor.tenantId),
      topFeaturePriorities: PrioritizationEngine.rank(this.tenant(state.features, actor.tenantId)).slice(0, 5),
      recentEvents: this.tenant(state.events, actor.tenantId).slice(0, 10)
    };
  }

  listAuditLogs(actor: RequestActor): unknown[] { return this.tenant(this.store.getState().auditLogs, actor.tenantId); }
  listEvents(actor: RequestActor): unknown[] { return this.tenant(this.store.getState().events, actor.tenantId); }

  listProducts(actor: RequestActor, filter: ListFilter = {}): Product[] { return this.tenant(this.store.getState().products, actor.tenantId).filter((product) => !filter.status || product.status === filter.status).filter((product) => !filter.lifecycleStage || product.lifecycleStage === filter.lifecycleStage).filter((product) => !filter.ownerId || product.ownerId === filter.ownerId).map(clone); }
  getProduct(actor: RequestActor, id: string): Product { return clone(this.findById(this.store.getState().products, actor.tenantId, id, "Product")); }
  createProduct(actor: RequestActor, input: ProductInput): Product {
    const state = this.store.getState();
    const productCode = requiredString(input.productCode ?? input.name?.toUpperCase().replace(/\s+/g, "_"), "productCode");
    if (this.tenant(state.products, actor.tenantId).some((product) => product.productCode === productCode)) conflict("Product code already exists", { productCode });
    const now = nowIso();
    const product: Product = { id: input.id ?? newId("prod"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, productCode, name: requiredString(input.name, "name"), description: optionalString(input.description), type: (input.type ?? "software") as ProductType, lifecycleStage: (input.lifecycleStage ?? "idea") as ProductLifecycleStage, status: (input.status ?? "active") as EntityStatus, ownerId: input.ownerId ?? actor.userId, market: optionalString(input.market), tags: Array.isArray(input.tags) ? input.tags : [], targetLaunchDate: input.targetLaunchDate ? assertDate(input.targetLaunchDate, "targetLaunchDate").slice(0, 10) : undefined, createdBy: actor.userId, customFields: input.customFields ?? {} };
    state.products.unshift(product); this.store.save(); this.store.audit(actor, "product.create", "Product", product.id, undefined, product); this.events.emit(actor, "product.created", { productId: product.id, productCode: product.productCode }); return clone(product);
  }
  updateProductLifecycle(actor: RequestActor, id: string, lifecycleStage: ProductLifecycleStage, status?: EntityStatus): Product {
    const product = this.findById(this.store.getState().products, actor.tenantId, id, "Product"); const before = clone(product); product.lifecycleStage = lifecycleStage; if (status) product.status = status; product.updatedAt = nowIso(); this.store.save(); this.store.audit(actor, "product.lifecycle.update", "Product", product.id, before, product); this.events.emit(actor, "product.lifecycle.updated", { productId: product.id, lifecycleStage: product.lifecycleStage, status: product.status }); return clone(product);
  }
  archiveProduct(actor: RequestActor, id: string): Product { return this.updateProductLifecycle(actor, id, "sunset", "archived"); }

  listVersions(actor: RequestActor, filter: ListFilter = {}): ProductVersion[] { return this.tenant(this.store.getState().versions, actor.tenantId).filter((version) => !filter.productId || version.productId === filter.productId).filter((version) => !filter.status || version.status === filter.status).map(clone); }
  getVersion(actor: RequestActor, id: string): ProductVersion { return clone(this.findById(this.store.getState().versions, actor.tenantId, id, "ProductVersion")); }
  createVersion(actor: RequestActor, input: VersionInput): ProductVersion {
    const productId = requiredString(input.productId, "productId"); this.getProduct(actor, productId);
    const now = nowIso(); const version: ProductVersion = { id: input.id ?? newId("ver"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, productId, version: requiredString(input.version, "version"), name: requiredString(input.name, "name"), status: (input.status ?? "planned") as VersionStatus, releaseDate: input.releaseDate ? assertDate(input.releaseDate, "releaseDate").slice(0, 10) : undefined, notes: optionalString(input.notes), createdBy: actor.userId };
    this.store.getState().versions.unshift(version); this.store.save(); this.store.audit(actor, "version.create", "ProductVersion", version.id, undefined, version); this.events.emit(actor, "version.created", { versionId: version.id, productId }); return clone(version);
  }
  updateVersionStatus(actor: RequestActor, id: string, status: VersionStatus): ProductVersion { const version = this.findById(this.store.getState().versions, actor.tenantId, id, "ProductVersion"); const before = clone(version); version.status = status; version.updatedAt = nowIso(); if (status === "released" && !version.releaseDate) version.releaseDate = version.updatedAt.slice(0, 10); this.store.save(); this.store.audit(actor, `version.${status}`, "ProductVersion", version.id, before, version); this.events.emit(actor, `version.${status}`, { versionId: version.id, productId: version.productId }); return clone(version); }

  listRoadmapItems(actor: RequestActor, filter: ListFilter = {}): RoadmapItem[] { return this.tenant(this.store.getState().roadmapItems, actor.tenantId).filter((item) => !filter.productId || item.productId === filter.productId).filter((item) => !filter.status || item.status === filter.status).filter((item) => !filter.quarter || item.quarter === filter.quarter).map(clone); }
  getRoadmapItem(actor: RequestActor, id: string): RoadmapItem { return clone(this.findById(this.store.getState().roadmapItems, actor.tenantId, id, "RoadmapItem")); }
  createRoadmapItem(actor: RequestActor, input: RoadmapInput): RoadmapItem {
    const productId = requiredString(input.productId, "productId"); this.getProduct(actor, productId);
    const linkedFeatureIds = Array.isArray(input.linkedFeatureIds) ? input.linkedFeatureIds : [];
    linkedFeatureIds.forEach((featureId) => this.getFeature(actor, featureId));
    const now = nowIso(); const item: RoadmapItem = { id: input.id ?? newId("roadmap"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, roadmapNumber: input.roadmapNumber ?? this.nextNumber("ROAD", this.store.getState().roadmapItems.length + 1), productId, title: requiredString(input.title, "title"), description: optionalString(input.description), quarter: requiredString(input.quarter, "quarter"), ownerId: input.ownerId ?? actor.userId, priority: (input.priority ?? "medium") as Priority, status: (input.status ?? "planned") as RoadmapStatus, startDate: input.startDate ? assertDate(input.startDate, "startDate").slice(0, 10) : undefined, dueDate: input.dueDate ? assertDate(input.dueDate, "dueDate").slice(0, 10) : undefined, linkedFeatureIds: unique(linkedFeatureIds), createdBy: actor.userId };
    this.store.getState().roadmapItems.unshift(item); this.store.save(); this.store.audit(actor, "roadmap.create", "RoadmapItem", item.id, undefined, item); this.events.emit(actor, "roadmap.created", { roadmapItemId: item.id, productId, quarter: item.quarter }); return clone(item);
  }
  updateRoadmapStatus(actor: RequestActor, id: string, status: RoadmapStatus): RoadmapItem { const item = this.findById(this.store.getState().roadmapItems, actor.tenantId, id, "RoadmapItem"); const before = clone(item); item.status = status; item.updatedAt = nowIso(); if (status === "done") item.completedAt = item.updatedAt; this.store.save(); this.store.audit(actor, `roadmap.${status}`, "RoadmapItem", item.id, before, item); this.events.emit(actor, `roadmap.${status}`, { roadmapItemId: item.id, productId: item.productId }); return clone(item); }

  listRequirements(actor: RequestActor, filter: ListFilter = {}): Requirement[] { return this.tenant(this.store.getState().requirements, actor.tenantId).filter((req) => !filter.productId || req.productId === filter.productId).filter((req) => !filter.status || req.status === filter.status).map(clone); }
  getRequirement(actor: RequestActor, id: string): Requirement { return clone(this.findById(this.store.getState().requirements, actor.tenantId, id, "Requirement")); }
  createRequirement(actor: RequestActor, input: RequirementInput): Requirement {
    const productId = requiredString(input.productId, "productId"); this.getProduct(actor, productId);
    const now = nowIso(); const requirement: Requirement = { id: input.id ?? newId("req"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, requirementNumber: input.requirementNumber ?? this.nextNumber("REQ", this.store.getState().requirements.length + 1), productId, title: requiredString(input.title, "title"), description: requiredString(input.description, "description"), source: input.source ?? "internal", priority: (input.priority ?? "medium") as Priority, status: (input.status ?? "draft") as RequirementStatus, requestedBy: optionalString(input.requestedBy), createdBy: actor.userId };
    this.store.getState().requirements.unshift(requirement); this.store.save(); this.store.audit(actor, "requirement.create", "Requirement", requirement.id, undefined, requirement); this.events.emit(actor, "requirement.created", { requirementId: requirement.id, productId }); return clone(requirement);
  }
  approveRequirement(actor: RequestActor, id: string): Requirement { return this.setRequirementStatus(actor, id, "approved", { approvedBy: actor.userId, approvedAt: nowIso() }); }
  rejectRequirement(actor: RequestActor, id: string): Requirement { return this.setRequirementStatus(actor, id, "rejected", {}); }
  private setRequirementStatus(actor: RequestActor, id: string, status: RequirementStatus, patch: Partial<Requirement>): Requirement { const requirement = this.findById(this.store.getState().requirements, actor.tenantId, id, "Requirement"); const before = clone(requirement); Object.assign(requirement, patch, { status, updatedAt: nowIso() }); this.store.save(); this.store.audit(actor, `requirement.${status}`, "Requirement", requirement.id, before, requirement); this.events.emit(actor, `requirement.${status}`, { requirementId: requirement.id, productId: requirement.productId }); return clone(requirement); }

  listFeatures(actor: RequestActor, filter: ListFilter = {}): Feature[] { return this.tenant(this.store.getState().features, actor.tenantId).filter((feature) => !filter.productId || feature.productId === filter.productId).filter((feature) => !filter.status || feature.status === filter.status).filter((feature) => !filter.ownerId || feature.ownerId === filter.ownerId).map(clone); }
  getFeature(actor: RequestActor, id: string): Feature { return clone(this.findById(this.store.getState().features, actor.tenantId, id, "Feature")); }
  createFeature(actor: RequestActor, input: FeatureInput): Feature {
    const productId = requiredString(input.productId, "productId"); this.getProduct(actor, productId);
    if (input.requirementId) this.getRequirement(actor, input.requirementId);
    if (input.roadmapItemId) this.getRoadmapItem(actor, input.roadmapItemId);
    const now = nowIso(); const feature: Feature = { id: input.id ?? newId("feat"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, featureNumber: input.featureNumber ?? this.nextNumber("FEAT", this.store.getState().features.length + 1), productId, requirementId: optionalString(input.requirementId), roadmapItemId: optionalString(input.roadmapItemId), title: requiredString(input.title, "title"), description: optionalString(input.description), priority: (input.priority ?? "medium") as Priority, status: (input.status ?? "backlog") as FeatureStatus, ownerId: input.ownerId ?? actor.userId, effortPoints: numberOrZero(input.effortPoints) || 1, valueScore: numberOrZero(input.valueScore) || 50, riskScore: numberOrZero(input.riskScore), tags: Array.isArray(input.tags) ? input.tags : [], createdBy: actor.userId };
    this.store.getState().features.unshift(feature);
    if (feature.roadmapItemId) { const item = this.findById(this.store.getState().roadmapItems, actor.tenantId, feature.roadmapItemId, "RoadmapItem"); item.linkedFeatureIds = unique([...item.linkedFeatureIds, feature.id]); item.updatedAt = now; }
    this.store.save(); this.store.audit(actor, "feature.create", "Feature", feature.id, undefined, feature); this.events.emit(actor, "feature.created", { featureId: feature.id, productId }); return clone(feature);
  }
  updateFeatureStatus(actor: RequestActor, id: string, status: FeatureStatus): Feature { const feature = this.findById(this.store.getState().features, actor.tenantId, id, "Feature"); const before = clone(feature); feature.status = status; feature.updatedAt = nowIso(); if (status === "released") feature.releasedAt = feature.updatedAt; this.store.save(); this.store.audit(actor, `feature.${status}`, "Feature", feature.id, before, feature); this.events.emit(actor, `feature.${status}`, { featureId: feature.id, productId: feature.productId }); return clone(feature); }
  rankFeatures(actor: RequestActor, productId?: string): unknown[] { const features = this.tenant(this.store.getState().features, actor.tenantId).filter((feature) => !productId || feature.productId === productId).filter((feature) => !["released", "cancelled"].includes(feature.status)); return PrioritizationEngine.rank(features); }

  listBacklogItems(actor: RequestActor, filter: ListFilter = {}): BacklogItem[] { return this.tenant(this.store.getState().backlogItems, actor.tenantId).filter((item) => !filter.productId || item.productId === filter.productId).filter((item) => !filter.status || item.status === filter.status).map(clone); }
  getBacklogItem(actor: RequestActor, id: string): BacklogItem { return clone(this.findById(this.store.getState().backlogItems, actor.tenantId, id, "BacklogItem")); }
  createBacklogItem(actor: RequestActor, input: BacklogInput): BacklogItem {
    const productId = requiredString(input.productId, "productId"); this.getProduct(actor, productId);
    if (input.featureId) this.getFeature(actor, input.featureId);
    const now = nowIso(); const item: BacklogItem = { id: input.id ?? newId("backlog"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, backlogNumber: input.backlogNumber ?? this.nextNumber("BACK", this.store.getState().backlogItems.length + 1), productId, featureId: optionalString(input.featureId), title: requiredString(input.title, "title"), description: optionalString(input.description), type: input.type ?? "story", priority: (input.priority ?? "medium") as Priority, status: input.status ?? "open", assigneeId: optionalString(input.assigneeId), sprint: optionalString(input.sprint), effortPoints: numberOrZero(input.effortPoints) || 1, createdBy: actor.userId };
    this.store.getState().backlogItems.unshift(item); this.store.save(); this.store.audit(actor, "backlog.create", "BacklogItem", item.id, undefined, item); this.events.emit(actor, "backlog.created", { backlogItemId: item.id, productId }); return clone(item);
  }
  updateBacklogStatus(actor: RequestActor, id: string, status: BacklogItem["status"]): BacklogItem { const item = this.findById(this.store.getState().backlogItems, actor.tenantId, id, "BacklogItem"); const before = clone(item); item.status = status; item.updatedAt = nowIso(); if (status === "done") item.completedAt = item.updatedAt; this.store.save(); this.store.audit(actor, `backlog.${status}`, "BacklogItem", item.id, before, item); this.events.emit(actor, `backlog.${status}`, { backlogItemId: item.id, productId: item.productId }); return clone(item); }

  listComponents(actor: RequestActor, filter: ListFilter = {}): Component[] { return this.tenant(this.store.getState().components, actor.tenantId).filter((component) => !filter.status || component.status === filter.status).map(clone); }
  getComponent(actor: RequestActor, id: string): Component { return clone(this.findById(this.store.getState().components, actor.tenantId, id, "Component")); }
  createComponent(actor: RequestActor, input: ComponentInput): Component {
    const state = this.store.getState(); const sku = requiredString(input.sku, "sku"); if (this.tenant(state.components, actor.tenantId).some((component) => component.sku === sku)) conflict("Component SKU already exists", { sku });
    const unitCost = numberOrZero(input.unitCost); if (unitCost < 0) badRequest("unitCost cannot be negative");
    const now = nowIso(); const component: Component = { id: input.id ?? newId("comp"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, sku, name: requiredString(input.name, "name"), description: optionalString(input.description), category: requiredString(input.category ?? "general", "category"), unit: requiredString(input.unit ?? "unit", "unit"), unitCost, currency: input.currency ?? "INR", supplier: optionalString(input.supplier), status: (input.status ?? "active") as EntityStatus, createdBy: actor.userId };
    state.components.unshift(component); this.store.save(); this.store.audit(actor, "component.create", "Component", component.id, undefined, component); this.events.emit(actor, "component.created", { componentId: component.id, sku }); return clone(component);
  }

  listBOMs(actor: RequestActor, filter: ListFilter = {}): BOM[] { return this.tenant(this.store.getState().boms, actor.tenantId).filter((bom) => !filter.productId || bom.productId === filter.productId).filter((bom) => !filter.status || bom.status === filter.status).map(clone); }
  getBOM(actor: RequestActor, id: string): BOM { return clone(this.findById(this.store.getState().boms, actor.tenantId, id, "BOM")); }
  createBOM(actor: RequestActor, input: BOMInput): BOM {
    const productId = requiredString(input.productId, "productId"); this.getProduct(actor, productId); if (input.versionId) this.getVersion(actor, input.versionId);
    const calculation = BOMEngine.buildLines(input.lines ?? [], this.tenant(this.store.getState().components, actor.tenantId));
    const now = nowIso(); const bom: BOM = { id: input.id ?? newId("bom"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, bomNumber: input.bomNumber ?? this.nextNumber("BOM", this.store.getState().boms.length + 1), productId, versionId: optionalString(input.versionId), name: requiredString(input.name, "name"), status: input.status ?? "draft", currency: input.currency ?? calculation.currency, lines: calculation.lines, totalCost: calculation.totalCost, createdBy: actor.userId };
    this.store.getState().boms.unshift(bom); this.store.save(); this.store.audit(actor, "bom.create", "BOM", bom.id, undefined, bom); this.events.emit(actor, "bom.created", { bomId: bom.id, productId, totalCost: bom.totalCost }); return clone(bom);
  }
  approveBOM(actor: RequestActor, id: string): BOM { return this.setBOMStatus(actor, id, "approved", { approvedBy: actor.userId, approvedAt: nowIso() }); }
  activateBOM(actor: RequestActor, id: string): BOM { const bom = this.findById(this.store.getState().boms, actor.tenantId, id, "BOM"); const otherActive = this.tenant(this.store.getState().boms, actor.tenantId).filter((item) => item.productId === bom.productId && item.id !== bom.id && item.status === "active"); otherActive.forEach((item) => { item.status = "archived"; item.updatedAt = nowIso(); }); return this.setBOMStatus(actor, id, "active", {}); }
  private setBOMStatus(actor: RequestActor, id: string, status: BOM["status"], patch: Partial<BOM>): BOM { const bom = this.findById(this.store.getState().boms, actor.tenantId, id, "BOM"); const before = clone(bom); Object.assign(bom, patch, { status, updatedAt: nowIso() }); this.store.save(); this.store.audit(actor, `bom.${status}`, "BOM", bom.id, before, bom); this.events.emit(actor, `bom.${status}`, { bomId: bom.id, productId: bom.productId, totalCost: bom.totalCost }); return clone(bom); }

  listReleases(actor: RequestActor, filter: ListFilter = {}): ProductRelease[] { return this.tenant(this.store.getState().releases, actor.tenantId).filter((release) => !filter.productId || release.productId === filter.productId).filter((release) => !filter.status || release.status === filter.status).map(clone); }
  getRelease(actor: RequestActor, id: string): ProductRelease { return clone(this.findById(this.store.getState().releases, actor.tenantId, id, "ProductRelease")); }
  createRelease(actor: RequestActor, input: ReleaseInput): ProductRelease {
    const productId = requiredString(input.productId, "productId"); this.getProduct(actor, productId); if (input.versionId) this.getVersion(actor, input.versionId);
    const featureIds = Array.isArray(input.featureIds) ? unique(input.featureIds) : [];
    featureIds.forEach((featureId) => { const feature = this.getFeature(actor, featureId); if (feature.productId !== productId) badRequest("Feature belongs to another product", { featureId }); });
    const now = nowIso(); const release: ProductRelease = { id: input.id ?? newId("release"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, releaseNumber: input.releaseNumber ?? this.nextNumber("REL", this.store.getState().releases.length + 1), productId, versionId: optionalString(input.versionId), name: requiredString(input.name, "name"), status: (input.status ?? "draft") as ReleaseStatus, plannedDate: assertDate(input.plannedDate, "plannedDate").slice(0, 10), featureIds, notes: optionalString(input.notes), releaseManagerId: input.releaseManagerId ?? actor.userId, createdBy: actor.userId };
    this.store.getState().releases.unshift(release); this.store.save(); this.store.audit(actor, "release.create", "ProductRelease", release.id, undefined, release); this.events.emit(actor, "release.created", { releaseId: release.id, productId, featureCount: featureIds.length }); return clone(release);
  }
  approveRelease(actor: RequestActor, id: string): ProductRelease { return this.setReleaseStatus(actor, id, "approved", { approvedBy: actor.userId, approvedAt: nowIso() }); }
  scheduleRelease(actor: RequestActor, id: string): ProductRelease { return this.setReleaseStatus(actor, id, "scheduled", {}); }
  publishRelease(actor: RequestActor, id: string): ProductRelease {
    const release = this.findById(this.store.getState().releases, actor.tenantId, id, "ProductRelease");
    const before = clone(release); release.status = "released"; release.releasedAt = nowIso(); release.updatedAt = release.releasedAt;
    release.featureIds.forEach((featureId) => { const feature = this.findById(this.store.getState().features, actor.tenantId, featureId, "Feature"); feature.status = "released"; feature.releasedAt = release.releasedAt; feature.updatedAt = release.releasedAt as string; });
    if (release.versionId) { const version = this.findById(this.store.getState().versions, actor.tenantId, release.versionId, "ProductVersion"); version.status = "released"; version.releaseDate = release.releasedAt.slice(0, 10); version.updatedAt = release.releasedAt; }
    const product = this.findById(this.store.getState().products, actor.tenantId, release.productId, "Product"); if (["idea", "discovery", "planning", "development", "beta"].includes(product.lifecycleStage)) product.lifecycleStage = "launched"; product.updatedAt = release.releasedAt;
    this.store.save(); this.store.audit(actor, "release.publish", "ProductRelease", release.id, before, release); this.events.emit(actor, "release.published", { releaseId: release.id, productId: release.productId, featureIds: release.featureIds }); return clone(release);
  }
  rollbackRelease(actor: RequestActor, id: string): ProductRelease { return this.setReleaseStatus(actor, id, "rolled_back", {}); }
  private setReleaseStatus(actor: RequestActor, id: string, status: ReleaseStatus, patch: Partial<ProductRelease>): ProductRelease { const release = this.findById(this.store.getState().releases, actor.tenantId, id, "ProductRelease"); const before = clone(release); Object.assign(release, patch, { status, updatedAt: nowIso() }); this.store.save(); this.store.audit(actor, `release.${status}`, "ProductRelease", release.id, before, release); this.events.emit(actor, `release.${status}`, { releaseId: release.id, productId: release.productId }); return clone(release); }

  listChangeRequests(actor: RequestActor, filter: ListFilter = {}): ChangeRequest[] { return this.tenant(this.store.getState().changeRequests, actor.tenantId).filter((change) => !filter.productId || change.productId === filter.productId).filter((change) => !filter.status || change.status === filter.status).map(clone); }
  getChangeRequest(actor: RequestActor, id: string): ChangeRequest { return clone(this.findById(this.store.getState().changeRequests, actor.tenantId, id, "ChangeRequest")); }
  createChangeRequest(actor: RequestActor, input: ChangeInput): ChangeRequest {
    const productId = requiredString(input.productId, "productId"); this.getProduct(actor, productId); const targetType = input.targetType ?? "product"; const targetId = requiredString(input.targetId, "targetId"); this.assertTarget(actor, targetType, targetId);
    const now = nowIso(); const change: ChangeRequest = { id: input.id ?? newId("chg"), tenantId: actor.tenantId, createdAt: now, updatedAt: now, changeNumber: input.changeNumber ?? this.nextNumber("CHG", this.store.getState().changeRequests.length + 1), productId, targetType, targetId, title: requiredString(input.title, "title"), reason: requiredString(input.reason, "reason"), impact: input.impact ?? "medium", status: input.status ?? "submitted", requestedBy: input.requestedBy ?? actor.userId };
    this.store.getState().changeRequests.unshift(change); this.store.save(); this.store.audit(actor, "change.create", "ChangeRequest", change.id, undefined, change); this.events.emit(actor, "change.submitted", { changeRequestId: change.id, productId, targetType, targetId }); return clone(change);
  }
  approveChangeRequest(actor: RequestActor, id: string): ChangeRequest { return this.setChangeStatus(actor, id, "approved", { approvedBy: actor.userId, approvedAt: nowIso() }); }
  rejectChangeRequest(actor: RequestActor, id: string): ChangeRequest { return this.setChangeStatus(actor, id, "rejected", {}); }
  implementChangeRequest(actor: RequestActor, id: string): ChangeRequest { const change = this.findById(this.store.getState().changeRequests, actor.tenantId, id, "ChangeRequest"); if (change.status !== "approved") badRequest("Only approved changes can be implemented", { id }); return this.setChangeStatus(actor, id, "implemented", { implementedAt: nowIso() }); }
  private setChangeStatus(actor: RequestActor, id: string, status: ChangeRequestStatus, patch: Partial<ChangeRequest>): ChangeRequest { const change = this.findById(this.store.getState().changeRequests, actor.tenantId, id, "ChangeRequest"); const before = clone(change); Object.assign(change, patch, { status, updatedAt: nowIso() }); this.store.save(); this.store.audit(actor, `change.${status}`, "ChangeRequest", change.id, before, change); this.events.emit(actor, `change.${status}`, { changeRequestId: change.id, productId: change.productId }); return clone(change); }

  private assertTarget(actor: RequestActor, targetType: ChangeRequest["targetType"], targetId: string): void {
    const state = this.store.getState();
    if (targetType === "product") this.findById(state.products, actor.tenantId, targetId, "Product");
    if (targetType === "version") this.findById(state.versions, actor.tenantId, targetId, "ProductVersion");
    if (targetType === "roadmap") this.findById(state.roadmapItems, actor.tenantId, targetId, "RoadmapItem");
    if (targetType === "requirement") this.findById(state.requirements, actor.tenantId, targetId, "Requirement");
    if (targetType === "feature") this.findById(state.features, actor.tenantId, targetId, "Feature");
    if (targetType === "release") this.findById(state.releases, actor.tenantId, targetId, "ProductRelease");
    if (targetType === "bom") this.findById(state.boms, actor.tenantId, targetId, "BOM");
  }
  private findById<T extends { id: string; tenantId: string }>(items: T[], tenantId: string, id: string, label: string): T { const item = items.find((candidate) => candidate.tenantId === tenantId && candidate.id === id); if (!item) notFound(`${label} not found`, { id }); return item; }
  private tenant<T extends { tenantId: string }>(items: T[], tenantId: string): T[] { return items.filter((item) => item.tenantId === tenantId); }
  private nextNumber(prefix: string, sequence: number): string { return `${prefix}-${String(sequence).padStart(4, "0")}`; }
}
