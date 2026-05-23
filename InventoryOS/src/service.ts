import { DataStore } from "./core/datastore";
import {
  InventoryItem,
  InventoryOverview,
  RequestActor,
  StockAdjustment,
  StockInward,
  StockLevel,
  StockOutward,
  Transfer,
  TransferItem,
  Warehouse,
  StockReservation,
  ReorderRule,
  StockCount,
  StockCountItem,
  InventoryBatch,
  InventorySerial,
  WarehouseZone,
  StockLocation
} from "./types";
import { newId, nowIso, plusDays } from "./core/id";
import { badRequest, conflict, notFound } from "./core/errors";
import { clone, ensureArray, ensureBoolean, ensureNumber, ensureObject, ensureString, optionalObject, pickQuery, includesText } from "./core/utils";

export class InventoryService {
  constructor(private readonly store: DataStore) {}

  getRoutesSummary(): string {
    return "InventoryOS service is ready";
  }

  overview(actor: RequestActor): InventoryOverview {
    const state = this.store.getState();
    const tenant = actor.tenantId;

    const items = state.items.filter((item) => item.tenantId === tenant);
    const warehouses = state.warehouses.filter((w) => w.tenantId === tenant);
    const stockLevels = state.stockLevels.filter((s) => s.tenantId === tenant);
    const transfers = state.transfers.filter((t) => t.tenantId === tenant);
    const adjustments = state.adjustments.filter((a) => a.tenantId === tenant);

    const activeItems = items.filter((item) => item.status === "active");
    const lowStockItems = this.getLowStockItems(actor);
    const outOfStockItems = activeItems.filter((item) => {
      const totalStock = stockLevels
        .filter((s) => s.itemId === item.id)
        .reduce((sum, s) => sum + s.availableQuantity, 0);
      return totalStock === 0;
    });

    const totalValue = stockLevels.reduce((sum, stock) => {
      const item = items.find((i) => i.id === stock.itemId);
      return sum + (item ? item.costPrice * stock.quantity : 0);
    }, 0);

    return {
      items: {
        total: items.length,
        active: activeItems.length,
        lowStock: lowStockItems.length,
        outOfStock: outOfStockItems.length
      },
      warehouses: {
        total: warehouses.length,
        active: warehouses.filter((w) => w.status === "active").length
      },
      stock: {
        total: stockLevels.reduce((sum, s) => sum + s.quantity, 0),
        available: stockLevels.reduce((sum, s) => sum + s.availableQuantity, 0),
        reserved: stockLevels.reduce((sum, s) => sum + s.reservedQuantity, 0),
        damaged: stockLevels.reduce((sum, s) => sum + s.damagedQuantity, 0),
        inTransit: stockLevels.reduce((sum, s) => sum + s.inTransitQuantity, 0)
      },
      transfers: {
        pending: transfers.filter((t) => t.status === "requested" || t.status === "approved").length,
        inTransit: transfers.filter((t) => t.status === "in_transit").length
      },
      adjustments: {
        pending: adjustments.filter((a) => a.status === "pending").length,
        applied: adjustments.filter((a) => a.status === "applied").length
      },
      totalValue
    };
  }

