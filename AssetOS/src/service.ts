import { DataStore } from "./core/datastore";
import { AssetOverview, AssetCategory, Asset, AssetAssignment, MaintenanceRecord, AssetWarranty, AssetAudit, AssetDepreciation, AssetEvent, AssetRun, RequestActor } from "./domain";
import { badRequest, conflict, notFound } from "./core/errors";
import { newId, nowIso, isExpired } from "./core/id";
import { clone, countBy, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, optionalString, pickQuery } from "./core/utils";

export class AssetService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "AssetOS service is ready";
  }

  overview(actor: RequestActor): AssetOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;
    const assets = state.assets.filter((item) => item.tenantId === tenant);
    const categories = state.categories.filter((item) => item.tenantId === tenant);
    const assignments = state.assignments.filter((item) => item.tenantId === tenant);
    const maintenance = state.maintenanceRecords.filter((item) => item.tenantId === tenant);
    const depreciations = state.depreciations.filter((item) => item.tenantId === tenant);
    const warranties = state.warranties.filter((item) => item.tenantId === tenant);
    const events = state.events.filter((item) => item.tenantId === tenant);

    const now = nowIso();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const categoryCount = countBy(assets, "categoryId");
    const topCategories = categories
      .filter((c) => categoryCount[c.id] > 0)
      .map((c) => ({ categoryId: c.id, name: c.name, count: categoryCount[c.id] ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      assets: {
        total: assets.length,
        active: assets.filter((a) => a.status === "active").length,
        assigned: assets.filter((a) => a.assignedTo).length,
        available: assets.filter((a) => a.status === "active" && !a.assignedTo).length,
        inMaintenance: maintenance.filter((m) => m.status === "in_progress").length,
        archived: assets.filter((a) => a.status === "archived").length
      },
      categories: {
        total: categories.length,
        active: categories.filter((c) => c.status === "active").length
      },
      assignments: {
        total: assignments.length,
        active: assignments.filter((a) => a.status === "active").length,
        returned: assignments.filter((a) => a.status === "returned").length,
        overdue: assignments.filter((a) => a.status === "active" && a.expectedReturnDate && isExpired(a.expectedReturnDate)).length
      },
      maintenance: {
        total: maintenance.length,
        scheduled: maintenance.filter((m) => m.status === "scheduled").length,
        inProgress: maintenance.filter((m) => m.status === "in_progress").length,
        completed: maintenance.filter((m) => m.status === "completed").length,
        overdue: maintenance.filter((m) => m.status === "scheduled" && isExpired(m.scheduledDate)).length
      },
      depreciation: {
        total: depreciations.length,
        active: depreciations.filter((d) => d.status === "active").length,
        totalValue: depreciations.reduce((sum, d) => sum + d.purchasePrice, 0),
        totalAccumulatedDepreciation: depreciations.reduce((sum, d) => sum + d.accumulatedDepreciation, 0)
      },
      warranties: {
        active: warranties.filter((w) => w.status === "active").length,
        expiringSoon: warranties.filter((w) => w.status === "active" && new Date(w.endDate).getTime() <= thirtyDaysFromNow.getTime()).length,
        expired: warranties.filter((w) => w.status === "expired").length
      },
      events: { total: events.length },
      topCategories,
      recentActivity: events.slice(0, 10)
    };
  }

  listCategories(actor: RequestActor): AssetCategory[] {
    return clone(this.store.getState().categories.filter((item) => item.tenantId === actor.tenantId));
  }

  getCategory(id: string, actor: RequestActor): AssetCategory {
    const item = this.store.getState().categories.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!item) notFound("Category not found");
    return clone(item);
  }

  createCategory(input: unknown, actor: RequestActor): AssetCategory {
    const body = ensureObject(input, "category");
    const state = this.store.getState();
    const key = ensureString(body.key, "category.key");
    if (state.categories.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict("Category key already exists");
    if (body.parentId) this.getCategory(String(body.parentId), actor);
    const category: AssetCategory = {
      id: newId("cat"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      key,
      name: ensureString(body.name, "category.name"),
      description: optionalString(body.description),
      parentId: optionalString(body.parentId),
      status: String(body.status ?? "active") as AssetCategory["status"],
      tags: ensureArray<string>(body.tags, "category.tags"),
      metadata: optionalObject(body.metadata)
    };
    state.categories.push(category);
    this.store.save();
    this.store.audit(actor, "category.create", "category", category.id, undefined, category);
    return clone(category);
  }

  updateCategory(id: string, input: unknown, actor: RequestActor): AssetCategory {
    const body = ensureObject(input, "category");
    const state = this.store.getState();
    const item = state.categories.find((candidate) => candidate.id === id && candidate.tenantId === actor.tenantId);
    if (!item) notFound("Category not found");
    const before = clone(item);
    if (body.name !== undefined) item.name = ensureString(body.name, "category.name");
    if (body.description !== undefined) item.description = optionalString(body.description);
    if (body.parentId !== undefined) item.parentId = optionalString(body.parentId);
    if (body.status !== undefined) item.status = String(body.status) as AssetCategory["status"];
    if (body.tags !== undefined) item.tags = ensureArray<string>(body.tags, "category.tags");
    if (body.metadata !== undefined) item.metadata = optionalObject(body.metadata);
    item.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "category.update", "category", item.id, before, item);
    return clone(item);
  }

  listAssets(actor: RequestActor, query?: URLSearchParams): Asset[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");
    const categoryId = pickQuery(query, "categoryId");
    const condition = pickQuery(query, "condition");
    return clone(this.store.getState().assets.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (status && item.status !== status) return false;
      if (categoryId && item.categoryId !== categoryId) return false;
      if (condition && item.condition !== condition) return false;
      if (search && !`${item.key} ${item.name} ${item.description ?? ""} ${item.serialNumber ?? ""}`.toLowerCase().includes(search)) return false;
      return true;
    }));
  }

  getAsset(id: string, actor: RequestActor): Asset {
    const item = this.store.getState().assets.find((candidate) => candidate.id === id && candidate.tenantId === actor.tenantId);
    if (!item) notFound("Asset not found");
    return clone(item);
  }

  createAsset(input: unknown, actor: RequestActor): Asset {
    const body = ensureObject(input, "asset");
    const state = this.store.getState();
    const key = ensureString(body.key, "asset.key");
    if (state.assets.some((item) => item.tenantId === actor.tenantId && item.key === key)) conflict("Asset key already exists");
    const category = this.getCategory(String(body.categoryId), actor);
    const now = nowIso();
    const asset: Asset = {
      id: newId("asset"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      key,
      name: ensureString(body.name, "asset.name"),
      description: optionalString(body.description),
      categoryId: category.id,
      serialNumber: optionalString(body.serialNumber),
      barcode: optionalString(body.barcode),
      qrCode: optionalString(body.qrCode),
      status: String(body.status ?? "active") as Asset["status"],
      condition: String(body.condition ?? "good") as Asset["condition"],
      purchaseDate: optionalString(body.purchaseDate),
      purchasePrice: body.purchasePrice ? ensureNumber(body.purchasePrice, "asset.purchasePrice") : undefined,
      supplier: optionalString(body.supplier),
      manufacturer: optionalString(body.manufacturer),
      model: optionalString(body.model),
      color: optionalString(body.color),
      weight: optionalString(body.weight),
      dimensions: optionalString(body.dimensions),
      location: optionalObject(body.location),
      parentAssetId: optionalString(body.parentAssetId),
      childAssetIds: [],
      tags: ensureArray<string>(body.tags, "asset.tags"),
      photos: body.photos ? ensureArray<string>(body.photos, "asset.photos") : undefined,
      documents: body.documents ? ensureArray<string>(body.documents, "asset.documents") : undefined,
      customFields: optionalObject(body.customFields),
      metadata: optionalObject(body.metadata)
    };
    state.assets.push(asset);
    this.recordEvent(actor, "asset.created", asset.id, { key: asset.key, name: asset.name, categoryId: asset.categoryId });
    this.store.save();
    this.store.audit(actor, "asset.create", "asset", asset.id, undefined, asset);
    return clone(asset);
  }

  updateAsset(id: string, input: unknown, actor: RequestActor): Asset {
    const body = ensureObject(input, "asset");
    const state = this.store.getState();
    const item = state.assets.find((candidate) => candidate.id === id && candidate.tenantId === actor.tenantId);
    if (!item) notFound("Asset not found");
    const before = clone(item);
    if (body.name !== undefined) item.name = ensureString(body.name, "asset.name");
    if (body.description !== undefined) item.description = optionalString(body.description);
    if (body.categoryId !== undefined) { this.getCategory(String(body.categoryId), actor); item.categoryId = String(body.categoryId); }
    if (body.serialNumber !== undefined) item.serialNumber = optionalString(body.serialNumber);
    if (body.barcode !== undefined) item.barcode = optionalString(body.barcode);
    if (body.qrCode !== undefined) item.qrCode = optionalString(body.qrCode);
    if (body.status !== undefined) item.status = String(body.status) as Asset["status"];
    if (body.condition !== undefined) item.condition = String(body.condition) as Asset["condition"];
    if (body.purchaseDate !== undefined) item.purchaseDate = optionalString(body.purchaseDate);
    if (body.purchasePrice !== undefined) item.purchasePrice = body.purchasePrice ? ensureNumber(body.purchasePrice, "asset.purchasePrice") : undefined;
    if (body.supplier !== undefined) item.supplier = optionalString(body.supplier);
    if (body.manufacturer !== undefined) item.manufacturer = optionalString(body.manufacturer);
    if (body.model !== undefined) item.model = optionalString(body.model);
    if (body.location !== undefined) item.location = optionalObject(body.location);
    if (body.assignedTo !== undefined) item.assignedTo = optionalString(body.assignedTo);
    if (body.assignedDate !== undefined) item.assignedDate = optionalString(body.assignedDate);
    if (body.tags !== undefined) item.tags = ensureArray<string>(body.tags, "asset.tags");
    if (body.customFields !== undefined) item.customFields = optionalObject(body.customFields);
    if (body.metadata !== undefined) item.metadata = optionalObject(body.metadata);
    item.updatedAt = nowIso();
    this.recordEvent(actor, "asset.updated", item.id, { key: item.key, status: item.status });
    this.store.save();
    this.store.audit(actor, "asset.update", "asset", item.id, before, item);
    return clone(item);
  }

  archiveAsset(id: string, actor: RequestActor): Asset {
    return this.updateAsset(id, { status: "archived" }, actor);
  }

  listAssignments(actor: RequestActor, query?: URLSearchParams): AssetAssignment[] {
    const assetId = pickQuery(query, "assetId");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().assignments.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (assetId && item.assetId !== assetId) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  getAssignment(id: string, actor: RequestActor): AssetAssignment {
    const item = this.store.getState().assignments.find((candidate) => candidate.id === id && candidate.tenantId === actor.tenantId);
    if (!item) notFound("Assignment not found");
    return clone(item);
  }

  createAssignment(input: unknown, actor: RequestActor): AssetAssignment {
    const body = ensureObject(input, "assignment");
    const state = this.store.getState();
    const asset = this.getAsset(String(body.assetId), actor);
    if (asset.assignedTo) conflict("Asset is already assigned");
    const now = nowIso();
    const assignment: AssetAssignment = {
      id: newId("assign"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      assetId: asset.id,
      assignedTo: ensureString(body.assignedTo, "assignment.assignedTo"),
      assignedBy: ensureString(body.assignedBy, "assignment.assignedBy"),
      status: "active",
      assignedDate: now,
      expectedReturnDate: optionalString(body.expectedReturnDate),
      location: optionalObject(body.location),
      notes: optionalString(body.notes),
      handoverCondition: body.handoverCondition ? String(body.handoverCondition) as AssetAssignment["handoverCondition"] : "good",
      metadata: optionalObject(body.metadata)
    };
    state.assignments.push(assignment);
    asset.assignedTo = assignment.assignedTo;
    asset.assignedDate = now;
    asset.updatedAt = now;
    this.recordEvent(actor, "asset.assigned", asset.id, { assignmentId: assignment.id, assignedTo: assignment.assignedTo });
    this.store.save();
    this.store.audit(actor, "assignment.create", "assignment", assignment.id, undefined, assignment);
    return clone(assignment);
  }

  returnAsset(id: string, input: unknown, actor: RequestActor): AssetAssignment {
    const body = ensureObject(input, "return");
    const state = this.store.getState();
    const assignment = state.assignments.find((candidate) => candidate.id === id && candidate.tenantId === actor.tenantId);
    if (!assignment) notFound("Assignment not found");
    if (assignment.status !== "active") badRequest("Assignment is not active");
    const asset = state.assets.find((a) => a.id === assignment.assetId);
    if (!asset) notFound("Asset not found");
    const before = clone(assignment);
    assignment.status = "returned";
    assignment.actualReturnDate = nowIso();
    assignment.returnCondition = body.returnCondition ? String(body.returnCondition) as AssetAssignment["returnCondition"] : undefined;
    assignment.notes = assignment.notes ? `${assignment.notes}\n${optionalString(body.notes) ?? ""}` : optionalString(body.notes);
    assignment.updatedAt = nowIso();
    asset.assignedTo = undefined;
    asset.assignedDate = undefined;
    asset.updatedAt = nowIso();
    this.recordEvent(actor, "asset.returned", asset.id, { assignmentId: assignment.id });
    this.store.save();
    this.store.audit(actor, "assignment.return", "assignment", assignment.id, before, assignment);
    return clone(assignment);
  }

  listMaintenanceRecords(actor: RequestActor, query?: URLSearchParams): MaintenanceRecord[] {
    const assetId = pickQuery(query, "assetId");
    const status = pickQuery(query, "status");
    const type = pickQuery(query, "type");
    return clone(this.store.getState().maintenanceRecords.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (assetId && item.assetId !== assetId) return false;
      if (status && item.status !== status) return false;
      if (type && item.type !== type) return false;
      return true;
    }));
  }

  getMaintenanceRecord(id: string, actor: RequestActor): MaintenanceRecord {
    const item = this.store.getState().maintenanceRecords.find((candidate) => candidate.id === id && candidate.tenantId === actor.tenantId);
    if (!item) notFound("Maintenance record not found");
    return clone(item);
  }

  createMaintenanceRecord(input: unknown, actor: RequestActor): MaintenanceRecord {
    const body = ensureObject(input, "maintenance");
    const state = this.store.getState();
    const asset = this.getAsset(String(body.assetId), actor);
    const now = nowIso();
    const record: MaintenanceRecord = {
      id: newId("maint"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      assetId: asset.id,
      type: String(body.type ?? "preventive") as MaintenanceRecord["type"],
      status: "scheduled",
      priority: String(body.priority ?? "medium") as MaintenanceRecord["priority"],
      title: ensureString(body.title, "maintenance.title"),
      description: optionalString(body.description),
      scheduledDate: ensureString(body.scheduledDate, "maintenance.scheduledDate"),
      technician: optionalString(body.technician),
      vendorId: optionalString(body.vendorId),
      cost: body.cost ? ensureNumber(body.cost, "maintenance.cost") : undefined,
      partsReplaced: body.partsReplaced ? ensureArray<string>(body.partsReplaced, "maintenance.partsReplaced") : undefined,
      notes: optionalString(body.notes),
      nextMaintenanceDate: optionalString(body.nextMaintenanceDate),
      metadata: optionalObject(body.metadata)
    };
    state.maintenanceRecords.push(record);
    this.recordEvent(actor, "maintenance.scheduled", asset.id, { maintenanceId: record.id, scheduledDate: record.scheduledDate });
    this.store.save();
    this.store.audit(actor, "maintenance.create", "maintenance", record.id, undefined, record);
    return clone(record);
  }

  updateMaintenanceRecord(id: string, input: unknown, actor: RequestActor): MaintenanceRecord {
    const body = ensureObject(input, "maintenance");
    const state = this.store.getState();
    const item = state.maintenanceRecords.find((candidate) => candidate.id === id && candidate.tenantId === actor.tenantId);
    if (!item) notFound("Maintenance record not found");
    const before = clone(item);
    if (body.title !== undefined) item.title = ensureString(body.title, "maintenance.title");
    if (body.description !== undefined) item.description = optionalString(body.description);
    if (body.status !== undefined) item.status = String(body.status) as MaintenanceRecord["status"];
    if (body.priority !== undefined) item.priority = String(body.priority) as MaintenanceRecord["priority"];
    if (body.scheduledDate !== undefined) item.scheduledDate = ensureString(body.scheduledDate, "maintenance.scheduledDate");
    if (body.completedDate !== undefined) item.completedDate = optionalString(body.completedDate);
    if (body.technician !== undefined) item.technician = optionalString(body.technician);
    if (body.cost !== undefined) item.cost = body.cost ? ensureNumber(body.cost, "maintenance.cost") : undefined;
    if (body.partsReplaced !== undefined) item.partsReplaced = ensureArray<string>(body.partsReplaced, "maintenance.partsReplaced");
    if (body.notes !== undefined) item.notes = optionalString(body.notes);
    if (body.nextMaintenanceDate !== undefined) item.nextMaintenanceDate = optionalString(body.nextMaintenanceDate);
    if (body.metadata !== undefined) item.metadata = optionalObject(body.metadata);
    item.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "maintenance.update", "maintenance", item.id, before, item);
    return clone(item);
  }

  listWarranties(actor: RequestActor, query?: URLSearchParams): AssetWarranty[] {
    const assetId = pickQuery(query, "assetId");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().warranties.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (assetId && item.assetId !== assetId) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  getWarranty(id: string, actor: RequestActor): AssetWarranty {
    const item = this.store.getState().warranties.find((candidate) => candidate.id === id && candidate.tenantId === actor.tenantId);
    if (!item) notFound("Warranty not found");
    return clone(item);
  }

  createWarranty(input: unknown, actor: RequestActor): AssetWarranty {
    const body = ensureObject(input, "warranty");
    const state = this.store.getState();
    const asset = this.getAsset(String(body.assetId), actor);
    const now = nowIso();
    const warranty: AssetWarranty = {
      id: newId("warranty"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      assetId: asset.id,
      provider: ensureString(body.provider, "warranty.provider"),
      type: String(body.type ?? "manufacturer") as AssetWarranty["type"],
      startDate: ensureString(body.startDate, "warranty.startDate"),
      endDate: ensureString(body.endDate, "warranty.endDate"),
      coverageDetails: optionalString(body.coverageDetails),
      claimContact: optionalString(body.claimContact),
      claimPhone: optionalString(body.claimPhone),
      status: "active",
      cost: body.cost ? ensureNumber(body.cost, "warranty.cost") : undefined,
      documentUri: optionalString(body.documentUri),
      metadata: optionalObject(body.metadata)
    };
    state.warranties.push(warranty);
    asset.warrantyId = warranty.id;
    asset.updatedAt = now;
    this.store.save();
    this.store.audit(actor, "warranty.create", "warranty", warranty.id, undefined, warranty);
    return clone(warranty);
  }

  listDepreciations(actor: RequestActor, query?: URLSearchParams): AssetDepreciation[] {
    const assetId = pickQuery(query, "assetId");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().depreciations.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (assetId && item.assetId !== assetId) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  getDepreciation(id: string, actor: RequestActor): AssetDepreciation {
    const item = this.store.getState().depreciations.find((candidate) => candidate.id === id && candidate.tenantId === actor.tenantId);
    if (!item) notFound("Depreciation not found");
    return clone(item);
  }

  createDepreciation(input: unknown, actor: RequestActor): AssetDepreciation {
    const body = ensureObject(input, "depreciation");
    const state = this.store.getState();
    const asset = this.getAsset(String(body.assetId), actor);
    const purchasePrice = ensureNumber(body.purchasePrice, "depreciation.purchasePrice");
    const salvageValue = ensureNumber(body.salvageValue, "depreciation.salvageValue", 0);
    const usefulLifeMonths = ensureNumber(body.usefulLifeMonths, "depreciation.usefulLifeMonths");
    const monthlyDepreciation = (purchasePrice - salvageValue) / usefulLifeMonths;
    const now = nowIso();
    const depreciation: AssetDepreciation = {
      id: newId("depr"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      assetId: asset.id,
      method: String(body.method ?? "straight_line") as AssetDepreciation["method"],
      purchasePrice,
      salvageValue,
      usefulLifeMonths,
      depreciationStartDate: ensureString(body.depreciationStartDate, "depreciation.depreciationStartDate"),
      currentValue: purchasePrice,
      accumulatedDepreciation: 0,
      monthlyDepreciation: Math.round(monthlyDepreciation * 100) / 100,
      status: "active",
      metadata: optionalObject(body.metadata)
    };
    state.depreciations.push(depreciation);
    asset.depreciationId = depreciation.id;
    asset.updatedAt = now;
    this.store.save();
    this.store.audit(actor, "depreciation.create", "depreciation", depreciation.id, undefined, depreciation);
    return clone(depreciation);
  }

  calculateDepreciation(id: string, monthsElapsed: number, actor: RequestActor): AssetDepreciation {
    const state = this.store.getState();
    const item = state.depreciations.find((candidate) => candidate.id === id && candidate.tenantId === actor.tenantId);
    if (!item) notFound("Depreciation not found");
    if (item.status !== "active") badRequest("Depreciation is not active");
    const totalDepreciation = item.monthlyDepreciation * monthsElapsed;
    const accumulatedDepreciation = Math.min(totalDepreciation, item.purchasePrice - item.salvageValue);
    const currentValue = Math.max(item.purchasePrice - accumulatedDepreciation, item.salvageValue);
    const before = clone(item);
    item.accumulatedDepreciation = Math.round(accumulatedDepreciation * 100) / 100;
    item.currentValue = Math.round(currentValue * 100) / 100;
    if (accumulatedDepreciation >= item.purchasePrice - item.salvageValue) {
      item.status = "completed";
    }
    item.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "depreciation.calculate", "depreciation", item.id, before, item);
    return clone(item);
  }

  listAudits(actor: RequestActor, query?: URLSearchParams): AssetAudit[] {
    const assetId = pickQuery(query, "assetId");
    const status = pickQuery(query, "status");
    return clone(this.store.getState().audits.filter((item) => {
      if (item.tenantId !== actor.tenantId) return false;
      if (assetId && item.assetId !== assetId) return false;
      if (status && item.status !== status) return false;
      return true;
    }));
  }

  getAudit(id: string, actor: RequestActor): AssetAudit {
    const item = this.store.getState().audits.find((candidate) => candidate.id === id && candidate.tenantId === actor.tenantId);
    if (!item) notFound("Audit not found");
    return clone(item);
  }

  createAudit(input: unknown, actor: RequestActor): AssetAudit {
    const body = ensureObject(input, "audit");
    const now = nowIso();
    const audit: AssetAudit = {
      id: newId("audit"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      assetId: optionalString(body.assetId),
      title: ensureString(body.title, "audit.title"),
      description: optionalString(body.description),
      auditorId: ensureString(body.auditorId, "audit.auditorId"),
      scheduledDate: ensureString(body.scheduledDate, "audit.scheduledDate"),
      status: "scheduled",
      itemsAudited: 0,
      itemsPassed: 0,
      itemsFailed: 0,
      metadata: optionalObject(body.metadata)
    };
    this.store.getState().audits.push(audit);
    this.recordEvent(actor, "audit.scheduled", audit.assetId, { auditId: audit.id });
    this.store.save();
    this.store.audit(actor, "audit.create", "audit", audit.id, undefined, audit);
    return clone(audit);
  }

  completeAudit(id: string, input: unknown, actor: RequestActor): AssetAudit {
    const body = ensureObject(input, "auditComplete");
    const state = this.store.getState();
    const item = state.audits.find((candidate) => candidate.id === id && candidate.tenantId === actor.tenantId);
    if (!item) notFound("Audit not found");
    if (item.status === "completed") badRequest("Audit already completed");
    const before = clone(item);
    item.status = "completed";
    item.completedDate = nowIso();
    item.findings = optionalString(body.findings);
    item.recommendations = optionalString(body.recommendations);
    item.itemsAudited = ensureNumber(body.itemsAudited, "auditComplete.itemsAudited");
    item.itemsPassed = ensureNumber(body.itemsPassed, "auditComplete.itemsPassed");
    item.itemsFailed = ensureNumber(body.itemsFailed, "auditComplete.itemsFailed");
    item.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "audit.complete", "audit", item.id, before, item);
    return clone(item);
  }

  listRuns(actor: RequestActor): AssetRun[] {
    return clone(this.store.getState().runs.filter((run) => run.tenantId === actor.tenantId));
  }

  createRun(input: unknown, actor: RequestActor): AssetRun {
    const body = ensureObject(input, "run");
    const now = nowIso();
    const run: AssetRun = {
      id: newId("run"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      name: ensureString(body.name, "run.name"),
      description: optionalString(body.description),
      status: "completed",
      input: optionalObject(body.input),
      output: { message: "AssetOS run completed", handledBy: "AssetService" },
      startedAt: now,
      completedAt: now,
      metadata: optionalObject(body.metadata)
    };
    this.store.getState().runs.unshift(run);
    this.store.save();
    this.store.audit(actor, "run.create", "run", run.id, undefined, run);
    return clone(run);
  }

  listEvents(actor: RequestActor): AssetEvent[] {
    return clone(this.store.getState().events.filter((event) => event.tenantId === actor.tenantId));
  }

  listAuditLogs(actor: RequestActor) {
    return clone(this.store.getState().auditLogs.filter((log) => log.tenantId === actor.tenantId));
  }

  private recordEvent(actor: RequestActor, type: string, assetId: string | undefined, data: Record<string, unknown>): void {
    const now = nowIso();
    this.store.getState().events.unshift({
      id: newId("event"),
      tenantId: actor.tenantId,
      createdAt: now,
      updatedAt: now,
      type,
      source: "AssetOS",
      assetId,
      data
    });
  }
}