  listItems(actor: RequestActor, query?: URLSearchParams): InventoryItem[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const category = pickQuery(query, "category");
    const status = pickQuery(query, "status");

    return clone(
      this.store.getState().items.filter((item) => {
        if (item.tenantId !== actor.tenantId) return false;
        if (search && !`${item.name} ${item.sku} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
        if (category && item.category !== category) return false;
        if (status && item.status !== status) return false;
        return true;
      })
    );
  }

  getItem(id: string, actor: RequestActor): InventoryItem {
    const item = this.store.getState().items.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!item) notFound("Item not found");
    return clone(item);
  }

  createItem(input: unknown, actor: RequestActor): InventoryItem {
    const body = ensureObject(input, "item");
    const state = this.store.getState();
    const sku = ensureString(body.sku, "item.sku");
    if (state.items.some((item) => item.tenantId === actor.tenantId && item.sku === sku)) {
      conflict(`Item with SKU '${sku}' already exists`);
    }

    const item: InventoryItem = {
      id: newId("item"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      sku,
      name: ensureString(body.name, "item.name"),
      description: body.description ? String(body.description) : undefined,
      category: ensureString(body.category, "item.category"),
      unit: ensureString(body.unit, "item.unit"),
      brand: body.brand ? String(body.brand) : undefined,
      model: body.model ? String(body.model) : undefined,
      barcode: body.barcode ? String(body.barcode) : undefined,
      qrCode: body.qrCode ? String(body.qrCode) : undefined,
      costPrice: ensureNumber(body.costPrice, "item.costPrice"),
      sellingPrice: ensureNumber(body.sellingPrice, "item.sellingPrice"),
      minimumStock: ensureNumber(body.minimumStock, "item.minimumStock", 0),
      maximumStock: ensureNumber(body.maximumStock, "item.maximumStock", 0),
      reorderLevel: ensureNumber(body.reorderLevel, "item.reorderLevel", 0),
      status: String(body.status ?? "active") as InventoryItem["status"],
      tags: ensureArray<string>(body.tags, "item.tags"),
      metadata: optionalObject(body.metadata)
    };

    state.items.push(item);
    this.store.save();
    this.store.audit(actor, "item.create", "item", item.id, undefined, item);
    this.store.emit("inventory.item.created", "InventoryOS", { itemId: item.id, sku: item.sku }, actor);

    return clone(item);
  }

  updateItem(id: string, input: unknown, actor: RequestActor): InventoryItem {
    const body = ensureObject(input, "item");
    const state = this.store.getState();
    const item = state.items.find((item) => item.id === id && item.tenantId === actor.tenantId);
    if (!item) notFound("Item not found");

    const before = clone(item);

    if (body.name !== undefined) item.name = ensureString(body.name, "item.name");
    if (body.description !== undefined) item.description = body.description ? String(body.description) : undefined;
    if (body.category !== undefined) item.category = ensureString(body.category, "item.category");
    if (body.unit !== undefined) item.unit = ensureString(body.unit, "item.unit");
    if (body.brand !== undefined) item.brand = body.brand ? String(body.brand) : undefined;
    if (body.model !== undefined) item.model = body.model ? String(body.model) : undefined;
    if (body.barcode !== undefined) item.barcode = body.barcode ? String(body.barcode) : undefined;
    if (body.qrCode !== undefined) item.qrCode = body.qrCode ? String(body.qrCode) : undefined;
    if (body.costPrice !== undefined) item.costPrice = ensureNumber(body.costPrice, "item.costPrice");
    if (body.sellingPrice !== undefined) item.sellingPrice = ensureNumber(body.sellingPrice, "item.sellingPrice");
    if (body.minimumStock !== undefined) item.minimumStock = ensureNumber(body.minimumStock, "item.minimumStock");
    if (body.maximumStock !== undefined) item.maximumStock = ensureNumber(body.maximumStock, "item.maximumStock");
    if (body.reorderLevel !== undefined) item.reorderLevel = ensureNumber(body.reorderLevel, "item.reorderLevel");
    if (body.status !== undefined) item.status = String(body.status) as InventoryItem["status"];
    if (body.tags !== undefined) item.tags = ensureArray<string>(body.tags, "item.tags");
    if (body.metadata !== undefined) item.metadata = optionalObject(body.metadata);

    item.updatedAt = nowIso();
    this.store.save();
    this.store.audit(actor, "item.update", "item", item.id, before, item);
    this.store.emit("inventory.item.updated", "InventoryOS", { itemId: item.id, sku: item.sku }, actor);

    return clone(item);
  }

  listWarehouses(actor: RequestActor, query?: URLSearchParams): Warehouse[] {
    const search = pickQuery(query, "search")?.toLowerCase();
    const status = pickQuery(query, "status");

    return clone(
      this.store.getState().warehouses.filter((warehouse) => {
        if (warehouse.tenantId !== actor.tenantId) return false;
        if (search && !`${warehouse.name} ${warehouse.code} ${warehouse.description ?? ""}`.toLowerCase().includes(search)) return false;
        if (status && warehouse.status !== status) return false;
        return true;
      })
    );
  }

  getWarehouse(id: string, actor: RequestActor): Warehouse {
    const warehouse = this.store.getState().warehouses.find((w) => w.id === id && w.tenantId === actor.tenantId);
    if (!warehouse) notFound("Warehouse not found");
    return clone(warehouse);
  }

  createWarehouse(input: unknown, actor: RequestActor): Warehouse {
    const body = ensureObject(input, "warehouse");
    const state = this.store.getState();
    const code = ensureString(body.code, "warehouse.code");
    if (state.warehouses.some((w) => w.tenantId === actor.tenantId && w.code === code)) {
      conflict(`Warehouse with code '${code}' already exists`);
    }

    const warehouse: Warehouse = {
      id: newId("wh"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      code,
      name: ensureString(body.name, "warehouse.name"),
      description: body.description ? String(body.description) : undefined,
      address: body.address ? String(body.address) : undefined,
      city: body.city ? String(body.city) : undefined,
      state: body.state ? String(body.state) : undefined,
      country: body.country ? String(body.country) : undefined,
      zipCode: body.zipCode ? String(body.zipCode) : undefined,
      managerId: body.managerId ? String(body.managerId) : undefined,
      capacity: body.capacity ? ensureNumber(body.capacity, "warehouse.capacity") : undefined,
      status: String(body.status ?? "active") as Warehouse["status"],
      zones: [],
      metadata: optionalObject(body.metadata)
    };

    state.warehouses.push(warehouse);
    this.store.save();
    this.store.audit(actor, "warehouse.create", "warehouse", warehouse.id, undefined, warehouse);

    return clone(warehouse);
  }

  getLowStockItems(actor: RequestActor): InventoryItem[] {
    const state = this.store.getState();
    const activeItems = state.items.filter((item) => item.tenantId === actor.tenantId && item.status === "active");

    return clone(
      activeItems.filter((item) => {
        const totalStock = state.stockLevels
          .filter((s) => s.itemId === item.id && s.tenantId === actor.tenantId)
          .reduce((sum, s) => sum + s.availableQuantity, 0);
        return totalStock < item.reorderLevel;
      })
    );
  }

  listStockLevels(actor: RequestActor, query?: URLSearchParams): StockLevel[] {
    const itemId = pickQuery(query, "itemId");
    const warehouseId = pickQuery(query, "warehouseId");

    return clone(
      this.store.getState().stockLevels.filter((stock) => {
        if (stock.tenantId !== actor.tenantId) return false;
        if (itemId && stock.itemId !== itemId) return false;
        if (warehouseId && stock.warehouseId !== warehouseId) return false;
        return true;
      })
    );
  }

  getStockLevel(itemId: string, warehouseId: string, actor: RequestActor): StockLevel {
    const stock = this.store.getState().stockLevels.find(
      (s) => s.itemId === itemId && s.warehouseId === warehouseId && s.tenantId === actor.tenantId
    );
    if (!stock) notFound("Stock level not found");
    return clone(stock);
  }

  receiveStock(input: unknown, actor: RequestActor): StockInward {
    const body = ensureObject(input, "stockInward");
    const state = this.store.getState();

    const item = state.items.find((i) => i.id === body.itemId && i.tenantId === actor.tenantId);
    if (!item) notFound("Item not found");

    const warehouse = state.warehouses.find((w) => w.id === body.warehouseId && w.tenantId === actor.tenantId);
    if (!warehouse) notFound("Warehouse not found");

    const inward: StockInward = {
      id: newId("inward"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      itemId: item.id,
      warehouseId: warehouse.id,
      locationId: body.locationId ? String(body.locationId) : undefined,
      referenceNumber: body.referenceNumber ? String(body.referenceNumber) : undefined,
      sourceType: String(body.sourceType ?? "purchase") as StockInward["sourceType"],
      sourceId: body.sourceId ? String(body.sourceId) : undefined,
      quantity: ensureNumber(body.quantity, "stockInward.quantity"),
      unitCost: ensureNumber(body.unitCost, "stockInward.unitCost"),
      totalCost: 0,
      batchNumber: body.batchNumber ? String(body.batchNumber) : undefined,
      expiryDate: body.expiryDate ? String(body.expiryDate) : undefined,
      receivedBy: actor.userId,
      notes: body.notes ? String(body.notes) : undefined,
      status: "received",
      metadata: optionalObject(body.metadata)
    };

    inward.totalCost = inward.quantity * inward.unitCost;
    state.inwards.push(inward);

    let stockLevel = state.stockLevels.find(
      (s) => s.itemId === item.id && s.warehouseId === warehouse.id && s.tenantId === actor.tenantId
    );

    if (!stockLevel) {
      stockLevel = {
        id: newId("stock"),
        tenantId: actor.tenantId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        itemId: item.id,
        warehouseId: warehouse.id,
        locationId: inward.locationId,
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        damagedQuantity: 0,
        expiredQuantity: 0,
        inTransitQuantity: 0,
        metadata: {}
      };
      state.stockLevels.push(stockLevel);
    }

    const before = clone(stockLevel);
    stockLevel.quantity += inward.quantity;
    stockLevel.availableQuantity += inward.quantity;
    stockLevel.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "stock.receive", "stockInward", inward.id, before, stockLevel);
    this.store.emit("inventory.stock.received", "InventoryOS", {
      itemId: item.id,
      warehouseId: warehouse.id,
      quantity: inward.quantity
    }, actor);

    if (stockLevel.availableQuantity < item.reorderLevel) {
      this.store.emit("inventory.stock.low", "InventoryOS", {
        itemId: item.id,
        sku: item.sku,
        available: stockLevel.availableQuantity,
        reorderLevel: item.reorderLevel
      }, actor);
    }

    return clone(inward);
  }

  issueStock(input: unknown, actor: RequestActor): StockOutward {
    const body = ensureObject(input, "stockOutward");
    const state = this.store.getState();

    const item = state.items.find((i) => i.id === body.itemId && i.tenantId === actor.tenantId);
    if (!item) notFound("Item not found");

    const warehouse = state.warehouses.find((w) => w.id === body.warehouseId && w.tenantId === actor.tenantId);
    if (!warehouse) notFound("Warehouse not found");

    let stockLevel = state.stockLevels.find(
      (s) => s.itemId === item.id && s.warehouseId === warehouse.id && s.tenantId === actor.tenantId
    );

    if (!stockLevel || stockLevel.availableQuantity < ensureNumber(body.quantity, "stockOutward.quantity")) {
      badRequest("Insufficient stock available");
    }

    const outward: StockOutward = {
      id: newId("outward"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      itemId: item.id,
      warehouseId: warehouse.id,
      locationId: body.locationId ? String(body.locationId) : undefined,
      referenceNumber: body.referenceNumber ? String(body.referenceNumber) : undefined,
      destinationType: String(body.destinationType ?? "issue") as StockOutward["destinationType"],
      destinationId: body.destinationId ? String(body.destinationId) : undefined,
      quantity: ensureNumber(body.quantity, "stockOutward.quantity"),
      unitCost: item.costPrice,
      totalCost: 0,
      issuedTo: body.issuedTo ? String(body.issuedTo) : undefined,
      issuedBy: actor.userId,
      approvedBy: body.approvedBy ? String(body.approvedBy) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      status: "issued",
      metadata: optionalObject(body.metadata)
    };

    outward.totalCost = outward.quantity * outward.unitCost;
    state.outwards.push(outward);

    const before = clone(stockLevel);
    stockLevel.quantity -= outward.quantity;
    stockLevel.availableQuantity -= outward.quantity;
    stockLevel.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "stock.issue", "stockOutward", outward.id, before, stockLevel);
    this.store.emit("inventory.stock.issued", "InventoryOS", {
      itemId: item.id,
      warehouseId: warehouse.id,
      quantity: outward.quantity
    }, actor);

    if (stockLevel.availableQuantity === 0) {
      this.store.emit("inventory.stock.out_of_stock", "InventoryOS", {
        itemId: item.id,
        sku: item.sku
      }, actor);
    }

    return clone(outward);
  }

  createTransfer(input: unknown, actor: RequestActor): Transfer {
    const body = ensureObject(input, "transfer");
    const state = this.store.getState();

    const fromWarehouse = state.warehouses.find((w) => w.id === body.fromWarehouseId && w.tenantId === actor.tenantId);
    if (!fromWarehouse) notFound("Source warehouse not found");

    const toWarehouse = state.warehouses.find((w) => w.id === body.toWarehouseId && w.tenantId === actor.tenantId);
    if (!toWarehouse) notFound("Destination warehouse not found");

    const items = ensureArray(body.items, "transfer.items");
    if (items.length === 0) badRequest("Transfer must have at least one item");

    for (const itemInput of items) {
      const itemObj = ensureObject(itemInput, "transferItem");
      const item = state.items.find((i) => i.id === itemObj.itemId && i.tenantId === actor.tenantId);
      if (!item) notFound(`Item ${itemObj.itemId} not found`);

      let stockLevel = state.stockLevels.find(
        (s) => s.itemId === item.id && s.warehouseId === fromWarehouse.id && s.tenantId === actor.tenantId
      );

      if (!stockLevel || stockLevel.availableQuantity < ensureNumber(itemObj.quantity, "transferItem.quantity")) {
        badRequest(`Insufficient stock for item ${item.sku}`);
      }
    }

    const transfer: Transfer = {
      id: newId("transfer"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      referenceNumber: `TRF-${nowIso().split("T")[0].replace(/-/g, "")}-${newId("trf").slice(-6)}`,
      fromWarehouseId: fromWarehouse.id,
      fromLocationId: body.fromLocationId ? String(body.fromLocationId) : undefined,
      toWarehouseId: toWarehouse.id,
      toLocationId: body.toLocationId ? String(body.toLocationId) : undefined,
      status: "requested",
      requestedBy: actor.userId,
      approvedBy: body.approvedBy ? String(body.approvedBy) : undefined,
      receivedBy: undefined,
      items: [],
      notes: body.notes ? String(body.notes) : undefined,
      metadata: optionalObject(body.metadata)
    };

    state.transfers.push(transfer);

    for (const itemInput of items) {
      const itemObj = ensureObject(itemInput, "transferItem");
      const item = state.items.find((i) => i.id === itemObj.itemId && i.tenantId === actor.tenantId)!;

      const transferItem: TransferItem = {
        id: newId("trfitem"),
        tenantId: actor.tenantId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        transferId: transfer.id,
        itemId: item.id,
        quantity: ensureNumber(itemObj.quantity, "transferItem.quantity"),
        quantitySent: 0,
        quantityReceived: 0,
        unitCost: item.costPrice
      };

      transfer.items.push(transferItem);
      state.transferItems.push(transferItem);
    }

    this.store.save();
    this.store.audit(actor, "transfer.create", "transfer", transfer.id, undefined, transfer);

    return clone(transfer);
  }

  approveTransfer(id: string, actor: RequestActor): Transfer {
    const state = this.store.getState();
    const transfer = state.transfers.find((t) => t.id === id && t.tenantId === actor.tenantId);
    if (!transfer) notFound("Transfer not found");
    if (transfer.status !== "requested") badRequest("Transfer cannot be approved in current status");

    const before = clone(transfer);
    transfer.status = "approved";
    transfer.approvedBy = actor.userId;
    transfer.updatedAt = nowIso();

    for (const item of transfer.items) {
      const stockLevel = state.stockLevels.find(
        (s) => s.itemId === item.itemId && s.warehouseId === transfer.fromWarehouseId && s.tenantId === actor.tenantId
      );
      if (stockLevel) {
        stockLevel.availableQuantity -= item.quantity;
        stockLevel.inTransitQuantity += item.quantity;
        item.quantitySent = item.quantity;
      }
    }

    this.store.save();
    this.store.audit(actor, "transfer.approve", "transfer", transfer.id, before, transfer);

    return clone(transfer);
  }

  receiveTransfer(id: string, input: unknown, actor: RequestActor): Transfer {
    const body = ensureObject(input, "receiveTransfer");
    const state = this.store.getState();
    const transfer = state.transfers.find((t) => t.id === id && t.tenantId === actor.tenantId);
    if (!transfer) notFound("Transfer not found");
    if (transfer.status !== "approved" && transfer.status !== "in_transit") {
      badRequest("Transfer cannot be received in current status");
    }

    const before = clone(transfer);
    transfer.status = "received";
    transfer.receivedBy = actor.userId;
    transfer.updatedAt = nowIso();

    for (const item of transfer.items) {
      const receivedQty = (body.items as any[])?.find((i: any) => i.itemId === item.itemId)?.quantityReceived ?? item.quantitySent;

      const fromStock = state.stockLevels.find(
        (s) => s.itemId === item.itemId && s.warehouseId === transfer.fromWarehouseId && s.tenantId === actor.tenantId
      );
      if (fromStock) {
        fromStock.inTransitQuantity -= item.quantitySent;
        fromStock.quantity -= item.quantitySent;
      }

      let toStock = state.stockLevels.find(
        (s) => s.itemId === item.itemId && s.warehouseId === transfer.toWarehouseId && s.tenantId === actor.tenantId
      );
      if (!toStock) {
        toStock = {
          id: newId("stock"),
          tenantId: actor.tenantId,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          itemId: item.itemId,
          warehouseId: transfer.toWarehouseId,
          locationId: transfer.toLocationId,
          quantity: 0,
          reservedQuantity: 0,
          availableQuantity: 0,
          damagedQuantity: 0,
          expiredQuantity: 0,
          inTransitQuantity: 0,
          metadata: {}
        };
        state.stockLevels.push(toStock);
      }

      toStock.quantity += receivedQty;
      toStock.availableQuantity += receivedQty;
      item.quantityReceived = receivedQty;
    }

    this.store.save();
    this.store.audit(actor, "transfer.receive", "transfer", transfer.id, before, transfer);
    this.store.emit("inventory.stock.transferred", "InventoryOS", {
      transferId: transfer.id,
      fromWarehouseId: transfer.fromWarehouseId,
      toWarehouseId: transfer.toWarehouseId
    }, actor);

    return clone(transfer);
  }

  createAdjustment(input: unknown, actor: RequestActor): StockAdjustment {
    const body = ensureObject(input, "adjustment");
    const state = this.store.getState();

    const item = state.items.find((i) => i.id === body.itemId && i.tenantId === actor.tenantId);
    if (!item) notFound("Item not found");

    const warehouse = state.warehouses.find((w) => w.id === body.warehouseId && w.tenantId === actor.tenantId);
    if (!warehouse) notFound("Warehouse not found");

    let stockLevel = state.stockLevels.find(
      (s) => s.itemId === item.id && s.warehouseId === warehouse.id && s.tenantId === actor.tenantId
    );

    if (!stockLevel) {
      badRequest("Stock level not found for this item and warehouse");
    }

    const adjustment: StockAdjustment = {
      id: newId("adj"),
      tenantId: actor.tenantId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      itemId: item.id,
      warehouseId: warehouse.id,
      locationId: body.locationId ? String(body.locationId) : undefined,
      adjustmentType: String(body.adjustmentType ?? "correction") as StockAdjustment["adjustmentType"],
      quantity: ensureNumber(body.quantity, "adjustment.quantity"),
      reason: ensureString(body.reason, "adjustment.reason"),
      referenceNumber: body.referenceNumber ? String(body.referenceNumber) : undefined,
      adjustedBy: actor.userId,
      approvedBy: body.approvedBy ? String(body.approvedBy) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      status: "applied",
      metadata: optionalObject(body.metadata)
    };

    state.adjustments.push(adjustment);

    const before = clone(stockLevel);

    if (adjustment.adjustmentType === "positive" || adjustment.adjustmentType === "return" || adjustment.adjustmentType === "count") {
      stockLevel.quantity += Math.abs(adjustment.quantity);
      stockLevel.availableQuantity += Math.abs(adjustment.quantity);
    } else if (adjustment.adjustmentType === "negative") {
      stockLevel.quantity -= Math.abs(adjustment.quantity);
      stockLevel.availableQuantity -= Math.abs(adjustment.quantity);
    } else if (adjustment.adjustmentType === "damage" || adjustment.adjustmentType === "loss" || adjustment.adjustmentType === "expiry") {
      stockLevel.quantity -= Math.abs(adjustment.quantity);
      stockLevel.availableQuantity -= Math.abs(adjustment.quantity);
      stockLevel.damagedQuantity += Math.abs(adjustment.quantity);
    }

    stockLevel.updatedAt = nowIso();

    this.store.save();
    this.store.audit(actor, "adjustment.create", "adjustment", adjustment.id, before, stockLevel);
    this.store.emit("inventory.stock.adjusted", "InventoryOS", {
      itemId: item.id,
      warehouseId: warehouse.id,
      adjustmentType: adjustment.adjustmentType,
      quantity: adjustment.quantity
    }, actor);

    return clone(adjustment);
  }

  listAdjustments(actor: RequestActor, query?: URLSearchParams): StockAdjustment[] {
    const itemId = pickQuery(query, "itemId");
    const warehouseId = pickQuery(query, "warehouseId");
    const status = pickQuery(query, "status");

    return clone(
      this.store.getState().adjustments.filter((adj) => {
        if (adj.tenantId !== actor.tenantId) return false;
        if (itemId && adj.itemId !== itemId) return false;
        if (warehouseId && adj.warehouseId !== warehouseId) return false;
        if (status && adj.status !== status) return false;
        return true;
      })
    );
  }

  listTransfers(actor: RequestActor, query?: URLSearchParams): Transfer[] {
    const status = pickQuery(query, "status");
    const fromWarehouseId = pickQuery(query, "fromWarehouseId");
    const toWarehouseId = pickQuery(query, "toWarehouseId");

    return clone(
      this.store.getState().transfers.filter((t) => {
        if (t.tenantId !== actor.tenantId) return false;
        if (status && t.status !== status) return false;
        if (fromWarehouseId && t.fromWarehouseId !== fromWarehouseId) return false;
        if (toWarehouseId && t.toWarehouseId !== toWarehouseId) return false;
        return true;
      })
    );
  }

  getTransfer(id: string, actor: RequestActor): Transfer {
    const transfer = this.store.getState().transfers.find((t) => t.id === id && t.tenantId === actor.tenantId);
    if (!transfer) notFound("Transfer not found");
    return clone(transfer);
  }

  listAuditLogs(actor: RequestActor) {
    return clone(
      this.store.getState().auditLogs
        .filter((log) => log.tenantId === actor.tenantId)
        .slice(0, 100)
    );
  }
}
